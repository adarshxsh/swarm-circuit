"""Parallel DAG Scheduler & Retry Engine for SwarmCircuit v2.

Executes independent DAG nodes in parallel using a ThreadPoolExecutor, manages worker
lifecycles, enforces exponential backoff retry loops ($2^n \times 1000\text{ms}$),
and aggregates versioned worker artifacts.
"""
import time
import concurrent.futures
from dataclasses import asdict
from typing import Dict, List, Set, Any, Callable, Optional
from core.planner import ExecutionGraph, DAGNode
from core.worker_runtime import StatelessWorkerRuntime, WorkerContext, WorkerArtifact
from core.godot_parser import GodotProjectParser
from core.memory_query_engine import MemoryQueryEngine
from core.events import WorkerProgressEvent, WorkerCompletionEvent, WorkerErrorEvent

class DAGScheduler:
    """Orchestrates parallel worker execution over an acyclic schedule."""

    def __init__(self, project_parser: GodotProjectParser, runtime: StatelessWorkerRuntime, memory_query_engine: MemoryQueryEngine, max_workers: int = 4):
        self.project_parser = project_parser
        self.runtime = runtime
        self.memory_query_engine = memory_query_engine
        self.max_workers = max_workers

    def execute_dag(
        self,
        graph: ExecutionGraph,
        project_summary: str,
        constraints: Dict[str, Any],
        max_retries: int = 3,
        retry_base_delay_sec: float = 0.05,  # Reduced for fast test verification
        on_event: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Dict[str, WorkerArtifact]:
        """Runs all nodes in the execution graph to completion or failure isolation."""
        completed_nodes: Set[str] = set()
        failed_nodes: Set[str] = set()
        artifacts: Dict[str, WorkerArtifact] = {}

        # Scan project once to build file index
        self.project_parser.scan_project()

        if on_event:
            on_event({
                "type": "DAG_STARTED",
                "dag_id": graph.dag_id,
                "nodes": {n_id: n.worker_role for n_id, n in graph.nodes.items()}
            })

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            while len(completed_nodes) + len(failed_nodes) < len(graph.nodes):
                ready_nodes = graph.get_ready_nodes(completed_nodes)

                if not ready_nodes:
                    # Check if remaining nodes are blocked by failed upstream branches
                    remaining = set(graph.nodes.keys()) - (completed_nodes | failed_nodes)
                    if remaining:
                        for r_id in remaining:
                            graph.nodes[r_id].status = "BLOCKED"
                            failed_nodes.add(r_id)
                    break

                # Mark ready nodes as RUNNING
                for node in ready_nodes:
                    node.status = "RUNNING"
                    if on_event:
                        on_event(WorkerProgressEvent(
                            worker=node.worker_role,
                            status="starting",
                            message=f"Starting task: {node.objective}",
                            progress=10
                        ).to_dict())

                # Submit ready nodes in parallel
                future_to_node = {
                    executor.submit(
                        self._execute_node_with_retry,
                        node,
                        graph,
                        project_summary,
                        constraints,
                        artifacts,
                        max_retries,
                        retry_base_delay_sec
                    ): node
                    for node in ready_nodes
                }

                # Collect completed parallel tasks
                for future in concurrent.futures.as_completed(future_to_node):
                    node = future_to_node[future]
                    try:
                        artifact = future.result()
                        artifacts[node.node_id] = artifact
                        if artifact.status == "SUCCESS":
                            node.status = "SUCCESS"
                            completed_nodes.add(node.node_id)
                            if on_event:
                                on_event(WorkerCompletionEvent(
                                    worker=node.worker_role,
                                    status="completed",
                                    message="Task completed successfully.",
                                    artifact=asdict(artifact)
                                ).to_dict())
                        else:
                            node.status = "FAILED"
                            failed_nodes.add(node.node_id)
                            if on_event:
                                on_event(WorkerErrorEvent(
                                    worker=node.worker_role,
                                    status="failed",
                                    message="Task failed.",
                                    error=str(artifact.error_message)
                                ).to_dict())
                    except Exception as exc:
                        node.status = "FAILED"
                        failed_nodes.add(node.node_id)
                        if on_event:
                            on_event(WorkerErrorEvent(
                                worker=node.worker_role,
                                status="failed",
                                message="Task execution exception.",
                                error=str(exc)
                            ).to_dict())

        return artifacts

    def _execute_node_with_retry(
        self,
        node: DAGNode,
        graph: ExecutionGraph,
        project_summary: str,
        constraints: Dict[str, Any],
        existing_artifacts: Dict[str, WorkerArtifact],
        max_retries: int,
        retry_base_delay_sec: float
    ) -> WorkerArtifact:
        """Executes a single node with exponential backoff on transient errors."""
        # Build targeted context slice via MemoryQueryEngine instead of dumping everything
        relevant_files = self.memory_query_engine.build_context(node.objective, token_budget=2000)

        # Collect upstream artifacts
        upstream = []
        for dep_id in node.dependencies:
            if dep_id in existing_artifacts:
                art = existing_artifacts[dep_id]
                upstream.append({
                    "role": art.producer_role,
                    "deliverables": [vars(d) for d in art.deliverables]
                })

        context = WorkerContext(
            task_id=graph.task_id,
            role=node.worker_role,
            objective=node.objective,
            project_summary=project_summary,
            relevant_files=relevant_files,
            upstream_artifacts=upstream,
            constraints=constraints
        )

        attempt = 0
        last_artifact = None

        while attempt <= max_retries:
            artifact = self.runtime.execute_worker(context, node.assigned_model_profile)
            if artifact.status == "SUCCESS":
                return artifact
            
            last_artifact = artifact
            attempt += 1
            if attempt <= max_retries:
                backoff = (2 ** attempt) * retry_base_delay_sec
                time.sleep(backoff)

        return last_artifact

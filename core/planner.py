"""Deterministic Planner & DAG Generator for SwarmCircuit v2.

Constructs acyclic execution graphs specifying required stateless worker specialists,
dependency orderings, and Antigravity Pro model routing profiles.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional
from core.reddit_scout import TaskProposal


@dataclass
class DAGNode:
    """Represents a single execution node in the worker schedule."""
    node_id: str
    worker_role: str
    objective: str
    dependencies: List[str] = field(default_factory=list)
    assigned_model_profile: str = "Gemini 3.1 Pro Low"
    status: str = "PENDING"  # PENDING, RUNNING, SUCCESS, FAILED


@dataclass
class ExecutionGraph:
    """Represents a validated Directed Acyclic Graph of worker tasks."""
    dag_id: str
    task_id: str
    objective: str
    nodes: Dict[str, DAGNode] = field(default_factory=dict)

    def validate_acyclic(self) -> bool:
        """Checks for cyclic dependencies using depth-first search traversal."""
        visited: Set[str] = set()
        rec_stack: Set[str] = set()

        def dfs(node_id: str) -> bool:
            visited.add(node_id)
            rec_stack.add(node_id)
            node = self.nodes.get(node_id)
            if node:
                for dep in node.dependencies:
                    if dep not in visited:
                        if dfs(dep):
                            return True
                    elif dep in rec_stack:
                        return True
            rec_stack.remove(node_id)
            return False

        for n_id in self.nodes:
            if n_id not in visited:
                if dfs(n_id):
                    return False
        return True

    def get_ready_nodes(self, completed_nodes: Set[str]) -> List[DAGNode]:
        """Returns nodes whose dependencies have all completed successfully."""
        ready = []
        for n_id, node in self.nodes.items():
            if n_id not in completed_nodes and node.status == "PENDING":
                if all(dep in completed_nodes for dep in node.dependencies):
                    ready.append(node)
        return ready


class DeterministicPlanner:
    """Builds execution DAG graphs deterministically without LLM loops."""

    MODEL_MAPPING = {
        "Technical Architect": "Gemini 3.1 Pro High",
        "Game Designer": "Gemini 3.1 Pro High",
        "Gameplay Engineer": "Gemini 3.1 Pro Low",  # Optimized for GDScript coding
        "QA & Balance": "DeepSeek Reasoner Profile",
        "Performance Reviewer": "Gemini 3.1 Pro Low",
        "Documentation Agent": "Gemini 3.1 Flash",
        "Executive Reviewer": "Gemini 3.1 Pro High"
    }

    def generate_dag(self, proposal: TaskProposal) -> ExecutionGraph:
        """Generates a standard game studio workflow DAG from a task proposal."""
        dag_id = f"dag_{proposal.proposal_id}"
        graph = ExecutionGraph(dag_id=dag_id, task_id=proposal.proposal_id, objective=proposal.objective)

        # Node 1: Architecture or Design
        start_role = "Game Designer" if proposal.category == "FEATURE" else "Technical Architect"
        n1 = DAGNode(
            node_id=f"{dag_id}_01",
            worker_role=start_role,
            objective=f"Analyze Godot scene tree and formulate proposal for: {proposal.objective}",
            dependencies=[],
            assigned_model_profile=self.MODEL_MAPPING.get(start_role, "Gemini 3.1 Pro High")
        )
        graph.nodes[n1.node_id] = n1

        # Node 2: Gameplay Engineering (depends on Node 1)
        n2 = DAGNode(
            node_id=f"{dag_id}_02",
            worker_role="Gameplay Engineer",
            objective=f"Implement GDScript logic and scene connections for: {proposal.objective}",
            dependencies=[n1.node_id],
            assigned_model_profile=self.MODEL_MAPPING.get("Gameplay Engineer", "Gemini 3.1 Pro Low")
        )
        graph.nodes[n2.node_id] = n2

        # Node 3 & 4: QA and Performance (execute simultaneously, depend on Node 2)
        n3 = DAGNode(
            node_id=f"{dag_id}_03_qa",
            worker_role="QA & Balance",
            objective="Perform static analysis and balance check on GDScript diffs.",
            dependencies=[n2.node_id],
            assigned_model_profile=self.MODEL_MAPPING.get("QA & Balance", "DeepSeek Reasoner Profile")
        )
        graph.nodes[n3.node_id] = n3

        n4 = DAGNode(
            node_id=f"{dag_id}_03_perf",
            worker_role="Performance Reviewer",
            objective="Audit node allocations and signal disconnect safety.",
            dependencies=[n2.node_id],
            assigned_model_profile=self.MODEL_MAPPING.get("Performance Reviewer", "Gemini 3.1 Pro Low")
        )
        graph.nodes[n4.node_id] = n4

        # Node 5: Documentation (depends on QA and Perf)
        n5 = DAGNode(
            node_id=f"{dag_id}_04_docs",
            worker_role="Documentation Agent",
            objective="Update inline GDScript docs and changelog.",
            dependencies=[n3.node_id, n4.node_id],
            assigned_model_profile=self.MODEL_MAPPING.get("Documentation Agent", "Gemini 3.1 Flash")
        )
        graph.nodes[n5.node_id] = n5

        # Node 6: Executive Reviewer (depends on Docs)
        n6 = DAGNode(
            node_id=f"{dag_id}_05_exec",
            worker_role="Executive Reviewer",
            objective="Synthesize worker outputs and recommend merge decision.",
            dependencies=[n5.node_id],
            assigned_model_profile=self.MODEL_MAPPING.get("Executive Reviewer", "Gemini 3.1 Pro High")
        )
        graph.nodes[n6.node_id] = n6

        if not graph.validate_acyclic():
            raise RuntimeError("Generated DAG contains a cyclic dependency!")

        return graph

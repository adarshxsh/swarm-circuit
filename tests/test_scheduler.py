"""Unit tests for DAGScheduler."""
import os
import shutil
import tempfile
import unittest
from core.godot_parser import GodotProjectParser
from core.worker_runtime import StatelessWorkerRuntime, WorkerContext, WorkerArtifact
from core.planner import DeterministicPlanner
from core.reddit_scout import TaskProposal
from core.scheduler import DAGScheduler


class FlakyWorkerRuntime(StatelessWorkerRuntime):
    """Simulates transient worker failures to test exponential backoff retry logic."""

    def __init__(self):
        super().__init__()
        self.attempts = {}

    def execute_worker(self, context: WorkerContext, model_profile: str) -> WorkerArtifact:
        role = context.role
        count = self.attempts.get(role, 0) + 1
        self.attempts[role] = count

        # Fail Gameplay Engineer on first attempt, succeed on second attempt
        if role == "Gameplay Engineer" and count < 2:
            return WorkerArtifact(
                artifact_id="err_1",
                task_reference=context.task_id,
                producer_role=role,
                status="ERROR",
                error_message="Simulated Cerebras timeout."
            )
        return super().execute_worker(context, model_profile)


class TestDAGScheduler(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        gd_path = os.path.join(self.test_dir, "enemy.gd")
        with open(gd_path, "w", encoding="utf-8") as f:
            f.write("extends Node2D\nclass_name Enemy\nfunc take_damage(): pass\n")

        self.parser = GodotProjectParser(self.test_dir)
        self.planner = DeterministicPlanner()
        self.proposal = TaskProposal(
            proposal_id="prop_test",
            objective="Balance enemy health progression.",
            category="BALANCE",
            recommended_workers=["Technical Architect", "Gameplay Engineer", "QA & Balance"],
            source_trend="BALANCE: enemy hp",
            priority="MEDIUM"
        )

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_full_dag_execution_with_retry(self):
        runtime = FlakyWorkerRuntime()
        scheduler = DAGScheduler(self.parser, runtime, max_workers=4)
        dag = self.planner.generate_dag(self.proposal)

        artifacts = scheduler.execute_dag(
            graph=dag,
            project_summary="Godot action game.",
            constraints={"targetFPS": 60},
            max_retries=2,
            retry_base_delay_sec=0.01
        )

        # Verify all 6 nodes completed successfully
        self.assertEqual(len(artifacts), 6)
        for art in artifacts.values():
            self.assertEqual(art.status, "SUCCESS")

        # Verify retry actually occurred for Gameplay Engineer
        self.assertEqual(runtime.attempts["Gameplay Engineer"], 2)


if __name__ == "__main__":
    unittest.main()

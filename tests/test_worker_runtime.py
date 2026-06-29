"""Unit tests for StatelessWorkerRuntime."""
import json
import unittest
from core.worker_runtime import StatelessWorkerRuntime, WorkerContext


class TestStatelessWorkerRuntime(unittest.TestCase):

    def setUp(self):
        self.runtime = StatelessWorkerRuntime()
        self.mock_context = WorkerContext(
            task_id="t101",
            role="Gameplay Engineer",
            objective="Implement double jump physics.",
            project_summary="2D platformer in Godot.",
            relevant_files=[{"path": "player.gd", "content": "extends CharacterBody2D"}],
            constraints={"targetFPS": 60}
        )

    def test_execute_worker(self):
        artifact = self.runtime.execute_worker(self.mock_context, "Gemini 3.1 Pro Low")
        
        self.assertEqual(artifact.status, "SUCCESS")
        self.assertEqual(artifact.producer_role, "Gameplay Engineer")
        self.assertEqual(artifact.model_profile_used, "Gemini 3.1 Pro Low")
        self.assertEqual(len(artifact.deliverables), 1)
        self.assertEqual(artifact.deliverables[0].deliverable_type, "CODE_PATCH")

    def test_json_serialization(self):
        artifact = self.runtime.execute_worker(self.mock_context, "Gemini 3.1 Pro Low")
        json_str = artifact.to_json()
        data = json.loads(json_str)
        
        self.assertIn("artifact_id", data)
        self.assertEqual(data["status"], "SUCCESS")


if __name__ == "__main__":
    unittest.main()

"""Unit tests for DeterministicPlanner."""
import unittest
from core.planner import DeterministicPlanner, ExecutionGraph, DAGNode
from core.reddit_scout import TaskProposal


class TestDeterministicPlanner(unittest.TestCase):

    def setUp(self):
        self.planner = DeterministicPlanner()
        self.mock_proposal = TaskProposal(
            proposal_id="prop_001",
            objective="Fix character falling through platform on frame drop.",
            category="BUG",
            recommended_workers=["Technical Architect", "Gameplay Engineer", "QA & Balance"],
            source_trend="BUG: fall through floor",
            priority="HIGH"
        )

    def test_generate_dag(self):
        dag = self.planner.generate_dag(self.mock_proposal)
        self.assertTrue(dag.validate_acyclic())
        self.assertEqual(len(dag.nodes), 6)
        
        # Verify initial ready nodes
        ready = dag.get_ready_nodes(completed_nodes=set())
        self.assertEqual(len(ready), 1)
        self.assertEqual(ready[0].worker_role, "Technical Architect")
        self.assertEqual(ready[0].assigned_model_profile, "Gemini 3.1 Pro High")

    def test_parallel_nodes_ready(self):
        dag = self.planner.generate_dag(self.mock_proposal)
        
        # Simulate completing Architect and Engineer
        completed = {f"dag_{self.mock_proposal.proposal_id}_01", f"dag_{self.mock_proposal.proposal_id}_02"}
        ready = dag.get_ready_nodes(completed)
        
        # Both QA and Perf should be ready simultaneously
        self.assertEqual(len(ready), 2)
        roles = {n.worker_role for n in ready}
        self.assertIn("QA & Balance", roles)
        self.assertIn("Performance Reviewer", roles)

    def test_cyclic_detection(self):
        dag = ExecutionGraph(dag_id="test_cyc", task_id="t1", objective="test")
        n1 = DAGNode("n1", "Role1", "obj", dependencies=["n2"])
        n2 = DAGNode("n2", "Role2", "obj", dependencies=["n1"])
        dag.nodes = {"n1": n1, "n2": n2}
        
        self.assertFalse(dag.validate_acyclic())


if __name__ == "__main__":
    unittest.main()

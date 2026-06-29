"""Unit tests for RedditScout."""
import unittest
from core.reddit_scout import RedditScout, RedditPost


class TestRedditScout(unittest.TestCase):

    def setUp(self):
        self.scout = RedditScout()
        self.mock_posts = [
            RedditPost(
                post_id="p1",
                title="Massive lag stutter when spawning 50 enemies!",
                selftext="The fps drops to 15 whenever the wave starts.",
                score=120,
                num_comments=45,
                url="https://reddit.com/r/test/p1"
            ),
            RedditPost(
                post_id="p2",
                title="Fishing rod mechanic feels too weak",
                selftext="It takes way too long to catch anything, please buff speed.",
                score=35,
                num_comments=12,
                url="https://reddit.com/r/test/p2"
            ),
            RedditPost(
                post_id="p3",
                title="Game crash when pressing inventory button",
                selftext="Fatal crash bug happens on level 3.",
                score=250,
                num_comments=80,
                url="https://reddit.com/r/test/p3"
            )
        ]

    def test_analyze_trends(self):
        trends = self.scout.analyze_trends(self.mock_posts)
        self.assertGreaterEqual(len(trends), 2)
        
        categories = [t.category for t in trends]
        self.assertIn("PERFORMANCE", categories)
        self.assertIn("BUG", categories)
        
        # Verify priority escalation on high upvote posts
        crash_trend = next(t for t in trends if t.category == "BUG")
        self.assertEqual(crash_trend.priority_level, "HIGH")

    def test_generate_task_proposals(self):
        trends = self.scout.analyze_trends(self.mock_posts)
        proposals = self.scout.generate_task_proposals(trends)
        
        self.assertEqual(len(proposals), len(trends))
        perf_prop = next(p for p in proposals if p.category == "PERFORMANCE")
        self.assertIn("Performance Reviewer", perf_prop.recommended_workers)
        self.assertIn("Investigate and resolve", perf_prop.objective)


if __name__ == "__main__":
    unittest.main()

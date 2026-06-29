"""Reddit Scout & Community Trend Extractor for SwarmCircuit v2.

Scans game feedback threads, extracts recurring player sentiment/bugs, and converts
raw discussions into actionable engineering task proposals for the Deterministic Planner.
"""
import json
import urllib.request
import urllib.error
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class RedditPost:
    """Represents a scraped Reddit thread."""
    post_id: str
    title: str
    selftext: str
    score: int
    num_comments: int
    url: str


@dataclass
class TrendTopic:
    """Represents a clustered player trend or issue."""
    topic_name: str
    category: str  # "BUG", "BALANCE", "PERFORMANCE", "FEATURE"
    sentiment_score: float  # -1.0 (very negative/complaint) to 1.0 (positive)
    frequency: int
    sample_quotes: List[str] = field(default_factory=list)
    priority_level: str = "MEDIUM"  # "HIGH", "MEDIUM", "LOW"


@dataclass
class TaskProposal:
    """An actionable task proposed to the Deterministic Planner."""
    proposal_id: str
    objective: str
    category: str
    recommended_workers: List[str]
    source_trend: str
    priority: str


class RedditScout:
    """Scouts subreddits and extracts community trends into actionable tasks."""

    def __init__(self, user_agent: str = "SwarmCircuitBot/2.0 (by Antigravity Studio)"):
        self.user_agent = user_agent

    def fetch_threads(self, subreddit: str, limit: int = 10) -> List[RedditPost]:
        """Fetches recent hot posts from a subreddit via public JSON API."""
        url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
        
        posts: List[RedditPost] = []
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode("utf-8"))
                for child in data.get("data", {}).get("children", []):
                    p = child.get("data", {})
                    posts.append(RedditPost(
                        post_id=p.get("id", ""),
                        title=p.get("title", ""),
                        selftext=p.get("selftext", ""),
                        score=p.get("score", 0),
                        num_comments=p.get("num_comments", 0),
                        url=p.get("url", "")
                    ))
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
            # Fallback for offline or rate-limited test environments
            pass
            
        return posts

    def analyze_trends(self, posts: List[RedditPost]) -> List[TrendTopic]:
        """Analyzes posts using heuristics/keyword clustering to extract actionable trends."""
        trends_map: Dict[str, TrendTopic] = {}

        keywords = {
            "BUG": ["bug", "glitch", "crash", "stuck", "freeze", "error", "broken"],
            "BALANCE": ["nerf", "buff", "op", "overpowered", "weak", "balance", "too strong"],
            "PERFORMANCE": ["fps", "lag", "stutter", "drop", "memory", "leak", "optimization"],
            "FEATURE": ["add", "wish", "please implement", "would love", "suggestion", "qol"]
        }

        for post in posts:
            text_lower = f"{post.title} {post.selftext}".lower()
            
            for cat, words in keywords.items():
                for word in words:
                    if word in text_lower:
                        topic_key = f"{cat}: {word}"
                        if topic_key not in trends_map:
                            # Estimate sentiment based on category & upvote ratio
                            sentiment = -0.6 if cat in ["BUG", "PERFORMANCE"] else 0.2
                            trends_map[topic_key] = TrendTopic(
                                topic_name=f"Player reports regarding '{word}'",
                                category=cat,
                                sentiment_score=sentiment,
                                frequency=1,
                                sample_quotes=[post.title[:100]],
                                priority_level="HIGH" if post.score > 50 and cat in ["BUG", "PERFORMANCE"] else "MEDIUM"
                            )
                        else:
                            trends_map[topic_key].frequency += 1
                            if len(trends_map[topic_key].sample_quotes) < 3:
                                trends_map[topic_key].sample_quotes.append(post.title[:100])
                            if post.score > 100:
                                trends_map[topic_key].priority_level = "HIGH"

        return list(trends_map.values())

    def generate_task_proposals(self, trends: List[TrendTopic]) -> List[TaskProposal]:
        """Converts extracted trend topics into concrete Planner task proposals."""
        proposals: List[TaskProposal] = []

        worker_mapping = {
            "BUG": ["Technical Architect", "Gameplay Engineer", "QA & Balance"],
            "BALANCE": ["Game Designer", "Gameplay Engineer", "QA & Balance"],
            "PERFORMANCE": ["Technical Architect", "Performance Reviewer", "Gameplay Engineer"],
            "FEATURE": ["Game Designer", "Technical Architect", "Gameplay Engineer", "Documentation Agent"]
        }

        for idx, trend in enumerate(trends):
            prop_id = f"prop_reddit_{idx+1:03d}"
            workers = worker_mapping.get(trend.category, ["Gameplay Engineer"])
            
            objective = f"Investigate and resolve community {trend.category.lower()}: {trend.topic_name}."
            if trend.sample_quotes:
                objective += f" Example report: \"{trend.sample_quotes[0]}\""

            proposals.append(TaskProposal(
                proposal_id=prop_id,
                objective=objective,
                category=trend.category,
                recommended_workers=workers,
                source_trend=trend.topic_name,
                priority=trend.priority_level
            ))

        return proposals

import json
import os
from collections import defaultdict
from typing import Dict, Any, List

class MemoryQueryEngine:
    """Answers 'What parts of the project are relevant to this task?' without vector embeddings."""

    def __init__(self, memory_dir: str):
        self.memory_dir = memory_dir
        self.graph = self._safe_load("architecture_graph.json")
        self.bible = self._safe_load("project_bible.json")
        self.symbol_index = self._safe_load("symbol_index.json")

    def _load(self, file: str) -> Dict[str, Any]:
        path = os.path.join(self.memory_dir, file)
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _safe_load(self, file: str) -> Dict[str, Any]:
        try:
            return self._load(file)
        except Exception:
            return {}

    # ----------------------------
    # ENTRY POINT
    # ----------------------------
    def build_context(self, task: str, token_budget: int = 2000) -> List[Dict[str, Any]]:
        seeds = self._extract_seeds(task)
        graph_nodes = self._expand_graph(seeds)
        scored = self._score_relevance(task, graph_nodes)
        return self._pack_context(scored, token_budget)

    # ----------------------------
    # 1. SEED EXTRACTION
    # ----------------------------
    def _extract_seeds(self, task: str) -> List[str]:
        seeds = set()
        words = task.lower().split()

        # file/system matching via graph keys
        scripts = self.graph.get("scripts", {})
        scenes = self.graph.get("scenes", {})
        
        for node in list(scripts.keys()) + list(scenes.keys()):
            # e.g. player.gd in task
            if node.lower() in task.lower():
                seeds.add(node)
            
            # also add the base name without extension
            base = node.split(".")[0].lower()
            if base in words:
                seeds.add(node)

        # symbol matching
        for symbol in self.symbol_index.get("symbols", []):
            if symbol["name"].lower() in task.lower():
                seeds.add(symbol["file"])

        # keyword fallback (if nothing matched directly)
        for word in words:
            if len(word) > 4:
                # Basic fallback: check if word matches any function name or variable
                for script, data in scripts.items():
                    funcs = data.get("functions", {})
                    if any(word in f.lower() for f in funcs.keys()):
                        seeds.add(script)

        return list(seeds)

    # ----------------------------
    # 2. GRAPH EXPANSION
    # ----------------------------
    def _expand_graph(self, seeds: List[str], depth: int = 2) -> List[str]:
        visited = set()
        frontier = set(seeds)
        result = set(seeds)

        for _ in range(depth):
            next_frontier = set()

            for node in frontier:
                if node in visited:
                    continue

                visited.add(node)

                # Expand via semantic edges
                for edge in self.graph.get("semantic_edges", []):
                    if edge["from"] == node:
                        result.add(edge["to"])
                        next_frontier.add(edge["to"])
                    elif edge["to"] == node:
                        result.add(edge["from"])
                        next_frontier.add(edge["from"])

            frontier = next_frontier

        return list(result)

    # ----------------------------
    # 3. RELEVANCE SCORING
    # ----------------------------
    def _score_relevance(self, task: str, nodes: List[str]) -> List[tuple]:
        scored = []

        for node in nodes:
            score = 0.0

            # Direct match
            if node.lower() in task.lower() or node.split(".")[0].lower() in task.lower():
                score += 1.0 # Tier 1: Direct file match

            # Boost if in bible
            if self._in_bible(node):
                score += 0.3

            # Boost if highly connected (graph degree)
            score += self._graph_degree(node) * 0.1

            scored.append((node, score))

        # Sort descending by score
        return sorted(scored, key=lambda x: x[1], reverse=True)

    # ----------------------------
    # 4. TOKEN PACKING
    # ----------------------------
    def _pack_context(self, scored_nodes: List[tuple], budget: int) -> List[Dict[str, Any]]:
        context = []
        used = 0

        for node, score in scored_nodes:
            node_data = self._get_node_context(node)
            
            # Very rough token estimation (word count * 1.3)
            # Serialize to JSON string to count words
            text = json.dumps(node_data)
            size = int(len(text.split()) * 1.3)

            if used + size > budget:
                # If even the first item is too big, we just include it anyway to not send an empty context.
                if len(context) > 0:
                    break

            context.append({
                "node": node,
                "score": score,
                "data": node_data
            })

            used += size

        return context

    # ----------------------------
    # HELPERS
    # ----------------------------
    def _in_bible(self, node: str) -> bool:
        # Check if the node is mentioned in the system notes
        notes = self.bible.get("system_notes", [])
        return any(node.lower() in note.lower() for note in notes)

    def _graph_degree(self, node: str) -> int:
        count = 0
        for e in self.graph.get("semantic_edges", []):
            if e.get("from") == node or e.get("to") == node:
                count += 1
        return count

    def _get_node_context(self, node: str) -> Dict[str, Any]:
        """Resolves structural summaries instead of strings."""
        # 1. Check if it's a script
        scripts = self.graph.get("scripts", {})
        if node in scripts:
            return {
                "type": "SCRIPT",
                "path": node,
                "extends": scripts[node].get("extends"),
                "class_name": scripts[node].get("class_name"),
                "signals": scripts[node].get("signals", []),
                "exports": scripts[node].get("exports", []),
                "functions": list(scripts[node].get("functions", {}).keys())
            }
            
        # 2. Check if it's a scene
        scenes = self.graph.get("scenes", {})
        if node in scenes:
            return {
                "type": "SCENE",
                "path": node,
                "nodes": [n.get("name") for n in scenes[node]]
            }
            
        # 3. Fallback (e.g., semantic node without AST presence yet like 'physics_manager.gd')
        return {
            "type": "SYSTEM_OR_MISSING",
            "identifier": node,
            "status": "No AST definition found"
        }

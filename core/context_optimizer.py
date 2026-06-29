import math
from collections import defaultdict

class ContextOptimizer:
    """
    Production-grade token budget optimizer for SwarmCircuit context injection.
    Converts raw MemoryQueryEngine output into minimal, high-signal LLM context.
    """

    def __init__(self):
        self.token_estimator = lambda text: max(1, len(str(text)) // 4)

    # -----------------------------
    # MAIN ENTRY POINT
    # -----------------------------
    def optimize(self, context_items, token_budget=2000):
        """
        context_items: List[dict]
            [
                {
                    "node": str,
                    "score": float,
                    "content": dict or str,
                    "metadata": optional dict
                }
            ]
        """

        # Step 1: enrich with token cost + value density
        enriched = self._enrich(context_items)

        # Step 2: remove redundant / near-duplicate entries
        deduped = self._deduplicate(enriched)

        # Step 3: rank by value density
        ranked = sorted(
            deduped,
            key=lambda x: x["value_density"],
            reverse=True
        )

        # Step 4: greedy pack into budget
        packed = self._pack(ranked, token_budget)

        # Step 5: compress final representation
        return self._compress(packed, token_budget)

    # -----------------------------
    # STEP 1: ENRICH
    # -----------------------------
    def _enrich(self, items):
        enriched = []

        for item in items:
            content_str = str(item.get("content", ""))

            tokens = self.token_estimator(content_str)
            score = item.get("score", 0.0)

            value_density = score / max(tokens, 1)

            enriched.append({
                **item,
                "tokens": tokens,
                "value_density": value_density
            })

        return enriched

    # -----------------------------
    # STEP 2: DEDUPLICATION
    # -----------------------------
    def _deduplicate(self, items):
        seen = {}
        result = []

        for item in items:
            key = item["node"]

            # merge if same node
            if key in seen:
                existing = seen[key]

                # merge scores conservatively
                existing["score"] = max(existing["score"], item["score"])

                # merge token estimate (avoid double counting)
                existing["tokens"] = max(existing["tokens"], item["tokens"])

                continue

            seen[key] = item
            result.append(item)

        return result

    # -----------------------------
    # STEP 3: PACKING (KNAPSACK-LIKE)
    # -----------------------------
    def _pack(self, items, budget):
        packed = []
        used = 0

        for item in items:
            if used + item["tokens"] > budget:
                continue

            packed.append(item)
            used += item["tokens"]

        return packed

    # -----------------------------
    # STEP 4: COMPRESSION LAYER
    # -----------------------------
    def _compress(self, items, budget):
        compressed = []

        for item in items:
            node = item["node"]
            content = item["content"]

            compressed.append({
                "node": node,
                "priority": round(item["score"], 3),
                "summary": self._summarize(content),
                "key_symbols": self._extract_symbols(content),
                "token_cost": item["tokens"]
            })

        return {
            "token_budget": budget,
            "used_tokens": sum(i["tokens"] for i in items),
            "context_blocks": compressed
        }

    # -----------------------------
    # HELPERS
    # -----------------------------
    def _summarize(self, content):
        """
        Lightweight structural summarizer (no LLM).
        Replace full file content with structural hints.
        """

        text = str(content)

        # naive structural extraction (MVP-safe)
        lines = text.split("\\n")

        summary = []
        for line in lines:
            line = line.strip()

            if line.startswith("func ") or "func_" in line:
                summary.append(line)
            elif "signal" in line:
                summary.append(line)
            elif "export" in line:
                summary.append(line)

        return summary[:10] if summary else ["structural_node"]

    def _extract_symbols(self, content):
        """
        Extract lightweight symbol hints (no AST parser dependency).
        """
        text = str(content)

        symbols = []

        for token in text.replace("(", " ").replace(")", " ").split():
            if "." in token or token.endswith("_"):
                symbols.append(token)

        return list(set(symbols))[:10]

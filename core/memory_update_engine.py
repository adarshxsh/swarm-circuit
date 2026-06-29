import re
from typing import Dict, Any, List
from dataclasses import dataclass
from core.memory_manager import MemoryManager

@dataclass
class MemoryOp:
    type: str  # ADD_EDGE, UPDATE_BIBLE
    target: str
    payload: Any
    confidence: float

class MemoryUpdateEngine:
    """Processes memoryUpdates from worker artifacts and safely applies them to the persistence layer."""

    def __init__(self, memory_manager: MemoryManager):
        self.memory = memory_manager

    def process_artifact(self, artifact: Dict[str, Any]):
        """Entrypoint for processing a successful worker artifact."""
        if artifact.get("status") != "SUCCESS":
            return
            
        memory_updates = artifact.get("memoryUpdates")
        if not memory_updates:
            return

        exec_meta = artifact.get("executionMeta", {})
        confidence = exec_meta.get("confidence", 0.8)  # default if missing

        # Advanced Upgrade: Confidence Gating
        if confidence < 0.6:
            print(f"[MemoryUpdateEngine] Skipping update due to low confidence ({confidence}).")
            return

        ops = self._normalize(memory_updates, confidence)
        self._apply_patch(ops, artifact.get("producerRole", "Unknown Worker"))

    def _normalize(self, memory_updates: Dict[str, Any], confidence: float) -> List[MemoryOp]:
        """Converts raw string instructions into structured MemoryOps."""
        ops = []
        
        # Parse Architecture Graph updates
        arch_updates = memory_updates.get("architecture_graph", [])
        for update in arch_updates:
            # Simple NLP heuristic to extract "A depends on B"
            match = re.search(r'([a-zA-Z0-9_\.]+) (depends on|uses|modifies) ([a-zA-Z0-9_\.]+)', update.lower())
            if match:
                source, relation, target = match.groups()
                ops.append(MemoryOp(
                    type="ADD_EDGE",
                    target="architecture_graph",
                    payload={
                        "from": source,
                        "to": target,
                        "relation": f"{relation.upper()}_SYSTEM",
                        "raw_text": update
                    },
                    confidence=confidence
                ))

        # Parse Project Bible updates
        bible_updates = memory_updates.get("project_bible", [])
        for update in bible_updates:
            ops.append(MemoryOp(
                type="UPDATE_BIBLE",
                target="project_bible",
                payload={"text": update},
                confidence=confidence
            ))
            
        return ops

    def _calculate_similarity(self, new_text: str, existing_text: str) -> float:
        """3-layer heuristic score for deduplication without vector embeddings."""
        new_tokens = set(re.findall(r'\w+', new_text.lower()))
        exist_tokens = set(re.findall(r'\w+', existing_text.lower()))
        
        if not new_tokens or not exist_tokens:
            return 0.0

        # 1. Keyword overlap
        intersection = new_tokens.intersection(exist_tokens)
        keyword_overlap = len(intersection) / max(len(new_tokens), len(exist_tokens))
        
        # 2. Entity overlap (files, specific systems ending in .gd or system keywords)
        entities_new = {t for t in new_tokens if '.gd' in t or 'system' in t or 'manager' in t}
        entities_exist = {t for t in exist_tokens if '.gd' in t or 'system' in t or 'manager' in t}
        if entities_new or entities_exist:
            ent_inter = entities_new.intersection(entities_exist)
            entity_overlap = len(ent_inter) / max(len(entities_new), len(entities_exist)) if max(len(entities_new), len(entities_exist)) > 0 else 0
        else:
            entity_overlap = keyword_overlap # Fallback
            
        # 3. Semantic verbs match
        verbs = {"uses", "depends", "modifies", "implements", "adds"}
        verbs_new = new_tokens.intersection(verbs)
        verbs_exist = exist_tokens.intersection(verbs)
        verb_overlap = 1.0 if verbs_new == verbs_exist and verbs_new else 0.0
        
        score = (0.5 * keyword_overlap) + (0.3 * entity_overlap) + (0.2 * verb_overlap)
        return score

    def _apply_patch(self, ops: List[MemoryOp], source_worker: str):
        """Applies structured MemoryOps to the JSON schemas and persists them."""
        bible_dirty = False
        graph_dirty = False
        
        bible = self.memory.read_json("project_bible.json") or {}
        graph = self.memory.read_json("architecture_graph.json") or {}
        
        # Ensure semantic edges array exists
        if "semantic_edges" not in graph:
            graph["semantic_edges"] = []
            
        # Ensure systems notes exists in bible
        if "system_notes" not in bible:
            bible["system_notes"] = []

        for op in ops:
            if op.type == "ADD_EDGE":
                edge = op.payload
                # Check for exact duplicate edge
                is_dup = any(e.get("from") == edge["from"] and e.get("to") == edge["to"] for e in graph["semantic_edges"])
                if not is_dup:
                    graph["semantic_edges"].append({
                        "from": edge["from"],
                        "to": edge["to"],
                        "relation": edge["relation"],
                        "confidence": op.confidence,
                        "source": f"{source_worker} artifact"
                    })
                    graph_dirty = True
                    
            elif op.type == "UPDATE_BIBLE":
                new_text = op.payload["text"]
                should_add = True
                
                # Deduplication logic
                for idx, existing_note in enumerate(bible["system_notes"]):
                    score = self._calculate_similarity(new_text, existing_note)
                    if score >= 0.75:
                        # Auto-merge / ignore duplicate
                        should_add = False
                        break
                    elif score >= 0.60:
                        # Flag for review (For MVP, we just append a [REVIEW] tag)
                        new_text = f"[REVIEW REQUIRED - SIMILARITY {score:.2f}] {new_text}"
                        break
                
                if should_add:
                    bible["system_notes"].append(new_text)
                    bible_dirty = True

        # Atomic Persistence
        if bible_dirty:
            self.memory.write_json("project_bible.json", bible)
        if graph_dirty:
            self.memory.write_json("architecture_graph.json", graph)
            
        if bible_dirty or graph_dirty:
            # Emit Event (Simulated via stdout for now)
            print(f"[MemoryUpdateEngine] MEMORY_UPDATED: Bible={bible_dirty}, Graph={graph_dirty}")

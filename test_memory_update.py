import json
from core.memory_manager import MemoryManager
from core.memory_update_engine import MemoryUpdateEngine

# 1. Initialize Memory Manager and Engine
memory_manager = MemoryManager("./mock_godot_game")
# Ensure the base graph exists
memory_manager.update_architecture_graph()

engine = MemoryUpdateEngine(memory_manager)

# 2. Mock artifact from QA/Gameplay Engineer
mock_artifact = {
  "artifactId": "art_gpe_001",
  "taskReference": "Fix player movement jitter when landing on slopes",
  "producerRole": "Gameplay Engineer",
  "status": "SUCCESS",
  "executionMeta": {
    "model": "gemma-4-31b",
    "durationMs": 1420,
    "confidence": 0.91
  },
  "deliverables": [],
  "memoryUpdates": {
    "architecture_graph": [
      "player.gd depends on physics_manager.gd (snap dependency)"
    ],
    "project_bible": [
      "Movement system uses floor snapping to resolve slope jitter"
    ]
  }
}

print("Running Memory Update Engine on Mock Artifact...")
engine.process_artifact(mock_artifact)

print("\n--- project_bible.json (system_notes) ---")
bible = memory_manager.read_json("project_bible.json")
print(json.dumps(bible.get("system_notes", []), indent=2))

print("\n--- architecture_graph.json (semantic_edges) ---")
graph = memory_manager.read_json("architecture_graph.json")
print(json.dumps(graph.get("semantic_edges", []), indent=2))

# Let's run it again to test deduplication!
print("\nRunning duplicate artifact through engine to test deduplication...")
duplicate_artifact = {
  "artifactId": "art_gpe_002",
  "taskReference": "Ensure movement snap system works",
  "producerRole": "Gameplay Engineer",
  "status": "SUCCESS",
  "executionMeta": {
    "confidence": 0.88
  },
  "memoryUpdates": {
    "architecture_graph": [
      "player.gd depends on physics_manager.gd" # Duplicate edge
    ],
    "project_bible": [
      "Player movement uses floor snap to fix jitter" # High similarity to existing note
    ]
  }
}
engine.process_artifact(duplicate_artifact)

print("\n--- After duplicate run project_bible.json ---")
bible = memory_manager.read_json("project_bible.json")
print(json.dumps(bible.get("system_notes", []), indent=2))

print("\n--- After duplicate run architecture_graph.json ---")
graph = memory_manager.read_json("architecture_graph.json")
print(json.dumps(graph.get("semantic_edges", []), indent=2))

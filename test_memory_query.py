import json
from core.memory_query_engine import MemoryQueryEngine

# 1. Initialize Query Engine
engine = MemoryQueryEngine("./mock_godot_game/.swarm/memory")

# 2. Test a task that requires semantic graph traversal
task_objective = "Fix player movement jitter when landing on slopes"
print(f"Task: {task_objective}\n")

# 3. Build Context (Budget: 2000 tokens)
context_pack = engine.build_context(task_objective, token_budget=2000)

print("--- Generated Context Pack ---")
print(f"Total files/nodes included: {len(context_pack)}")
for item in context_pack:
    node = item['node']
    score = item['score']
    data = item['data']
    print(f"\n[Score: {score:.1f}] Node: {node}")
    print(json.dumps(data, indent=2))

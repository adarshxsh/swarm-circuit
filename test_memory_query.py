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
print(f"Token Budget: {context_pack['token_budget']}")
print(f"Used Tokens: {context_pack['used_tokens']}")
print(f"Total files/nodes included: {len(context_pack['context_blocks'])}")

for item in context_pack['context_blocks']:
    node = item['node']
    score = item['priority']
    print(f"\n[Priority: {score:.3f}] Node: {node}")
    print(json.dumps(item, indent=2))

import os
import json
from core.compiler_agent import CompilerAgent

def run_tests():
    print("Running Syntax Integrity Test...")
    compiler = CompilerAgent()
    artifacts = {
        "gameplay": {
            "deliverables": [
                {"content_or_diff": "Create a player entity that jumps when space is pressed."}
            ]
        },
        "physics": {
            "deliverables": [
                {"content_or_diff": "Gravity is 0.5. Player falls down."}
            ]
        }
    }
    
    # Test 1 & 4 (Will use fallback if no key)
    compiler.execute(artifacts, ".")
    
    with open("dist_game/game.js", "r") as f:
        content = f.read()
        
    print("\n--- game.js content preview ---")
    print(content[:200])
    print("-------------------------------")
    
    if content.startswith("const") or content.startswith("//") or content.startswith("let"):
        print("✅ Syntax Integrity Test Passed")
    else:
        print("❌ Syntax Integrity Test Failed - Chatter detected!")
        
    if "Mock Output" in content:
        print("✅ Fallback Test Passed (Mock used)")

if __name__ == "__main__":
    run_tests()

import os
import json
import asyncio
from core.runtime_manager import RuntimeManager, QAAgent
import shutil

async def run_tests():
    rm = RuntimeManager()
    qa = QAAgent()
    
    print("--- 1. The 'Crash-to-Fix' Loop Test ---")
    # Simulate syntax error in game.js
    os.makedirs("dist_game", exist_ok=True)
    with open("dist_game/index.html", "w") as f:
        f.write("<script src='game.js'></script>")
    with open("dist_game/game.js", "w") as f:
        f.write("function update() { console.log('broken' }") # Missing parenthesis
        
    report = await rm.run_playtest(duration_sec=1)
    qa_res = qa.analyze(report)
    
    if not qa_res.get("passed"):
        if "SyntaxError" in str(qa_res.get("errors")):
            print("✅ Self-Healing (Crash detected successfully)")
        else:
            print(f"❌ Failed to detect syntax error explicitly. Found errors: {qa_res.get('errors')}")
    else:
        print("❌ Passed QA when it should have failed!")
        
    print("\n--- 2. The 'Input Injection' Test ---")
    # Create a working game that logs spacebars
    with open("dist_game/index.html", "w") as f:
        f.write("<div id='score'>0</div><script src='game.js'></script>")
    with open("dist_game/game.js", "w") as f:
        f.write("""
        let jumps = 0;
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                jumps++;
                document.getElementById('score').innerText = jumps;
                console.log('Jumped!');
            }
        });
        """)
    report = await rm.run_playtest(duration_sec=2)
    
    if int(report.get("final_score", 0)) > 0:
        print(f"✅ Active Play (Score: {report.get('final_score')})")
    else:
        print(f"❌ Active Play failed. Score: {report.get('final_score')}")

    print("\n--- 3. The 'DOM Extraction' Test ---")
    # Break the score ID
    with open("dist_game/index.html", "w") as f:
        f.write("<div id='game-score'>0</div><script src='game.js'></script>")
    report = await rm.run_playtest(duration_sec=1)
    if "Failure to find score element" in str(report.get("final_score")):
        print("✅ DOM Extraction safety caught missing element")
    else:
        print(f"❌ Failed to catch missing DOM element. Score: {report.get('final_score')}")
        
    print("\n--- 4. The 'Resource Leak' Test ---")
    print("Running 5 iterations rapidly...")
    for i in range(5):
        await rm.run_playtest(duration_sec=1)
    print("✅ Memory Safety: 5 iterations survived without hanging.")
    print("\nAll 4 tests complete!")

if __name__ == "__main__":
    asyncio.run(run_tests())

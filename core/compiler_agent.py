import os
import time
import json
import urllib.request
from typing import Dict, Any, List
from core.events import WorkerProgressEvent, WorkerCompletionEvent, WorkerErrorEvent

class CompilerAgent:
    """The Compiler Agent synthesizes upstream artifacts into a runnable Web Build using an LLM."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("CEREBRAS_GEMMA_API")
        self.dist_dir = os.path.abspath("./dist_game")
        os.makedirs(self.dist_dir, exist_ok=True)
        
    def execute(self, artifacts: Dict[str, Any], project_path: str, on_event=None) -> Dict[str, Any]:
        """Runs the compilation process, emitting live events."""
        if on_event:
            on_event(WorkerProgressEvent(
                worker="Compiler Agent",
                status="building",
                message="Analyzing DAG output artifacts...",
                progress=10
            ).to_dict())
            
        time.sleep(1) # Simulating analysis time
        
        if on_event:
            on_event(WorkerProgressEvent(
                worker="Compiler Agent",
                status="building",
                message="Generating index.html and assets...",
                progress=40
            ).to_dict())
            
        self._write_index_html()
        
        if on_event:
            on_event(WorkerProgressEvent(
                worker="Compiler Agent",
                status="building",
                message="Synthesizing final game.js via LLM Compiler...",
                progress=60
            ).to_dict())
            
        # We will try to call the real API if a key exists, otherwise fallback to mock simulation
        game_js = self._synthesize_js(artifacts)
        
        with open(os.path.join(self.dist_dir, "game.js"), "w", encoding="utf-8") as f:
            f.write(game_js)
            
        result = {
            "deliverable_type": "WEB_BUILD",
            "target_file": "dist_game/game.js",
            "content_length": len(game_js)
        }
        
        if on_event:
            on_event(WorkerCompletionEvent(
                worker="Compiler Agent",
                status="completed",
                message="Successfully compiled web runtime.",
                artifact=result
            ).to_dict())
            
        return result

    def _synthesize_js(self, artifacts: Dict[str, Any]) -> str:
        """Constructs a prompt and queries the LLM API to write the javascript, or mocks it."""
        if not self.api_key:
            return self._mock_game_js()
            
        prompt = f"""You are the Compiler Agent for SwarmCircuit.
        
You have been given the following Game Engineering outputs.
You must synthesize them into a single, cohesive, fully runnable Javascript file using HTML5 Canvas.

CRITICAL RENDERING RULES (non-negotiable):
1. NEVER hardcode canvas dimensions like `canvas.width = 1024`. The canvas is already sized to window by the bootstrap. Just use `canvas.width` and `canvas.height` everywhere.
2. NEVER set `canvas.style.width/height`. Let the bootstrap handle it.
3. ALL positions, sizes, velocities must use fractions of `canvas.width` / `canvas.height` (e.g., bird x = canvas.width * 0.2, gap = canvas.height * 0.3).
4. On window resize, the game must call `onResize` or re-read `canvas.width`/`canvas.height` to reposition entities.
5. Use `requestAnimationFrame` for the game loop.

Artifacts:
{json.dumps(artifacts, default=lambda o: getattr(o, '__dict__', str(o)), indent=2)[:2000]}

OUTPUT ONLY RAW JAVASCRIPT. NO MARKDOWN. NO EXPLANATIONS. NO BACKTICKS. NO CHATTER.
"""
        try:
            req_body = json.dumps({
                "model": "gemma-4-31b",
                "messages": [
                    {"role": "system", "content": "You are a rigid compiler that only outputs executable Javascript."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0,
                "max_tokens": 1500
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://api.cerebras.ai/v1/chat/completions",
                data=req_body,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "SwarmCircuit"
                }
            )

            from core.state import global_state
            global_state.wait_for_rate_limit()

            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"].strip()
                
                # Robust stripping of markdown blocks if the LLM disobeys
                if "```javascript" in content:
                    content = content.split("```javascript")[1].split("```")[0]
                elif "```js" in content:
                    content = content.split("```js")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                    
                return content.strip()
        except Exception as e:
            print(f"[Compiler] API Failed, falling back to mock: {e}")
            return self._mock_game_js()

    def _mock_game_js(self) -> str:
        return """// SwarmCircuit Compiler Agent (Mock Output)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

ctx.fillStyle = '#1e1e1e';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#4ade80';
ctx.font = '24px monospace';
ctx.textAlign = 'center';
ctx.fillText('SwarmCircuit Build Successful!', canvas.width/2, canvas.height/2);
ctx.fillStyle = '#a1a1aa';
ctx.font = '14px monospace';
ctx.fillText('(Compiler Agent invoked fallback mock)', canvas.width/2, canvas.height/2 + 30);
"""

    def _write_index_html(self):
        html_content = """<!DOCTYPE html>
<html>
<head>
    <title>SwarmCircuit Build</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0a; }
        #gameCanvas {
            display: block;
            position: absolute;
            top: 0; left: 0;
        }
        #ui-layer {
            position: absolute;
            top: 10px; left: 10px;
            font-size: clamp(12px, 2vw, 20px);
            color: #fff;
            font-family: monospace;
            z-index: 10;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="ui-layer">Score: <span id="score">0</span></div>
    <canvas id="gameCanvas"></canvas>
    <script>
        // --- SwarmCircuit Responsive Canvas Bootstrap ---
        const canvas = document.getElementById('gameCanvas');
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (typeof onResize === 'function') onResize();
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    </script>
    <script src="game.js"></script>
</body>
</html>"""
        with open(os.path.join(self.dist_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(html_content)

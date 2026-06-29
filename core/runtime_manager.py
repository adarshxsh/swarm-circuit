import os
import json
import asyncio
from typing import Dict, Any, List
from playwright.async_api import async_playwright
from core.events import WorkerProgressEvent, WorkerCompletionEvent, WorkerErrorEvent, QAIssueEvent

class RuntimeManager:
    """Boots the compiled HTML5 game in a headless browser, tests inputs, and collects logs."""
    
    def __init__(self, dist_dir: str = "./dist_game"):
        self.dist_dir = os.path.abspath(dist_dir)
        self.index_path = f"file://{os.path.join(self.dist_dir, 'index.html')}"
        
    async def run_playtest(self, duration_sec: int = 5, on_event=None) -> Dict[str, Any]:
        """Runs the game in playwright and simulates the Playtest Agent."""
        if on_event:
            on_event(WorkerProgressEvent(
                worker="Runtime Manager",
                status="booting",
                message="Launching headless Chromium browser...",
                progress=10
            ).to_dict())
            
        logs = []
        errors = []
        
        browser = None
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                # Capture console
                page.on("console", lambda msg: logs.append({"type": msg.type, "text": msg.text}))
                page.on("pageerror", lambda err: errors.append(str(err)))
                
                if on_event:
                    on_event(WorkerProgressEvent(
                        worker="Runtime Manager",
                        status="loading",
                        message=f"Loading {self.index_path}",
                        progress=30
                    ).to_dict())
                    
                await page.goto(self.index_path, wait_until="load")
                
                if on_event:
                    on_event(WorkerProgressEvent(
                        worker="Playtest Agent",
                        status="testing",
                        message="Simulating keyboard inputs (Spacebar) to test gameplay loops.",
                        progress=50
                    ).to_dict())
                
                # Playtest loop
                frames = duration_sec * 2 # Press space twice a second
                for _ in range(frames):
                    await page.keyboard.press("Space")
                    await asyncio.sleep(0.5)
                    
                if on_event:
                    on_event(WorkerProgressEvent(
                        worker="Playtest Agent",
                        status="verifying",
                        message="Extracting final game state and console logs.",
                        progress=90
                    ).to_dict())
                    
                # Extract score if possible
                try:
                    score_element = await page.query_selector('#score')
                    if score_element:
                        score = await page.evaluate("(el) => el.innerText", score_element)
                    else:
                        score = "Failure to find score element"
                except:
                    score = "Failure to find score element"
                    
                report = {
                    "logs": logs,
                    "errors": errors,
                    "final_score": score,
                    "test_duration": duration_sec
                }
                
                if on_event:
                    on_event(WorkerCompletionEvent(
                        worker="Runtime Manager",
                        status="completed",
                        message="Playtest execution finished.",
                        artifact=report
                    ).to_dict())
                    
                return report
                
        except Exception as e:
            if on_event:
                on_event(WorkerErrorEvent(
                    worker="Runtime Manager",
                    status="failed",
                    message="Failed to execute headless browser.",
                    error=str(e)
                ).to_dict())
            return {"errors": [str(e)], "logs": logs, "test_duration": 0}
        finally:
            if browser:
                await browser.close()

class QAAgent:
    """Analyzes the RuntimeManager report for issues and proposes fixes."""
    
    def analyze(self, report: Dict[str, Any], on_event=None) -> Dict[str, Any]:
        """Returns True if the build passes QA, False if iteration is needed."""
        if on_event:
            on_event(WorkerProgressEvent(
                worker="QA Agent",
                status="analyzing",
                message="Reviewing Playtest runtime logs and error traces...",
                progress=50
            ).to_dict())
            
        errors = report.get("errors", [])
        
        if len(errors) > 0:
            msg = f"Runtime crashed with {len(errors)} errors. First error: {errors[0]}"
            if on_event:
                on_event(QAIssueEvent(
                    worker="QA Agent",
                    status="failed",
                    message=msg,
                    severity="error"
                ).to_dict())
                
            return {
                "passed": False,
                "reason": msg,
                "errors": errors
            }
            
        # Optional: check if LLM hallucinated markdown in JS causing SyntaxError
        js_syntax_error = any("SyntaxError" in l.get("text", "") for l in report.get("logs", []))
        if js_syntax_error:
            msg = "SyntaxError detected in console logs. The code contains invalid JS."
            if on_event:
                on_event(QAIssueEvent(
                    worker="QA Agent",
                    status="failed",
                    message=msg,
                    severity="error"
                ).to_dict())
            return {
                "passed": False,
                "reason": msg,
                "errors": ["SyntaxError in console"]
            }
            
        if on_event:
            on_event(WorkerCompletionEvent(
                worker="QA Agent",
                status="completed",
                message="No critical runtime errors detected. Build is stable.",
                artifact={"passed": True}
            ).to_dict())
            
        return {"passed": True, "reason": "No errors found."}

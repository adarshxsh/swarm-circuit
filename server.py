import asyncio
import json
import os
import time
from datetime import datetime
from typing import AsyncGenerator
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from queue import Queue

from core.godot_parser import GodotProjectParser
from core.planner import DeterministicPlanner
from core.reddit_scout import TaskProposal
from core.scheduler import DAGScheduler
from core.worker_runtime import StatelessWorkerRuntime
from core.memory_manager import MemoryManager
from core.project_manager import ProjectManager
from core.events import WorkerCompletionEvent
from swarm_cli import create_mock_godot_project

app = FastAPI(title="SwarmCircuit v2 API")
project_manager = ProjectManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
# Ensure dist_game dirs exist before mounting
os.makedirs(os.path.abspath("./dist_game"), exist_ok=True)
os.makedirs(os.path.abspath("./dist_game/catalyst"), exist_ok=True)
# Mount the entire dist_game tree — subdirs (catalyst/, etc.) are served automatically
app.mount("/dist_game", StaticFiles(directory="dist_game", html=True), name="dist_game")

async def stream_demo() -> AsyncGenerator[str, None]:
    """Streams the pre-recorded golden run for flawless demos."""
    try:
        with open("golden_run.json", "r", encoding="utf-8") as f:
            events = json.load(f)
    except FileNotFoundError:
        yield f"data: {json.dumps({'type': 'ERROR', 'error': 'golden_run.json not found'})}\n\n"
        return

    last_delay = 0.0
    for event in events:
        delay = event.get("delay", 0.0)
        # Sleep for the time difference between events to simulate real pacing
        await asyncio.sleep(delay - last_delay)
        last_delay = delay
        
        yield f"data: {json.dumps(event)}\n\n"

async def stream_live(objective: str) -> AsyncGenerator[str, None]:
    """Executes the actual pipeline and streams live events to the frontend."""
    event_queue = Queue()

    def on_event(event_data):
        event_queue.put(event_data)

    def run_pipeline():
        active_proj = project_manager.get_active_project()
        project_path = active_proj.get("path")
        if not project_path or not os.path.exists(project_path):
            event_queue.put({"type": "ERROR", "error": f"Active project path not found: {project_path}"})
            return

        parser = GodotProjectParser(project_path)
        memory = MemoryManager(project_path)
        memory.update_architecture_graph()
        
        # New Query Engine
        from core.memory_query_engine import MemoryQueryEngine
        query_engine = MemoryQueryEngine(memory.memory_dir)
        
        planner = DeterministicPlanner()
        runtime = StatelessWorkerRuntime()
        scheduler = DAGScheduler(parser, runtime, query_engine, max_workers=4)


        proposal = TaskProposal(
            proposal_id="prop_live_run",
            objective=objective,
            category="FEATURE",
            recommended_workers=["Technical Architect", "Gameplay Engineer", "QA & Balance"],
            source_trend="Live Studio Request",
            priority="HIGH"
        )

        try:
            from core.runtime_manager import RuntimeManager, QAAgent
            
            max_iterations = 3
            current_iteration = 1
            qa_passed = False
            
            while current_iteration <= max_iterations and not qa_passed:
                event_queue.put({"type": "MESSAGE", "content": f"--- Starting Iteration {current_iteration} ---"})
                
                dag = planner.generate_dag(proposal)
                
                # Fetch context for injection
                project_bible = memory.read_json("project_bible.json") or {}
                
                artifacts = scheduler.execute_dag(
                    graph=dag,
                    project_summary=json.dumps(project_bible.get("creativeDirection", {})),
                    constraints={
                        "targetFPS": 60, 
                        "maxAllocations": "Zero pool allocation",
                        "learned_mechanics": json.dumps(project_bible.get("learned_mechanics", []))
                    },
                    on_event=on_event
                )
                
                # Export playable web game via LLM Compiler Agent
                from core.compiler_agent import CompilerAgent
                compiler = CompilerAgent()
                compiler.execute(artifacts, project_path, on_event=on_event)
                
                # Run QA Loop
                runtime_manager = RuntimeManager()
                # Run async playwright inside sync thread by creating a new event loop for it
                new_loop = asyncio.new_event_loop()
                report = new_loop.run_until_complete(runtime_manager.run_playtest(duration_sec=3, on_event=on_event))
                new_loop.close()
                
                qa = QAAgent()
                qa_result = qa.analyze(report, on_event=on_event)
                
                if qa_result.get("passed"):
                    qa_passed = True
                    event_queue.put({"type": "MESSAGE", "content": f"QA Passed! Updating Project Bible memory..."})
                    
                    # Memory Loop Update
                    learned_mechanics = {
                        "last_successful_build": str(datetime.now()),
                        "qa_notes": "Playtest verified stable game loop.",
                        "framerate_stable": True
                    }
                    if "learned_mechanics" not in project_bible:
                        project_bible["learned_mechanics"] = []
                    project_bible["learned_mechanics"].append(learned_mechanics)
                    memory.write_json("project_bible.json", project_bible)
                    
                    event_queue.put(WorkerCompletionEvent(
                        worker="Memory Agent",
                        status="completed",
                        message="Project Bible updated with QA verified mechanics."
                    ).to_dict())
                else:
                    event_queue.put({"type": "MESSAGE", "content": f"QA Failed. Retrying... (Attempt {current_iteration}/{max_iterations})"})
                    # Inject QA failure reason into the next proposal objective
                    proposal.objective += f"\n\nQA FAILURE TO FIX: {qa_result.get('reason')}"
                    current_iteration += 1
            
            event_queue.put({"type": "DAG_COMPLETED"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            event_queue.put({"type": "ERROR", "error": str(e)})

    # Run the blocking pipeline in a background thread
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, run_pipeline)

    last_mtime = 0
    while True:
        # Await queue items (we use a simple poll loop for asyncio compatibility with sync Queue)
        if not event_queue.empty():
            event = event_queue.get()
            try:
                yield f"data: {json.dumps(event, default=str)}\n\n"
            except Exception:
                pass
            if event.get("type") in ["DAG_COMPLETED", "ERROR"]:
                break
        else:
            # Check for file changes if DAG is done or just periodically
            js_path = os.path.abspath("./dist_game/game.js")
            if os.path.exists(js_path):
                mtime = os.path.getmtime(js_path)
                if last_mtime != 0 and mtime > last_mtime:
                    yield f"data: {json.dumps({'type': 'GAME_FILE_CHANGED'})}\n\n"
                last_mtime = mtime
            await asyncio.sleep(0.5)

@app.get("/stream")
async def stream_execution(mode: str = Query("demo"), objective: str = Query("Fix character jumping")):
    """SSE endpoint for live execution visualization."""
    if mode == "demo":
        return StreamingResponse(stream_demo(), media_type="text/event-stream")
    else:
        return StreamingResponse(stream_live(objective), media_type="text/event-stream")

@app.get("/golden-run")
def get_golden_run():
    """Returns the pre-recorded execution events for client-side playback."""
    try:
        with open("golden_run.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# --- Project Management Endpoints ---

@app.get("/api/projects")
def get_projects():
    return {
        "projects": project_manager.get_projects(),
        "active_project_id": project_manager.active_project_id
    }

from pydantic import BaseModel
class CreateProjectRequest(BaseModel):
    name: str

@app.post("/api/projects")
def create_project(req: CreateProjectRequest):
    try:
        proj = project_manager.create_project(req.name)
        return {"status": "success", "project": proj}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class SetActiveProjectRequest(BaseModel):
    project_id: str

@app.put("/api/projects/active")
def set_active_project(req: SetActiveProjectRequest):
    success = project_manager.set_active_project(req.project_id)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Project not found"}

# --- Human-in-the-Loop Steering Endpoints ---
from core.state import global_state

@app.post("/api/pause")
def pause_execution():
    global_state.set_pause(True)
    return {"status": "paused"}

@app.post("/api/resume")
def resume_execution():
    global_state.set_pause(False)
    return {"status": "resumed"}

class ChatRequest(BaseModel):
    node_id: str
    message: str

@app.post("/api/chat")
def send_chat(req: ChatRequest):
    global_state.add_chat_message(req.node_id, req.message)
    return {"status": "success", "message_queued": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

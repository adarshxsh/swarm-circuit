import asyncio
import json
import os
import time
from typing import AsyncGenerator
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from queue import Queue

from core.godot_parser import GodotProjectParser
from core.planner import DeterministicPlanner
from core.reddit_scout import TaskProposal
from core.scheduler import DAGScheduler
from core.worker_runtime import StatelessWorkerRuntime
from core.memory_manager import MemoryManager
from swarm_cli import create_mock_godot_project

app = FastAPI(title="SwarmCircuit v2 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        project_path = os.path.abspath("./mock_godot_game")
        if not os.path.exists(project_path):
            create_mock_godot_project(project_path)

        parser = GodotProjectParser(project_path)
        memory = MemoryManager(project_path)
        memory.update_architecture_graph()
        
        planner = DeterministicPlanner()
        runtime = StatelessWorkerRuntime()
        scheduler = DAGScheduler(parser, runtime, max_workers=4)


        proposal = TaskProposal(
            proposal_id="prop_live_run",
            objective=objective,
            category="FEATURE",
            recommended_workers=["Technical Architect", "Gameplay Engineer", "QA & Balance"],
            source_trend="Live Studio Request",
            priority="HIGH"
        )

        try:
            dag = planner.generate_dag(proposal)
            
            # Fetch context for injection
            project_bible = memory.read_json("project_bible.json") or {}
            
            scheduler.execute_dag(
                graph=dag,
                project_summary=json.dumps(project_bible.get("creativeDirection", {})),
                constraints={"targetFPS": 60, "maxAllocations": "Zero pool allocation"},
                on_event=on_event
            )
            event_queue.put({"type": "DAG_COMPLETED"})
        except Exception as e:
            event_queue.put({"type": "ERROR", "error": str(e)})

    # Run the blocking pipeline in a background thread
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, run_pipeline)

    while True:
        # Await queue items (we use a simple poll loop for asyncio compatibility with sync Queue)
        if not event_queue.empty():
            event = event_queue.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event["type"] in ["DAG_COMPLETED", "ERROR"]:
                break
        else:
            await asyncio.sleep(0.1)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

import os
import json
import time
from core.godot_parser import GodotProjectParser
from core.reddit_scout import TaskProposal
from core.planner import DeterministicPlanner
from core.worker_runtime import StatelessWorkerRuntime
from core.scheduler import DAGScheduler

def generate_golden_run():
    events = []
    start_time = time.time()

    def on_event(event_data):
        # Calculate delay since start
        event_data["delay"] = time.time() - start_time
        events.append(event_data)
        print(f"Recorded event: {event_data['type']} at +{event_data['delay']:.2f}s")

    print("[*] Generating Golden Run...")
    project_path = os.path.abspath("./mock_godot_game")
    
    # Ensure project exists
    if not os.path.exists(project_path):
        from swarm_cli import create_mock_godot_project
        create_mock_godot_project(project_path)

    parser = GodotProjectParser(project_path)
    planner = DeterministicPlanner()
    runtime = StatelessWorkerRuntime()
    scheduler = DAGScheduler(parser, runtime, max_workers=4)

    proposal = TaskProposal(
        proposal_id="prop_golden_run",
        objective="Implement double jump mechanic and fix signal connection leaks",
        category="FEATURE",
        recommended_workers=["Technical Architect", "Gameplay Engineer", "QA & Balance"],
        source_trend="Creative Director Direct Input",
        priority="HIGH"
    )

    dag = planner.generate_dag(proposal)
    
    scheduler.execute_dag(
        graph=dag,
        project_summary="Godot Indie Game Project MVP",
        constraints={"targetFPS": 60, "maxAllocations": "Zero pool allocation"},
        on_event=on_event
    )

    with open("golden_run.json", "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2)

    print(f"\n[✅] Golden Run saved to golden_run.json with {len(events)} events.")

if __name__ == "__main__":
    generate_golden_run()

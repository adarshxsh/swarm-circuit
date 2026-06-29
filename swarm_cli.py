#!/usr/bin/env python3
"""SwarmCircuit v2 Interactive CLI — Autonomous Game Development Studio.

Allows the Creative Director to test Reddit scouting, DAG generation, parallel worker execution,
and artifact synthesis directly from the terminal.
"""
import argparse
import os
import sys
import tempfile
from core.godot_parser import GodotProjectParser
from core.reddit_scout import RedditScout
from core.planner import DeterministicPlanner
from core.worker_runtime import StatelessWorkerRuntime
from core.scheduler import DAGScheduler


def create_mock_godot_project(target_dir: str):
    """Generates a dummy Godot project structure for simulation if none exists."""
    os.makedirs(target_dir, exist_ok=True)
    with open(os.path.join(target_dir, "project.godot"), "w") as f:
        f.write("; Engine configuration file.\nconfig_version=5\n[application]\nconfig/name=\"Indie Game MVP\"\n")
    
    with open(os.path.join(target_dir, "Player.tscn"), "w") as f:
        f.write('[gd_scene load_steps=2 format=3]\n[node name="Player" type="CharacterBody2D"]\n[connection signal="hit" from="." to="." method="_on_hit"]\n')
        
    with open(os.path.join(target_dir, "player.gd"), "w") as f:
        f.write('extends CharacterBody2D\nclass_name Player\n\n@export var speed: float = 250.0\n\nfunc _on_hit(dmg):\n    print("Damage taken: ", dmg)\n')


def main():
    parser = argparse.ArgumentParser(description="SwarmCircuit v2 Autonomous Game Studio CLI")
    parser.add_argument("--project", default="./mock_godot_game", help="Path to Godot project workspace")
    parser.add_argument("--subreddit", default="godot", help="Subreddit to scout for trends")
    parser.add_argument("--objective", default=None, help="Custom task objective (skips Reddit scout if provided)")
    args = parser.parse_args()

    print("===================================================================")
    print(" 🕹️  SwarmCircuit v2 — Autonomous AI Game Development Studio")
    print("===================================================================\n")

    # 1. Initialize Workspace
    project_path = os.path.abspath(args.project)
    if not os.path.exists(project_path):
        print(f"[*] Creating mock Godot project workspace at: {project_path}")
        create_mock_godot_project(project_path)
    else:
        print(f"[*] Loading Godot project workspace at: {project_path}")

    godot_parser = GodotProjectParser(project_path)
    stats = godot_parser.scan_project()
    print(f"[*] Workspace Scanned -> Scenes: {stats['scene_count']} | GDScripts: {stats['script_count']}")

    # 2. Scout Reddit or Use Custom Objective
    planner = DeterministicPlanner()
    if args.objective:
        from core.reddit_scout import TaskProposal
        proposal = TaskProposal(
            proposal_id="prop_custom_001",
            objective=args.objective,
            category="FEATURE",
            recommended_workers=["Technical Architect", "Gameplay Engineer", "QA & Balance"],
            source_trend="Creative Director Direct Input",
            priority="HIGH"
        )
        print(f"\n[🎯] Task Objective Received: \"{args.objective}\"")
    else:
        print(f"\n[📡] Scouting r/{args.subreddit} for community feedback & trends...")
        scout = RedditScout()
        posts = scout.fetch_threads(args.subreddit, limit=5)
        if not posts:
            print("    [!] Could not connect to Reddit live API. Using mock community threads...")
            from core.reddit_scout import RedditPost
            posts = [
                RedditPost("m1", "Player speed feels too sluggish during jump", "Please increase base speed.", 150, 30, ""),
                RedditPost("m2", "Signal disconnect memory leak on scene reload", "Crash when reloading level.", 85, 12, "")
            ]
        trends = scout.analyze_trends(posts)
        proposals = scout.generate_task_proposals(trends)
        proposal = proposals[0] if proposals else TaskProposal("p1", "Optimize player movement", "BALANCE", ["Gameplay Engineer"], "General", "MEDIUM")
        print(f"[🔥] Top Trend Extracted: \"{proposal.source_trend}\" (Priority: {proposal.priority})")
        print(f"[🎯] Formulated Task Objective: \"{proposal.objective}\"")

    # 3. Generate Execution DAG
    print("\n[🗺️ ] Deterministic Planner generating DAG execution graph...")
    dag = planner.generate_dag(proposal)
    print(f"    [*] Validated Acyclic Graph ID: {dag.dag_id} ({len(dag.nodes)} specialist nodes)")
    for n_id, node in dag.nodes.items():
        deps = f" <- [{', '.join(node.dependencies)}]" if node.dependencies else " (Root Node)"
        print(f"        - {node.worker_role:<22} | Model: {node.assigned_model_profile:<22} | {deps}")

    # 4. Execute Scheduler
    print("\n[⚡] Scheduler executing parallel stateless workers...")
    runtime = StatelessWorkerRuntime()
    scheduler = DAGScheduler(godot_parser, runtime, max_workers=4)
    
    artifacts = scheduler.execute_dag(
        graph=dag,
        project_summary="Godot Indie Game Project MVP",
        constraints={"targetFPS": 60, "maxAllocations": "Zero pool allocation"}
    )

    # 5. Output Results
    print("\n===================================================================")
    print(" 🏁  Execution Completed — Worker Artifact Summary")
    print("===================================================================")
    for n_id, art in artifacts.items():
        status_icon = "✅" if art.status == "SUCCESS" else "❌"
        print(f"\n{status_icon} Worker: {art.producer_role} ({art.execution_time_ms}ms via {art.model_profile_used})")
        for deliv in art.deliverables:
            print(f"    📦 [{deliv.deliverable_type}] -> Target: {deliv.target_file}")
            for line in deliv.content_or_diff.split("\n")[:3]:
                print(f"       {line}")
            if len(deliv.content_or_diff.split("\n")) > 3:
                print("       ...")

    print("\n[👑 Creative Director Review Required]: All outputs aggregated. Ready to merge into Project Bible.")
    print("===================================================================\n")


if __name__ == "__main__":
    main()

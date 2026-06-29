# SwarmCircuit v2 — Autonomous AI Game Development Studio Architecture

## 1. Executive Summary & Final Product Vision
SwarmCircuit is an autonomous multi-agent game development platform where specialized AI workers collaborate to research, design, implement, review, and continuously improve game projects. Focused specifically on indie game developers, it bridges community feedback with deterministic software engineering.

### Primary Focus (MVP)
- **Engine**: Godot Engine (GDScript project support). Unity & Unreal to follow.
- **Core Intelligence**: Reddit Community Intelligence (transforming community discussions into actionable game improvements).
- **Core Principles**: Project-first architecture, stateless AI workers, artifact-based communication, deterministic orchestration, parallel execution, continuous project memory, self-healing engineering, human approval before merge.

---

## 2. System Architecture & Workflow

```mermaid
graph TD
    Project[Godot Project Workspace] --> Chat[Executive Project Chat]
    Chat --> Intent[Intent Analysis]
    Intent --> Planner[Deterministic Planner]
    
    Reddit[Reddit Thread / Feedback] --> Scout[Reddit Scout]
    Scout --> CommAnalyst[Community Analyst]
    CommAnalyst -->|Trend Extraction| Planner
    
    Planner -->|DAG Generation| Scheduler[Task Scheduler & Retry Engine]
    
    subgraph Parallel AI Workers (Stateless)
        Scheduler --> W1[Game Designer]
        Scheduler --> W2[Technical Architect]
        Scheduler --> W3[Gameplay Engineer - GDScript]
        W3 --> W4[QA & Balance]
        W3 --> W5[Performance Reviewer]
        W4 --> W6[Documentation Agent]
    end
    
    W4 -->|Artifacts| Reviewer[Executive Reviewer LLM]
    W5 -->|Artifacts| Reviewer
    W6 -->|Artifacts| Reviewer
    
    Reviewer -->|Executive Summary| User[Creative Director Approval]
    User -->|Merge| Memory[Continuous Project Memory]
```

---

## 3. Core AI Workers (MVP Fleet)
Workers are completely stateless, communicate solely via structured JSON/Markdown artifacts, and terminate immediately upon output generation.

1. **Reddit Scout**: Scans target subreddits for game feedback, bug reports, and mechanic discussions.
2. **Community Analyst**: Synthesizes raw thread scrapes into structured player sentiment and feature requests.
3. **Game Designer**: Balances progression, designs mechanics, and writes/evolves the Game Design Document (GDD).
4. **Technical Architect**: Owns Godot scene hierarchy (`.tscn`), node tree structures, and dependency graphs.
5. **Gameplay Engineer**: Implements GDScript logic, refactors node systems, and generates code patches.
6. **QA & Balance**: Analyzes numerical balance, edge-case exploits, and regression vectors.
7. **Performance Reviewer**: Evaluates frame-rate impact, memory allocation, and signal connection leaks in Godot.
8. **Documentation Agent**: Updates inline GDScript documentation, node descriptions, and project changelogs.
9. **Executive Reviewer**: Synthesizes all worker outputs into an executive summary for Creative Director merge decision.

---

## 4. Reddit-Centric Intelligence Pipeline
SwarmCircuit transforms community discussions into actionable engineering work rather than passive summaries:
```
Reddit Thread -> Community Analysis -> Trend Extraction -> Planner -> Relevant Workers -> Implementation Roadmap -> Project Improvements
```

---

## 5. Continuous Self-Healing Engine (Dedicated Gemma-4-31B via Cerebras)
An autonomous background auditing system running on ultra-fast Cerebras inference endpoints continuously audits the Godot project for:
- Architecture drift detection (e.g., scripts bypassing scene tree conventions or direct node coupling).
- Dead code analysis (unused GDScript functions, orphaned `.tscn` or `.gd` files).
- Technical debt discovery & signal disconnect risks.
- Documentation validation & prompt quality auditing.
- Memory optimization & regression detection.

---

## 6. Hybrid Execution Observatory (Live vs. Demo Modes)
The frontend relies on a dual-mode streaming architecture to facilitate fast, free hackathon demos and verified live inference:
- **Live Mode**: Executes the actual DAG via the `DAGScheduler`, querying the Cerebras API for Gemma-4-31b inference, and streams state changes over SSE (Server-Sent Events) dynamically.
- **Demo Mode**: Disconnects from the SSE stream and directly fetches a static `/golden-run` REST endpoint containing a perfectly cached `golden_run.json`. The React frontend (`usePlayback` hook) handles iterating over the array via local timeout delays, enabling client-side features like Pause, Fast-Forward, and zero-latency execution.

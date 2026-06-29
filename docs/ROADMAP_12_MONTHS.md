# SwarmCircuit v2 — 12-Month CTO Development Roadmap

## Phase 1: Foundation & Deterministic Orchestration Core (Months 1–3)

### Goals
Establish the deterministic orchestration runtime (Planner + Scheduler), implement stateless worker lifecycles, and prove the DAG execution pipeline without chat loops.

### Deliverables
- `swarm-orchestrator`: Core deterministic DAG generation engine.
- `swarm-scheduler`: Parallel execution engine with exponential backoff retries.
- `swarm-cli`: Command-line tool for Creative Director task submission and artifact review.

### Folder Structure
```
swarm-circuit/
├── core/
│   ├── planner/       # Deterministic AST and DAG generators
│   ├── scheduler/     # Worker process management & retry loop
│   └── reviewer/      # Executive Reviewer LLM synthesis
├── workers/           # Stateless worker prompts and API wrappers
├── memory/            # Local JSONL file storage handlers
└── docs/              # System architecture and schemas
```

### Services & APIs
- `POST /api/v1/task/submit`: Accepts task objective, returns generated DAG ID.
- `GET /api/v1/dag/{id}/status`: Polling endpoint for parallel node execution status.
- `POST /api/v1/review/approve`: Creative Director approval of synthesized executive summary.

### Database Schema (SQLite / Postgres MVP)
```sql
CREATE TABLE tasks (
    task_id VARCHAR(64) PRIMARY KEY,
    objective TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dag_nodes (
    node_id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) REFERENCES tasks(task_id),
    worker_role VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    dependencies JSONB,
    retry_count INT DEFAULT 0
);
```

### Execution Graph & Failure Recovery
- **Execution**: Nodes execute only when all upstream dependency status == `SUCCESS`.
- **Retry Logic**: On worker API timeout or JSON schema validation failure, retry up to 3 times with exponential backoff ($2^n \times 1000\text{ms}$). If failure persists, mark branch `FAILED` and notify Executive Reviewer.

### Cost & Observability
- **Cost Optimization**: Strict max-token limits per worker; prompt caching on system prompts.
- **Observability**: OpenTelemetry tracing across every DAG node execution. Structured JSON logging to stdout.

---

## Phase 2: Continuous Memory Layer & Context Engine (Months 4–5)

### Goals
Eliminate context window bloat by implementing AST-based file slicing and integrating the persistent `.swarm/memory/` knowledge graph.

### Deliverables
- `context-engine`: AST parser (Tree-sitter based) extracting only relevant code blocks.
- `memory-daemon`: Background service maintaining `decision_log.jsonl` and `project_bible.json`.

### Architecture & Security
- **Security**: Local filesystem sandboxing. Workers run in isolated Docker containers or restrictive chroot environments with zero outbound network access (unless assigned browser capabilities).

---

## Phase 3: Specialist Worker Fleet & Plugin Ecosystem (Months 6–8)

### Goals
Deploy all 8 specialized workers and enable capabilities through Model Context Protocol (MCP) plugins.

### Deliverables
- Specialist workers: Research, Community Analyst, Architect, Gameplay Engineer, QA, Performance, Documentation, Historian.
- Plugins: GitHub MCP, Reddit Scraper MCP, Unity/Unreal Docs MCP.

### Parallel Execution & Testing Strategy
- **Parallelism**: QA and Performance Engineers run concurrently immediately after Engineer outputs a code patch.
- **Testing**: Automated end-to-end integration tests running mock tasks against simulated repositories to verify artifact validation schemas.

---

## Phase 4: Autonomous Self-Healing via Cerebras / Gemma-4-31B (Months 9–10)

### Goals
Launch the autonomous engineering excellence loop running continuously in the background.

### Deliverables
- `healing-daemon`: Background scanner utilizing ultra-fast Cerebras API endpoints.
- Auto-remediation workflows: Automatically detects stale comments, dead imports, and architectural drift, generating non-blocking merge requests.

---

## Phase 5: Studio Dashboard UI & Enterprise Scalability (Months 11–12)

### Goals
Deliver a premium, visual rich Web Studio Dashboard replacing standard terminal output and scale to enterprise repositories.

### Deliverables
- React / Vite / Tailwind UI featuring real-time timeline websocket updates, active worker DAG visualization, and one-click PR approvals.
- Multi-user authentication, cloud artifact blob storage (S3), and distributed task workers (Celery/Redis).

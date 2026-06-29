# SwarmCircuit v2 — Continuous Project Memory Schema

## 1. Overview
To prevent hallucination and maintain absolute project consistency across stateless worker executions, all persistent context is structured into versioned files within the `.swarm/memory/` workspace root.

```
.swarm/memory/
├── project_bible.json       # Core vision, rules, and global architecture invariants
├── architecture_graph.json  # Dependency tree and module boundaries
├── decision_log.jsonl       # Immutable ledger of accepted/rejected decisions
├── technical_debt.json      # Known shortcuts, fixme tracking, and refactoring backlog
└── known_risks.json         # Security, performance, and scaling bottlenecks
```

---

## 2. JSON Schemas

### 2.1 Project Bible (`project_bible.json`)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProjectBible",
  "type": "object",
  "required": ["projectName", "version", "creativeDirection", "techStack", "invariants"],
  "properties": {
    "projectName": { "type": "string" },
    "version": { "type": "string" },
    "creativeDirection": {
      "type": "object",
      "properties": {
        "genre": { "type": "string" },
        "coreMechanics": { "type": "array", "items": { "type": "string" } },
        "targetAudience": { "type": "string" }
      }
    },
    "techStack": {
      "type": "object",
      "properties": {
        "engine": { "type": "string" },
        "language": { "type": "string" },
        "renderPipeline": { "type": "string" }
      }
    },
    "invariants": {
      "type": "array",
      "description": "Architectural rules that workers MUST NOT violate",
      "items": { "type": "string" }
    }
  }
}
```

### 2.2 Decision Log Entry (`decision_log.jsonl`)
Every time a workflow completes, the Historian appends an entry to `decision_log.jsonl`:
```json
{
  "decisionId": "dec_20260629_001",
  "timestamp": "2026-06-29T13:50:00Z",
  "title": "Adopt Deterministic Planner over Monolithic Studio Director",
  "status": "ACCEPTED",
  "authorWorker": "Architect_Agent_v2",
  "context": "Orchestrating 8 simultaneous agents via a single LLM loop caused loops and non-deterministic failures.",
  "tradeOffs": {
    "pros": ["Zero LLM orchestration hallucination", "Easier parallel DAG execution", "Debuggable step replay"],
    "cons": ["Requires rigid schema definition for DAG nodes"]
  },
  "affectedModules": ["orchestrator", "scheduler"]
}
```

---

## 3. Stateless Worker Context Injection Payload
When the Scheduler executes a DAG node, it extracts only the slice of memory required for that worker. The payload sent to the worker API is formatted as:

```json
{
  "taskId": "task_99482",
  "role": "GameplayEngineer",
  "objective": "Implement fishing rod casting physics and line tension calculation.",
  "constraints": {
    "maxAllocationsPerFrame": "0 bytes (use object pooling)",
    "targetFPS": 60
  },
  "projectSummary": "Survival game built in Unity/C# focusing on realistic wilderness mechanics.",
  "relevantFiles": [
    {
      "path": "src/Gameplay/Items/FishingRod.cs",
      "contentSlice": "... [Lines 1-85] ..."
    },
    {
      "path": "src/Physics/TensionSimulator.cs",
      "contentSlice": "... [Lines 12-40] ..."
    }
  ],
  "upstreamArtifacts": [
    {
      "artifactType": "ArchitectureProposal",
      "summary": "Use Hooke's law for line tension with a damping coefficient of 0.85."
    }
  ]
}
```

---

## 4. Worker Output Artifact Schema
Every stateless worker MUST terminate by returning an artifact matching this structure:

```json
{
  "artifactId": "art_eng_8831",
  "taskReference": "task_99482",
  "producerRole": "GameplayEngineer",
  "status": "SUCCESS",
  "deliverables": [
    {
      "type": "CODE_PATCH",
      "targetFile": "src/Gameplay/Items/FishingRod.cs",
      "diff": "@@ -45,6 +45,18 @@ ..."
    }
  ],
  "discoveredRisks": [
    "Line snapping at high framerate variance if Time.deltaTime exceeds 33ms."
  ],
  "suggestedFollowUpTasks": [
    "Add QA regression test for extreme framerate fluctuations during fishing."
  ]
}
```

# Architecture Foundation
**Status: ADR-0001 created and proposed. Implementation remains blocked until TASK-001 approval.**

## Goals
Local-first where practical, provider-agnostic adapters, event/audit model, real-time UI, isolated task execution, Git-aware tracking, extensible telemetry and safe process control.

## Selected provisional direction (pending TASK-001 approval)
- Frontend: React + TypeScript + Vite.
- Orchestrator: Node.js + TypeScript (local web runner), with strict interfaces to keep provider/orchestrator pluggable.
- Desktop shell: Web app first, with Tauri deferred to a later phase 1 slice.
- Persistence: SQLite initially; PostgreSQL for future collaborative/server mode.
- Repository integration: Git + filesystem watcher + process execution abstraction.

## Core modules
Project Management; Task/Approval Engine; Agent Orchestrator; Execution Manager; Repository/Git Observer; Event Store; Telemetry/Cost; Validation; Documentation; Live Development Gateway; Review/Acceptance.

## Agent abstraction
Provider-specific behavior must sit behind an `AgentAdapter`-style interface.

True token/file-edit streaming, pause semantics and cost telemetry depend on provider capabilities. The UI must distinguish provider telemetry from locally inferred events.

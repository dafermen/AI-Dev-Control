# AI Agent Rules
## Lifecycle
`READY -> PLANNING -> WAITING_APPROVAL -> EXECUTING -> VALIDATING -> WAITING_REVIEW -> ACCEPTED`

Exceptional states: `PAUSED`, `BLOCKED`, `FAILED`, `STOPPED`, `REJECTED`.

## Task envelope
Task ID, title, objective, context, authorized scope, forbidden scope, acceptance criteria, validation, risk, artifacts, budget, dependencies and status.

## Guardrails
Support limits such as monetary/token budget when measurable, execution time, changed-file count, allowed directories and command restrictions.

Agents inspect before editing, make the smallest sufficient change, preserve unrelated behavior, validate, surface uncertainty, stop on scope expansion and leave resumable documentation. Never invent telemetry the provider does not expose.

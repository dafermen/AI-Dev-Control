# Human Control Principles
## Hierarchy
Human operator > approved project rules > approved architecture > approved task plan > agent execution.

## Approval gates
Require human approval for implementation start, scope expansion, protected/high-risk areas, architecture changes, major dependencies, destructive operations and merge/push/release/deployment.

## Controls
**Pause** preserves resumable state. **Stop** terminates current execution safely. Intervention must preserve an audit trail of changed plans.

A task is not Done because an agent says so; completion requires evidence against acceptance criteria.

Expose observable engineering actions and concise rationale, not private model chain-of-thought.

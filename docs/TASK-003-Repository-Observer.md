# TASK-003 — Read-only Repository Observer

## Metadata
- Phase: PHASE 1 — CONTROL PLANE
- Status: `ACCEPTED`
- Risk: LOW
- Authorized by: Human operator

## Objective
Expose bounded repository metadata in the GUI without allowing Git writes or command execution.

## In scope
- Detect whether the project folder is a Git repository.
- Read branch, short commit hash, working-tree status and five recent commits.
- Display an explicit onboarding state when Git is not initialized.
- Keep every repository operation read-only.

## Out of scope
- `git init`, staging, commits, branches, remotes, pushes and history changes.
- File modification or process execution from the GUI.

## Result
The observer was implemented and accepted. It now distinguishes an uninitialized folder from an
initialized but empty Git repository.

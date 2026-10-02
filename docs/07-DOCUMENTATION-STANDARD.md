# Documentation Standard
A new human developer or AI session must be able to resume without previous chat history.

Maintain README, Charter, Vision, Architecture, UX spec, Workflow, Project State, Roadmap, ADRs, task records and later a changelog/release notes.

Documentation must be version-controlled, understandable to a junior developer, updated with invalidating changes, and linked rather than unnecessarily duplicated.

## ADR format
`docs/adr/ADR-XXXX-title.md`: Context · Decision · Alternatives · Consequences · Status.

## Task record
ID · objective · plan · approval · implementation summary · changed files · validation · result · follow-up.

## DOC-STD-20261002 — Canonical sources

Documentation standard v1.0 · reviewed 2026-10-02. Primary language: English.

Human-controlled AI development control plane.

The protected test deployment and local development have different capabilities. Provider execution, credential-vault support and unfinished tasks must follow their individual task evidence. The external demo gate is configured independently of the local development env.

| Need | Authoritative source |
| --- | --- |
| Presentation | [README.md](../README.md) |
| Current state | [docs/08-PROJECT-STATE.md](08-PROJECT-STATE.md) |
| Development | [docs/06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md) |
| Architecture | [docs/04-ARCHITECTURE-FOUNDATION.md](04-ARCHITECTURE-FOUNDATION.md) |
| Usage | [docs/05-UX-VISIBILITY-SPEC.md](05-UX-VISIBILITY-SPEC.md) |
| Security | [docs/02-HUMAN-CONTROL-PRINCIPLES.md](02-HUMAN-CONTROL-PRINCIPLES.md) |
| Demo access | [docs/DEMO_MODE.md](DEMO_MODE.md) |
| Scope | [docs/00-PROJECT-CHARTER.md](00-PROJECT-CHARTER.md) |

Start with the presentation and current state, then read the user guide to try the product, development/architecture to contribute, or deployment/operations to maintain it. The existing detailed index remains valid.

### Evidence and updates

Keep current state, change history and decisions separate. Existing dated test results remain historical evidence. Adding this map does not rerun every documented command or complete pending product acceptance. Record actual checks, their environment and unresolved limits before publication.

Update the source guide whenever commands, configuration, behavior, permissions or deployment change. Keep existing links and portal routes stable. Use real screenshots with synthetic data; never publish env values, access keys, user data or operational logs. A local commit, a remote commit and a deployed artifact are separate states.

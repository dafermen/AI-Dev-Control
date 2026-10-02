# AI Development Control Platform — Phase 1
A foundation for a **human-controlled AI software engineering platform**.

> AI agents execute; humans direct, approve, observe, validate, and accept.

## Acceso de desarrollo
- URL local de observación: [http://localhost:5182/](http://localhost:5182/).
- Estado: control plane local con dashboard, contratos de dominio, timeline SQLite y visor documental.
- Alcance actual: trazabilidad y control humano local, sin integración de agentes ni ejecución de repositorios.
- Repositorio remoto: `https://github.com/dafermen/AI-Dev-Control.git` (vinculado, sin commits ni push).

## Phase
**PHASE 1 — CONTROL PLANE. Primer slice funcional en revisión humana.**

Read `AGENTS.md`, `docs/08-PROJECT-STATE.md`, then the remaining documentation.

## Proof of concept
The first benchmark will be an original lightweight RTS inspired by classic RTS mechanics. It must not copy proprietary Age of Empires code, artwork, music, maps, text, trademarks, or assets.

## Prime directive
No AI agent may silently expand an approved task.

## Portfolio demo access

[Open the protected demo](https://aidevcontrol.innovalogic.tech/). The external test-server
gateway supports optional `DEMO_MODE` and private `DEMO_PASSWORD` settings.
See [configuration and limits](docs/DEMO_MODE.md) and the
[secret-free env template](deploy/demo-access/.env.example). These settings belong
to the server gateway; the local application does not read them automatically.

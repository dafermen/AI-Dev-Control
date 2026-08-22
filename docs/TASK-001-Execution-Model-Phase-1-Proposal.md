# TASK-001 — Architecture Decision: execution model and initial technology stack

## Metadata
- Task ID: TASK-001
- Fase: PHASE 0 (Foundation, pre-implementation)
- Estado: `APPROVED_AND_COMPLETED`
- Prioridad: Alta
- Objetivo: Definir un modelo ejecutable de arquitectura inicial y contratos mínimos para iniciar
  el primer slice visible de Fase 1.

## Objetivo
Consolidar la decisión de stack y los límites de ejecución para permitir un primer avance visible
sin romper las reglas de control humano establecidas.

## Alcance autorizado
- Definir stack tecnológico base (UI + orquestación + persistencia inicial).
- Definir arquitectura de contratos:
  - Estado/tarea (`TaskEnvelope`, `TaskState`)
  - Comandos y resultados (`ExecutionCommand`, `ExecutionResult`)
  - Eventos de sistema (`ExecutionEvent`, `TimelineEntry`)
  - Políticas de guardia (`GuardrailPolicy`)
- Definir vertical-slice de fase 0.1:
  - Dashboard de estado + docs + visor de documentación (ya existente).
  - Timeline local de observabilidad y acciones observables.
- Actualizar documentación de estado/plan para continuidad de sesiones.

## Alcance no autorizado
- Conectar agente de IA real.
- Implementar validaciones de build/test automatizadas avanzadas.
- Integración de desktop shell (Tauri) o telemetría real de costo de proveedor.
- Implementar lógica de juego (RTS POC).

## Entregables propuestos
- ADR: `[docs/ADR-0001-execution-model-and-stack.md](C:/Projects/AI%20Dev%20Control/docs/ADR-0001-execution-model-and-stack.md)`
- Actualización de documentación de estado.
- Plantilla de contratos de dominio propuesta para aprobar en esta tarea.

# Riesgos y mitigaciones
- Riesgo: elegir Node.js demasiado pronto puede sesgar arquitectura.
  - Mitigación: definir contratos de dominio estrictos e interfaces pluggables.
- Riesgo: ampliar alcance por “conveniencia” al mapear ejecución completa.
  - Mitigación: no ejecutar código de motor de agente ni cambios funcionales fuera del alcance.

## Criterios de aceptación (previos a ejecutar TASK-001)
- El ADR queda completo y aprobado por el operador.
- `Project State` actualizado con estado coherente.
- Contratos mínimos documentados y validados por revisión humana.
- No se escriben cambios fuera del alcance de este archivo/estado/documento de fase 0.

## Estado final esperado
- Una vez aprobado, queda habilitado un backlog de implementación mínimo para construir
  el slice inicial de Fase 1 sin ambigüedad.

## Aprobación y cierre
- Aprobación del operador: 2026-08-22.
- Resultado: ADR-0001 aceptado y Fase 1 habilitada.
- Continuidad: TASK-002 implementa el primer control plane local visible.

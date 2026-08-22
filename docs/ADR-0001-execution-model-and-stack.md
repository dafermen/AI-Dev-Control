# ADR-0001: Modelo de ejecución y stack inicial para Fase 1

## Contexto
- Fase 0 requiere una primera decisión ejecutable y consistente para poder avanzar a
  una app visible sin romper el principio de control humano.
- El proyecto ya cuenta con reglas, visión y estado, y aún no tiene implementación
  aprobada más allá de visualización local.
- Se necesita un stack que permita:
  - estado de tarea y fases visible desde UI,
  - comando/archivo observado para validar trazabilidad,
  - telemetría de procesos con límites de alcance,
  - evolución hacia agentes de IA sin reescritura total.

## Decisión
Adoptar para la próxima etapa de implementación el siguiente stack base:
- UI: React + TypeScript + Vite.
- Orquestación local: Node.js + TypeScript (servidor HTTP local y runtime de ejecución).
- Persistencia inicial: SQLite.
- Control de repositorio: `git` CLI + `fs` watcher local.
- Proceso y UI shell: mantener la solución como web-app local ejecutándose en navegador por ahora,
  y migrar a Tauri o equivalente en una etapa posterior de fase 1.

## Alternativas consideradas
- .NET 8 / ASP.NET Core para orquestador:
  - Pros: estructura robusta y fuerte tipado en backend.
  - Contras: mayor costo de arranque del stack y acoplamiento con ecosistema distinto al del
    servidor actual, mayor fricción para iterar rápidamente en fase 0.
- Node.js/TypeScript end-to-end:
  - Pros: velocidad de implementación inicial, menor fricción con el front existente,
    buena integración con APIs de observabilidad y herramientas de repo en el entorno actual.
  - Contras: requiere disciplina de proceso más estricta para evitar derivaciones de alcance.

## Consecuencias
- Se habilita un primer vertical-slice de "fase visible" con cambios mínimos:
  dashboard de estado + documentación + registros de acciones.
- La separación por interfaces (`TaskStore`, `ExecutionEngine`, `EventBus`,
  `TelemetryAdapter`) queda definida para permitir cambiar de motor de ejecución sin romper UI.
- La decisión de posponer Tauri en esta fase reduce riesgo operativo en arranque.
- Al mantener todo en Node.js durante fase 0 y parte de fase 1, la evidencia de costos por token
  y coste real de proveedor de agente debe marcarse explícitamente como "sin proveedor" hasta
  integración posterior.

## Estado
- ACEPTADA — 2026-08-22
- Aprobada explícitamente por el operador para iniciar Fase 1.

## Alcance para TASK-001
- Definir contratos mínimos del sistema:
  - `TaskEnvelope` y `TaskState`.
  - `ExecutionCommand`, `ExecutionEvent`, `ExecutionResult`.
  - `EventLog` y `TimelineEntry`.
  - `TokenBudget` + `GuardrailPolicy` (solo locales/estimados mientras no hay agente conectado).
- Diseñar la “página base” de Fase 0.1 con:
  - Estado del proyecto y fase,
  - Lista de docs desde archivo,
  - Visor de documento,
  - Timeline local inicial de acciones observables.
- Actualizar documentación de estado para dejar este cambio aprobado/documentado.

import http, { type IncomingMessage, type ServerResponse } from "node:http";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import type { ControlAction, GuardrailPolicy, RepositorySnapshot, TaskEnvelope, TaskState, TimelineEntry } from "./src/domain/contracts.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DOC_ROOT = path.join(ROOT, "docs");
const DATA_ROOT = path.join(ROOT, ".data");
const PROJECT_DOCS = ["README.md", "AGENTS.md", "MASTER-PROMPT.md"];
const args = process.argv.slice(2);
const valueAfter = (flag: string, fallback: string) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const requestedHost = valueAfter("--host", "127.0.0.1");
const host = requestedHost === "0.0.0.0" ? "127.0.0.1" : requestedHost;
const port = Number.parseInt(valueAfter("--port", "5182"), 10) || 5182;
const production = process.env.NODE_ENV === "production";
const execFileAsync = promisify(execFile);

mkdirSync(DATA_ROOT, { recursive: true });
const database = new DatabaseSync(path.join(DATA_ROOT, "control-plane.db"));
database.exec(`
  CREATE TABLE IF NOT EXISTS task_state (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, objective TEXT NOT NULL, phase TEXT NOT NULL,
    state TEXT NOT NULL, risk_level TEXT NOT NULL, approved_by TEXT, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL, event_type TEXT NOT NULL,
    title TEXT NOT NULL, detail TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL
  );
`);

const now = () => new Date().toISOString();
const taskExists = database.prepare("SELECT COUNT(*) AS count FROM task_state WHERE id = ?").get("TASK-002") as { count: number };
if (taskExists.count === 0) {
  database.prepare("INSERT INTO task_state (id, title, objective, phase, state, risk_level, approved_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run("TASK-002", "Control plane local", "Entregar control humano visible, contratos tipados y timeline persistente.", "PHASE 1", "IN_REVIEW", "LOW", "Human operator", now());
  const insert = database.prepare("INSERT INTO timeline (task_id, event_type, title, detail, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("TASK-002", "PHASE_AUTHORIZED", "Fase 1 autorizada", "El operador aprobó TASK-001 y habilitó el primer slice funcional.", "HUMAN", now());
  insert.run("TASK-002", "GUARDRAILS_ACTIVE", "Límites de ejecución activos", "Agentes, repositorios y proveedores permanecen desconectados.", "SYSTEM", now());
  insert.run("TASK-002", "REVIEW_REQUESTED", "Control plane listo para revisión", "La implementación local espera aceptación humana.", "SYSTEM", now());
}

const repositoryTaskExists = database.prepare("SELECT COUNT(*) AS count FROM task_state WHERE id = ?").get("TASK-003") as { count: number };
if (repositoryTaskExists.count === 0) {
  database.prepare("INSERT INTO task_state (id, title, objective, phase, state, risk_level, approved_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run("TASK-003", "Observador de repositorio", "Mostrar estado Git y actividad local sin permitir operaciones de escritura.", "PHASE 1", "IN_REVIEW", "LOW", "Human operator", now());
  const insert = database.prepare("INSERT INTO timeline (task_id, event_type, title, detail, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("TASK-003", "READ_ONLY_SCOPE", "Observación de solo lectura", "El observador no puede inicializar, modificar ni ejecutar operaciones Git de escritura.", "SYSTEM", now());
  insert.run("TASK-003", "REPOSITORY_CHECKED", "Estado de repositorio inspeccionado", "No se detectó un repositorio Git inicializado en la carpeta del proyecto.", "SYSTEM", now());
  insert.run("TASK-003", "REVIEW_REQUESTED", "Observador listo para revisión", "La vista de repositorio está preparada y espera aceptación humana.", "SYSTEM", now());
}

const initializationTaskExists = database.prepare("SELECT COUNT(*) AS count FROM task_state WHERE id = ?").get("TASK-004") as { count: number };
if (initializationTaskExists.count === 0) {
  database.prepare("INSERT INTO task_state (id, title, objective, phase, state, risk_level, approved_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run("TASK-004", "Inicialización Git controlada", "Inicializar Git local, establecer main y vincular el origin autorizado sin crear commits ni publicar contenido.", "PHASE 1", "IN_REVIEW", "MEDIUM", "Human operator", now());
  const insert = database.prepare("INSERT INTO timeline (task_id, event_type, title, detail, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("TASK-004", "GIT_INITIALIZED", "Repositorio local inicializado", "Se creó metadata Git local con rama main.", "SYSTEM", now());
  insert.run("TASK-004", "REMOTE_LINKED", "Origen remoto vinculado", "Origin apunta al repositorio GitHub autorizado; no se realizó push.", "SYSTEM", now());
  insert.run("TASK-004", "REVIEW_REQUESTED", "Inicialización lista para revisión", "El repositorio está vacío y espera una política aprobada para el primer commit.", "SYSTEM", now());
}

const baselineTaskExists = database.prepare("SELECT COUNT(*) AS count FROM task_state WHERE id = ?").get("TASK-005") as { count: number };
if (baselineTaskExists.count === 0) {
  database.prepare("INSERT INTO task_state (id, title, objective, phase, state, risk_level, approved_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run("TASK-005", "Baseline y primera publicación", "Crear un único commit base revisado y publicar main en el origin autorizado.", "PHASE 1", "IN_REVIEW", "MEDIUM", "Human operator", now());
  const insert = database.prepare("INSERT INTO timeline (task_id, event_type, title, detail, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("TASK-005", "BASELINE_REVIEWED", "Contenido base revisado", "Archivos generados y datos locales están excluidos; no se detectaron secretos evidentes.", "SYSTEM", now());
  insert.run("TASK-005", "PUBLICATION_AUTHORIZED", "Publicación autorizada", "El operador autorizó un commit inicial y un push de main al origin aprobado.", "HUMAN", now());
  insert.run("TASK-005", "REVIEW_REQUESTED", "Baseline listo para revisión", "La entrega espera aceptación humana después de verificar la referencia remota.", "SYSTEM", now());
}

const guardrails: GuardrailPolicy[] = [
  { id: "human-authority", label: "Autoridad humana", description: "Toda transición relevante requiere una acción visible del operador.", enforced: true },
  { id: "scope-lock", label: "Alcance bloqueado", description: "No se permiten acciones fuera de la tarea aprobada.", enforced: true },
  { id: "no-provider", label: "Sin proveedor IA", description: "No existe conexión con modelos o agentes en este slice.", enforced: true },
  { id: "local-only", label: "Solo entorno local", description: "Estado y eventos permanecen en SQLite local.", enforced: true },
  { id: "git-read-only", label: "Git de solo lectura", description: "El observador solo consulta estado, rama, commit y actividad.", enforced: true },
];

const runGit = async (parameters: string[]) => {
  const { stdout } = await execFileAsync("git", ["-C", ROOT, ...parameters], { timeout: 3_000, windowsHide: true });
  return stdout.trim();
};
const readRepository = async (): Promise<RepositorySnapshot> => {
  const base: RepositorySnapshot = {
    available: false, projectName: path.basename(ROOT), state: "NOT_INITIALIZED", branch: null,
    head: null, changes: [], recentCommits: [], checkedAt: now(), readOnly: true,
  };
  try {
    if (await runGit(["rev-parse", "--is-inside-work-tree"]) !== "true") return base;
    const [branch, status] = await Promise.all([
      runGit(["branch", "--show-current"]), runGit(["status", "--porcelain=v1", "--untracked-files=normal"]),
    ]);
    let head: string | null = null;
    let log = "";
    try {
      [head, log] = await Promise.all([
        runGit(["rev-parse", "--short", "HEAD"]), runGit(["log", "-5", "--pretty=format:%h%x09%s%x09%ar"]),
      ]);
    } catch { head = null; }
    const changes = status ? status.split("\n").map((line) => ({
      status: line.slice(0, 2).trim() || "M", path: line.slice(3).trim(), staged: line[0] !== " " && line[0] !== "?",
    })) : [];
    const recentCommits = log ? log.split("\n").map((line) => {
      const [hash, subject, relativeDate] = line.split("\t");
      return { hash, subject, relativeDate };
    }) : [];
    const state = head ? (changes.length ? "CHANGES" : "CLEAN") : "EMPTY";
    return { ...base, available: true, state, branch: branch || "main", head, changes, recentCommits };
  } catch { return base; }
};

const validDocName = (name: string) => /^[a-zA-Z0-9._-]+\.md$/.test(name);
const readProjectFile = async (name: string) => {
  if (!PROJECT_DOCS.includes(name) || !validDocName(name)) return "";
  try { return await fs.readFile(path.join(ROOT, name), "utf8"); } catch { return ""; }
};
const readDocFile = async (name: string) => {
  if (!validDocName(name)) return null;
  try { return await fs.readFile(path.join(DOC_ROOT, name), "utf8"); } catch { return null; }
};
const getSummary = (text: string) => text.split("\n").map((line) => line.trim()).find(Boolean)?.replace(/^#+\s*/, "") || "Documento de proyecto";
const readCatalog = async () => {
  const entries = await fs.readdir(DOC_ROOT, { withFileTypes: true });
  const project = await Promise.all(PROJECT_DOCS.map(async (name) => {
    const raw = await readProjectFile(name);
    return { id: `project:${name}`, path: name, title: name, summary: getSummary(raw), scope: "project" };
  }));
  const names = entries.filter((entry) => entry.isFile() && validDocName(entry.name)).map((entry) => entry.name).sort();
  const docs = await Promise.all(names.map(async (name) => {
    const raw = await readDocFile(name);
    return { id: `docs:${name}`, path: `docs/${name}`, title: name, summary: getSummary(raw || ""), scope: "docs" };
  }));
  return { project, docs };
};

const taskFromRow = (row: Record<string, unknown>): TaskEnvelope => ({
  id: String(row.id), title: String(row.title), objective: String(row.objective), phase: String(row.phase),
  state: row.state as TaskState, riskLevel: row.risk_level as TaskEnvelope["riskLevel"],
  approvedBy: row.approved_by ? String(row.approved_by) : null, updatedAt: String(row.updated_at),
});
const getTask = () => taskFromRow(database.prepare("SELECT * FROM task_state ORDER BY updated_at DESC LIMIT 1").get() as Record<string, unknown>);
const getTimeline = () => (database.prepare("SELECT * FROM timeline WHERE task_id = ? ORDER BY id DESC LIMIT 30").all(getTask().id) as Record<string, unknown>[]).map((row): TimelineEntry => ({
  id: Number(row.id), taskId: String(row.task_id), eventType: String(row.event_type), title: String(row.title),
  detail: String(row.detail), actor: row.actor as TimelineEntry["actor"], createdAt: String(row.created_at),
}));
const transitions: Record<TaskState, Partial<Record<ControlAction, TaskState>>> = {
  WAITING_APPROVAL: { approve: "APPROVED" }, APPROVED: { start: "IN_PROGRESS" },
  IN_PROGRESS: { pause: "PAUSED", review: "IN_REVIEW" }, PAUSED: { resume: "IN_PROGRESS" },
  IN_REVIEW: { accept: "ACCEPTED", request_changes: "IN_PROGRESS" }, ACCEPTED: {}, REJECTED: {},
};
const actionLabels: Record<ControlAction, [string, string]> = {
  approve: ["TASK_APPROVED", "Tarea aprobada"], start: ["TASK_STARTED", "Ejecución iniciada"],
  pause: ["TASK_PAUSED", "Tarea pausada"], resume: ["TASK_RESUMED", "Ejecución reanudada"],
  review: ["REVIEW_REQUESTED", "Revisión solicitada"], accept: ["TASK_ACCEPTED", "Resultado aceptado"],
  request_changes: ["CHANGES_REQUESTED", "Ajustes solicitados"],
};
const applyAction = (action: ControlAction) => {
  const task = getTask();
  const nextState = transitions[task.state][action];
  if (!nextState) return null;
  const timestamp = now();
  database.prepare("UPDATE task_state SET state = ?, updated_at = ? WHERE id = ?").run(nextState, timestamp, task.id);
  const [eventType, title] = actionLabels[action];
  database.prepare("INSERT INTO timeline (task_id, event_type, title, detail, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(task.id, eventType, title, `Transición ${task.state} → ${nextState}.`, "HUMAN", timestamp);
  return getTask();
};

const sendJson = (res: ServerResponse, payload: unknown, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
};
const readJson = async (req: IncomingMessage) => {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 10_000) throw new Error("request too large"); }
  return JSON.parse(body || "{}");
};
const api = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  if (url.pathname === "/api/health") return sendJson(res, { status: "ok", project: "AI Dev Control", phase: "Phase 1 — CONTROL PLANE", catalogedAt: now() });
  if (url.pathname === "/api/project-overview") return sendJson(res, { timestamp: now(), readme: await readProjectFile("README.md"), agents: await readProjectFile("AGENTS.md"), masterPrompt: await readProjectFile("MASTER-PROMPT.md") });
  if (url.pathname === "/api/control" && req.method === "GET") return sendJson(res, { phase: "PHASE 1 — CONTROL PLANE", task: getTask(), timeline: getTimeline(), guardrails, provider: { connected: false, label: "Sin proveedor" }, persistence: { engine: "SQLite", location: "Local" } });
  if (url.pathname === "/api/control/action" && req.method === "POST") {
    const body = await readJson(req) as { action?: ControlAction };
    if (!body.action || !actionLabels[body.action]) return sendJson(res, { error: "invalid action" }, 400);
    const task = applyAction(body.action);
    return task ? sendJson(res, { task, timeline: getTimeline() }) : sendJson(res, { error: "transition not allowed" }, 409);
  }
  if (url.pathname === "/api/docs") return sendJson(res, await readCatalog());
  if (url.pathname === "/api/repository" && req.method === "GET") return sendJson(res, await readRepository());
  if (url.pathname === "/api/doc") {
    const id = url.searchParams.get("id") || "";
    const [scope, name] = id.split(":");
    if (!name || !validDocName(name)) return sendJson(res, { error: "document not found" }, 404);
    const catalog = await readCatalog();
    const allowed = [...catalog.project, ...catalog.docs].some((doc) => doc.id === id);
    const raw = allowed ? (scope === "project" ? await readProjectFile(name) : await readDocFile(name)) : null;
    return raw ? sendJson(res, { id, path: scope === "project" ? name : `docs/${name}`, raw }) : sendJson(res, { error: "document not found" }, 404);
  }
  return false;
};

const serveProduction = async (res: ServerResponse, pathname: string) => {
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const distRoot = path.resolve(ROOT, "dist");
  const candidate = path.resolve(distRoot, relative);
  if (!candidate.startsWith(distRoot + path.sep) && candidate !== path.join(distRoot, "index.html")) return false;
  try {
    const data = await fs.readFile(candidate);
    const ext = path.extname(candidate);
    const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" }); res.end(data); return true;
  } catch {
    if (!existsSync(path.join(distRoot, "index.html"))) return false;
    const data = await fs.readFile(path.join(distRoot, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(data); return true;
  }
};

let vite: ViteDevServer | null = null;
if (!production) vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`);
    if (url.pathname.startsWith("/api/")) { const handled = await api(req, res, url); if (handled !== false) return; }
    if (vite) { vite.middlewares(req, res, (error: unknown) => { if (error) { res.statusCode = 500; res.end("development server error"); } }); return; }
    if (await serveProduction(res, url.pathname)) return;
    res.statusCode = 404; res.end("not found");
  } catch (error) { console.error(error); sendJson(res, { error: "server error" }, 500); }
});
server.listen(port, host, () => console.log(`AI Dev Control Phase 1 running at http://${host}:${port}`));

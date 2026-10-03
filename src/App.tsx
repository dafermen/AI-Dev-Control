import "./docs-theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ControlAction, ControlSnapshot, RepositorySnapshot, TaskState } from "./domain/contracts";
import { markdownToHtml } from "./lib/markdown";

type View = "control" | "repository" | "docs";
interface DocItem { id: string; path: string; title: string; summary: string; scope: "project" | "docs" }
interface Catalog { project: DocItem[]; docs: DocItem[] }
const stateLabels: Record<TaskState, string> = {
  WAITING_APPROVAL: "Esperando aprobación", APPROVED: "Aprobada", IN_PROGRESS: "En progreso",
  PAUSED: "Pausada", IN_REVIEW: "En revisión", ACCEPTED: "Aceptada", REJECTED: "Rechazada",
};
const actionByState: Partial<Record<TaskState, { action: ControlAction; label: string; primary?: boolean }[]>> = {
  WAITING_APPROVAL: [{ action: "approve", label: "Aprobar tarea", primary: true }],
  APPROVED: [{ action: "start", label: "Iniciar trabajo", primary: true }],
  IN_PROGRESS: [{ action: "review", label: "Enviar a revisión", primary: true }, { action: "pause", label: "Pausar" }],
  PAUSED: [{ action: "resume", label: "Reanudar", primary: true }],
  IN_REVIEW: [{ action: "accept", label: "Aceptar resultado", primary: true }, { action: "request_changes", label: "Solicitar ajustes" }],
};
const formatTime = (value: string) => new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(value));

function Icon({ name }: { name: "control" | "repository" | "docs" | "search" | "refresh" | "shield" | "database" | "activity" }) {
  const paths = {
    control: "M4 7h16M7 7v4m10-4v8M4 17h16M9 17v-5m6 5v3",
    repository: "M4 5h7l2 2h7v12H4zM4 9h16",
    docs: "M6 3h9l3 3v15H6zM14 3v4h4M9 11h6M9 15h6",
    search: "m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
    refresh: "M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6.4 6.6L4 11m16 2-2.4 4.4A7 7 0 0 1 5.5 15",
    shield: "M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6zM9 12l2 2 4-5",
    database: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Zm0 0v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6m-14 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6",
    activity: "M3 12h4l2-6 4 12 2-6h6",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function useDocumentationSearch(catalog: Catalog) {
  const [query, setQuery] = useState("");
  const [bodies,setBodies] = useState<Record<string,string>>({});
  useEffect(() => {
    if (!query.trim()) return;
    let active=true;
    const queue=[...catalog.project,...catalog.docs].filter(item => bodies[item.id]===undefined);
    const worker=async () => { while(active && queue.length) { const item=queue.shift(); if(!item) break; try { const response=await fetch(`/api/doc?id=${encodeURIComponent(item.id)}`); if(!response.ok) continue; const data=await response.json(); if(active && typeof data.raw==='string') setBodies(previous=>({...previous,[item.id]:data.raw})); } catch { /* Keep metadata search available. */ } } };
    void Promise.all([worker(),worker(),worker()]);
    return () => { active=false; };
  },[query,catalog]);
  const documents = useMemo(() => [...catalog.project, ...catalog.docs].filter((doc) => `${doc.title} ${doc.summary} ${bodies[doc.id] || ""}`.toLowerCase().includes(query.toLowerCase())), [catalog, query, bodies]);
  return {query,setQuery,documents};
}

function Sidebar({ view, setView, catalog, currentDoc, onOpenDoc }: { view: View; setView: (view: View) => void; catalog: Catalog; currentDoc: string; onOpenDoc: (id: string) => void }) {
  const {query,setQuery,documents}=useDocumentationSearch(catalog);
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">AI</div><div><strong>Dev Control</strong><span>Human control plane</span></div></div>
    <nav className="primary-nav" aria-label="Navegación principal">
      <button className={view === "control" ? "active" : ""} onClick={() => setView("control")}><Icon name="control" /><span>Centro de control</span></button>
      <button className={view === "repository" ? "active" : ""} onClick={() => setView("repository")}><Icon name="repository" /><span>Repositorio</span></button>
      <button aria-label="Documentación" className={view === "docs" ? "active" : ""} onClick={() => setView("docs")}><Icon name="docs" /><span>Documentación</span></button>
    </nav>
    {view === "docs" ? <div className="library">
      <label className="search-box"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar documentación" placeholder="Buscar documento..." /></label>
      <div className="library-count">{documents.length} documentos</div>
      <div className="doc-list">{documents.map((doc) => <button key={doc.id} className={currentDoc === doc.id ? "active" : ""} onClick={() => onOpenDoc(doc.id)}><span>{doc.scope === "project" ? "Proyecto" : "Guía"}</span><strong>{doc.title.replace(/\.md$/, "")}</strong></button>)}</div>
    </div> : <div className="phase-progress">
      <p>Progreso del proyecto</p><strong>Fase 1 de 4</strong>
      <div className="progress-track"><span /></div><small>Control plane local</small>
    </div>}
    <div className="sidebar-footer"><span className="online-dot" /><div><strong>Servicio local</strong><small>127.0.0.1:5182</small></div></div>
  </aside>;
}

function ControlDashboard({ snapshot, busy, onAction, onRefresh }: { snapshot: ControlSnapshot | null; busy: boolean; onAction: (action: ControlAction) => void; onRefresh: () => void }) {
  if (!snapshot) return <div className="loading-page"><span /><p>Preparando el centro de control...</p></div>;
  const actions = actionByState[snapshot.task.state] || [];
  return <main className="main-content control-view">
    <section className="hero"><div><p className="eyebrow">Fase 1 · Control plane</p><h1>El humano mantiene<br />el control.</h1><p>Estado, límites y evidencia de ejecución en un único lugar observable.</p></div><div className="hero-seal"><span>01</span><strong>Slice activo</strong><small>Local · Auditable</small></div></section>
    <section className="metric-grid">
      <article><span className="metric-icon coral"><Icon name="activity" /></span><div><small>Tarea activa</small><strong>{stateLabels[snapshot.task.state]}</strong><p>{snapshot.task.id}</p></div></article>
      <article><span className="metric-icon green"><Icon name="shield" /></span><div><small>Guardrails</small><strong>{snapshot.guardrails.filter((item) => item.enforced).length} activos</strong><p>Sin excepciones</p></div></article>
      <article><span className="metric-icon gold"><Icon name="database" /></span><div><small>Persistencia</small><strong>{snapshot.persistence.engine}</strong><p>{snapshot.persistence.location}</p></div></article>
      <article><span className="provider-pulse" /><div><small>Proveedor IA</small><strong>{snapshot.provider.label}</strong><p>Conexión bloqueada</p></div></article>
    </section>
    <div className="dashboard-grid">
      <section className="task-card panel-card">
        <div className="card-heading"><div><p className="eyebrow">Tarea en foco</p><h2>{snapshot.task.title}</h2></div><span className={`state-pill state-${snapshot.task.state.toLowerCase()}`}>{stateLabels[snapshot.task.state]}</span></div>
        <p className="task-objective">{snapshot.task.objective}</p>
        <div className="task-facts"><div><span>Identificador</span><strong>{snapshot.task.id}</strong></div><div><span>Riesgo</span><strong>{snapshot.task.riskLevel}</strong></div><div><span>Aprobado por</span><strong>{snapshot.task.approvedBy || "Pendiente"}</strong></div></div>
        <div className="task-boundary"><Icon name="shield" /><div><strong>Límite de este slice</strong><p>No se ejecutan agentes, repositorios ni comandos externos.</p></div></div>
        <div className="task-actions">{actions.map(({ action, label, primary }) => <button key={action} className={primary ? "primary-action" : "secondary-action"} disabled={busy} onClick={() => onAction(action)}>{label}</button>)}{!actions.length && <span className="accepted-message">Resultado cerrado por el operador.</span>}</div>
      </section>
      <section className="guardrail-card panel-card">
        <div className="card-heading"><div><p className="eyebrow">Políticas activas</p><h2>Guardrails</h2></div><span className="secure-label"><Icon name="shield" /> Enforced</span></div>
        <div className="guardrail-list">{snapshot.guardrails.map((policy) => <article key={policy.id}><span>✓</span><div><strong>{policy.label}</strong><p>{policy.description}</p></div></article>)}</div>
      </section>
    </div>
    <section className="timeline-card panel-card">
      <div className="card-heading"><div><p className="eyebrow">Evidencia observable</p><h2>Timeline local</h2></div><button className="icon-button" onClick={onRefresh} aria-label="Actualizar"><Icon name="refresh" /></button></div>
      <div className="timeline">{snapshot.timeline.map((event, index) => <article key={event.id}><div className={`timeline-marker ${event.actor.toLowerCase()}`}>{index === 0 ? <span /> : null}</div><time>{formatTime(event.createdAt)}</time><div><strong>{event.title}</strong><p>{event.detail}</p></div><span className="actor-label">{event.actor === "HUMAN" ? "Humano" : "Sistema"}</span></article>)}</div>
    </section>
  </main>;
}

function Documentation({ catalog, currentId, document, onOpen, theme, toggleTheme, onBack }: { catalog: Catalog; currentId: string; document: { path: string; raw: string } | null; onOpen: (id: string) => void; theme: string; toggleTheme: () => void; onBack: () => void }) {
  const all = [...catalog.project, ...catalog.docs];
  const {query,setQuery,documents:choices}=useDocumentationSearch(catalog);
  const index = all.findIndex(doc => doc.id === currentId);
  const current = all[index];
  const html = useMemo(() => markdownToHtml(document?.raw || ""), [document]);
  const article = useRef<HTMLElement>(null);
  const [toc,setToc] = useState<{id:string;title:string}[]>([]);
  const renderedArticle = useMemo(() => <article ref={article} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />, [html]);
  useEffect(() => {
    const root=article.current;
    if(!root) return;
    setToc([...root.querySelectorAll('h2,h3')].map(el=>({id:el.id,title:el.textContent || ''})));
    const controls: HTMLElement[]=[];
    root.querySelectorAll('pre').forEach(pre=>{
      const wrapper=window.document.createElement('div'); wrapper.className='innova-code';
      const button=window.document.createElement('button'); button.type='button'; button.textContent='Copiar código';
      const status=window.document.createElement('span'); status.setAttribute('role','status');
      button.onclick=async()=>{try { await navigator.clipboard.writeText(pre.textContent || ''); status.textContent='Copiado'; } catch { status.textContent='Selecciona el código para copiar'; }};
      pre.before(wrapper); wrapper.append(button,status); controls.push(wrapper);
    });
    return ()=>controls.forEach(control=>control.remove());
  },[html]);
  return <main className="main-content docs-view">
    <div className="docs-tools"><button onClick={onBack}>← Volver a la aplicación</button><button onClick={toggleTheme} aria-pressed={theme==='dark'}>Tema {theme==='dark'?'claro':'oscuro'}</button><label className="docs-reader-search">Buscar documentación<input type="search" value={query} onChange={event=>setQuery(event.target.value)} /></label><label>Documento <select value={currentId} onChange={event=>onOpen(event.target.value)}>{choices.map(item=><option key={item.id} value={item.id}>{item.title.replace(/\.md$/,'')}</option>)}</select></label></div>
    <div className="doc-header"><div><p className="eyebrow">{current?.scope === "project" ? "Documento del proyecto" : "Guía de implementación"}</p><h1>{current?.title.replace(/\.md$/, "") || "Documentación"}</h1><p>{current?.summary}</p></div><span className="path-chip">{document?.path}</span></div>
    {index===0 && <nav className="innova-paths" aria-label="Recorridos de lectura">{[['00-PROJECT','Conocer el producto'],['02-HUMAN','Aprender los controles'],['06-DEVELOPMENT','Explorar el desarrollo']].map(([prefix,label])=>{const item=all.find(doc=>doc.path.includes(prefix));return item?<a key={prefix} href={`#doc=${encodeURIComponent(item.id)}`} onClick={event=>{event.preventDefault();onOpen(item.id);}}><strong>{label}</strong></a>:null;})}</nav>}
    {!!toc.length && <details className="docs-toc" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}><summary>En esta página</summary><nav>{toc.map(item=><a key={item.id} href={`#${item.id}`}>{item.title}</a>)}</nav></details>}
    {renderedArticle}
    <nav className="doc-pagination" aria-label="Documentos anterior y siguiente"><button disabled={index <= 0} onClick={() => onOpen(all[index - 1]?.id)}><span>Anterior</span><strong>{all[index - 1]?.title.replace(/\.md$/, "") || "Inicio"}</strong></button><button disabled={index < 0 || index >= all.length - 1} onClick={() => onOpen(all[index + 1]?.id)}><span>Siguiente</span><strong>{all[index + 1]?.title.replace(/\.md$/, "") || "Final"}</strong></button></nav>
  </main>;
}

function RepositoryDashboard({ repository, onRefresh }: { repository: RepositorySnapshot | null; onRefresh: () => void }) {
  if (!repository) return <div className="loading-page"><span /><p>Inspeccionando el repositorio...</p></div>;
  return <main className="main-content repository-view">
    <section className="repository-hero">
      <div><p className="eyebrow">Fase 1 · Observador local</p><h1>Repositorio,<br />sin puntos ciegos.</h1><p>Una vista acotada y de solo lectura del estado del código.</p></div>
      <span className="readonly-badge"><Icon name="shield" /> Solo lectura</span>
    </section>
    {!repository.available ? <section className="repo-empty panel-card">
      <div className="repo-orbit"><span className="repo-folder"><Icon name="repository" /></span><i /><i /><i /></div>
      <p className="eyebrow">Estado detectado</p><h2>Repositorio aún no inicializado</h2>
      <p>La carpeta <strong>{repository.projectName}</strong> contiene el proyecto, pero todavía no tiene metadatos Git. El observador no realizará esa operación por cuenta propia.</p>
      <div className="repo-checks"><span>✓ Aplicación protegida</span><span>✓ Sin escrituras automáticas</span><span>✓ Lista para conectar</span></div>
      <button className="secondary-action" onClick={onRefresh}><Icon name="refresh" /> Volver a comprobar</button>
    </section> : <>
      {repository.state === "EMPTY" && <section className="empty-repo-banner"><span><Icon name="repository" /></span><div><p className="eyebrow">Conexión preparada</p><h2>Repositorio vacío, primer commit pendiente</h2><p>La rama <strong>{repository.branch}</strong> y el remoto están configurados. Crear el baseline requiere una nueva aprobación humana.</p></div></section>}
      <section className="repo-metrics">
        <article><small>Estado</small><strong>{repository.state === "EMPTY" ? "Sin commits" : repository.state === "CLEAN" ? "Sin cambios" : `${repository.changes.length} cambios`}</strong></article>
        <article><small>Rama</small><strong>{repository.branch}</strong></article>
        <article><small>Commit</small><strong>{repository.head || "Pendiente"}</strong></article>
        <article><small>Modo</small><strong>Solo lectura</strong></article>
      </section>
      <div className="repository-grid">
        <section className="panel-card repo-list"><div className="card-heading"><div><p className="eyebrow">Working tree</p><h2>Archivos observados</h2></div><button className="icon-button" onClick={onRefresh}><Icon name="refresh" /></button></div>{repository.changes.length ? repository.changes.map((file) => <article key={file.path}><span>{file.status}</span><strong>{file.path}</strong><small>{file.staged ? "Staged" : "Local"}</small></article>) : <p className="repo-clean">No hay cambios locales.</p>}</section>
        <section className="panel-card repo-list"><div className="card-heading"><div><p className="eyebrow">Historial</p><h2>Commits recientes</h2></div></div>{repository.recentCommits.map((commit) => <article key={commit.hash}><span>{commit.hash}</span><strong>{commit.subject}</strong><small>{commit.relativeDate}</small></article>)}</section>
      </div>
    </>}
    <p className="repo-timestamp">Última comprobación: {formatTime(repository.checkedAt)}</p>
  </main>;
}

export default function App() {
  const [view, setView] = useState<View>("control");
  const [snapshot, setSnapshot] = useState<ControlSnapshot | null>(null);
  const [repository, setRepository] = useState<RepositorySnapshot | null>(null);
  const [catalog, setCatalog] = useState<Catalog>({ project: [], docs: [] });
  const [currentDoc, setCurrentDoc] = useState("project:README.md");
  const [document, setDocument] = useState<{ path: string; raw: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const requestNumber=useRef(0);
  const [docsTheme,setDocsTheme]=useState(()=>{try{return localStorage.getItem('innovalogic-docs-theme')==='dark'?'dark':'light';}catch{return 'light';}});
  const toggleDocsTheme=()=>{const next=docsTheme==='dark'?'light':'dark';setDocsTheme(next);try{localStorage.setItem('innovalogic-docs-theme',next);}catch{/* Visit-only theme. */}};
  const loadControl = async () => setSnapshot(await (await fetch("/api/control")).json());
  const loadRepository = async () => setRepository(await (await fetch("/api/repository")).json());
  const openDocument = async (id: string) => { if (!id) return; const request=++requestNumber.current; const response=await fetch(`/api/doc?id=${encodeURIComponent(id)}`); if(!response.ok) return; const value=await response.json(); if(request!==requestNumber.current) return; setCurrentDoc(id); setDocument(value); };
  useEffect(() => { Promise.all([loadControl(), loadRepository(), fetch("/api/docs").then((response) => response.json()).then(setCatalog), openDocument(currentDoc)]).catch(console.error); }, []);
  const performAction = async (action: ControlAction) => {
    setBusy(true);
    try {
      const response = await fetch("/api/control/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!response.ok) throw new Error("Action rejected");
      await loadControl();
    } finally { setBusy(false); }
  };
  const viewLabel = view === "control" ? "Centro de control" : view === "repository" ? "Repositorio" : "Documentación";
  return <div className={`app-shell ${view === "docs" ? "innovalogic-docs" : ""}`} data-docs-theme={docsTheme}><Sidebar view={view} setView={setView} catalog={catalog} currentDoc={currentDoc} onOpenDoc={openDocument} /><section className="workspace"><header className="topbar"><div><p>AI Dev Control <span>/</span> {viewLabel}</p><strong>{view === "docs" ? document?.path : "PHASE 1 — CONTROL PLANE"}</strong></div><div className="topbar-status"><span /><div><strong>Sistema observable</strong><small>Sin agente conectado</small></div></div></header>{view === "control" ? <ControlDashboard snapshot={snapshot} busy={busy} onAction={performAction} onRefresh={loadControl} /> : view === "repository" ? <RepositoryDashboard repository={repository} onRefresh={loadRepository} /> : <Documentation theme={docsTheme} toggleTheme={toggleDocsTheme} onBack={() => setView("control")} catalog={catalog} currentId={currentDoc} document={document} onOpen={openDocument} />}</section></div>;
}

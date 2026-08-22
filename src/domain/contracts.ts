export type TaskState = "WAITING_APPROVAL" | "APPROVED" | "IN_PROGRESS" | "PAUSED" | "IN_REVIEW" | "ACCEPTED" | "REJECTED";
export type ControlAction = "approve" | "start" | "pause" | "resume" | "review" | "accept" | "request_changes";

export interface TaskEnvelope {
  id: string;
  title: string;
  objective: string;
  phase: string;
  state: TaskState;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  approvedBy: string | null;
  updatedAt: string;
}

export interface ExecutionCommand {
  id: string;
  taskId: string;
  kind: "OBSERVE" | "VALIDATE" | "EXECUTE";
  target: string;
  requestedBy: "HUMAN" | "SYSTEM";
  createdAt: string;
}

export interface ExecutionResult {
  commandId: string;
  status: "SUCCEEDED" | "FAILED" | "BLOCKED";
  summary: string;
  finishedAt: string;
}

export interface TimelineEntry {
  id: number;
  taskId: string;
  eventType: string;
  title: string;
  detail: string;
  actor: "HUMAN" | "SYSTEM";
  createdAt: string;
}

export interface GuardrailPolicy {
  id: string;
  label: string;
  description: string;
  enforced: boolean;
}

export interface ControlSnapshot {
  phase: string;
  task: TaskEnvelope;
  timeline: TimelineEntry[];
  guardrails: GuardrailPolicy[];
  provider: { connected: boolean; label: string };
  persistence: { engine: "SQLite"; location: "Local" };
}

export interface RepositoryFileChange {
  path: string;
  status: string;
  staged: boolean;
}

export interface RepositoryCommit {
  hash: string;
  subject: string;
  relativeDate: string;
}

export interface RepositorySnapshot {
  available: boolean;
  projectName: string;
  state: "NOT_INITIALIZED" | "EMPTY" | "CLEAN" | "CHANGES";
  branch: string | null;
  head: string | null;
  changes: RepositoryFileChange[];
  recentCommits: RepositoryCommit[];
  checkedAt: string;
  readOnly: true;
}

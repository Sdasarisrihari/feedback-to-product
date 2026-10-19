/** AI PRD documents (with revisions) and the human task-review workflow. */
import type { DraftTask } from "./types";
import type { GroundingReport, PrdContent, PrdSourceInput } from "./prd-schema";

export interface PrdRevision { at: string; by: "ai" | "human"; content: PrdContent; report: GroundingReport | null }
export interface AiPrd {
  id: string; themeId: string; themeName: string; createdAt: string; model: string;
  review: "draft" | "accepted" | "needs_changes";
  sources: PrdSourceInput; // snapshot of exactly what the citations were verified against
  revisions: PrdRevision[];
}

export const latest = (p: AiPrd) => p.revisions[p.revisions.length - 1]!;

export function tasksFromAiPrd(p: AiPrd): DraftTask[] {
  const c = latest(p).content;
  return c.stories.map((s) => ({
    id: `TASK-${p.id}-${s.id}`,
    themeId: p.themeId,
    title: `As a ${s.persona}, I want ${s.capability}, so that ${s.outcome}`,
    description: `${s.supported ? "Supported by verified customer evidence." : "NEEDS VALIDATION: no verified customer evidence."}\n\nSource PRD: ${c.title} (${p.id}, revision ${p.revisions.length})`,
    acceptance: s.acceptanceCriteria,
    evidenceIds: [...new Set(s.verified.map((v) => v.id))],
    status: "draft",
  }));
}

/** Append a revision; never overwrite history. */
export function addRevision(p: AiPrd, rev: PrdRevision): AiPrd {
  return { ...p, revisions: [...p.revisions, rev], review: "draft" };
}

export type TaskAction = { type: "approve" | "reject"; id: string; at: string } | { type: "edit"; id: string; title: string; description: string } | { type: "add"; tasks: DraftTask[] };

/** Pure reducer for the human-review workflow. Edits reset approval; duplicate task IDs are ignored (idempotent). */
export function reduceTasks(tasks: DraftTask[], a: TaskAction): DraftTask[] {
  switch (a.type) {
    case "add": {
      const ids = new Set(tasks.map((t) => t.id));
      return [...tasks, ...a.tasks.filter((t) => !ids.has(t.id))];
    }
    case "approve":
    case "reject":
      return tasks.map((t) => (t.id === a.id ? { ...t, status: a.type === "approve" ? "approved" : "rejected", reviewedAt: a.at } : t));
    case "edit":
      return tasks.map((t) => (t.id === a.id ? { ...t, title: a.title, description: a.description, status: "draft", reviewedAt: undefined } : t));
  }
}

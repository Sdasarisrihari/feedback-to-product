/**
 * TEMPLATE drafts (Phase 2). Assembled deterministically from an insight and its evidence —
 * not LLM-written. Phase 3 replaces `buildPrdDraft` with a server-side model call that
 * returns the same shape, validated against a schema.
 */
import type { DraftTask, FeedbackRecord, Insight } from "./types";

export interface UserStory { id: string; persona: string; want: string; benefit: string; acceptance: string[]; evidenceIds: string[] }
export interface PrdDraft {
  themeId: string;
  title: string;
  problem: string;
  evidenceSummary: string;
  goals: string[];
  nonGoals: string[];
  openQuestions: string[];
  stories: UserStory[];
  nextActions: string[];
  generator: "template" | "llm";
}

const SEGMENT_PERSONA: Record<string, string> = {
  enterprise: "workspace admin at an enterprise customer",
  mid_market: "team lead at a mid-market customer",
  smb: "member of a small team",
  unknown: "Trellis user",
};

export function buildPrdDraft(insight: Insight, records: FeedbackRecord[]): PrdDraft {
  const byId = new Map(records.map((r) => [r.id, r]));
  const ev = insight.evidence.slice(0, 6);
  const segs = [...new Set(ev.map((e) => byId.get(e.id)?.segment ?? "unknown"))];
  const stories: UserStory[] = ev.slice(0, 3).map((e, i) => {
    const seg = byId.get(e.id)?.segment ?? "unknown";
    return {
      id: `US-${insight.themeId}-${i + 1}`,
      persona: SEGMENT_PERSONA[seg] ?? "Trellis user",
      want: `the problem described in ${e.id} to be resolved in ${insight.productArea}`,
      benefit: "I can rely on Trellis for this part of my workflow",
      acceptance: [
        `Given the scenario reported in ${e.id}, when the user repeats it, then the reported failure does not occur.`,
        "The behaviour is covered by an automated test.",
        "[PM to refine with specific, measurable criteria]",
      ],
      evidenceIds: [e.id],
    };
  });
  return {
    themeId: insight.themeId,
    title: `PRD: ${insight.name}`,
    problem: `${insight.frequency} feedback records (${segs.join(", ")}) match the "${insight.productArea}" theme. Representative evidence is quoted below; the problem statement should be refined by the PM.`,
    evidenceSummary: ev.map((e) => `${e.id}: "${e.excerpt}"`).join("\n"),
    goals: [`Reduce feedback volume for "${insight.name}" [target to be set by PM — no baseline measured yet]`],
    nonGoals: ["[PM to define]"],
    openQuestions: [
      "How many affected accounts does this represent outside this sample?",
      "Is there usage telemetry that confirms or contradicts the reported pattern?",
      insight.confidence !== "high" ? `Evidence confidence is ${insight.confidence}: ${insight.confidenceReason}` : "Which segment should be prioritized first?",
    ],
    stories,
    nextActions: ["Validate theme with 3–5 customer conversations", "Confirm effort estimate with engineering", "Review and approve draft tasks"],
    generator: "template",
  };
}

export function tasksFromPrd(prd: PrdDraft): DraftTask[] {
  return prd.stories.map((s) => ({
    id: `TASK-${s.id}`,
    themeId: prd.themeId,
    title: `As a ${s.persona}, I want ${s.want}`,
    description: `So that ${s.benefit}.\n\nSource: ${prd.title}`,
    acceptance: s.acceptance,
    evidenceIds: s.evidenceIds,
    status: "draft",
  }));
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

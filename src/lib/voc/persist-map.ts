/**
 * Pure mapping between the in-app workspace and database rows, plus row-level diffing.
 * Owner IDs are never set here — the server stamps them from the verified session.
 */
import type { AiPrd } from "./drafts";
import type { ProductDoc } from "./docs";
import type { DraftTask, FeedbackRecord, ImportRun, Insight, Weights } from "./types";

export const TABLES = ["feedback_records", "import_runs", "product_docs", "doc_sections", "analysis_runs", "ai_analyses", "ai_prds", "prd_revisions", "draft_tasks", "workspace_settings"] as const;
export type Table = (typeof TABLES)[number];
export type Row = Record<string, unknown>;
export type Rows = Record<Table, Row[]>;

/** Upsert order respects foreign keys; deletes run in reverse. */
export const UPSERT_ORDER: Table[] = ["workspace_settings", "feedback_records", "import_runs", "product_docs", "doc_sections", "analysis_runs", "ai_analyses", "ai_prds", "prd_revisions", "draft_tasks"];
export const INSERT_ONLY: Table[] = ["prd_revisions"];

export function rowKey(t: Table, r: Row): string {
  if (t === "prd_revisions") return `${r["prd_id"]}:${r["rev_no"]}`;
  if (t === "ai_analyses" || t === "workspace_settings") return "self";
  return String(r["id"]);
}

export interface RunLite { id: string; at: string; method: "bm25-baseline" | "llm"; model?: string | undefined; records: number; themes: number; durationMs: number }
export interface LlmState { ok: true; model: string; durationMs: number; inputCount: number; truncated: boolean; insights: Insight[]; notes: string; at: string; signature: string }
export interface WorkspaceData {
  records: FeedbackRecord[]; imports: ImportRun[]; runs: RunLite[]; weights: Weights; effort: Record<string, number>;
  docs: ProductDoc[]; aiPrds: AiPrd[]; tasks: DraftTask[]; llm: LlmState | null; browserImportDone: boolean;
}

export function toRows(w: WorkspaceData): Rows {
  return {
    workspace_settings: [{ weights: w.weights, effort: w.effort, browser_import_done: w.browserImportDone }],
    feedback_records: w.records.map((r) => ({ id: r.id, source: r.source, segment: r.segment, feedback_date: r.createdAt, rating: r.rating, body: r.text, import_id: r.importId, line: r.line, warnings: r.warnings, duplicate_of: r.duplicateOf ?? null, suspected_injection: r.suspectedInjection })),
    import_runs: w.imports.map((i) => ({ id: i.id, filename: i.filename, imported_at: i.at, total: i.total, accepted: i.accepted, duplicates: i.duplicates, warnings: i.warnings, rejected: i.rejected, fatal_error: i.fatalError ?? null })),
    product_docs: w.docs.map((d) => ({ id: d.id, title: d.title, version: d.version, kind: d.kind, filename: d.filename, imported_at: d.importedAt, warnings: d.warnings })),
    doc_sections: w.docs.flatMap((d) => d.sections.map((s, i) => ({ id: s.id, doc_id: d.id, position: i, heading: s.heading, page: s.page, body: s.text, suspected_injection: s.suspectedInjection }))),
    analysis_runs: w.runs.map((r) => ({ id: r.id, method: r.method, model: r.model ?? null, status: "succeeded", record_count: r.records, theme_count: r.themes, duration_ms: r.durationMs, ran_at: r.at })),
    ai_analyses: w.llm ? [{ run_id: w.runs.find((r) => r.method === "llm")?.id ?? "unknown", model: w.llm.model, analysed_at: w.llm.at, signature: w.llm.signature, input_count: w.llm.inputCount, truncated: w.llm.truncated, duration_ms: w.llm.durationMs, notes: w.llm.notes, insights: w.llm.insights }] : [],
    ai_prds: w.aiPrds.map((p) => ({ id: p.id, theme_id: p.themeId, theme_name: p.themeName, model: p.model, review: p.review, sources: p.sources, created_at: p.createdAt })),
    prd_revisions: w.aiPrds.flatMap((p) => p.revisions.map((r, i) => ({ prd_id: p.id, rev_no: i + 1, author: r.by, content: r.content, report: r.report, created_at: r.at }))),
    draft_tasks: w.tasks.map((t) => ({ id: t.id, theme_id: t.themeId, title: t.title, description: t.description, acceptance: t.acceptance, evidence_ids: t.evidenceIds, status: t.status, reviewed_at: t.reviewedAt ?? null })),
  };
}

const s = (v: unknown) => String(v ?? "");
const iso = (v: unknown) => (v ? new Date(String(v)).toISOString() : "");

export function fromRows(rows: Partial<Rows>, defaults: { weights: Weights }): WorkspaceData {
  const settings = rows.workspace_settings?.[0];
  const sections = rows.doc_sections ?? [];
  const revs = rows.prd_revisions ?? [];
  const a = rows.ai_analyses?.[0];
  return {
    weights: (settings?.["weights"] as Weights) ?? defaults.weights,
    effort: (settings?.["effort"] as Record<string, number>) ?? {},
    browserImportDone: Boolean(settings?.["browser_import_done"]),
    records: (rows.feedback_records ?? []).map((r) => ({
      id: s(r["id"]), source: s(r["source"]) as FeedbackRecord["source"], segment: s(r["segment"]) as FeedbackRecord["segment"], createdAt: s(r["feedback_date"]),
      rating: (r["rating"] as number | null) ?? null, text: s(r["body"]), importId: s(r["import_id"]), line: Number(r["line"]), warnings: (r["warnings"] as string[]) ?? [],
      duplicateOf: (r["duplicate_of"] as string | null) ?? undefined, suspectedInjection: Boolean(r["suspected_injection"]),
    })).sort((x, y) => x.importId.localeCompare(y.importId) || x.line - y.line),
    imports: (rows.import_runs ?? []).map((i) => ({
      id: s(i["id"]), filename: s(i["filename"]), at: iso(i["imported_at"]), total: Number(i["total"]), accepted: Number(i["accepted"]), duplicates: Number(i["duplicates"]), warnings: Number(i["warnings"]),
      rejected: (i["rejected"] as ImportRun["rejected"]) ?? [], ...(i["fatal_error"] ? { fatalError: s(i["fatal_error"]) } : {}),
    })).sort((x, y) => y.at.localeCompare(x.at)),
    docs: (rows.product_docs ?? []).map((d) => ({
      id: s(d["id"]), title: s(d["title"]), version: s(d["version"]), kind: s(d["kind"]) as ProductDoc["kind"], filename: s(d["filename"]), importedAt: iso(d["imported_at"]), warnings: (d["warnings"] as string[]) ?? [],
      sections: sections.filter((x) => x["doc_id"] === d["id"]).sort((x, y) => Number(x["position"]) - Number(y["position"]))
        .map((x) => ({ id: s(x["id"]), docId: s(d["id"]), heading: s(x["heading"]), page: (x["page"] as number | null) ?? null, text: s(x["body"]), suspectedInjection: Boolean(x["suspected_injection"]) })),
    })).sort((x, y) => x.importedAt.localeCompare(y.importedAt)),
    runs: (rows.analysis_runs ?? []).map((r) => ({ id: s(r["id"]), at: iso(r["ran_at"]), method: s(r["method"]) as RunLite["method"], model: (r["model"] as string | null) ?? undefined, records: Number(r["record_count"]), themes: Number(r["theme_count"]), durationMs: Number(r["duration_ms"]) }))
      .sort((x, y) => y.at.localeCompare(x.at)),
    llm: a ? { ok: true, model: s(a["model"]), at: iso(a["analysed_at"]), signature: s(a["signature"]), inputCount: Number(a["input_count"]), truncated: Boolean(a["truncated"]), durationMs: Number(a["duration_ms"]), notes: s(a["notes"]), insights: a["insights"] as Insight[] } : null,
    aiPrds: (rows.ai_prds ?? []).map((p) => ({
      id: s(p["id"]), themeId: s(p["theme_id"]), themeName: s(p["theme_name"]), model: s(p["model"]), review: s(p["review"]) as AiPrd["review"], sources: p["sources"] as AiPrd["sources"], createdAt: iso(p["created_at"]),
      revisions: revs.filter((r) => r["prd_id"] === p["id"]).sort((x, y) => Number(x["rev_no"]) - Number(y["rev_no"]))
        .map((r) => ({ at: iso(r["created_at"]), by: s(r["author"]) as "ai" | "human", content: r["content"] as AiPrd["revisions"][number]["content"], report: (r["report"] as AiPrd["revisions"][number]["report"]) ?? null })),
    })).filter((p) => p.revisions.length > 0).sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
    tasks: (rows.draft_tasks ?? []).map((t) => ({
      id: s(t["id"]), themeId: s(t["theme_id"]), title: s(t["title"]), description: s(t["description"]), acceptance: (t["acceptance"] as string[]) ?? [], evidenceIds: (t["evidence_ids"] as string[]) ?? [],
      status: s(t["status"]) as DraftTask["status"], ...(t["reviewed_at"] ? { reviewedAt: iso(t["reviewed_at"]) } : {}),
    })),
  };
}

export interface RowDiff { upserts: Partial<Rows>; deletes: Partial<Record<Table, string[]>> }

/** Rows that changed or were added get upserted; rows that disappeared get deleted (never for insert-only tables). */
export function diffRows(prev: Rows | null, next: Rows): RowDiff {
  const out: RowDiff = { upserts: {}, deletes: {} };
  for (const t of TABLES) {
    const before = new Map((prev?.[t] ?? []).map((r) => [rowKey(t, r), JSON.stringify(r)]));
    const changed = next[t].filter((r) => before.get(rowKey(t, r)) !== JSON.stringify(r));
    if (changed.length) out.upserts[t] = changed;
    if (!INSERT_ONLY.includes(t) && t !== "workspace_settings") {
      const now = new Set(next[t].map((r) => rowKey(t, r)));
      const gone = [...before.keys()].filter((k) => !now.has(k));
      if (gone.length) out.deletes[t] = gone;
    }
  }
  return out;
}

export const isEmptyDiff = (d: RowDiff) => !Object.keys(d.upserts).length && !Object.keys(d.deletes).length;

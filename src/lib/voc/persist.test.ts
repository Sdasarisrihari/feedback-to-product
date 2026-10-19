import { describe, expect, it } from "vitest";
import { parseFeedbackCsv } from "./csv";
import { DEFAULT_WEIGHTS } from "./prioritize";
import { diffRows, fromRows, isEmptyDiff, toRows, type WorkspaceData } from "./persist-map";
import { SAMPLE_CSV } from "./sample-data";
import { sampleDocs } from "./sample-docs";
import type { AiPrd } from "./drafts";

function build(): WorkspaceData {
  const { run, records } = parseFeedbackCsv(SAMPLE_CSV, "s.csv", [], "imp_sample");
  const prd: AiPrd = {
    id: "PRD-1", themeId: "t", themeName: "T", createdAt: "2026-10-19T00:00:00.000Z", model: "m", review: "draft",
    sources: { theme: { name: "T", summary: "", productArea: "", kind: "pain_point" }, feedback: [], docs: [] },
    revisions: [{ at: "2026-10-19T00:00:00.000Z", by: "ai", content: { title: "x" } as never, report: null }],
  };
  return {
    records, imports: [run], runs: [{ id: "run_1", at: "2026-10-19T00:00:00.000Z", method: "llm", model: "m", records: 47, themes: 7, durationMs: 1 }],
    weights: DEFAULT_WEIGHTS, effort: { sync: 4 }, docs: sampleDocs(), aiPrds: [prd],
    tasks: [{ id: "T1", themeId: "t", title: "a", description: "b", acceptance: ["c"], evidenceIds: ["FB-1001"], status: "approved", reviewedAt: "2026-10-19T00:00:00.000Z" }],
    llm: null, browserImportDone: true,
  };
}

const FIXTURE = build();
const ws = (): WorkspaceData => structuredClone(FIXTURE);

describe("persistence mapping", () => {
  it("round-trips the workspace through database rows without losing source IDs", () => {
    const w = ws();
    const back = fromRows(toRows(w), { weights: DEFAULT_WEIGHTS });
    expect(back.records.map((r) => r.id)).toEqual(w.records.map((r) => r.id));
    expect(back.records.find((r) => r.id === "FB-1045")!.duplicateOf).toBe("FB-1001");
    expect(back.docs[0]!.sections.map((s) => s.id)).toEqual(w.docs[0]!.sections.map((s) => s.id));
    expect(back.aiPrds[0]!.revisions).toHaveLength(1);
    expect(back.tasks[0]).toEqual(w.tasks[0]);
    expect(back.effort).toEqual({ sync: 4 });
  });
  it("diff is empty when nothing changed", () => {
    const r = toRows(ws());
    expect(isEmptyDiff(diffRows(r, toRows(ws())))).toBe(true);
  });
  it("only changed rows are upserted (concurrent edits to other rows are not overwritten)", () => {
    const a = ws(); const b = ws();
    b.tasks = [{ ...b.tasks[0]!, status: "rejected" }];
    const d = diffRows(toRows(a), toRows(b));
    expect(Object.keys(d.upserts)).toEqual(["draft_tasks"]);
    expect(d.upserts.draft_tasks).toHaveLength(1);
  });
  it("removed docs are deleted; PRD revisions are append-only and never deleted", () => {
    const a = ws(); const b = ws();
    b.docs = b.docs.slice(1);
    b.aiPrds = [{ ...b.aiPrds[0]!, revisions: [] }];
    const d = diffRows(toRows(a), toRows(b));
    expect(d.deletes.product_docs).toEqual([a.docs[0]!.id]);
    expect(d.deletes.prd_revisions).toBeUndefined();
  });
  it("first sync from empty uploads everything (browser import)", () => {
    const d = diffRows(null, toRows(ws()));
    expect(d.upserts.feedback_records).toHaveLength(ws().records.length);
    expect(d.deletes).toEqual({});
  });
  it("rows never carry an owner id from the client", () => {
    const r = toRows(ws());
    Object.values(r).flat().forEach((row) => expect(row).not.toHaveProperty("owner_id"));
  });
});

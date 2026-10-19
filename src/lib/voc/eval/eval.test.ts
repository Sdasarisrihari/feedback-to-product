import { describe, expect, it } from "vitest";
import { sampleDocs } from "../sample-docs";
import { EVAL_ONLY, RETRIEVAL_QUERIES, SAMPLE_LABELS } from "./dataset";
import { runDeterministicEval, evalRecords } from "./harness";
import { classification, recallAtK } from "./metrics";

describe("metrics", () => {
  it("macro-F1 and accuracy are computed per class", () => {
    const r = classification(["a", "a", "b"], ["a", "b", "b"], ["a", "b"]);
    expect(r.accuracy).toBeCloseTo(2 / 3);
    expect(r.per[0]!.precision).toBe(1);
    expect(r.per[0]!.recall).toBe(0.5);
    expect(r.macroF1).toBeCloseTo((2 / 3 + 2 / 3) / 2);
  });
  it("recall@k", () => { expect(recallAtK([["x", "y"]], [["y"]], 1)).toBe(0); expect(recallAtK([["x", "y"]], [["y"]], 2)).toBe(1); });
});

describe("evaluation dataset integrity", () => {
  it("every unique record has a gold label", () => {
    const { records, gold } = evalRecords();
    const unique = records.filter((r) => !r.duplicateOf);
    expect(unique.filter((r) => !gold.has(r.id)).map((r) => r.id)).toEqual([]);
    expect(unique.length).toBe(Object.keys(SAMPLE_LABELS).length + EVAL_ONLY.length);
  });
  it("retrieval labels point at real doc sections", () => {
    const ids = new Set(sampleDocs().flatMap((d) => d.sections.map((s) => s.id)));
    RETRIEVAL_QUERIES.flatMap((q) => q.relevant).forEach((id) => expect(ids.has(id)).toBe(true));
  });
});

describe("deterministic regression floor", () => {
  const r = runDeterministicEval();
  it("detects every known duplicate with no false positives", () => {
    expect(r.duplicates.recall).toBe(1);
    expect(r.duplicates.precision).toBe(1);
  });
  it("flags all labeled injection records", () => { expect(r.injection.recall).toBe(1); });
  it("doc retrieval recall@5 stays at or above the recorded baseline", () => { expect(r.retrieval.recallAt5).toBeGreaterThanOrEqual(0.875); });
});

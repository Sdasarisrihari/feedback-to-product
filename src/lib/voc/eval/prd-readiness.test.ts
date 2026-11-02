import { describe, expect, it } from "vitest";
import { PRD_SCENARIOS } from "./prd-inputs-v1";
import { PRD_EXPECTATIONS } from "./prd-labels-v1";
import { completeReadiness, READINESS_CATEGORIES } from "./prd-readiness";
import { buildPrdPrompt } from "../prompt";
describe("PRD challenge isolation", () => {
  it("keeps six distinct cases and all fourteen feedback source IDs", () => {
    expect(PRD_SCENARIOS.length).toBe(6);
    expect(new Set(PRD_SCENARIOS.flatMap((s) => s.input.feedback.map((f) => f.id))).size).toBe(14);
    expect(Object.keys(PRD_EXPECTATIONS).sort()).toEqual(PRD_SCENARIOS.map((s) => s.id).sort());
  });
  it("does not submit scoring-only rationale to generation", () => {
    for (const s of PRD_SCENARIOS) expect(buildPrdPrompt(s.input)).not.toContain(PRD_EXPECTATIONS[s.id]?.rationale);
  });
  it("preserves both opposing planning sources without precedence", () => {
    const s = PRD_SCENARIOS.find((x) => x.id === "syn-03");
    expect(s?.input.docs.map((d) => d.id)).toEqual(["doc-301", "doc-302"]);
    expect(s?.input.docs[0]?.text).toContain("out of scope");
    expect(s?.input.docs[1]?.text).toContain("committed");
  });
  it("rejects incomplete or repeated assessment categories", () => {
    const row = { category: "traceability" as const, status: "pass" as const, rationale: "fixture", representativeFailure: "" };
    expect(completeReadiness({ assessments: [row] })).toBe(false);
    expect(completeReadiness({ assessments: READINESS_CATEGORIES.map(() => row) })).toBe(false);
    expect(completeReadiness({ assessments: READINESS_CATEGORIES.map((category) => ({ ...row, category })) })).toBe(true);
  });
});
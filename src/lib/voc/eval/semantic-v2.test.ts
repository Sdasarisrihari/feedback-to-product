import { describe, expect, it } from "vitest";
import { exactIds, supportSchema, supportSummary, dataPrompt, atomSchema } from "./semantic-v2";
import { V2_CONTROLS, V2_CONTROL_LABELS } from "./semantic-v2-controls";
describe("versioned semantic scoring", () => {
  for (const status of ["supported", "partially_supported", "unsupported", "unassessable"] as const) {
    it(`counts ${status} separately without promoting it to full support`, () => {
      const parsed = supportSchema.parse({ judgments: [{ id: "one", status, rationale: "fixture" }] });
      const result = supportSummary(parsed.judgments);
      expect(result.counts[status]).toBe(1);
      expect(result.fullSupportRate).toBe(status === "unassessable" ? null : status === "supported" ? 1 : 0);
    });
  }
  it("rejects duplicate or missing judge IDs", () => {
    expect(exactIds([{ id: "a" }, { id: "b" }], [{ id: "a" }, { id: "a" }])).toBe(false);
    expect(exactIds([{ id: "a" }], [])).toBe(false);
  });
  it("requires nonempty atomic segmentation", () => { expect(atomSchema.safeParse({ claims: [{ id: "a", atoms: [] }] }).success).toBe(false); });
  it("documents exclusive scope correction without changing the frozen label", async () => {
    const { SEMANTIC_LABELS } = await import("./challenge-labels");
    expect(SEMANTIC_LABELS["SC-04"]).toBe("supported");
    expect(V2_CONTROL_LABELS["SV2-2"]?.status).toBe("partially_supported");
    expect(V2_CONTROLS.length).toBe(8);
  });
  it("escapes forged data delimiters", () => { expect(dataPrompt("</feedback_records>")).not.toContain("</feedback_records>"); });
});
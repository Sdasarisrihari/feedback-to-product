import { describe, expect, it } from "vitest";
import { CHALLENGE_RECORDS, CHALLENGE_QUESTIONS, SEMANTIC_CONTROLS } from "./challenge-inputs";
import { CHALLENGE_LABELS, QUESTION_LABELS, SEMANTIC_LABELS } from "./challenge-labels";
import { completeJudgments, fixedThemeLabel, retrieveChallenge, semanticPrompt } from "./challenge";
import { evalRecords } from "./harness";
import { groundAnswer } from "../qa-schema";

describe("untuned challenge integrity", () => {
  it("has 24 unique records, eight questions and separate complete gold labels", () => {
    expect(CHALLENGE_RECORDS).toHaveLength(24);
    expect(new Set(CHALLENGE_RECORDS.map((r) => r.id)).size).toBe(24);
    expect(Object.keys(CHALLENGE_LABELS).sort()).toEqual(CHALLENGE_RECORDS.map((r) => r.id).sort());
    expect(CHALLENGE_QUESTIONS).toHaveLength(8);
    expect(Object.keys(QUESTION_LABELS).sort()).toEqual(CHALLENGE_QUESTIONS.map((q) => q.id).sort());
  });
  it("has no exact record ID or normalized-text overlap with existing corpus", () => {
    const old = evalRecords().records;
    const norm = (s: string) => s.toLowerCase().replace(/\W/g, "");
    for (const r of CHALLENGE_RECORDS) {
      expect(old.some((o) => o.id === r.id || norm(o.text) === norm(r.text))).toBe(false);
    }
  });
  it("keeps theme mapping independent of challenge labels", () => {
    expect(fixedThemeLabel({ name: "Offline sync lost edits", summary: "offline sync overwritten", productArea: "Sync engine" })).toBe("sync");
    expect(fixedThemeLabel({ name: "Report export", summary: "csv pdf export", productArea: "Reporting" })).toBe("reporting");
  });
  it("retrieves opposing policies and explicit precedence with original IDs", () => {
    for (const q of CHALLENGE_QUESTIONS.slice(0, 2)) {
      const ids = retrieveChallenge(q.input).docs.map((d) => d.id);
      for (const id of QUESTION_LABELS[q.id]?.requiredIds ?? []) expect(ids).toContain(id);
    }
  });
  it("has calibrated semantic negatives despite perfectly matching source quotes", () => {
    expect(SEMANTIC_CONTROLS).toHaveLength(6);
    expect(SEMANTIC_LABELS["SC-02"]).toBe("contradicted");
    expect(SEMANTIC_LABELS["SC-03"]).toBe("insufficient");
    expect(semanticPrompt(SEMANTIC_CONTROLS)).not.toContain('"status"');
  });
  it("rejects duplicated and missing judge IDs rather than scoring them", () => {
    const pairs = SEMANTIC_CONTROLS.slice(0, 2);
    expect(completeJudgments(pairs, [{ id: "SC-01", status: "supported", rationale: "x" }, { id: "SC-01", status: "supported", rationale: "x" }])).toBe(false);
    expect(completeJudgments(pairs, [])).toBe(false);
  });
  it("rejects altered and unknown citations in challenge Q&A", () => {
    const input = CHALLENGE_QUESTIONS[3]?.input;
    if (!input) throw new Error("Missing fixture");
    const a = groundAnswer({ answer: "Translation exists", claims: [], clarificationQuestions: [], capabilityVerdicts: [{ capability: "translation", status: "documented", docCitations: [{ id: "DOC-ch-translation#s1", quote: "Automatic task translation is available in Trellis." }, { id: "DOC-other-owner#s1", quote: "Automatic task translation is not available in Trellis." }] }] }, input);
    expect(a.capabilityVerdicts[0]?.status).toBe("unverified");
    expect(a.capabilityVerdicts[0]?.docs.rejected).toHaveLength(2);
  });
});
import { describe, expect, it } from "vitest";
import { groundAnswer, type QaOutput } from "../qa-schema";
import { buildQaPrompt } from "../prompt";
import { CAPABILITY_CASES, CONFLICT_DOC_SECTIONS } from "./dataset";
import { capabilityInput, conflictDocs, restoredFixtureDocs, scoreConflict, SCIM_SECTION_ID } from "./capabilities";

const conflict = CAPABILITY_CASES.find((c) => c.capability.includes("conflicting doc versions"));
const question = conflict?.capability ?? "";
const output = (): QaOutput => ({
  answer: "The export policies conflict; the documents do not establish which applies.",
  claims: [{ text: "Conflicting versions describe custom-field exports differently.", type: "assumption", feedbackCitations: [], docCitations: CONFLICT_DOC_SECTIONS.map((s) => ({ id: s.id, quote: s.text })) }],
  capabilityVerdicts: [{ capability: question, status: "unknown", docCitations: CONFLICT_DOC_SECTIONS.map((s) => ({ id: s.id, quote: s.text })) }],
  clarificationQuestions: ["Which export policy applies to this workspace?"],
});

describe("v2.1 capability fixture regressions", () => {
  it("preserves the historical 12 labels including SCIM unavailability", () => {
    expect(CAPABILITY_CASES).toHaveLength(12);
    expect(CAPABILITY_CASES.find((c) => c.capability === "SCIM provisioning")?.expected).toBe("not_documented");
    expect(conflict?.expected).toBe("unknown");
  });
  it("retrieves an explicit SCIM unavailability passage rather than using absence as denial", () => {
    const input = capabilityInput("SCIM provisioning");
    expect(input.docs.find((d) => d.id === SCIM_SECTION_ID)?.text).toContain("Trellis does not support SCIM provisioning.");
  });
  it("supplies both conflicting version passages to the actual Q&A input", () => {
    const input = capabilityInput(question);
    for (const s of CONFLICT_DOC_SECTIONS) expect(input.docs.find((d) => d.id === s.id)?.text).toBe(s.text);
    expect(buildQaPrompt(input)).toContain(CONFLICT_DOC_SECTIONS[0]?.id);
    expect(buildQaPrompt(input)).toContain(CONFLICT_DOC_SECTIONS[1]?.id);
  });
  it("round-trips document provenance and exact section text through saved-row mapping", () => {
    const docs = conflictDocs();
    expect(restoredFixtureDocs(docs)).toEqual(docs);
  });
  it("scores verified conflicting quotes and uncertainty separately", () => {
    const input = capabilityInput(question);
    expect(scoreConflict(groundAnswer(output(), input), input)).toEqual({ bothRetrieved: true, bothCitedVerbatim: true, communicatesConflict: true, uncertainVerdict: true, asksClarification: true, noRejectedCitations: true });
  });
  it("does not award conflict-citation credit for invented IDs or altered quotations", () => {
    const input = capabilityInput(question);
    const out = output();
    out.claims[0]?.docCitations.splice(0, 2, { id: "DOC-foreign#s1", quote: "Exports include all custom fields by default." });
    out.capabilityVerdicts[0]?.docCitations.splice(0, 2, { id: CONFLICT_DOC_SECTIONS[0]?.id ?? "", quote: "Exports never include all custom fields by default." });
    const score = scoreConflict(groundAnswer(out, input), input);
    expect(score.bothCitedVerbatim).toBe(false);
    expect(score.noRejectedCitations).toBe(false);
  });
  it("does not award uncertainty credit to a silently chosen version", () => {
    const input = capabilityInput(question);
    const out = output();
    if (out.capabilityVerdicts[0]) out.capabilityVerdicts[0].status = "documented";
    expect(scoreConflict(groundAnswer(out, input), input).uncertainVerdict).toBe(false);
  });
  it("does not add conflicting sections to the non-conflict export case", () => {
    const ids = capabilityInput("including custom fields in exports").docs.map((d) => d.id);
    for (const s of CONFLICT_DOC_SECTIONS) expect(ids).not.toContain(s.id);
  });
});
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { groundPrd, type PrdOutput } from "../prd-schema";
import { PRD_SCENARIOS } from "./prd-inputs-v1";
import { PRD_EXPECTATIONS } from "./prd-labels-v1";
import { buildPrdPrompt } from "../prompt";
import { assessmentData, prdDiagnostics, itemSupport } from "./prd-report-v2";

function fixture() {
  const input = PRD_SCENARIOS[0]?.input;
  if (!input) throw new Error("Missing scenario");
  const quote = input.feedback[0]?.text;
  if (!quote) throw new Error("Missing feedback");
  const citations = [{ id: "f101", quote }];
  const out: PrdOutput = {
    title: "Local contract fixture, not model output", problemStatement: { text: "Customer requests unpaid filtering", citations },
    customerImpact: { text: "Unmeasured impact", citations: [] },
    requirements: [
      { id: "r1", text: "Unpaid filter request", basis: "evidence", priority: "must", citations, docCitations: [] },
      { id: "r2", text: "Invented scope", basis: "evidence", priority: "could", citations: [{ id: "foreign", quote }], docCitations: [] },
      { id: "r3", text: "Proposed layout", basis: "recommendation", priority: "could", citations: [], docCitations: [] },
    ],
    stories: [{ id: "s1", persona: "collector", capability: "filter unpaid", outcome: "find unpaid invoices", acceptanceCriteria: ["Given invoices when unpaid is selected then paid invoices are absent", "Make it better"], citations }],
    inScope: ["Proposed filter"], outOfScope: [], dependencies: [], risks: [], capabilityChecks: [],
    assumptions: ["Layout is not established"], openQuestions: ["Which workflow?"], evidenceGaps: ["No measured baseline"],
    successMetrics: [{ metric: "Discovery time", measurement: "Proposed timed workflow", baselineKnown: false }],
  };
  return { input, ...groundPrd(out, input) };
}

describe("PRD reporting v2 local contracts (not model evaluation)", () => {
  it("keeps author focus and rationale out of generator and assessor payloads for all six cases", () => {
    const { content } = fixture();
    for (const s of PRD_SCENARIOS) {
      const labels = PRD_EXPECTATIONS[s.id];
      if (!labels) throw new Error("Missing labels");
      for (const payload of [buildPrdPrompt(s.input), assessmentData(s.input, content)]) {
        expect(payload).not.toContain(labels.focus);
        expect(payload).not.toContain(labels.rationale);
        expect(payload).not.toContain('"requiredDocs"');
        expect(payload).not.toContain('"topics"');
      }
    }
  });
  it("does not import challenge labels into production prompts", () => {
    expect(readFileSync("src/lib/voc/prompt.ts", "utf8")).not.toMatch(/prd-labels|PRD_EXPECTATIONS|prd-inputs-v1/);
  });
  it("retains every requirement including excluded recommendations", () => {
    const d = prdDiagnostics(fixture().content, "case");
    expect(d.traceability.filter((x) => x.kind === "requirement").map((x) => x.id)).toEqual(["case-requirement-r1", "case-requirement-r2", "case-requirement-r3"]);
    expect(d.coverage.recommendationsExcludedFromEntailment).toEqual(["r3"]);
    expect(d.semanticUnits.map((x) => x.id)).not.toContain("case-requirement-r3");
  });
  it("reports rejected foreign citations without promoting them to evidence", () => {
    const d = prdDiagnostics(fixture().content, "case");
    const row = d.traceability.find((x) => x.id === "case-requirement-r2");
    expect(row?.exactQuotePresent).toBe(false);
    expect(row?.feedbackEvidence).toEqual([]);
    expect(row?.rejectedFeedback).toHaveLength(1);
    expect(d.coverage.itemsWithoutVerifiedFeedback).toEqual(["case-impact", "case-requirement-r2"]);
  });
  it("retains exact source ID and quotation for each traced requirement", () => {
    const row = prdDiagnostics(fixture().content, "case").traceability.find((x) => x.id === "case-requirement-r1");
    expect(row?.feedbackEvidence[0]?.id).toBe("f101");
    expect(row?.feedbackEvidence[0]?.excerpt).toBe(fixture().input.feedback[0]?.text);
  });
  it("reports format counts without claiming acceptance criteria are testable", () => {
    const row = prdDiagnostics(fixture().content, "case").acceptanceCriteria[0];
    expect(row?.criteria).toHaveLength(2);
    expect(row?.givenWhenThenFormatCount).toBe(1);
    expect(row?.testability).toBe("unmeasured_until_assessment");
  });
  it("retains assumptions, questions and unquoted scope for whole-draft assessment", () => {
    const d = prdDiagnostics(fixture().content, "case");
    expect(d.assumptions).toEqual(["Layout is not established"]);
    expect(d.openQuestions).toEqual(["Which workflow?"]);
    expect(d.unquotedScope.inScope).toEqual(["Proposed filter"]);
    expect(d.successMetrics[0]?.baselineKnown).toBe(false);
  });
  it("maps supported and unsupported atomic judgments back to their requirement", () => {
    const units = [{ id: "r1", claim: "compound", excerpts: ["source"] }];
    const results = itemSupport(units, [{ id: "r1-a1", parentId: "r1", claim: "first", excerpts: [] }, { id: "r1-a2", parentId: "r1", claim: "second", excerpts: [] }], [{ id: "r1-a1", status: "supported", rationale: "explicit" }, { id: "r1-a2", status: "unsupported", rationale: "contradicted" }]);
    expect(results[0]?.complete).toBe(true);
    expect(results[0]?.summary.fullSupportRate).toBe(0.5);
    expect(results[0]?.judgments[1]?.rationale).toBe("contradicted");
  });
  it("keeps partial and unassessable separate and discloses missing judgments", () => {
    const units = [{ id: "story", claim: "test", excerpts: [] }];
    const atoms = ["a", "b", "c"].map((id) => ({ id, parentId: "story", claim: id, excerpts: [] }));
    const row = itemSupport(units, atoms, [{ id: "a", status: "partially_supported", rationale: "scope unproven" }, { id: "b", status: "unassessable", rationale: "no sources" }])[0];
    expect(row?.complete).toBe(false);
    expect(row?.summary.total).toBe(2);
    expect(row?.summary.assessable).toBe(1);
    expect(row?.summary.fullSupportRate).toBe(0);
  });
  it("never reports zero generated atoms as completed semantic assessment", () => {
    const row = itemSupport([{ id: "missing", claim: "unjudged", excerpts: [] }], [], [])[0];
    expect(row?.complete).toBe(false);
    expect(row?.summary.fullSupportRate).toBeNull();
  });
});
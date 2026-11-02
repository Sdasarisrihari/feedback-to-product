/** Evaluation-only reporting v2; does not change frozen scenarios, rubrics or production prompts. */
import type { PrdContent, PrdSourceInput, Grounded } from "../prd-schema";
import { dataPrompt, supportSummary, type ClaimUnit, type SupportStatus } from "./semantic-v2";
import { citedClaimUnits } from "./prd-readiness";

/** Deliberately takes no scenario label/expectation argument. */
export function assessmentData(sources: PrdSourceInput, draft: PrdContent) {
  return dataPrompt({ sources, draft });
}

export function traceabilityInventory(content: PrdContent, prefix: string) {
  const item = (id: string, kind: string, text: string, feedback: Grounded, docs: Grounded, basis: string) => ({
    id, kind, text, basis,
    feedbackEvidence: feedback.verified,
    documentEvidence: docs.verified,
    rejectedFeedback: feedback.rejected,
    rejectedDocuments: docs.rejected,
    exactQuotePresent: feedback.verified.length + docs.verified.length > 0,
    semanticScoring: basis === "recommendation" ? "excluded_labeled_recommendation" : "pending",
  });
  const empty: Grounded = { verified: [], rejected: [] };
  return [
    item(`${prefix}-problem`, "problem", content.problemStatement.text, content.problemStatement, empty, "evidence"),
    item(`${prefix}-impact`, "impact", content.customerImpact.text, content.customerImpact, empty, "evidence"),
    ...content.requirements.map((r) => item(`${prefix}-requirement-${r.id}`, "requirement", r.text, r.feedback, r.docs, r.basis)),
    ...content.stories.map((s) => item(`${prefix}-story-${s.id}`, "story", `A ${s.persona} needs ${s.capability} to ${s.outcome}.`, s, empty, "evidence")),
  ];
}

export function prdDiagnostics(content: PrdContent, prefix: string) {
  const units = citedClaimUnits(content, prefix);
  return {
    traceability: traceabilityInventory(content, prefix),
    semanticUnits: units,
    coverage: {
      evidenceAttributedItems: units.length,
      itemsWithoutVerifiedFeedback: units.filter((u) => u.excerpts.length === 0).map((u) => u.id),
      recommendationsExcludedFromEntailment: content.requirements.filter((r) => r.basis === "recommendation").map((r) => r.id),
    },
    acceptanceCriteria: content.stories.map((s) => ({
      storyId: s.id, criteria: s.acceptanceCriteria,
      givenWhenThenFormatCount: s.acceptanceCriteria.filter((a) => /given.+when.+then/is.test(a)).length,
      testability: "unmeasured_until_assessment",
    })),
    assumptions: content.assumptions, openQuestions: content.openQuestions, evidenceGaps: content.evidenceGaps,
    capabilities: content.capabilityChecks, successMetrics: content.successMetrics,
    unquotedScope: { inScope: content.inScope, outOfScope: content.outOfScope, dependencies: content.dependencies, risks: content.risks },
    limitation: "Exact quotations and Given/When/Then format do not establish semantic support or testability. Generic assessor reviews the whole draft including recommendations and unquoted scope.",
  };
}

/** Join judgments by explicit parent IDs, never by guessed requirement/story text. */
export function itemSupport(units: ClaimUnit[], atoms: (ClaimUnit & { parentId: string })[], judgments: { id: string; status: SupportStatus; rationale: string }[]) {
  return units.map((u) => {
    const children = atoms.filter((a) => a.parentId === u.id);
    const results = children.flatMap((a) => {
      const j = judgments.find((x) => x.id === a.id);
      return j ? [{ ...j, claim: a.claim }] : [];
    });
    return { id: u.id, claim: u.claim, excerpts: u.excerpts, proposedAtoms: children.length,
      judgedAtoms: results.length, complete: children.length > 0 && results.length === children.length,
      summary: supportSummary(results), judgments: results };
  });
}
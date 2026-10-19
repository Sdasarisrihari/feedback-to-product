/**
 * AI PRD contract + grounding. Model output is a suggestion; every citation is re-verified
 * with the shared verifier. Unsupported evidence claims are downgraded, never shown as fact.
 */
import { z } from "zod/v4";
import { verifyCitations, type RejectedCitation, type VerifiedCitation } from "./grounding";

const cit = z.object({ id: z.string(), quote: z.string() });
const cited = z.object({ text: z.string(), citations: z.array(cit) });

export const prdOutputSchema = z.object({
  title: z.string(),
  problemStatement: cited,
  customerImpact: cited,
  requirements: z.array(z.object({
    id: z.string(), text: z.string(), basis: z.enum(["evidence", "recommendation"]), priority: z.enum(["must", "should", "could"]),
    citations: z.array(cit), docCitations: z.array(cit),
  })),
  inScope: z.array(z.string()),
  outOfScope: z.array(z.string()),
  stories: z.array(z.object({
    id: z.string(), persona: z.string(), capability: z.string(), outcome: z.string(),
    acceptanceCriteria: z.array(z.string()), citations: z.array(cit),
  })),
  capabilityChecks: z.array(z.object({
    capability: z.string(), status: z.enum(["documented", "not_documented", "unknown"]), docCitations: z.array(cit), clarificationQuestion: z.string(),
  })),
  dependencies: z.array(z.string()),
  risks: z.array(z.string()),
  assumptions: z.array(z.string()),
  openQuestions: z.array(z.string()),
  successMetrics: z.array(z.object({ metric: z.string(), measurement: z.string(), baselineKnown: z.boolean() })),
  evidenceGaps: z.array(z.string()),
});
export type PrdOutput = z.infer<typeof prdOutputSchema>;

export interface Grounded { verified: VerifiedCitation[]; rejected: RejectedCitation[] }
export interface PrdContent {
  title: string;
  problemStatement: { text: string; supported: boolean } & Grounded;
  customerImpact: { text: string; supported: boolean } & Grounded;
  requirements: { id: string; text: string; basis: "evidence" | "recommendation"; priority: "must" | "should" | "could"; status: "supported" | "needs_validation" | "recommendation"; feedback: Grounded; docs: Grounded }[];
  inScope: string[]; outOfScope: string[];
  stories: PrdStory[];
  capabilityChecks: { capability: string; claimed: "documented" | "not_documented" | "unknown"; status: "documented" | "not_documented" | "unverified"; clarificationQuestion: string; docs: Grounded }[];
  dependencies: string[]; risks: string[]; assumptions: string[]; openQuestions: string[];
  successMetrics: { metric: string; measurement: string; baselineKnown: boolean }[];
  evidenceGaps: string[];
}
export interface PrdStory extends Grounded { id: string; persona: string; capability: string; outcome: string; acceptanceCriteria: string[]; supported: boolean }

export interface GroundingReport { citations: number; verified: number; rejected: number; downgrades: string[] }

export interface PrdSourceInput {
  theme: { name: string; summary: string; productArea: string; kind: string };
  feedback: { id: string; text: string; segment: string; source: string }[];
  docs: { id: string; title: string; text: string }[];
}

export type PrdResult =
  | { ok: true; model: string; durationMs: number; content: PrdContent; report: GroundingReport }
  | { ok: false; code: string; message: string };

export function groundPrd(out: PrdOutput, input: PrdSourceInput): { content: PrdContent; report: GroundingReport } {
  const fb = new Map(input.feedback.map((f) => [f.id, f.text]));
  const dc = new Map(input.docs.map((d) => [d.id, d.text]));
  const report: GroundingReport = { citations: 0, verified: 0, rejected: 0, downgrades: [] };
  const g = (cits: { id: string; quote: string }[], src: Map<string, string>): Grounded => {
    const r = verifyCitations(cits, src);
    report.citations += cits.length; report.verified += r.verified.length; report.rejected += r.rejected.length;
    return r;
  };
  const ps = g(out.problemStatement.citations, fb);
  const ci = g(out.customerImpact.citations, fb);
  if (!ps.verified.length) report.downgrades.push("Problem statement has no verified customer quote.");
  const requirements = out.requirements.map((r) => {
    const feedback = g(r.citations, fb); const docs = g(r.docCitations, dc);
    let status: PrdContent["requirements"][number]["status"] = r.basis === "recommendation" ? "recommendation" : "supported";
    if (r.basis === "evidence" && !feedback.verified.length) { status = "needs_validation"; report.downgrades.push(`Requirement ${r.id}: claimed evidence-based but no citation verified.`); }
    return { id: r.id, text: r.text, basis: r.basis, priority: r.priority, status, feedback, docs };
  });
  const stories: PrdStory[] = out.stories.map((s) => {
    const gr = g(s.citations, fb);
    if (!gr.verified.length) report.downgrades.push(`Story ${s.id}: no verified evidence.`);
    return { id: s.id, persona: s.persona, capability: s.capability, outcome: s.outcome, acceptanceCriteria: s.acceptanceCriteria, supported: gr.verified.length > 0, ...gr };
  });
  const capabilityChecks = out.capabilityChecks.map((c) => {
    const docs = g(c.docCitations, dc);
    let status: PrdContent["capabilityChecks"][number]["status"] = c.status === "unknown" ? "unverified" : c.status;
    let q = c.clarificationQuestion;
    // "documented" and "not_documented" are both claims about the docs: each needs a verified doc quote.
    if (c.status !== "unknown" && !docs.verified.length) {
      status = "unverified";
      report.downgrades.push(`Capability "${c.capability}": claimed ${c.status} without a verified documentation quote.`);
    }
    if (status === "unverified" && !q.trim()) q = `Does Trellis currently support: ${c.capability}? Please confirm with the product owner.`;
    return { capability: c.capability, claimed: c.status, status, clarificationQuestion: q, docs };
  });
  const content: PrdContent = {
    title: out.title,
    problemStatement: { text: out.problemStatement.text, supported: ps.verified.length > 0, ...ps },
    customerImpact: { text: out.customerImpact.text, supported: ci.verified.length > 0, ...ci },
    requirements, inScope: out.inScope, outOfScope: out.outOfScope, stories, capabilityChecks,
    dependencies: out.dependencies, risks: out.risks, assumptions: out.assumptions, openQuestions: out.openQuestions,
    successMetrics: out.successMetrics, evidenceGaps: out.evidenceGaps,
  };
  return { content, report };
}

/** Evidence-grounded Q&A over feedback + docs. Claims are re-typed after citation verification. */
import { z } from "zod/v4";
import { verifyCitations } from "./grounding";
import type { Grounded } from "./prd-schema";

const cit = z.object({ id: z.string(), quote: z.string() });
export const qaOutputSchema = z.object({
  answer: z.string(),
  claims: z.array(z.object({
    text: z.string(),
    type: z.enum(["documented_capability", "customer_request", "assumption"]),
    feedbackCitations: z.array(cit),
    docCitations: z.array(cit),
  })),
  capabilityVerdicts: z.array(z.object({
    capability: z.string(), status: z.enum(["documented", "not_documented", "unknown"]), docCitations: z.array(cit),
  })),
  clarificationQuestions: z.array(z.string()),
});
export type QaOutput = z.infer<typeof qaOutputSchema>;

export type ClaimStatus = "documented_capability" | "customer_request" | "assumption" | "unverified";
export interface QaClaim { text: string; claimed: QaOutput["claims"][number]["type"]; status: ClaimStatus; feedback: Grounded; docs: Grounded }
export interface CapabilityVerdict { capability: string; claimed: "documented" | "not_documented" | "unknown"; status: "documented" | "not_documented" | "unverified"; docs: Grounded }
export interface QaAnswer { question: string; answer: string; claims: QaClaim[]; capabilityVerdicts: CapabilityVerdict[]; clarificationQuestions: string[] }
export interface QaInput { question: string; feedback: { id: string; text: string }[]; docs: { id: string; title: string; text: string }[] }
export type QaResult = ({ ok: true; model: string; durationMs: number; result: QaAnswer } & { provenance?: "server_verified" | "browser_supplied"; sourceRejections?: { id: string; kind: "feedback" | "doc"; reason: "unknown_or_not_owned" | "text_mismatch" }[] }) | { ok: false; code: string; message: string };

export function groundAnswer(out: QaOutput, input: QaInput): QaAnswer {
  const fb = new Map(input.feedback.map((f) => [f.id, f.text]));
  const dc = new Map(input.docs.map((d) => [d.id, d.text]));
  const extraQs: string[] = [];
  const claims = out.claims.map((c) => {
    const feedback = verifyCitations(c.feedbackCitations, fb);
    const docs = verifyCitations(c.docCitations, dc);
    let status: ClaimStatus = c.type;
    if (c.type === "documented_capability" && !docs.verified.length) { status = "unverified"; extraQs.push(`Documentation does not confirm: "${c.text}". Is this capability available?`); }
    if (c.type === "customer_request" && !feedback.verified.length) status = "unverified";
    return { text: c.text, claimed: c.type, status, feedback, docs };
  });
  // Same rule as PRD capability checks: any statement about the docs needs a verified doc quote.
  const capabilityVerdicts = out.capabilityVerdicts.map((v) => {
    const docs = verifyCitations(v.docCitations, dc);
    const status: CapabilityVerdict["status"] = v.status !== "unknown" && docs.verified.length ? v.status : "unverified";
    if (status === "unverified") extraQs.push(`Is "${v.capability}" available in Trellis? The documentation provided does not confirm it.`);
    return { capability: v.capability, claimed: v.status, status, docs };
  });
  return { question: input.question, answer: out.answer, claims, capabilityVerdicts, clarificationQuestions: [...new Set([...out.clarificationQuestions, ...extraQs])] };
}

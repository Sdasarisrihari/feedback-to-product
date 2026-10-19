/**
 * Client-safe contract for the LLM analysis step + the deterministic grounding validator.
 * The model only SUGGESTS themes and citations. Every citation is checked against the
 * submitted records: the ID must exist and the quote must appear verbatim in that record.
 * Anything that fails is shown as a rejected citation, never as evidence.
 */
import { z } from "zod/v4";
import { Bm25Index, bestExcerpt } from "./bm25";
import { verifyCitations } from "./grounding";
import type { EvidenceRef, FeedbackRecord, Insight } from "./types";

export const MAX_RECORDS = 300;
export const MAX_TEXT = 1500;

export const llmOutputSchema = z.object({
  themes: z.array(
    z.object({
      name: z.string(),
      productArea: z.string(),
      kind: z.enum(["pain_point", "feature_request"]),
      summary: z.string(),
      severity: z.number().int().min(1).max(5),
      severityRationale: z.string(),
      citations: z.array(z.object({ id: z.string(), quote: z.string() })),
      openQuestions: z.array(z.string()),
    }),
  ),
  notes: z.string(),
});
export type LlmOutput = z.infer<typeof llmOutputSchema>;

export interface AnalysisInputRecord { id: string; text: string; source: string; segment: string; rating: number | null }

export type AnalysisResult =
  | { ok: true; model: string; durationMs: number; inputCount: number; truncated: boolean; insights: Insight[]; notes: string } & { provenance?: "server_verified" | "browser_supplied"; sourceRejections?: { id: string; kind: "feedback" | "doc"; reason: "unknown_or_not_owned" | "text_mismatch" }[] }
  | { ok: false; code: "not_configured" | "rate_limited" | "credits" | "denied" | "invalid_input" | "bad_output" | "upstream" | "source_rejected" | "unauthorized"; message: string };

function slug(s: string, i: number) {
  return `llm-${i + 1}-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`;
}

export { locateQuote } from "./grounding";

export function groundLlmOutput(out: LlmOutput, records: AnalysisInputRecord[]): Insight[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  const index = new Bm25Index(records.map((r) => ({ id: r.id, text: r.text })));
  return out.themes.map((t, i) => {
    const texts = new Map(records.map((r) => [r.id, r.text]));
    const v = verifyCitations(t.citations, texts);
    const rejected: NonNullable<Insight["rejectedCitations"]> = v.rejected.map((r) => ({ ...r, reason: r.reason.replace("provided evidence", "analysed data") }));
    const evidence: EvidenceRef[] = [];
    for (const c of v.verified) if (!evidence.some((e) => e.id === c.id)) evidence.push({ id: c.id, score: 1, excerpt: c.excerpt });
    const cited = new Set(evidence.map((e) => e.id));
    const query = `${t.name} ${t.summary}`;
    const related = index.search(query, 8, 1).filter((h) => !cited.has(h.id)).slice(0, 5)
      .map((h) => ({ id: h.id, score: Math.round(h.score * 100) / 100, excerpt: bestExcerpt(byId.get(h.id)!.text, query) }));
    const recs = evidence.map((e) => byId.get(e.id)!);
    const sentiment = { positive: 0, neutral: 0, negative: 0, unrated: 0 };
    recs.forEach((r) => {
      if (r.rating == null) sentiment.unrated++;
      else if (r.rating <= 2) sentiment.negative++;
      else if (r.rating === 3) sentiment.neutral++;
      else sentiment.positive++;
    });
    let confidence: Insight["confidence"] = "high";
    let reason = `${evidence.length} verified citation(s).`;
    if (evidence.length < 2) { confidence = "low"; reason = `Only ${evidence.length} verified citation(s) — uncertain, needs review.`; }
    else if (evidence.length < 4) confidence = "medium";
    if (rejected.length) { reason += ` ${rejected.length} model citation(s) failed verification.`; if (confidence === "high") confidence = "medium"; }
    return {
      themeId: slug(t.name, i), name: t.name, productArea: t.productArea, kind: t.kind,
      evidence, frequency: evidence.length, sentiment,
      severity: t.severity,
      enterpriseShare: recs.length ? recs.filter((r) => r.segment === "enterprise").length / recs.length : 0,
      confidence, confidenceReason: reason,
      assumptions: [
        `Model-suggested severity ${t.severity}/5: ${t.severityRationale}`,
        "Frequency counts only verified citations; related records found by BM25 are not counted.",
        "Sentiment is derived from star ratings of cited records.",
      ],
      origin: "llm", summary: t.summary, rejectedCitations: rejected, related, openQuestions: t.openQuestions,
    };
  });
}

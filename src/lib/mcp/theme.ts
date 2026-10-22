/**
 * Pure theme-retrieval logic for the get_theme MCP tool.
 * Kept separate from the SDK handler so it is unit-testable without a database.
 *
 * The stored analysis is model output that was verified once at analysis time. This module
 * RE-VERIFIES every stored evidence excerpt against the caller's saved records before
 * returning it: an excerpt that is not a verbatim substring of the saved record body is
 * rejected, never presented as evidence. Feedback text is untrusted customer content.
 */
import type { EvidenceRow } from "./evidence";

export interface StoredEvidenceRef {
  id: string;
  excerpt: string;
  score?: number;
}

export interface StoredInsight {
  themeId: string;
  name: string;
  productArea: string;
  kind: string;
  evidence?: StoredEvidenceRef[];
  frequency?: number;
  sentiment?: { positive: number; neutral: number; negative: number; unrated: number };
  severity?: number;
  enterpriseShare?: number;
  confidence?: string;
  confidenceReason?: string;
  assumptions?: string[];
  summary?: string;
  rejectedCitations?: { id: string; quote: string; reason: string }[];
  related?: StoredEvidenceRef[];
  openQuestions?: string[];
}

export interface AnalysisRow {
  run_id: string;
  model: string;
  analysed_at: string;
  signature: string;
  insights: StoredInsight[];
}

/** Mirrors store.tsx recordsSignature: non-duplicate record IDs joined by "|". */
export function currentSignature(rows: Pick<EvidenceRow, "id" | "duplicate_of">[]): string {
  return rows.filter((r) => !r.duplicate_of).map((r) => r.id).join("|");
}

export type ThemeResult =
  | { ok: true; result: ReturnType<typeof toThemeJson> }
  | { ok: false; code: "not_found"; message: string };

/**
 * Builds the get_theme response for one stored insight, re-verifying its evidence against
 * the caller's saved records. Unknown themes are not_found; unverifiable evidence is moved
 * to rejectedEvidence with a reason, never silently dropped or presented as verified.
 */
export function buildThemeResult(
  analysis: AnalysisRow | null,
  rows: EvidenceRow[],
  themeId: string,
): ThemeResult {
  const insight = analysis?.insights?.find((i) => i.themeId === themeId);
  if (!analysis || !insight) {
    return { ok: false, code: "not_found", message: `Unknown theme: ${themeId}` };
  }

  const byId = new Map(rows.map((r) => [r.id, r]));

  const evidence: {
    id: string; excerpt: string; source: string; segment: string; date: string;
    rating: number | null; duplicateOf: string | null; suspectedInjection: boolean;
  }[] = [];
  const rejectedEvidence: { id: string; reason: string }[] = [];

  const verify = (ref: StoredEvidenceRef, origin: "evidence" | "related") => {
    const rec = byId.get(ref.id);
    if (!rec) {
      rejectedEvidence.push({ id: ref.id, reason: `${origin}: record not found in saved workspace` });
      return;
    }
    if (typeof ref.excerpt !== "string" || !rec.body.includes(ref.excerpt)) {
      rejectedEvidence.push({ id: ref.id, reason: `${origin}: stored excerpt is not a verbatim substring of the saved record` });
      return;
    }
    if (origin === "evidence") {
      evidence.push({
        id: rec.id,
        excerpt: ref.excerpt,
        source: rec.source,
        segment: rec.segment,
        date: rec.feedback_date,
        rating: rec.rating,
        duplicateOf: rec.duplicate_of,
        suspectedInjection: rec.suspected_injection,
      });
    } else {
      related.push({ id: rec.id, excerpt: ref.excerpt, origin: "bm25_related_not_cited" });
    }
  };

  const related: { id: string; excerpt: string; origin: "bm25_related_not_cited" }[] = [];
  for (const ref of insight.evidence ?? []) verify(ref, "evidence");
  for (const ref of insight.related ?? []) verify(ref, "related");

  const stale = currentSignature(rows) !== analysis.signature;

  return { ok: true, result: toThemeJson(analysis, insight, evidence, related, rejectedEvidence, stale) };
}

const toThemeJson = (
  analysis: AnalysisRow,
  insight: StoredInsight,
  evidence: { id: string; excerpt: string; source: string; segment: string; date: string; rating: number | null; duplicateOf: string | null; suspectedInjection: boolean }[],
  related: { id: string; excerpt: string; origin: string }[],
  rejectedEvidence: { id: string; reason: string }[],
  stale: boolean,
) => ({
  provenance: "saved_analysis",
  stale,
  theme: {
    themeId: insight.themeId,
    name: insight.name,
    productArea: insight.productArea,
    kind: insight.kind,
    severity: insight.severity ?? null,
    confidence: insight.confidence ?? null,
    confidenceReason: insight.confidenceReason ?? null,
    frequency: insight.frequency ?? evidence.length,
    sentiment: insight.sentiment ?? null,
    enterpriseShare: insight.enterpriseShare ?? null,
  },
  // Model-generated text is labeled as such — it is a suggestion, not verified evidence.
  summary: insight.summary ? { text: insight.summary, origin: "ai_generated" } : null,
  assumptions: (insight.assumptions ?? []).map((text) => ({ text, origin: "ai_generated" })),
  openQuestions: (insight.openQuestions ?? []).map((text) => ({ text, origin: "ai_generated" })),
  evidence,
  rejectedEvidence,
  rejectedCitations: insight.rejectedCitations ?? [],
  related,
  analysis: {
    runId: analysis.run_id,
    model: analysis.model,
    analysedAt: analysis.analysed_at,
    signature: analysis.signature,
  },
});

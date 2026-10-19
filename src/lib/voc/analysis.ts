/**
 * BASELINE analysis (Phase 2): deterministic BM25 lexical retrieval over a PM-defined
 * theme catalogue. This is NOT an LLM result. It exists so the evidence, prioritization and
 * approval workflow can be exercised before the LLM step (Phase 3) is connected.
 * Every evidence item is a real record from the imported data; excerpts are verbatim substrings.
 */
import { Bm25Index, bestExcerpt } from "./bm25";
import type { FeedbackRecord, Insight } from "./types";

export interface ThemeDefinition {
  id: string;
  name: string;
  productArea: string;
  kind: Insight["kind"];
  query: string;
}

/** PM-authored seed themes (an assumption, not a model output). */
export const THEME_CATALOGUE: ThemeDefinition[] = [
  { id: "sync", name: "Offline sync loses or overwrites changes", productArea: "Sync engine", kind: "pain_point", query: "offline sync conflict lost overwritten overwrite disappeared" },
  { id: "notifications", name: "Notification overload; users want digests", productArea: "Notifications", kind: "feature_request", query: "notifications notification digest noise email muted alert" },
  { id: "reporting", name: "Report export is limited and unreliable", productArea: "Reporting", kind: "feature_request", query: "export report reports reporting pdf csv excel" },
  { id: "permissions", name: "Roles, permissions and invites are insufficient", productArea: "Admin & access", kind: "pain_point", query: "permissions permission roles role invite invites guest viewer admin" },
  { id: "mobile-perf", name: "Mobile app is slow on large boards", productArea: "Mobile", kind: "pain_point", query: "mobile slow load loads performance freezes crashes laggy android ipad" },
  { id: "integrations", name: "Missing or fragile integrations", productArea: "Integrations", kind: "feature_request", query: "integration jira github slack teams" },
  { id: "billing", name: "Billing and pricing confusion", productArea: "Billing", kind: "pain_point", query: "billing charged pricing invoices renewal cost seats" },
];

const SEVERE = /\b(lost|gone|disappeared|overwritten|blocker|urgent|escalat|compliance|crash|cannot|can't|times out|bug|risk)\w*/i;
const MIN_SCORE = 2.0;

export function analyzeFeedback(records: FeedbackRecord[]): Insight[] {
  const usable = records.filter((r) => !r.duplicateOf);
  const index = new Bm25Index(usable.map((r) => ({ id: r.id, text: r.text })));
  const byId = new Map(usable.map((r) => [r.id, r]));
  return THEME_CATALOGUE.map((t) => {
    const hits = index.search(t.query, 50, MIN_SCORE);
    const ev = hits.map((h) => {
      const r = byId.get(h.id)!;
      return { id: h.id, score: Math.round(h.score * 100) / 100, excerpt: bestExcerpt(r.text, t.query) };
    });
    const recs = ev.map((e) => byId.get(e.id)!);
    const sentiment = { positive: 0, neutral: 0, negative: 0, unrated: 0 };
    recs.forEach((r) => {
      if (r.rating == null) sentiment.unrated++;
      else if (r.rating <= 2) sentiment.negative++;
      else if (r.rating === 3) sentiment.neutral++;
      else sentiment.positive++;
    });
    const severeShare = recs.length ? recs.filter((r) => SEVERE.test(r.text)).length / recs.length : 0;
    const severity = recs.length ? Math.min(5, Math.round((1 + severeShare * 3 + (sentiment.negative / recs.length)) * 10) / 10) : 0;
    const enterpriseShare = recs.length ? recs.filter((r) => r.segment === "enterprise").length / recs.length : 0;
    const flagged = recs.filter((r) => r.suspectedInjection || r.warnings.length).length;
    const sources = new Set(recs.map((r) => r.source)).size;
    let confidence: Insight["confidence"] = "high";
    let confidenceReason = `${recs.length} matching records across ${sources} source type(s).`;
    if (recs.length < 3) { confidence = "low"; confidenceReason = `Only ${recs.length} matching record(s) — treat as uncertain.`; }
    else if (recs.length < 6 || sources < 2) { confidence = "medium"; confidenceReason += " Limited volume or source diversity."; }
    if (flagged) confidenceReason += ` ${flagged} record(s) have data-quality or safety flags.`;
    return {
      origin: "baseline" as const, themeId: t.id, name: t.name, productArea: t.productArea, kind: t.kind,
      evidence: ev, frequency: ev.length, sentiment, severity, enterpriseShare, confidence, confidenceReason,
      assumptions: [
        "Theme is a PM-defined seed; membership is keyword (BM25) matching, not semantic understanding.",
        "Sentiment is derived from star rating only; unrated records are excluded.",
        "Severity is a keyword heuristic (e.g. 'lost', 'blocker', 'crash'), not measured impact.",
      ],
    };
  }).filter((i) => i.frequency > 0);
}

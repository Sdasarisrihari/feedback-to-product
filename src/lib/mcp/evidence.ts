/**
 * Pure evidence-selection logic for the get_feedback_evidence MCP tool.
 * Kept separate from the SDK handler so it is unit-testable without a database.
 * All text returned here is a verbatim substring of a saved record — never model output.
 */

export interface EvidenceRow {
  id: string;
  source: string;
  segment: string;
  feedback_date: string;
  rating: number | null;
  body: string;
  duplicate_of: string | null;
  suspected_injection: boolean;
}

export interface ThemeEvidence {
  themeId: string;
  evidenceIds: string[];
}

export interface EvidenceInput {
  query?: string | undefined;
  themeId?: string | undefined;
  limit?: number | undefined;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
const EXCERPT_LEN = 240;

/** Verbatim excerpt: a window around the first query match, else the record's opening characters. */
export function verbatimExcerpt(body: string, query?: string): string {
  if (query) {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const lower = body.toLowerCase();
    let at = -1;
    for (const t of terms) {
      const i = lower.indexOf(t);
      if (i !== -1 && (at === -1 || i < at)) at = i;
    }
    if (at > 0) {
      const start = Math.max(0, at - 60);
      return body.slice(start, start + EXCERPT_LEN);
    }
  }
  return body.slice(0, EXCERPT_LEN);
}

function queryScore(body: string, query: string): number {
  const lower = body.toLowerCase();
  let score = 0;
  for (const t of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (lower.includes(t)) score += t.length > 2 ? 2 : 1;
  }
  return score;
}

export type CollectResult =
  | { ok: true; records: ReturnType<typeof toJson>[]; totalMatched: number }
  | { ok: false; code: "not_found"; message: string };

const toJson = (r: EvidenceRow, excerpt: string) => ({
  id: r.id,
  excerpt,
  source: r.source,
  segment: r.segment,
  date: r.feedback_date,
  rating: r.rating,
  duplicateOf: r.duplicate_of,
  suspectedInjection: r.suspected_injection,
});

/**
 * Selects evidence rows from the caller's saved records. With themeId, restricts to the
 * verified evidence IDs of that analyzed theme; an unknown theme is a not_found error.
 */
export function collectEvidence(rows: EvidenceRow[], themes: ThemeEvidence[], input: EvidenceInput): CollectResult {
  const limit = Math.min(Math.max(1, input.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
  let pool = rows;
  let order: string[] | null = null;

  if (input.themeId) {
    const theme = themes.find((t) => t.themeId === input.themeId);
    if (!theme) return { ok: false, code: "not_found", message: `Unknown theme: ${input.themeId}` };
    const ids = new Set(theme.evidenceIds);
    pool = rows.filter((r) => ids.has(r.id));
    order = theme.evidenceIds;
  }

  let matched = pool;
  if (input.query?.trim()) {
    matched = pool
      .map((r) => ({ r, s: queryScore(r.body, input.query!) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);
  } else if (order) {
    const pos = new Map(order.map((id, i) => [id, i]));
    matched = [...pool].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
  } else {
    matched = [...pool].sort((a, b) => b.feedback_date.localeCompare(a.feedback_date));
  }

  return {
    ok: true,
    totalMatched: matched.length,
    records: matched.slice(0, limit).map((r) => toJson(r, verbatimExcerpt(r.body, input.query))),
  };
}

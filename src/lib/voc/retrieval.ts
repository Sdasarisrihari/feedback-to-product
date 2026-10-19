/** Unified BM25 retrieval over customer feedback and product documentation, keeping source types distinct. */
import { Bm25Index, bestExcerpt } from "./bm25";
import type { ProductDoc } from "./docs";
import type { FeedbackRecord } from "./types";

export type SourceFilter = "all" | "feedback" | "docs";
export interface Hit { sourceType: "feedback" | "doc"; id: string; label: string; text: string; excerpt: string; score: number; suspectedInjection: boolean }

export function buildCorpus(records: FeedbackRecord[], docs: ProductDoc[]) {
  const items: Omit<Hit, "excerpt" | "score">[] = [
    ...records.filter((r) => !r.duplicateOf).map((r) => ({ sourceType: "feedback" as const, id: r.id, label: `${r.source} · ${r.segment}`, text: r.text, suspectedInjection: r.suspectedInjection })),
    ...docs.flatMap((d) => d.sections.map((s) => ({ sourceType: "doc" as const, id: s.id, label: `${d.title}${d.version ? ` v${d.version}` : ""} › ${s.heading}${s.page ? ` (p.${s.page})` : ""}`, text: s.text, suspectedInjection: s.suspectedInjection }))),
  ];
  return items;
}

export function search(records: FeedbackRecord[], docs: ProductDoc[], query: string, filter: SourceFilter = "all", limit = 10): Hit[] {
  const corpus = buildCorpus(records, docs).filter((c) => filter === "all" || (filter === "feedback" ? c.sourceType === "feedback" : c.sourceType === "doc"));
  if (!query.trim() || !corpus.length) return [];
  // Separate indexes so IDF of short feedback doesn't distort long doc sections.
  const out: Hit[] = [];
  for (const type of ["feedback", "doc"] as const) {
    const part = corpus.filter((c) => c.sourceType === type);
    if (!part.length) continue;
    const idx = new Bm25Index(part.map((c) => ({ id: c.id, text: c.text })));
    const byId = new Map(part.map((c) => [c.id, c]));
    for (const h of idx.search(query, limit, 0.5)) { const c = byId.get(h.id)!; out.push({ ...c, score: Math.round(h.score * 100) / 100, excerpt: bestExcerpt(c.text, query) }); }
  }
  return out.sort((a, b) => b.score - a.score);
}

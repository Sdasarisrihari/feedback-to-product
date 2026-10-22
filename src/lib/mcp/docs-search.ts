/**
 * Pure document-search logic for the search_product_docs MCP tool.
 * Reuses the app's BM25 retrieval; kept separate from the SDK handler so it is
 * unit-testable without a database. Excerpts are verbatim substrings of saved
 * document sections — never model output. Document text is untrusted data.
 */
import { Bm25Index, bestExcerpt } from "@/lib/voc/bm25";

export interface DocRow {
  id: string;
  title: string;
  version: string;
  kind: string;
}

export interface SectionRow {
  id: string;
  doc_id: string;
  position: number;
  heading: string;
  page: number | null;
  body: string;
  suspected_injection: boolean;
}

export interface DocSearchInput {
  query: string;
  limit?: number | undefined;
}

export const DOC_DEFAULT_LIMIT = 10;
export const DOC_MAX_LIMIT = 20;

const toJson = (s: SectionRow, d: DocRow, excerpt: string, score: number) => ({
  id: s.id,
  docId: d.id,
  title: d.title,
  version: d.version,
  kind: d.kind,
  heading: s.heading,
  page: s.page,
  excerpt,
  score,
  suspectedInjection: s.suspected_injection,
});

/**
 * BM25 search over saved document sections. Sections whose doc_id does not match a
 * saved document are excluded — every returned section must carry its document's
 * title and version for provenance. Returns matches ranked by score.
 */
export function searchDocSections(docs: DocRow[], sections: SectionRow[], input: DocSearchInput) {
  const limit = Math.min(Math.max(1, input.limit ?? DOC_DEFAULT_LIMIT), DOC_MAX_LIMIT);
  const query = input.query.trim();
  if (!query) return { totalMatched: 0, sections: [] as ReturnType<typeof toJson>[] };

  const byDoc = new Map(docs.map((d) => [d.id, d]));
  const searchable = sections.filter((s) => byDoc.has(s.doc_id));
  if (!searchable.length) return { totalMatched: 0, sections: [] as ReturnType<typeof toJson>[] };

  const idx = new Bm25Index(searchable.map((s) => ({ id: s.id, text: `${s.heading}\n${s.body}` })));
  const byId = new Map(searchable.map((s) => [s.id, s]));
  const hits = idx.search(query, limit, 0.5);

  return {
    totalMatched: hits.length,
    sections: hits.map((h) => {
      const s = byId.get(h.id)!;
      return toJson(s, byDoc.get(s.doc_id)!, bestExcerpt(s.body, query), Math.round(h.score * 100) / 100);
    }),
  };
}

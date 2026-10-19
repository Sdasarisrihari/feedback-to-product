/**
 * Shared citation verifier. Used for themes, PRDs and Q&A answers — the model can never
 * bypass it. A citation is valid only if its source ID exists in the provided source map
 * AND the quote appears verbatim (case-insensitive) in that source's text.
 */
export interface Citation { id: string; quote: string }
export interface VerifiedCitation { id: string; excerpt: string }
export interface RejectedCitation { id: string; quote: string; reason: string }

/** Undo the prompt's delimiter escaping (< > → ‹ ›) and smart quotes so matching is length-preserving. */
const norm = (s: string) => s.toLowerCase().replace(/‹/g, "<").replace(/›/g, ">").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

export function locateQuote(text: string, quote: string): string | null {
  const q = quote.trim().replace(/^["“]|["”]$/g, "").trim();
  if (q.length < 8) return null;
  const i = norm(text).indexOf(norm(q));
  return i === -1 ? null : text.slice(i, i + q.length);
}

export function verifyCitations(cits: Citation[], sources: Map<string, string>): { verified: VerifiedCitation[]; rejected: RejectedCitation[] } {
  const verified: VerifiedCitation[] = [];
  const rejected: RejectedCitation[] = [];
  for (const c of cits) {
    const text = sources.get(c.id);
    if (text === undefined) { rejected.push({ ...c, reason: "Source ID not in the provided evidence" }); continue; }
    const excerpt = locateQuote(text, c.quote);
    if (!excerpt) { rejected.push({ ...c, reason: "Quote does not appear verbatim in the source" }); continue; }
    if (!verified.some((v) => v.id === c.id && v.excerpt === excerpt)) verified.push({ id: c.id, excerpt });
  }
  return { verified, rejected };
}

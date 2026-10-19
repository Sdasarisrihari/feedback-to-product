const STOP = new Set("a an the and or but if to of in on for with is are was were be been it this that we our i my you your they them at as by from so not no do does did have has had can just very".split(" "));

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
}

/** Tiny suffix stemmer — enough to match "exports/exporting/exported". */
function stem(t: string): string {
  return t.replace(/(ing|ed|es|s)$/, "") || t;
}

export interface Bm25Doc { id: string; text: string }
export interface Bm25Hit { id: string; score: number }

export class Bm25Index {
  private docs: { id: string; tf: Map<string, number>; len: number }[] = [];
  private df = new Map<string, number>();
  private avgLen = 0;
  constructor(docs: Bm25Doc[], private k1 = 1.4, private b = 0.75) {
    for (const d of docs) {
      const toks = tokenize(d.text);
      const tf = new Map<string, number>();
      toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
      tf.forEach((_, t) => this.df.set(t, (this.df.get(t) ?? 0) + 1));
      this.docs.push({ id: d.id, tf, len: toks.length });
    }
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / (this.docs.length || 1);
  }
  search(query: string, limit = 10, minScore = 0): Bm25Hit[] {
    const q = [...new Set(tokenize(query))];
    const N = this.docs.length;
    const hits: Bm25Hit[] = [];
    for (const d of this.docs) {
      let score = 0;
      for (const t of q) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += idf * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen)));
      }
      if (score > minScore) hits.push({ id: d.id, score });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/** Pick the sentence of the source text that best matches the query — always a verbatim substring. */
export function bestExcerpt(text: string, query: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const q = new Set(tokenize(query));
  let best = sentences[0];
  let bestScore = -1;
  for (const s of sentences) {
    const score = tokenize(s).filter((t) => q.has(t)).length;
    if (score > bestScore) { best = s; bestScore = score; }
  }
  return best.trim();
}

/** Deterministic evaluation harness (no model calls). LLM metrics are produced by scripts/eval.ts. */
import { analyzeFeedback, THEME_CATALOGUE } from "../analysis";
import { parseFeedbackCsv } from "../csv";
import { search } from "../retrieval";
import { SAMPLE_CSV } from "../sample-data";
import { sampleDocs } from "../sample-docs";
import type { FeedbackRecord } from "../types";
import { EVAL_ONLY, RETRIEVAL_QUERIES, SAMPLE_DUPLICATES, SAMPLE_LABELS, THEMES, type GoldLabel } from "./dataset";
import { classification, recallAtK } from "./metrics";

export function evalRecords(): { records: FeedbackRecord[]; gold: Map<string, GoldLabel> } {
  const { records: sample } = parseFeedbackCsv(SAMPLE_CSV, "sample.csv", [], "imp_sample");
  const csv = "id,source,segment,created_at,rating,text\n" + EVAL_ONLY.map(([id, seg, r, , , t]) => `${id},survey,${seg},2026-09-01,${r ?? ""},"${t.replace(/"/g, '""')}"`).join("\n");
  const { records: extra } = parseFeedbackCsv(csv, "eval.csv", sample, "imp_eval");
  const gold = new Map<string, GoldLabel>(Object.entries(SAMPLE_LABELS));
  EVAL_ONLY.forEach(([id, , , theme, severity, text]) => gold.set(id, { theme, severity, injection: /ignore previous instructions/i.test(text) }));
  return { records: [...sample, ...extra], gold };
}

/** Baseline: assign each record to the seed theme whose BM25 evidence ranks it highest. */
export function baselinePredictions(records: FeedbackRecord[]) {
  const best = new Map<string, { theme: string; score: number }>();
  for (const i of analyzeFeedback(records)) for (const e of i.evidence) {
    const cur = best.get(e.id);
    if (!cur || e.score > cur.score) best.set(e.id, { theme: i.themeId, score: e.score });
  }
  return best;
}

export function runDeterministicEval() {
  const { records, gold } = evalRecords();
  const unique = records.filter((r) => !r.duplicateOf && gold.has(r.id));
  const preds = baselinePredictions(records);
  const themeEval = classification(unique.map((r) => gold.get(r.id)!.theme), unique.map((r) => preds.get(r.id)?.theme ?? "other"), THEMES);

  const flagged = records.filter((r) => r.duplicateOf).map((r) => r.id);
  const known = Object.keys(SAMPLE_DUPLICATES);
  const dupTp = flagged.filter((id) => known.includes(id)).length;
  const duplicates = { precision: flagged.length ? dupTp / flagged.length : 0, recall: dupTp / known.length, flagged: flagged.length, known: known.length };

  const injGold = unique.filter((r) => gold.get(r.id)!.injection).map((r) => r.id);
  const injFlag = unique.filter((r) => r.suspectedInjection).map((r) => r.id);
  const injection = { recall: injGold.filter((x) => injFlag.includes(x)).length / (injGold.length || 1), falsePositives: injFlag.filter((x) => !injGold.includes(x)).length, gold: injGold.length };

  const docs = sampleDocs();
  const results = RETRIEVAL_QUERIES.map((q) => search([], docs, q.query, "docs", 10).map((h) => h.id));
  const retrieval = { recallAt1: recallAtK(results, RETRIEVAL_QUERIES.map((q) => q.relevant), 1), recallAt5: recallAtK(results, RETRIEVAL_QUERIES.map((q) => q.relevant), 5), queries: RETRIEVAL_QUERIES.length };

  return { datasetSize: unique.length, totalRows: records.length, themeEval, duplicates, injection, retrieval, seedThemes: THEME_CATALOGUE.length };
}

/**
 * Evaluation runner. Usage: bun scripts/eval.ts [--llm]
 * Deterministic metrics always run; --llm makes real model calls (costs credits) and needs LOVABLE_API_KEY.
 * Writes docs/EVALUATION.md with the measured results.
 */
import { writeFileSync } from "node:fs";
import { CAPABILITY_CASES, THEMES } from "../src/lib/voc/eval/dataset";
import { evalRecords, runDeterministicEval } from "../src/lib/voc/eval/harness";
import { classification, pct } from "../src/lib/voc/eval/metrics";
import { search } from "../src/lib/voc/retrieval";
import { sampleDocs } from "../src/lib/voc/sample-docs";

const det = runDeterministicEval();
const lines: string[] = [];
const now = new Date().toISOString();
lines.push(`# Evaluation results`, ``, `Run: ${now}. Dataset: **${det.datasetSize} labeled unique synthetic feedback records** (${det.totalRows} rows incl. duplicates), ${det.retrieval.queries} labeled doc-retrieval queries, ${CAPABILITY_CASES.length} capability cases. Synthetic data only — results do not generalise to real customers.`, ``);
lines.push(`## Automated — deterministic (no model)`, ``, `| Metric | Result |`, `|---|---|`,
  `| Baseline (BM25 seed themes) theme macro-F1 | ${det.themeEval.macroF1.toFixed(3)} (accuracy ${pct(det.themeEval.accuracy)}, n=${det.themeEval.n}) |`,
  `| Duplicate detection precision / recall | ${pct(det.duplicates.precision)} / ${pct(det.duplicates.recall)} (${det.duplicates.known} known) |`,
  `| Injection flagging recall | ${pct(det.injection.recall)} (${det.injection.gold} labeled, ${det.injection.falsePositives} false positives) |`,
  `| Doc retrieval Recall@1 / Recall@5 (BM25) | ${pct(det.retrieval.recallAt1)} / ${pct(det.retrieval.recallAt5)} |`, ``);
lines.push(`Per-theme (baseline): ${det.themeEval.per.map((p) => `${p.label} P${p.precision.toFixed(2)}/R${p.recall.toFixed(2)}`).join(", ")}`, ``);

if (process.argv.includes("--llm")) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("LOVABLE_API_KEY not set");
  const { runLlmAnalysis, runQa } = await import("../src/lib/voc/llm.server");
  const { records, gold } = evalRecords();
  const unique = records.filter((r) => !r.duplicateOf);
  const res = await runLlmAnalysis(unique.map((r) => ({ id: r.id, text: r.text, source: r.source, segment: r.segment, rating: r.rating })), key, false);
  lines.push(`## Automated — LLM (${res.ok ? res.model : "failed"})`, ``);
  if (!res.ok) lines.push(`LLM analysis failed: ${res.code} — ${res.message}`, ``);
  else {
    // Map each AI theme to the gold label held by the majority of its verified citations.
    const pred = new Map<string, string>();
    let cits = 0, verified = 0, injectionCitedAsInstruction = 0;
    for (const t of res.insights) {
      verified += t.evidence.length; cits += t.evidence.length + (t.rejectedCitations?.length ?? 0);
      const counts = new Map<string, number>();
      t.evidence.forEach((e) => { const g = gold.get(e.id)?.theme ?? "other"; counts.set(g, (counts.get(g) ?? 0) + 1); });
      const label = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
      t.evidence.forEach((e) => { if (!pred.has(e.id)) pred.set(e.id, label); });
      if (/delete all themes|admin mode/i.test(t.name + (t.summary ?? ""))) injectionCitedAsInstruction++;
    }
    const ce = classification(unique.map((r) => gold.get(r.id)!.theme), unique.map((r) => pred.get(r.id) ?? "other"), THEMES);
    lines.push(`| Metric | Result |`, `|---|---|`,
      `| LLM theme macro-F1 (majority-mapped) | ${ce.macroF1.toFixed(3)} (accuracy ${pct(ce.accuracy)}, n=${ce.n}) |`,
      `| Citation validity (verified / proposed) | ${pct(verified / (cits || 1))} (${verified}/${cits}) |`,
      `| Themes produced | ${res.insights.length}; latency ${(res.durationMs / 1000).toFixed(1)}s |`,
      `| Themes obeying injected instructions | ${injectionCitedAsInstruction} |`, ``);
    lines.push(`Per-theme (LLM): ${ce.per.map((p) => `${p.label} P${p.precision.toFixed(2)}/R${p.recall.toFixed(2)}`).join(", ")}`, ``);
  }
  const docs = sampleDocs();
  const rows: string[] = [];
  let correct = 0;
  for (const c of CAPABILITY_CASES) {
    const q = `Does the documentation confirm that Trellis supports ${c.capability}?`;
    const r = await runQa({ question: q, feedback: [], docs: search([], docs, c.capability, "docs", 6).map((h) => ({ id: h.id, title: h.label, text: h.text })) }, key);
    let p = "error";
    if (r.ok) {
      const v = r.result.capabilityVerdicts[0];
      p = !v ? "unknown" : v.status === "unverified" ? "unknown" : v.status;
    }
    if (p === c.expected) correct++;
    rows.push(`| ${c.capability} | ${c.expected} | ${p} |`);
  }
  lines.push(`### Documented-capability classification: ${correct}/${CAPABILITY_CASES.length} (${pct(correct / CAPABILITY_CASES.length)})`, ``, `| Capability | Expected | Predicted |`, `|---|---|---|`, ...rows, ``);
} else lines.push(`LLM metrics not run in this pass (use \`--llm\`).`, ``);

lines.push(`## Human judgments`, ``, `PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes). **No human reviews have been recorded yet**, so no acceptance rate is claimed.`, ``);
writeFileSync(new URL("../docs/EVALUATION_RESULTS.md", import.meta.url), lines.join("\n"));
console.log(lines.join("\n"));

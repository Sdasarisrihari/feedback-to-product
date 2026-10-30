/**
 * Evaluation runner. Usage: bun scripts/eval.ts [--llm]
 * Deterministic metrics always run; --llm makes real model calls (costs credits) and needs LOVABLE_API_KEY.
 * Requires --output to preserve historical results. Also saves synthetic raw results as .json.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CAPABILITY_CASES, THEMES } from "../src/lib/voc/eval/dataset";
import { evalRecords, runDeterministicEval } from "../src/lib/voc/eval/harness";
import { classification, pct } from "../src/lib/voc/eval/metrics";
import { search } from "../src/lib/voc/retrieval";
import { sampleDocs } from "../src/lib/voc/sample-docs";
import { capabilityInput, CAPABILITY_FIXTURE_VERSION, scoreConflict } from "../src/lib/voc/eval/capabilities";

const outputIndex = process.argv.indexOf("--output");
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
if (!outputPath) throw new Error("--output requires a new file path; historical results must not be overwritten");
const legacy = process.argv.includes("--legacy-capabilities");
const artifacts: Record<string, unknown> = { capabilityFixtureVersion: legacy ? "v2-legacy" : CAPABILITY_FIXTURE_VERSION, capabilityResults: [] };

const det = runDeterministicEval();
const lines: string[] = [];
const now = new Date().toISOString();
artifacts["run"] = now;
lines.push(`# Evaluation results`, ``, `Run: ${now}. Dataset: **${det.datasetSize} labeled unique synthetic feedback records** (${det.totalRows} rows incl. duplicates), ${det.retrieval.queries} labeled doc-retrieval queries, ${CAPABILITY_CASES.length} capability cases. Synthetic data only — results do not generalise to real customers.`, ``);
lines.push(`Capability fixtures: **${legacy ? "v2-legacy" : CAPABILITY_FIXTURE_VERSION}**. v2.1 supplies explicit synthetic SCIM denial and both conflicting export versions through saved-row mapping + BM25. Feedback labels and 12 expected verdicts unchanged. Q&A policy now requires unknown for unresolved conflicts and prohibits inferred version precedence. This conflict case is a development regression, not held-out data. Fixture rows are local only, not inserted into a live workspace.`, ``);
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
  artifacts["analysis"] = res;
  let terminalFailure = !res.ok && ["credits", "denied", "not_configured"].includes(res.code);
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
    const ce = classification(unique.map((r) => gold.get(r.id)?.theme ?? "other"), unique.map((r) => pred.get(r.id) ?? "other"), THEMES);
    artifacts["combinedThemeMetrics"] = ce;
    const macroPrecision = ce.per.filter((p) => p.support > 0).reduce((n, p) => n + p.precision, 0) / ce.per.filter((p) => p.support > 0).length;
    const macroRecall = ce.per.filter((p) => p.support > 0).reduce((n, p) => n + p.recall, 0) / ce.per.filter((p) => p.support > 0).length;
    lines.push(`| Metric | Result |`, `|---|---|`,
      `| LLM theme macro-F1 (majority-mapped) | ${ce.macroF1.toFixed(3)} (accuracy ${pct(ce.accuracy)}, n=${ce.n}) |`,
      `| Citation validity (verified / proposed) | ${pct(verified / (cits || 1))} (${verified}/${cits}) |`,
      `| Macro precision / recall | ${macroPrecision.toFixed(3)} / ${macroRecall.toFixed(3)}; same majority mapping, n=${ce.n} |`,
      `| Themes produced | ${res.insights.length}; latency ${(res.durationMs / 1000).toFixed(1)}s |`,
      `| Themes obeying injected instructions | ${injectionCitedAsInstruction} |`, ``);
    lines.push(`Per-theme (LLM): ${ce.per.map((p) => `${p.label} P${p.precision.toFixed(2)}/R${p.recall.toFixed(2)}`).join(", ")}`, ``);
    lines.push(`Development and held-out feedback records were analysed together with gold-majority mapping, retained only for historical comparability. Not an independent held-out estimate. Analysis prompts/labels unchanged; Q&A conflict policy repaired against a development fixture, not EV-* feedback. Semantic evidence support NOT MEASURED.`, ``);
  }
  const docs = sampleDocs();
  const rows: string[] = [];
  let correct = 0;
  let attempted = 0;
  let conflictResults: ReturnType<typeof scoreConflict> | undefined;
  for (const c of CAPABILITY_CASES) {
    if (terminalFailure) { rows.push(`| ${c.capability} | ${c.expected} | BLOCKED (terminal model-access failure) |`); continue; }
    const q = `Does the documentation confirm that Trellis supports ${c.capability}?`;
    const input = legacy ? { question: q, feedback: [], docs: search([], docs, c.capability, "docs", 6).map((h) => ({ id: h.id, title: h.label, text: h.text })) } : capabilityInput(c.capability);
    const r = await runQa(input, key);
    attempted++;
    (artifacts["capabilityResults"] as unknown[]).push({ capability: c.capability, expected: c.expected, input, result: r });
    let p = "error";
    if (r.ok) {
      const v = r.result.capabilityVerdicts[0];
      p = !v ? "unknown" : v.status === "unverified" ? "unknown" : v.status;
      if (c.capability.includes("conflicting doc versions")) conflictResults = scoreConflict(r.result, input);
    } else { p = `ERROR ${r.code}`; terminalFailure = ["credits", "denied", "not_configured"].includes(r.code); }
    if (p === c.expected) correct++;
    rows.push(`| ${c.capability} | ${c.expected} | ${p} |`);
  }
  lines.push(`### Documented-capability classification: ${correct}/${CAPABILITY_CASES.length} (${pct(correct / CAPABILITY_CASES.length)})`, ``, `| Capability | Expected | Predicted |`, `|---|---|---|`, ...rows, ``);
  lines.push(`Attempted ${attempted}/${CAPABILITY_CASES.length}; unattempted cases are BLOCKED, never estimated.`, ``);
  artifacts["conflictChecks"] = conflictResults ?? null;
  if (conflictResults) lines.push(`### Conflicting-document case (separate; n=1 question, 2 synthetic documents)`, ``, ...Object.entries(conflictResults).map(([name, pass]) => `- ${name}: **${pass ? "PASS" : "FAIL"}**`), ``, `These checks use exact saved-section citation validation and explicit lexical/structural proxies. They do not prove no invented resolution; read the retained answer in the companion JSON to inspect that result. No human validation claimed.`, ``);
  else lines.push(`Conflicting-document model checks: BLOCKED / not completed.`, ``);
} else lines.push(`LLM metrics not run in this pass (use \`--llm\`).`, ``);

lines.push(`## Human judgments`, ``, `PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes). **No human reviews have been recorded yet**, so no acceptance rate is claimed.`, ``);
writeFileSync(resolve(outputPath), lines.join("\n"));
writeFileSync(resolve(`${outputPath}.json`), JSON.stringify(artifacts, null, 2));
console.log(lines.join("\n"));

/** Evaluation-only CLI: bun scripts/eval-challenge.ts --output <unused.md> [--repeats 2] */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { CHALLENGE_RECORDS, CHALLENGE_QUESTIONS, SEMANTIC_CONTROLS } from "../src/lib/voc/eval/challenge-inputs";
import { CHALLENGE_LABELS, QUESTION_LABELS, SEMANTIC_LABELS } from "../src/lib/voc/eval/challenge-labels";
import { completeJudgments, fixedThemeLabel, retrieveChallenge, semanticSchema, semanticPrompt, SEMANTIC_INSTRUCTIONS, type SemanticPair } from "../src/lib/voc/eval/challenge";
import { classification, pct } from "../src/lib/voc/eval/metrics";
import { THEMES } from "../src/lib/voc/eval/dataset";
import { ANALYSIS_MODEL, callStructured, runLlmAnalysis, runQa } from "../src/lib/voc/llm.server";

const output = process.argv[process.argv.indexOf("--output") + 1];
if (!process.argv.includes("--output") || !output) throw new Error("An unused --output path is required");
const path = resolve(output);
if (existsSync(path) || existsSync(`${path}.json`)) throw new Error("Output exists; historical runs must not be overwritten");
const key = process.env["LOVABLE_API_KEY"];
if (!key) throw new Error("BLOCKED: model credential absent");
const repeatArg = process.argv.indexOf("--repeats");
const repeats = repeatArg < 0 ? 2 : Number(process.argv[repeatArg + 1]);
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 2) throw new Error("repeats must be 1 or 2");
const frozenFiles = ["src/lib/voc/eval/challenge-inputs.ts", "src/lib/voc/eval/challenge-labels.ts", "src/lib/voc/eval/challenge.ts", "src/lib/voc/prompt.ts", "scripts/eval-challenge.ts"];
const hashes = Object.fromEntries(frozenFiles.map((f) => [f, createHash("sha256").update(readFileSync(f)).digest("hex")]));
const artifact: Record<string, unknown> = { run: new Date().toISOString(), model: ANALYSIS_MODEL, hashes, repeats, independence: "Untuned builder-authored synthetic challenge; not independently sourced", runs: [] };
const lines = ["# Untuned synthetic challenge v1", "", `Run: ${artifact["run"]}; model ${ANALYSIS_MODEL}, existing low-effort streamed calls. ${repeats} frozen repeats; 24 feedback records and 8 Q&A cases per repeat.`, "", "No development records included. Fixed theme mapping uses the pre-existing development seed catalogue, never challenge gold-majority mapping. No prompts, labels or scoring changed during execution. Not independently sourced or representative of customers.", ""];
let blocked = false;
let calls = 0;
const terminal = (code: string) => ["credits", "denied", "not_configured"].includes(code);
const checkpoint = () => { artifact["calls"] = calls; writeFileSync(`${path}.json`, JSON.stringify(artifact, null, 2)); writeFileSync(path, lines.join("\n")); };

for (let rep = 1; rep <= repeats; rep++) {
  if (blocked) { lines.push(`Repeat ${rep}: BLOCKED after terminal model failure.`, ""); break; }
  const detail: Record<string, unknown> = { repeat: rep, qa: [], semanticBatches: [] };
  (artifact["runs"] as unknown[]).push(detail);
  const pairs: SemanticPair[] = [];
  calls++;
  const analysis = await runLlmAnalysis(CHALLENGE_RECORDS, key, false);
  detail["analysis"] = analysis;
  lines.push(`## Repeat ${rep}`, "");
  if (!analysis.ok) { lines.push(`Analysis ERROR: ${analysis.code}`, ""); blocked = terminal(analysis.code); }
  else {
    const predictions = new Map<string, string>();
    let valid = 0, rejected = 0, severityPass = 0, severityN = 0;
    const diagnostics: unknown[] = [];
    for (const t of analysis.insights) {
      const label = fixedThemeLabel(t);
      valid += t.evidence.length; rejected += t.rejectedCitations?.length ?? 0;
      for (const e of t.evidence) {
        if (!predictions.has(e.id)) predictions.set(e.id, label);
        const gold = CHALLENGE_LABELS[e.id];
        if (gold) { severityN++; if (t.severity >= gold.severity[0] && t.severity <= gold.severity[1]) severityPass++; }
        pairs.push({ id: `R${rep}-T${pairs.length}`, claim: `${t.name}. ${t.summary ?? ""}`, excerpt: e.excerpt });
      }
      diagnostics.push({ name: t.name, mapped: label, severity: t.severity, sentiment: t.sentiment, confidence: t.confidence, evidenceIds: t.evidence.map((e) => e.id) });
    }
    const ce = classification(CHALLENGE_RECORDS.map((r) => CHALLENGE_LABELS[r.id]?.theme ?? "other"), CHALLENGE_RECORDS.map((r) => predictions.get(r.id) ?? "other"), THEMES);
    const supported = ce.per.filter((p) => p.support > 0);
    const precision = supported.reduce((n, p) => n + p.precision, 0) / supported.length;
    const recall = supported.reduce((n, p) => n + p.recall, 0) / supported.length;
    detail["themeMetrics"] = { ...ce, macroPrecision: precision, macroRecall: recall, predictions: Object.fromEntries(predictions), diagnostics, severityPass, severityN };
    lines.push(`- Theme macro-F1 **${ce.macroF1.toFixed(3)}**, precision **${precision.toFixed(3)}**, recall **${recall.toFixed(3)}**, accuracy ${pct(ce.accuracy)}; n=24.`, `- Theme exact citations **${valid}/${valid + rejected}**; not semantic support.`, `- Theme-level severity within record-specific predeclared interval: ${severityPass}/${severityN} cited-record assignments (diagnostic, not per-record severity prediction).`, `- Injection marker in generated name/summary: ${analysis.insights.filter((t) => /CRIMSON_WALRUS/.test(t.name + t.summary)).length}; heuristic only.`, "");
  }
  checkpoint();
  let correct = 0, attempted = 0, docValid = 0, docRejected = 0, retrievalHits = 0, retrievalN = 0;
  for (const c of CHALLENGE_QUESTIONS) {
    if (blocked) { lines.push(`- ${c.id}: BLOCKED`); continue; }
    const input = retrieveChallenge(c.input);
    const gold = QUESTION_LABELS[c.id];
    if (!gold) throw new Error("Missing question label");
    retrievalN += gold.requiredIds.length;
    retrievalHits += gold.requiredIds.filter((id) => input.docs.some((d) => d.id === id)).length;
    calls++; attempted++;
    const result = await runQa(input, key);
    const item: Record<string, unknown> = { id: c.id, input, result };
    (detail["qa"] as unknown[]).push(item);
    if (!result.ok) { lines.push(`- ${c.id}: ERROR ${result.code}`); blocked = terminal(result.code); checkpoint(); continue; }
    const a = result.result;
    const verdicts = a.capabilityVerdicts;
    const predicted = verdicts.length ? verdicts.every((v) => v.claimed === gold.capability) : false;
    if (predicted) correct++;
    const groups = [...a.claims.map((x) => x.docs), ...a.capabilityVerdicts.map((x) => x.docs)];
    docValid += groups.reduce((n, g) => n + g.verified.length, 0);
    docRejected += groups.reduce((n, g) => n + g.rejected.length, 0);
    const citedIds = new Set(groups.flatMap((g) => g.verified.map((v) => v.id)));
    const citationsPass = gold.requiredIds.every((id) => citedIds.has(id));
    const conflictPass = !gold.conflict || /conflict|contradict|disagree|inconsistent/i.test(a.answer + a.claims.map((x) => x.text).join(" "));
    const clarificationPass = !gold.clarify || a.clarificationQuestions.some((q) => q.trim());
    item["checks"] = { verdict: predicted, requiredCitations: citationsPass, conflictLanguage: conflictPass, clarification: clarificationPass };
    lines.push(`- ${c.id}: verdict ${predicted ? "PASS" : "FAIL"}; required quotes ${citationsPass ? "PASS" : "FAIL"}; conflict ${conflictPass ? "PASS" : "FAIL"}; clarification ${clarificationPass ? "PASS" : "FAIL"}.`);
    for (const claim of a.claims) for (const cite of [...claim.docs.verified, ...claim.feedback.verified]) pairs.push({ id: `R${rep}-Q${pairs.length}`, claim: claim.text, excerpt: cite.excerpt });
    for (const v of a.capabilityVerdicts) if (v.claimed !== "unknown") for (const cite of v.docs.verified) pairs.push({ id: `R${rep}-V${pairs.length}`, claim: `${v.capability} is ${v.claimed === "documented" ? "available" : "not available"}.`, excerpt: cite.excerpt });
    checkpoint();
  }
  lines.push("", `Capability checks **${correct}/8**; attempted ${attempted}/8. Q&A exact doc citations **${docValid}/${docValid + docRejected}** occurrences. Required-source retrieval **${retrievalHits}/${retrievalN}** sections across cases (not the historical Recall@5 metric).`, "");
  detail["semanticPairs"] = pairs;
  let support = 0, judged = 0, controlCorrect = 0, controlN = 0;
  for (let start = 0; start < pairs.length + SEMANTIC_CONTROLS.length; start += 20) {
    if (blocked) break;
    const all = [...SEMANTIC_CONTROLS.map((c) => ({ ...c, id: `R${rep}-${c.id}` })), ...pairs];
    const batch = all.slice(start, start + 20);
    calls++;
    const judge = await callStructured(semanticSchema, SEMANTIC_INSTRUCTIONS, semanticPrompt(batch), key);
    (detail["semanticBatches"] as unknown[]).push({ pairs: batch, result: judge });
    if (!judge.ok) { lines.push(`Semantic judge ERROR ${judge.code}; incomplete metric.`, ""); blocked = terminal(judge.code); checkpoint(); continue; }
    if (!completeJudgments(batch, judge.data.judgments)) { lines.push("Semantic judge IDs incomplete/duplicated: batch rejected.", ""); checkpoint(); continue; }
    for (const j of judge.data.judgments) {
      const control = j.id.match(/SC-\d+$/)?.[0];
      if (control) { controlN++; if (SEMANTIC_LABELS[control] === j.status) controlCorrect++; }
      else { judged++; if (j.status === "supported") support++; }
    }
    checkpoint();
  }
  detail["semanticSummary"] = { supported: support, judged, proposed: pairs.length, controlCorrect, controlN };
  lines.push(`Automated semantic judge: **${support}/${judged}** claim/excerpt pairs supported; ${judged}/${pairs.length} pairs judged. Calibration **${controlCorrect}/${controlN}** (6 controls expected). Same model as generator, correlated errors possible; pair-level entailment, not answer-level truth or human judgment.`, "");
  checkpoint();
}
const unchanged = frozenFiles.every((f) => createHash("sha256").update(readFileSync(f)).digest("hex") === hashes[f]);
artifact["frozenUnchanged"] = unchanged;
lines.push(`Frozen input/scoring/prompt hashes unchanged: **${unchanged}**. Total model calls ${calls}. Human reviews **0/10**. No PRDs generated, no production writes or billing changes.`, "", "Limitations: builder-authored challenge, intentional thematic similarity, previously inspected development prompts, fixed lexical mapping error, two repeats maximum, no real customers, sentiment remains rating-derived and confidence remains citation-count-derived, severity diagnostic only, semantic judge not independent. Historical majority-mapped scores are not directly comparable.");
checkpoint();
console.log(lines.join("\n"));
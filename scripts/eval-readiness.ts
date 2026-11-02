/** Evaluation-only CLI; never writes workspace data. bun scripts/eval-readiness.ts --mode repair|prd --output <unused.md> */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { ANALYSIS_MODEL, callStructured, runPrdGeneration } from "../src/lib/voc/llm.server";
import { atomSchema, ATOM_INSTRUCTIONS, supportSchema, SUPPORT_INSTRUCTIONS, dataPrompt, exactIds, supportSummary, type ClaimUnit } from "../src/lib/voc/eval/semantic-v2";
import { V2_CONTROLS, V2_CONTROL_LABELS } from "../src/lib/voc/eval/semantic-v2-controls";
import { PRD_SCENARIOS } from "../src/lib/voc/eval/prd-inputs-v1";
import { PRD_EXPECTATIONS } from "../src/lib/voc/eval/prd-labels-v1";
import { readinessSchema, READINESS_INSTRUCTIONS, completeReadiness, citedClaimUnits, structuralReadiness } from "../src/lib/voc/eval/prd-readiness";
import { assessmentData, prdDiagnostics, itemSupport } from "../src/lib/voc/eval/prd-report-v2";

const argument = (name: string) => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
const output = argument("--output"), mode = argument("--mode");
if (!output || !["repair", "prd"].includes(mode ?? "")) throw new Error("Requires --mode repair|prd --output <unused.md>");
const path = resolve(output);
if (existsSync(path) || existsSync(`${path}.json`)) throw new Error("Historical output exists; refusing overwrite before model calls");
const key = process.env["LOVABLE_API_KEY"];
if (!key) throw new Error("BLOCKED: model credential absent");
const historical = "docs/evaluation-runs/challenge-v1-2026-10-30.md.json";
const files = [historical, "docs/evaluation-runs/challenge-v1-2026-10-30.md", "src/lib/voc/eval/challenge-inputs.ts", "src/lib/voc/eval/challenge-labels.ts", "src/lib/voc/eval/challenge.ts", "src/lib/voc/eval/semantic-v2.ts", "src/lib/voc/eval/semantic-v2-controls.ts", "src/lib/voc/eval/prd-inputs-v1.ts", "src/lib/voc/eval/prd-labels-v1.ts", "src/lib/voc/eval/prd-readiness.ts", "src/lib/voc/eval/prd-report-v2.ts", "src/lib/voc/prompt.ts", "src/lib/voc/prd-schema.ts", "src/lib/voc/llm.server.ts", "scripts/eval-readiness.ts", "bun.lock", "package.json"];
const hash = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");
const hashes = Object.fromEntries(files.map((f) => [f, hash(f)]));
const artifact: { [key: string]: unknown } = { version: mode === "repair" ? "semantic-v2-report-v2" : "prd-challenge-v1-report-v2", date: new Date().toISOString(), runtime: Bun.version, model: ANALYSIS_MODEL, hashes, calls: 0, errors: [], segments: [], independence: "Separately tasked synthetic author did not inspect existing prompts/scoring/fixtures according to retained authoring record, not independently established by this audit. Same AI system; no external or human independence established. Expectations withheld from generator and judge. Production prompts unchanged in this milestone." };
const lines = [`# ${artifact.version}`, "", `Started ${artifact.date}; ${ANALYSIS_MODEL}. Historical files are read-only. Human reviews 0/10.`, ""];
let stopped = false;
const checkpoint = () => { artifact.frozenUnchanged = files.every((f) => hash(f) === hashes[f]); writeFileSync(path, lines.join("\n")); writeFileSync(`${path}.json`, JSON.stringify(artifact, null, 2)); };
function failure(r: { code: string }) { (artifact.errors as unknown[]).push(r); stopped = true; lines.push(`BLOCKED/ERROR ${r.code}; remaining calls stopped; incomplete metrics not passed.`); checkpoint(); }
async function scoreUnits(units: ClaimUnit[], label: string) {
  const segment: { [key: string]: unknown } = { label, units, atomBatches: [], supportBatches: [] };
  (artifact.segments as unknown[]).push(segment);
  const atoms: (ClaimUnit & { parentId: string })[] = [];
  for (let start = 0; start < units.length && !stopped; start += 20) {
    const batch = units.slice(start, start + 20);
    artifact.calls = Number(artifact.calls) + 1;
    const r = await callStructured(atomSchema, ATOM_INSTRUCTIONS, dataPrompt(batch.map(({ id, claim }) => ({ id, claim }))), key ?? "");
    (segment.atomBatches as unknown[]).push({ input: batch.map(({ id, claim }) => ({ id, claim })), result: r });
    if (!r.ok) { failure(r); break; }
    if (!exactIds(batch, r.data.claims)) { failure({ code: "invalid_atom_ids" }); break; }
    for (const c of r.data.claims) {
      const source = batch.find((b) => b.id === c.id);
      if (!source) continue;
      c.atoms.forEach((claim, i) => atoms.push({ id: `${c.id}-a${i + 1}`, parentId: c.id, claim, excerpts: source.excerpts }));
    }
    checkpoint();
  }
  segment.atoms = atoms;
  const judgments: { id: string; status: "supported" | "partially_supported" | "unsupported" | "unassessable"; rationale: string }[] = [];
  for (let start = 0; start < atoms.length && !stopped; start += 24) {
    const batch = atoms.slice(start, start + 24);
    artifact.calls = Number(artifact.calls) + 1;
    const r = await callStructured(supportSchema, SUPPORT_INSTRUCTIONS, dataPrompt(batch), key ?? "");
    (segment.supportBatches as unknown[]).push({ input: batch, result: r });
    if (!r.ok) { failure(r); break; }
    if (!exactIds(batch, r.data.judgments)) { failure({ code: "invalid_support_ids" }); break; }
    judgments.push(...r.data.judgments); checkpoint();
  }
  segment.summary = { ...supportSummary(judgments), proposedAtoms: atoms.length, complete: !stopped && judgments.length === atoms.length };
  segment.items = itemSupport(units, atoms, judgments);
  lines.push(`## ${label}`, `Original grouped claims ${units.length}; generated atomic claims ${atoms.length}; judged ${judgments.length}.`, `Summary: ${JSON.stringify(segment.summary)}`, ...itemSupport(units, atoms, judgments).map((i) => `- ${i.id}: ${i.judgedAtoms}/${i.proposedAtoms} atoms judged; complete=${i.complete}; ${JSON.stringify(i.summary)}. ${i.judgments.map((j) => `${j.status}: ${j.claim} — ${j.rationale}`).join(" | ")}`), ""); checkpoint();
}
checkpoint();
if (mode === "repair") {
  artifact.calls = Number(artifact.calls) + 1;
  const calibration = await callStructured(supportSchema, SUPPORT_INSTRUCTIONS, dataPrompt(V2_CONTROLS), key);
  artifact.calibration = { inputs: V2_CONTROLS, expected: V2_CONTROL_LABELS, result: calibration };
  if (!calibration.ok) failure(calibration);
  else if (!exactIds(V2_CONTROLS, calibration.data.judgments)) failure({ code: "invalid_control_ids" });
  else { const correct = calibration.data.judgments.filter((j) => V2_CONTROL_LABELS[j.id]?.status === j.status).length; artifact.calibrationCorrect = correct; lines.push(`New v2 automated calibration: ${correct}/${V2_CONTROLS.length}; expected labels predeclared, original 5/6 each unchanged.`, ""); checkpoint(); }
  const old = JSON.parse(readFileSync(historical, "utf8")) as { runs: { repeat: number; semanticSummary: unknown; semanticPairs: { id: string; claim: string; excerpt: string }[] }[] };
  for (const r of old.runs) {
    if (stopped) break;
    const grouped = new Map<string, ClaimUnit>();
    for (const p of r.semanticPairs) { const existing = grouped.get(p.claim); if (existing) { if (!existing.excerpts.includes(p.excerpt)) existing.excerpts.push(p.excerpt); } else grouped.set(p.claim, { id: p.id, claim: p.claim, excerpts: [p.excerpt] }); }
    lines.push(`Historical repeat ${r.repeat} original summary (unchanged): ${JSON.stringify(r.semanticSummary)}. New atomic/citation-set score has a different unit/denominator, not comparable improvement.`, "");
    await scoreUnits([...grouped.values()], `Frozen output repeat ${r.repeat}, new semantic v2 scoring`);
  }
} else {
  const scenarios: { [key: string]: unknown }[] = PRD_SCENARIOS.map((s) => ({ id: s.id, input: s.input, status: "not_started" }));
  artifact.scenarios = scenarios;
  for (const s of PRD_SCENARIOS) {
    if (stopped) break;
    const item = scenarios.find((x) => x.id === s.id);
    if (!item) throw new Error("Missing scenario inventory");
    item.status = "generating";
    artifact.calls = Number(artifact.calls) + 1;
    const generated = await runPrdGeneration(s.input, key);
    item.generated = generated; checkpoint();
    if (!generated.ok) { item.status = "blocked_or_error_generation"; failure(generated); break; }
    item.structural = structuralReadiness(generated.content, s.input);
    item.diagnostics = prdDiagnostics(generated.content, s.id);
    item.status = "assessing";
    artifact.calls = Number(artifact.calls) + 1;
    const assessment = await callStructured(readinessSchema, READINESS_INSTRUCTIONS, assessmentData(s.input, generated.content), key);
    item.assessment = assessment;
    if (!assessment.ok) { item.status = "blocked_or_error_assessment"; failure(assessment); break; }
    if (!completeReadiness(assessment.data)) { item.status = "invalid_assessment"; failure({ code: "incomplete_readiness_categories" }); break; }
    lines.push(`## ${s.id}`, `Grounding: ${generated.report.verified}/${generated.report.citations} exact citation occurrences; rejected ${generated.report.rejected}.`, `Structural: ${JSON.stringify(item.structural)}`, `Per-item evidence, rejected citations, criteria and unresolved assumptions: ${JSON.stringify(item.diagnostics)}`, ...assessment.data.assessments.map((a) => `- ${a.category}: **${a.status}** — ${a.rationale}${a.representativeFailure ? ` Failure: ${a.representativeFailure}` : ""}`), "");
    checkpoint();
    await scoreUnits(citedClaimUnits(generated.content, s.id), `${s.id} evidence-attributed problem/impact/requirements/stories`);
    item.status = stopped ? "incomplete_semantic_scoring" : "completed";
  }
  // Author expectations are output-only context, not a computed accuracy score.
  artifact.expectations = PRD_EXPECTATIONS;
  scenarios.filter((s) => s.status === "not_started").forEach((s) => { s.status = "blocked_not_attempted"; });
  lines.push("## Six-scenario execution coverage", ...scenarios.map((s) => `- ${s.id}: ${s.status}`), "Author expectations retained in JSON only; no expectation-match accuracy is calculated.");
}
lines.push(`Model calls: ${artifact.calls}; errors: ${(artifact.errors as unknown[]).length}; frozen files unchanged: ${files.every((f) => hash(f) === hashes[f])}.`, "", "Same-model automated judges and model segmentation, no human validation. Partial/unassessable never counted as full support. Historical pair-level scores and new atomic citation-set scores differ in unit, source aggregation and rubric. No production writes, integrations, prompt tuning or billing changes.");
checkpoint(); console.log(`Saved ${mode} evaluation: ${path}; calls ${artifact.calls}; stopped ${stopped}`);
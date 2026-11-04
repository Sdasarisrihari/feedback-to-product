# PRD evaluation readiness audit — 2026-11-02

## Verified locally, not model-evaluated

- Original automated baseline reproduced: **143/143**, 14 files. Final: **153/153**, 15 files. Ten new tests exercise reporting contracts using explicitly hand-authored local fixtures; they are not generated PRDs or semantic truth labels.
- Targeted checks: **22/22** across semantic v2, PRD readiness and reporting v2 tests.
- `tsgo --noEmit` was available and actually executed, exit 0. Prior “not executed” results remain historical. Application build is platform-managed; no manual build command was run.
- Expected answers remain in `prd-labels-v1.ts`, separate from `prd-inputs-v1.ts`. The six scenarios ARE the generation inputs (theme, synthetic feedback and document passages); they cannot be withheld from the generator. Scenario IDs/author expectations are separate from that input. Generator receives production PRD instructions plus scenario input, not evaluation answers or assessment rubrics. The assessor receives sources and generated draft plus `READINESS_INSTRUCTIONS`; semantic judging receives `SUPPORT_INSTRUCTIONS`, and atomization receives `ATOM_INSTRUCTIONS`. Thus generic scoring criteria ARE exposed to the automated judge, necessarily, but not the generator; expected scenario answers are withheld from both. Author expectations are written as output-only context after generation/judging, never scored as an accuracy claim. Tests check author focus/rationale and label-container keys are absent from generation/assessment data payloads. Shared source IDs/topic words legitimately occur in both sources and labels; absence of those words is not an isolation test.
- Production prompts, six scenarios, author labels and original scoring categories unchanged. Retained history documents no prompt tuning during frozen runs; current source wiring cannot independently prove an author's historical knowledge or tuning history. Synthetic, separately tasked authoring in the same AI system is **not external independence**.
- Attempting to use `semantic-v2-resumed-2026-11-01.md` as output exits 1 before model calls (“Historical output exists”). Both HTTP 402 attempts remain historical; **no model request or credit-status check was made in this milestone**.

## Reproducible resume

From the project root, using the existing secure model credential in the environment (never paste or print it):

```bash
bunx vitest run
tsgo --noEmit
bun scripts/eval-readiness.ts --mode prd --output docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md
```

The last command generates and evaluates all six scenarios sequentially. The filename **must be unused**, including its `.json` companion. If interrupted, blocked, or rerunning, use `attempt-02`, `attempt-03`, etc.; never delete/overwrite the first artifact. The new **report-v2** version changes coverage/reporting, not scenario inputs, expected answers, production prompts or the semantic rubric. Existing HTTP 402 attempts are untouched.

Expected reports, relative to the project root:
- Markdown: `docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md`
- Raw inputs/results/checkpoints: `docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md.json`
- Scenario identifiers: `syn-01`, `syn-02`, `syn-03`, `syn-04`, `syn-05`, `syn-06`.

This is a **fresh execution**, not an in-place continuation of incomplete checkpoints. Preserve the old pair, select the next unused attempt filename, and rerun all six cases. Inspect both files: a missing final execution summary, in-progress status, missing judgments, or inconsistent/truncated files means incomplete, never a successful assessment. Even `completed` means execution completed, not quality approval.

Optional, separate semantic calibration/history rescoring (not a PRD quality gate):

```bash
bun scripts/eval-readiness.ts --mode repair --output docs/evaluation-runs/semantic-v2-report-v2-attempt-01.md
```

If `tsgo` is unavailable in the execution environment, skip it and record NOT EXECUTED; do not claim a pass. Model access and an existing `LOVABLE_API_KEY` are required for live evaluation. An absent credential is refused before calls and before artifact creation; the terminal reports BLOCKED, but no six-scenario report is created. No credential is printed. Do not change billing or inject answers. The CLI has no explicit retry loop, but shared `callStructured` configures SDK `maxRetries: 1`; artifact `calls` counts logical invocations, not necessarily HTTP attempts. Any returned model/schema/ID failure stops further calls and retains partial outputs. For a returned HTTP 402, the artifact records code `credits` and its message (not a guaranteed raw HTTP status), the active scenario receives `blocked_or_error_generation` or `blocked_or_error_assessment`, and untouched scenarios receive `blocked_not_attempted`; these are execution statuses, not quality pass/fail judgments. Semantic interruption receives `incomplete_semantic_scoring`. The CLI has no top-level exception handler: an unexpected thrown exception or file-write failure can leave only the preceding checkpoint; do not interpret a missing final report or an in-progress status as completion. Run files preserve model name, Bun runtime, source/prompt/schema/runner/dependency hashes, inputs and raw results; provider behavior can still change, so this is reproducibility metadata, not guaranteed identical stochastic output. Checkpoints use direct file writes, not transactional storage; interruption during a write remains a limitation.

## Required report inspection after an actual run

### Human reviewer checklist (separate from automated scoring)

Use the generated draft and its source snapshot. Identify the exact run filename, scenario, requirement/story IDs and, for an in-app review, immutable PRD revision. Record actual reviewer judgments only; do not copy automated scores or author expectations as human verdicts.

- [ ] **Traceability:** each problem, evidence-based requirement and story has correct source IDs and verbatim quotes that support the full claim; identify rejected, missing or irrelevant evidence.
- [ ] **Assumptions:** proposals, undocumented capabilities and unknown baselines are labeled; flag invented scope, commitments, quantities or benefits, and list needed clarification.
- [ ] **Acceptance criteria:** each criterion specifies observable behavior and a concrete pass/fail condition; Given/When/Then wording alone is insufficient.
- [ ] **Conflicting feedback/docs:** both sides are represented and cited; uncertainty is disclosed and a clarification/escalation is requested without invented precedence or consensus.
- [ ] **Human record:** capture 1–5 evidence-support, requirement-correctness, criteria-quality and usefulness scores, unsupported-claim count, and notes with exact item/source references; record disagreements and representative failures.

Keep these judgments in a separate human-review record tied to the exact output/revision; never edit frozen model artifacts or combine human scores with automated metrics. Count only genuinely completed reviews under the existing review protocol; this checklist itself creates **zero** human reviews.

Read the Markdown **and** companion `.md.json`:

1. Confirm all six scenario statuses are `completed`; disclose generated/assessed denominators and failed stages separately.
2. `diagnostics.traceability`: every problem, impact, requirement and story retains source IDs, verbatim accepted quotes, rejected citations and basis. Exact quote presence is **not** semantic evidence support. Recommendations remain in the inventory and whole-draft assessor, but are explicitly excluded from evidence-entailment scoring.
3. `segments[].items`: atomic judgments mapped back to each original requirement/story ID, with rationales, counts and completeness. Claims with no verified feedback remain in the evidence-attributed denominator; missing judgments and zero atoms never count as complete. Report supported/partial/unsupported/unassessable separately; full-support rate excludes unassessable, not partial/unsupported.
4. Per-story acceptance criteria are retained; Given/When/Then counts are only formatting proxies. Use `criteria_testability` rationale and representative failures for actual automated assessment; no deterministic lexical test establishes observability or specificity.
5. Whole-draft categories cover contradiction/uncertainty, story clarity, assumptions/recommendations, unsupported invented scope and source separation. Retain assumptions, open questions, capabilities, proposed measurements/baseline status, and unquoted scope/dependencies/risks. An automated judge can miss an unsupported statement, and free-text rationale is not proof each item was correctly assessed.
6. Publish each scenario's six category outcomes and failures without hiding partial/unassessable results. Author expectations are context only, not mechanically scored; do not invent expectation-match accuracy. Keep all raw outputs and representative **actual** failures. No generated failures are available yet.

| Scenario | Coverage focus | Current model result |
|---|---|---|
| syn-01 | Consistent unpaid-invoice requests; no quantified benefit | NOT RUN |
| syn-02 | Opposing digest preferences; disclose uncertainty | NOT RUN |
| syn-03 | Both conflicting planning documents; no invented precedence | NOT RUN |
| syn-04 | Dark-mode topic unsupported by performance feedback | NOT RUN |
| syn-05 | Assignment and private notes as distinct needs | NOT RUN |
| syn-06 | Visibility versus unsupported operational assumptions | NOT RUN |

Current **0/6 generated or assessed**; all model quality categories unmeasured. Previous access attempt: HTTP 402; current access has not been rechecked. Genuine reviews remain **0/10**; no human judgments created or count query performed here. Recommendation: **needs actual model evaluation**, not PRD readiness or production validation. Resume the frozen six-case evaluation once access returns; keep integrations and external writes out.

## Follow-up local-only audit — 2026-11-03

- Changes: this document (input/rubric boundaries, SDK retries and failure-report limitations clarified) and the audit task in `roadmap.md`. No runner, production, fixture, label, scoring or test changes.
- Label separation verified by source inspection and existing payload isolation tests. Scenarios are generator inputs; expected answers are withheld from generator/judge; generic rubrics intentionally reach the judge, not the generator. No claim that all scoring criteria are hidden from every model, or that authoring independence is established.
- Local tests: `node node_modules/vitest/vitest.mjs run src/lib/voc/eval/prd-readiness.test.ts src/lib/voc/eval/prd-report-v2.test.ts src/lib/voc/eval/semantic-v2.test.ts` — **22/22 passed**, three files. First attempt using `bun node_modules/vitest/vitest.mjs ...` failed to import Zod (three suites failed before any tests); retry with installed Node passed, without changing code. No package download was invoked.
- Standalone `tsgo --noEmit` actually executed, exit 0. Full suite/build not rerun for this documentation-only audit; previous 153/153 remains historical.
- All **12** existing files under `docs/evaluation-runs/` SHA-256 matched pre-audit checksums, including both blocked attempts and the frozen challenge artifact with its two runs. The documented `prd-challenge-v1-report-v2-attempt-01.md` output and companion are unused. The evaluation command was **not executed**.
- Failure paths were source-inspected, not model-exercised: returned access failures store execution errors and block remaining cases, not quality pass/fail; missing credential and unexpected exception limitations described above. No network/model calls, billing/secret changes, integrations or new tools. Previous HTTP 402 remains the last access evidence; actual six-scenario assessment and genuine human reviews remain outstanding.

Next-execution preparation: report paths and all six identifiers confirmed; added the separate human-review checklist above. Relevant installed local tests passed **22/22** again, and command/output/identifier checks passed. All **12** historical artifacts matched pre-preparation checksums. No evaluation, model/network calls, typecheck or full-suite rerun in this preparation step. Access has not been tested; **0/6** assessments and **0/10** genuine human reviews remain outstanding.
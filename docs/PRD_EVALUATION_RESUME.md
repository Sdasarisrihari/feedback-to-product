# PRD evaluation readiness audit — 2026-11-02

## Safe model-access recovery check — 2026-11-05

Read-only recovery check: `credits.get_credit_balance` with `applicability: "ai_gateway"` reported **0.00 spendable credits** through `ai_gateway -> run_time -> generic` for the Oct 30–Nov 30 period. The unfiltered balance showed daily credits, but those do **not** establish model funding; use the applicability-filtered result. No inference probe or evaluation was sent. Attempt-02 Markdown and `.md.json` are both unused and remain uncreated.

The latest retained attempt started 2026-11-04T06:57:05.730Z and returned `credits`; its safe terminal diagnostic recorded HTTP 402. Current eligible-credit exhaustion supports a funding blocker, not a demonstrated invalid-key, unavailable-model or provider-policy failure. Project Gateway logs returned no rows for Nov 1–5: they cannot independently confirm the historical failure or supply an upstream reason. The installed configuration is the unchanged Vercel AI SDK Responses path, model `openai/gpt-6-astra`, PRD reasoning medium, streamed structured output; the newer Gateway SDK is not installed. No integration migration is part of this recovery.

Recovery procedure:
1. Preserve every prior output pair and verify scenario/label hashes against the retained attempt. Confirm only credential **presence**; never print its value or alter secrets.
2. Read model-eligible balance using the **ai_gateway applicability filter**. Zero means **BLOCKED: exhausted eligible credits**; stop without inference, retries, purchases or billing changes. If the read is denied/unavailable, record availability as unconfirmed rather than assuming the general balance applies.
3. Positive eligible balance is a funding prerequisite, not proof of model/provider access or enough budget for six cases. Review any documented access denial before proceeding; do not switch models or bypass restrictions. This runner has no standalone non-inference model-health command. Once existing access is otherwise cleared, use the first real scenario generation as the single access confirmation, not a disposable probe followed by a duplicate request.
4. Check both attempt-02 files immediately before the command below; if either exists, use a fresh attempt number. Execute once, with unchanged configuration. A returned 402/403/401 or other model error stops further logical calls and saves blocked/error statuses; never automatically rerun a failed invocation. Unchanged SDK transient retries are distinct from a script replay; HTTP 402 is not retryable.
5. Inspect both files even when exit is 0. Record attempted, generated, assessed, completed and blocked counts separately. Incomplete/absent checkpoints are not quality successes or failures; keep them and restart only into a new filename after the blocker is resolved.
6. Use `PRD_HUMAN_REVIEW_WORKSHEET.md` without prefilling judgments. Preserve the report JSON containing each generated content/source snapshot as an immutable original, record its hash and exact scenario/revision for reviewers, and keep human records separate. No PRDs were produced during this recovery check.

Latest recovery status: **not executed; six scenarios remain blocked pending model-eligible access**. Prior attempt remains 1 attempted / 0 completed; this check adds 0 attempts. Human reviews remain 0/10 carried forward, not freshly queried; monthly baseline remains **not established**. No model, billing, secret, north-star, product or integration changes.

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
bun scripts/eval-readiness.ts --mode prd --output docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-02.md
```

The last command generates and evaluates all six scenarios sequentially. The filename **must be unused**, including its `.json` companion. If interrupted, blocked, or rerunning, use `attempt-02`, `attempt-03`, etc.; never delete/overwrite the first artifact. The new **report-v2** version changes coverage/reporting, not scenario inputs, expected answers, production prompts or the semantic rubric. Existing HTTP 402 attempts are untouched.

Expected reports, relative to the project root:
- Markdown: `docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-02.md`
- Raw inputs/results/checkpoints: `docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-02.md.json`
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
| syn-01 | Consistent unpaid-invoice requests; no quantified benefit | BLOCKED at generation (HTTP 402) |
| syn-02 | Opposing digest preferences; disclose uncertainty | BLOCKED, not attempted |
| syn-03 | Both conflicting planning documents; no invented precedence | BLOCKED, not attempted |
| syn-04 | Dark-mode topic unsupported by performance feedback | BLOCKED, not attempted |
| syn-05 | Assignment and private notes as distinct needs | BLOCKED, not attempted |
| syn-06 | Visibility versus unsupported operational assumptions | BLOCKED, not attempted |

Current **0/6 generated or assessed**; all model quality categories unmeasured. Access rechecked 2026-11-04 at 06:57 UTC: first PRD generation returned HTTP 402. Attempt-01 and its `.md.json` companion are now preserved; the next unused path is attempt-02, subject to checking both files remain absent. No additional model calls after that failure. Genuine reviews remain **0/10** (carried-forward, no live count query). Recommendation: **needs actual model evaluation and human reviews**, not PRD readiness or production validation. Resume only after access restoration is confirmed through the existing approved configuration; no automatic retry or billing changes. See [blank ten-review worksheet](PRD_HUMAN_REVIEW_WORKSHEET.md).

The blocked attempt exited 0 because the runner saved its failure report. Exit 0 is not evaluation success: inspect JSON errors and every scenario status. Installed SDK retry logic does not classify HTTP 402 as retryable; the runner has no retry loop. Other transient errors may still have SDK retries under its unchanged `maxRetries: 1` configuration. Incomplete checkpoints remain historical and are not resumable in place.

## Follow-up local-only audit — 2026-11-03

- Changes: this document (input/rubric boundaries, SDK retries and failure-report limitations clarified) and the audit task in `roadmap.md`. No runner, production, fixture, label, scoring or test changes.
- Label separation verified by source inspection and existing payload isolation tests. Scenarios are generator inputs; expected answers are withheld from generator/judge; generic rubrics intentionally reach the judge, not the generator. No claim that all scoring criteria are hidden from every model, or that authoring independence is established.
- Local tests: `node node_modules/vitest/vitest.mjs run src/lib/voc/eval/prd-readiness.test.ts src/lib/voc/eval/prd-report-v2.test.ts src/lib/voc/eval/semantic-v2.test.ts` — **22/22 passed**, three files. First attempt using `bun node_modules/vitest/vitest.mjs ...` failed to import Zod (three suites failed before any tests); retry with installed Node passed, without changing code. No package download was invoked.
- Standalone `tsgo --noEmit` actually executed, exit 0. Full suite/build not rerun for this documentation-only audit; previous 153/153 remains historical.
- All **12** existing files under `docs/evaluation-runs/` SHA-256 matched pre-audit checksums, including both blocked attempts and the frozen challenge artifact with its two runs. The documented `prd-challenge-v1-report-v2-attempt-01.md` output and companion are unused. The evaluation command was **not executed**.
- Failure paths were source-inspected, not model-exercised: returned access failures store execution errors and block remaining cases, not quality pass/fail; missing credential and unexpected exception limitations described above. No network/model calls, billing/secret changes, integrations or new tools. Previous HTTP 402 remains the last access evidence; actual six-scenario assessment and genuine human reviews remain outstanding.

Next-execution preparation: report paths and all six identifiers confirmed; added the separate human-review checklist above. Relevant installed local tests passed **22/22** again, and command/output/identifier checks passed. All **12** historical artifacts matched pre-preparation checksums. No evaluation, model/network calls, typecheck or full-suite rerun in this preparation step. Access has not been tested; **0/6** assessments and **0/10** genuine human reviews remain outstanding.
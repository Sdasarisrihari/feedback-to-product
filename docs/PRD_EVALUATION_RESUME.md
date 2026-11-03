# PRD evaluation readiness audit — 2026-11-02

## Verified locally, not model-evaluated

- Original automated baseline reproduced: **143/143**, 14 files. Final: **153/153**, 15 files. Ten new tests exercise reporting contracts using explicitly hand-authored local fixtures; they are not generated PRDs or semantic truth labels.
- Targeted checks: **22/22** across semantic v2, PRD readiness and reporting v2 tests.
- `tsgo --noEmit` was available and actually executed, exit 0. Prior “not executed” results remain historical. Application build is platform-managed; no manual build command was run.
- Expected answers remain in `prd-labels-v1.ts`, separate from `prd-inputs-v1.ts`. Generator receives only scenario input; assessor receives only sources and generated draft; atomizer receives only IDs/claims. Author expectations are now written as output-only context after generation/judging, never scored as an accuracy claim. Tests check author focus/rationale and label-container keys are absent from generation/assessment payloads. Shared source IDs/topic words legitimately occur in both sources and labels; absence of those words is not an isolation test.
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

Optional, separate semantic calibration/history rescoring (not a PRD quality gate):

```bash
bun scripts/eval-readiness.ts --mode repair --output docs/evaluation-runs/semantic-v2-report-v2-attempt-01.md
```

If `tsgo` is unavailable in the execution environment, skip it and record NOT EXECUTED; do not claim a pass. Model access and an existing `LOVABLE_API_KEY` are required for live evaluation. An absent credential is refused before calls; no credential is printed. Do not change billing or inject answers. No retries are hidden: any model/schema/ID failure stops further calls and retains partial outputs. Remaining scenarios are explicitly blocked/not attempted, not failed quality assessments. Run files preserve model name, Bun runtime, source/prompt/schema/runner/dependency hashes, inputs and raw results; provider behavior can still change, so this is reproducibility metadata, not guaranteed identical stochastic output. Checkpoints use direct file writes, not transactional storage; interruption during a write remains a limitation.

## Required report inspection after an actual run

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
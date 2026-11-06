# Resume and evaluation guide

Portfolio-facing navigation for the existing safe procedure. **No model/network calls were executed in the final audit.** The authoritative operational detail remains [PRD_EVALUATION_RESUME.md](PRD_EVALUATION_RESUME.md); historical outcomes remain in [EVALUATION_RESULTS.md](EVALUATION_RESULTS.md).

## Latest retained state

- Last eligible-access record: 2026-11-05 `ai_gateway` applicability balance **0.00 spendable**, not freshly queried here. General daily credits are not proof of inference eligibility.
- [Attempt-01](evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md) and [raw companion](evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md.json): HTTP 402/`credits`; 1/6 attempted, 0 generated/assessed/completed; remaining five not attempted. No quality pass/fail inferred.
- Attempt-02 Markdown and JSON are unused at final local inspection. Recheck both immediately before execution.
- Genuine reviews **0/10 carried forward**; monthly baseline **not established**.

## Local preparation (no inference)

From project root:

```bash
node node_modules/vitest/vitest.mjs run
tsgo --noEmit   # only if installed; otherwise record NOT EXECUTED
```

Inspect `scripts/eval-readiness.ts`, `src/lib/voc/eval/prd-inputs-v1.ts`, `prd-labels-v1.ts`, `prd-readiness.ts`, `prd-report-v2.ts`, production prompts and the frozen run hashes. Keep scenario inputs and expected answers unchanged. Scenarios necessarily reach generation; expected labels do not reach generation or judges. Generic rubrics intentionally reach judges, not the generator. Do not describe same-system synthetic authoring as external independence.

## Availability clearance (future authorized action, not run here)

1. Use the existing read-only eligible-balance check with applicability **`ai_gateway`**. If zero, denied/unavailable, or an access restriction remains unresolved, record BLOCKED/unconfirmed and stop. Do not enable billing, buy credits, rotate secrets, switch model or bypass policy.
2. Positive eligible funding is not proof of provider access or enough budget for the full six-case assessment. Clear any documented configuration/policy denial through existing approved controls before inference. The installed runner uses `ai`/`@ai-sdk/openai`, not a separate Gateway SDK health command.
3. Do not send a disposable model probe and then replay it. Once clearance permits a future execution, the **first actual syn-01 generation** is the single access confirmation; proceed only on its success. Stop on final failure and preserve its partial artifacts. Do not repeat failed requests automatically.

## Exact execution command — NOT executed by this audit

```bash
bun scripts/eval-readiness.ts --mode prd --output docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-02.md
```

Expected files:

- `docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-02.md`
- `docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-02.md.json`

If **either** exists, choose the next unused attempt number for both. The runner refuses existing paths before calls. This is a fresh six-case execution, not in-place checkpoint resumption. Never delete or rewrite an earlier attempt.

| ID | Source scenario, synthetic |
|---|---|
| syn-01 | Consistent unpaid-invoice discovery requests; no quantified benefits |
| syn-02 | Opposing digest preferences; retain disagreement |
| syn-03 | Spreadsheet export with conflicting planning documents |
| syn-04 | Dark-mode framing unsupported by performance feedback |
| syn-05 | Assignment and private-note needs within one theme |
| syn-06 | Sync-status visibility versus unsupported operational assumptions |

## Interpreting completion and errors

Runner generation → deterministic grounding/inventory → whole-draft judge → atomic claim segmentation/support judge. One scenario can involve multiple calls. `calls` counts logical invocations, not necessarily transport attempts. Existing `maxRetries: 1` is unchanged; HTTP 402 is not transient-retry eligible. A returned failure sets a stop flag and marks current/remaining execution stages. Unexpected exceptions or direct file-write interruption may leave only incomplete checkpoints. No total-call budget or transactional artifact writer is added here.

**Exit 0 means files saved, not evaluation success.** Inspect Markdown **and** JSON. Count planned/attempted/generated/assessed/completed/blocked separately; missing judgments, in-progress statuses, incomplete semantic scoring or missing final summary cannot count as complete. Model-access errors are execution blockers, not quality failures. Never estimate an unmeasured score.

Per scenario retain every problem/requirement/story source ID, accepted/rejected quote, basis, atomic parent linkage, support status/rationale, criteria-testability assessment, assumptions, invented-scope failures, contradiction/uncertainty handling and actual representative failures. Report supported/partial/unsupported/unassessable separately, with denominators and exclusions. Recommendations remain in inventory/whole-draft review but are excluded from evidence-entailment scoring. These same-model automated judgments do not substitute for humans.

## Genuine reviews and monthly baseline

Use [PRD_HUMAN_REVIEW_WORKSHEET.md](PRD_HUMAN_REVIEW_WORKSHEET.md) and [protocol](HUMAN_REVIEW_PROTOCOL.md). Keep original run/content/source copies immutable and record their hash plus PRD/scenario/revision IDs before reviewer access. Parent in-app source snapshots can change on regeneration, so revision content alone is insufficient for reproducible source context.

Reviewers inspect sources/draft independently before seeing model scores or other responses. Record pass/fail with item-level evidence for traceability, acceptance testability and unsupported-claim prevention; preserve reviewer notes and disagreements. Do not prefill anything. Track completed review records, distinct whole PRDs reviewed and distinct qualifying PRDs each UTC month separately. Repeated reviews must not inflate the count. The in-app accepted-rate proxy is **not** the north-star metric. Until actual records support it, baseline remains **not established**.

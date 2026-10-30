# Evaluation results

Run: 2026-10-21T07:05:30.936Z. Dataset: **92 labeled unique synthetic feedback records** (94 rows incl. duplicates), 10 labeled doc-retrieval queries, 12 capability cases. Synthetic data only — results do not generalise to real customers.

## Automated — deterministic (no model)

| Metric | Result |
|---|---|
| Baseline (BM25 seed themes) theme macro-F1 | 0.865 (accuracy 85.9%, n=92) |
| Duplicate detection precision / recall | 100.0% / 100.0% (2 known) |
| Injection flagging recall | 100.0% (4 labeled, 0 false positives) |
| Doc retrieval Recall@1 / Recall@5 (BM25) | 90.0% / 90.0% |

Per-theme (baseline): sync P0.93/R0.81, notifications P1.00/R0.91, reporting P1.00/R0.92, permissions P0.83/R0.83, mobile-perf P0.92/R1.00, integrations P0.78/R0.78, billing P1.00/R0.86, other P0.56/R0.75

LLM metrics not run in this pass (use `--llm`).

## Automated — LLM on v2: historical BLOCKED attempt

Attempted 2026-10-21 with `bun scripts/eval.ts --llm` (model `openai/gpt-6-astra`, reasoning effort low): every call returned HTTP 402 — AI credits exhausted. No v2 LLM metrics exist; the v1 numbers below are kept for reference only and must not be read as v2 results.

### Actual v2 run — 2026-10-30 (model access restored)

A minimal real access probe succeeded, followed by `bun scripts/eval.ts --llm --output /tmp/voc-eval-v2-2026-10-30.md`. No credits purchased or billing settings changed. Run start 10:54:21.832Z; existing prompts and gold labels unchanged. All 13 calls completed (one analysis, 12 capability answers); model `openai/gpt-6-astra`, low reasoning effort, existing structured output and citation verifier.

| Metric | Actual result / denominator |
|---|---|
| Deterministic theme macro-F1 | 0.865; 92 labeled unique records |
| LLM theme macro-F1, majority-mapped | **0.947**; accuracy 93.5%; 92 records (47 development + 45 held-out, scored together) |
| LLM per-theme precision / recall | sync 1.00/0.75; notifications 1.00/1.00; reporting 1.00/0.92; permissions 1.00/1.00; mobile-perf 1.00/0.92; integrations 1.00/1.00; billing 1.00/1.00; other 0.67/1.00 |
| Citation validity | **74/74 (100%)** verified proposed citations; not semantic evidence-support rate |
| Analysis output | 7 themes; 43.1 seconds |
| Existing injected-instruction heuristic | 0 theme names/summaries matching the runner's `delete all themes` / `admin mode` patterns; 4 labeled injection records in corpus. **Not a comprehensive resistance score** (does not cover every attack phrase or document injection). |
| BM25 document Recall@1 / @5 | 90% / **90%**, 10 queries (deterministic, not model retrieval) |
| Capability classification | **10/12 (83.3%)**, two disagreements; no call errors |
| Semantic evidence-support rate | NOT MEASURED; exact quote matching cannot establish claim correctness |

Capability disagreements: SCIM expected not_documented, returned unknown; conflicting custom-field exports expected unknown, returned not_documented. **Harness limitations discovered:** the conflicting-document fixture is not supplied to the capability loop; the SCIM not_documented label is not substantiated by a supplied explicit SCIM passage. Treat 10/12 as the existing runner's score, not a validated capability benchmark. No prompts/labels were tuned to these outcomes; repair the evaluation fixtures as a separate, versioned milestone before rerunning.

Dev and held-out examples remain version-controlled separately but this runner scores the combined set; no independent held-out score claimed. Majority mapping uses gold labels and flatters clustering accuracy. One stochastic run, synthetic builder-authored data, no human judgments; v1 comparisons are not like-for-like (80 vs 92 records and different retrieval/capability denominators). Current duplicate P/R uses **2** known corpus duplicates, distinct from older 100-case regression checks.

## Automated — LLM (recorded 2026-10-19 on dataset v1; NOT re-run on v2)

| Metric | v1 result |
|---|---|
| LLM theme macro-F1 (majority-mapped) | 0.978 (n=80) |
| Citation validity (verified / proposed) | 100% (69/69) |
| Doc retrieval Recall@5 | 100% (8 queries) |
| Documented-capability classification | 8/8 |
| Themes obeying injected instructions | 0 |

## Human judgments

PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes). **No human reviews have been recorded yet**, so no acceptance rate is claimed.

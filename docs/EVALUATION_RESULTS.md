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

## Automated — LLM on v2: BLOCKED

Attempted 2026-10-21 with `bun scripts/eval.ts --llm` (model `openai/gpt-6-astra`, reasoning effort low): every call returned HTTP 402 — AI credits exhausted. No v2 LLM metrics exist; the v1 numbers below are kept for reference only and must not be read as v2 results.

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

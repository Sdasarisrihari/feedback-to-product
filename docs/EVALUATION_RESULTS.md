# Evaluation results

Run: 2026-10-20 (deterministic pass). Dataset: **92 labeled unique synthetic feedback records** (94 rows incl. duplicates), 10 labeled doc-retrieval queries, 12 capability cases, 1 conflicting-document pair. Synthetic data only — results do not generalise to real customers.

Split: demo sample records (FB-*) are the **development set** (seed themes and prompt wording were tuned against them); EV-* records are the **held-out evaluation set**. v2 added edge cases: ambiguous themes, mixed sentiment, rare themes, missing segment/rating, Unicode/emoji text, and 2 further injection variants.

## Automated — deterministic (no model)

| Metric | Result |
|---|---|
| Baseline (BM25 seed themes) theme macro-F1 | 0.865 (accuracy 85.9%, n=92) |
| Duplicate detection precision / recall | 100.0% / 100.0% (2 known) |
| Injection flagging recall | 100.0% (4 labeled, 0 false positives) |
| Doc retrieval Recall@1 / Recall@5 (BM25) | 90.0% / 90.0% (10 queries) |
| Conflicting-doc retrieval | both contradictory sections surfaced with source IDs (fixture pair) |

Per-theme (baseline): sync P0.93/R0.81, notifications P1.00/R0.91, reporting P1.00/R0.92, permissions P0.83/R0.83, mobile-perf P0.92/R1.00, integrations P0.78/R0.78, billing P1.00/R0.86, other P0.56/R0.75

## Automated — LLM (recorded 2026-10-19 on dataset v1; NOT re-run on v2 — AI credits exhausted)

These numbers were measured on the v1 dataset (80 records, 8 capability cases) and are kept for reference only. They must not be read as v2 results.

| Metric | v1 result |
|---|---|
| LLM theme macro-F1 (majority-mapped) | 0.978 (n=80) |
| Citation validity (verified / proposed) | 100% (69/69) |
| Doc retrieval Recall@5 | 100% (8 queries) |
| Documented-capability classification | 8/8 |
| Themes obeying injected instructions | 0 |

## Human judgments

PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes) and Human Review. **0 completed human reviews** — no acceptance rate is claimed. A throwaway QA draft review created during end-to-end testing was deleted and is not counted.

## Limitations

Small synthetic set written by the builder (label bias); majority mapping flatters the LLM; single run per metric (no variance); capability and retrieval sample sizes are small (12 / 10); the conflicting-document case is a fixture, not observed real documentation.

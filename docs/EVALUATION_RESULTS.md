# Evaluation results

Run: 2026-10-19T11:59:12.701Z. Dataset: **80 labeled unique synthetic feedback records** (82 rows incl. duplicates), 8 labeled doc-retrieval queries, 8 capability cases. Synthetic data only — results do not generalise to real customers.

## Automated — deterministic (no model)

| Metric | Result |
|---|---|
| Baseline (BM25 seed themes) theme macro-F1 | 0.878 (accuracy 87.5%, n=80) |
| Duplicate detection precision / recall | 100.0% / 100.0% (2 known) |
| Injection flagging recall | 100.0% (2 labeled, 0 false positives) |
| Doc retrieval Recall@1 / Recall@5 (BM25) | 100.0% / 100.0% |

Per-theme (baseline): sync P0.92/R0.79, notifications P1.00/R0.90, reporting P1.00/R0.91, permissions P0.83/R1.00, mobile-perf P0.92/R1.00, integrations P0.78/R0.78, billing P1.00/R1.00, other P0.60/R0.67

## Automated — LLM (openai/gpt-6-astra)

| Metric | Result |
|---|---|
| LLM theme macro-F1 (majority-mapped) | 0.978 (accuracy 97.5%, n=80) |
| Citation validity (verified / proposed) | 100.0% (69/69) |
| Themes produced | 7; latency 60.0s |
| Themes obeying injected instructions | 0 |

Per-theme (LLM): sync P1.00/R0.86, notifications P1.00/R1.00, reporting P1.00/R1.00, permissions P1.00/R1.00, mobile-perf P1.00/R1.00, integrations P1.00/R1.00, billing P1.00/R1.00, other P0.82/R1.00

### Documented-capability classification: 8/8 (100.0%)

| Capability | Expected | Predicted |
|---|---|---|
| exporting project data to CSV | documented | documented |
| including custom fields in exports | not_documented | not_documented |
| exporting reports to PDF | unknown | unknown |
| a Jira integration | not_documented | not_documented |
| a GitHub integration that links pull requests to tasks | documented | documented |
| guest users or custom roles | not_documented | not_documented |
| a daily notification digest email | unknown | unknown |
| offline mode on mobile | documented | documented |

## Human judgments

PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes). **No human reviews have been recorded yet**, so no acceptance rate is claimed.

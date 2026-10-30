# Evaluation results

Run: 2026-10-30T10:54:21.832Z. Dataset: **92 labeled unique synthetic feedback records** (94 rows incl. duplicates), 10 labeled doc-retrieval queries, 12 capability cases. Synthetic data only — results do not generalise to real customers.

## Automated — deterministic (no model)

| Metric | Result |
|---|---|
| Baseline (BM25 seed themes) theme macro-F1 | 0.865 (accuracy 85.9%, n=92) |
| Duplicate detection precision / recall | 100.0% / 100.0% (2 known) |
| Injection flagging recall | 100.0% (4 labeled, 0 false positives) |
| Doc retrieval Recall@1 / Recall@5 (BM25) | 90.0% / 90.0% |

Per-theme (baseline): sync P0.93/R0.81, notifications P1.00/R0.91, reporting P1.00/R0.92, permissions P0.83/R0.83, mobile-perf P0.92/R1.00, integrations P0.78/R0.78, billing P1.00/R0.86, other P0.56/R0.75

## Automated — LLM (openai/gpt-6-astra)

| Metric | Result |
|---|---|
| LLM theme macro-F1 (majority-mapped) | 0.947 (accuracy 93.5%, n=92) |
| Citation validity (verified / proposed) | 100.0% (74/74) |
| Themes produced | 7; latency 43.1s |
| Themes obeying injected instructions | 0 |

Per-theme (LLM): sync P1.00/R0.75, notifications P1.00/R1.00, reporting P1.00/R0.92, permissions P1.00/R1.00, mobile-perf P1.00/R0.92, integrations P1.00/R1.00, billing P1.00/R1.00, other P0.67/R1.00

### Documented-capability classification: 10/12 (83.3%)

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
| two-factor authentication | unknown | unknown |
| SCIM provisioning | not_documented | unknown |
| a Slack integration | documented | documented |
| including custom fields in exports (conflicting doc versions) | unknown | not_documented |

## Human judgments

PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes). **No human reviews have been recorded yet**, so no acceptance rate is claimed.

# Evaluation results

Run: 2026-10-21T07:04:45.959Z. Dataset: **92 labeled unique synthetic feedback records** (94 rows incl. duplicates), 10 labeled doc-retrieval queries, 12 capability cases. Synthetic data only — results do not generalise to real customers.

## Automated — deterministic (no model)

| Metric | Result |
|---|---|
| Baseline (BM25 seed themes) theme macro-F1 | 0.865 (accuracy 85.9%, n=92) |
| Duplicate detection precision / recall | 100.0% / 100.0% (2 known) |
| Injection flagging recall | 100.0% (4 labeled, 0 false positives) |
| Doc retrieval Recall@1 / Recall@5 (BM25) | 90.0% / 90.0% |

Per-theme (baseline): sync P0.93/R0.81, notifications P1.00/R0.91, reporting P1.00/R0.92, permissions P0.83/R0.83, mobile-perf P0.92/R1.00, integrations P0.78/R0.78, billing P1.00/R0.86, other P0.56/R0.75

## Automated — LLM (failed)

LLM analysis failed: credits — AI credits are exhausted. Add credits in Settings → Plans & credits, then retry.

### Documented-capability classification: 0/12 (0.0%)

| Capability | Expected | Predicted |
|---|---|---|
| exporting project data to CSV | documented | error |
| including custom fields in exports | not_documented | error |
| exporting reports to PDF | unknown | error |
| a Jira integration | not_documented | error |
| a GitHub integration that links pull requests to tasks | documented | error |
| guest users or custom roles | not_documented | error |
| a daily notification digest email | unknown | error |
| offline mode on mobile | documented | error |
| two-factor authentication | unknown | error |
| SCIM provisioning | not_documented | error |
| a Slack integration | documented | error |
| including custom fields in exports (conflicting doc versions) | unknown | error |

## Human judgments

PRD/story acceptance rate is recorded in PRD Studio (Accept / Needs changes). **No human reviews have been recorded yet**, so no acceptance rate is claimed.

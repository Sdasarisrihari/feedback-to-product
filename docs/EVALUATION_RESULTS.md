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

## Evaluation hardening — 2026-10-30, v2.1 capability fixtures

Historical baseline above remains unchanged: **92 records, 0.947 macro-F1, 74/74 valid citations, 10/12 capabilities**. Original detailed output preserved in [historical run](evaluation-runs/v2-historical-2026-10-30.md).

The two historical disagreements were fixture defects: SCIM expected explicit unavailability without a supporting passage; the conflicting export case expected unknown without sending its conflict documents. v2.1 retains **all 12 expected labels** and adds an explicit, clearly synthetic SCIM denial to that case and the existing opposing export pair to the conflict case. Each case round-trips documents through `toRows` / `fromRows`, then uses unchanged BM25. This is a local saved-row simulation, **not a live database save, ownership check or signed-in UI run**; no account data was modified. Other 10 cases retain their sample-document corpus. The ordinary custom-fields case does not get conflicting documents.

| Run | Feedback theme macro-F1 / macro P / macro R | Theme citations | Capability classification | Conflict checks |
|---|---|---|---|---|
| Historical v2, 10:54 UTC | 0.947; P/R per class above | 74/74 | 10/12 | Conflict docs omitted; not valid conflict evaluation |
| v2.1 fixture repair, 11:05 UTC | 0.956 / 0.963 / 0.959; n=92 | 75/75 | 11/12 | 5/6 proxies pass; uncertainty fails |
| v2.1 + Q&A policy repair, 11:08 UTC | **0.971 / 0.975 / 0.970; n=92** | **80/80** | **12/12** | **6/6 proxies pass; one question, two opposing docs** |

All 26 model calls across the two new runs completed (2 analyses + 24 Q&A calls); model `openai/gpt-6-astra`, existing structured streaming, low reasoning effort, no billing changes. Analysis prompts and feedback dataset unchanged. Theme-score variation cannot be attributed to the Q&A repair: these are stochastic reruns without an analysis change. Capability scores are **not like-for-like** with historical v2 because supplied evidence changed; final capability changes also include a disclosed Q&A policy correction.

First repaired run retrieved and verbatim-cited both versions but inferred that v4.0 superseded v3.0 without a precedence source. This is a verified Q&A defect, not a citation mismatch. The production Q&A instructions now require unknown plus clarification for unresolved conflicts and prohibit inferred precedence from dates, versions or majority. No EV-* feedback was used to tune analysis. This conflict fixture is now a **development regression**, not independent held-out evaluation.

Final conflict answer: “No supplied source establishes which policy takes precedence, so the capability remains unknown.” It cites `DOC-eval-conflict-v3#s1` (“Exports include all custom fields by default.”) and `DOC-eval-conflict-v4#s1` (“Custom fields are not included in exports.”), also citing the Help Center. It asks which policy applies and requests product-owner confirmation. Inspection of the retained answer found no asserted resolution; this is an assistant observation of one answer, **not human validation or a semantic safety guarantee**.

Final separate conflict checks: both retrieved PASS (2/2); both cited verbatim PASS (2/2); communicates disagreement PASS; unknown/unverified verdict PASS; clarification PASS; no rejected doc citations PASS. The six checks are transparent lexical/structural proxies; they cannot establish semantic support. Final capability answers contain **28/28 accepted document-citation occurrences**, counted across claims and verdicts (repeats count), distinct from the **80/80 theme citations**.

Deterministic results unchanged: macro-F1 **0.865/92**, BM25 Recall@5 **90%/10 queries**, duplicate P/R **100%/2 known duplicates**, injection recall **100%/4 examples**. Model injection heuristic: zero theme names/summaries matching two patterns; no comprehensive injection-resistance metric. Semantic evidence-support rate **NOT MEASURED**. Feedback dev/held-out records remain 47/45, scored together with gold-majority mapping for historical comparability; no independent held-out accuracy claimed. Human reviews remain **0/10**.

Full outputs and synthetic raw inputs/results: [fixture-only run](evaluation-runs/v2-1-2026-10-30.md), [final run](evaluation-runs/v2-1-conflict-policy-2026-10-30.md), companion `.md.json` files. Automated suite: **114/114 baseline → 122/122 final**, 10 files. Initial new provenance test failed solely on ISO timestamp formatting; fixture timestamps normalized, same assertion rerun successfully. No tests weakened.

# Evaluation results

## Model-access recovery check — 2026-11-05 (no inference)

- Read-only `credits.get_credit_balance(applicability="ai_gateway")`: **0.00 model-eligible spendable credits** for Oct 30–Nov 30 via `ai_gateway -> run_time -> generic`. General daily-credit balance is not evidence of model funding. Existing credential presence checked without disclosure; model/configuration unchanged.
- Latest historical attempt-01 remains HTTP 402 / `credits` at syn-01. Current eligible-credit exhaustion supports a funding blocker. Gateway log lookup for Nov 1–5 returned no rows, so no independent upstream diagnosis is claimed.
- Attempt-02 `.md` and `.md.json` both unused, **not created or executed**. Recovery adds **0 attempted / 0 completed** scenarios; all six still blocked pending eligible access. Historical attempt-01 remains **1/6 attempted, 0/6 completed**, no generated/assessed PRDs. Blocked is not a quality verdict.
- No new traceability, criteria-testability, unsupported-claim or conflict scores; no representative generated failures exist. No human judgments populated: **0/10 carried forward**, 0 reviewed PRDs in this assessment, qualifying pass count **not measured**, November UTC monthly north-star baseline **not established**.
- Local full suite **153/153** across 15 files; targeted scoring/report/isolation suite **22/22** across three files; standalone `tsgo --noEmit` **executed, exit 0**. Historical checksums and scenario/label/north-star preservation verified after documentation edits. No manual build or generation/browser checks were run for this documentation-only task.

Next: repeat the read-only model-eligible balance check after existing access changes; do not purchase credits or alter settings here. Once cleared, run the unchanged command in [resume guide](PRD_EVALUATION_RESUME.md) into a fresh attempt pair, inspect each execution stage, then arrange genuine reviews of immutable outputs using the existing worksheet. Readiness remains **unestablished**.

## First north-star PRD quality baseline attempt — 2026-11-04

Actual execution: `bun scripts/eval-readiness.ts --mode prd --output docs/evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md`; started **06:57:05.730Z**, existing `openai/gpt-6-astra` configuration, no prompt/model/integration/secret/billing changes. [Report](evaluation-runs/prd-challenge-v1-report-v2-attempt-01.md) and `.md.json` preserve this new attempt; all 12 earlier artifacts and scenario/label hashes remain unchanged.

| Measure | Observed result |
|---|---|
| Scenarios planned / attempted / completed | 6 / 1 / 0 |
| Blocked scenarios | 6: syn-01 failed generation with HTTP 402; syn-02–syn-06 not attempted after stop |
| Generated PRDs / assessed PRDs | 0/6 / 0/6 |
| Model requests | 1 logical invocation, returned HTTP 402 (`credits`); no subsequent calls or retries of the failed invocation |
| Automated quality categories | All unmeasured: traceability, testability, unsupported claims and conflict handling; no quality successes/failures inferred from access denial |
| Genuine human review records | 0/10, carried-forward project status; no live review-count query or judgments created |
| Distinct PRDs actually reviewed in this assessment | 0 |
| PRDs passing all three north-star criteria | Not measured; no qualifying human judgments |
| Monthly baseline (November 2026, UTC) | **Not established**; not a measured zero pass rate or production baseline |
| Local verification | 153/153 tests (15 files); standalone `tsgo --noEmit` executed, exit 0 |

The first generation failed because model access requires credits. No generated-quality failure reasons exist; corrective action is owner-controlled restoration of existing access, followed by a fresh attempt only when authorized/available. Do not purchase credits or bypass 402. Runner exit 0 means files were saved, not success. JSON records `credits`; safe terminal diagnostics recorded raw status 402. Inputs are synthetic source snapshots, not live saved-account ownership verification; expected scenario answers stay withheld from generator/judge, but generic rubrics intentionally reach automated judges. Same-system authorship/judging is not independent human validation.

[Ten-review worksheet](PRD_HUMAN_REVIEW_WORKSHEET.md) is blank and separate from automated scoring. Count completed reviews, distinct whole PRDs reviewed and distinct PRDs passing all three criteria separately; legacy in-app acceptance scores are not the north-star metric. Historical results below remain unchanged. Readiness **not established**. Next: wait for existing model access to return, use the fresh attempt-02 command in [resume guide](PRD_EVALUATION_RESUME.md), then collect genuine independent reviews of immutable outputs.

## PRD evaluation readiness audit — 2026-11-02

Baseline **143/143** reproduced; final **153/153** (15 files); targeted **22/22**. `tsgo --noEmit` actually executed, exit 0. No model calls or credit checks: **0/6** PRDs generated/assessed, every model-readiness category unmeasured; historical HTTP 402 attempts and frozen scores unchanged. Reporting-only v2 retains per-item evidence/rejections, recommendation exclusions, atomic judgments/rationales, criteria/assumptions and all six execution statuses. These local fixtures are not generated results or human reviews (**0/10**, carried forward). See [PRD_EVALUATION_RESUME.md](PRD_EVALUATION_RESUME.md) for the exact command, limitations and six-case checklist. Recommendation: needs actual evaluation after model access returns.

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

## Untuned synthetic challenge v1 — 2026-10-30

Full frozen run and raw synthetic results: [challenge run](evaluation-runs/challenge-v1-2026-10-30.md) and companion `.md.json`. Run began **11:16:16Z**, existing model `openai/gpt-6-astra`, low effort; **24 completed model calls** (2 analyses, 16 Q&A calls, 6 semantic batches), no model errors or blocked calls. Two repeats predeclared; input/label/scoring/prompt/runner hashes unchanged. No production instruction change in this milestone, no billing change, no live workspace writes. Original **0.947/92, 74/74, 10/12** and development **0.971/92, 80/80, 12/12, 6/6** above remain unchanged.

**Independence gap:** no independently authored or collected held-out set exists. This is 24 new untuned, builder-authored synthetic records and 8 new questions, disjoint from the original corpus by ID/normalized full text, not independent of the builder's knowledge of development themes/policies. Nominal EV-* examples were previously exposed and combined in gold-majority scoring. New mapping is fixed development-catalogue BM25, not challenge-majority labels. These challenge scores are **not comparable** with historical combined-set majority-mapped scores, nor proof of generalization.

| Metric | Repeat 1 | Repeat 2 | Denominator / interpretation |
|---|---|---|---|
| Theme macro-F1 / precision / recall | **1.000 / 1.000 / 1.000** | **1.000 / 1.000 / 1.000** | 24 records each; 3 per gold class; fixed lexical theme mapping |
| Exact theme citation validity | **21/21** | **21/21** | Three other records uncited; uncited → other |
| Capability frozen score | **6/8** | **6/8** | Two scoring defects identified below; not two demonstrated model failures |
| Exact Q&A doc citation occurrences | **26/26** | **23/23** | Claims + verdicts, repeat occurrences counted |
| Required-source retrieval | **10/10** | **10/10** | Required saved-section IDs across cases, not historical Recall@5 |
| No-precedence conflict CQ-01 | PASS | PASS | Unknown; opposing sources cited; conflict communicated; clarification |
| Explicit scoped precedence CQ-02 | PASS | PASS | Documented for policy B; new policy and explicit precedence rule cited |
| Feedback/document injection questions CQ-07/08 | PASS verdict/quotes | PASS verdict/quotes | Two questions per repeat; not comprehensive attack resistance |
| Analysis injection-marker heuristic | 0 matches | 0 matches | One injected feedback record per repeat; no general resistance claim |
| Severity within frozen interval | **17/21** | **17/21** | Cited-record assignments inherit theme severity; diagnostic only |
| Automated semantic pair support | **13/44 (29.5%)** | **9/41 (22.0%)** | Entire generated claim vs one excerpt at a time; all proposed pairs judged |
| Semantic judge calibration | **5/6** | **5/6** | Same-model automated judge; one flawed expected control label |

Observed variability: classification unchanged; Q&A citation count 26→23 and semantic pair support 29.5%→22.0%. Two stochastic repeats, not enough for reliable confidence intervals. No combined inflated sample size: each repeats the same 24 records/8 questions.

### Frozen failures and interpretation (no label or score changes)
- **CQ-05:** expected unknown/clarification for “audit downloads for every workspace.” Both answers correctly state “group A can … group B cannot … therefore not supported for every workspace,” returning not_documented. This is a verified expected-label/clarification mismatch with the literal universal question, not evidence of invented availability.
- **CQ-06:** both answers return translation not_documented and the separate “saves every customer 500 hours” claim unknown, explicitly requiring measurement. The scorer requires *every* verdict to equal not_documented, so this legitimate decomposition fails. Raw **6/8** retained; no post-hoc 8/8 claimed.
- **SC-04:** expected supported for “Only group A can download audit logs” from “A can; B cannot.” Judge returned insufficient because other possible groups are not excluded—reasonable entailment reasoning. Raw **5/6** calibration retained; not relabeled after results.
- **Semantic attribution:** a summary includes reverted offline work, discarded conflicting edits and stale server data. Its single quote about reverted work cannot prove the other two clauses; judge marks insufficient. This exposes claim-to-individual-excerpt attribution gaps but does **not** prove the full summary unsupported by the combined sources. Same-model judging, calibration-label defect and compound claim construction mean these are diagnostic rates, not validated semantic faithfulness.

Automated suite **122/122 baseline → 129/129 final**, 11 files; seven challenge integrity/scoring tests added. Platform automatic application check **build OK at 11:18:54Z**. Standalone typecheck/build commands not manually executed (platform-managed); no separate standalone typecheck result claimed. Human reviews **0/10**.

**PRD readiness:** these results support keeping existing evidence-linked draft generation available for human review, not advancing or claiming validated PRD quality. No PRDs were evaluated/generated here. Next milestone: versioned repair of universal/multi-verdict/control labels with clear predeclared scoring, atomic-claim or citation-set semantic checks, then a separately authored sealed PRD/story challenge. Keep write-capable integrations out.

## New-version scoring repair and PRD readiness attempt

Historical **129/129** preserved; baseline reproduced **129/129**, final **143/143** across 14 test files. All original challenge inputs/scorers and pre-existing run files were checksum-verified unchanged (11 files at the initial verification).

| Measure | Historical frozen result | New-version result |
|---|---|---|
| Capability scoring | 6/8 per repeat | 8/8 per repeat under corrected deterministic scorer on the **same retained outputs**; no new model calls, not model improvement |
| Semantic support | 13/44 and 9/41 full-claim/single-excerpt pairs | **BLOCKED / not measured**; atomic/citation-set units differ |
| Calibration | 5/6 each, defective exclusive-scope control | **0/8 judged, not 0% accuracy**; first request failed before judgments |
| PRD readiness | No PRDs assessed | **0/6 generated/assessed**; all six categories unmeasured, no failure rate or acceptance score |
| Human reviews | 0/10 | **0/10** unchanged |

The first `semantic-v2` calibration request returned **HTTP 402**, mapped to credits exhausted; the second preserved attempt also returned HTTP 402. Each run stopped after one failed call; no atomization, semantic judgment or PRD generation ran. No billing changes. Blocked artifacts: `evaluation-runs/semantic-v2-2026-11-01.md` and `semantic-v2-resumed-2026-11-01.md`, each with raw `.md.json`. The latter is a second blocked attempt, not evidence access was restored. New deterministic capability result: `evaluation-runs/capability-scoring-v2-2026-11-01.json`. Filename dates identify this milestone; artifact timestamps are authoritative execution times.

Calibration criteria and justified corrections are in `semantic-v2-controls.ts`; category contract/tests pass but cannot establish judge accuracy. New PRD input suite: six separately tasked synthetic scenarios, 14 feedback records, three document passages; strong evidence, contradictory preferences, conflicting plans, irrelevant evidence for dark mode, distinct handoff needs, and unsupported operational assumptions. Same AI system and adapted framing; no external/human independence or real-customer representativeness. Production prompts and generator unchanged; expected labels withheld from generation/judge. No representative **new generated failure** exists because no PRDs were generated. Historical compound-claim/control failures remain reported above.

**Recommendation: needs further evaluation.** Existing draft generation may remain available for an explicitly unvalidated, evidence-linked demonstration after model access returns, with human approval safeguards; this milestone does not establish limited-demonstration quality, external-write readiness or production readiness. Next: owner-requested execution of frozen calibration/atomic scoring followed by six PRD cases; inspect automated judge errors and collect genuine reviews separately.

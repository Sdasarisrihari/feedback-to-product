# Evaluation method

Measured results: see `EVALUATION_RESULTS.md`. Run `bun scripts/eval.ts --llm --output docs/evaluation-runs/<unused-name>.md`; deterministic-only without `--llm`. Existing output paths are refused to preserve history. Companion `.md.json` retains synthetic model inputs/results. `--legacy-capabilities` explicitly uses the old, incomplete sample-doc corpus; it cannot undo later Q&A policy changes.

## Dataset (v2, synthetic)
- 92 labeled unique feedback records: 47 demo sample records (labels by ID) + 45 eval-only records (`src/lib/voc/eval/dataset.ts`), plus 2 known duplicates.
- 10 doc-retrieval queries with labeled relevant section IDs; 12 documented-capability cases (documented / not_documented / unknown); 1 conflicting-document fixture pair.
- **Split**: the demo sample (FB-*) is the development set — seed themes and prompt wording were tuned against it. EV-* records are the held-out evaluation set; do not tune thresholds or prompts against them.
- v2 edge cases: ambiguous themes, mixed sentiment, rare themes, missing segment/rating fields, Unicode/emoji text, and 4 labeled prompt-injection records.
- Target: grow toward 100–200 records. The set is synthetic and written by the builder; it is not independent or representative of real customers.

## Rubric
- **Theme**: one of sync, notifications, reporting, permissions, mobile-perf, integrations, billing, other.
- **Severity** 1–5: 1 cosmetic/praise · 2 minor friction · 3 recurring workflow pain · 4 blocks a team/workflow or adoption · 5 data loss, security/compliance or rollout blocker.
- **Capability**: documented = a doc section confirms it; not_documented = docs say it is unavailable; unknown = docs are silent or conflicting. Customer requests never count as documentation.

## Metrics
- Automated (deterministic): baseline macro-F1, duplicate P/R, injection flag recall, doc Recall@1/@5, conflicting-doc surfacing.
- Automated (LLM): theme macro-F1 (each AI theme mapped to the majority gold label of its verified citations), citation validity, capability accuracy, injected-instruction compliance.
- Human: PRD acceptance rate from PRD Studio / Human Review (none recorded yet). Severity labels and evidence-faithfulness of generated requirements still need human graders.

## Regression thresholds (justified by current baseline)
- Duplicate detection: precision and recall must stay 1.0 (known duplicates are fixed fixtures).
- Injection flagging: recall must stay 1.0 (a miss is a safety regression).
- Doc retrieval Recall@5 must stay ≥ 0.875 (recorded baseline 0.90; threshold allows one-query slack).
- No macro-F1 threshold: the baseline is a heuristic floor for comparison, not a quality gate.

## Known limitations
Small synthetic set written by the builder (label bias); majority mapping flatters the LLM; single run per metric (no variance); small n for capability (12) and retrieval (10); conflicting-doc case is a fixture.

## v2.1 capability evidence repair
- All feedback rows, gold themes and 12 expected capability labels retained. For SCIM only, add a clearly synthetic explicit unavailability passage; for the conflict case only, supply both original opposing export sections. Evidence supplied has changed, so the historical 10/12 score is not directly comparable.
- Evaluation docs round-trip through the real persistence row mapper before unchanged BM25 retrieval. IDs/title/version/heading/page/text are preserved. No live workspace is seeded; saved-row simulation is not authentication/RLS verification.
- The conflict pair is a development regression: after a measured unsupported newer-version resolution, Q&A instructions were corrected to require explicit precedence evidence or unknown + clarification. Do not call this held-out improvement.
- Conflict results are separate from 12-case capability accuracy: both retrieved, both cited verbatim, conflict language, unknown verdict, clarification, no rejected citations. These proxies do not measure semantic faithfulness or prove absence of invented resolutions; inspect raw answers and disclose observations.
- Theme macro precision/recall and per-class P/R are recorded alongside majority-mapped macro-F1; combined dev/held-out scoring remains historical-only, not independent performance. Semantic evidence support remains NOT MEASURED; genuine human reviews 0/10.

## Untuned challenge v1 — frozen 2026-10-30
- Audit: 47 sample feedback records and seven seed themes are development material. The nominal 45 EV-* examples have already been inspected and scored jointly with development data using gold-majority mapping. The custom-field conflict fixture was used to repair Q&A instructions. **A genuinely independently authored/collected held-out set does not exist.** Historical held-out wording describes intent, not demonstrated independence.
- New evaluation-only modules: `challenge-inputs.ts` (24 new feedback records, 8 document questions, 6 semantic controls) and `challenge-labels.ts` (gold themes, capability expectations, severity intervals, rating sentiment, injection labels). IDs and normalized full texts have no exact overlap with the earlier 94-row corpus. Intentional thematic similarity remains; disjoint text does not prove independence or training-data exclusion.
- Theme mapping is fixed BM25 over the existing development seed catalogue; it uses generated name/summary/area only, never challenge gold labels. Uncited records map to other, so correct other predictions do not demonstrate positive classification ability. No development records are submitted with the new challenge records.
- Run: `bun scripts/eval-challenge.ts --output docs/evaluation-runs/<unused>.md --repeats 2`. Two repeats predeclared; inputs, labels, scoring, production prompts and runner hashed before calls and verified unchanged afterward. No prompt/label/scoring tuning during the run; expected answers never enter generator or semantic-judge prompts. Outcomes are consumed challenge data after this run, not future untouched validation data.
- Existing generator model and prompts retained. Questions round-trip local saved-row mapping and shared BM25, not live storage/auth. Capability, citation, retrieval, severity and semantic diagnostics reported separately. No historical score replacement.
- Semantic support: same-model automated judge tests the **entire generated claim against each individual cited excerpt**, statuses supported/contradicted/insufficient. Controls include exact-match-but-opposite and invented-number examples. This is a strict pair-level diagnostic: a multi-part theme summary supported by several excerpts can fail against each excerpt alone. It is **not whole-answer/citation-set support** and is not independent or human evaluation. Calibration and all rationale outputs retained.
- Discovered scoring defects remain frozen: CQ-05 asks whether *every* workspace supports audit downloads, but expected unknown even though group B is explicitly excluded; CQ-06 requires all verdicts to equal not_documented despite separate legitimate unknown time-saving verdict; SC-04 expected supported for “only group A” without excluding groups other than B. Report actual frozen failures and interpretation; do not silently relabel, rescore or call them model failures.
- Sentiment remains star-rating-derived, not text sentiment prediction; mixed-sentiment examples expose this limitation. Confidence is citation-count-derived, not calibrated probability. Severity intervals are diagnostic labels compared with theme-level severity, not a new per-record severity engine. No new quality thresholds.

## Scoring repair v2 and PRD challenge v1
- Historical challenge modules, both repeats, labels and artifacts remain unchanged. New `semantic-v2.ts` distinguishes supported (entire atomic assertion follows), partially_supported (supported component, unproven qualifier), unsupported (assessable but ungrounded/contradicted or unresolved conflict asserted as fact), and unassessable (no evidence or assessable proposition). Unassessable is excluded from assessable-rate denominator but reported; partial never counts as full support.
- Model segmentation preserves scope, quantifiers, negation and attribution; groups repeated identical claims with their associated citation excerpts, then judges atomic claims against the citation set. Segmentation is automated and may itself err. New units, aggregation and rubric make rates incompatible with v1 pair-level scores.
- Eight predeclared calibration controls cover all categories. SV2-2 replaces the faulty exclusive-scope expectation only in the new version: A available/B unavailable establishes A but not exclusion of every other group. SV2-6 forbids unconditional claims from conflicting excerpts; SV2-8 treats imperatives as injection, not capability evidence. Each expected label includes justification. Unit tests check accounting/contracts, not model judge accuracy.
- `capability-scoring-v2.ts` fixes CQ-05 universal availability and CQ-06 separate translation/savings verdicts. Deterministic rescoring is explicitly separate from new model evaluation; original 6/8 stays unchanged. Case-level matching remains lexical and does not validate semantics.
- Six PRD scenarios, 14 feedback records and 3 doc passages were authored by a separately tasked agent instructed not to inspect existing prompts/scorers/fixtures. Expected outcomes live separately in `prd-labels-v1.ts` and never enter generator or judge calls. Same AI system, no externally authored/human-independent benchmark claimed. Main agent adapted metadata/theme framing to the production contract. Author's inconsistent note about fewer private-note supporters was corrected before execution: assignment and notes each have two records (f501 shared).
- Generic automated PRD rubric: traceability, contradiction/uncertainty, story clarity, criteria testability, evidence separation, unsupported claims. Each category uses pass/partial/fail/unassessable; missing stories are not automatic passes. Retain item/source references and failures. Structural citation/Given-When-Then counts are proxies, not semantic quality. Proposed criteria are permitted when clearly labeled recommendations, not confirmed customer requirements.
- Commands after model access is restored and the owner explicitly requests resumption: `bun scripts/eval-readiness.ts --mode repair --output docs/evaluation-runs/<unused>.md`, then `--mode prd` with another unused path. Both checkpoint full synthetic inputs/results and hashes, stop on model failures, refuse overwrite, never write workspaces. First calibration call returned HTTP 402; subsequent recorded attempt also returned 402. No PRDs generated, no new support/quality metrics. Do not rerun while blocked.

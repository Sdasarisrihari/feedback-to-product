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

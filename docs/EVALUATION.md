# Evaluation method

Measured results: see `EVALUATION_RESULTS.md` (regenerate with `bun scripts/eval.ts --llm`; deterministic-only without the flag).

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

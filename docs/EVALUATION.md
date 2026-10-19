# Evaluation method

Measured results: see `EVALUATION_RESULTS.md` (regenerate with `bun scripts/eval.ts --llm`; deterministic-only without the flag).

## Dataset (v1, synthetic)
- 80 labeled unique feedback records: 47 demo sample records (labels by ID) + 33 eval-only records (`src/lib/voc/eval/dataset.ts`), plus 2 known duplicates.
- 8 doc-retrieval queries with labeled relevant section IDs; 8 documented-capability cases (documented / not_documented / unknown).
- Target: grow to 100–200 records, including conflicting and ambiguous feedback.

## Rubric
- **Theme**: one of sync, notifications, reporting, permissions, mobile-perf, integrations, billing, other.
- **Severity** 1–5: 1 cosmetic/praise · 2 minor friction · 3 recurring workflow pain · 4 blocks a team/workflow or adoption · 5 data loss, security/compliance or rollout blocker.
- **Capability**: documented = a doc section confirms it; not_documented = docs say it is unavailable; unknown = docs are silent. Customer requests never count as documentation.

## Metrics
- Automated (deterministic): baseline macro-F1, duplicate P/R, injection flag recall, doc Recall@1/@5.
- Automated (LLM): theme macro-F1 (each AI theme mapped to the majority gold label of its verified citations), citation validity, capability accuracy, injected-instruction compliance.
- Human: PRD acceptance rate from PRD Studio reviews (none recorded yet). Severity labels and evidence-faithfulness of generated requirements still need human graders.

## Known limitations
Small synthetic set written by the builder (label bias); majority mapping flatters the LLM; single run per metric (no variance); n=8 for capability and retrieval.

# PRD north-star human review worksheet

Prepared 2026-11-04. **Blank worksheet: zero human judgments or approvals.** The latest evaluation generated no PRDs because HTTP 402 stopped execution. Populate only after actual drafts and their source snapshots are available.

## Independent review instructions

Review the exact immutable PRD output/revision and source snapshot before seeing automated judgments, author expectations or other reviewers' answers. A review of one story is useful diagnostic evidence, but does not qualify a whole PRD for the monthly metric. Use synthetic data only for this challenge; do not treat its results as real-customer validation.

Complete all three criteria with PASS or FAIL and specific supporting evidence. Leave unanswered fields blank; incomplete reviews are excluded, not counted as failures. If a completed review finds missing sources or unassessable quality, record FAIL with the missing information and corrective action. Do not infer a pass from a 1–5 score.

| Criterion | PASS requires | Supporting evidence to record |
|---|---|---|
| Evidence traceability | Every evidence-attributed problem, requirement and story cites the correct source ID and verbatim excerpt supporting the whole claim; opposing feedback/docs are represented, with unresolved conflict disclosed. | Item IDs, source/section IDs, exact excerpts, explanation of support, rejected/missing evidence and conflict handling. |
| Testable acceptance criteria | Each story has observable, unambiguous behavior and concrete pass/fail conditions; unspecified thresholds or unresolved choices are questions, not invented commitments. | Story/criterion IDs, concrete test steps and expected outcomes; examples of ambiguity. |
| Unsupported-claim prevention | No unsupported factual claims, capabilities, counts, benefits or commitments; assumptions/recommendations are labeled, uncertainty prompts clarification, and conflicting sources have no invented resolution. | Item IDs and disputed statements, citations or missing evidence, labeled assumptions/open questions; unsupported-claim count. |

## Ten genuine review slots

Slot IDs are administrative placeholders, **not reviewers or completed reviews**. Assign drafts/reviewers only when available; do not invent identities. Keep names/pseudonyms private where needed. Additional reviewers may assess the same revision, but duplicate reviews must not inflate the number of PRDs passing.

| Slot | Actual reviewer | Review date (UTC) | Run/scenario + PRD ID/revision/hash | Traceability PASS/FAIL | Criteria PASS/FAIL | Unsupported claims PASS/FAIL | Evidence/notes record | Completed |
|---|---|---|---|---|---|---|---|---|
| HR-01 | | | | | | | | |
| HR-02 | | | | | | | | |
| HR-03 | | | | | | | | |
| HR-04 | | | | | | | | |
| HR-05 | | | | | | | | |
| HR-06 | | | | | | | | |
| HR-07 | | | | | | | | |
| HR-08 | | | | | | | | |
| HR-09 | | | | | | | | |
| HR-10 | | | | | | | | |

## Supporting record — copy for each slot

- Slot, actual reviewer, UTC completion date:
- Exact report/scenario, PRD identifier, immutable revision/output hash and source snapshot:
- Scope reviewed (whole PRD or named story):
- Traceability PASS/FAIL; item/source IDs, verbatim excerpts and rationale:
- Acceptance criteria PASS/FAIL; criterion IDs, test steps/expected outcomes and rationale:
- Unsupported-claim prevention PASS/FAIL; statement/item IDs, evidence and rationale:
- Conflicting evidence and handling; unresolved questions:
- Evidence support / requirement correctness / criteria quality / usefulness (each 1–5):
- Unsupported-claim count (integer ≥ 0), disputed statements and notes:
- Needed corrections; new revision requiring a new review:
- Completed (all fields answered by the real reviewer):

Preserve original responses; do not silently edit them after corrections. Retain disagreements, and resolve them explicitly before counting a PRD as passed. Export completed human records separately from model artifacts; retain drafts separately and exclude them from aggregates. Use the existing in-app review workflow for its scores when appropriate, but retain these three explicit verdicts alongside the exact revision: its legacy “accepted” summary uses different criteria and is **not** this monthly metric.

## Monthly count ledger (not yet populated)

Report UTC calendar month, completed review records, distinct whole PRDs reviewed, and distinct PRDs passing all three criteria separately. Count a PRD once, in the month its qualifying review is completed; repeated reviews or revisions must not inflate its count. Record revision-specific decisions and unresolved disagreements. Ten review records need not be ten distinct PRDs.

Current evidence: completed genuine reviews **0/10** (carried-forward project status, no live count query); qualifying reviewed PRDs **0 documented**, pass count **not measured**. Monthly baseline **not established**, not a measured 0% quality rate. Automated evaluation and this worksheet cannot establish human validation.
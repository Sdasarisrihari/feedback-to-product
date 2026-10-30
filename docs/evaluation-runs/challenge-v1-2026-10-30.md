# Untuned synthetic challenge v1

Run: 2026-10-30T11:16:16.267Z; model openai/gpt-6-astra, existing low-effort streamed calls. 2 frozen repeats; 24 feedback records and 8 Q&A cases per repeat.

No development records included. Fixed theme mapping uses the pre-existing development seed catalogue, never challenge gold-majority mapping. No prompts, labels or scoring changed during execution. Not independently sourced or representative of customers.

## Repeat 1

- Theme macro-F1 **1.000**, precision **1.000**, recall **1.000**, accuracy 100.0%; n=24.
- Theme exact citations **21/21**; not semantic support.
- Theme-level severity within record-specific predeclared interval: 17/21 cited-record assignments (diagnostic, not per-record severity prediction).
- Injection marker in generated name/summary: 0; heuristic only.

- CQ-01: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-02: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-03: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-04: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-05: verdict FAIL; required quotes PASS; conflict PASS; clarification FAIL.
- CQ-06: verdict FAIL; required quotes PASS; conflict PASS; clarification PASS.
- CQ-07: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-08: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.

Capability checks **6/8**; attempted 8/8. Q&A exact doc citations **26/26** occurrences. Required-source retrieval **10/10** sections across cases (not the historical Recall@5 metric).

Automated semantic judge: **13/44** claim/excerpt pairs supported; 44/44 pairs judged. Calibration **5/6** (6 controls expected). Same model as generator, correlated errors possible; pair-level entailment, not answer-level truth or human judgment.

## Repeat 2

- Theme macro-F1 **1.000**, precision **1.000**, recall **1.000**, accuracy 100.0%; n=24.
- Theme exact citations **21/21**; not semantic support.
- Theme-level severity within record-specific predeclared interval: 17/21 cited-record assignments (diagnostic, not per-record severity prediction).
- Injection marker in generated name/summary: 0; heuristic only.

- CQ-01: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-02: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-03: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-04: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-05: verdict FAIL; required quotes PASS; conflict PASS; clarification FAIL.
- CQ-06: verdict FAIL; required quotes PASS; conflict PASS; clarification PASS.
- CQ-07: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.
- CQ-08: verdict PASS; required quotes PASS; conflict PASS; clarification PASS.

Capability checks **6/8**; attempted 8/8. Q&A exact doc citations **23/23** occurrences. Required-source retrieval **10/10** sections across cases (not the historical Recall@5 metric).

Automated semantic judge: **9/41** claim/excerpt pairs supported; 41/41 pairs judged. Calibration **5/6** (6 controls expected). Same model as generator, correlated errors possible; pair-level entailment, not answer-level truth or human judgment.

Frozen input/scoring/prompt hashes unchanged: **true**. Total model calls 24. Human reviews **0/10**. No PRDs generated, no production writes or billing changes.

Limitations: builder-authored challenge, intentional thematic similarity, previously inspected development prompts, fixed lexical mapping error, two repeats maximum, no real customers, sentiment remains rating-derived and confidence remains citation-count-derived, severity diagnostic only, semantic judge not independent. Historical majority-mapped scores are not directly comparable.
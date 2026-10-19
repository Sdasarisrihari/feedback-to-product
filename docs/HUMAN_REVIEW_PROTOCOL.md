# Human review protocol (PRDs and user stories)

Goal: ≥ 10 reviewed items (a PRD revision or one of its user stories), ideally 2 reviewers each.

1. Sign in (so reviews are saved to the workspace), generate PRDs in PRD Studio from at least 5 themes.
2. Open **Human Review**, enter your reviewer name, pick an item. Reviews are tied to the exact PRD revision.
3. Score 1–5 (1 poor · 3 acceptable · 5 excellent):
   - **Evidence support** — every customer claim is backed by the cited quote; doc claims by a doc section.
   - **Requirement correctness** — requirements address the evidenced problem without inventing scope.
   - **Acceptance-criteria quality** — specific, testable, complete.
   - **Usefulness** — would you start from this draft?
4. Count **unsupported claims**: statements presented as fact that no cited source supports (0 if none). List them in notes.
5. Click **Complete review**. Incomplete reviews are drafts and excluded from results.
6. Export CSV for the record; copy summary numbers into `EVALUATION_RESULTS.md` with the date, item count and reviewer count.

Definitions used in the summary: *acceptable* = score ≥ 4; *accepted* = usefulness ≥ 4 AND evidence ≥ 4 AND 0 unsupported claims. Report "preliminary" below 10 items.

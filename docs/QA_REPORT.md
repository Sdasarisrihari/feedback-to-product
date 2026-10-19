# QA report — 2026-10-19

| Area | Status | How |
|---|---|---|
| Automated test suite | **68/68 passed** (7 files) | `bunx vitest run` |
| Server source authority (unknown, other user's, stale/tampered text refused; refused sources can't be cited) | Verified (unit) | `integrity.test.ts` |
| Human-review rules (no completion with missing fields; summaries from completed only) | Verified (unit) | `integrity.test.ts` |
| Persistence mapping, row diff, append-only revisions, review ↔ revision link | Verified (unit) | `persist.test.ts`, `integrity.test.ts` |
| Cross-user access (read/update/delete/spoofed insert; reviewing another user's revision) | Verified (SQL with simulated users) | `scripts/rls-check.sql` procedure |
| Signed-out access over the real data API (read + insert on 4 tables) | Verified: all refused (401/permission denied) | curl with publishable key |
| Signed-out call to protected load function | Verified: "Unauthorized", no data | Playwright |
| Prompt injection in feedback/docs, failed/malformed model output | Verified (unit, existing) | `llm.test.ts`, `prd-rag.test.ts` |
| Demo flow: AI analysis → PRD → human review → reload keeps review | Verified (browser, live model) | Playwright, no page errors |
| Sign-up, sign-in, first-time import, reload restore, server-verified provenance, save-failure retry, duplicate import while signed in | **Not yet tested** — needs a confirmed account | `scripts/e2e_persistence.py` (ready) |

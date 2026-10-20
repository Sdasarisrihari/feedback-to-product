# QA report — signed-in end-to-end run, 2026-10-19

Account: the project owner's own confirmed account (session injected by Lovable; no credentials or codes handled or logged). Data: synthetic Trellis sample only. Script: `scripts/e2e_persistence.py <step>`; database evidence from read-only owner-scoped counts.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Signed-in state shown (account + Sign out, no demo label) | PASS | sidebar text |
| 1 | Workspace ownership / cross-user isolation (read, update, delete, spoofed insert, reviewing another user's revision) | PASS | SQL with two simulated users, re-run today |
| 2 | One-time browser import offer + import | BLOCKED (observed, not re-testable) | Account had already imported before this run (`browser_import_done = true`, 49 rows from one import). A fresh, empty second account is needed to re-run the offer. |
| 2 | No repeat import offer after import | PASS | offer absent on load and reload |
| 2 | Re-importing the same file | **FAIL → fixed → PASS** | First run added 49 duplicate rows **and** an ID collision overwrote record `FB-1010~L47` (data loss). Fixed: whole-file re-imports add nothing ("Already imported…"); generated IDs never reuse an existing ID. Test rows removed and the lost synthetic row restored. Re-run: 0 rows added. |
| 3 | Feedback persists after reload | PASS | 47 unique records shown after reload |
| 3 | Documents persist after reload | **FAIL → fixed → PASS** | Reload within the 0.8 s save delay lost changes while the UI said "All changes saved". Fixed: status switches to "Saving…" immediately, leaving the page with unsaved changes warns. Re-run: Documents (2), 9 sections in the database. |
| 3 | AI analysis + provenance persist after reload | PASS | label present after reload; database row `provenance = server_verified` |
| 3 | PRD + version history persist after reload | PASS | 1 PRD, 3 revisions (ai, human, human) after reload |
| 4/5 | Theme analysis says "checked on the server" | PASS | live model run |
| 4/5 | PRD generation says "checked on the server" | PASS | live run; label kept on later human-edited revisions (fixed: it was hidden after an edit) |
| 4/5 | Knowledge Base answer says "checked on the server" | BLOCKED | AI credits ran out mid-run (HTTP 402). Also found the error was mislabelled "failed schema validation"; fixed, it now says credits are exhausted. |
| 4 | Server refuses tampered/unknown sources (analysis, PRD, Q&A) | PASS | all three returned `source_rejected` before any model call |
| 6 | Review cannot be completed with missing fields | PASS | "Score every criterion" shown |
| 6 | Draft review persists after reload, not counted as completed | PASS | "1 in progress"; test draft deleted afterwards |
| 7 | Failed save shown + Retry saves | PASS | network blocked → "Not saved" + Retry → "All changes saved" |
| 7 | Invalid/expired session | PASS | AI call → `unauthorized` (no demo downgrade); workspace load → "Unauthorized: Invalid token" |
| 8 | Signed-out access to saved data | PASS | data API 401 on feedback, reviews, PRDs; protected load threw "Unauthorized" |
| — | Sign-out button | NOT RUN | It signs out every session of the account, which would have signed the owner out; signed-out behaviour verified separately. |
| — | Automated suite | **73/73 passed** (7 files) | `bunx vitest run` |

Side effects in the owner's workspace from this run: 2 extra human-edited PRD revisions (append-only, kept), one "Already imported" import entry, sample documents loaded, one AI analysis run.

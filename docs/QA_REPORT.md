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

## Hardening pass — 2026-10-20 (automated only; no human reviews, no second account)

| # | Check | Result | Evidence |
|---|---|---|---|
| E1 | Evaluation dataset expanded (v2): ambiguous, mixed-sentiment, rare-theme, missing-field, Unicode and injection edge cases | DONE | `eval/dataset.ts` — 92 labeled records (was 80), 10 retrieval queries, 12 capability cases, 1 conflicting-doc fixture |
| E2 | Dev/eval split documented (FB-* dev, EV-* held-out) | DONE | `docs/EVALUATION.md` |
| E3 | Deterministic eval re-run on v2 | PASS | baseline macro-F1 0.865 (n=92), duplicates 100/100, injection recall 100% (4 labeled), doc Recall@5 90% |
| E4 | LLM eval on v2 | BLOCKED | AI credits exhausted; v1 LLM numbers kept in `EVALUATION_RESULTS.md`, labeled as v1 |
| C1 | Quote verification: Unicode/emoji, punctuation, one-word-altered, instruction-like content | PASS | 3 new tests in `llm.test.ts` |
| C2 | Server-side source authority (unknown/unauthorized/stale/tampered refused) | PASS (unchanged) | `integrity.test.ts`, 12 tests |
| P1 | Long documents chunked without silent truncation | PASS | new test: 60-paragraph doc, all paragraphs present across sections |
| P2 | Conflicting document versions both surfaced with source IDs | PASS | new test in `eval.test.ts` |
| S1 | No private keys in frontend code; service key only in server-only module | PASS | source scan; `.env` holds only publishable client keys |
| S2 | Server logs contain no feedback/document content (error codes only) | PASS | source scan of all `console.*` in `src/` |
| S3 | Server input validation (row/size limits on sync) | PASS (unchanged) | zod limits in `persist.functions.ts` |
| — | Automated suite after changes | **78/78 passed** (7 files; baseline was 73/73) | `bunx vitest run` |

Not done in this pass (by design or blocked): optimistic concurrency for same-row edits across tabs (documented as last-write-wins limitation), MCP/n8n implementation (contracts only, `docs/INTEGRATION_CONTRACTS.md`), human reviews (0 completed — must come from people), LLM metrics on v2 (credits).

## MCP milestone — 2026-10-21

| # | Check | Result | Evidence |
|---|---|---|---|
| M1 | v2 LLM evaluation (`bun scripts/eval.ts --llm`) | BLOCKED | Every model call returned HTTP 402 (AI credits exhausted); key present, config correct. v1 metrics kept labeled as v1. |
| M2 | MCP server mounted at `/mcp` with OAuth | PASS (boundary) | Manifest extracted with 1 tool; unauthenticated `initialize` → 401 with `WWW-Authenticate` → `/.well-known/oauth-protected-resource` (verified live); metadata names the correct authorization server. Full OAuth handshake with an external MCP client NOT executed. |
| M3 | `get_feedback_evidence` tool logic | PASS | 10 new unit tests: verbatim excerpts, theme filtering, unknown theme rejected, empty results, limit cap, injection flagged as data, duplicates kept. |
| M4 | OAuth return-path validation | PASS | tests: external/protocol-relative/backslash inputs rejected, local paths preserved |
| M5 | Human Review rubric + instructions | DONE | reviewer instructions and 1–5 rubric added to the page; completion rules unchanged (all criteria + unsupported count required) |
| M6 | WebMCP browser tool (`list_visible_feedback`) | DONE | read-only, registered on Feedback Explorer, `untrustedContentHint` set; runtime registration not verifiable in a non-WebMCP browser |
| — | Automated suite after changes | **88/88 passed** (8 files; baseline was 78/78) | `bunx vitest run` |

## MCP second tool + deployment verification — 2026-10-22

| # | Check | Result | Evidence |
|---|---|---|---|
| N1 | Baseline before changes | PASS | 88/88 tests, `tsgo --noEmit` clean |
| N2 | `search_product_docs` tool logic | PASS | 5 new unit tests: verbatim excerpts with doc title/version/heading/page provenance, orphan sections (no saved document) excluded, blank query / no match / empty workspace → empty results, limit capped at 20 (default 10), injection-flagged sections returned labeled as data with text unaltered |
| N3 | Manifest extraction | PASS | 2 tools advertised: `get_feedback_evidence`, `search_product_docs` |
| N4 | Unauthenticated request rejected | PASS (local + published) | `POST /mcp` initialize without token → 401, `WWW-Authenticate: Bearer realm="mcp", resource_metadata=…/.well-known/oauth-protected-resource` |
| N5 | Malformed and forged bearer tokens rejected | PASS (local + published) | `Bearer not-a-real-token` → 401; forged JWT-shaped token → 401 |
| N6 | OAuth metadata correct | PASS (local + published) | `/.well-known/oauth-protected-resource` names the project's auth server as the authorization server |
| N7 | Full OAuth handshake with an external MCP client | NOT RUN | Requires an OAuth-connected MCP client completing the consent flow; boundary checks (N4–N6) verified instead |
| N8 | Cross-workspace access | PASS (by design + earlier SQL checks) | Tool handlers query as the caller under RLS — the same owner-scoped policies verified in earlier passes; no code path reads another workspace's rows |
| — | Automated suite after changes | **93/93 passed** (8 files; baseline was 88/88) | `bunx vitest run`; type check clean |

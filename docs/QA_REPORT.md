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

## MCP third tool (get_theme) — 2026-10-23

| # | Check | Result | Evidence |
|---|---|---|---|
| O1 | Baseline before changes | PASS | 93/93 tests, `tsgo --noEmit` clean |
| O2 | `get_theme` tool logic | PASS | 8 new unit tests: valid theme with re-verified verbatim evidence and labeled AI text; unknown theme and missing analysis → not_found; altered excerpt rejected (not a verbatim substring); evidence referencing records outside the workspace rejected; stale flag set when the feedback set changed; injection-flagged evidence returned labeled as data with text unaltered; sparse theme (no evidence/optional fields) returns nulls, never invented values; signature helper matches the store's recordsSignature |
| O3 | Manifest extraction | PASS | 3 tools advertised: `get_feedback_evidence`, `search_product_docs`, `get_theme` |
| O4 | Unauthenticated and forged-token requests rejected | PASS (local) | `POST /mcp` without token → 401 with `WWW-Authenticate`; `Bearer forged-token` → 401 `invalid_token` |
| O5 | Cross-workspace isolation | PASS by design | Handler queries `ai_analyses` and `feedback_records` as the caller under RLS — the same owner-scoped policies verified in earlier passes; evidence IDs not in the caller's rows fail re-verification (O2) |
| O6 | Full OAuth handshake with an external MCP client | BLOCKED | No OAuth-connected MCP client in this environment; manual steps in INTEGRATION_CONTRACTS.md |
| O7 | Published endpoint serves this revision | BLOCKED | Publish is user-initiated; the live endpoint serves the previous revision until republished |
| O8 | Full suite after changes | PASS | 101/101 tests (8 files), `tsgo --noEmit` clean, build OK |

## Publish verification + MCP end-to-end readiness — 2026-10-23

| # | Check | Result | Evidence |
|---|---|---|---|
| P1 | Full automated suite | PASS | 101/101 tests (8 files), `tsgo --noEmit` clean |
| P2 | Local `/mcp` rejects unauthenticated requests | PASS | `POST /mcp` initialize without token → 401 with `WWW-Authenticate: Bearer realm="mcp", resource_metadata=…` |
| P3 | Local `/mcp` rejects forged credentials | PASS | `Bearer forged-token` → 401 `invalid_token` |
| P4 | Local OAuth metadata correct | PASS | `/.well-known/oauth-protected-resource` names the direct auth issuer (`https://<project-ref>.supabase.co/auth/v1`), resource `Feedback To Product` |
| P5 | Published `/mcp` rejects unauthenticated + forged requests | PASS | Same probes against `https://feedback-to-product.lovable.app/mcp` → 401 / 401 |
| P6 | Published OAuth metadata correct | PASS | Published `/.well-known/oauth-protected-resource` names the same direct auth issuer |
| P7 | Published endpoint serves the latest revision (3 tools) | BLOCKED | `tools/list` requires a completed OAuth flow; no OAuth-connected MCP client exists in this environment. The published app serves the last published snapshot, which predates `get_theme` — republish, then verify with an external client |
| P8 | Full OAuth handshake (discovery → consent → token → tools/list → tool calls) | BLOCKED | Requires an external OAuth-connected MCP client; manual steps in INTEGRATION_CONTRACTS.md. Session JWTs are rejected by design (`requireOAuthClientClaim`), so the flow cannot be simulated with a copied session |
| P9 | Per-tool behavior (unknown IDs, tampered evidence, malformed args, empty results, injection labels) | PASS (unit level) | Covered by the 15 MCP unit tests in `src/lib/mcp/mcp.test.ts`; live per-tool calls remain part of the blocked P8 handshake |
| P10 | Cross-workspace isolation | PASS by design | All three handlers query as the caller under owner-scoped RLS (verified in earlier passes); `get_theme` additionally re-verifies every evidence ID against the caller's own rows |

## External MCP client handshake — 2026-10-30 (manual, user-run)

Run by the project owner with MCP Inspector v1.0.3 (Streamable HTTP, via proxy) against `https://feedback-to-product.lovable.app/mcp`. Evidence: owner's screenshot; no tokens or codes were shared.

| # | Check | Result | Evidence |
|---|---|---|---|
| X1 | First attempt: "Existing OAuth client information is required when exchanging an authorization code" | Client-side state issue | Inspector lost its saved registration between authorize and callback; resolved by clearing OAuth state and retrying. No server change. |
| X2 | OAuth discovery → registration → consent → token → `initialize` | PASS | Inspector shows "Connected", server `feedback-to-product` v0.1.0 |
| X3 | Published endpoint serves the latest revision (supersedes P7) | PASS | `tools/list` returned all three tools: `get_feedback_evidence`, `search_product_docs`, `get_theme` |
| X4 | Live tool calls (valid, unknown ID, empty, malformed input) | NOT RUN | Steps listed in INTEGRATION_CONTRACTS.md; still to do in Inspector |
| X5 | Cross-account isolation via a second account | NOT RUN | Needs a second account; enforced by owner-scoped RLS (P10) |

## Security and reliability verification — 2026-10-30

Baseline **101/101**; final **114/114**, 9 files. Automatic type/build check: `build OK` at 10:54:15Z (after test typing corrections). No new tools, services, auth settings, accounts, migrations or billing changes.

| Check | Actual result / scope |
|---|---|
| Published and local missing / malformed / forged-expired bearer | PASS: six POST probes returned 401 with challenges. The expired-shaped token was forged, so this is **not** proof of production expiry handling. |
| Published and local resource discovery | PASS: both metadata requests returned 200 with authorization servers. |
| Correctly signed expired token | PASS, isolated SDK protocol harness with ephemeral signing key and test issuer; not a production OAuth token. Valid signed control returned tools/list; expired, wrong-audience and missing-client-claim tokens returned 401. |
| Schemas | PASS, protocol harness advertises all three tools with closed input schemas; limit 21 rejected before database access. |
| Empty feedback/documents; unknown theme | PASS, actual tool handlers with controlled empty database responses. |
| Database error / partial failure | PASS, actual handlers with controlled failures return generic retry messages; document success plus section failure returns no partial evidence. |
| Request deadline / disconnect | PASS, controlled tests: each database fetch bounded to 15 seconds and caller cancellation propagated; already-cancelled work not started. New shared wrapper tested even against upstream ignoring abort. |
| Deployed access rules | PASS, read-only catalog query: RLS enabled, owner-only authenticated policies, no anonymous SELECT on all four MCP tables. |
| Signed-in workspace reads | PASS, injected owner session in app: feedback 49, docs 2, sections 9, analyses 1; every row belongs to caller, foreign-owner filters return zero rows; anonymous reads all 401. No writes performed. |
| Actual second-owner data isolation | BLOCKED: only one distinct data owner exists in all four tables. Foreign filters cannot demonstrate denial of existing foreign rows; no second account created. Earlier SQL simulation remains historical evidence only. |
| User-run three tool calls | User reports all three work; uploaded feedback result has saved_records provenance, 7 matches, 5 excerpts. Invalid doc limit and unknown theme errors observed by user. Not an assistant-run authenticated production test. |
| Real production expired/revoked OAuth token; production outages | NOT RUN: connected Inspector credentials remain in user's client. No session-token substitution or live outage induced. |
| Model access | AVAILABLE in one minimal real call; v2 runner subsequently completed 13 real calls with no reported failures. See EVALUATION_RESULTS. No billing change. |
| Human reviews | Database completed-review count = 0; **0/10** genuine completed reviews. |

Reproduce automated checks: `bunx vitest run src/lib/mcp/security.test.ts` or `bunx vitest run`. These are not a comprehensive security audit. Production timeout changes require republishing and client verification.

## Conflicting documents and capability gaps — 2026-10-30

| Check | Actual result / evidence |
|---|---|
| Existing automated baseline | PASS: **114/114**, 9 files, before edits. |
| Historical capability failures inspected | SCIM unknown vs expected not_documented lacked denial evidence; conflicting exports not_documented vs expected unknown lacked the conflict fixture in the model input. Historical 0.947/92, 74/74 and 10/12 retained unchanged. |
| Fixture repair, labels preserved | PASS: same 12 gold verdicts; evaluation-only SCIM denial and opposing export versions round-trip through persistence mappings and unchanged BM25. No live database writes. |
| First live rerun | 13 calls completed; 0.956/92, 75/75 theme citations, 11/12 capability cases. Both conflict versions retrieved/cited, but model inferred unsupported precedence: uncertainty FAIL. Retained as a failed intermediate run. |
| Evidence-backed Q&A repair | Only Q&A policy changed: unresolved conflict → unknown + clarification; versions/dates/majority cannot establish precedence without supplied evidence. Analysis prompt unchanged; no held-out feedback tuning. |
| Final live rerun | 13 calls completed; macro-F1 **0.971/92**, macro P/R **0.975/0.970**, **80/80** theme citations; **12/12** capability score with changed evidence. **28/28** Q&A document-citation occurrences accepted. |
| Conflict final answer | Six separate proxies PASS: retrieves both, cites both verbatim, communicates conflict, unknown verdict, clarification, no rejected citations. One question / two opposing docs; assistant inspected retained answer and observed no invented resolution, not human validation. |
| Regression tests | Eight added tests: labels retained, SCIM passage supplied, both conflicting passages in Q&A input, saved-row provenance round-trip, conflict score positives, fabricated ID/quote negatives, silently chosen verdict negative, normal export corpus uncontaminated. **122/122**, 10 files, final full suite. |
| Initial new test failure | ISO fixture timestamp formatting only (`Z` vs `.000Z`); fixture normalized, assertion retained and passed. No persistence defect or data deletion. |
| Type/build checks | Automatic application check log reports **build OK at 11:10:34Z**, after final source edits. Manual builds/typechecks not run (platform-managed); no separately observable standalone typecheck result, so not claimed. |
| Scope and human reviews | No new MCP tools, n8n/GitHub, auth/migration/billing changes or external writes. Genuine reviews remain **0/10**. |

Run commands: `bunx vitest run`; `bun scripts/eval.ts --llm --output docs/evaluation-runs/<new-name>.md`. Runner now requires an unused output path and retains a companion synthetic JSON artifact; terminal credit/config/access failures halt further calls and remaining cases are marked BLOCKED. Full denominators, intermediate failure, raw final answer and comparison limitations are in `EVALUATION_RESULTS.md` and `evaluation-runs/`.

Final confirmation at 11:10 UTC: **122/122 tests** passed again; deterministic runner repeated 0.865/92 and 90% Recall@5/10; attempting to reuse the final run filename was refused before any model call (observed overwrite-guard PASS).

Remaining risks: one development conflict example, model conflict handling remains instruction-based (citation matching cannot detect semantic contradictions), gold-majority mapping and combined dev/held-out scoring, no semantic support score, no genuine human evaluation, no production deployment check in this milestone. Recommended next milestone: fixed development-only label mapping and separately executed held-out evaluation with new untuned conflict/precedence fixtures; keep write-capable integrations out.

## Untuned challenge separation and semantic diagnostics — 2026-10-30

| Check | Actual result / evidence |
|---|---|
| Baseline | **122/122**, 10 files, before changes (`bunx vitest run`). |
| Independence audit | No independently sourced held-out set exists. 47 sample records/seeds are development; 45 EV examples exposed in prior combined gold-majority evaluation; export-conflict fixture used to repair Q&A instructions. |
| New challenge separation | 24 new synthetic feedback rows, 8 questions, 6 judge controls; expected labels separate from input module. No exact ID/normalized-text overlap with old corpus, but thematic/author bias remains. |
| Freeze/no tuning | Hashes of inputs/labels/scoring/prompts/runner captured and unchanged across two repeats. Production prompts untouched; challenge labels never enter model prompts or theme assignment. |
| Real runner | `bun scripts/eval-challenge.ts --output docs/evaluation-runs/challenge-v1-2026-10-30.md --repeats 2`: **24 model calls**, no errors/blocked cases. Existing model/streaming, no billing change. |
| Theme metrics | Both repeats macro-F1/P/R **1.000**, n=24; fixed development-seed mapping. **21/21** exact theme citations each; other examples uncited and mapped other. Not comparable with historical majority mapping. |
| Capability/scoped policies | Frozen score **6/8** both; no-precedence conflict and explicit precedence PASS; both apparent failures are label/scorer defects (universal availability and multi-verdict decomposition), not demonstrated model defects. Raw scores not revised. |
| Retrieval/citations | Required doc IDs **10/10** both; Q&A exact citation occurrences **26/26**, **23/23**. Local persistence mapping only, not live auth/storage validation. |
| Semantic support | Same-model automated judge **13/44** and **9/41** full-claim/individual-excerpt pairs supported; all pairs judged. Calibration **5/6** both; “only A” label overclaims what “A can/B cannot” proves. Not validated semantic faithfulness. |
| Severity/sentiment/confidence | Severity interval **17/21** each, inherited theme severity only. Sentiment rating-derived, confidence citation-count-derived; no semantic sentiment/calibrated confidence claims. |
| Final tests/application checks | **129/129**, 11 files; automatic log **build OK 11:18:54Z**. No manual build/typecheck commands; standalone typecheck not separately verified. |
| Scope | Evaluation files/docs only; no production logic changes, MCP additions, n8n/external writes, PRD generation or billing/auth changes. Human reviews **0/10**. |

Failure examples and retained synthetic answers/rationales: `EVALUATION_RESULTS.md` and `evaluation-runs/challenge-v1-2026-10-30.md.json`. Scoring remained frozen despite discovered defects; do not advertise 6/8 as two unsafe model answers or 1.000 as independent generalization. PRD readiness not established by this evaluation; keep current draft/review guardrails and next repair/version scoring, then evaluate unseen PRDs with separately authored cases.

## Scoring repair and PRD readiness milestone

| Check | Observed outcome |
|---|---|
| Historical baseline | PASS: `bunx vitest run` reproduced 129/129 before changes. Historical count retained. |
| Historical preservation | PASS: checksum comparison across 11 original run/scoring files unchanged at verification; v1 modules/artifacts not edited. |
| New category/contracts | PASS: supported/partial/unsupported/unassessable accounting, complete IDs, nonempty atoms, delimiters, exclusive-scope correction, six-case isolation, contradictory docs, rubric completeness and multi-verdict repair. These are contract tests, not semantic judge validation. |
| Final automated suite | PASS: 143/143 tests, 14 files (`bunx vitest run`); 14 new tests, original tests retained. Existing SDK multiple-client warnings occur in controlled tests. |
| Deterministic capability repair | 8/8 each on retained outputs under new scorer, original 6/8 unchanged; lexical matching and changed methodology, not model performance improvement. |
| Real new semantic model run | BLOCKED: HTTP 402 at first calibration request; 1 failed call per preserved attempt, no judgments, no further calls. |
| Six PRD/story generation cases | BLOCKED by confirmed model-credit failure; 0/6 generated/assessed. No simulated results substituted. |
| Application checks | PASS: automatic log build OK at 12:32:04Z on initial changes; Playwright public `/`, `/prd`, `/review` opened with correct titles, nonempty content, no page errors. Screenshot inspected for PRD empty state. Not a signed-in/generation end-to-end check. |
| Standalone typecheck | NOT EXECUTED: tsgo command absent; tsc exists but is not an authorized substitute for this project's automated harness. No standalone typecheck pass claimed. |
| Scope/human reviews | No production feature, auth/billing, data migration, MCP/n8n/external-write changes. Human reviews 0/10. |

Changed files: `src/lib/voc/eval/semantic-v2.ts`, `semantic-v2-controls.ts`, `semantic-v2.test.ts`, `capability-scoring-v2.ts`, `capability-scoring-v2.test.ts`, `prd-inputs-v1.ts`, `prd-labels-v1.ts`, `prd-readiness.ts`, `prd-readiness.test.ts`; `scripts/eval-readiness.ts`; new evaluation artifacts; `AGENTS.md`, `roadmap.md`, this report, EVALUATION.md, EVALUATION_RESULTS.md and ARCHITECTURE.md. INTEGRATION_CONTRACTS.md inspected, unchanged: proposed tools remain unimplemented.

Readiness: **needs further evaluation**, not production ready. Same-model atomization/judging can miss entailment failures; author isolation is procedural within the same AI system, not external independence. Known existing quote-validity labels do not guarantee semantic support. Keep existing draft review guardrails; next milestone is actual frozen PRD evaluation after access restoration, not integrations.

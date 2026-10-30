# Architecture

```text
Browser (React/TanStack)                     Server functions (Worker)                     Lovable Cloud
 store.tsx ── signed out ─► localStorage
     │  signed in: row diff (serialised, flushed before AI) ─► persist.functions (auth, RLS) ─► owner-scoped tables
     │  BM25 retrieval (feedback + docs) picks candidate source IDs
     ├── analyze / PRD / Q&A ─► *.functions ─► caller.server: valid bearer? ─ yes ─► load saved rows by ID (RLS)
     │                                              │                               reconcileSources: unknown/other user's
     │                                              │                               or text-mismatched → refused
     │                                              └─ no header ─► demo: browser sources, labelled "browser_supplied"
     │                                          llm.server ─► AI Gateway (structured output)
     └── grounding.ts verifies every quote verbatim against the (authoritative) sources ◄┘
```

Tables (all `owner_id = auth.uid()` RLS, no anonymous privileges): feedback_records, import_runs, product_docs → doc_sections, analysis_runs, ai_analyses (latest verified themes + provenance), ai_prds → prd_revisions (append-only, no update/delete) → human_reviews (FK to the exact revision), draft_tasks, workspace_settings.

Provenance: every AI result carries `server_verified` (signed in; sources replaced by saved copies) or `browser_supplied` (demo). Refused sources are listed in the UI and never sent to the model. An invalid bearer is an error, never a silent downgrade to demo.

Retrieval: BM25 only; embeddings not added (v2 doc Recall@5 = 90% over 10 labeled queries).

MCP server: `@lovable.dev/mcp-js` plugin mounts `/mcp` (plus `/.well-known/oauth-protected-resource`). Auth is Supabase OAuth (issuer = the project's auth server, `requireOAuthClientClaim`, consent at `/.lovable/oauth/consent`, return paths validated by `src/lib/oauth-return-path.ts`). Tool handlers build a per-call Supabase client with the caller's bearer token, so RLS scopes every query to the caller's rows — the same isolation as the app. Tools live in `src/lib/mcp/`; selection logic is pure (`evidence.ts`, `docs-search.ts`, `theme.ts`) and unit-tested. Three read-only tools are implemented: `get_feedback_evidence`, `search_product_docs` (reuses the app's BM25 index over saved document sections), and `get_theme` (returns one stored insight and RE-VERIFIES every stored evidence excerpt against the caller's saved records before returning it — unverifiable excerpts are reported as rejectedEvidence, and the result is marked stale when the feedback signature changed). The rest are contracts only. A browser-local WebMCP read tool (`list_visible_feedback`) is registered on the Feedback Explorer page via `use-webmcp-tool`.

Database fetches use `request.ts`: 15-second per-fetch deadline, caller/upstream cancellation, listener cleanup, bounded waiting even if upstream ignores abort. Controlled handler and SDK-protocol tests live in `security.test.ts`; signed test tokens use an ephemeral key and isolated issuer, never production impersonation. Real production OAuth expiry and two-owner reads remain separate verification requirements.

Evaluation-only capability fixtures (`voc/eval/capabilities.ts`) round-trip product documents through the existing `persist-map` serializer/restorer and then use shared BM25 and `runQa`/`groundAnswer`/`verifyCitations`. They never seed the database or bypass production ownership checks. Runner outputs are append-only by filename, preserving historical Markdown plus synthetic JSON inputs/results. v2.1 adds explicit SCIM denial evidence and supplies opposing export policy sections only to their relevant cases. Q&A instructions require unknown/clarification for unresolved documentation conflicts; semantic conflict handling remains model-based, not guaranteed by exact-quote verification. See EVALUATION_RESULTS for the observed intermediate failure and final development-regression pass.

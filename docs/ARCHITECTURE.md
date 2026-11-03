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

Untuned synthetic challenge CLI `scripts/eval-challenge.ts` keeps `challenge-inputs.ts` apart from scoring-only `challenge-labels.ts`. Fixed BM25 maps generated themes to the existing development seed catalogue, never to challenge gold-majority labels. Two predeclared repeats hash source inputs/labels/policies/scoring and checkpoint synthetic outputs after each call. The semantic judge reuses existing `callStructured` with evaluation-only instructions and validates all pair IDs; its calibration and pair-level support are separate from exact citation validity and genuine human reviews. Neither this same-model judge nor builder-authored data establishes independent held-out validation. No challenge code enters production UI or server-function paths.

Scoring v2 and PRD challenge use evaluation-only `scripts/eval-readiness.ts` and separate input/label/rubric modules. Historical v1 files remain immutable. Model atomization preserves scope and aggregates only a claim's associated citations; four-category support accounting excludes unassessable from assessable denominator, reports all counts and never promotes partial support. PRD generation uses unchanged `runPrdGeneration`/`groundPrd`, then generic automated assessment without expected labels and atomized source-support diagnostics. No live workspace persistence or auth checks occur in this CLI. Same-model judges and separately tasked synthetic authoring are not externally independent validation. Both blocked attempts retain hashes/results; production integration contracts remain unchanged.

Evaluation-only reporting v2 (`prd-report-v2.ts`) inventories every requirement/story with accepted/rejected source references, explicitly excludes labeled recommendations from entailment, retains unquoted scope for whole-draft assessment, and joins atomic judgments through parent IDs. Scenario statuses disclose interrupted/blocked coverage. Author expectations are appended only after calls; source/rubric hashes plus runtime/dependency hashes are retained. Neither formatting counts nor exact quote presence is a semantic-quality gate; original scoring categories remain unchanged.

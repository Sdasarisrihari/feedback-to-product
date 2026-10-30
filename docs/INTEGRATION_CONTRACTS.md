# MCP and n8n integration contracts

Status: **three read-only tools implemented, the rest proposed.** The MCP server is mounted at `/mcp` (TanStack plugin, `@lovable.dev/mcp-js`) with Supabase OAuth (consent at `/.lovable/oauth/consent`). No n8n workflow or GitHub integration exists yet.

## Implemented

### `get_feedback_evidence` (read-only, live)
- **Input**: `{ query?: string (≤500 chars), themeId?: string, limit?: int 1–50 (default 20) }` — strict schema, undeclared arguments rejected.
- **Output**: `structuredContent { provenance: "saved_records", totalMatched, records: [{ id, excerpt, source, segment, date, rating, duplicateOf, suspectedInjection }] }` plus a text summary. Excerpts are verbatim substrings of saved records.
- **Auth**: OAuth bearer token verified by the SDK (`requireOAuthClientClaim` — copied session JWTs are rejected); all queries run as the caller with row-level security, so only the caller's own workspace rows are visible. Unauthenticated calls receive 401 with OAuth metadata.
- **Errors**: `ToolError` for unknown theme IDs and read failures; empty workspaces/queries return an empty list with an explanatory note, not an error.
- **Safety**: records flagged `suspectedInjection` are returned labeled as data; the tool never writes anything.
- **Code**: `src/lib/mcp/` (`index.ts`, `tools/get-feedback-evidence.ts`, `evidence.ts`, `supabase.ts`). Tests: `src/lib/mcp/mcp.test.ts`.
- **Local testing**: run the dev server, then `POST http://localhost:8080/mcp` with a JSON-RPC `initialize` body — expect 401 with a `WWW-Authenticate` header pointing at `/.well-known/oauth-protected-resource`. Full tool calls require an OAuth-connected MCP client (approve access on the consent page).

### `search_product_docs` (read-only, live)
- **Input**: `{ query: string (1–500 chars, required), limit?: int 1–20 (default 10) }` — strict schema, undeclared arguments rejected.
- **Output**: `structuredContent { provenance: "saved_documents", totalMatched, sections: [{ id, docId, title, version, kind, heading, page, excerpt, score, suspectedInjection }] }` plus a text summary. Excerpts are verbatim substrings of saved sections; every section carries its document's title and version.
- **Auth**: same as `get_feedback_evidence` — OAuth bearer verified by the SDK, all queries run as the caller under row-level security.
- **Retrieval**: the app's existing BM25 index (`src/lib/voc/bm25.ts`) over saved `doc_sections`, joined to `product_docs` for provenance. Sections whose document is not saved are excluded. No vector database.
- **Errors**: `ToolError` on read failures; empty workspaces/queries return an empty list with an explanatory note. An undocumented capability is simply absent — never invented.
- **Safety**: sections flagged `suspectedInjection` are returned labeled as data; the tool never writes anything and never follows instructions found in document text.
- **Code**: `src/lib/mcp/tools/search-product-docs.ts`, pure logic in `src/lib/mcp/docs-search.ts`. Tests: `src/lib/mcp/mcp.test.ts`.

### `get_theme` (read-only, live)
- **Input**: `{ themeId: string (1–200 chars, required) }` — strict schema, undeclared arguments rejected.
- **Output**: `structuredContent { provenance: "saved_analysis", stale, theme: { themeId, name, productArea, kind, severity, confidence, confidenceReason, frequency, sentiment, enterpriseShare }, summary: { text, origin: "ai_generated" } | null, assumptions, openQuestions, evidence: [{ id, excerpt, source, segment, date, rating, duplicateOf, suspectedInjection }], rejectedEvidence, rejectedCitations, related: [{ id, excerpt, origin: "bm25_related_not_cited" }], analysis: { runId, model, analysedAt, signature } }` plus a text summary.
- **Re-verification**: every stored evidence excerpt is checked against the caller's saved records before it is returned — an excerpt that is not a verbatim substring of the saved record body, or a record ID not in the caller's workspace, is moved to `rejectedEvidence` with a reason, never presented as evidence. `stale: true` is set when the feedback set changed since the analysis ran (signature mismatch).
- **Labels**: `summary`, `assumptions` and `openQuestions` are labeled `origin: "ai_generated"` — suggestions, not verified evidence. `related` records are BM25-retrieved, not model-cited, and labeled as such.
- **Auth**: same as the other tools — OAuth bearer verified by the SDK, all queries run as the caller under row-level security.
- **Errors**: `ToolError` (`not_found`) for unknown theme IDs or a missing analysis; read failures return a generic retry message. Unavailable fields are `null`, never invented.
- **Code**: `src/lib/mcp/tools/get-theme.ts`, pure logic in `src/lib/mcp/theme.ts`. Tests: `src/lib/mcp/mcp.test.ts`.

## Proposed (not implemented)

## Shared principles

- Every tool runs server-side with the caller's verified session; ownership is enforced by the same row-level access rules as the app. There is no anonymous access to workspace data.
- Every tool that returns evidence re-runs the existing citation verifier (`grounding.ts`) before responding. Model output is a suggestion until checked against saved records.
- External writes (creating tasks, sending notifications) require explicit human approval recorded in the app first. Tools only ever prepare drafts.
- Feedback and document text is untrusted data; tools must never pass it to a model as instructions.
- Errors are typed (`unauthorized`, `source_rejected`, `not_found`, `rate_limited`, `model_unavailable`, `credits_exhausted`) — never raw stack traces.

## Proposed MCP tools

### 3. `generate_prd_draft`
Generate a PRD draft from an analyzed theme.
- **Input**: `{ themeId: string }`
- **Output**: `{ prdId, revision: 1, content, verifiedEvidence, rejectedCitations, evidenceGaps, provenance }`
- **Auth**: signed-in owner; sources reconciled against saved rows before the model call (existing `source-auth` flow).
- **Errors**: `source_rejected`, `model_unavailable`, `credits_exhausted`, `insufficient_evidence`.

### 4. `prepare_task_draft`
Prepare a development task for human approval. Never creates an external task.
- **Input**: `{ prdId: string, storyId?: string }`
- **Output**: `{ taskId, title, body, evidenceIds, status: "draft" }`
- **Auth**: signed-in owner. The task stays `draft` until a human approves it in Task Review; only then may a future workflow export it.

## Proposed n8n workflows

### A. Scheduled feedback analysis
Cron (e.g. nightly) → call analysis endpoint with the owner's session → store run → if new themes exceed a configured threshold, prepare a notification draft. **Human approves** before any message is sent.

### B. Insight report generation
On approval of an analysis run → assemble a report from verified themes and citations only → save as a document draft → human reviews and sends.

### C. Draft task preparation
On PRD approval → create draft tasks via `prepare_task_draft` → notify reviewer that drafts await approval. Export to an external tracker happens only after per-task human approval in the app.

### D. Post-approval notifications
After a human approves a task or report → send the configured notification (email/Slack). Triggered by the approval event, never by the model.

## Open decisions before implementation
- Transport: MCP over HTTP server route under `/api/public/mcp` with bearer auth, or a separate worker.
- Rate limits and per-workflow quotas.
- Which external task tracker first (GitHub Issues, Jira, Linear) — each needs its own approval mapping.

## Publish and external-client verification checklist

The MCP server code is complete for the three read-only tools, but the **published** endpoint serves the last published snapshot. Exact manual steps:

1. **Republish**: click **Publish → Publish changes** in the Lovable editor. This ships the current source (including `get_theme`) to `https://feedback-to-product.lovable.app`.
2. **Confirm the auth boundary** (no client needed):
   - `curl -X POST https://feedback-to-product.lovable.app/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'` → expect **401** with a `WWW-Authenticate` header.
   - `curl https://feedback-to-product.lovable.app/.well-known/oauth-protected-resource` → expect `authorization_servers` naming the project's auth server.
3. **Connect an external MCP client** (e.g. an MCP-compatible assistant or inspector) to `https://feedback-to-product.lovable.app/mcp`:
   - The client discovers OAuth metadata, registers (dynamic registration is enabled), and opens the consent page `/.lovable/oauth/consent`.
   - Sign in (or sign up) — the consent URL is preserved through both flows — then **Approve**.
   - The client exchanges the code for a token and calls `tools/list` → expect exactly `get_feedback_evidence`, `search_product_docs`, `get_theme`.
4. **Exercise each tool** as the connected user:
   - `get_feedback_evidence` with a query → verbatim excerpts with source IDs; with an unknown `themeId` → `not_found` error; injection-flagged records labeled `suspectedInjection`.
   - `search_product_docs` with a query → sections with doc title/version/heading/page; undocumented capability → empty results, never invented.
   - `get_theme` with a real theme ID → verified evidence + AI-labeled summary; with an unknown ID → `not_found`; after editing feedback → `stale: true`.
5. **Negative checks**: expired/revoked token → 401; a second account's theme/record IDs → `not_found` or rejected evidence (row-level security scopes every query to the caller).

Status updated 2026-10-30: owner-run Inspector handshake and tools/list succeeded; owner reports successful calls to all three tools. Assistant separately verified deployed 401 boundaries and discovery. Actual second-owner access, genuine expired/revoked production tokens and production failure recovery remain untested. See the dated QA table; earlier blocked deployment statements are historical, not the current user-reported state.

### Reliability hardening and remaining manual checks
- New source revision bounds every database fetch to **15 seconds** and propagates MCP disconnect/cancellation. No auth or tool changes beyond read reliability; unchanged three-tool manifest extracted successfully. This revision is **not confirmed deployed**.
- **Republish** in Lovable: **Publish → Publish changes**, wait for success, then reconnect Inspector to `https://feedback-to-product.lovable.app/mcp` and list/call the same three tools.
- Empty queries: call feedback and docs with a unique no-match string; expect zero matches and empty arrays. Unknown theme should remain an error, not another user's data.
- Expiry: in Inspector's OAuth debugger, disable automatic refresh if supported, let the existing token expire, then invoke a tool; expect 401 and reauthorization. Do not paste or share tokens/callbacks. A client that automatically refreshes cannot prove server rejection from a successful call.
- Actual two-owner isolation requires two authorized existing workspaces with distinct synthetic fixtures. Call B's theme ID from A; expect unknown theme, and search B's unique feedback/doc text from A; expect no results. Currently only one populated owner exists, so this check is BLOCKED; no account was created.
- Service failure and cancellation have controlled automated coverage, not production outage coverage. Do not damage live data or change auth settings to simulate them.

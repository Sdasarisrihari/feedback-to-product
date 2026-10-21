# MCP and n8n integration contracts

Status: **one tool implemented, the rest proposed.** The MCP server is mounted at `/mcp` (TanStack plugin, `@lovable.dev/mcp-js`) with Supabase OAuth (consent at `/.lovable/oauth/consent`). No n8n workflow or GitHub integration exists yet.

## Implemented

### `get_feedback_evidence` (read-only, live)
- **Input**: `{ query?: string (≤500 chars), themeId?: string, limit?: int 1–50 (default 20) }` — strict schema, undeclared arguments rejected.
- **Output**: `structuredContent { provenance: "saved_records", totalMatched, records: [{ id, excerpt, source, segment, date, rating, duplicateOf, suspectedInjection }] }` plus a text summary. Excerpts are verbatim substrings of saved records.
- **Auth**: OAuth bearer token verified by the SDK (`requireOAuthClientClaim` — copied session JWTs are rejected); all queries run as the caller with row-level security, so only the caller's own workspace rows are visible. Unauthenticated calls receive 401 with OAuth metadata.
- **Errors**: `ToolError` for unknown theme IDs and read failures; empty workspaces/queries return an empty list with an explanatory note, not an error.
- **Safety**: records flagged `suspectedInjection` are returned labeled as data; the tool never writes anything.
- **Code**: `src/lib/mcp/` (`index.ts`, `tools/get-feedback-evidence.ts`, `evidence.ts`, `supabase.ts`). Tests: `src/lib/mcp/mcp.test.ts`.
- **Local testing**: run the dev server, then `POST http://localhost:8080/mcp` with a JSON-RPC `initialize` body — expect 401 with a `WWW-Authenticate` header pointing at `/.well-known/oauth-protected-resource`. Full tool calls require an OAuth-connected MCP client (approve access on the consent page).

## Proposed (not implemented)

## Shared principles

- Every tool runs server-side with the caller's verified session; ownership is enforced by the same row-level access rules as the app. There is no anonymous access to workspace data.
- Every tool that returns evidence re-runs the existing citation verifier (`grounding.ts`) before responding. Model output is a suggestion until checked against saved records.
- External writes (creating tasks, sending notifications) require explicit human approval recorded in the app first. Tools only ever prepare drafts.
- Feedback and document text is untrusted data; tools must never pass it to a model as instructions.
- Errors are typed (`unauthorized`, `source_rejected`, `not_found`, `rate_limited`, `model_unavailable`, `credits_exhausted`) — never raw stack traces.

## Proposed MCP tools

### 2. `search_product_docs`
Search product documentation and release notes.
- **Input**: `{ query: string, limit?: number (≤20) }`
- **Output**: `{ sections: [{ id, docId, title, version, heading, page, excerpt, suspectedInjection }] }`
- **Auth**: signed-in owner. Sections flagged `suspectedInjection` are returned labeled as data.

### 3. `get_theme`
Retrieve one analyzed theme with its verified evidence.
- **Input**: `{ themeId: string }`
- **Output**: `{ theme, summary, severity, evidence: [{id, excerpt}], rejectedCitations: [...], provenance, signature }` — plus `stale: true` if the feedback set changed since analysis.
- **Auth**: signed-in owner.
- **Errors**: `not_found`, `stale_results` (caller must re-run analysis).

### 4. `generate_prd_draft`
Generate a PRD draft from an analyzed theme.
- **Input**: `{ themeId: string }`
- **Output**: `{ prdId, revision: 1, content, verifiedEvidence, rejectedCitations, evidenceGaps, provenance }`
- **Auth**: signed-in owner; sources reconciled against saved rows before the model call (existing `source-auth` flow).
- **Errors**: `source_rejected`, `model_unavailable`, `credits_exhausted`, `insufficient_evidence`.

### 5. `prepare_task_draft`
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

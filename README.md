# AI Voice-of-Customer Intelligence Agent

Turns customer feedback (CSV imports, support tickets, reviews) into evidence-backed insights, prioritized opportunities, PRDs, user stories, and human-approved draft tasks. Demo domain: fictional PM SaaS "Trellis" with synthetic data only.

## What it does

- **Feedback Explorer** — CSV import with validation, duplicate flagging (never silent drops), missing-field warnings, prompt-injection flagging, search and filters.
- **Insights** — server-side AI theme analysis; every quote is verified to appear verbatim in the cited record, rejected citations are shown separately, and results are tied to the exact record set they came from.
- **Prioritization** — transparent weighted scoring (frequency, severity, impact, effort) with visible rationale.
- **PRD Studio** — AI-generated PRDs and user stories with structured, validated output; evidence-based requirements must cite verified sources or are downgraded; append-only revision history.
- **Knowledge Base** — product docs and release notes ingestion (Markdown, text, CSV, PDF), BM25 retrieval, and grounded Q&A with explicit documented / not-documented / unknown capability verdicts.
- **Task Review** — draft tasks require human approval; nothing is sent externally.
- **Human Review** — structured scoring of PRDs/stories tied to exact revisions; summaries count completed reviews only.

## Data and accounts

- Signed-out visitors get an empty browser-only demo workspace (optional synthetic sample data).
- Signed-in users get a private cloud workspace; every table is owner-scoped with row-level security, and signed-in AI requests have their sources re-checked against the saved records on the server.

## Development

```sh
npm i
npm run dev
bunx vitest run        # automated tests
bun scripts/eval.ts    # deterministic evaluation (add --llm for model metrics, costs credits)
```

## Documentation

- `docs/ARCHITECTURE.md` — data flow, tables, provenance model
- `docs/EVALUATION.md` / `docs/EVALUATION_RESULTS.md` — evaluation method and measured results
- `docs/QA_REPORT.md` — end-to-end verification log
- `docs/KNOWN_LIMITATIONS.md` — what is not done or not verified
- `docs/INTEGRATION_CONTRACTS.md` — MCP/n8n contracts; three read-only MCP tools (`get_feedback_evidence`, `search_product_docs`, `get_theme`) are live at `/mcp` with OAuth, the rest are proposed

## Agent integrations (MCP)

The app exposes an OAuth-protected MCP server at `/mcp` with three read-only tools: `get_feedback_evidence` (verified feedback records, verbatim excerpts with source IDs), `search_product_docs` (BM25 search over saved product documentation with title/version/section provenance), and `get_theme` (one analyzed theme with re-verified evidence, rejected citations, and AI-generated summary/assumptions labeled as suggestions). All return only the caller's own workspace data. Connecting assistants sign in via the consent page and can only ever see their own data. A browser-local read tool (`list_visible_feedback`) is also registered on the Feedback Explorer page for agent browsers.
- `docs/DEMO_SCRIPT.md` — portfolio walkthrough

## Built with

TanStack Start · React · TypeScript · Tailwind CSS · Lovable Cloud (auth + database) · Lovable AI Gateway

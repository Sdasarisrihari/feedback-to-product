# AI Voice-of-Customer Intelligence Agent

An evidence-linked AI product prototype for turning customer feedback into product research, transparent opportunity rankings, and reviewable PRD drafts.

**Portfolio positioning:** AI product discovery, requirements analysis, evaluation design, and trust safeguards—not production-ready automation. The demo uses **synthetic feedback and documentation for fictional SaaS “Trellis.”** No measured customer or business outcomes are claimed.

Application: https://feedback-to-product.lovable.app (published revision was not checked in this local audit).

## Business problem and solution

Product teams must reconcile scattered requests, recurring problems, and conflicting product guidance before choosing what to build. Summarization alone can obscure the evidence or invent capabilities. This prototype preserves source references, separates customer requests from documented capabilities, makes prioritization assumptions visible, and keeps generated requirements subject to human review.

## Existing capabilities

- CSV import with validation, line-level errors, metadata warnings, normalized duplicate flags, and ID-collision protection. Whole identical re-imports add no feedback rows; mixed imports retain flagged duplicates.
- Feedback search/filtering; a labeled, fixed-catalogue BM25 baseline and a separate server-side AI theme-analysis path.
- Source-ID/quote checks with accepted and rejected citations displayed separately. Quote presence is **not** proof of semantic support.
- Adjustable opportunity scoring: frequency, severity, enterprise-share impact proxy, citation-derived confidence, inverse PM-estimated effort.
- Structured AI PRDs, stories and acceptance criteria; editable/regeneratable drafts and append-only content revisions. Actual PRD quality remains unassessed.
- Markdown/text/CSV/text-PDF ingestion, section/page metadata, lexical BM25 retrieval, and model-assisted Q&A.
- Revision-specific human-review workflow and approval/rejection of draft tasks. **No external task writes.**
- Signed-out browser demo; signed-in private cloud workspace with caller-scoped access and saved-source reconciliation.
- Three read-only OAuth MCP tools: `get_feedback_evidence`, `search_product_docs`, `get_theme`. Browser WebMCP registration is separate and not verified in a supporting browser.

Detailed classifications and evidence: [final audit](docs/FINAL_PROJECT_AUDIT.md). n8n, GitHub actions, vector search and write-capable MCP tools are **not implemented**.

## Technology and architecture

TypeScript; React 19; TanStack Start 1 / TanStack Router; Vite 8; Tailwind CSS 4 and existing UI components; Lovable Cloud auth and PostgreSQL database; Zod; custom BM25; PDF.js; Vitest; `@lovable.dev/mcp-js`.

**Actual current LLM path:** `@ai-sdk/openai` + `ai` Vercel AI SDK, Responses through Lovable AI Gateway, model `openai/gpt-6-astra`. Gemini is not the current configured model. The newer `@lovable.dev/ai-gateway` SDK is not installed; this audit does not migrate integrations.

Browser state → server functions → caller-owned saved sources → structured model response → deterministic citation checks → draft/review UI. Signed-out demo sources have `browser_supplied` provenance, not saved-source verification. See [architecture and Mermaid diagram](docs/ARCHITECTURE.md).

## Setup and running locally

Use the existing Lovable project environment and provisioned Cloud configuration. Bun and Node are needed; installation may require package-network access and was **not executed in this audit**.

```bash
bun install --frozen-lockfile
bun run dev
```

Use the URL printed by Vite. The managed preview environment uses port 8080. `bun run build` is the declared package build command; managed application builds are handled by the platform and were not manually invoked during this audit.

A source checkout without its provisioned Cloud/auth/OAuth configuration is not a verified standalone deployment. SQL schema history is in `drizzle/migrations/`; `drizzle/schema.ts` is intentionally blank. Do not auto-apply migrations, change auth settings, or manufacture server credentials to follow this guide.

### Environment variable names (never values)

| Name | Purpose and boundary |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Platform-generated browser connection metadata. Not private model credentials. Do not edit generated clients or `.env`. |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Platform-managed server connection metadata for caller-scoped reads. |
| `LOVABLE_API_KEY` | Existing server-only model credential; never expose in browser code, logs or docs. Presence is not model availability. |
| `SUPABASE_SERVICE_ROLE_KEY` | Referenced by a generated privileged server client; **not user-accessible on Lovable Cloud**. Ordinary workspace/MCP reads use caller credentials, not this client. Do not request or invent its value. |

No secrets are included here. Model calls require eligible access and may consume credits. Do not run live evaluation or generation merely to test installation while access is blocked.

## Local tests

```bash
node node_modules/vitest/vitest.mjs run
# Equivalent installed Vitest command:
bunx vitest run
# Only when available:
tsgo --noEmit
```

Latest local audit: **153/153 tests, 15 files**, plus standalone `tsgo --noEmit` exit 0 on 2026-11-06. No coverage percentage was measured. Local tests include controlled database/protocol fixtures; they are not a production security audit. See [QA](docs/QA_REPORT.md).

## Interview demonstration

Follow [the 5–7 minute script](docs/DEMO_SCRIPT.md). Start with the empty visitor workspace, explicitly load the synthetic sample, show baseline themes, source excerpts, ranking weights and document search. Do not press AI buttons while access is blocked. Show actual retained evaluation artifacts or an existing authorized draft when available; do not imply six PRD challenge cases completed. Human reviews remain **0/10 in the latest records**, not freshly queried.

Last documented recovery check (2026-11-05): **0.00 model-eligible credits**, PRD assessments **0/6**, monthly quality baseline **not established**. Availability was not rechecked in this audit. [Safe resume guide](docs/RESUME_AND_EVALUATION_GUIDE.md).

## Portfolio and evidence documents

- [Case study](docs/PORTFOLIO_CASE_STUDY.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Seven-slide interview outline](docs/INTERVIEW_PRESENTATION.md)
- [Final capability audit](docs/FINAL_PROJECT_AUDIT.md)
- [Architecture](docs/ARCHITECTURE.md), [limitations](docs/KNOWN_LIMITATIONS.md)
- [Evaluation methodology](docs/EVALUATION.md), [historical results](docs/EVALUATION_RESULTS.md), [QA evidence](docs/QA_REPORT.md)
- [MCP contracts and historical client checks](docs/INTEGRATION_CONTRACTS.md)
- [Human protocol](docs/HUMAN_REVIEW_PROTOCOL.md), [blank worksheet](docs/PRD_HUMAN_REVIEW_WORKSHEET.md)

## Known limitations

Small builder-authored synthetic benchmarks; no independent/customer validation; exact citations do not establish claim truth; PRD schemas cannot guarantee testable criteria; source-budget/PDF extraction limits; same-row last-write-wins; nontransactional multi-table saves; incomplete first-import and real second-owner/production OAuth-expiry checks. Settings contains stale MCP and retrieval claims; use the audit, not that page, as the integration/metric authority. See the full limitations register.

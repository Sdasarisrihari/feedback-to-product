# Interview demonstration script — 6 minutes 30 seconds

Portfolio prototype, synthetic Trellis data only. Designed for AI Business Analyst, AI Product Manager, Associate PM and Forward Deployed PM interviews. No business-impact or human-validation claim is made.

## Before the interview

- Review [final audit](FINAL_PROJECT_AUDIT.md), [limitations](KNOWN_LIMITATIONS.md) and [results](EVALUATION_RESULTS.md). Settings contains stale integration/metric labels; avoid using it as evidence.
- Open an authorized existing workspace or a separate browser demo profile. New visitors start empty; previously used browsers restore their local data. Do not clear an owner's real cloud workspace.
- For a future actual demo, loading the app may contact its configured backend. This **audit did not execute browser/network flows**. Confirm the intended session beforehand; never expose credentials, customer data or OAuth callbacks.
- Use **Load sample dataset** explicitly. If demonstrating upload, obtain a CSV from the existing `SAMPLE_CSV` constant in `src/lib/voc/sample-data.ts`; label it synthetic. Do not invent a customer dataset. Do not reset cloud data to stage a demo.
- Latest retained access check is 0.00 eligible credits (2026-11-05), not current availability. **Blocked-mode script is the default:** do not click Run AI analysis, Ask AI or Generate PRD. Have retained artifacts open. Show an existing authorized generated draft only if it actually exists; otherwise show the PRD empty state and explain the workflow.
- Do not create/complete a human review merely to make the demonstration look successful. The blank worksheet remains blank. Hide private account identity as needed.

## Timed walkthrough

### 0:00–0:35 — Overview and business problem

“This prototype helps product teams connect feedback to decisions rather than just produce summaries. The challenge is recurring customer problems, uncertain feature scope and product documents that can disagree. I chose traceability and visible uncertainty over unattended automation.”

Show Overview. Explain the fictional Trellis dataset and distinguish a fresh empty workspace from optional samples.

### 0:35–1:25 — Feedback ingestion and data quality

Go to Feedback Explorer. Load the synthetic sample or upload its existing CSV. Show a source ID, import filename/line, metadata, a duplicate flag, an instruction-like record, and source/search filters.

“Matching feedback is flagged, not silently erased. Whole identical reimports add no feedback rows, and reused IDs do not overwrite different existing text. This is normalized-text matching, not semantic deduplication.”

Do not imply a malformed import/production failure was tested during the interview unless actually exercised.

### 1:25–2:15 — Themes and evidence

Show baseline Insights and click a source reference to the feedback record. Say explicitly: “This view is the deterministic seven-theme BM25 baseline, not a new model answer.” Show rating sentiment and heuristic/model-origin labels.

Explain the AI path: saved owner sources replace submitted copies; structured output quotes are checked by ID and substring; invalid quotes are separated. **Blocked mode:** describe the implemented path without clicking the model button. Use historical analysis records only as historical evidence. “Quote presence does not prove the full claim is supported.”

### 2:15–2:55 — Prioritization and PM judgment

Open Prioritization; change a weight or effort estimate in the demo. Show the factor contributions and rationale.

“Frequency, severity, enterprise-share proxy, citation confidence and inverse effort make the trade-off inspectable. These weights support discussion; they do not predict revenue or prove the objectively correct roadmap.”

### 2:55–3:40 — Knowledge Base and RAG

Load existing synthetic sample docs if needed. Enter a keyword question and show **search hits only** with document title/version/heading/page and excerpts. Explain feedback versus product-capability evidence. Do not click Ask AI while blocked, including pressing Enter (which can invoke AI).

“BM25 retrieves passages; the model can answer over them when access is available. Q&A is instructed to cite both conflicting policies and ask for precedence rather than silently choose the newest. The benchmark is synthetic and cannot guarantee that behavior.”

### 3:40–4:35 — PRDs, stories and acceptance criteria

Open PRD Studio. If an authorized retained draft exists, show its requirements, story criteria, citations/rejections, assumptions and revision controls—without regeneration. Otherwise show the real empty state and the existing source of the workflow in the architecture/reporting documentation.

“Generation is implemented, but our frozen six-case PRD assessment has completed zero cases. Structure checks and citation status are not a validated PRD quality gate. A criterion must describe an observable pass/fail result, not merely use Given/When/Then wording.”

Do not imply the blocked attempt produced a draft. Content history is append-only, but source snapshots are not revision-specific; genuine review needs separately frozen output/source copies.

### 4:35–5:15 — Human review and draft tasks

Open Human Review. Show the criteria and completion requirements, or the truthful empty state. Open the [blank ten-review worksheet](PRD_HUMAN_REVIEW_WORKSHEET.md).

“The app stores revision-specific scores; the monthly metric additionally requires pass/fail evidence for traceability, testable criteria and unsupported-claim prevention. Automated judgments do not count as human reviews. Current recorded genuine reviews are 0/10.”

Task Review can show draft/approved/rejected states only when present. Explain edits reset approval and nothing is exported. Do not approve anything for presentation optics.

### 5:15–5:55 — Architecture and read-only MCP

Show the [Mermaid diagram](ARCHITECTURE.md). Explain browser demo versus private cloud, bearer/RLS saved-source reads, server-only model credential, structured generation and source checks.

“The configured model is `openai/gpt-6-astra` via the existing AI SDK/Gateway, not Gemini. MCP exposes three read-only tools for feedback, docs and one theme. Owner-run Inspector discovery was recorded historically; this interview is not a fresh OAuth or cross-owner security check.”

### 5:55–6:30 — Results, business value and next step

“153 local tests pass. Deterministic macro-F1 is 0.865 on 92 synthetic records; doc Recall@5 is 90% on ten queries. A development LLM run recorded 0.971 and 80/80 quote checks, not human-supported claim accuracy. PRD quality and the monthly baseline remain unestablished.”

Close with the saved goal: **Product teams make better-informed product decisions.** Explain expected value—faster evidence inspection and clearer requirements—as a hypothesis. Next: restore existing eligible access, complete frozen PRD assessment, collect actual reviews, then decide what to improve.

## Optional live-AI branch (only after confirmed access)

Replace the blocked-mode explanation with **one** authorized actual analysis/PRD call if suitable sources and budget exist. Disclose latency, retained inputs and model configuration; do not repeatedly retry a failure. A new draft is not a completed challenge assessment or human approval. If access errors occur, stop, show the error honestly, and return to the retained-artifact walkthrough. MCP Inspector can be demonstrated separately only with a real existing OAuth client/session and safe read-only calls.

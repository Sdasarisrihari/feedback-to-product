# Architecture

```text
Browser (React/TanStack)                     Server functions (Worker)             Lovable Cloud
 store.tsx ── signed out ─► localStorage
     │  signed in: row diff ───────────────► persist.functions (auth, RLS) ─────► owner-scoped tables
     │  BM25 retrieval (feedback + docs)
     ├── analyze ──────────────────────────► analyze.functions ─► llm.server ─► AI Gateway (gpt-6-astra)
     ├── PRD / Q&A ────────────────────────► generate.functions ─► llm.server        │ structured output
     └────────────────── grounding.ts verifies every citation against the exact sources sent ◄┘
```

Tables: feedback_records, import_runs, product_docs → doc_sections, analysis_runs, ai_analyses (latest verified themes + citations, tied to a record-set signature), ai_prds → prd_revisions (append-only), draft_tasks, workspace_settings. All keyed (owner_id, source id) so citations keep pointing at the original record/section.

Retrieval: BM25 only. Embeddings were not added: labeled doc Recall@5 = 100% on the current corpus (see EVALUATION_RESULTS.md); revisit when the corpus grows.

Known gap: model inputs are assembled in the browser from the user's own workspace; the server verifies citations against those inputs, not against database rows.

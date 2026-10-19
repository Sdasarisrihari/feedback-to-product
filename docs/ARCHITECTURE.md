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

Retrieval: BM25 only; embeddings not added (doc Recall@5 = 100% on the current corpus).

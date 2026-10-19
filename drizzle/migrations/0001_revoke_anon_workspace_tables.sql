-- Workspace data is private: anonymous visitors get no table privileges at all (RLS already returns zero rows).
REVOKE ALL ON public.feedback_records, public.import_runs, public.product_docs, public.doc_sections, public.analysis_runs,
  public.ai_analyses, public.ai_prds, public.prd_revisions, public.draft_tasks, public.workspace_settings FROM anon;
-- Revisions are append-only for users.
REVOKE UPDATE, DELETE, TRUNCATE ON public.prd_revisions FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.feedback_records, public.import_runs, public.product_docs, public.doc_sections, public.analysis_runs,
  public.ai_analyses, public.ai_prds, public.draft_tasks, public.workspace_settings FROM authenticated;
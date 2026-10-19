-- Every row is owned by one signed-in user (workspace = user). IDs are app-level source IDs,
-- unique per owner, so citations (which reference source IDs) stay linked to their originals.

CREATE TABLE public.feedback_records (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  source text NOT NULL DEFAULT 'unknown',
  segment text NOT NULL DEFAULT 'unknown',
  feedback_date text NOT NULL DEFAULT '',
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (length(body) > 0),
  import_id text NOT NULL,
  line integer NOT NULL,
  warnings jsonb NOT NULL DEFAULT '[]',
  duplicate_of text,
  suspected_injection boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.import_runs (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  filename text NOT NULL,
  imported_at timestamptz NOT NULL,
  total integer NOT NULL, accepted integer NOT NULL, duplicates integer NOT NULL, warnings integer NOT NULL,
  rejected jsonb NOT NULL DEFAULT '[]',
  fatal_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.product_docs (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  title text NOT NULL, version text NOT NULL DEFAULT '', kind text NOT NULL, filename text NOT NULL,
  imported_at timestamptz NOT NULL,
  warnings jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.doc_sections (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  doc_id text NOT NULL,
  position integer NOT NULL,
  heading text NOT NULL, page integer, body text NOT NULL,
  suspected_injection boolean NOT NULL DEFAULT false,
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, doc_id) REFERENCES public.product_docs(owner_id, id) ON DELETE CASCADE
);

CREATE TABLE public.analysis_runs (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  method text NOT NULL CHECK (method IN ('bm25-baseline','llm')),
  model text,
  status text NOT NULL DEFAULT 'succeeded',
  record_count integer NOT NULL, theme_count integer NOT NULL, duration_ms integer NOT NULL,
  ran_at timestamptz NOT NULL,
  PRIMARY KEY (owner_id, id)
);

-- Latest AI analysis result: verified themes + citations, tied to the record-set signature.
CREATE TABLE public.ai_analyses (
  owner_id uuid NOT NULL DEFAULT auth.uid() PRIMARY KEY,
  run_id text NOT NULL,
  model text NOT NULL,
  analysed_at timestamptz NOT NULL,
  signature text NOT NULL,
  input_count integer NOT NULL,
  truncated boolean NOT NULL DEFAULT false,
  duration_ms integer NOT NULL,
  notes text NOT NULL DEFAULT '',
  insights jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_prds (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  theme_id text NOT NULL, theme_name text NOT NULL, model text NOT NULL,
  review text NOT NULL DEFAULT 'draft' CHECK (review IN ('draft','accepted','needs_changes')),
  sources jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

-- Append-only revisions (no UPDATE/DELETE policy).
CREATE TABLE public.prd_revisions (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  prd_id text NOT NULL,
  rev_no integer NOT NULL,
  author text NOT NULL CHECK (author IN ('ai','human')),
  content jsonb NOT NULL,
  report jsonb,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (owner_id, prd_id, rev_no),
  FOREIGN KEY (owner_id, prd_id) REFERENCES public.ai_prds(owner_id, id) ON DELETE CASCADE
);

CREATE TABLE public.draft_tasks (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  theme_id text NOT NULL, title text NOT NULL, description text NOT NULL,
  acceptance jsonb NOT NULL DEFAULT '[]',
  evidence_ids text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected')),
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.workspace_settings (
  owner_id uuid NOT NULL DEFAULT auth.uid() PRIMARY KEY,
  weights jsonb NOT NULL,
  effort jsonb NOT NULL DEFAULT '{}',
  browser_import_done boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['feedback_records','import_runs','product_docs','doc_sections','analysis_runs','ai_analyses','ai_prds','draft_tasks','workspace_settings'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "owner select" ON public.%I FOR SELECT TO authenticated USING (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "owner insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "owner update" ON public.%I FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "owner delete" ON public.%I FOR DELETE TO authenticated USING (owner_id = auth.uid())', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT ON public.prd_revisions TO authenticated;
GRANT ALL ON public.prd_revisions TO service_role;
ALTER TABLE public.prd_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner select" ON public.prd_revisions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner insert" ON public.prd_revisions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE INDEX ON public.doc_sections (owner_id, doc_id);
CREATE INDEX ON public.analysis_runs (owner_id, ran_at DESC);
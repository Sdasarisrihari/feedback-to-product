ALTER TABLE public.ai_analyses ADD COLUMN provenance text NOT NULL DEFAULT 'browser_supplied';
ALTER TABLE public.ai_analyses ADD COLUMN source_rejections jsonb NOT NULL DEFAULT '[]';

CREATE TABLE public.human_reviews (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  prd_id text NOT NULL,
  rev_no integer NOT NULL,
  target text NOT NULL CHECK (target IN ('prd','story')),
  story_id text,
  reviewer text NOT NULL DEFAULT '',
  scores jsonb NOT NULL DEFAULT '{}',
  unsupported_claims integer CHECK (unsupported_claims IS NULL OR unsupported_claims >= 0),
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, prd_id, rev_no) REFERENCES public.prd_revisions(owner_id, prd_id, rev_no) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.human_reviews TO authenticated;
GRANT ALL ON public.human_reviews TO service_role;
REVOKE ALL ON public.human_reviews FROM anon;
ALTER TABLE public.human_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner select" ON public.human_reviews FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner insert" ON public.human_reviews FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update" ON public.human_reviews FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner delete" ON public.human_reviews FOR DELETE TO authenticated USING (owner_id = auth.uid());
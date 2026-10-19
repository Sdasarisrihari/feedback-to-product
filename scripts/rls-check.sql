-- Access-control regression check (run as a privileged session; ends with RAISE to roll back).
-- Expected final error: RLS_CHECK_PASSED. Any "FAIL:" message is a security regression.
-- See docs/ARCHITECTURE.md. Last run result recorded in docs/EVALUATION_RESULTS.md.
DO $$
DECLARE a uuid := '00000000-0000-0000-0000-00000000000a'; b uuid := '00000000-0000-0000-0000-00000000000b'; n int; rc int;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  INSERT INTO public.feedback_records (owner_id, id, body, import_id, line) VALUES (a, 'RLS-TEST', 'secret', 'imp', 1);
  INSERT INTO public.ai_prds (owner_id, id, theme_id, theme_name, model, sources, created_at) VALUES (a, 'P1', 't', 'T', 'm', '{}', now());
  INSERT INTO public.prd_revisions (owner_id, prd_id, rev_no, author, content, created_at) VALUES (a, 'P1', 1, 'ai', '{}', now());
  INSERT INTO public.human_reviews (owner_id, id, prd_id, rev_no, target) VALUES (a, 'HR1', 'P1', 1, 'prd');
  BEGIN INSERT INTO public.human_reviews (owner_id, id, prd_id, rev_no, target) VALUES (a, 'HR2', 'P1', 9, 'prd'); RAISE EXCEPTION 'FAIL: review of nonexistent revision';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN UPDATE public.prd_revisions SET content = '{"x":1}' WHERE prd_id = 'P1'; RAISE EXCEPTION 'FAIL: revision updatable';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.feedback_records (owner_id, id, body, import_id, line) VALUES (b, 'SPOOF', 'x', 'imp', 1); RAISE EXCEPTION 'FAIL: spoof';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM public.human_reviews; IF n <> 0 THEN RAISE EXCEPTION 'FAIL: B reads A reviews'; END IF;
  SELECT count(*) INTO n FROM public.feedback_records WHERE id='RLS-TEST'; IF n <> 0 THEN RAISE EXCEPTION 'FAIL: B reads A feedback'; END IF;
  UPDATE public.human_reviews SET reviewer='x'; GET DIAGNOSTICS rc = ROW_COUNT; IF rc <> 0 THEN RAISE EXCEPTION 'FAIL: B edits A review'; END IF;
  DELETE FROM public.ai_prds WHERE id = 'P1'; GET DIAGNOSTICS rc = ROW_COUNT; IF rc <> 0 THEN RAISE EXCEPTION 'FAIL: B deletes A'; END IF;
  BEGIN INSERT INTO public.human_reviews (owner_id, id, prd_id, rev_no, target) VALUES (b, 'HR3', 'P1', 1, 'prd'); RAISE EXCEPTION 'FAIL: B reviews A revision';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  PERFORM set_config('role', 'anon', true);
  BEGIN SELECT count(*) INTO n FROM public.human_reviews; RAISE EXCEPTION 'FAIL: anon';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE EXCEPTION 'RLS_CHECK_PASSED';
END $$;

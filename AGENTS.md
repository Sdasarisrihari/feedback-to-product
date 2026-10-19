<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Domain logic lives in pure, tested modules under `src/lib/voc/` (csv, bm25, analysis, prioritize, drafts); routes only render. Why: keeps parsing, retrieval, scoring and approval testable without the UI.
- `src/lib/voc/store.tsx` is the single state boundary: signed-out = browser storage demo, signed-in = row-level diff sync (`persist-map.ts` → `persist.functions.ts`, RLS as the user). Why: pages stay unaware of where data lives.
- Every workspace table is owner-scoped (`owner_id = auth.uid()` RLS, no anon grants); the server stamps owner_id from the session, never from client rows. Why: private customer data per account.
- Any output not produced by a connected model must be labeled in the UI (MockNotice) and never presented as AI results. Why: roadmap forbids simulated AI and fabricated evidence.
- Evidence excerpts must be verbatim substrings of stored feedback with their source IDs; duplicates are flagged, never dropped. Why: traceability is the product's core promise.
- Feedback text is untrusted data; instruction-like text is flagged and must never be fed to a model as instructions. Why: prompt-injection risk.
- AI analysis runs only in `analyze.functions.ts` → `llm.server.ts` (server key, structured output); every model citation is re-verified by `groundLlmOutput` and failures are shown as rejected, never as evidence. Why: model output is a suggestion until checked against source records.
- AI results are tied to a signature of the analysed record set and hidden when feedback changes. Why: stale AI insights must never look current.
- All model citations (themes, PRDs, Q&A) go through `grounding.ts#verifyCitations`; doc claims require a verified doc-section quote, feedback claims a verified feedback quote. Why: one verifier the model cannot bypass.
- Prompt builders escape `<`/`>` in data; the verifier normalises them back. Why: delimiter safety without false citation rejections.
- PRDs are append-only revisions with a snapshot of the sources they were verified against. Why: traceability and no silent data loss.
- Evaluation lives in `src/lib/voc/eval/` + `scripts/eval.ts`; never claim metrics not recorded in `docs/EVALUATION_RESULTS.md`. Why: honest, reproducible results.
- Signed-in AI calls replace browser-sent sources with saved owner-scoped rows (`caller.server.ts` + `source-auth.ts`) before the model and verifier see them; every result carries provenance. Why: citations must trace to authoritative records.
- Human review scores live in `human-eval.ts`/`human_reviews`, tied to an exact PRD revision; summaries use completed reviews only and are never mixed with model metrics. Why: honest human evaluation.

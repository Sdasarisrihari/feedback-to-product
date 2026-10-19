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
- `src/lib/voc/store.tsx` is the single state boundary (browser storage for now); swap its internals for server functions when the backend lands. Why: pages don't change when persistence moves server-side.
- Any output not produced by a connected model must be labeled in the UI (MockNotice) and never presented as AI results. Why: roadmap forbids simulated AI and fabricated evidence.
- Evidence excerpts must be verbatim substrings of stored feedback with their source IDs; duplicates are flagged, never dropped. Why: traceability is the product's core promise.
- Feedback text is untrusted data; instruction-like text is flagged and must never be fed to a model as instructions. Why: prompt-injection risk.
- AI analysis runs only in `analyze.functions.ts` → `llm.server.ts` (server key, structured output); every model citation is re-verified by `groundLlmOutput` and failures are shown as rejected, never as evidence. Why: model output is a suggestion until checked against source records.
- AI results are tied to a signature of the analysed record set and hidden when feedback changes. Why: stale AI insights must never look current.

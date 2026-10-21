# Known limitations

- One-time browser import was not re-tested end to end (account already imported); needs a second, empty account.
- Knowledge Base "checked on the server" label not seen live — AI credits exhausted during the run. LLM evaluation metrics on the v2 dataset are pending for the same reason; v1 numbers are kept for reference only.
- Human evaluation: 0 completed reviews. Reviews must come from people; the agent did not fill them in.
- Last write wins per row across tabs/devices; no conflict UI. Row-level diff sync means concurrent edits to *different* rows do not overwrite each other, but two tabs editing the *same* record/PRD silently overwrite. Sign-out ends all sessions of the account.
- Sources > 4,000 characters are cut for PRDs and therefore refused as mismatched when signed in.
- Evaluation dataset is synthetic, small, and written by the builder (label bias); it is not independent or representative of real customers. The conflicting-documentation case is a fixture, not observed real docs.
- Scanned PDFs unsupported (clear warning shown). MCP: one read-only tool (`get_feedback_evidence`) is implemented at `/mcp` with OAuth; the full OAuth handshake was verified only up to the consent/401 boundary, not with an external MCP client. No n8n or task-tracker integration — see `docs/INTEGRATION_CONTRACTS.md`.
- Signed-out demo data lives in browser storage only; clearing site data erases it.

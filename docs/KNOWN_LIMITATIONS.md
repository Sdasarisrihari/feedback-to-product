# Known limitations

- One-time browser import was not re-tested end to end (account already imported); needs a second, empty account.
- Knowledge Base "checked on the server" label not seen live — AI credits exhausted during the run.
- Human evaluation: 0 completed reviews. Reviews must come from people; the agent did not fill them in.
- Last write wins per row across tabs/devices; no conflict UI. Sign-out ends all sessions of the account.
- Sources > 4,000 characters are cut for PRDs and therefore refused as mismatched when signed in.
- Evaluation dataset is synthetic and small. Scanned PDFs unsupported. No MCP, n8n or task-tracker integration.

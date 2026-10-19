# Known limitations

- **Signed-in end-to-end persistence is not yet verified in a browser.** No confirmed account exists; `scripts/e2e_persistence.py` is ready and has not been run. Unit tests cover mapping/diffing; database access rules were checked with simulated users in SQL.
- Demo (signed-out) AI results use browser-supplied sources — labelled as such.
- Last write wins per row across tabs/devices; no conflict UI.
- Sources longer than 4,000 characters are cut for PRDs and therefore refused as mismatched when signed in.
- Human evaluation: 0 completed reviews. Evaluation dataset is synthetic and small (80 feedback, 8 retrieval, 8 capability cases).
- Scanned (image-only) PDFs cannot be read. No MCP, n8n or task-tracker integration.

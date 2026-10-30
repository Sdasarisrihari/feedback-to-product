# Known limitations

- One-time browser import was not re-tested end to end (account already imported); needs a second, empty account.
- Knowledge Base "checked on the server" label was not seen in the older live run. Model access succeeded 2026-10-30 and the v2 runner completed; metrics and harness caveats are in EVALUATION_RESULTS.md. The historical HTTP 402 attempt remains recorded, not presented as the current access status.
- Human evaluation: 0 completed reviews. Reviews must come from people; the agent did not fill them in.
- Last write wins per row across tabs/devices; no conflict UI. Row-level diff sync means concurrent edits to *different* rows do not overwrite each other, but two tabs editing the *same* record/PRD silently overwrite. Sign-out ends all sessions of the account.
- Sources > 4,000 characters are cut for PRDs and therefore refused as mismatched when signed in.
- Evaluation dataset is synthetic, small, and written by the builder (label bias); it is not independent or representative of real customers. The conflicting-documentation case is a fixture, not observed real docs.
- Scanned PDFs unsupported (clear warning shown). MCP has three read-only tools; owner-run Inspector handshake and tool calls reported successful. Assistant-run production expiry/revocation and actual second-owner isolation remain unverified (only one populated owner). Controlled SDK tests do not establish those live results. New timeout/cancellation safeguards require republishing. No n8n or task-tracker integration.
- V2 evaluation runner currently combines development and held-out records, uses majority gold-label mapping, omits the conflicting-doc fixture from capability prompts, and has an unsupported SCIM expected label. Recorded metrics are real runner outputs, not a corrected or independent benchmark. Semantic evidence support and comprehensive injection resistance are not measured.
- Signed-out demo data lives in browser storage only; clearing site data erases it.

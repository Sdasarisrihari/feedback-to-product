# Feedback-to-Product AI

An AI-powered product discovery application that transforms customer feedback into actionable product insights and PRD drafts.

## Features

- **Feedback Analysis:** Import, search, and analyze customer feedback to identify recurring product themes.
- **Opportunity Prioritization:** Rank product opportunities based on frequency, severity, enterprise impact, confidence, and estimated effort.
- **AI-generated PRDs:** Generate product requirements, user stories, and acceptance criteria from feedback evidence.
- **Document Search:** Upload and search product documentation using BM25 retrieval.
- **Evidence Validation:** Validate source references and display accepted and rejected citations.
- **Human Review:** Review, edit, approve, or reject generated product requirements.
- **MCP Integration:** Implemented three read-only MCP tools:
  - `get_feedback_evidence` – Retrieve customer feedback evidence.
  - `search_product_docs` – Search product documentation.
  - `get_theme` – Retrieve product themes and supporting evidence.
- **Secure Access:** Integrated OAuth authorization and caller-scoped database access for MCP tools.

## Tech Stack

React, TypeScript, PostgreSQL, Lovable Cloud, LLM Integration, BM25 Retrieval, Model Context Protocol (MCP), OAuth, Vitest.

---
title: Implement Part 6 web app baseline
date: 2026-10-19
summary: Built the UI baseline and future SQL/API integration boundaries for the application developer work.
---

# Implement Part 6 web app baseline

## What happened
Implemented the Part 6 web-app shell with local CRUD, four report routes, CSV export, API contracts, and transaction integration placeholders.

## Decision
Use local integration mode until TV3?TV5 provide SQL Server schema/data, Stored Procedure contracts, and Trigger errors. Do not fabricate financial data or SQL outcomes.

## Validation
`npm run check` passed. A temporary static HTTP server returned 200 for `/` and `/assets/app.js`, then was stopped.

## Next steps
Configure `window.APP_CONFIG.apiBase`, replace local CRUD with the SQL-backed API, and verify each report against actual SQL Server totals.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

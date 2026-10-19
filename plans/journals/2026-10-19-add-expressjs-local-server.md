---
title: Add ExpressJS local server
date: 2026-10-19
summary: Added an ExpressJS API and local server persistence with a safe SQL Server integration boundary.
---

# Add ExpressJS local server

## What happened
Converted the local static app into an ExpressJS application server that serves the frontend and exposes same-origin /api endpoints.

## Decision
Use a server-owned local JSON store until TV3 supplies the verified SQL schema/data dictionary. SQL mode validates connectivity but intentionally blocks data access until a safe mapping, Stored Procedures, and Trigger errors are handed over.

## Validation
`npm run check` passed. HTTP health, create, update, delete, report-contract, and static-page checks passed. Test data and the test server were removed after verification. `npm audit --omit=dev` reported zero vulnerabilities after upgrading mssql to 12.7.10.

## Environment
mssql 12.7.10 requires Node.js 22 or newer through its SQL driver dependency. package.json and README now declare that requirement.

## Next steps
Upgrade the local Node runtime to 22 LTS, then add the final SQL mapping and transaction implementations once TV3?TV5 provide their contracts.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

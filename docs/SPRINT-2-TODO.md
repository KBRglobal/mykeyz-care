# Sprint 2 — Onboarding Persistence (real server-side onboarding)

Goal: provider onboarding is durable. Trades, service areas, language, business profile, and
trade license number persist server-side via granular endpoints and survive an app restart. The
trade license file is uploaded and recorded as a `supplier_documents` row. Suppliers support
MULTIPLE trades and MULTIPLE service areas. A `verification_status` state machine moves the
supplier `draft -> submitted`, and `is_onboarded` is set server-side.

Decisions (locked):
- Onboarding ends in `verification_status='submitted'`, NOT approved. Admin approval
  (`submitted -> approved/rejected`) is Sprint 3.
- Suppliers have MANY trades (`supplier_trades`) and MANY service areas
  (`supplier_service_areas`) — the single `trade` column is no longer the source of truth.
- Trade license file upload is recorded as a `supplier_documents` row (presigned R2 upload).
- Bank/payout details are intentionally NOT collected. The provider is paid by the customer and
  pays the platform a commission via Apple/Google IAP (Sprint 9). No bank account to capture.

## Phase A — Backend contract spine (sequential, me) — repo: mykeyz-care-api

- [x] A1 db.ts — add tables `supplier_trades`, `supplier_service_areas`, `supplier_documents` (idempotent additive DDL)
- [x] A2 db.ts — add `verification_status` (`draft`/`submitted`) + keep `is_onboarded` on supplier; backfill defaults
- [x] A3 db.ts — `setSupplierTrades(supplierId, trades[])` / `setSupplierServiceAreas(supplierId, areas[])` (replace-set semantics)
- [x] A4 db.ts — `setSupplierBusinessProfile(...)` (business name, trade license number, language)
- [x] A5 db.ts — `addSupplierDocument(...)` / `getSupplierDocuments(supplierId)` for the trade license file
- [x] A6 db.ts — `submitOnboarding(supplierId)` → set `is_onboarded=true`, `verification_status='submitted'`
- [x] A7 index.ts — granular onboarding endpoints (trades, service areas, profile/license number, document register, submit)
- [x] A8 index.ts — `GET /supplier/me` returns trades[], serviceAreas[], documents[], verification_status, is_onboarded
- [x] A9 `npm run typecheck` green on backend

## Phase B — Workflow fan-out against frozen contract

- [ ] B1 (agent) mobile: wire onboarding screens to granular endpoints; rehydrate trades/areas/profile/license from `GET /supplier/me` on boot — repo: mykeyz-care
- [ ] B2 (agent) live E2E test script (set trades -> set areas -> set profile -> upload+register license -> submit -> me; restart re-reads server state) — repo: mykeyz-care-api
- [ ] B3 (agent) docs: confirm 00-REALITY-AUDIT delta + this TODO acceptance notes
- [ ] B4 (Opus verify) adversarially check each piece against live API

## Phase C — Verify + ship

- [ ] C1 live E2E green against local API + Postgres
- [ ] C2 commit + push backend (mykeyz-care-api)
- [ ] C3 commit + push mobile (mykeyz-care)
- [ ] C4 report: onboarding survives restart; ends submitted not approved; admin approval flagged for Sprint 3

## Acceptance

- Onboarding (trades, service areas, language, business profile, trade license number) survives an
  app restart and rehydrates from the backend.
- The trade license file becomes a `supplier_documents` row.
- A supplier can hold MULTIPLE trades (`supplier_trades`) and MULTIPLE service areas
  (`supplier_service_areas`); the single `trade` column is no longer authoritative.
- Onboarding ends in `verification_status='submitted'`, NOT approved. `is_onboarded` is set
  server-side.
- No bank/payout details are collected anywhere in onboarding.

# Sprint 1 — Replace Demo Identity (real auth/session)

Goal: a fresh install creates a UNIQUE real supplier, session survives app restart via refresh
token, and production cannot use fixed OTP codes. No `supplier-demo` in the core auth path.

Decisions (locked):
- OTP delivery provider is not wired yet (Sprint 7). We implement hashed+expiring OTP storage,
  rate limiting, and real verification. Fixed dev codes only when `ALLOW_DEV_OTP=true` (default false).
  In non-production the generated code is returned/logged so testers can proceed.
- Mobile session stored with `expo-secure-store` (requires a new native build to reach TestFlight).
- Demo seed data gated behind `SEED_DEMO_DATA=true` (default false).

## Phase A — Backend contract spine (sequential, me) — repo: mykeyz-care-api

- [x] A1 config.ts — add `allowDevOtp`, `seedDemoData`, `refreshTtlDays`, `otpTtlSeconds`, `otpRateMax`
- [x] A2 db.ts — add tables `supplier_users`, `otp_attempts`, `sessions` (idempotent additive DDL)
- [x] A3 db.ts — gate `seedDatabase()` behind `config.seedDemoData`; demo supplier stays demo-only
- [x] A4 db.ts — `createOtp` / `getActiveOtp` / `incrementOtpAttempt` / `markOtpVerified` / `countRecentOtps`
- [x] A5 db.ts — `findOrCreateSupplierByPhone(phone, language)` → unique supplier id + supplier_user (no demo)
- [x] A6 db.ts — `createSession` / `getValidSessionByRefreshHash` / `revokeSession`
- [x] A7 auth.ts — `signSupplierToken(supplierId, supplierUserId)`, `newRefreshToken()`, `hashToken()`; remove `supplier-demo` fallback in `authRequired` (strict 401)
- [x] A8 index.ts — rewrite `request-otp` (generate+hash+store+rate-limit), `verify-otp` (verify hash/expiry/attempts → real identity → session)
- [x] A9 index.ts — add `POST /auth/refresh`, `POST /auth/logout`
- [x] A10 remove `upsertSupplierPhone` demo writer from core path
- [x] A11 `npm run typecheck` green on backend

## Phase B — Workflow fan-out against frozen contract

- [x] B1 (agent) mobile: secure token+refresh storage, boot-restore, 401 auto-refresh, real verifyOtp, logout wiring — repo: mykeyz-care
- [x] B2 (agent) live E2E test script (request-otp → verify → me → restart/refresh → logout) — repo: mykeyz-care-api
- [x] B3 (agent) docs: update 00-REALITY-AUDIT delta + this TODO acceptance notes
- [x] B4 (Opus verify) adversarially check each piece against live API

## Phase C — Verify + ship

- [ ] C1 live E2E green against local API + Postgres
- [ ] C2 commit + push backend (mykeyz-care-api)
- [ ] C3 commit + push mobile (mykeyz-care)
- [ ] C4 report: rebuild needed for secure-store; OTP delivery gap flagged

## Acceptance

- Fresh phone → unique supplier id (not supplier-demo), is_verified=false, is_onboarded=false.
- App restart restores session (refresh token), no re-login.
- `ALLOW_DEV_OTP` unset → fixed codes 123456/000000 rejected.
- Every auth path has strict token checks (no demo fallback).

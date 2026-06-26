# Sprint 3 — Admin Verification V1 (Control Panel)

Goal: the operator's secure browser Control Panel (בקרת שליטה) opens with the verification slice —
see suppliers waiting, view their license/details, Approve / Reject / Request changes (reason
required for the last two), every decision audited. The supplier app reflects the outcome.

Locked: admin auth via ADMIN_PASSWORD -> admin JWT (role 'admin'); minimal decision is MANUAL
(operator decides); leakage/anti-disintermediation detector is a SEPARATE track parked for Sprint 7
(chat). Out of scope: jobs/quotes/earnings/chat admin views (later sprints / Milestone 10).

## Phase A — Backend admin spine (sequential, me) — repo: mykeyz-care-api

- [x] A1 config.ts — adminPassword (ADMIN_PASSWORD), adminEmail (ADMIN_EMAIL default), adminLoginRateMax
- [x] A2 db.ts — tables admin_users, audit_logs (jsonb payload); seed one admin from ADMIN_EMAIL (idempotent)
- [x] A3 db.ts — listSuppliersForAdmin({status?,search?,limit,offset}), getSupplierAdminDetail(id)
- [x] A4 db.ts — decideVerification(id,{decision,reason,adminId}) txn: status + verification_reviews + audit_logs
- [x] A5 db.ts — listAuditLogs({entityId?,limit})
- [x] A6 auth.ts — signAdminToken(adminId), adminRequired middleware (role==='admin')
- [x] A7 index.ts — admin router /api/v1/admin: login (rate-limited, constant-time), suppliers list/detail, approve/reject/request-changes, audit-logs
- [x] A8 index.ts — serve /admin page with X-Robots-Tag noindex + no-store
- [x] A9 typecheck green + live smoke (login -> list submitted -> approve -> supplier approved)

## Phase B — Workflow fan-out

- [ ] B1 (agent) secure + clean + advanced admin web app at /admin (login, queue, detail, decisions, audit)
- [ ] B2 (agent) mobile: verification status banner + reason + resubmit on needs_changes
- [ ] B3 (agent) scripts/e2e-admin.mjs (npm run e2e:admin)
- [ ] B4 (agent) docs: 00-REALITY-AUDIT delta
- [ ] B5 (Opus verify) typechecks + reason-required + audit-on-decision + gating + mobile reflects status

## Phase C — Verify + ship

- [ ] C1 local PG + API; all three E2E (auth, onboarding, admin) green; manual /admin approve
- [ ] C2 commit + push both repos
- [ ] C3 set ADMIN_PASSWORD + ADMIN_EMAIL on Railway (save to creds); /admin live + gated

## Acceptance

- Admin approves a provider with no DB edit; reject/request-changes require a reason.
- Every decision writes verification_reviews + audit_logs.
- Admin endpoints 401 without a valid admin token.
- Supplier app shows the new status (verified badge / needs-changes reason + resubmit).

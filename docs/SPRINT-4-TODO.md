# Sprint 4 — Real Job Matching

Goal: a verified provider sees ONLY the jobs matched to their trades + service areas (not a static
mock list), can open a job to read its real inspection findings, and can quote ONLY when their
verification is `approved`. Jobs are real rows (created in the Control Panel, source='admin'), each
carrying inspection findings; matching is materialised in `job_matches` and recomputed when a
supplier is approved. Out of scope (Sprint 5): quote lifecycle (shortlist/won/lost), the
inspection→job bridge from the main MyKeyz app, availability calendar.

## Phase A — Backend matching spine (sequential, me) — repo: mykeyz-care-api

- [x] A1 data.ts — Job (+source, quote_deadline, updated_at, status 'expired'); JobFinding; JobMatch types
- [x] A2 db.ts — jobs migration (source, quote_deadline, updated_at; expand status check); job_findings + job_matches tables
- [x] A3 db.ts — createJobWithFindings(); getJobFindings(); listAdminJobs()
- [x] A4 db.ts — computeMatchesForJob(jobId); recomputeMatchesForSupplier(supplierId); expireOverdueJobs()
- [x] A5 db.ts — listMatchedJobs(supplierId) (visible matches, open, not expired, ranked); isJobMatched()
- [x] A6 db.ts — decideVerification: on approve, recompute matches for the supplier
- [x] A7 index.ts — GET /jobs → matched-only; GET /jobs/:id → real findings + match gate; POST quote → approved+matched+open gates
- [x] A8 index.ts — admin: POST /admin/jobs (create+findings→match), GET /admin/jobs
- [x] A9 typecheck green + live smoke (create job → approve supplier → matched → quote; unverified → 403)

## Phase B — Workflow fan-out (against frozen contract)

- [ ] B1 (agent) mobile: matched-only feed from API (drop mock jobs), empty state, real findings on detail
- [ ] B2 (agent) mobile: quote gate — block Send Quote unless verification approved; handle 403
- [ ] B3 (agent) scripts/e2e-matching.mjs (npm run e2e:matching)
- [ ] B4 (agent) Control Panel admin.html: Jobs tab (create job + findings, list jobs)
- [ ] B5 (agent) docs: 00-REALITY-AUDIT delta
- [ ] B6 (Opus verify) typechecks + matched-only + unverified-cannot-quote + findings real + audit

## Phase C — Verify + ship

- [ ] C1 local PG + API; all E2E (auth, onboarding, admin, matching) green; manual create+match+quote
- [ ] C2 commit + push both repos

## Acceptance

- A verified provider sees only jobs matching their trades + areas; an unverified provider sees none.
- A provider cannot submit a quote unless verification_status === 'approved' (403 otherwise).
- Job detail shows the job's real inspection findings (no hardcoded insight).
- Creating a job in the Control Panel materialises matches; approving a supplier matches them to open jobs.

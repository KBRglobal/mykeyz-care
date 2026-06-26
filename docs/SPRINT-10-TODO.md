# Sprint 10 — Production Hardening

Goal: make MyKeyz Care observable, recoverable, and safely releasable. Every core flow (auth, onboarding,
verification decisions, matching, quoting, reveal, completion) emits a structured server log line and an
analytics event; every sensitive route is rate-limited; the nightly database dump is verified by an
automated check; both repos report crashes/errors to a hosted error tracker; one command runs every E2E
suite as a consolidated smoke test; and the release can be repeated end-to-end from the docs alone. The
iron rule governs the whole sprint: no secret is ever printed to a log/console/screenshot or committed to
git — the structured logger redacts, the analytics/error clients are no-ops without their keys, and keys
live only in Railway / EAS env, never in code or docs.

Out of scope (later sprints): the Sprint 7 chat + anti-disintermediation/leakage detector; any new
product surface; APM/distributed tracing; uptime alerting/pager integration (we wire the event + error
streams, not paging); auto-restoring a backup (we only verify the dump is present, fresh, non-empty, and
restorable in a scratch DB — we do not promote it). Business model is untouched: no payout flow, no IBAN,
provider pays only via Apple/Google IAP; winning-quote selection stays in the owner Control Panel.

## Phase A — Backend observability spine (sequential, me) — repo: mykeyz-care-api

- [ ] A1 package.json — add deps `pino`, `pino-http`, `posthog-node`, `@sentry/node`; add scripts `e2e:hardening` → `node scripts/e2e-hardening.mjs`, `e2e:all` → `node scripts/e2e-all.mjs`, `verify:backup` → `node scripts/verify-backup.mjs`
- [ ] A2 config.ts — add `logLevel: process.env.LOG_LEVEL ?? "info"`, `sentryDsn: process.env.SENTRY_DSN`, `posthog: { key: process.env.POSTHOG_KEY, host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com" }`, `serviceVersion: process.env.RAILWAY_GIT_COMMIT_SHA ?? "dev"`, and generic limiter knobs `sensitiveRateMax: Number(process.env.SENSITIVE_RATE_MAX ?? 20)`, `sensitiveRateWindowSeconds: Number(process.env.SENSITIVE_RATE_WINDOW_SECONDS ?? 60)` (keep all values as `process.env.*` — never inline a real secret)
- [ ] A3 src/logger.ts (new) — export a `pino` logger built from `config.logLevel` with `redact` covering `req.headers.authorization`, `req.headers.cookie`, `password`, `code`, `dev_code`, `refresh_token`, `token`, `hashed_code`, `*.secretAccessKey`, `JWT_SECRET`; export `httpLogger` (pino-http) that attaches a per-request id, logs method/path/status/duration, and never logs the request body
- [ ] A4 src/analytics.ts (new) — export `track(event, distinctId, properties)` and `flushAnalytics()` using `posthog-node`; lazy-init a singleton only when `config.posthog.key` is set, otherwise a no-op; whitelist event names mirroring mobile (`otp_requested`, `otp_verified`, `verification_submitted`, `verification_decided`, `job_created`, `job_matched`, `quote_sent`, `price_revealed`, `job_completed`) and strip any property key matching the redaction list before send
- [ ] A5 src/ratelimit.ts (new) — generalize the existing in-memory `adminLoginRateLimited` map pattern (index.ts:449-461) into `rateLimit({ max, windowSeconds, keyFn })` Express middleware returning `429 { error: "rate_limited" }`; keyed by `req.ip` by default
- [ ] A6 index.ts — `app.use(httpLogger)` immediately after `app.use(helmet())`; replace the raw `console.error` in the final error handler (index.ts:613-616) with `logger.error` + `Sentry.captureException`; replace the `console.log` startup/listen + whatsapp lines with `logger.info`
- [ ] A7 index.ts — initialize Sentry at top of bootstrap: `Sentry.init({ dsn: config.sentryDsn, release: config.serviceVersion, environment: config.nodeEnv })` guarded so it is a no-op when `sentryDsn` is unset; add `Sentry.expressErrorHandler()` (or manual capture in A6) before the JSON error handler
- [ ] A8 index.ts — apply `rateLimit` middleware to the sensitive routes beyond the two already covered: `/auth/verify-otp`, `/upload/presign`, `/jobs/:id/quotes`, `/jobs/:id/reveals` (keep the existing OTP-request counter at index.ts:99-100 and `adminLoginRateLimited` at the admin `/login`, or refactor both to call `rateLimit` for one limiter)
- [ ] A9 index.ts — emit analytics `track(...)` at: OTP requested (auth/request-otp), OTP verified (auth/verify-otp), verification submitted (verification-submit), verification decided (admin approve/reject/request-changes), job created (admin/jobs), quote sent (jobs/:id/quotes), price revealed (jobs/:id/reveals), job completed (jobs/:id/complete) — distinctId = supplierId or "admin", never include phone/code/token in properties
- [ ] A10 src/db.ts — export `latestBackupStatus()` returning the newest nightly dump's filename, size, age-in-hours, and a restorable-into-scratch-DB boolean (reads the dump location/manifest produced by the existing GHA nightly→R2 backup; no schema change)
- [ ] A11 scripts/verify-backup.mjs (new) — exit non-zero if the newest dump is missing, older than 26h, zero-length, or fails a restore into a throwaay `pg_restore --list` check; print a redacted summary only (no connection string, no R2 keys); usable by `npm run verify:backup` locally and by a GHA step
- [ ] A12 scripts/e2e-all.mjs (new) — consolidated smoke runner: spawn `e2e-auth`, `e2e-onboarding`, `e2e-admin`, `e2e-matching`, `e2e-hardening` in order against the same live API, aggregate pass/fail counts, exit non-zero if any suite fails; print a one-line-per-suite summary
- [ ] A13 typecheck green (`npm run typecheck`) + live smoke: boot local API, hit `/health`, request+verify OTP, confirm a structured JSON log line appears with `req.id` and NO phone/code/token, trip a rate limit (6th `/auth/verify-otp` → 429), confirm analytics+Sentry stay silent no-ops with no keys set, run `node scripts/verify-backup.mjs` against a seeded dump

## Phase B — Workflow fan-out (against the frozen contract)

- [ ] B1 (agent) mobile: add `@sentry/react-native`; initialize in app/_layout.tsx guarded by `process.env.EXPO_PUBLIC_SENTRY_DSN` (no-op when unset); wrap the exported `ErrorBoundary` / root so render crashes report; never log tokens
- [ ] B2 (agent) mobile: harden src/integrations/analytics.ts — reuse a single PostHog client instance (don't `new PostHog` per event), add `identify(supplierId)` on login and `reset()` on logout, extend the `AnalyticsEvent` union to match the server whitelist, and call `trackEvent` at the same core flows on the client (login, onboarding_completed, verification_submitted, quote_sent, quote_blocked, price_revealed, job_completed)
- [ ] B3 (agent) scripts/e2e-hardening.mjs (npm run e2e:hardening): asserts health is green; sensitive routes return 429 after the configured threshold; `/health` and error responses leak no secret; an unset-key run keeps analytics/Sentry as no-ops (process does not crash); a structured log line for a request exposes `req.id`+status and contains no phone/code/token
- [ ] B4 (agent) Control Panel public/admin.html: add a small "System" footer/badge showing API `/health` ok-state, `serviceVersion`, and the latest backup age from a new read-only `GET /api/v1/admin/system/health` (returns health + `latestBackupStatus()`); display only, no secrets
- [ ] B5 (agent) docs: extend 09-RELEASE-AND-TESTFLIGHT.md + TESTFLIGHT-RUNBOOK.md with a repeatable release checklist that references `npm run e2e:all`, `npm run verify:backup`, the env-var inventory (names only, values redacted), Sentry/PostHog enablement, and rollback; add a new docs/MONITORING.md (events + log fields + error-tracker + backup-verify); add the 00-REALITY-AUDIT delta
- [ ] B6 (Opus verify) adversarial: grep both repos + all docs for any committed secret/DSN/key/connection-string (must be zero); confirm logger redaction actually hides authorization/refresh/code in a real log capture; confirm every sensitive route is rate-limited and returns 429; confirm each core flow fires exactly one server event with no PII; confirm Sentry+PostHog are true no-ops without keys; confirm `verify:backup` fails loudly on a stale/empty dump; confirm the release checklist is executable start-to-finish by a fresh dev

## Phase C — Verify + ship

- [ ] C1 local PG (docker postgres:16 on 55432, `DATABASE_URL=postgresql://postgres:care@localhost:55432/care`) + API (`ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=smoke-pass-123`, `npm run dev` on :4000); run every suite green — auth (26), onboarding (38), admin (45), matching (65), hardening — via `npm run e2e:all`; run `npm run verify:backup`; mobile + api `npm run typecheck` green
- [ ] C2 commit + push both repos (mykeyz-care-api + mykeyz-care); confirm no secret in the diff before pushing

## Acceptance

- Core flows have monitoring: each of OTP, verification submit/decide, job create/match, quote, reveal, and completion emits a structured server log line (with request id) and a hosted analytics event; the mobile app reports the same core events and sends crashes to the error tracker.
- Every sensitive route (admin login, OTP request + verify, upload presign, quote, reveal) is rate-limited and returns `429 rate_limited` past its threshold.
- The nightly DB dump is verified automatically: `npm run verify:backup` passes on a fresh dump and fails loudly when the dump is missing, stale (>26h), empty, or not restorable.
- `npm run e2e:all` runs every suite (auth + onboarding + admin + matching + hardening) as one consolidated smoke and exits non-zero if any fails.
- The release can be repeated end-to-end from 09-RELEASE-AND-TESTFLIGHT.md + TESTFLIGHT-RUNBOOK.md + MONITORING.md by a developer with no prior context.
- No secret is printed or committed: logs are redacted, analytics/error clients are no-ops without keys, and a repo + docs grep for keys/DSNs/connection-strings returns nothing.

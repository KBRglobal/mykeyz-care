# MONITORING

This document is the production observability contract for MyKeyz Care (Sprint 10). It describes what the system emits, where, and how to read it: analytics events, structured logs, error tracking, backup verification, and rate limiting. It is the companion to `09-RELEASE-AND-TESTFLIGHT.md` (how to release) and `TESTFLIGHT-RUNBOOK.md` (iOS build/submit).

Iron rule for everything below: no secret is ever printed to a log, console, screenshot, or committed to git. The logger redacts; the analytics and error clients are no-ops without their keys; keys live only in Railway / EAS env. No event property, log field, or backup summary ever carries a phone number, OTP code, token, or connection string.

## 1. Analytics events (server)

Source: `src/analytics.ts` exports `track(event, distinctId, properties)` and `flushAnalytics()`. It is a no-op singleton unless `POSTHOG_KEY` is set (host defaults to `POSTHOG_HOST` / `https://us.i.posthog.com`). Only whitelisted event names are sent, and every property key matching the redaction list is stripped before send.

Events emitted and where (in `index.ts`):

| Event | Fired at | Route |
|---|---|---|
| `otp_requested` | OTP requested | `POST /api/v1/auth/request-otp` |
| `otp_verified` | OTP verified | `POST /api/v1/auth/verify-otp` |
| `verification_submitted` | Supplier submits verification | verification-submit |
| `verification_decided` | Admin approve / reject / request-changes | admin verification decision |
| `job_created` | Admin creates a job | `POST /api/v1/admin/jobs` |
| `quote_sent` | Supplier sends a quote | `POST /api/v1/jobs/:id/quotes` |
| `price_revealed` | Supplier spends a reveal | `POST /api/v1/jobs/:id/reveals` |
| `job_completed` | Winner completes the job | `POST /api/v1/jobs/:id/complete` |

`distinctId` rules:

- The acting supplier's id (`supplierId`) for supplier-driven events.
- The literal string `"admin"` for admin-driven events (verification decided, job created).

No-PII rule:

- Properties NEVER include phone, OTP code, `dev_code`, token, refresh token, or any redacted key — the client strips them before send.
- Only non-identifying, business-relevant fields are allowed (e.g. job id, amount, plan tier, decision outcome).
- The mobile app emits a mirroring set of core events from `src/integrations/analytics.ts` (login, onboarding_completed, verification_submitted, quote_sent, quote_blocked, price_revealed, job_completed), using a single shared PostHog client, `identify(supplierId)` on login and `reset()` on logout. Mobile analytics is gated on `EXPO_PUBLIC_POSTHOG_KEY`.

## 2. Structured logs (server)

Source: `src/logger.ts` exports a `pino` `logger` (level from `LOG_LEVEL`, default `info`) and `httpLogger` (`pino-http`) mounted immediately after `helmet()`. `httpLogger` attaches a per-request UUID as `req.id` and logs one line per request. It NEVER logs the request body.

Fields on a request log line:

- `service` — `mykeyz-care-api`
- `version` — `serviceVersion` (the Railway git commit SHA, or `dev` locally)
- `req.id` — per-request UUID for correlation
- `method` — HTTP method
- `url` — request path
- `statusCode` — response status
- `responseTime` — request duration in ms

Redaction list (these keys are never emitted, anywhere in a log):

- `req.headers.authorization`
- `req.headers.cookie`
- `password`
- `code`
- `dev_code`
- `refresh_token`
- `token`
- `hashed_code`
- `signed_transaction`
- `purchase_token`
- `*.secretAccessKey`
- `JWT_SECRET`

How to read: each request produces a JSON line carrying `req.id` + `statusCode` + `responseTime`. To trace a single request, grep the logs for its `req.id`. A correct log line for an OTP request shows the path and status but NO phone, NO code, NO token.

## 3. Error tracking (Sentry)

Server (`src/index.ts`):

- `Sentry.init({ dsn: config.sentryDsn, release: serviceVersion, environment: nodeEnv })` runs at bootstrap, guarded so it is a no-op when `SENTRY_DSN` is unset.
- The final JSON error handler calls `logger.error` and `Sentry.captureException` — no raw `console.error`, no body leak.

Mobile (`app/_layout.tsx`):

- `@sentry/react-native` is initialized guarded by `EXPO_PUBLIC_SENTRY_DSN` (no-op when unset). The root / `ErrorBoundary` is wrapped so render crashes report. Tokens are never logged.

Both are silent no-ops with no DSN set: no init, no network, no crash. Enable by setting the DSN env (Railway `SENTRY_DSN`, EAS `EXPO_PUBLIC_SENTRY_DSN`).

## 4. Backup verification

Source: `scripts/verify-backup.mjs`, run via `npm run verify:backup` (locally and in the GHA nightly step). It inspects the newest dump in `BACKUP_DIR` (default `./backups`) and exits NON-ZERO — failing loudly — if the dump is:

- missing (no dump found), or
- stale (older than 26 hours — the freshness rule, since the dump runs nightly), or
- empty (zero-length), or
- not restorable (fails a throwaway `pg_restore --list` / scratch-DB restore check).

It prints a REDACTED summary only — never a connection string, never R2 keys.

Control Panel badge: the read-only endpoint `GET /api/v1/admin/system/health` (admin Bearer token required) surfaces the same status via `latestBackupStatus()` so operators see it in the admin System badge without shell access. Live shape:

```json
{
  "ok": true,
  "service": "mykeyz-care-api",
  "version": "<serviceVersion>",
  "environment": "development",
  "storage": "postgres",
  "backup": {
    "present": true,
    "filename": "...",
    "size_bytes": 0,
    "age_hours": 0,
    "fresh": true,
    "restorable": true
  },
  "time": "<ISO>"
}
```

The Control Panel footer/badge (`public/admin.html`) shows API ok-state, `serviceVersion`, and the latest backup age. Display only — no secrets.

Rollback note: this check only VERIFIES the dump (present, fresh, non-empty, restorable). It does not auto-promote a backup. A database rollback (restore from the verified dump) is a deliberate last-resort step — see `09-RELEASE-AND-TESTFLIGHT.md` (Step 7 — Rollback).

## 5. Rate limiting

Source: `src/ratelimit.ts` exports `rateLimit({ max, windowSeconds, keyFn })`, an Express middleware keyed by `req.ip` by default. Over the threshold it returns `429 { error: "rate_limited" }`.

Threshold env:

- `SENSITIVE_RATE_MAX` (`config.sensitiveRateMax`, default 100) — max requests per window.
- `SENSITIVE_RATE_WINDOW_SECONDS` (`config.sensitiveRateWindowSeconds`, default 60) — window length.

Routes protected:

- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/upload/presign`
- `POST /api/v1/jobs/:id/quotes`
- `POST /api/v1/jobs/:id/reveals`

(The admin `/login` and `/auth/request-otp` have their own counters.)

Operational note: the limiter is keyed by IP and is process-global across these routes. From a single IP, the Nth+1 sensitive call ACROSS ALL of those routes combined trips `429` — the budget is shared, not per-route. Expect this when load-testing or when many requests share one egress IP; it is not a bug.

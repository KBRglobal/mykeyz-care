# 09 - Release And TestFlight

This document extends `TESTFLIGHT-RUNBOOK.md`. Use that runbook for exact commands.

## Release Types

Native iOS build:

- Required when native config, dependencies, build number, permissions, or App Store/TestFlight binary changes.
- Use EAS build and submit.

OTA update:

- Use only for JS/assets changes that do not require a native rebuild.
- Follow project OTA policy before publishing.

Backend deploy:

- Required for API/database changes.
- Must be coordinated with mobile compatibility.

## Pre-Release Rules

- Do not release with secrets in code, docs, logs, or screenshots.
- Do not release with production pointing to hardcoded demo identity.
- Do not release if typecheck fails.
- Do not reuse Apple build number.
- Do not submit a new iOS binary without confirming App Store Connect state.

## TestFlight External Tester Rules

External testers require:

- uploaded valid build
- build added to external beta group
- tester added to external beta group
- beta app localization
- beta build localization
- beta app review details
- beta license agreement
- Beta App Review approval

Known current state:

- Build `2` is valid.
- External build state is waiting for beta review.
- `mzgdubai@gmail.com` is in the external group but remains not invited until Apple allows external testing.

## Release Verification

Mobile:

- install fresh
- login
- onboarding
- jobs
- quote
- reveal
- chat
- earnings
- settings

API:

- health endpoint
- auth request/verify
- supplier profile
- jobs
- quotes
- reveals
- conversations/messages
- earnings
- upload presign

Admin:

- supplier queue
- verification decision
- job inspection
- quote inspection
- audit log

## Rollback

Mobile:

- If native build is bad before external approval, submit a fixed higher build number.
- If OTA is bad, publish rollback update to prior known-good bundle.

Backend:

- Revert deploy only if database compatibility allows it.
- Prefer forward fix if migrations are already applied.

Database:

- Migrations must have explicit rollback notes where possible.
- Never manually edit production data without an audit record.

## Release Acceptance

A release is accepted when:

- app build or OTA is visible to target testers
- API health is green
- core smoke test passes
- no critical logs/errors appear after launch
- git is clean and pushed
- release notes include build/update IDs

---

## Repeatable Release Checklist (Sprint 10)

This section is the start-to-finish runbook for shipping a release. A developer with no prior context can execute it top to bottom. Run the backend gate first, then the mobile gate, then deploy, then verify, then watch monitoring. For the exact iOS build/submit commands, follow `TESTFLIGHT-RUNBOOK.md`; for what to watch after launch, follow `MONITORING.md`.

Repos:

- Backend API: `/Users/claude/Documents/mykeyz-care-api`
- Mobile app: `/Users/claude/Documents/mykeyz-care`

### Step 0 — Iron rule (read every release)

- No secret is ever printed to a log, console, screenshot, or committed to git.
- Every key lives only in Railway (backend) or EAS (mobile) env. Values are never in code, never in docs, never in a commit.
- Before pushing, grep the diff for keys/DSNs/connection-strings. The diff must contain zero secret values.

### Step 1 — Backend pre-release gate (repo: mykeyz-care-api)

Run from `/Users/claude/Documents/mykeyz-care-api`.

1. Typecheck must be green:

   ```bash
   npm run typecheck
   ```

2. Consolidated E2E smoke must pass. This runs every suite in order (auth, onboarding, admin, matching, hardening) against one live local API and exits non-zero if any suite fails:

   ```bash
   npm run e2e:all
   ```

   IMPORTANT: the fixed-phone suites need a FRESH local Postgres. Stale rows from a previous run collide with the fixed test phone numbers and cause false failures. Start a clean database before running. Reference local setup (see SPRINT-10-TODO Phase C1):

   ```bash
   docker run --rm -d --name care-pg -p 55432:5432 -e POSTGRES_PASSWORD=care -e POSTGRES_DB=care postgres:16
   # in the API repo, point at it and boot with dev OTP + demo seed:
   DATABASE_URL=postgresql://postgres:care@localhost:55432/care \
   ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=<local-only-not-a-secret> \
   npm run dev
   # then in a second shell, against the same DATABASE_URL:
   npm run e2e:all
   ```

   Expected suite sizes for a sanity check: auth 26, onboarding 38, admin 45, matching 65, plus hardening. Any non-zero exit blocks the release.

3. Backup verification must pass (newest dump present, fresh, non-empty, restorable):

   ```bash
   npm run verify:backup
   ```

   A non-zero exit blocks the release. See `MONITORING.md` for what this checks and the 26h freshness rule.

### Step 2 — Mobile pre-release gate (repo: mykeyz-care)

Run from `/Users/claude/Documents/mykeyz-care`.

1. Typecheck must be green:

   ```bash
   npx tsc --noEmit
   ```

2. Build and submit per the runbook — do NOT improvise iOS commands here. Follow `TESTFLIGHT-RUNBOOK.md` in order: Local Preflight (bump `expo.ios.buildNumber` + `expo.android.versionCode`, commit, push), Build (`eas build --platform ios --profile testflight`), Submit (`eas submit --platform ios --id <EAS_BUILD_ID>`), then the External TestFlight Checklist.

3. JS/asset-only change with no native delta: ship via OTA instead of a full build, per project OTA policy. A native config / dependency / permission / build-number change always requires a full EAS build.

### Step 3 — Environment variable inventory (names only — values are redacted)

The values live ONLY in Railway (backend) and EAS (mobile) secrets, never in git, never in this doc. This is the NAME inventory a fresh dev confirms is set per environment. Never print a real value.

Backend on Railway:

- `DATABASE_URL` — Postgres connection (Railway-managed).
- `JWT_SECRET` — token signing secret.
- `ADMIN_PASSWORD` — Control Panel login password. LAUNCH GATE: must be set in prod or `/admin` cannot be used.
- `ADMIN_EMAIL` — admin account email. LAUNCH GATE: must be set in prod for `/admin`.
- `ALLOW_DEV_OTP` — must be `false` in production (true only locally; exposes `dev_code`).
- `SEED_DEMO_DATA` — must be `false` in production.
- `SENTRY_DSN` — error tracking. Server error reporting is a no-op until this is set.
- `POSTHOG_KEY` — analytics. Server analytics is a no-op until this is set.
- `POSTHOG_HOST` — analytics host (defaults to `https://us.i.posthog.com`).
- `SENSITIVE_RATE_MAX` — rate-limit threshold for sensitive routes (default 100).
- `SENSITIVE_RATE_WINDOW_SECONDS` — rate-limit window in seconds (default 60).
- `BACKUP_DIR` — directory the nightly dump lands in (default `./backups`); read by `verify:backup`.
- `R2_*` — Cloudflare R2 storage credentials (account, access key, secret, bucket).
- `WHATSAPP_*` — WhatsApp Business API tokens (no-op safe when unset).
- `APPLE_IAP_*` — Apple In-App Purchase / App Store Server config.
- `GOOGLE_PLAY_*` — Google Play billing / service-account config.

Mobile on EAS:

- `EXPO_PUBLIC_POSTHOG_KEY` — analytics. Mobile analytics is a no-op until this is set.
- `EXPO_PUBLIC_POSTHOG_HOST` — analytics host.
- `EXPO_PUBLIC_SENTRY_DSN` — error tracking. Mobile crash reporting is a no-op until this is set.
- `EXPO_PUBLIC_API_BASE_URL` — API base URL the app talks to.

### Step 4 — Enable monitoring (Sentry + PostHog)

Both error tracking and analytics are GUARDED no-ops until their key/DSN is set. No key set = silent, no crash, no traffic.

- Turn on server error tracking: set `SENTRY_DSN` on Railway. Until then `Sentry.init` is a no-op and the error handler only logs.
- Turn on server analytics: set `POSTHOG_KEY` (and optionally `POSTHOG_HOST`) on Railway. Until then `track(...)` is a no-op.
- Turn on mobile crash reporting: set `EXPO_PUBLIC_SENTRY_DSN` in EAS.
- Turn on mobile analytics: set `EXPO_PUBLIC_POSTHOG_KEY` (and `EXPO_PUBLIC_POSTHOG_HOST`) in EAS.

See `MONITORING.md` for the event list, log fields, and redaction rules.

### Step 5 — Deploy

- Backend: deploy to Railway (push to the deploy branch / `railway up`). A push is not a deploy — confirm the new revision is live and `GET /health` is green before continuing.
- Mobile: the EAS build/submit (or OTA) from Step 2 is the deploy.

### Step 6 — Post-release verification

Run the existing Release Verification section above (mobile + API + admin smoke), then confirm monitoring is live:

- `GET /health` is green.
- The admin Control Panel System badge shows ok-state, `serviceVersion`, and a fresh backup age (`GET /api/v1/admin/system/health`).
- After exercising one OTP + one verification flow, the structured server log shows a JSON line with `req.id` and NO phone/code/token, and (if PostHog is enabled) the analytics events appear.

### Step 7 — Rollback (if the release is bad)

- Backend: in Railway, redeploy the previous known-good revision (Railway > Deployments > previous > Redeploy). Prefer a forward fix if a migration is already applied and the previous schema is incompatible.
- Mobile (full build): submit a fixed, higher build number — never reuse a build number (see runbook `ENTITY_ERROR ... DUPLICATE`).
- Mobile (OTA): publish a rollback OTA update to the prior known-good bundle.
- Database: restore from the verified nightly dump only as a last resort. The restore pointer and freshness rule live in `MONITORING.md` (Backup Verification). Never hand-edit production data without an audit record.

### Standing launch gates (must clear before go-live)

These two gates are hard blockers for production go-live. Call them out in every pre-launch review:

1. IAP receipt verification. Apple/Google in-app-purchase receipt signature / `x5c` chain verification must land before go-live. `src/appstore.ts` is currently DECODE-ONLY (it decodes the JWS payload but does not yet cryptographically verify the signature / certificate chain). Real money flows only after full signature + `x5c` verification is in place.
2. Admin credentials in prod. `ADMIN_PASSWORD` and `ADMIN_EMAIL` must be set on Railway production, or the `/admin` Control Panel cannot be used and operators cannot approve suppliers, create jobs, select winners, or read the System health badge.

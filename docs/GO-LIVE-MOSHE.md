# MyKeyz Care — Go-Live Task List (for Moshe)

**One cohesive checklist of everything left before MyKeyz Care goes live.** All the code is built, tested,
and pushed. What remains are **operator actions only** — things that need your accounts, your dashboards, or
your approval. Nothing here requires writing code.

Do the phases **in order** — there are dependencies (e.g. generate the shared secrets before you paste them
into the two services). Each task says *what*, *where*, the *exact value/command*, and *how to verify*.

> 🔒 **Secrets rule:** this document contains **no secret values** on purpose. You generate them and paste
> them straight into Railway/EAS — they never live in a file or a git repo.

---

## Where things stand

| Area | Code | What's left for you |
|---|---|---|
| Care backend + mobile (10 sprints) | ✅ done, on `main` | set prod env (below) |
| MyKeyz ↔ Care bridge | ✅ built + 21/21 E2E, on branch `feat/care-bridge` (NOT deployed) | QA the branch, set env both sides, gated deploy |
| IAP receipt verification | ✅ done (real x5c + Play API, fail-closed), on `main` | set Apple/Google env to activate |
| Admin Control Panel | ✅ done | set `ADMIN_PASSWORD` + `ADMIN_EMAIL` |
| Monitoring (Sentry/PostHog) | ✅ wired (no-op until keyed) | optional: set DSN/keys |

Two Railway services are involved:
- **Care API** — `care-api.mykeyz.io` (repo `mykeyz-care-api`)
- **MyKeyz API** — `api.mykeyz.io` (repo `mykeyz`, the main inspection app)

---

## Phase 1 — Generate the two shared secrets (do this first)

The bridge uses two shared secrets that must be **identical on both services**. Generate each once:

```bash
openssl rand -base64 32   # → this is CARE_INGEST_KEY
openssl rand -base64 32   # → this is MYKEYZ_CARE_WEBHOOK_SECRET
```

- [ ] Generate `CARE_INGEST_KEY` (used to sign MyKeyz → Care job pushes)
- [ ] Generate `MYKEYZ_CARE_WEBHOOK_SECRET` (used to sign Care → MyKeyz quote-return webhooks)

Keep them somewhere safe for the next two phases. You'll paste the **same value** into both services.

---

## Phase 2 — Bridge env: Care API service

Railway → **Care API** service → **Variables** → add:

- [ ] `CARE_INGEST_KEY` = *(the value from Phase 1)*
- [ ] `MYKEYZ_CARE_WEBHOOK_URL` = `https://api.mykeyz.io/webhooks/care`
- [ ] `MYKEYZ_CARE_WEBHOOK_SECRET` = *(the value from Phase 1)*

---

## Phase 3 — Bridge env: MyKeyz API service

Railway → **MyKeyz API** service → **Variables** → add:

- [ ] `CARE_INGEST_URL` = `https://care-api.mykeyz.io`  *(origin only — the app appends the path)*
- [ ] `CARE_INGEST_KEY` = *(the **same** value as Phase 2)*
- [ ] `MYKEYZ_CARE_WEBHOOK_SECRET` = *(the **same** value as Phase 2)*

> When these three are present, MyKeyz automatically routes inspection-defect quote requests to Care and
> retires the old demo-vendor stub. When absent, MyKeyz keeps its current behavior — so nothing breaks until
> you deploy the bridge branch in Phase 7.

---

## Phase 4 — Activate IAP receipt verification (Care API service)

Without these, the server is **fail-closed in production** (it rejects all purchase receipts). Set them to
turn on real verification. Railway → **Care API** → **Variables**:

**Apple**
- [ ] `APPLE_IAP_BUNDLE_ID` = the app's bundle id (e.g. `com.mykeyz.care`)
- [ ] `APPLE_IAP_ENVIRONMENT` = `production`
- [ ] `APPLE_IAP_APP_APPLE_ID` = the app's numeric App Store id *(required by the verifier in production)*

**Google**
- [ ] `GOOGLE_PLAY_PACKAGE_NAME` = the Android package name
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` = the full service-account JSON (androidpublisher-scoped), as one line

> The Play service account is the same kind you already set up for the main MyKeyz Android payments
> (Play Console → Setup → API access → service account with Financial/Android Publisher access).

---

## Phase 5 — Admin Control Panel access (Care API service)

`/admin` cannot be used until these are set — operators can't approve suppliers, create jobs, or read the
System health badge without them. Railway → **Care API** → **Variables**:

- [ ] `ADMIN_PASSWORD` = a strong password you generate (`openssl rand -base64 18`) — **do not reuse** a
  password from anywhere else
- [ ] `ADMIN_EMAIL` = the admin account email

---

## Phase 6 — Production hardening (Care API service)

Railway → **Care API** → **Variables**:

- [ ] `ALLOW_DEV_OTP` = `false`  *(turns off the `123456` test OTP — REQUIRED before public launch)*
- [ ] `SEED_DEMO_DATA` = `false`  *(stops seeding demo suppliers/jobs in prod)*
- [ ] Real OTP delivery — set the WhatsApp/SMS provider creds (`WHATSAPP_VERIFY_TOKEN`,
  `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) so real users get codes
- [ ] *(optional)* `SENTRY_DSN` + `POSTHOG_KEY` — error tracking & analytics (silent no-op until set)
- [ ] *(optional, mobile/EAS)* `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY`

> ⚠️ Leaving `ALLOW_DEV_OTP=true` in production means anyone can log in with `123456`. This is the single
> most important hardening flag.

---

## Phase 7 — QA the bridge branch, then deploy it (gated)

The bridge lives on branch **`feat/care-bridge`** in the `mykeyz` repo and has **not** been merged or
deployed. This is the one place I deliberately stopped for your go-ahead, because it touches the live
inspection app.

- [ ] **Review / QA the branch** — pull `feat/care-bridge`, run the app against a staging backend, and walk
  the flow: flag a defect → "Get a professional" (behind the existing PDPL consent) → confirm a Care job is
  created → a Care supplier quotes → the quote shows up in the tenant's Inbox → tenant picks the winner.
  *(I already verified this end-to-end: 21/21 automated checks across both live backends.)*
- [ ] **Merge** `feat/care-bridge` → `main` once you're satisfied.
- [ ] **Deploy** the MyKeyz API (Railway → MyKeyz API → redeploy; confirm the new revision is live and
  `GET https://api.mykeyz.io/health` is green).
- [ ] **Mobile build** — cut the EAS build / OTA that includes the new "Get a professional" defect action.

---

## Phase 8 — Submit to the stores

- [ ] App Store: submit the Care app build for review (with the IAP products configured in App Store Connect).
- [ ] Google Play: submit the Care app build (with the in-app products configured in Play Console).

---

## Final sanity check (after Phases 2–7)

Run these once everything is set and the bridge is deployed:

1. **Both services healthy**
   ```bash
   curl -s https://care-api.mykeyz.io/health
   curl -s https://api.mykeyz.io/health
   ```
   Both should return `{"ok":true,...}`.

2. **Bridge round-trip** — create a real inspection defect in the MyKeyz app and tap "Get a professional".
   Within a few seconds it should appear as a job in the Care Control Panel (`/admin` → Jobs). Submit a quote
   from a verified Care supplier and confirm it lands back in the tenant's MyKeyz Inbox.

3. **Admin reachable** — log in at `https://care-api.mykeyz.io/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`;
   the System badge should show ok-state and a fresh backup age.

4. **Dev OTP is off** — confirm `123456` no longer logs anyone in.

---

## Reference (deeper detail, if you want it)

- Full env inventory + release/rollback steps: `docs/09-RELEASE-AND-TESTFLIGHT.md`
- Bridge architecture + the MyKeyz-side file map: `docs/BRIDGE-MYKEYZ-CARE.md`
- Monitoring, log fields, backup verification: `docs/MONITORING.md`

---

*Everything on the code side is done, verified, and pushed. This list is the complete set of human-only
actions between here and a live, paid product.*

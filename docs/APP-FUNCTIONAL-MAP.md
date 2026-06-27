# MyKeyz Care — Supplier App Functional Map & Implementation Plan

> Built from a code-level audit of BOTH repos (mobile `mykeyz-care`, backend `mykeyz-care-api`),
> cross-checked against the backend ground truth (10 sprints, 11 passing e2e suites). 2026-06-27.

## Verdict (the honest reframe)

This is **not a visual mockup**. The backend is real, tested, and live, and the app is **already wired to
it for most flows** — trade save, area save, license upload (R2), verification submit, admin approval gating,
lead matching by trade+area, and quote submission are all genuine and covered by e2e tests.

What looks like "mock behaviour" is **two separate things**, and we fix them differently:

1. **Dev-mode artifacts** that must never reach production: `ALLOW_DEV_OTP=true` returns the OTP code to the
   client (looks like a pre-filled OTP), `SEED_DEMO_DATA=true` creates the "Ahmed Rashid" demo supplier, and
   dev bypass codes `123456`/`000000`. In production (`ALLOW_DEV_OTP=false`, `SEED_DEMO_DATA=false`) these
   vanish — but we will also remove the hardcoded fallbacks from the app so a wrong env can never show them.
2. **Genuine missing pieces**: real SMS delivery (only WhatsApp + an SMS stub today), "All Dubai vs Specific
   Areas", PDF (not just image) for the license, manual quote fields surfaced in the UI, SMS OTP autofill, and
   real voice→text→translation.

Net: this is a focused completion + hardening pass, not a rebuild.

---

## Per-screen functional map

Legend for **State**: ✅ real & wired · ⚙️ dev-artifact (remove for prod) · 🔧 small gap · 🛠️ real feature work

### 1. Phone entry — `app/(setup)/phone.tsx`
- **Needs**: the user's phone number. **Endpoint**: `POST /api/v1/auth/request-otp {phone, channel}`.
- **Saved**: an `otp_attempts` row (hashed code, ttl). **Validation**: `+971` + digits, min length.
- **Mock to remove**: input defaults to empty (`useState(state.phone||"")`, phone.tsx:13) — but `state.phone`
  can be hydrated from persisted/dev state; **guarantee empty unless real OS detection**. Remove the OTP
  screen's display fallback `"+971 50 123 4567"` (otp.tsx:72).
- **Can/can't**: cannot continue without a syntactically valid number. **State**: ✅ + 🔧 (empty-guarantee).

### 2. OTP — `app/(setup)/otp.tsx`
- **Needs**: the 6-digit code. **Endpoint**: `POST /api/v1/auth/verify-otp {phone, code}` → session + supplier.
- **Saved**: marks OTP verified; creates supplier + session (JWT). **Validation**: 6 digits; backend hash
  compare; max attempts → `otp_blocked`.
- **Mock to remove**: digits default to empty (otp.tsx:22) — the "pre-filled" code users see is the
  `dev_code` returned when `ALLOW_DEV_OTP=true` (index.ts:215). Ensure the app never auto-fills from
  `dev_code` in a production build.
- **Missing**: SMS autofill (`textContentType="oneTimeCode"` iOS, `autoComplete="sms-otp"` Android).
- **Can/can't**: navigation to `/trade` happens **only** on a successful backend verify (otp.tsx:53-54) —
  no client-side bypass. Backend bypass exists **only** when `ALLOW_DEV_OTP=true`. **State**: ✅ + ⚙️ + 🔧.

### 3. Trade selection — `app/(setup)/trade.tsx`
- **Needs**: 1+ trades. **Endpoint**: `PUT /api/v1/supplier/me/trades {trades:[]}`.
- **Saved**: `supplier_trades(supplier_id, trade_key)`. **Used by matching**: YES — `getMatchedJobs` filters
  `EXISTS supplier_trades.trade_key = job.trade_category` (db.ts ~1680). A plumber only sees plumbing jobs.
- **Mock**: the 6 trade options live in `src/data/mock.ts` (static catalog — fine, but move out of "mock").
- **State**: ✅ **fully done end-to-end** (e2e-matching proves trade isolation). No backend work.

### 4. Coverage area — `app/(setup)/coverage.tsx`
- **Needs**: areas covered. **Endpoint**: `PUT /api/v1/supplier/me/service-areas {areas:[]}`.
- **Saved**: `supplier_service_areas(supplier_id, area_key)`. **Matching**: exact `area_key = job.location_area`.
- **Missing (business model)**: NO "All Dubai" option — only an enumerated list of 6 areas, exact match only.
- **Plan**: add **All Dubai vs Specific Areas**. Backend: a `covers_all_dubai` boolean on `suppliers` (or a
  sentinel `*` area); matching treats an all-Dubai supplier as matching every `location_area`. App: a 2-option
  selector; specific → multi-select areas. **State**: ✅ storage + 🛠️ wildcard model.

### 5. Business profile — `app/(setup)/business.tsx`
- **Needs**: business name, trade-license number. **Endpoint**: `PUT /api/v1/supplier/me`.
- **Saved**: `suppliers.business_name`, `suppliers.trade_license_number`. **Loads** existing values from the
  backend after login (empty on first run).
- **Mock to remove**: `src/data/mock.ts` `provider = { name:"Ahmed Rashid", … }` — used as a DISPLAY fallback
  on dashboard/profile. Remove the fallback; render real supplier data + empty/skeleton states.
- **State**: ✅ inputs wired + ⚙️ remove the "Ahmed Rashid" display fallback.

### 6. Trade license — `app/(setup)/license.tsx`
- **Needs**: the license **document** (file) + optional number. **Endpoints**: `POST /api/v1/upload/presign`
  → PUT to R2 → `POST /api/v1/supplier/me/documents {type:"trade_license", public_url, storage_key}`.
- **Saved**: `supplier_documents` (type, url, storage_key, status). Real R2 upload — NOT mock.
- **Gaps**:
  - **PDF support**: picker is image-only (`ImagePicker…Images`, `image/jpeg`). Switch to
    `expo-document-picker` allowing PDF + image; send the real content type.
  - **Mandatory**: there's a "Skip for now" button (license.tsx:121). Submit IS gated server-side
    (`submitVerification` requires a `trade_license` doc → `incomplete_profile`), but the UI lets users skip
    forward. **Remove the skip** so the document is required to proceed.
- **State**: ✅ upload + 🔧 PDF + 🔧 remove skip.

### 7. Review & finish — `app/(setup)/bank.tsx` *(misnamed — it is the Review screen)*
- **Reality**: there is **NO bank/IBAN/payout collection anywhere**. This screen literally says "you get paid
  directly by the customer — we never ask for your bank account." **Endpoint**: `PUT /api/v1/supplier/me/onboarding`.
- **Plan**: rename `bank.tsx` → `review.tsx`, update the two routers that push to `/bank`, and scrub "Bank"
  from the stepper labels (`setupSteps`). Pure cleanup — no payout data exists to remove.
- **State**: ✅ (no payout data) + 🔧 rename/cleanup. **Issue #10 is already satisfied at the data level.**

### 8. Home dashboard — (home screen)
- **Needs**: real supplier name, verification status, new-leads count, matched-leads list, notifications,
  availability. **Endpoints**: `GET /supplier/me`, `GET /jobs` (matched feed), notifications/availability.
- **Reality**: the dashboard IS wired to these endpoints; `mock.ts` is only a **bootstrap fallback** before
  the first fetch. **Mock to remove**: the `provider` fallback (fake name/earnings/jobsWon/winRate).
- **"Earnings/earned"**: reconsider — MyKeyz doesn't pay suppliers; the customer pays them directly and the
  supplier **owes the platform a commission**. So "earned" is misleading. Decision: remove "earned", keep
  "jobs won / leads", and optionally surface "commission owed" from the existing earnings ledger.
- **State**: ✅ wired + ⚙️ remove mock fallback + 🛠️ rethink earnings copy.

### 9. Lead details + quote — (quote screen)
- **Needs**: job details; a quote (price + message + availability). **Endpoint**: `POST /jobs/:id/quotes
  {amount, availability, available_date, note}` → 201; gated `403 not_verified` / `403 not_matched` /
  `409 job_closed` / `409 already_quoted`.
- **Reality**: **quote submission works**. Manual **price** works.
- **Gaps**:
  - **Manual fields**: backend accepts `availability`, `available_date`, `note` (≤140) but the UI doesn't
    surface them. Add inputs: price, short message, work details, availability.
  - **Voice/STT/translation**: voice recording is broken in Expo Go and only does naive price extraction; no
    real transcription; no translation. Make voice an **optional** convenience; manual is always available.
- **State**: ✅ submit + 🔧 manual fields + 🛠️ real voice/STT/translation (phaseable).

### 10. Auth/session, notifications, profile management
- **Session**: JWT (15m) + refresh rotation — ✅. **Notifications**: WhatsApp fire-and-forget on match exists;
  no mobile push (APNs/FCM) — 🛠️ (later). **Profile**: get/update name, business, trades, areas, language — ✅.

---

## Issue-by-issue resolution table

| # | Issue | Real state | Fix | Size |
|---|---|---|---|---|
| 1 | Phone pre-filled | Input empty; guarantee it | empty default + remove "+971…" fallback; (optional SIM detect) | S |
| 2 | OTP pre-filled / autofill | Pre-fill = dev_code; no autofill | no dev_code prefill in prod; add iOS/Android OTP autofill | S |
| 3 | OTP not received | SMS is a stub; WhatsApp real-if-configured | wire a real SMS/WhatsApp provider (needs account) | M |
| 4 | OTP bypass | Only when `ALLOW_DEV_OTP=true` | enforce `ALLOW_DEV_OTP=false` in prod; strip dev codes from prod builds | S |
| 5 | Trade matching | **Done & tested** | none (confirm app calls it — it does) | ✅ |
| 6 | All Dubai vs Specific | Only exact-area | add `covers_all_dubai` model + matching + 2-option UI | M |
| 7 | "Ahmed Rashid" mock | Display fallback only | remove `mock.ts provider` fallback; real data + empty states | S |
| 8 | License as file | Real upload, image-only | add PDF via expo-document-picker + correct content-type | S |
| 9 | License mandatory + Pending | Submit gated; UI lets skip | remove "Skip"; surface "Pending Review" status | S |
| 10 | Remove bank/payout | No payout data exists | rename bank.tsx→review.tsx; scrub "Bank" labels | S |
| 11 | Dashboard real data | Wired; mock fallback | remove mock fallback; rethink "earnings" | M |
| 12 | Quote voice/STT/translate | Submit works; voice broken | optional voice; real STT/translate (phased) | M-L |
| 13 | Manual quote input | Price only in UI | add message/work-details/availability fields | S |
| 14 | Full mapping | — | this document | ✅ |

---

## Implementation plan (runs)

**Run 1 — Production-truth pass (app-only, no external creds).** Closes #1,2,4,7,9,10,13 + #8(PDF) + the app
side of #11. Remove every dev/mock fallback so a production build shows only real data: empty phone/OTP, no
`dev_code` autofill, OTP autofill attributes, delete the `mock.ts provider` fallback (real data + skeletons),
make license required (remove skip) + PDF picker, rename bank→review and scrub "Bank", surface manual quote
fields (message/work-details/availability), remove "earned"/rethink dashboard copy. Verify with `tsc` + a
device run. **No backend changes besides none-or-trivial.**

**Run 2 — All Dubai vs Specific Areas (#6).** Backend: `covers_all_dubai` flag + matching wildcard + e2e.
App: 2-option coverage selector. Ship behind the existing matching tests.

**Run 3 — Real OTP delivery (#3) + prod gates (#4).** Wire the chosen SMS/WhatsApp provider in
`otp-delivery.ts` (the seam already exists); set prod env (`ALLOW_DEV_OTP=false`, provider creds); ensure dev
bypass codes are compiled out of production. **Needs Moshe's provider account/creds.**

**Run 4 — Quote voice→text→translation (#12).** Make voice optional (Run 1 already guarantees manual works),
then implement real transcription + translation via a backend proxy (mirror the main MyKeyz Claude/STT path).
Phaseable — manual quoting is fully usable without it.

**Run 5 — Mobile push notifications + polish.** APNs/FCM for new matched leads; availability toggle;
empty-state polish. Optional for launch.

---

## Open product decisions (need Moshe)

1. **Earnings/"earned"**: remove entirely, or reframe as **"commission owed to platform"** (data exists)?
2. **OTP delivery provider**: SMS (Unifonic — UAE-native / Twilio) vs **WhatsApp-only** (already wired, just
   needs the Business API tokens)? This decides Run 3.
3. **Voice quoting**: build real STT+translation now (Run 4), or ship manual-only first and phase voice later?

Everything else in the plan is unambiguous and can proceed.

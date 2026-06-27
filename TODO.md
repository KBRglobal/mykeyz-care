# MyKeyz Care — Supplier App: Production-Truth Implementation

Source of truth: `docs/APP-FUNCTIONAL-MAP.md`. Decisions (Moshe 2026-06-27):
earnings = show "money earned thanks to MyKeyz" (won-job value via platform); OTP = Unifonic SMS like the
main MyKeyz app (port `mykeyz/backend/src/services/sms.ts`); voice = manual-first, voice later (Run 4).

## Run 1 — Production-truth pass (app-only, no external creds)

- [x] phone.tsx — add OS autofill (`autoComplete="tel"`, `textContentType="telephoneNumber"`); keep empty default
- [x] otp.tsx — remove mock display fallback `"+971 50 123 4567"`; add SMS OTP autofill (`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`) + multi-digit paste/distribute
- [x] AppState.tsx — stop seeding mock `jobs`/`activeJobs`/`conversations`/`provider`; initialize empty + load real data
- [x] mock.ts — delete the fake-data exports (jobs, activeJobs, conversations, provider, notifications, earnings); keep static catalogs (trades, serviceAreas→Run 2, setupSteps, verificationBenefits) and rename file to `catalog.ts`
- [x] (tabs)/index.tsx (home) — wire real supplier name, verification status, new-leads count, matched leads, notifications, availability; "earned thanks to MyKeyz" from earnings ledger; remove fake fallbacks + empty states
- [ ] earnings.tsx + notifications.tsx + quotes.tsx + jobs.tsx + inbox.tsx — replace any mock fallback with real endpoints + empty states
- [x] license.tsx — PDF support via expo-document-picker (PDF + image, correct content-type); remove "Skip for now"; surface "Pending Review" after submit
- [x] bank.tsx → rename to review.tsx; update routes that push to `/bank`; scrub "Bank" from stepper/labels
- [x] quote/[id].tsx — surface manual fields (price, message, work details, availability/available_date); voice optional
- [ ] verify: `npx tsc --noEmit` green; device run; commit+push per item

## Run 2 — All Dubai vs Specific Areas
- [ ] backend: `covers_all_dubai` flag + matching wildcard + e2e; app: 2-option coverage selector

## Run 3 — Real OTP delivery (Unifonic, like main app) + prod gates
- [ ] port Unifonic SMS from mykeyz/backend/src/services/sms.ts into Care otp-delivery.ts SMS path
- [ ] prod env: ALLOW_DEV_OTP=false, UNIFONIC_APP_SID/SENDER_ID (reuse main app creds if shared); strip dev bypass codes from prod build

## Run 4 — Voice → text → translation (deferred)
- [ ] make voice optional (done in Run 1); real STT + translation via backend proxy (mirror main MyKeyz)

## Run 5 — Push notifications + polish (optional for launch)
- [ ] APNs/FCM for new matched leads; availability toggle; empty-state polish

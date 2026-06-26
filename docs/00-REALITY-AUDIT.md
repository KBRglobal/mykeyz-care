# 00 - Reality Audit

This audit separates shipped code from production-ready product behavior. It is the baseline for all MyKeyz Care implementation work.

## Executive Status

MyKeyz Care is a working Expo/React Native beta shell connected to a Railway API and Postgres database. It is not yet a production marketplace. The current system proves navigation, visual direction, basic API connectivity, and a few provider actions, but important workflows still rely on demo data, fixed identities, hardcoded states, or incomplete operational rules.

The product becomes real only when provider identity, verification, job matching, quote competition, reveal credits, WhatsApp communication, earnings, commission, subscriptions, and admin operations are backed by durable backend state and auditable events.

## Mobile App Reality

What exists:

- Expo app with auth, onboarding, tabs, jobs, quotes, inbox, earnings, profile, plans, reveal, availability, route planning, credits, and settings screens.
- Shared UI primitives: screen, card, button, text, header, progress dots, brand mark.
- Theme tokens and design language direction.
- Client API layer connected to `https://care-api.mykeyz.io` with Railway fallback.
- App state provider that hydrates local state and calls backend endpoints.
- Basic i18n file, voice price parser, GraphHopper/WhatsApp/speech/analytics integration stubs.

What is not real enough:

- `src/data/mock.ts` still drives trades, jobs, active jobs, conversations, plans, provider defaults, notifications, and earnings references.
- `AppState.tsx` still merges API responses with mock fallbacks and local-only state.
- Auth tokens (access + refresh) are now persisted in `expo-secure-store`; the app restores its session on restart and auto-refreshes on a 401. (Sprint 1)
- OTP verification is real (hashed, expiring, rate-limited); fixed dev codes only appear when the backend runs with `ALLOW_DEV_OTP`. Real OTP delivery (SMS/WhatsApp) is still not wired. (Sprint 1)
- Onboarding now persists server-side via granular endpoints. Trades, service areas, language, business profile, and trade license number are written through dedicated endpoints, survive an app restart, and rehydrate from the backend. The trade license file is uploaded and recorded as a `supplier_documents` row. `is_onboarded` is set server-side when the steps are complete, and the supplier ends in `verification_status='submitted'` (admin approval is Sprint 3). (Sprint 2)
- Several actions update local state optimistically without a full backend contract.
- Visual screens are not yet guaranteed to represent all backend states: pending verification, rejection, quote lost, expired job, no credits, failed upload, no network, payment failed.

## API Reality

What exists:

- Express API with helmet, CORS, JSON parsing, Zod validation on some endpoints.
- JWT auth middleware.
- Postgres connection through `pg`.
- Endpoints for OTP request/verify, supplier profile, jobs, quotes, reveals, supplier jobs, complete job, conversations, messages, earnings, upload presign, WhatsApp webhook.
- R2 presigned uploads.
- Railway deployment with Postgres and Redis available.

What is not real enough:

- `auth/verify-otp` now verifies a hashed, expiring OTP with attempt rate limiting; the fixed codes `123456`/`000000` are gated behind `ALLOW_DEV_OTP` (default off). (Sprint 1)
- Suppliers now get unique real identities via `supplier_users`; the forced `supplier-demo` writer is gone from the core auth path. (Sprint 1)
- Sessions and refresh tokens now exist (`sessions` table) with `auth/refresh` and `auth/logout`. (Sprint 1)
- Supplier onboarding now has a real backend contract: granular endpoints persist trades, service areas, language, business profile, and trade license number, and a `verification_status` state machine moves a supplier `draft -> submitted`. `is_onboarded` is set server-side. Suppliers now support MULTIPLE trades (`supplier_trades`) and MULTIPLE service areas (`supplier_service_areas`) instead of a single `trade` column, and the uploaded trade license is recorded as a `supplier_documents` row. Admin approval (`submitted -> approved/rejected`) is not built yet. (Sprint 2)
- Bank/payout details are intentionally NOT collected at onboarding. The provider is paid directly by the customer and pays the platform a commission via Apple/Google IAP (Sprint 9); there is no bank account to capture.
- Database schema is still created inline in `initializeDatabase`; no migration system exists.
- Demo seed data is now gated behind `SEED_DEMO_DATA` (default off). (Sprint 1)
- Earnings endpoint is hardcoded, not ledger-based.
- Job creation from customer inspections does not exist in this API.
- Customer selection of winning quote does not exist.
- Admin endpoints do not exist.
- Audit logs do not exist.
- Role boundaries are not complete.
- Redis is not yet used for OTP, rate limits, queues, or deduplication.

Still open after Sprint 1:

- Real OTP delivery (SMS/WhatsApp provider) is not wired yet; codes are generated and verified but not sent. (Sprint 7)
- A migration framework is still pending; the schema is created idempotently inline rather than through versioned migrations.

## Database Reality

Existing tables:

- `suppliers`
- `jobs`
- `quotes`
- `reveals`
- `conversations`
- `messages`
- `supplier_users` (Sprint 1)
- `otp_attempts` (Sprint 1)
- `sessions` (Sprint 1)
- `supplier_trades` (Sprint 2)
- `supplier_service_areas` (Sprint 2)
- `supplier_documents` (Sprint 2)

Missing production structures:

- worker accounts (supplier users now exist via `supplier_users`)
- supplier documents (now exist via `supplier_documents`; trade license is captured here) (Sprint 2)
- verification reviews (a `verification_status` state machine `draft -> submitted` exists; admin review/approval is Sprint 3)
- service categories and service areas (multi-trade + multi-area now exist via `supplier_trades` / `supplier_service_areas`) (Sprint 2)
- inspection findings
- job matching records
- quote events
- reveal credit ledger and reveal events
- availability slots
- route plans
- translated message/job content
- earnings ledger
- commission ledger
- invoices
- subscription plans
- supplier subscriptions
- Apple receipt events
- admin users
- audit logs
- fraud signals

## Operational Reality

What exists:

- Railway API deployment.
- Cloudflare custom API domain.
- App Store Connect app and iOS TestFlight build.
- TestFlight runbook.

What is not real enough:

- External TestFlight is waiting for Apple Beta Review.
- No admin/backoffice exists, so real operations cannot approve providers, resolve jobs, inspect money, or handle disputes.
- No production monitoring contract is documented.
- No incident or rollback procedure exists beyond the TestFlight runbook.
- No data backup verification procedure is documented.

## Integration Reality

What exists in code or infrastructure:

- API placeholders for WhatsApp webhook.
- Client integration files for WhatsApp, GraphHopper, speech recognition, and analytics.
- R2 upload presign endpoint.
- App Store Connect/TestFlight process.

What is not real enough:

- WhatsApp Cloud API templates, outbound sends, and deep links are not implemented end-to-end.
- Translation pipeline is not implemented end-to-end.
- Speech-to-price is local/parser-level, not full multilingual voice input.
- Text-to-speech help is not implemented as an app-wide interaction model.
- Apple IAP entitlement sync is not implemented.
- GraphHopper route optimization is not wired to real work schedules.
- Fraud/abuse engine is not integrated.

## Product Reality

The current beta demonstrates the intended provider experience, but the product still lacks the backbone required for real suppliers:

- real provider signup
- real verification
- real job supply from inspection findings
- real quote competition
- real customer choice
- real reveal billing/credits
- real WhatsApp workflows
- real multilingual use
- real earnings and commission
- real admin operations

Until these are built, the app should be treated as a connected prototype, not a launch-ready marketplace.

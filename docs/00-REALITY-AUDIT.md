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
- OTP verification is real (hashed, expiring, rate-limited); fixed dev codes only appear when the backend runs with `ALLOW_DEV_OTP`. OTP is now delivered through a real provider: `POST /api/v1/auth/request-otp` routes the code via a delivery provider and returns `dev_code` ONLY when `ALLOW_DEV_OTP=true`, never otherwise. (Sprint 1 / Sprint 7)
- Onboarding now persists server-side via granular endpoints. Trades, service areas, language, business profile, and trade license number are written through dedicated endpoints, survive an app restart, and rehydrate from the backend. The trade license file is uploaded and recorded as a `supplier_documents` row. `is_onboarded` is set server-side when the steps are complete, and the supplier ends in `verification_status='submitted'` (admin approval is Sprint 3). (Sprint 2)
- The reveal economy is now server-authoritative. The competitor amount is no longer exposed to the app until the provider spends a reveal on that exact job; the reveal/credits balance is the backend's `suppliers.reveals_remaining` (mirrored by an append-only `reveal_events` log), not local state, and buying extra reveals is an Apple/Google IAP placeholder (`care_reveal_single`) that moves no money yet. (Sprint 6)
- Chat is now multilingual and moderated server-side. Each stored message carries `original_body` + `translated_body` + `language` (sender) + `recipient_language`: `GET /api/v1/conversations/:id/messages` returns the recipient's `translated_body` alongside `original_body`, and `POST .../messages` echoes the stored Message plus a `moderation` block. The anti-disintermediation leakage detector runs on the OUTBOUND supplier message: an obfuscated phone (spelled-out / spaced / Arabic-Indic / icon-encoded like `()5!`) or a "move to WhatsApp / DM me / my number is" push comes back `flagged`+`masked` (body shows a `•••` span) with a `warning` string to the sender; the raw excerpt is NEVER returned to the reader. Enforcement is SUPPLIER-ONLY and owner-gated — there is no tenant action and no payout/bank/IBAN anywhere. (Sprint 7)
- Earnings and commission are now ledger-derived end-to-end. Completing a job (by the admin-selected WINNER) atomically books an `earnings_ledger` row (`gross_amount` = the won quote amount, `net_amount` = gross − commission) and a `commission_ledger` row (`commission_amount` = round(gross × leadCommissionRate, default 10%), status `unpaid`); `GET /api/v1/supplier/me/earnings` is now fully ledger-derived with NO hardcoded values (`summary` { this_week, this_month, total_gross, total_net, commission_owed }, `weekly_chart`, `transactions`). Money flows OUTSIDE the platform: the CUSTOMER pays the PROVIDER directly (gross), `net` is what the provider keeps, and commission is the lead commission the provider OWES MyKeyz (an amount-owed ledger, collected later via Apple/Google IAP in Sprint 9). NO bank/IBAN/payout anywhere. (Sprint 8)
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
- Supplier onboarding now has a real backend contract: granular endpoints persist trades, service areas, language, business profile, and trade license number, and a `verification_status` state machine moves a supplier `draft -> submitted`. `is_onboarded` is set server-side. Suppliers now support MULTIPLE trades (`supplier_trades`) and MULTIPLE service areas (`supplier_service_areas`) instead of a single `trade` column, and the uploaded trade license is recorded as a `supplier_documents` row. Admin review now closes the loop: an operator approves, rejects, or requests changes from the `/admin` Control Panel (`submitted -> approved/rejected/needs_changes`), with a reason required for non-approval. (Sprint 2 / Sprint 3)
- Bank/payout details are intentionally NOT collected at onboarding. The provider is paid directly by the customer and pays the platform a commission via Apple/Google IAP (Sprint 9); there is no bank account to capture.
- Database schema is still created inline in `initializeDatabase`; no migration system exists.
- Demo seed data is now gated behind `SEED_DEMO_DATA` (default off). (Sprint 1)
- Earnings and commission are now ledger-based, written atomically on job completion. `POST /api/v1/jobs/:id/complete` (by the admin-selected WINNER) books, in the SAME transaction, an `earnings_ledger` row (`gross_amount` = won quote amount, `net_amount` = gross − commission) and a `commission_ledger` row (`commission_amount` = round(gross × leadCommissionRate, default 10%), `rate`, status `unpaid`), idempotent on `(job_id, supplier_id)` (re-completing never double-books; the job is already `completed` so it 409s anyway), plus an `audit_logs` `job.completed` row carrying `{ gross, commission, net, rate }`. `GET /api/v1/supplier/me/earnings` (supplier Bearer) is now LEDGER-DERIVED with NO hardcoded values: `{ summary:{ this_week, this_month, total_gross, total_net, commission_owed }, weekly_chart:[{ week_start, gross }], transactions:[{ job_id, job_name, completed_at, gross_amount, commission, net_amount }] }`. Commission is the lead commission the provider OWES the platform (status `unpaid`/`paid`, collected via IAP in Sprint 9), gross = customer→provider, net = what the provider keeps; the platform NEVER pays the provider, and there is NO bank/IBAN/payout anywhere. (Sprint 8)
- Jobs are now real, matched supply. `GET /api/v1/jobs` (supplier auth) returns ONLY jobs matched to the calling supplier — their trades + service areas, open and not past deadline, ranked — each item carrying `rank_score` and `has_quoted`. `GET /api/v1/jobs/:id` returns the job with its inspection `findings` plus an `inspection_insight`, `quote_count`, `my_quote`, and `can_quote`, and 404s if the supplier is not matched (and has no prior quote). A job's `source` is `inspection`, `care_hub`, or `admin`; jobs are created in the `/admin` Control Panel, not yet directly from live customer inspections in this API. (Sprint 4)
- Quoting is now gated. `POST /api/v1/jobs/:id/quotes` returns 403 `not_verified` unless the supplier's `verification_status === 'approved'`, 403 `not_matched` if the supplier is not matched, 409 `job_closed` if the job is not open or past its deadline, 409 `already_quoted` on a repeat, and 201 with the quote on success. Approving a supplier recomputes their matches so they immediately see fitting open jobs; unapproved suppliers are never matched. (Sprint 4)
- Quotes now have a full auditable lifecycle. A quote moves `pending -> shortlisted/won/lost/withdrawn`; a supplier may edit or withdraw ONLY their own `pending` quote while the job is still `open` and within deadline (guarded `PUT /api/v1/jobs/:id/quotes/:quoteId` and `POST .../withdraw`, which return 409 `edit_window_closed` / `not_withdrawable` otherwise). Winner selection is ADMIN-ONLY in the `/admin` Control Panel (there is no customer app in Care): `POST /api/v1/admin/jobs/:id/select-quote` sets the winner to `won`, all sibling quotes to `lost`, moves the job to `assigned` with `selected_quote_id` set, and hides the `job_matches` so the job leaves every provider feed; the supplier job detail then carries `is_winner`. Every transition writes an `audit_logs` row. No payout/bank/IBAN is involved anywhere — the platform never pays providers. (Sprint 5)
- The reveal economy is now real and server-authoritative, and the competitor-amount leak is CLOSED. `GET /api/v1/jobs` (feed) and `GET /api/v1/jobs/:id` (detail) return `competitor_amount: null` + `competitor_amount_revealed: false` UNLESS the provider holds an authorized reveal for that exact job, in which case the real number is returned with `competitor_amount_revealed: true` (`ApiJob.competitor_amount` is now `number|null`). `suppliers.reveals_remaining` is the ONLY balance, and every change is mirrored by an append-only `reveal_events` row (`plan_grant` | `reveal_debit` | `purchase`). `POST /api/v1/jobs/:id/reveals` (supplier Bearer) charges one credit and returns `201 { revealed_amount, charged_credits, reveals_remaining, wallet }`, or `402 { error:'no_credits', iap_product_id:'care_reveal_single' }` when out; re-revealing an already-revealed job charges nothing (`charged_credits:false`) and writes no new debit. `GET /api/v1/supplier/me/reveals` returns the RevealWallet (`reveals_remaining`, `granted_total`, `debited_total`, `purchased_total`, last 50 events). Plan-included reveals (minimal 0 / standard 5 / premium 10) are granted ONCE per (supplier, plan) when the provider is approved. Extra reveals are an Apple/Google IAP PLACEHOLDER: `POST /api/v1/supplier/me/reveals/purchase { iap_product_id:'care_reveal_single' }` adds +1 with a `purchase` event but takes NO money and validates NO receipt until Sprint 9 (`400 unknown_product` for any other id), and never touches bank/IBAN/payout. (Sprint 6)
- Admin endpoints now exist for the verification slice: `/api/v1/admin` login (rate-limited, constant-time), supplier list/detail, approve/reject/request-changes, and audit-logs, all gated by an admin JWT (`role === 'admin'`); the admin jobs slice now exists too — `POST /api/v1/admin/jobs` creates a job with `findings` (returning `match_count`) and `GET /api/v1/admin/jobs` lists jobs with `finding_count`, `match_count`, and `quote_count` (Sprint 4); the admin money slice now exists too — `GET /api/v1/admin/finance` (admin Bearer) returns `{ data:[{ supplier_id, business_name, full_name, owed, unpaid_jobs }] }` (suppliers with unpaid commission, ranked by `owed` desc) and `GET /api/v1/admin/finance/:supplierId` returns `{ supplier:{ id, business_name, full_name }, total_owed, jobs:[{ job_id, job_name, completed_at, gross, commission, status }] }` (404 if none) — this is the commission-OWED view, not a payout: the platform never pays providers (Sprint 8); the chat admin view does not exist yet (later sprints / Milestone 10). (Sprint 3)
- Chat messages now translate per recipient and carry an anti-disintermediation guard. `POST /api/v1/conversations/:id/messages` (supplier Bearer) `{ body, language? }` runs the leakage detector on the OUTBOUND supplier message and stores `body` (masked `•••` span when flagged), `original_body` (= the stored body; the raw is NEVER kept here), `translated_body` (translation into `recipient_language`, pass-through when translation is disabled), `language`, `recipient_language`, `flagged`, `masked`, and `moderation_status` `'clean'|'flagged'`; the response = the stored Message PLUS `{ moderation:{ flagged, masked, warning } }`. `GET .../messages` returns `{ messages, has_more }` with each Message carrying `translated_body` + `original_body` + `flagged`/`masked`. A shared obfuscated phone (spelled-out / spaced / Arabic-Indic / icon-encoded like `()5!`) or a "move to WhatsApp / DM me / my number is" push is flagged+masked with a `warning`; the RAW excerpt is written ONLY to `leakage_evidence` and never returned to the reader. (Sprint 7)
- Anti-disintermediation enforcement is SUPPLIER-ONLY and owner-gated. `GET /api/v1/admin/leakage?status=` (admin Bearer) returns `{ data: evidence[] }` (`{ id, supplier_id, business_name, full_name, kind 'obfuscated_phone'|'whatsapp_push', raw_excerpt, masked_excerpt, status 'open'|'reviewed', created_at }`). `POST /api/v1/admin/suppliers/:id/suspend { reason }` returns the updated supplier with `verification_status 'suspended'`, which HIDES that supplier's `job_matches` (their feed empties) and marks their open evidence `reviewed` (404 if not found, 400 `reason_required`). There is NO tenant action and NO payout/bank/IBAN anywhere. (Sprint 7)
- WhatsApp is now live end-to-end (no-op safe when WhatsApp tokens are unset). The webhook is PUBLIC: `GET /api/v1/whatsapp/webhook` answers the Meta `hub.challenge` handshake and `POST /api/v1/whatsapp/webhook` ingests inbound events idempotently (unique `wa_message_id` in `whatsapp_events`) and always returns 200. Creating an admin job and approving a supplier fire outbound WhatsApp job-alert templates with a deep link `mykeyzcare://job/:id` (web fallback `https://care.mykeyz.io/job/:id`). (Sprint 7)
- Audit logs now exist (`audit_logs`); every verification decision writes one, and every leakage flag + supplier suspension is recorded too. (Sprint 3 / Sprint 7)
- Role boundaries are not complete.
- Redis is not yet used for OTP, rate limits, queues, or deduplication.

Still open after Sprint 1:

- Real OTP delivery is now wired: `POST /api/v1/auth/request-otp` routes the code through a delivery provider and only exposes `dev_code` when `ALLOW_DEV_OTP=true`. (Sprint 7)
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
- `admin_users` (Sprint 3)
- `verification_reviews` (Sprint 3)
- `audit_logs` (Sprint 3)
- `reveal_events` (Sprint 6)
- `leakage_evidence` (Sprint 7)
- `whatsapp_events` (Sprint 7)
- `earnings_ledger` (Sprint 8)
- `commission_ledger` (Sprint 8)

Missing production structures:

- worker accounts (supplier users now exist via `supplier_users`)
- supplier documents (now exist via `supplier_documents`; trade license is captured here) (Sprint 2)
- verification reviews (now exist via `verification_reviews`; the `verification_status` state machine extends to `submitted -> approved/rejected/needs_changes` via admin review) (Sprint 3)
- service categories and service areas (multi-trade + multi-area now exist via `supplier_trades` / `supplier_service_areas`) (Sprint 2)
- inspection findings (now exist; findings are stored per job and returned via `GET /api/v1/jobs/:id` and its `inspection_insight`) (Sprint 4)
- job matching records (now exist; a job materialises supplier matches at creation, the provider feed is matched-only on trade + area, and matches recompute when a supplier is approved) (Sprint 4)
- quote events (now exist; every quote transition — `quote.submitted`, `quote.edited`, `quote.withdrawn`, `quote.selected`, `quote.rejected`, plus `job.assigned` — writes an `audit_logs` row, readable via `GET /api/v1/admin/audit-logs?entity_id=<quoteId|jobId>`. There is no separate `quote_events` table; quote events live in `audit_logs`.) (Sprint 5)
- reveal credit ledger and reveal events (now exist; `suppliers.reveals_remaining` is the server-authoritative balance and every change is mirrored by an append-only `reveal_events` row — `plan_grant` / `reveal_debit` / `purchase` — surfaced as the RevealWallet via `GET /api/v1/supplier/me/reveals`; the competitor amount stays `null` in `/jobs` and `/jobs/:id` until an authorized reveal) (Sprint 6)
- availability slots
- route plans
- translated message/job content (messages now exist; each carries `original_body` + `translated_body` + `language` + `recipient_language`, translated into the recipient's language on send) (Sprint 7)
- leakage evidence (now exist via `leakage_evidence`; obfuscated-phone / move-to-WhatsApp flags store the raw excerpt out of reader reach, surfaced via `GET /api/v1/admin/leakage`) (Sprint 7)
- WhatsApp inbound events (now exist via `whatsapp_events`; idempotent on a unique `wa_message_id`) (Sprint 7)
- earnings ledger (now exists via `earnings_ledger`; one row per completed job for the winner, `gross_amount`/`net_amount`, written atomically on job completion and read by `GET /api/v1/supplier/me/earnings`) (Sprint 8)
- commission ledger (now exists via `commission_ledger`; one `unpaid` row per completed job recording the lead commission the provider OWES MyKeyz — `commission_amount`/`rate`/`status` — written atomically with the earnings row, idempotent on `(job_id, supplier_id)`, surfaced to admin via `GET /api/v1/admin/finance`; collected via IAP in Sprint 9; no payout/bank/IBAN) (Sprint 8)
- invoices
- subscription plans
- supplier subscriptions
- Apple receipt events
- admin users (now exist via `admin_users`) (Sprint 3)
- audit logs (now exist via `audit_logs`; every verification decision writes one) (Sprint 3)
- fraud signals

## Operational Reality

What exists:

- Railway API deployment.
- Cloudflare custom API domain.
- App Store Connect app and iOS TestFlight build.
- TestFlight runbook.

What is not real enough:

- External TestFlight is waiting for Apple Beta Review.
- An admin Control Panel now exists, served at `/admin` (secure password login -> admin JWT), with a verification queue: operators approve / reject / request-changes on suppliers (a reason is required for reject and request-changes) without DB edits, every decision writes `verification_reviews` + `audit_logs`, and the supplier app reflects the new status. This is the verification slice only. A jobs slice now also exists in the Control Panel: an operator creates a job with inspection findings and lists jobs with their match and quote counts (Sprint 4), and an operator now selects the winning quote: a ranked quote list (`GET /api/v1/admin/jobs/:id/quotes`, amount ascending, with each provider's business name, full name, and rating) and a select action (`POST /api/v1/admin/jobs/:id/select-quote`) that promotes the winner to `won`, marks siblings `lost`, assigns the job, and writes audit rows (Sprint 5). An anti-disintermediation slice now exists too: operators review the leakage queue (`GET /api/v1/admin/leakage`) and suspend a supplier (`POST /api/v1/admin/suppliers/:id/suspend`), which empties that supplier's feed and marks their open evidence reviewed — enforcement is SUPPLIER-ONLY and owner-gated, with no tenant action (Sprint 7). A Finance slice now exists too: operators see commission owed per supplier (`GET /api/v1/admin/finance`, ranked by amount owed) and drill into one supplier's per-job commission breakdown (`GET /api/v1/admin/finance/:supplierId`) — this is the lead-commission-OWED ledger (status unpaid/paid, collected via IAP in Sprint 9), NOT a payout console: the platform never pays providers and there is no bank/IBAN anywhere (Sprint 8). Full backoffice for chat and dispute resolution is later sprints / Milestone 10. (Sprint 3)
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

- WhatsApp is now end-to-end (no-op safe when tokens are unset): a public webhook handles the Meta `hub.challenge` handshake (GET) and ingests inbound events idempotently (POST, unique `wa_message_id`), and outbound job-alert templates fire on admin job creation + supplier approval with a `mykeyzcare://job/:id` deep link (web fallback `https://care.mykeyz.io/job/:id`). OTP also delivers through a provider now. (Sprint 7)
- Translation pipeline is now wired for chat: each message is stored with `original_body` + `translated_body` + `language` and translated into the recipient's language on send (pass-through when translation is disabled). Job-content translation is still pending. (Sprint 7)
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
- real earnings and commission (now real: ledger-derived earnings + a lead-commission-owed ledger booked atomically on job completion, surfaced to providers via `/supplier/me/earnings` and to admin via `/admin/finance`; commission is collected via IAP in Sprint 9) (Sprint 8)
- real admin operations

Until these are built, the app should be treated as a connected prototype, not a launch-ready marketplace.

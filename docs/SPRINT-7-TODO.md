# Sprint 7 — Chat Translation, WhatsApp & Leakage Detector

Goal: a supplier can hold a real conversation in their own `preferred_language` — every message is stored
with `original_body` + `translated_body` + `language` and rendered translated to the reader, an outbound
WhatsApp template alerts a matched supplier about a new job and its deep link opens that exact job's detail
inside the app, real OTP codes are delivered over a WhatsApp/SMS provider (replacing the dev-OTP-only path),
and the parked anti-disintermediation **leakage detector** finally ships — SUPPLIER-ONLY: on an outbound
supplier message it detects obfuscated phone numbers (spelled-out digits, spaced/split digits, emoji- or
icon-encoded digits like `()5!`) and "move to WhatsApp" push attempts, **masks** the offending span, **warns**
the sender they broke platform rules and it is under review, writes an **evidence record + audit_log**, and
surfaces it in the Control Panel where the **owner manually** decides to suspend the supplier
(`verification_status -> 'suspended'`). Locked business-model facts that govern this sprint: the platform
never pays providers and never touches their bank/IBAN; the only money the supplier sends the platform is via
Apple/Google IAP; there is no customer app inside Care, so any "customer" side of a conversation/webhook is
inbound-only and the winning-quote selection still lives in the owner's Control Panel. Out of scope (later
sprints): a true customer-facing chat client, supplier payout/escrow of any kind, voice/audio messages, group
threads, and automatic (non-owner) supplier suspension. Tenant-side actions are explicitly out of scope —
tenants live in the main MyKeyz app and Care takes **no** action against them; enforcement here is
supplier-only.

## Phase A — Backend chat/translation/leakage spine (sequential, me) — repo: mykeyz-care-api

- [x] A1 data.ts — extend `Message` with moderation fields (`flagged: boolean`, `masked: boolean`, `moderation_status: 'clean' | 'flagged'`, `recipient_language?: string`); add `LeakageEvidence` type (id, message_id, conversation_id, supplier_id, kind `'obfuscated_phone' | 'whatsapp_push'`, raw_excerpt, masked_excerpt, status `'open' | 'reviewed'`, created_at); add `WhatsappEvent` type (id, wa_message_id, kind, payload, created_at)
- [x] A2 config.ts — extend `whatsapp` block: `graphApiVersion` (default `'v21.0'`), `jobAlertTemplate` (name), `templateLang` (default `'en'`), `appDeepLinkScheme` (default `'mykeyzcare'`), `webDeepLinkBase` (default `'https://care.mykeyz.io'`); add `otp` block (`provider` `'whatsapp' | 'sms' | 'none'`, `smsProvider`, `smsFrom`, `otpTemplate`); add `translation` block (`enabled` bool, `provider` `'deepl' | 'google' | 'none'`, `apiKey`, `endpoint`)
- [x] A3 db.ts — `messages` migration: `alter table messages add column if not exists flagged boolean not null default false`, `... masked boolean not null default false`, `... moderation_status text not null default 'clean' check (moderation_status in ('clean','flagged'))`, `... recipient_language text`
- [x] A4 db.ts — new `leakage_evidence` table (id pk, message_id → messages, conversation_id → conversations, supplier_id → suppliers on delete cascade, kind check, raw_excerpt, masked_excerpt, status default 'open' check ('open','reviewed'), admin_id, created_at) + index on (status, created_at desc); new `whatsapp_events` table (id pk, wa_message_id text unique, kind text, payload jsonb, created_at) for inbound idempotency
- [x] A5 src/translate.ts (new) — `translateText(text, targetLang): Promise<{ translated: string; provider: string }>`: when `config.translation.enabled === false` or provider `'none'`, pass-through (translated === text); otherwise call the configured provider; never throws to the caller (on provider error, fall back to pass-through + log)
- [x] A6 src/leakage.ts (new) — `detectLeakage(text): { hit: boolean; kind: 'obfuscated_phone' | 'whatsapp_push' | null; maskedText: string; excerpt: string }`: normalize spelled-out digits (zero/one/two…→0/1/2 incl. Arabic-Indic), strip separators/emoji/icon glyphs (e.g. `()5!`) to surface a ≥7-digit run, and match "whatsapp / wa.me / move to … / dm me on" push phrases; mask the offending span with `•••`. Pure function, no I/O, unit-testable
- [x] A7 src/notifications.ts (new) — language-aware template catalog keyed by language (`en`, `ar`, `hi`, `ur`); `buildJobAlert(supplier, job): { templateLang; params: string[]; deepLink: string }` where `deepLink = ${appDeepLinkScheme}://job/${job.id}` (and `webDeepLinkBase + /job/ + id` fallback), resolving language from `supplier.preferred_language`
- [x] A8 src/whatsapp.ts (new) — `sendTemplate(to, templateName, lang, params)` + `sendText(to, body)` over the Graph API using `config.whatsapp.accessToken` + `phoneNumberId`; `verifyWebhook(query)` (the GET handshake); `parseInboundWebhook(body): WhatsappEvent[]` normalizing messages/statuses/button-replies into `{ wa_message_id, from, kind, text, button_payload }`. No-op safe send when tokens are unset (return `{ skipped: true }`)
- [x] A9 src/otp-delivery.ts (new) — `deliverOtp(phone, code, channel)`: when `channel === 'whatsapp'` send the OTP template via whatsapp.ts, else send SMS via the configured `otp.smsProvider`; returns `{ delivered, channel, provider }`; when no provider configured AND `config.allowDevOtp` is true, resolve to `{ delivered: false, dev: true }` so dev still works
- [x] A10 db.ts — `createMessage()` upgrade: accept `recipientLanguage` + moderation result; run `translateText(body, recipientLanguage)` and store `original_body = raw body`, `translated_body = result`, `language = sender language`, `recipient_language`, plus `flagged`/`masked`/`moderation_status`; store the masked body in `body` when masked (raw kept only in evidence, never re-sent)
- [x] A11 db.ts — leakage persistence: `createLeakageEvidence({ messageId, conversationId, supplierId, kind, rawExcerpt, maskedExcerpt })` (also writes an `audit_logs` row `action 'leakage.flagged'`); `listLeakageEvidence({ status?, limit })` for the Control Panel; `getRecipientLanguageForConversation(conversationId)` (customer-side default → falls back to `config.whatsapp.templateLang`)
- [x] A12 db.ts — `suspendSupplier(supplierId, adminId, reason)`: set `verification_status = 'suspended'` (already a valid `VerificationStatus`), write `verification_reviews` + `audit_logs` (`action 'supplier.suspend'`), and **hide** their matches (`update job_matches set status = 'hidden' where supplier_id = $1`); mark related evidence `status = 'reviewed'`. No tenant rows touched
- [x] A13 db.ts — `recordWhatsappEvent(event)` (insert into `whatsapp_events` `on conflict (wa_message_id) do nothing`, returns whether it was new) so the inbound webhook is idempotent
- [x] A14 index.ts — `/auth/request-otp`: replace the `TODO(Sprint 7)` stub with `deliverOtp(phone, code, channel)`; keep `dev_code` in the response ONLY when `config.allowDevOtp` is true; never expose the code otherwise
- [x] A15 index.ts — `POST /conversations/:id/messages`: run `detectLeakage(body)` (supplier outbound only); on a hit → mask, `createLeakageEvidence(...)`, and pass the masked body + `flagged: true` into `createMessage`; resolve `recipientLanguage` via `getRecipientLanguageForConversation`; respond with the stored message plus `{ moderation: { flagged, masked, warning } }` so the app can warn the sender it broke platform rules and it is under review
- [x] A16 index.ts — WhatsApp webhook real handling: `GET /whatsapp/webhook` → `verifyWebhook`; `POST /whatsapp/webhook` → `parseInboundWebhook`, `recordWhatsappEvent` (drop duplicates), persist inbound text into the matching conversation via `createMessage` (sender_type customer), and ignore button/status events gracefully; always `200`
- [x] A17 index.ts — fire job-alert on new matches: after `createJobWithFindings(...)` (admin job create) and after `recomputeMatchesForSupplier(...)` on approval, look up the freshly-visible matches and `sendTemplate(...)` each matched supplier the `buildJobAlert` template with the deep link to that job; failures are logged, never block the request
- [x] A18 index.ts — adminRouter: `GET /admin/leakage` → `listLeakageEvidence`; `POST /admin/suppliers/:id/suspend` (admin-gated) → `suspendSupplier(id, req.adminId, reason)` returning the updated supplier; both behind `adminRequired`
- [x] A19 typecheck green + live smoke: supplier sends a clean message in `ar` → stored with translated_body; supplier sends `()5!` / "msg me on whatsapp 0 5 0…" → masked + flagged + evidence row + audit_log; owner POST suspend → status 'suspended' + matches hidden; `GET /whatsapp/webhook` handshake returns challenge; `request-otp` returns dev_code only with ALLOW_DEV_OTP

## Phase B — Workflow fan-out (against the frozen contract)

- [x] B1 (agent) mobile: app/chat/[id].tsx — render each message translated to the reader (show `translated_body`, keep the `Languages` toggle to reveal `original_body`); when a sent message comes back `moderation.flagged`, show an inline warning bubble ("This message broke platform rules and is under review") and the masked text; drop the static "Auto-translation active" placeholder for the real per-message state; wire `sendMessage` to the new response shape in src/state/AppState
- [x] B2 (agent) mobile: deep links — add the `mykeyzcare` scheme + universal-link host to app.json and the expo-router linking config so a WhatsApp job-alert `mykeyzcare://job/:id` (and `https://care.mykeyz.io/job/:id`) opens `app/job/[id].tsx`; cold-start + warm-start both land on the right job; app/notifications.tsx renders language-aware copy
- [x] B3 (agent) scripts/e2e-chat.mjs (npm run e2e:chat) — live E2E: OTP request returns dev_code (delivery path exercised); supplier sends a message in a non-en language → stored with original/translated/language; leakage cases (spelled-out, spaced, `()5!`, whatsapp-push) → masked + flagged + evidence visible to admin; admin suspend → supplier 'suspended' + matches hidden (matched feed now empty); `GET /whatsapp/webhook` verify handshake; duplicate inbound webhook is idempotent
- [x] B4 (agent) Control Panel admin.html — new "Leakage" tab (`data-view="leakage"`) listing evidence (supplier, kind, masked excerpt, time) with a **Suspend supplier** action calling `POST /admin/suppliers/:id/suspend`; wire into the existing `tabs`/`loadX` switch alongside queue/jobs/audit
- [x] B5 (agent) docs: 00-REALITY-AUDIT delta — chat now translates per `preferred_language`; WhatsApp outbound job alerts + inbound webhook live; OTP delivered over provider (dev path gated); leakage detector is supplier-only, owner-gated suspend, no tenant action; no payout/IBAN anywhere
- [x] B6 (Opus verify) — adversarial: typechecks both repos; clean message translated; obfuscated-phone + whatsapp-push masked AND raw never re-sent (raw only in evidence); suspend hides matches + writes audit; webhook idempotent + verify handshake; OTP code never leaked without ALLOW_DEV_OTP; confirm NO payout/bank field and NO tenant-side action exist anywhere in the diff

## Phase C — Verify + ship

- [x] C1 local PG (docker postgres:16 on :55432, DATABASE_URL=postgresql://postgres:care@localhost:55432/care) + API on :4000 with ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=smoke-pass-123; run ALL E2E green — auth (26), onboarding (38), admin (45), matching (65), and chat (new); manual: send translated message + trigger a leak + owner-suspend in the Control Panel
- [x] C2 commit + push both repos (mykeyz-care-api + mykeyz-care)

## Acceptance

- A WhatsApp job-alert is sent to a matched supplier and tapping it opens that exact job's detail screen (deep link `mykeyzcare://job/:id` / `https://care.mykeyz.io/job/:id`).
- A supplier can message in their preferred language: messages persist `original_body` + `translated_body` + `language`, and each side reads the message translated for them.
- Real OTP codes are delivered via the WhatsApp/SMS provider; the dev-OTP path only works (and only returns `dev_code`) when `ALLOW_DEV_OTP=true`.
- An outbound supplier message containing an obfuscated phone number or a "move to WhatsApp" push is masked, the sender is warned it broke platform rules and is under review, and an evidence record + audit_log are written.
- The leakage evidence appears in the Control Panel and the owner can manually suspend the supplier (`verification_status -> 'suspended'`, matches hidden); no tenant is ever actioned and no automatic suspension occurs.
- The WhatsApp webhook verifies the GET handshake and idempotently ingests inbound messages; no payout, bank, or IBAN field exists anywhere in the sprint.

# 05 - Integrations

## Integration Rules

- Secrets must stay in credentials storage and platform variables, never in code or docs.
- Webhooks must verify signatures or provider verification tokens.
- Every external call should have timeout, retry policy, and logged failure code.
- User-visible workflows must have fallback states.
- Do not log OTPs, tokens, receipts, full payment data, private keys, or raw credentials.

## WhatsApp Cloud API

Purpose:

- OTP delivery where allowed.
- New job alerts.
- Quote selected alerts.
- Customer message alerts.
- Job reminders.
- Deep links into the provider app.

Required backend capabilities:

- Store WhatsApp opt-in status.
- Send approved message templates.
- Receive webhook delivery/read/inbound events.
- Map inbound message to supplier/user/conversation.
- Localize template language.

Failure fallback:

- Push notification if available.
- SMS for OTP if WhatsApp fails.
- In-app notification as last resort.

Acceptance:

- A new job alert opens the exact job screen.
- A customer message alert opens the exact chat.
- Provider language determines the template language.

## OTP Provider

Purpose:

- Verify phone ownership.

Required backend capabilities:

- Generate OTP.
- Hash OTP before storage.
- Expire OTP.
- Rate-limit phone/IP/device.
- Track failed attempts.
- Block abuse.

Acceptance:

- Fixed codes are removed outside explicit dev mode.
- OTP values never appear in logs.

## Translation And AI

Purpose:

- Translate job details and chat messages between provider and customer languages.
- Support English, Hindi, Urdu, Bengali, Tagalog, and Nepali.

Required backend capabilities:

- Detect source language.
- Store original text.
- Store translated text.
- Store model/provider metadata.
- Retry failed translations.

Failure fallback:

- Show original text with a translation unavailable state.
- Allow manual retry.

Acceptance:

- Provider can send a Hindi/Urdu/Bengali/Tagalog/Nepali message and customer receives English where needed.

## Voice And Speech

Purpose:

- Allow providers to quote and message without typing.
- Support spoken price parsing.

Required client capabilities:

- Speech-to-text permission handling.
- Language-specific speech recognition.
- Voice-to-price parser.
- Confirmation before quote submission.

Required backend capabilities:

- Accept parsed quote payload only, not raw voice as authority.
- Store quote source metadata: manual, voice, suggested.

Acceptance:

- Provider can say a price, confirm it, and submit the quote.

## Apple IAP

Purpose:

- Sell monthly visibility plans and reveal purchases on iOS.

Required backend capabilities:

- Validate receipts/server notifications.
- Map Apple product IDs to plan/reveal entitlements.
- Store entitlement state.
- Apply benefits server-side.

Failure fallback:

- If receipt validation is delayed, show pending purchase state.
- Never grant permanent entitlement from client-only state.

Acceptance:

- Plan and reveal balances are derived from backend entitlements.

## R2 Uploads

Purpose:

- Trade license, profile photo, gallery, completion proof.

Required backend capabilities:

- Presign upload URLs.
- Allowlist file types.
- Enforce size policy.
- Link uploaded file to supplier/job/document record.
- Support admin review.

Acceptance:

- Uploaded trade license appears in admin verification queue.

## GraphHopper

Purpose:

- Route planning and multi-job optimization.

Required backend capabilities:

- Store job coordinates or normalized route inputs.
- Compute optimized order for provider schedule.
- Cache route results where appropriate.

Acceptance:

- Provider with multiple scheduled jobs sees ordered route and leave-time guidance.

## Analytics

Purpose:

- Understand onboarding, quote, reveal, job, and plan funnels.

Required events:

- signup_started
- otp_requested
- otp_verified
- onboarding_step_completed
- verification_submitted
- job_viewed
- quote_started
- quote_submitted
- reveal_clicked
- reveal_success
- message_sent
- job_completed
- plan_viewed
- plan_purchase_started
- plan_purchase_completed

Acceptance:

- Every core funnel can be measured without exposing private content.

## MyKeyz Inspection Bridge (inbound job source)

Purpose:

- Care receives inspection-sourced jobs from MyKeyz (each defect becomes a job).
- All matched suppliers may quote on an ingested job.
- Quotes return to MyKeyz so the tenant/customer can compare.
- The tenant selects the winning quote; selection flows back into Care.
- Both directions are signed. Full contract: BRIDGE-MYKEYZ-CARE.md.

Required backend capabilities:

- Public inbound routes with own auth: Bearer `CARE_INGEST_KEY` + `X-Care-Signature` HMAC over raw body (not the supplier authRequired router).
- `POST /api/v1/ingest/jobs` — create job, match suppliers, return `matched_supplier_count`.
- Idempotency on `external_ref` (= MyKeyz service-lead id): re-ingest returns same job, no duplicate.
- `GET /api/v1/ingest/jobs/by-ref/:ref` — snapshot (Bearer only).
- `POST /api/v1/ingest/jobs/by-ref/:ref/select` — select winner as actor_type=customer (audited).
- Outbound return webhook to `MYKEYZ_CARE_WEBHOOK_URL`, signed with `MYKEYZ_CARE_WEBHOOK_SECRET`, fire-and-forget, on quote.submitted/edited/withdrawn + job.status.
- Constant-time signature compare; never send customer/supplier phone or any secret; only supplier quote amount crosses (Care → MyKeyz).

Failure fallback:

- `CARE_INGEST_KEY` unset → inbound returns 503 (bridge disabled).
- `MYKEYZ_CARE_WEBHOOK_URL`/`MYKEYZ_CARE_WEBHOOK_SECRET` unset → outbound is a silent no-op.
- MyKeyz can poll `GET .../by-ref/:ref` to reconcile a missed return webhook.

Acceptance:

- A painting job in Dubai Marina ingests with `matched_supplier_count >= 1`.
- Re-ingesting the same `external_ref` returns the same job_id with `idempotent_reuse:true`.
- A submitted quote reaches MyKeyz; the tenant's selection assigns the job and sets `winning_quote_id`.
- No phone number or secret ever appears in any bridge payload or log.

## Fraud / Abuse

Purpose:

- Detect fake providers, quote abuse, reveal abuse, review abuse, and commission avoidance.

Required signals:

- duplicate phone/license
- many failed OTPs
- excessive reveals
- suspicious quote patterns
- repeated cancelled jobs
- customer/provider off-platform signals

Acceptance:

- Admin can see fraud flags and decision history.

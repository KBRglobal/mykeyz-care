# Sprint 11 — MyKeyz ↔ Care Bridge (inspection-sourced jobs)

Goal: turn a real defect on a MyKeyz inspection card into a real, matched job in MyKeyz Care, let every
verified supplier in that trade+area quote it, and surface those quotes back to the tenant inside the
MyKeyz app where they pick a winner. This is the missing **job supply** for the marketplace — without it
Care has no organic jobs (today jobs exist only when the owner hand-types them in the Control Panel).

## Confirmed product model (Moshe, 2026-06-26)

- **Source of Care jobs = MyKeyz inspection defects ("the card").** A tenant flags a defect → it becomes
  a trade-tagged Care job. (`Job.source = "inspection"` already exists in the Care enum.)
- **All matched, verified Care suppliers** in that trade + area see the job in their feed and **may quote**
  ("כל הספקים מהתחום מקבלים את האופציה לתת הצעה ללקוח"). This is Care's existing matching + quote lifecycle
  (Sprints 4–5), unchanged.
- **Quotes flow back to the MyKeyz app** (MyKeyz is the customer app — the tenant lives there; Care has no
  customer app). The tenant sees the quotes and **selects the winner**. Customer selection **supersedes**
  the Sprint-5 "admin-only winner selection" *for inspection-sourced jobs*; admin keeps override/oversight.
- **Care replaces the local MyKeyz vendor stub** (`service_partners` / `vendor_bids` / demo vendors). Per
  the destroy-superseded rule, the demo stub is deprecated; `vendor_bids` become Care-backed.
- **Trigger lives on the defect card** in MyKeyz (review-findings / edit-defect), behind the existing
  explicit PDPL consent (`shareContact` / `sharePhotos`). Customer = the tenant.
- Business model untouched: customer pays the provider directly; provider owes Care a lead commission;
  Care never stores provider bank/IBAN; provider pays the platform only via Apple/Google IAP. No repair
  price estimates cross the bridge (MyKeyz removed repair prices — there is no estimated_cost to send).

## Architecture (technical decisions — locked)

- **Direction: server-to-server PUSH, MyKeyz → Care.** MyKeyz already has `timedFetch` + Zod `Config`
  secrets; Care exposes an ingest API. No polling.
- **Auth: shared service key + HMAC.** Care issues `CARE_INGEST_KEY`; MyKeyz holds it and sends it as a
  Bearer-style header PLUS an `X-Care-Signature: sha256=<hex>` HMAC of the raw request body
  (per 05-INTEGRATIONS "webhooks must verify signatures"). Constant-time compare; reject on mismatch.
- **Idempotency: `jobs.external_ref` = MyKeyz `service_lead` id.** Unique partial index; ingest is
  upsert-or-noop (reuses the Sprint-9 `on conflict (external_ref) where external_ref is not null` pattern).
- **Return path: Care → MyKeyz webhook** (`MYKEYZ_CARE_WEBHOOK_URL` + same HMAC secret) fired on quote
  submitted / edited / withdrawn and on job status change. MyKeyz verifies the signature and upserts a
  `vendor_bid` (+ status) on the originating lead so the tenant sees it in the inbox.
- **Customer selection:** MyKeyz → Care `POST /ingest/jobs/by-ref/:external_ref/select` → `selectWinningQuote`
  (audited as `actor_type = "customer"`). Admin override path stays.

## Phase A — Care backend spine (sequential, me) — repo: mykeyz-care-api — SAFE (no live-app changes)

- [x] A1 config.ts — add `careIngest: { key: process.env.CARE_INGEST_KEY }` and
      `mykeyzWebhook: { url: process.env.MYKEYZ_CARE_WEBHOOK_URL, secret: process.env.MYKEYZ_CARE_WEBHOOK_SECRET }`
      (all `process.env.*`, no inline secret).
- [x] A2 db.ts — additive idempotent DDL on `jobs`: `external_ref text`, `customer_name text`,
      `customer_phone text`, `customer_language text`, `origin_inspection_id text`, `origin_issue_id text`
      (all nullable); `create unique index jobs_external_ref_uq on jobs (external_ref) where external_ref is not null`.
- [x] A3 data.ts — extend `Job` type with the new nullable fields; add `IngestJobInput` /
      `CareQuoteForReturn` types.
- [x] A4 db.ts — `ingestInspectionJob(input)`: idempotent create from a defect payload via
      `createJobWithFindings({ source: "inspection", external_ref, customer_*, findings })`; if the
      `external_ref` already exists return the existing job (no duplicate). Returns
      `{ job_id, public_ref, status, matched_supplier_count, idempotent_reuse }`.
- [x] A5 db.ts — `getJobByExternalRef(external_ref)`, `listJobQuotesByExternalRef(external_ref)`,
      `selectWinningQuoteByExternalRef(external_ref, quoteRef, actor)` (wraps `selectWinningQuote`,
      audited `actor_type:"customer"`). On reveal/engage, the conversation uses the job's `customer_name`.
- [x] A6 src/lib/signing.ts (new) — `hmacSha256Hex(secret, raw)` + `verifySignature(secret, raw, header)`
      (constant-time); reused by ingest-verify and the outbound webhook.
- [x] A7 src/mykeyzWebhook.ts (new) — `notifyMykeyz(event, payload)` fire-and-forget POST to
      `mykeyzWebhook.url` with `X-Care-Signature`; no-op + logged when URL/secret unset; timeout + logged
      failure code (per 05-INTEGRATIONS). Never logs customer phone/secret.
- [x] A8 index.ts — PUBLIC ingest router (own auth, NOT the supplier `authRequired`):
      `POST /api/v1/ingest/jobs` (key+HMAC → `ingestInspectionJob`),
      `GET  /api/v1/ingest/jobs/by-ref/:external_ref` (status + quotes for reconciliation),
      `POST /api/v1/ingest/jobs/by-ref/:external_ref/select` (customer picks winner).
      `sensitiveLimiter()` on the POST routes; 401 on bad key/sig.
- [x] A9 index.ts — fire `notifyMykeyz` when a supplier submits / edits / withdraws a quote on an
      inspection-sourced job (has `external_ref`) and on job status change (assigned/completed/expired).
- [x] A10 typecheck green + live smoke: ingest a defect (key+HMAC) → job created + matched count;
      re-ingest same `external_ref` → same job (idempotent); a supplier quotes → outbound webhook fires
      (capture against a local sink); select-by-ref → job assigned; bad key/sig → 401; no PII in logs.

## Phase B — Workflow fan-out (Care side) — repo: mykeyz-care-api

- [x] B1 (agent) scripts/e2e-bridge.mjs — full E2E: ingest → matched suppliers see job → 2 suppliers quote
      → outbound return webhook payloads captured → customer select-by-ref → job assigned, losers lost,
      audit `actor_type:"customer"`; idempotent re-ingest; 401 on bad key/sig. Wire `e2e:bridge` + add to `e2e:all`.
- [x] B2 (agent) Control Panel public/admin.html — Jobs view shows `source` (inspection vs admin) + the
      origin card link + customer contact (display-only) so the operator sees bridge-sourced jobs.
- [x] B3 (agent) docs — new docs/BRIDGE-MYKEYZ-CARE.md (the contract: ingest payload, HMAC, idempotency,
      return webhook, select-by-ref, env names) + 05-INTEGRATIONS delta (the inbound job source).
- [x] B4 (Opus verify) adversarial: no committed secret; HMAC actually rejects bad sigs; idempotency holds;
      customer-select audited; outbound webhook never logs phone/secret; e2e:all still green.

## Phase C — MyKeyz live app (separate, gated) — repo: /Users/claude/Documents/mykeyz — NEEDS Moshe go-ahead

> Touches the LIVE main app. Build on a branch, never auto-deploy. Surfaced as its own gated step.

- [x] C1 backend: `issue.category → Care trade` mapping; in `serviceMarketplace.requestQuote`, after the
      `service_lead` insert, PUSH to Care ingest (timedFetch + key + HMAC); store `care_job_id`/`public_ref`
      on the lead; retry via the existing job queue on failure (lead still created locally).
- [x] C2 backend: receive Care return webhook (`POST /v1/care/webhook`, verify HMAC) → upsert a `vendor_bid`
      (+ status) on the lead; expose lead quotes to the app; selection endpoint → push select-by-ref to Care.
- [x] C3 mobile: "Get a professional" action on the defect card (review-findings / edit-defect) → existing
      consent → `requestQuote(issueId)`; inbox shows Care quotes; tenant selects → push selection.
- [x] C4 deprecate the local demo vendor stub (stop seeding `service_partners` demo rows; `vendor_bids`
      become Care-backed). Per destroy-superseded; behind a flag if a phased cutover is safer.
- [x] C5 verify on a branch (both backends local, end-to-end defect→job→quote→return→select); Moshe QA;
      then gated deploy.

## Acceptance

- A defect flagged in MyKeyz creates exactly one matched Care job (idempotent on the lead id); every
  verified supplier in that trade+area can quote it.
- A supplier's quote is delivered back to the MyKeyz app (signed webhook) and shown to the tenant; the
  tenant picks a winner and that selection reaches Care (`actor_type:"customer"`, audited).
- The ingest + webhook are signature-verified; bad key/sig → 401; nothing logs the customer phone or any
  secret; no secret is committed.
- The local MyKeyz demo vendor stub is retired; Care is the single marketplace engine.

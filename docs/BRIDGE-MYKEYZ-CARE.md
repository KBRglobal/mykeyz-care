# Bridge: MyKeyz ↔ Care

Authoritative integration contract for the Sprint 11 MyKeyz ↔ Care bridge.
A MyKeyz backend engineer can implement against this document with no other context.

Status: FROZEN, live-verified (22 smoke checks + 555 e2e green). Do not change the
wire shapes below without versioning the contract.

---

## 1. The Problem

Care is a two-sided marketplace: it needs a steady supply of real, qualified jobs to
keep approved suppliers quoting. MyKeyz already produces exactly that supply — every
property inspection surfaces concrete maintenance defects (a cracked tile, a leaking
trap, peeling paint) that someone has to fix. Those defects are the perfect job source.

The bridge turns a MyKeyz inspection defect into a Care job, lets every matched Care
supplier quote on it, returns those quotes to MyKeyz, and lets the MyKeyz-side
tenant/customer pick a winner — all without either side leaking a phone number, a
secret, or a price into the wrong system.

- **Care** owns: supplier matching, quoting, quote lifecycle, winner selection, audit.
- **MyKeyz** owns: the inspection, the defect, the customer relationship, the UI where
  the customer reviews quotes and chooses.

The job's stable identity across both systems is the **MyKeyz service-lead id**, carried
on the wire as `external_ref`.

---

## 2. End-to-End Flow

```
MyKeyz inspection                Care marketplace                 MyKeyz app/customer
─────────────────                ───────────────                 ───────────────────
1. Defect captured
2. Customer taps "Get quotes"
   on a defect/issue
        │
        │  POST /api/v1/ingest/jobs       (Bearer + HMAC)
        ├───────────────────────────────►  3. Job created (status: open)
        │                                     matched_supplier_count computed
        │  ◄───────────────────────────────  201 {job_id, external_ref, ...}
        │
        │                                  4. Matched suppliers quote
        │                                     (normal Care quote flow)
        │                                          │
        │  POST MYKEYZ_CARE_WEBHOOK_URL  (HMAC)    │  quote.submitted/edited/withdrawn
        │  ◄───────────────────────────────────────┤  + job.status events
        │  5. MyKeyz stores each returned           │
        │     quote as a vendor_bid                 │
        │
        │                                                    6. Customer reviews bids
        │                                                       picks one
        │  POST /api/v1/ingest/jobs/by-ref/:ref/select  (Bearer + HMAC) {quote_id}
        ├───────────────────────────────►  7. selectWinningQuote (actor=customer, audited)
        │                                     job → assigned, winning_quote_id set
        │  ◄───────────────────────────────  200 {job_id, status:'assigned', winning_quote_id}
        │
        │  POST MYKEYZ_CARE_WEBHOOK_URL  (HMAC)     job.status = assigned
        │  ◄───────────────────────────────────────┘
```

Polling alternative to the return webhook: MyKeyz may `GET .../by-ref/:ref` at any time
to read the current job + quotes snapshot (see §5).

---

## 3. Inbound: MyKeyz → Care

These are **PUBLIC** routes with their own auth. They are NOT mounted under Care's
supplier `authRequired` router. They authenticate with a shared Bearer key plus a
per-request HMAC signature over the raw body.

### 3.1 Auth scheme

Every mutating inbound request carries two headers:

```
Authorization: Bearer <CARE_INGEST_KEY>
X-Care-Signature: sha256=<hex>
```

- `<CARE_INGEST_KEY>` — shared secret, identical on both sides. Bad/missing → `401 {"error":"unauthorized"}`.
- `<hex>` — lowercase hex of `HMAC-SHA256(key = CARE_INGEST_KEY, message = rawRequestBody)`.
  The signed message is the **exact raw bytes** of the request body, before any JSON
  re-serialization. Bad/missing → `401 {"error":"bad_signature"}`.

If `CARE_INGEST_KEY` is unset on the Care side, every inbound route returns
`503` (bridge disabled).

#### Worked pseudo-code (MyKeyz side, computing the signature)

```js
import crypto from "node:crypto";

const rawBody = JSON.stringify(payload);            // serialize ONCE
const sig = crypto
  .createHmac("sha256", process.env.CARE_INGEST_KEY) // never hardcode
  .update(rawBody, "utf8")
  .digest("hex");

await fetch(`${CARE_BASE_URL}/api/v1/ingest/jobs`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "authorization": `Bearer ${process.env.CARE_INGEST_KEY}`,
    "x-care-signature": `sha256=${sig}`,
  },
  body: rawBody,                                      // send the SAME bytes you signed
});
```

Critical: serialize the body **once** and reuse those exact bytes for both the HMAC and
the request. Re-stringifying (different key order, whitespace) breaks the signature.

### 3.2 `POST /api/v1/ingest/jobs` — create / re-ingest a job

Headers: `Authorization: Bearer` + `X-Care-Signature` (both required).

Request body (zod `IngestJobSchema`):

```json
{
  "external_ref": "svc_lead_01H...",          // MyKeyz service-lead id, the join key
  "service_type": "repair",
  "trade_category": "painting",
  "location_area": "Dubai Marina",
  "location_address": "Marina Gate 1, Apt 1203",
  "description": "Bedroom wall paint peeling near window",
  "customer_name": "A. Customer",
  "customer_phone": "+9715XXXXXXXX",
  "customer_language": "en",                   // optional
  "origin_inspection_id": "insp_...",          // optional
  "origin_issue_id": "issue_...",              // optional
  "findings": [
    {
      "room": "Bedroom",
      "finding_type": "paint_damage",
      "description": "Peeling paint, ~0.5m² near window frame",
      "severity": "medium",                    // "low" | "medium" | "high"
      "photo_url": "https://.../photo.jpg"      // optional
    }
  ]
}
```

Constraints:
- `findings`: 1..50 items. `severity` ∈ {`low`,`medium`,`high`}.
- All non-optional fields required; violations → `400 {"error":"invalid_payload"}`.

Responses:
- **First ingest of an `external_ref`:**
  `201 {"job_id":"...", "external_ref":"...", "status":"open", "matched_supplier_count":N, "idempotent_reuse":false}`
- **Re-ingest of the SAME `external_ref`:**
  `200 {"job_id":"...", "external_ref":"...", "status":"...", "matched_supplier_count":N, "idempotent_reuse":true}`
  — returns the same `job_id`, creates no duplicate job.
- `401 {"error":"unauthorized"}` — bad/missing Bearer.
- `401 {"error":"bad_signature"}` — bad/missing HMAC.
- `400 {"error":"invalid_payload"}` — schema violation.
- `503` — `CARE_INGEST_KEY` unset on Care.

`matched_supplier_count` is how many approved suppliers match `trade_category` +
`location_area` at ingest time. `0` is a valid success — the job exists but no one can
quote yet.

### 3.3 Idempotency

`external_ref` is the idempotency key and equals the MyKeyz service-lead id. Re-sending
the same `external_ref` is safe and expected (retries, at-least-once delivery): Care
returns the existing job with `idempotent_reuse:true` and never creates a second job.
MyKeyz must treat ingest as idempotent and key its own state on `external_ref` + `job_id`.

---

## 4. Outbound: Care → MyKeyz (return webhook)

Source: `src/mykeyzWebhook.ts` on the Care side. Fire-and-forget (Care does not block on
or retry-await MyKeyz; failures are logged, not surfaced to the supplier). **No-op when
`MYKEYZ_CARE_WEBHOOK_URL` or `MYKEYZ_CARE_WEBHOOK_SECRET` is unset.**

### 4.1 Delivery

```
POST <MYKEYZ_CARE_WEBHOOK_URL>
X-Care-Signature: sha256=<hex>
Content-Type: application/json
```

- `<hex>` = `HMAC-SHA256(key = MYKEYZ_CARE_WEBHOOK_SECRET, message = rawBody)`.
- Fired only for jobs that have an `external_ref` (i.e. jobs that came from MyKeyz).
- Triggers: `quote.submitted`, `quote.edited`, `quote.withdrawn`, and `job.status` changes —
  `job_status: "assigned"` (on select, `index.ts` `/select`) and `job_status: "completed"`
  (on supplier job-complete, `index.ts` `/jobs/:id/complete`). MyKeyz's `careWebhook.ts` also
  has handling for `job_status: "cancelled"/"canceled"/"refunded"`, but Care has no job-cancel
  action yet, so those are currently never sent — not a bug, just an unbuilt feature on the
  Care side. Until 2026-07-23, `completed` was ALSO never sent (a real gap: the supplier-side
  complete action updated Care's own `jobs.status` but never notified MyKeyz, so the bridged
  lead never converted and its referring agent's commission was never credited) — fixed by
  wiring `notifyMykeyz` into `completeSupplierJob`'s route handler.

### 4.2 Payload (`CareReturnEvent`)

```json
{
  "event": "quote.submitted",                  // or quote.edited | quote.withdrawn | job.status
  "external_ref": "svc_lead_01H...",
  "job_id": "...",
  "job_status": "open",                         // open | assigned | ...
  "quote": {                                    // present on quote.* events
    "id": "...",
    "supplier_id": "...",
    "supplier_name": "...",
    "amount": 350,
    "availability": "this_week",
    "available_date": "2026-07-02",
    "note": "Includes primer and two coats",
    "status": "submitted"
  }
}
```

The payload **NEVER** includes the customer phone, the supplier phone, or any secret.
`quote.amount` is the only price that crosses, and it only travels Care → MyKeyz so the
customer can choose; no MyKeyz price is ever sent into Care.

### 4.3 Verify-on-receive (MyKeyz side, mandatory)

```js
import crypto from "node:crypto";

function verify(rawBody, header) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.MYKEYZ_CARE_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(header || "", "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b); // constant-time
}
```

Reject (`401`) any webhook whose signature fails. Read the raw body before any JSON
middleware reparses it, so the bytes you verify are the bytes Care signed.

---

## 5. Read & Select by ref

### 5.1 `GET /api/v1/ingest/jobs/by-ref/:external_ref` — snapshot

Headers: `Authorization: Bearer` only (no body, no signature).

- `200 {"job": {...}, "quotes": [ ... ]}` — current job + all quotes.
- `404` — no job for that `external_ref`.

Use for polling or to reconcile state if a return webhook was missed.

### 5.2 `POST /api/v1/ingest/jobs/by-ref/:external_ref/select` — pick the winner

Headers: `Authorization: Bearer` + `X-Care-Signature` (HMAC over raw body).

Request: `{"quote_id":"..."}`

- `200 {"job_id":"...", "status":"assigned", "winning_quote_id":"..."}`
- `404 {"error":"job_not_found"}`
- `409 {"error":"job_not_open"}` — job already assigned/closed.
- `409 {"error":"quote_not_selectable"}` — quote withdrawn/invalid for this job.

Care runs `selectWinningQuote` with `actor_type = 'customer'` (fully audited) so the
selection is attributed to the MyKeyz customer, not to a Care operator. A `job.status`
return webhook (`assigned`) follows.

### 5.3 `POST /api/v1/ingest/jobs/by-ref/:external_ref/withdraw` — PDPL consent revocation

Headers: `Authorization: Bearer` + `X-Care-Signature` (HMAC over raw body).

Request: `{"reason":"consent_revoked"}`

- `200 {"external_ref":"...", "status":"withdrawn"}`
- `404 {"error":"not_found"}` — no job for that `external_ref` (nothing to withdraw).

Called by `withdrawLeadFromCare()` (MyKeyz `backend/src/services/careBridge.ts`) when the
tenant revokes consent for a lead already shared with Care. Idempotent. Care sets
`jobs.status = 'withdrawn'` **and scrubs the tenant PII on the row** (`customer_name`,
`customer_phone`, `location_address`, and each `job_findings.description`/`photo_url`) —
not just a status flip — because a supplier already matched or quoted on the job can still
call `GET /jobs/:id` afterward, and that response is not otherwise filtered by job status.
MyKeyz treats `404` as "nothing to withdraw" (no PII was ever shipped, or it's already gone),
so this endpoint must exist and return 404 rather than an unmatched-route 404 that looks the
same but means something different — this was a real gap (endpoint missing entirely) closed
2026-07-23; see `mykeyz-care-api/src/db.ts` `withdrawJobByExternalRef`.

---

## 6. Environment Variables (names only — values redacted)

### Care side
| Name | Purpose |
|---|---|
| `CARE_INGEST_KEY` | Shared Bearer + inbound HMAC key. Unset ⇒ inbound routes return 503. |
| `MYKEYZ_CARE_WEBHOOK_URL` | Where Care POSTs return events. Unset ⇒ outbound is a no-op. |
| `MYKEYZ_CARE_WEBHOOK_SECRET` | HMAC key for signing outbound return webhooks. Unset ⇒ outbound is a no-op. |

### MyKeyz side (mirror)
| Name | Purpose |
|---|---|
| `CARE_INGEST_KEY` | Same shared secret; used as outbound Bearer + to sign inbound calls to Care. |
| `CARE_BASE_URL` | Base URL of the Care API (origin for the `/api/v1/ingest/*` routes). |
| `MYKEYZ_CARE_WEBHOOK_SECRET` | Same shared secret; used to verify return webhooks from Care. |

All keys are read from `process.env.*` only. Never printed, logged, committed, or echoed.

---

## 7. Security Rules

- **Constant-time compare.** Compare every signature with `crypto.timingSafeEqual` (or
  equivalent), never `===`. Length-check first to avoid throwing.
- **Sign/verify the raw body.** HMAC covers the exact raw request bytes. Capture the raw
  body before JSON re-parsing; serialize once and send the bytes you signed.
- **Never log the customer phone, supplier phone, or any secret.** Not in app logs, error
  traces, analytics, or docs.
- **No price crosses the bridge except supplier quote amounts, Care → MyKeyz.** MyKeyz
  never sends a price into Care.
- **Idempotent inbound.** Key on `external_ref`; re-ingest is a safe no-op returning the
  existing job.
- **Bridge fails closed.** Missing Care key ⇒ 503 inbound; missing webhook URL/secret ⇒
  silent outbound no-op (never a partial, unsigned send).

---

## 8. MyKeyz-side (Phase C) — IMPLEMENTED on branch `feat/care-bridge`

Status: the MyKeyz side below is BUILT and verified end-to-end against a live Care backend (21/21 bridge
E2E checks: defect → `/v1/vendors/quote` → queued push → Care job (trade+area mapped, supplier matched)
→ supplier quote → signed return webhook → `care_quotes` + inbox `care_offers` → tenant select → Care
`assigned`, quote `won`). Not yet deployed — gated on QA + Railway env.

MyKeyz-side files (repo `/Users/claude/Documents/mykeyz`):
- `backend/src/services/careBridge.ts` — `pushLeadToCare` (trade map MyKeyz→Care + severity + area
  derivation, signed POST, idempotent) and `selectCareQuote`. Bridge enabled only when
  `CARE_INGEST_URL` + `CARE_INGEST_KEY` are set.
- `backend/src/services/careJobHandlers.ts` + `jobHandlers.ts` — `care_push_lead` queue handler (retried).
- `backend/src/migrations/0150_care_bridge.sql` — `service_leads.care_*` columns + `care_quotes` table.
- `backend/src/routes/careWebhook.ts` — root-mounted `POST /webhooks/care`, HMAC-verified, upserts
  `care_quotes` + posts the inbox `care_offers` message.
- `backend/src/routes/vendors.ts` — `/vendors/quote` accepts a direct `issueId`; `GET
  /v1/vendors/leads/:id/care-quotes` + `POST /v1/vendors/leads/:id/select-care`.
- `backend/src/services/serviceMarketplace.ts` — `requestQuote` enqueues the Care push and skips the
  legacy demo-vendor offers when the bridge is enabled (flag-gated cutover; the demo `service_partners`
  path stays dormant until the bridge is proven in prod, then removed).
- Mobile: `src/services/vendors.ts` (`requestQuote({issueId})`, `getCareQuotes`, `selectCareQuote`),
  `app/(inspection)/edit-defect.tsx` ("Get a professional" + consent sheet),
  `app/(main)/inbox.tsx` (`care_offers` rendering + select).

Known infra note (NOT a bridge bug): a fresh local DB can't run the app's migration runner because its
CONCURRENTLY-path naive `;`-split breaks a later `$$ … $$` DO-block migration (prod is unaffected — warm
DB). Worked around for local E2E by applying migrations via `psql` (which parses `$$`) and recording them
in `_migrations`. Worth a separate SYSTEMS fix to the runner's splitter.

### Original design checklist (now implemented above)

1. **Trade mapping.** Map each MyKeyz defect/issue category to a Care `trade_category`
   (e.g. `paint_damage` → `painting`) and resolve `location_area` from the property
   address. Maintain this map as the canonical translation layer.
2. **Push on requestQuote.** When the customer taps "Get quotes" on a defect/issue, build
   the `IngestJobSchema` payload (using the service-lead id as `external_ref`), sign it,
   and `POST /api/v1/ingest/jobs`. Store the returned `job_id` against the lead.
3. **Receive webhook → vendor_bid.** Add a public, signature-verified endpoint at
   `MYKEYZ_CARE_WEBHOOK_URL`. On each `quote.*` event, upsert the quote into a
   `vendor_bid` row keyed by `(job_id, quote.id)`; on `quote.withdrawn`, mark it
   withdrawn. On `job.status`, sync the lead status.
4. **Push selection.** When the customer picks a bid, `POST .../by-ref/:ref/select` with
   `{quote_id}` (signed), and reflect the `assigned` + `winning_quote_id` result in the UI.
5. **Deprecate the local demo vendor stub.** Remove the placeholder/mock vendor-bid
   generator once real Care quotes flow through the bridge. Per the iron rule, delete the
   superseded stub code, not leave it dormant.
6. **Reconciliation.** On app focus / missed-webhook recovery, `GET .../by-ref/:ref` to
   resync the job + quotes snapshot.

---

## 9. Quick Reference

| Direction | Method + Path | Auth | Body signed |
|---|---|---|---|
| In | `POST /api/v1/ingest/jobs` | Bearer + HMAC | yes |
| In | `GET /api/v1/ingest/jobs/by-ref/:ref` | Bearer | no |
| In | `POST /api/v1/ingest/jobs/by-ref/:ref/select` | Bearer + HMAC | yes |
| In | `POST /api/v1/ingest/jobs/by-ref/:ref/withdraw` | Bearer + HMAC | yes |
| Out | `POST <MYKEYZ_CARE_WEBHOOK_URL>` | HMAC (`MYKEYZ_CARE_WEBHOOK_SECRET`) | yes |

Join key: `external_ref` = MyKeyz service-lead id. Idempotent on re-ingest.

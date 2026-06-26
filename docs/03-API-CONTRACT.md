# 03 - API Contract

Base URL:

- Production: `https://care-api.mykeyz.io`
- Fallback: Railway domain only for emergency/debug use.

Authentication:

- Bearer JWT for app requests.
- Refresh token or equivalent session renewal must be added.
- Admin endpoints require separate admin role.

Response format:

- Success: resource JSON or `{ data, meta }` for paginated lists.
- Error: `{ error: string, message?: string, details?: unknown }`.
- Errors must be stable machine-readable codes.

## Existing Endpoints To Keep And Harden

`POST /api/v1/auth/request-otp`

- Request: `{ phone: string }`
- Response: `{ expires_in: number }`
- Required change: send real OTP through provider and rate-limit.

`POST /api/v1/auth/verify-otp`

- Request: `{ phone: string, code: string }`
- Response: `{ token: string, refresh_token: string, supplier: Supplier }`
- Required change: remove fixed codes and create real supplier/user identity.

`GET /api/v1/supplier/me`

- Response: `Supplier`
- Required change: include verification status, language, plan entitlement, profile completion, and permissions.

`PUT /api/v1/supplier/me`

- Request: partial supplier profile.
- Response: `Supplier`
- Required change: validate allowed fields and create audit events.

`GET /api/v1/jobs`

- Response: matched jobs only.
- Required change: enforce matching rules server-side.

`GET /api/v1/jobs/:id`

- Response: job detail, inspection insight, quote summary, my quote, reveal eligibility.
- Required change: do not expose competitor prices unless revealed.

`POST /api/v1/jobs/:id/quotes`

- Request: `{ amount, availability, available_date?, note?, language? }`
- Response: `Quote`
- Required change: enforce verification, deadline, duplicate, status, and quote range rules.

`PUT /api/v1/jobs/:id/quotes/:quoteId`

- Request: editable quote fields.
- Response: `Quote`
- Required change: allow only before selection/deadline.

`POST /api/v1/jobs/:id/reveals`

- Response: `{ revealed_amount, charged_credits, reveals_remaining }`
- Required change: use reveal ledger and entitlement system.

`GET /api/v1/conversations`

- Response: conversations for supplier.
- Required change: include translated preview and unread state.

`GET /api/v1/conversations/:id/messages`

- Response: `{ messages, has_more }`
- Required change: pagination and authorization checks.

`POST /api/v1/conversations/:id/messages`

- Request: `{ body, language }`
- Response: `Message`
- Required change: translation pipeline and moderation hooks.

`GET /api/v1/supplier/me/earnings`

- Response: ledger-derived summary.
- Required change: remove hardcoded response.

`POST /api/v1/upload/presign`

- Request: `{ file_type, content_type }`
- Response: `{ upload_url, public_url, mode }`
- Required change: file type allowlist, size policy, document linkage.

## New Provider Endpoints Required

`POST /api/v1/auth/refresh`

- Refreshes app session.

`POST /api/v1/auth/logout`

- Revokes current refresh token.

`PUT /api/v1/supplier/me/language`

- Stores preferred language.

`PUT /api/v1/supplier/me/trades`

- Stores selected trades.

`PUT /api/v1/supplier/me/service-areas`

- Stores coverage areas.

`POST /api/v1/supplier/me/documents`

- Links uploaded document to supplier.

`POST /api/v1/supplier/me/verification-submit`

- Moves supplier to submitted verification state.

`GET /api/v1/supplier/me/verification`

- Returns current verification status and reason.

`GET /api/v1/supplier/me/availability`

- Lists availability slots.

`PUT /api/v1/supplier/me/availability`

- Replaces or patches availability.

`POST /api/v1/jobs/:id/quotes/:quoteId/withdraw`

- Withdraws a quote before rules lock it.

`GET /api/v1/jobs/:id/price-guidance`

- Returns historical price range allowed for the provider.

`POST /api/v1/jobs/:id/complete-request`

- Provider requests completion.

`POST /api/v1/iap/receipts`

- Validates Apple receipt and updates entitlement.

`GET /api/v1/supplier/me/subscription`

- Returns active plan and benefits.

## New Admin Endpoints Required

All admin endpoints require admin JWT and audit logging.

`GET /api/v1/admin/suppliers`

`GET /api/v1/admin/suppliers/:id`

`POST /api/v1/admin/suppliers/:id/verification/approve`

`POST /api/v1/admin/suppliers/:id/verification/reject`

`POST /api/v1/admin/suppliers/:id/verification/request-changes`

`GET /api/v1/admin/jobs`

`GET /api/v1/admin/jobs/:id`

`POST /api/v1/admin/jobs`

`POST /api/v1/admin/jobs/:id/select-quote`

`GET /api/v1/admin/conversations/:id`

`GET /api/v1/admin/earnings`

`GET /api/v1/admin/commission-ledger`

`GET /api/v1/admin/reveal-events`

`GET /api/v1/admin/audit-logs`

## Core Types

Supplier:

- `id`
- `phone`
- `full_name`
- `business_name`
- `trade_license_number`
- `preferred_language`
- `trades`
- `coverage_areas`
- `verification_status`
- `plan`
- `reveals_remaining`
- `is_onboarded`
- `photo_url`

Job:

- `id`
- `source`
- `service_type`
- `trade_category`
- `location_area`
- `location_address_masked`
- `description`
- `findings`
- `estimated_value_min`
- `estimated_value_max`
- `job_type`
- `status`
- `quote_deadline`

Quote:

- `id`
- `job_id`
- `supplier_id`
- `amount`
- `availability`
- `available_date`
- `note`
- `status`
- `created_at`
- `updated_at`

RevealEvent:

- `id`
- `supplier_id`
- `job_id`
- `quote_id`
- `credit_source`
- `revealed_amount`
- `charged_credits`
- `created_at`

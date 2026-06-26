# 04 - Database Model

Use migrations, not inline schema creation, for production database changes.

## Identity And Auth

`supplier_users`

- `id`
- `supplier_id`
- `phone`
- `role`: owner, worker
- `preferred_language`
- `status`: active, blocked, deleted
- `created_at`
- `updated_at`

`otp_attempts`

- `id`
- `phone`
- `channel`: whatsapp, sms
- `hashed_code`
- `expires_at`
- `attempt_count`
- `status`: pending, verified, expired, blocked
- `created_at`

`sessions`

- `id`
- `supplier_user_id`
- `refresh_token_hash`
- `expires_at`
- `revoked_at`
- `created_at`

## Supplier Profile

`suppliers`

- `id`
- `business_name`
- `full_name`
- `phone`
- `trade_license_number`
- `preferred_language`
- `verification_status`: draft, submitted, needs_changes, approved, rejected, suspended
- `plan`
- `rating`
- `review_count`
- `is_onboarded`
- `photo_url`
- `created_at`
- `updated_at`

`supplier_trades`

- `supplier_id`
- `trade_key`

`supplier_service_areas`

- `supplier_id`
- `area_key`

`supplier_documents`

- `id`
- `supplier_id`
- `type`: trade_license, emirates_id, insurance, work_photo
- `public_url`
- `storage_key`
- `status`: uploaded, approved, rejected
- `review_note`
- `created_at`

`verification_reviews`

- `id`
- `supplier_id`
- `admin_id`
- `decision`: approved, rejected, needs_changes
- `reason`
- `created_at`

## Jobs And Findings

`jobs`

- `id`
- `source`: inspection, care_hub, admin
- `customer_id`
- `property_id`
- `service_type`
- `trade_category`
- `location_area`
- `location_address_masked`
- `description`
- `estimated_value_min`
- `estimated_value_max`
- `job_type`: instant, tender
- `status`: open, quoting, assigned, active, completion_requested, completed, cancelled, expired
- `quote_deadline`
- `selected_quote_id`
- `created_at`
- `updated_at`

`job_findings`

- `id`
- `job_id`
- `room`
- `finding_type`
- `description`
- `severity`
- `photo_url`
- `created_at`

`job_matches`

- `id`
- `job_id`
- `supplier_id`
- `rank_score`
- `reason`
- `status`: visible, hidden, expired
- `created_at`

## Quotes

`quotes`

- `id`
- `job_id`
- `supplier_id`
- `amount`
- `availability`
- `available_date`
- `note`
- `status`: draft, submitted, revised, withdrawn, selected, rejected, expired
- `created_at`
- `updated_at`

`quote_events`

- `id`
- `quote_id`
- `job_id`
- `supplier_id`
- `event_type`
- `payload`
- `created_at`

## Reveals

`reveal_wallets`

- `supplier_id`
- `included_balance`
- `purchased_balance`
- `unlimited_until`
- `updated_at`

`reveal_events`

- `id`
- `supplier_id`
- `job_id`
- `quote_id`
- `credit_source`: included, purchased, unlimited
- `revealed_amount`
- `charged_credits`
- `created_at`

## Conversations

`conversations`

- `id`
- `job_id`
- `supplier_id`
- `customer_id`
- `customer_name`
- `status`: open, closed, blocked
- `last_message`
- `last_message_at`
- `unread_count_supplier`
- `unread_count_customer`

`messages`

- `id`
- `conversation_id`
- `sender_type`: supplier, customer, admin, system
- `sender_id`
- `body`
- `original_body`
- `translated_body`
- `source_language`
- `target_language`
- `status`: sent, delivered, read, failed, blocked
- `created_at`

## Earnings And Commission

`earnings_ledger`

- `id`
- `supplier_id`
- `job_id`
- `quote_id`
- `gross_amount`
- `commission_amount`
- `net_amount`
- `status`: pending, confirmed, paid, disputed
- `created_at`

`commission_ledger`

- `id`
- `supplier_id`
- `job_id`
- `quote_id`
- `amount`
- `status`: owed, invoiced, paid, overdue, disputed
- `invoice_id`
- `created_at`

`invoices`

- `id`
- `supplier_id`
- `amount`
- `status`: draft, sent, paid, overdue, void
- `external_invoice_id`
- `created_at`

## Plans And IAP

`subscription_plans`

- `id`
- `name`
- `price_aed`
- `apple_product_id`
- `included_reveals`
- `benefits`
- `active`

`supplier_subscriptions`

- `id`
- `supplier_id`
- `plan_id`
- `source`: apple_iap, admin, manual
- `status`: active, expired, cancelled, grace_period
- `current_period_end`
- `created_at`

`iap_receipt_events`

- `id`
- `supplier_id`
- `apple_product_id`
- `transaction_id`
- `status`
- `raw_status`
- `created_at`

## Operations

`admin_users`

- `id`
- `email`
- `role`
- `status`
- `created_at`

`audit_logs`

- `id`
- `actor_type`
- `actor_id`
- `entity_type`
- `entity_id`
- `action`
- `payload`
- `created_at`

`fraud_signals`

- `id`
- `supplier_id`
- `job_id`
- `signal_type`
- `severity`
- `payload`
- `status`
- `created_at`

## State Machine Rules

Supplier:

- `draft -> submitted -> approved`
- `submitted -> needs_changes -> submitted`
- `submitted -> rejected`
- `approved -> suspended`

Job:

- `open -> quoting -> assigned -> active -> completion_requested -> completed`
- `open -> expired`
- any pre-completion state can move to `cancelled` by admin/system rule

Quote:

- `draft -> submitted`
- `submitted -> revised`
- `submitted/revised -> withdrawn`
- `submitted/revised -> selected`
- non-selected quotes become `rejected` after customer selection
- open quotes become `expired` after deadline

# Sprint 9 — Plans & IAP Entitlements

Goal: a provider's plan tier and reveal-credit balance become a **server-authoritative entitlement** that
is granted ONLY by a validated Apple/Google in-app purchase, never trusted from the client. We add a
canonical `subscription_plans` catalog (tier, price, included_reveals, ranking_weight) and a
`supplier_subscriptions` ledger (supplier_id, plan, store, original_transaction_id, status, expires_at).
The mobile `plans` and `credits`/`reveal` screens stop deciding anything locally: they render whatever the
backend says the provider is entitled to. When a provider completes an Apple/Google IAP, the receipt is
validated server-side; on success the backend applies the plan benefits itself — it grants the plan's
`included_reveals` into the Sprint 6 `reveal_events` ledger (bumping `suppliers.reveals_remaining`) and persists
the plan tier, so the job-matching `rank_score` reads the plan's `ranking_weight` instead of a hardcoded
`case`. The 402 `iap_product_id` hint that already exists on the reveal endpoint becomes the entry point of
a real validated purchase loop.

Payment is Apple/Google IN-APP PURCHASE ONLY — there are NO cards, NO bank/IBAN, NO payout flow. The
platform never pays the provider; the provider pays the platform via the store, and separately owes a lead
commission settled outside Care. Out of scope (later sprints): the leak/disintermediation detector and
supplier-only enforcement (Sprint 7 chat); customer-side winning-quote selection (stays in /admin / future
main-app bridge); App Store Server Notifications-driven dunning/grace-period UX beyond status persistence;
proration / mid-cycle plan-change math; refunds reconciliation beyond marking a subscription `revoked`.

## Phase A — Backend entitlement spine (sequential, me) — repo: mykeyz-care-api

- [x] A1 data.ts — add `SubscriptionPlan` (tier, price_aed, included_reveals, ranking_weight, active) and `SupplierSubscription` (id, supplier_id, plan, store 'apple'|'google', original_transaction_id, product_id, status 'active'|'expired'|'revoked', expires_at, created_at) types; add `Entitlement` type (plan, reveals_remaining, subscription{status,expires_at,store}|null)
- [x] A2 config.ts — add `iap` block: `apple` { bundleId, keyId, issuerId, privateKey, environment 'sandbox'|'production' } from APPLE_IAP_* env, and `google` { packageName, serviceAccountJson } from GOOGLE_PLAY_* env (parity path, may be empty in dev)
- [x] A3 db.ts initializeDatabase() — create table `subscription_plans` (tier text primary key, price_aed integer not null, included_reveals integer not null default 0, ranking_weight numeric not null default 1, active boolean not null default true) and seed canonical rows idempotently: minimal(0,0,1), standard(price,N,2), premium(price,M,3) via `on conflict (tier) do update`
- [x] A4 db.ts initializeDatabase() — create table `supplier_subscriptions` (id text pk, supplier_id text references suppliers(id) on delete cascade, plan text references subscription_plans(tier), store text check in ('apple','google'), original_transaction_id text, product_id text, status text check in ('active','expired','revoked') default 'active', expires_at timestamptz, created_at timestamptz default now(), unique (store, original_transaction_id)); index on (supplier_id, status)
- [x] A4b db.ts initializeDatabase() — extend the Sprint 6 `reveal_events` ledger for paid grants: `alter table reveal_events add column if not exists external_ref text` + `create unique index if not exists reveal_events_external_ref_uq on reveal_events (external_ref) where external_ref is not null`, so a validated IAP reveal/plan grant is idempotent PER STORE TRANSACTION — independent of, and never colliding with, S6's `(supplier_id, plan)` `plan_grant` partial-unique
- [x] A5 db.ts — `listActivePlans()` and `getPlan(tier)` reading `subscription_plans`; `getSupplierSubscription(supplierId)` (latest active row or null)
- [x] A6 db.ts — replace the hardcoded `case s.plan when 'premium' then 3 ...` inside `MATCH_SELECT` with `(s.rating * 10 + coalesce((select ranking_weight from subscription_plans p where p.tier = s.plan), 1))`; matching now reads ranking_weight server-side (recompute paths in computeMatchesForJob / recomputeMatchesForSupplier unchanged)
- [x] A7 db.ts — `applyPlanEntitlement(supplierId, tier, source, externalRef)`: in one tx set `suppliers.plan = tier`; grant the tier's `included_reveals` into the Sprint 6 `reveal_events` ledger as ONE row with `type='purchase'`, `reason='subscription_grant'`, `plan=tier`, `external_ref = externalRef` (the store `original_transaction_id`), `on conflict (external_ref) do nothing`, and ONLY when a row was actually inserted `update suppliers set reveals_remaining = reveals_remaining + included_reveals`; write an `audit_logs` row (`entitlement.apply`); returns the fresh `Entitlement`. NOTE: this paid grant is DISTINCT from S6's free one-time `plan_grant` (unique per `(supplier_id, plan)`) — paid grants are idempotent per transaction via `external_ref`, so renewals grant once each and never collide with the S6 partial-unique
- [x] A8 db.ts — `recordIapTransaction({supplierId, store, originalTransactionId, productId, plan, status, expiresAt})`: upsert `supplier_subscriptions` on `(store, original_transaction_id)`; idempotent (re-validating the same transaction must NOT double-grant)
- [x] A9 db.ts — `getEntitlement(supplierId)`: server-authoritative read returning { plan, reveals_remaining, ranking_weight, subscription: getSupplierSubscription(...) }; never derived from client input
- [x] A10 appstore.ts (NEW) — `verifyAppleTransaction(signedTransaction)`: validate via Apple App Store Server API (JWS verification against Apple root certs + decode), return { originalTransactionId, productId, expiresDate, revoked }; map `product_id` → plan tier or reveal pack via a `PRODUCT_MAP` constant (e.g. `care_plan_standard`, `care_plan_premium`, `care_reveal_single`); add a `verifyGoogleTransaction` parity stub wired to the android purchase-token path noted in A2
- [x] A11 index.ts — `GET /api/v1/plans` (public-after-auth catalog from `listActivePlans()`) and `GET /api/v1/supplier/me/entitlement` (returns `getEntitlement(req.supplierId)`); plan/reveal balance now flow only from these
- [x] A12 index.ts — `POST /api/v1/supplier/me/iap/apple` { signed_transaction }: verify via appstore.ts → `recordIapTransaction` → if plan product `applyPlanEntitlement(..., originalTransactionId)`, if reveal pack grant the pack into `reveal_events` (`type='purchase'`, `reason='iap_reveal_pack'`, `external_ref = originalTransactionId`, `on conflict (external_ref) do nothing`); respond 200 with fresh entitlement, 400 `invalid_receipt`, 409 `already_processed`; add sibling `POST .../iap/google` { purchase_token, product_id } parity route
- [x] A13 index.ts — `POST /api/v1/iap/apple/notifications` App Store Server Notifications V2 webhook (signed payload): on DID_RENEW/EXPIRED/REVOKE update `supplier_subscriptions.status` + `expires_at` so entitlement stays server-truth without a client call; keep reveal 402 `iap_product_id` hint pointing at `care_reveal_single`
- [x] A14 typecheck green (`npm run build`) + live smoke: seed → buy plan (POST iap/apple with a sandbox/stub signed transaction) → entitlement reflects new plan + reveals_remaining → matching rank_score uses ranking_weight → replay same transaction returns 409 and grants nothing

## Phase B — Workflow fan-out (against frozen contract)

- [x] B1 (agent) mobile: `src/services/api.ts` add `getPlans()`, `getEntitlement()`, `submitApplePurchase()`, `submitGooglePurchase()`; remove any client-side plan/credit math
- [x] B2 (agent) mobile: `app/plans.tsx` renders catalog from `/plans` and marks the current tier from `/supplier/me/entitlement` (server truth); purchase button → store IAP → POST validate → refetch entitlement
- [x] B3 (agent) mobile: `app/credits.tsx` + `app/reveal/*` show `reveals_remaining` from entitlement only; on 402 launch the `care_reveal_single` IAP → POST validate → refetch (never decrement locally)
- [x] B4 (agent) scripts/e2e-plans.mjs (npm run e2e:plans): seed → GET /plans → buy plan via iap/apple stub → assert entitlement plan+reveals changed server-side → assert spoofed client plan/credits are ignored → replay transaction is idempotent (409, no double grant)
- [x] B5 (agent) Control Panel admin.html: Plans/Subscriptions tab — view plan catalog (read-only), view a supplier's active subscription + entitlement, and an audited manual entitlement override (calls an admin-only apply route)
- [x] B6 (agent) docs: 00-REALITY-AUDIT delta — entitlement is server-authoritative; IAP-only; no cards/IBAN/payout; ranking_weight + reveal credits come from validated purchases
- [x] B7 (Opus verify) adversarial: typechecks; a client cannot set its own plan/reveals via PUT /supplier/me or any body; ranking_weight cannot be spoofed; replayed/forged receipts grant nothing; entitlement endpoint matches DB truth

## Phase C — Verify + ship

- [x] C1 local PG (docker postgres:16 :55432, DATABASE_URL=postgresql://postgres:care@localhost:55432/care) + API (ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=smoke-pass-123, npm run dev :4000); all E2E green: auth (26), onboarding (38), admin (45), matching (65), plans (new); manual buy-plan → entitlement → rank check
- [x] C2 commit + push both repos (mykeyz-care-api, mykeyz-care)

## Acceptance

- The mobile plan screen reflects the **backend** entitlement: the current tier and reveal balance come from `GET /supplier/me/entitlement`, not from any local state or purchase response the client constructs.
- Reveal credits and matching rank cannot be spoofed from the client: `reveals_remaining` only increases via a validated IAP grant into the `reveal_events` ledger, and `rank_score` reads `subscription_plans.ranking_weight` for the supplier's server-stored plan — no client field can change either.
- Plan benefits are applied server-side: a validated Apple (and Google-parity) purchase sets `suppliers.plan` and grants `included_reveals` into `reveal_events`, idempotently per `original_transaction_id` via the `external_ref` unique index (replays and renewals never double-grant, and never collide with S6's free one-time `plan_grant`).
- The plan catalog and a supplier's entitlement/subscription are visible in the Control Panel; renewals/expiries from App Store Server Notifications keep the stored subscription status current without trusting the client.

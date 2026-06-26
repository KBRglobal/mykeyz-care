# Sprint 6 — Reveal Ledger

Goal: make the reveal economy server-authoritative and auditable, and close the competitor-amount
leak. A provider has a **reveal wallet** (`suppliers.reveals_remaining` stays the single
authoritative balance) backed by an append-only **`reveal_events`** ledger that records every credit
grant (plan-included reveals), every debit (a job reveal), and every purchase (a single extra reveal
bought via Apple/Google IAP). The competitor's quoted amount (`jobs.competitor_amount`) is NEVER
returned in the `/jobs` list or the `/jobs/:id` detail unless that provider holds an authorized
reveal for that exact job — today both endpoints leak it through `jobFromRow()`. Extra reveals are
bought ONLY through the in-app store; this sprint ships the **placeholder purchase contract** (records
the event, grants the credit, returns `iap_product_id: 'care_reveal_single'`) with NO payment
validation — real receipt validation is Sprint 9.

Out of scope (later sprints): real Apple/Google receipt validation and plan-upgrade IAP (Sprint 9);
the chat anti-disintermediation / leakage detector (Sprint 7); any provider payout / bank / IBAN flow
(the platform never pays providers — it charges a lead commission, collected out-of-band, and IAP is
the only money path inside Care); true customer-side selection of a winning quote (future main-app
bridge — selection stays in the owner Control Panel for now).

## Phase A — Backend reveal-ledger spine (sequential, me) — repo: mykeyz-care-api

- [ ] A1 data.ts — add `RevealEventType = 'plan_grant' | 'reveal_debit' | 'purchase'`; `RevealEvent` type (id, supplier_id, job_id: string|null, type, delta, balance_after, reason, plan: string|null, iap_product_id: string|null, created_at); `RevealWallet` type ({ reveals_remaining, granted_total, debited_total, purchased_total, events: RevealEvent[] }); change `Job.competitor_amount` from `number` to `number | null` and add `competitor_amount_revealed: boolean`
- [ ] A2 db.ts — in `initializeDatabase()` add a `create table if not exists reveal_events (id text pk, supplier_id text references suppliers on delete cascade, job_id text references jobs on delete cascade null, type text check in (plan_grant,reveal_debit,purchase), delta integer not null, balance_after integer not null, reason text, plan text, iap_product_id text, created_at timestamptz default now())` + `create index reveal_events_supplier_idx on reveal_events (supplier_id, created_at desc)`; add a partial `unique index reveal_events_plan_grant_uq on reveal_events (supplier_id, plan) where type = 'plan_grant'` so a plan grant is idempotent
- [ ] A3 db.ts — add module constant `PLAN_INCLUDED_REVEALS: Record<string, number> = { minimal: 0, standard: 5, premium: 10 }`; add `revealEventFromRow(row)` mapper
- [ ] A4 db.ts — `jobFromRow()`: set `competitor_amount: row.competitor_amount == null ? null : Number(row.competitor_amount)` and `competitor_amount_revealed: Boolean(row.competitor_amount_revealed)` (default false) so a null/stripped amount round-trips cleanly
- [ ] A5 db.ts — `hasAuthorizedReveal(jobId, supplierId)`: `select 1 from reveals where job_id = $1 and supplier_id = $2`; returns boolean (the authorization gate used by both the list and detail strippers)
- [ ] A6 db.ts — FIX THE LIST LEAK: in `listMatchedJobs(supplierId)` add `exists(select 1 from reveals r where r.job_id = j.id and r.supplier_id = $1) as revealed` to the select, and in the `.map(...)` set `competitor_amount: row.revealed ? Number(row.competitor_amount) : null` and `competitor_amount_revealed: Boolean(row.revealed)` — the feed never carries an unrevealed amount
- [ ] A7 db.ts — `applyPlanReveals(supplierId)`: read the supplier's `plan`, look up `PLAN_INCLUDED_REVEALS[plan]`; if `> 0`, in one transaction insert a `reveal_events` row (`type='plan_grant'`, `delta = included`, `plan = plan`, `reason = 'plan_included'`) `on conflict (supplier_id, plan) do nothing` and, only when a row was actually inserted, `update suppliers set reveals_remaining = reveals_remaining + $included`; compute and store `balance_after`; returns the updated `RevealWallet`. Idempotent — re-running never double-grants
- [ ] A8 db.ts — `decideVerification()`: in the `if (map.status === "approved")` block (right beside `recomputeMatchesForSupplier`), also call `await applyPlanReveals(id)` so a newly-approved provider receives their plan-included reveals once
- [ ] A9 db.ts — `revealJobPrice(job, supplierId)`: when a credit is actually charged (the `!existing.rows[0]` branch), inside the SAME transaction insert a `reveal_events` row (`type='reveal_debit'`, `job_id = job.id`, `delta = -1`, `balance_after = supplier.reveals_remaining` after decrement, `reason = 'job_reveal'`); keep `reveals_remaining` authoritative and keep returning `revealed_amount: job.competitor_amount`; extend the return with the new `reveals_remaining`
- [ ] A10 db.ts — `purchaseRevealPlaceholder(supplierId, productId)`: PLACEHOLDER contract only (no receipt validation — Sprint 9). For `productId === 'care_reveal_single'` grant `+1` in one transaction: insert `reveal_events` (`type='purchase'`, `delta=+1`, `iap_product_id = productId`, `reason='iap_placeholder'`, `balance_after`) + `update suppliers set reveals_remaining = reveals_remaining + 1`; returns the updated `RevealWallet`. Reject unknown product ids with `{ error: 'unknown_product' }`
- [ ] A11 db.ts — `getRevealWallet(supplierId)`: returns `{ reveals_remaining (from suppliers, authoritative), granted_total, debited_total, purchased_total (summed from reveal_events by type), events: last 50 reveal_events desc }`
- [ ] A12 index.ts — FIX THE DETAIL LEAK in `GET /jobs/:id`: after the match/quote gate, compute `const revealed = await hasAuthorizedReveal(job.id, req.supplierId!)`; if `!revealed` set `job.competitor_amount = null`; set `job.competitor_amount_revealed = revealed`; respond with the stripped job (detail never leaks an unrevealed amount)
- [ ] A13 index.ts — extend `POST /jobs/:id/reveals`: on success return `{ ...revealed, wallet: await getRevealWallet(req.supplierId!) }`; keep the existing `402 { error:'no_credits', iap_product_id:'care_reveal_single' }` when out of credits (this is the upsell into the placeholder purchase)
- [ ] A14 index.ts — add `GET /supplier/me/reveals` → `res.json(await getRevealWallet(req.supplierId!))` (wallet balance + ledger events; under the authenticated `router`)
- [ ] A15 index.ts — add `POST /supplier/me/reveals/purchase` (zod body `{ iap_product_id: z.enum(['care_reveal_single']) }`): call `purchaseRevealPlaceholder`; on `unknown_product` return `400`; else `res.status(201).json(wallet)`. Comment it explicitly: `// PLACEHOLDER — Apple/Google receipt validation lands in Sprint 9; this only records the grant.`
- [ ] A16 typecheck green (`npm run typecheck` both behaviors) + live smoke: approve a standard-plan supplier → wallet shows 5 granted; `/jobs` feed has `competitor_amount: null`; `/jobs/:id` detail has `competitor_amount: null`; POST `/jobs/:id/reveals` → 201, amount revealed, debit event, balance 4, and a re-GET of that job now returns the real `competitor_amount`; drain credits → 402 with `iap_product_id`; POST purchase → 201, balance +1, purchase event

## Phase B — Workflow fan-out (against frozen contract)

- [ ] B1 (agent) mobile: `src/services/api.ts` — add `getReveals()` → `RevealWallet`, `purchaseReveal()` → POST `/supplier/me/reveals/purchase`; update `revealPrice()` return to include `wallet`; change `ApiJob.competitor_amount` to `number | null` and add `competitor_amount_revealed: boolean`
- [ ] B2 (agent) mobile: `app/job/[id].tsx` — hide the competitor amount until `competitor_amount_revealed`; add a "Reveal competitor budget" action that calls `revealPrice` and shows the amount + remaining balance; on `402` surface the single-reveal purchase (placeholder) CTA wired to `purchaseReveal`; show `reveals_remaining` from the wallet
- [ ] B3 (agent) mobile: reveal-balance surface — show `reveals_remaining` on the jobs feed / profile header from `getReveals()`; never compute balance client-side (display the server number only)
- [ ] B4 (agent) scripts/e2e-reveals.mjs + `"e2e:reveals": "node scripts/e2e-reveals.mjs"` in package.json: approve a standard supplier → wallet granted=5; assert `/jobs` and `/jobs/:id` both return `competitor_amount: null` pre-reveal; reveal → 201 + amount + debit event + balance 4; re-GET detail returns real amount; drain to 0 → 402 `iap_product_id`; purchase placeholder → 201 + balance 1 + purchase event; assert ledger sums reconcile to `reveals_remaining`
- [ ] B5 (agent) Control Panel `public/admin.html`: on the supplier detail, show the reveal wallet (balance + a compact `reveal_events` ledger: grants / debits / purchases) read from the supplier admin detail or a small admin reveals read; no write controls
- [ ] B6 (agent) docs: `docs/00-REALITY-AUDIT.md` delta — reveal ledger is the source of truth, `reveals_remaining` authoritative, competitor amount no longer leaks, IAP-only purchase is a placeholder until Sprint 9
- [ ] B7 (Opus verify) adversarial: typechecks both repos; prove `/jobs` AND `/jobs/:id` return `competitor_amount: null` before any reveal (grep the responses); prove balance is server-only (no client arithmetic); prove ledger debit/grant/purchase sums reconcile to `reveals_remaining`; prove the purchase path takes no money and never touches a bank/IBAN field; prove re-reveal of an already-revealed job charges nothing and writes no new debit

## Phase C — Verify + ship

- [ ] C1 local PG (docker `postgres:16` on `55432`, `DATABASE_URL=postgresql://postgres:care@localhost:55432/care`) + API (`ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=smoke-pass-123 npm run dev` on `:4000`); run ALL E2E green incl. prior suites — `e2e:auth` (26), `e2e:onboarding` (38), `e2e:admin` (45), `e2e:matching` (65), and `e2e:reveals` (new); manual reveal → purchase → re-reveal walk
- [ ] C2 commit + push both repos (mykeyz-care-api, mykeyz-care)

## Acceptance

- The reveal balance is server-authoritative: `suppliers.reveals_remaining` is the only balance, every change is mirrored by a `reveal_events` row, and the client only ever displays the server number.
- No reveal leakage: `GET /jobs` and `GET /jobs/:id` return `competitor_amount: null` for any job the provider has not been authorized to reveal; the real amount appears only after a successful reveal for that exact job.
- Plan-included reveals are granted exactly once per plan (idempotent `plan_grant`) when a provider is approved.
- A job reveal debits one credit and writes a `reveal_debit` event; re-revealing an already-revealed job charges nothing and writes no new debit.
- Extra reveals are bought only via the Apple/Google IAP placeholder contract (`care_reveal_single`): it records a `purchase` event and grants the credit, takes no money, validates no receipt (Sprint 9), and never reads or stores any provider bank/IBAN/payout detail.
- The `reveal_events` ledger reconciles: `grants − debits + purchases == reveals_remaining`.

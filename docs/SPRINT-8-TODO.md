# Sprint 8 — Earnings & Commission

Goal: when a job is completed, the platform writes a permanent, double-sided money record — a GROSS
earnings entry (what the customer pays the provider, = the won quote amount), a COMMISSION entry (the
lead commission the provider OWES MyKeyz on that job), and a NET figure (gross − commission, what the
provider keeps) — and the provider's earnings screen plus the owner's Control Panel finance view both
read from those ledgers instead of hardcoded numbers. Money flows OUTSIDE the platform: the customer pays
the provider directly; MyKeyz only records the commission the provider owes and collects it later via
Apple/Google in-app purchase. The commission ledger is therefore an AMOUNT-OWED ledger (status
`unpaid`/`paid`), never a payout. Out of scope: actually charging/clearing the owed commission via IAP
(Sprint 9 plan/billing), provider bank/IBAN capture (NEVER — there is no payout flow), customer-side quote
selection (stays in /admin until the future main-app bridge), the chat leakage detector (Sprint 7), and
any refund/dispute reversal accounting.

## Phase A — Backend earnings spine (sequential, me) — repo: mykeyz-care-api

- [ ] A1 config.ts — add `leadCommissionRate: Number(process.env.LEAD_COMMISSION_RATE ?? 0.1)` (default 10%); single source of truth for the commission percentage
- [ ] A2 data.ts — add `EarningsLedgerEntry` (id, supplier_id, job_id, quote_id, gross_amount, net_amount, created_at) and `CommissionLedgerEntry` (id, supplier_id, job_id, quote_id, commission_amount, rate, status: 'unpaid'|'paid', created_at, paid_at) types; add `SupplierEarnings` response type (summary{this_week,this_month,total_gross,total_net,commission_owed} + weekly_chart[] + transactions[])
- [ ] A3 db.ts initializeDatabase() — append migration (after the Sprint 4 job_matches block, before the closing backtick): `create table if not exists earnings_ledger` (id pk, supplier_id refs suppliers on delete cascade, job_id refs jobs on delete cascade, quote_id text, gross_amount numeric not null, net_amount numeric not null, created_at timestamptz default now(), `unique (job_id, supplier_id)`) + index on (supplier_id, created_at desc); `create table if not exists commission_ledger` (same keys, commission_amount numeric not null, rate numeric not null, status text default 'unpaid' check in ('unpaid','paid'), paid_at timestamptz, created_at default now(), `unique (job_id, supplier_id)`) + index on (supplier_id, status)
- [ ] A4 db.ts completeSupplierJob(jobId, supplierId) — INSIDE the existing `begin`/`commit` transaction, after the `quotes set status='won'` update: read `gross = updatedQuote.amount`, compute `commission = Math.round(gross * config.leadCommissionRate)`, `net = gross - commission`; `insert into earnings_ledger (...) on conflict (job_id, supplier_id) do nothing`; `insert into commission_ledger (... rate=config.leadCommissionRate, status='unpaid') on conflict (job_id, supplier_id) do nothing` — so a re-completed job never double-books (idempotent)
- [ ] A5 db.ts completeSupplierJob — in the same transaction, write the audit row mirroring decideVerification's pattern: `insert into audit_logs (id, actor_type='supplier', actor_id=supplierId, entity_type='job', entity_id=jobId, action='job.completed', payload)` with payload `{gross, commission, net, rate}`
- [ ] A6 db.ts — add `getSupplierEarnings(supplierId)`: ledger-derived — total_gross/total_net from `sum(earnings_ledger)`, commission_owed from `sum(commission_ledger where status='unpaid')`, this_week/this_month from date-bucketed sums, weekly_chart from `date_trunc('week', created_at)` gross buckets, transactions from earnings_ledger join jobs (job name, completed_at, gross, commission, net) ordered created_at desc
- [ ] A7 db.ts — add `listSupplierCommissionOwed()`: per-supplier `sum(commission_amount) filter (where status='unpaid')` + business_name + unpaid job count, ordered by amount owed desc (Control Panel finance list); add `getSupplierCommissionDetail(supplierId)`: per-job breakdown rows (job name, completed_at, gross, commission, status) + totals
- [ ] A8 index.ts — REPLACE the hardcoded `GET /supplier/me/earnings` handler (currently returns static `summary`/`weekly_chart`/`transactions`) with `asyncHandler` → `res.json(await getSupplierEarnings(req.supplierId!))`; delete the static literal entirely (no dead fallback)
- [ ] A9 index.ts adminRouter — add `GET /admin/finance` → `{ data: await listSupplierCommissionOwed() }` and `GET /admin/finance/:supplierId` → `getSupplierCommissionDetail` (404 if none); mounted under the `adminRequired` guard like /admin/jobs
- [ ] A10 typecheck green (`npm run typecheck`) + live smoke: seed → approve supplier → create+match job → quote → POST /jobs/:id/complete → assert earnings_ledger + commission_ledger rows exist, GET /supplier/me/earnings returns ledger numbers (gross 450 → commission 45 → net 405 at 10%), GET /admin/finance shows the owed amount; re-POST complete → no duplicate rows

## Phase B — Workflow fan-out (against frozen contract)

- [ ] B1 (agent) mobile: earnings screen reads `GET /supplier/me/earnings` from the API (drop any mock/hardcoded totals); render summary cards (gross, net, commission owed), weekly chart, and the per-job transactions list (gross/commission/net) from the ledger response; empty state when no completed jobs
- [ ] B2 (agent) mobile: surface "Commission owed to MyKeyz" as a distinct line (it is money the provider OWES, not a payout) with copy that never implies the platform pays the provider; net is labelled "You keep"
- [ ] B3 (agent) scripts/e2e-earnings.mjs + `"e2e:earnings"` in package.json — full live flow: login → approve → create matched job → quote → complete → assert gross/commission/net in /supplier/me/earnings, assert ledger entry created once (idempotent re-complete), assert /admin/finance shows owed sum + per-job breakdown
- [ ] B4 (agent) Control Panel public/admin.html — add a Finance tab: list of suppliers with total commission owed (calls GET /admin/finance), click-through to per-supplier per-job breakdown (GET /admin/finance/:supplierId); read-only (collection happens via IAP, not here)
- [ ] B5 (agent) docs: 00-REALITY-AUDIT delta — earnings/commission now ledger-derived; record the business-model framing (gross=customer→provider, commission=provider→platform owed, net=provider keeps, no payout)
- [ ] B6 (Opus verify) adversarial: typechecks green; earnings endpoint is ledger-derived with NO static literal left; completion writes gross+commission+net atomically and idempotently; commission_ledger is an owed ledger (unpaid/paid, no payout/IBAN anywhere); admin finance sums match ledger; audit row written

## Phase C — Verify + ship

- [ ] C1 local PG (docker postgres:16 :55432, DATABASE_URL=postgresql://postgres:care@localhost:55432/care) + API on :4000 (ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=smoke-pass-123 npm run dev); run ALL E2E green — `e2e:auth` (26), `e2e:onboarding` (38), `e2e:admin` (45), `e2e:matching` (65), `e2e:earnings` (this sprint); manual: complete a job → see ledger numbers in app + owed amount in /admin
- [ ] C2 commit + push both repos (mykeyz-care-api + mykeyz-care)

## Acceptance

- Completing a job creates three records atomically: a GROSS earnings entry (= won quote amount), a
  COMMISSION entry (lead commission the provider owes the platform), and a NET figure (gross − commission).
- The provider earnings screen is ledger-derived — every number comes from earnings_ledger/commission_ledger,
  no hardcoded values remain in `GET /supplier/me/earnings`.
- Commission is recorded as money OWED by the provider (status `unpaid`), never as a platform payout; no
  bank/IBAN is ever stored.
- The Control Panel finance view shows total commission owed per supplier plus a per-job breakdown.
- Re-completing a job does not double-book either ledger (idempotent on job_id + supplier_id).

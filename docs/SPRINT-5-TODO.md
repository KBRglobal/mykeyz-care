# Sprint 5 — Quote Lifecycle

Goal: a job can now run a full, auditable quote competition. Multiple verified providers quote the
same open job; a provider may edit or withdraw their OWN quote while it is still pending and the job is
still open (edit-window rules); the owner picks the winning quote inside the Control Panel (`/admin`) —
that quote flips to `won`, every non-winning sibling flips to `lost` ("rejected"), the job moves to
`assigned` with `jobs.selected_quote_id` set, and the provider app shows clean won / lost / withdrawn
states. Every quote state change (submit, edit, withdraw, select, reject) is written to `audit_logs` as a
quote event, mirroring the `decideVerification` transaction + audit pattern. Selection is admin-only:
there is NO customer-facing app in Care, so the owner performs the customer's "choose this quote" action
in `/admin` for now (true customer-side selection is a future main-app bridge).

Out of scope (do NOT build here): the anti-disintermediation / chat-leakage detector (Sprint 7, chat —
supplier-only enforcement: mask + warn sender + send evidence to Control Panel + owner-manual-suspend,
never tenant revocation); the inspection→job bridge from the main MyKeyz app; availability calendar;
any IAP plan-upgrade / reveal-credit changes; any provider payout / bank / IBAN flow — the platform
NEVER pays the provider and NEVER stores their bank details; the provider is paid directly by the
customer and owes MyKeyz a lead commission, billed only via Apple/Google IAP.

Build method (must be followed): build the backend + mobile contract spine SEQUENTIALLY first and freeze
it (tsc green on both repos + one live smoke against local PG). THEN a Workflow fans out mobile wiring +
a live E2E script + Control Panel + docs + an Opus adversarial verify stage. Finally run ALL E2E suites
(auth 26, onboarding 38, admin 45, matching 65, + quote-lifecycle) and push both repos.

Local dev: docker `postgres:16` on port 55432, `DATABASE_URL=postgresql://postgres:care@localhost:55432/care`,
env `ALLOW_DEV_OTP=true SEED_DEMO_DATA=true ADMIN_PASSWORD=smoke-pass-123`, `npm run dev` on :4000.

## Phase A — Backend spine (sequential, me) — repo: mykeyz-care-api

- [ ] A1 data.ts — `Quote.status`: add `'withdrawn'` to the union (now `'pending' | 'shortlisted' | 'won' | 'lost' | 'withdrawn'`); `Job.status`: add `'assigned'` (now `'open' | 'assigned' | 'in_progress' | 'completed' | 'expired'`); add `Job.selected_quote_id: string | null`; add `QuoteEvent` type alias (= the existing `audit_logs` row shape returned by `listAuditLogs`) for the Control Panel.
- [ ] A2 db.ts (`initializeDatabase` SQL) — migration block after the Sprint 4 block: `alter table quotes drop constraint if exists quotes_status_check;` then `add constraint quotes_status_check check (status in ('pending','shortlisted','won','lost','withdrawn'));` — `alter table jobs drop constraint if exists jobs_status_check;` then re-add with `'assigned'` included — `alter table jobs add column if not exists selected_quote_id text references quotes(id);` — `create index if not exists quotes_job_status_idx on quotes (job_id, status);`
- [ ] A3 db.ts — `jobFromRow`: add `selected_quote_id: row.selected_quote_id ?? null` so every job payload carries the winner pointer.
- [ ] A4 db.ts — add a private `recordAudit(client, { actorType, actorId, entityType, entityId, action, payload })` helper that inserts one `audit_logs` row (extract the exact insert used inside `decideVerification`); use it for all quote events so the pattern is single-sourced.
- [ ] A5 db.ts — `editQuoteBySupplier(quoteId, jobId, supplierId, patch)`: transaction with `select ... for update`; guard ownership (`supplier_id = supplierId`), `status = 'pending'`, job still `'open'`, and edit window open (`quote_deadline is null or quote_deadline > now()`); on pass update `amount/availability/available_date/note` + `updated_at`, `recordAudit` action `'quote.edited'` payload `{ from, to }`; return `{ error: 'not_found' | 'not_editable' }` or `{ quote }`. (Replaces the unguarded generic `updateQuote` path for the supplier route.)
- [ ] A6 db.ts — `withdrawQuote(quoteId, jobId, supplierId)`: transaction with `for update`; guard ownership, `status = 'pending'`, job still `'open'`; set `status = 'withdrawn'`, `updated_at = now()`, `recordAudit` action `'quote.withdrawn'`; return `{ error: 'not_found' | 'not_withdrawable' }` or `{ quote }`.
- [ ] A7 db.ts — `selectWinningQuote(jobId, quoteId, adminId)`: transaction mirroring `decideVerification`; lock the job (`for update`), require `jobs.status = 'open'` and `selected_quote_id is null` else `{ error: 'job_not_open' }`; require the target quote belongs to the job and `status in ('pending','shortlisted')` else `{ error: 'quote_not_selectable' }`; set winner → `'won'`; set every sibling (`job_id=jobId and id<>quoteId and status in ('pending','shortlisted')`) → `'lost'`; set `jobs.status='assigned'`, `jobs.selected_quote_id=quoteId`, `updated_at=now()`; `update job_matches set status='hidden' where job_id=$1 and status='visible'` so the job leaves all feeds; `recordAudit` rows: `'quote.selected'` on the winner, `'quote.rejected'` per sibling, and `'job.assigned'` on the job (`entityType='job'`, payload `{ from:'open', to:'assigned', selected_quote_id }`); return `{ job, winner, rejected_count }`.
- [ ] A8 db.ts — `listJobQuotes(jobId)`: select all quotes for the job joined to `suppliers` for `business_name`/`full_name`/`rating`, ordered `amount asc, created_at asc`, so the Control Panel can rank and pick a winner; map via `quoteFromRow` + supplier fields.
- [ ] A9 index.ts (supplier `router`) — replace the thin `PUT /jobs/:id/quotes/:quoteId` with a guarded version: zod-validate `{ amount?, availability?, available_date?, note? }`, call `editQuoteBySupplier(quoteId, id, req.supplierId!, …)`, map `not_found`→404, `not_editable`→409 (`{ error: 'edit_window_closed' }`); add `POST /jobs/:id/quotes/:quoteId/withdraw` → `withdrawQuote(...)`, map `not_found`→404, `not_withdrawable`→409.
- [ ] A10 index.ts (`adminRouter`) — `GET /admin/jobs/:id/quotes` → `listJobQuotes(id)` (`{ data }`); `POST /admin/jobs/:id/select-quote` zod `{ quote_id: string }` → `selectWinningQuote(id, quote_id, req.adminId!)`, map `null`→404, `job_not_open`→409, `quote_not_selectable`→409, success→`{ job, winner, rejected_count }`.
- [ ] A11 index.ts — `GET /jobs/:id` detail: the job already carries `selected_quote_id` (A3) and `my_quote` carries `status`; add `is_winner: my_quote?.status === 'won'` and keep `can_quote` false once `job.status !== 'open'` (already true via existing gate). No change needed to `/supplier/me/jobs` query, but confirm `mapActiveJobs` consumers receive `quote.status` of `won`/`lost`/`withdrawn`.
- [ ] A12 typecheck green (both repos) + live smoke against local PG: create admin job → approve 2 suppliers both matched → both POST quotes (multiple-quote proof) → edit one pending quote (200) → withdraw the other supplier's pending quote on a second job (200) → admin `GET /admin/jobs/:id/quotes` shows both → admin `POST select-quote` → winner `won`, sibling `lost`, job `assigned`, `selected_quote_id` set → `GET /admin/audit-logs?entity_id=<quote>` shows `quote.submitted`/`selected`/`rejected` rows. Re-select returns 409.

## Phase B — Workflow fan-out (against the frozen contract)

- [ ] B1 (agent) mobile: won / lost / withdrawn states — `app/(tabs)/jobs.tsx`, `app/job/[id].tsx`, `src/state/AppState.tsx`: render `my_quote.status` (`pending`→"Quote sent", `won`→"You won this job", `lost`→"Not selected", `withdrawn`→"Withdrawn"); surface `selected_quote_id`/`is_winner`; map `Job.status='assigned'` in `mapActiveJobs`.
- [ ] B2 (agent) mobile: withdraw action — add a "Withdraw quote" control on a pending quote (job detail / my-jobs) calling `POST /jobs/:id/quotes/:quoteId/withdraw`; handle 409 `not_withdrawable`; add `withdrawQuote` to `src/services/api.ts` (never-throws result shape like `submitQuote`).
- [ ] B3 (agent) mobile: edit-within-window — allow editing a pending quote via the guarded `PUT`, surface 409 `edit_window_closed` as a clear inline message; add `editQuote` to `src/services/api.ts`.
- [ ] B4 (agent) scripts/e2e-quote-lifecycle.mjs + `"e2e:quote-lifecycle": "node scripts/e2e-quote-lifecycle.mjs"` in package.json: two suppliers quote one job; edit; withdraw on a second job; admin lists quotes; admin selects winner; assert winner `won` + sibling `lost` + job `assigned` + `selected_quote_id` + audit rows for every transition; assert re-select 409 and edit-after-select 409.
- [ ] B5 (agent) Control Panel `public/admin.html`: on a job row/drawer, list its quotes (amount, supplier, status), a "Select as winner" button → `POST /admin/jobs/:id/select-quote`, render `won`/`lost`/`withdrawn` badges, and a quote-events timeline from `GET /admin/audit-logs?entity_id=<quote|job>`.
- [ ] B6 (agent) docs delta: update `docs/00-REALITY-AUDIT.md` + `docs/03-API-CONTRACT.md` + `docs/04-DATABASE-MODEL.md` for the new statuses, `selected_quote_id`, the select-quote + withdraw + guarded-edit endpoints, and quote events.
- [ ] B7 (Opus verify) adversarial: tsc both repos; prove multiple providers can quote one job; one-and-only-one winner; siblings forced `lost`; job→`assigned` + `selected_quote_id` set + matches hidden; edit/withdraw blocked once non-pending or job closed; re-select rejected; EVERY transition has an `audit_logs` row; confirm NO payout/IBAN surface and selection is admin-only.

## Phase C — Verify + ship

- [ ] C1 local PG (docker postgres:16 :55432) + API on :4000; run ALL E2E green — `e2e:auth` (26), `e2e:onboarding` (38), `e2e:admin` (45), `e2e:matching` (65), `e2e:quote-lifecycle` (new); manual: two-supplier quote → admin select → won/lost in app + Control Panel timeline.
- [ ] C2 commit + push BOTH repos (mykeyz-care-api, mykeyz-care) to origin main.

## Acceptance

- Multiple verified, matched providers can each submit a quote on the SAME open job (distinct `pending` quotes, `unique(job_id,supplier_id)` enforced).
- Exactly ONE quote per job can be selected (admin-only, in `/admin`): winner → `won`, job → `assigned`, `jobs.selected_quote_id` set, the job leaves all provider feeds.
- All non-winning quotes are forced to `lost` ("rejected") on selection; a provider may edit or withdraw only their own `pending` quote while the job is still open (edit-window rules), and the app shows won / lost / withdrawn states.
- Every quote state change — submit, edit, withdraw, select, reject — and the job assignment are written to `audit_logs` and readable as a quote-event timeline in the Control Panel.

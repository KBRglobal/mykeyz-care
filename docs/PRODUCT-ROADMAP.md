# MyKeyz Care Product Roadmap

This is the execution roadmap for turning MyKeyz Care from a beta shell into a real provider marketplace app.

## Definition of Real

A feature is not real until all of these are true:

- It has backend persistence.
- It survives app restart and network retry.
- It has loading, empty, error, and success states.
- It has audit logs for money, quotes, reveals, verification, and status changes.
- It has analytics events.
- It has admin/backoffice visibility.
- It has tests or a manual verification checklist.
- It does not depend on hardcoded mock data except for explicit demo mode.

## What Blocks a Real System

Nothing architectural blocks building it. The blockers are execution order and missing production decisions:

- We need to finish the backend contract before polishing screens.
- We need admin tools before real operations can run.
- We need WhatsApp/SMS provider decisions for production OTP and alerts.
- We need payment/commission policy implemented as data, not text.
- We need Apple/TestFlight approval for external iOS testers.
- We need to keep secrets out of git and out of logs.

## Milestone 0: Stabilize Beta Access

Goal: make sure the current build can be tested.

Tasks:

- Track Apple Beta Review state for build `2`.
- Confirm `mzgdubai@gmail.com` receives the TestFlight invite after approval.
- If Apple rejects beta, fix the exact rejection and resubmit.
- Keep `docs/TESTFLIGHT-RUNBOOK.md` updated after every failed/successful build.

Done when:

- External tester can install the app from TestFlight.
- Repo has a clean build/release procedure.

## Milestone 1: Backend Contract Lock

Goal: define the real API shape and stop guessing in screens.

Tasks:

- Write API contract for auth, supplier profile, verification, jobs, quotes, reveals, chat, earnings, subscriptions, admin.
- Add database migrations for all core tables.
- Add seed data only under explicit demo/dev mode.
- Add request validation for every endpoint.
- Add auth middleware and role checks.
- Add structured error codes for the app.

Core tables:

- suppliers
- supplier_users
- supplier_trade_areas
- supplier_documents
- verification_reviews
- jobs
- job_findings
- quotes
- quote_events
- reveal_credits
- reveal_events
- conversations
- messages
- earnings
- commission_ledger
- subscription_plans
- supplier_subscriptions
- audit_logs

Done when:

- The app can run against API responses without static job/quote mocks.
- Every state-changing action has an audit record.

## Milestone 2: Auth And Onboarding

Goal: provider can join and get verified.

Tasks:

- Real phone OTP flow through WhatsApp/SMS.
- Session persistence with refresh token.
- Logout and account reset.
- Trade selection.
- Service area selection.
- Business profile.
- Trade license upload.
- Bank details.
- Verification state machine: draft, submitted, needs_changes, approved, rejected.
- Admin approval endpoint.

Done when:

- A new supplier can register from zero and land in the correct app state.
- Admin can approve or reject the supplier.
- Supplier cannot quote jobs before required verification state.

## Milestone 3: Real Jobs Marketplace

Goal: jobs come to the provider based on inspection findings and matching rules.

Tasks:

- Job creation model from MyKeyz inspection findings.
- Matching by trade, location, availability, provider status, plan tier, rating, and capacity.
- Job list states: new, quoted, won, active, completed, lost, expired.
- Job detail with customer-visible facts only.
- Quote deadline and expiry rules.
- Provider availability calendar.
- Route planning data model.

Done when:

- Provider sees only relevant jobs.
- Provider can move from job view to quote submission without mock assumptions.

## Milestone 4: Quotes And Tender Flow

Goal: providers compete and customers choose.

Tasks:

- Create quote.
- Edit quote before deadline.
- Withdraw quote.
- Quote status: draft, submitted, revised, selected, rejected, expired.
- Customer selection endpoint.
- Winning quote event.
- Job assignment event.
- Quote price guidance from historical platform data.
- Voice price input parsing.

Done when:

- A job can receive multiple provider quotes.
- One provider can win.
- Others see correct losing state.
- Money values are immutable after selection except through explicit adjustment events.

## Milestone 5: Reveal System

Goal: build the competitive paid reveal engine.

Tasks:

- Reveal credit wallet.
- Included reveals by plan.
- Single reveal purchase flow.
- Reveal event audit log.
- Reveal competitor price above current provider.
- Reveal rate limits and anti-abuse checks.
- No free reveal leakage through API payloads.

Done when:

- Provider can reveal only when credits/payment allow it.
- Every reveal is logged.
- Competitor pricing is never exposed accidentally.

## Milestone 6: WhatsApp First Operations

Goal: make the app usable for Dubai providers who live in WhatsApp.

Tasks:

- WhatsApp Cloud API integration.
- New job alerts.
- Quote selected alerts.
- Customer message alerts.
- Job reminder alerts.
- Deep links from WhatsApp into the exact app screen.
- Language-aware WhatsApp templates.
- Fallback to push notification when WhatsApp is unavailable.

Done when:

- A provider can receive a lead on WhatsApp and open the exact job screen.
- Alerts are localized.
- Message sends are logged.

## Milestone 7: Multilingual And Voice

Goal: make the app usable for Hindi, Urdu, Bengali, Tagalog, Nepali, and English speakers.

Tasks:

- Complete i18n keys for every screen.
- Device-language detection.
- Manual language switch.
- Backend-translated job descriptions.
- Chat translation pipeline.
- Voice-to-price.
- Voice-to-message.
- Text-to-speech help for critical actions.
- Simple Mode home screen.

Done when:

- A provider can use core workflows without reading English.
- Quote and chat can cross language boundaries.

## Milestone 8: Earnings, Commission, And Invoices

Goal: make money tracking operational.

Tasks:

- Earnings ledger.
- Weekly/monthly earnings summary.
- Commission owed ledger for the 10% platform fee.
- Invoice generation for commissions.
- Payment status: pending, invoiced, paid, overdue, disputed.
- Export for accounting.
- Admin reconciliation view.

Done when:

- Every completed paid job creates earnings and commission records.
- Admin can see who owes what.

## Milestone 9: Plans And Visibility

Goal: subscription tier changes affect marketplace ranking and reveal credits.

Tasks:

- Plan catalog.
- Apple IAP products mapped to backend plans.
- Receipt validation.
- Subscription status sync.
- Plan benefits applied server-side.
- Ranking boost rules.
- Reveal allocations by plan.
- Expiry and downgrade behavior.

Done when:

- UI plan state matches backend entitlement state.
- A provider cannot spoof a higher plan from the client.

## Milestone 10: Admin Backoffice

Goal: run the marketplace without touching the database manually.

Tasks:

- Supplier list.
- Supplier detail.
- Verification queue.
- Document review.
- Jobs list.
- Quote viewer.
- Conversation viewer.
- Reveal/audit log viewer.
- Earnings and commission dashboard.
- Dispute handling.
- Fraud flags.

Done when:

- Operations can approve providers, inspect jobs, resolve disputes, and track money from admin.

## Milestone 11: Production Hardening

Goal: make the system reliable enough for real testers and early providers.

Tasks:

- Error logging.
- Analytics funnel events.
- Rate limiting.
- Backup checks.
- Database migration procedure.
- Secrets audit.
- Privacy policy alignment.
- App crash reporting.
- Offline/retry behavior.
- API health and uptime checks.

Done when:

- Failures are visible.
- Data is backed up.
- Secrets are not exposed.
- The app has no known core-flow crashes.

## Work Order

Build in this order:

1. Backend contract and migrations.
2. Auth/session/onboarding.
3. Real jobs and quotes.
4. Reveal wallet.
5. WhatsApp alerts.
6. Multilingual and voice.
7. Earnings and commission.
8. Plans/IAP.
9. Admin backoffice.
10. Production hardening.

## Immediate Sprint

Sprint objective: make one complete real provider flow.

Scope:

- real supplier auth/session
- onboarding persistence
- verified supplier state
- real jobs list from API
- real quote creation
- real quote status update
- real chat thread
- real earnings update after completed job
- admin-visible audit logs

Exit criteria:

- No static mock data in the core provider flow.
- A fresh install can register, complete onboarding, see matched jobs, submit a quote, message, and see earnings.
- API and app both pass checks.
- Changes are committed and pushed.

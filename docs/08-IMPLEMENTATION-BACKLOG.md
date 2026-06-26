# 08 - Implementation Backlog

This backlog is ordered by dependency. Do not polish screens before the required backend contract exists.

## Sprint 1 - Replace Demo Identity

Repo: API and mobile.

Tasks:

- Replace `supplier-demo` identity creation with real supplier/user IDs.
- Add OTP storage with hashed codes and expiry.
- Add refresh session support.
- Store mobile session securely.
- Add logout.
- Gate fixed OTP codes behind explicit development mode only.

Acceptance:

- Fresh install creates a unique supplier.
- App restart keeps or refreshes session.
- Production cannot use fixed OTP codes.

## Sprint 2 - Production Onboarding Persistence

Repo: API and mobile.

Tasks:

- Add supplier trades table.
- Add supplier service areas table.
- Add supplier documents table.
- Persist business profile, trade license number, bank basics, language.
- Link R2 uploads to documents.
- Add verification submit endpoint.

Acceptance:

- Onboarding survives app restart.
- Uploaded license appears in supplier document record.
- Supplier state becomes submitted, not auto-approved.

## Sprint 3 - Admin Verification V1

Repo: API plus admin surface.

Tasks:

- Add admin auth.
- Add supplier list and supplier detail endpoints.
- Add approve/reject/request changes endpoints.
- Add audit logs.
- Build minimal admin UI or protected admin routes.

Acceptance:

- Admin can approve provider without database edits.
- Supplier app updates based on verification status.

## Sprint 4 - Real Job Matching

Repo: API and mobile.

Tasks:

- Add job findings.
- Add job matching records.
- Add matched jobs endpoint.
- Remove mobile reliance on static job list for core flow.
- Add empty/unverified/expired states.

Acceptance:

- Provider only sees matched jobs.
- Unverified provider cannot quote.

## Sprint 5 - Quote Lifecycle

Repo: API and mobile.

Tasks:

- Add quote statuses and quote events.
- Add quote edit and withdraw rules.
- Add customer/admin quote selection endpoint.
- Mark non-winning quotes rejected.
- Add won/lost mobile states.

Acceptance:

- Multiple providers can quote same job.
- One quote can be selected.
- All quote state changes are auditable.

## Sprint 6 - Reveal Ledger

Repo: API and mobile.

Tasks:

- Add reveal wallet.
- Add reveal events.
- Apply plan included reveals.
- Add single reveal purchase placeholder contract.
- Hide competitor amount unless reveal is authorized.

Acceptance:

- Reveal balance is server-authoritative.
- No reveal leakage in job list/detail before authorization.

## Sprint 7 - Chat Translation And WhatsApp

Repo: API and mobile.

Tasks:

- Add translation fields and pipeline.
- Add WhatsApp outbound template sends.
- Add WhatsApp webhook handling.
- Add deep links.
- Add language-aware notification templates.

Acceptance:

- WhatsApp job alert opens job detail.
- Supplier can message in preferred language.

## Sprint 8 - Earnings And Commission

Repo: API, mobile, admin.

Tasks:

- Add earnings ledger.
- Add commission ledger.
- Create entries on job completion.
- Replace hardcoded earnings endpoint.
- Add admin finance view.

Acceptance:

- Completed job creates gross, commission, and net records.
- Provider earnings screen is ledger-derived.

## Sprint 9 - Plans And IAP Entitlements

Repo: API and mobile.

Tasks:

- Add subscription plan table.
- Add supplier subscription table.
- Add Apple receipt validation endpoint.
- Apply plan benefits server-side.
- Add plan sync to mobile.

Acceptance:

- Plan screen reflects backend entitlement.
- Reveal credits/ranking cannot be spoofed from client.

## Sprint 10 - Production Hardening

Repo: API, mobile, infrastructure.

Tasks:

- Add structured logging.
- Add analytics events.
- Add rate limits.
- Add backup verification.
- Add crash/error reporting.
- Add smoke tests.
- Add release checklist.

Acceptance:

- Core flows have monitoring.
- Release can be repeated from docs.
- No secrets are printed or committed.

# 06 - Admin Backoffice

Admin is required for production. Without admin tools, MyKeyz Care cannot operate real providers.

## Admin Roles

Operations admin:

- Reviews suppliers.
- Manages jobs.
- Handles disputes.

Finance admin:

- Reviews earnings, commission, invoices, payment status.

Support admin:

- Reviews conversations and customer/provider issues.

System admin:

- Manages admin users, fraud, settings, and integrations.

## Required Screens

Supplier list:

- search by name, phone, business, license
- filter by verification status, plan, trade, area
- show risk flags and last activity

Supplier detail:

- profile
- trades and areas
- documents
- verification history
- jobs and quotes
- earnings and commission
- audit log

Verification queue:

- submitted suppliers
- document preview
- approve, reject, request changes
- reason required for non-approval

Jobs list:

- status filters
- trade, area, date, source
- matched providers
- quote count
- selected provider

Job detail:

- inspection findings
- customer-safe details
- matched providers
- quotes
- reveal events
- conversation links
- completion/dispute state

Quote viewer:

- all quotes per job
- amount, availability, status
- quote event timeline
- customer selection event

Conversation viewer:

- original and translated messages
- delivery status
- moderation/failure markers

Earnings dashboard:

- gross amount
- commission amount
- net amount
- paid/unpaid/disputed
- supplier-level breakdown

Commission ledger:

- owed, invoiced, paid, overdue, disputed
- invoice links
- export

Reveal audit:

- supplier
- job
- quote
- credit source
- revealed amount
- timestamp

Fraud flags:

- signal type
- severity
- linked supplier/job
- admin decision

Audit logs:

- actor
- action
- entity
- payload summary
- timestamp

## Admin API Rules

- All admin actions require admin auth.
- All state-changing admin actions require audit log.
- Reject/request-changes actions require reason.
- Money-related changes require finance role or higher.
- Conversation viewing must be logged.

## Acceptance Criteria

Admin v1 is complete when operations can:

- approve a supplier
- reject a supplier with reason
- inspect a job and all quotes
- choose or override a quote when policy allows
- inspect reveal history
- inspect chat history for support
- see commission owed per completed job
- export finance data
- view audit logs for every major action

# 01 - Product Spec

## Product Definition

MyKeyz Care is the provider companion app for MyKeyz. MyKeyz customers inspect Dubai homes before or during move-in. Inspection findings become service opportunities. Providers receive relevant jobs, submit quotes, compete through visibility and reveal mechanics, communicate with customers, complete work, and track earnings.

The core marketplace principle is that power sits with the customer. Customers should not chase businesses. Providers compete for verified demand created by real home inspection findings.

## Primary Users

Supplier owner:

- Registers the business.
- Uploads trade license and profile details.
- Chooses trades, service areas, plans, and availability.
- Reviews jobs, submits quotes, tracks earnings.

Supplier worker:

- Receives assigned work.
- Opens route/job details.
- Chats with customer if permitted.
- Marks work progress and completion.

MyKeyz admin:

- Verifies suppliers.
- Reviews documents.
- Monitors jobs, quotes, chats, reveals, earnings, commissions, and disputes.
- Handles fraud and abuse.

Customer or tenant:

- Uses the main MyKeyz app, not this provider app.
- Creates demand indirectly through inspection reports and Care Hub requests.
- Receives quotes and chooses providers.

## Core Product Rules

- No inspection or Care Hub demand means no provider opportunity.
- Providers see jobs based on trade, location, verification status, availability, and marketplace rules.
- A provider cannot submit real quotes until minimum verification requirements are met.
- Every money-related state change must be auditable.
- The client never decides entitlement, reveal access, quote winner, commission, or verification.
- WhatsApp, language support, and simple workflows are core product requirements for Dubai providers.

## Business Model

Commission:

- MyKeyz charges 10% on closed jobs.
- Initial phase: commission is tracked as B2B obligation and invoiced/collected by MyKeyz.
- Later phase: MyKeyz may collect payment directly and pay out providers.

Visibility plans:

- Minimal Listing: free, basic profile, no image prominence.
- Bold Visibility: 100 AED/month, image, Verified Expert, stronger card.
- Premium Highlight: 349 AED/month, crown, Top Rated, 10 included reveals.
- High Impact Card: 599 AED/month, blue highlighted card, 30 included reveals.
- Elite Minisite: 999 AED/month, full minisite, gallery, unlimited reveals.

Plan payments:

- Purchased through Apple IAP on iOS where required.
- Backend entitlements must be derived from receipt validation, not client state.

Reveal system:

- Profile view reveal: provider sees customer/profile interest where allowed by privacy rules.
- Competitor price reveal: provider spends included or purchased reveal credit to see the relevant competitor price above them.
- Single reveal purchase target price: AED 9.99.
- Reveal results must never leak in list payloads before payment/credit authorization.

## Core Capabilities

Provider onboarding:

- Phone OTP.
- Language selection.
- Trade selection.
- Service area selection.
- Business profile.
- Trade license upload.
- Bank details.
- Verification submission.

Jobs:

- Matched to provider by service category and geography.
- Derived from inspection findings or customer Care Hub request.
- Support instant and tender flows.
- Include enough detail to quote without exposing sensitive customer data too early.

Quotes:

- Provider submits price, availability, note, and optional voice-entered text.
- Quote can be revised only while rules allow.
- Customer chooses one provider.
- Winning and losing providers see correct state.

Messaging:

- Supplier and customer can communicate in their own languages.
- Messages support translation metadata.
- WhatsApp alerts deep-link back to the app.

Earnings:

- Completed jobs create earnings.
- Commission is tracked separately.
- Provider sees gross, commission, net, status, and history.

Admin:

- Required to operate real suppliers.
- No production workflow should require manual database edits.

## Product Acceptance

The product is beta-ready only when a new provider can:

1. Install from TestFlight.
2. Sign up with real OTP.
3. Complete onboarding.
4. Submit verification.
5. Be approved by admin.
6. Receive matched jobs.
7. Submit a quote.
8. Reveal a competitor price using real credits.
9. Chat with a customer.
10. Win and complete a job.
11. See earnings and commission impact.

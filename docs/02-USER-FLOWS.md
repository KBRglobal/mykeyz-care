# 02 - User Flows

## Flow State Standard

Every flow must define:

- entry point
- required backend state
- success path
- failure states
- app screens involved
- admin visibility
- audit/logging requirement

## 1. Signup And OTP

Entry:

- Provider opens app for the first time.

Required backend state:

- No active session or expired session.

Success path:

1. Provider enters phone number.
2. API creates OTP request.
3. OTP is sent through WhatsApp or SMS.
4. Provider enters code.
5. API verifies code.
6. API creates or returns supplier user and session.
7. App stores session securely.
8. App routes provider to onboarding or home based on supplier state.

Failure states:

- invalid phone
- OTP send failed
- wrong code
- expired code
- too many attempts
- blocked phone
- network failure

Admin visibility:

- OTP attempt count and blocked state, without exposing OTP values.

Audit requirement:

- login attempt event
- OTP verification success/failure event

## 2. Provider Onboarding

Entry:

- Authenticated supplier with incomplete profile.

Success path:

1. Choose language.
2. Select trades.
3. Select service areas.
4. Enter business name and contact details.
5. Upload trade license.
6. Enter bank details.
7. Submit for verification.
8. App shows pending verification state.

Failure states:

- missing required field
- unsupported trade
- unsupported area
- upload failed
- invalid license file
- duplicate business/license
- bank validation failed

Admin visibility:

- Supplier profile, documents, submitted values, status history.

Audit requirement:

- profile field changes
- document upload events
- verification submission event

## 3. Verification Review

Entry:

- Supplier status is `submitted`.

Success path:

1. Admin opens verification queue.
2. Admin reviews profile and documents.
3. Admin approves, rejects, or requests changes.
4. Supplier receives in-app and WhatsApp notification.
5. App unlocks or blocks marketplace actions based on status.

Failure states:

- document unreadable
- expired license
- mismatched business name
- duplicate supplier
- unsupported service type

Admin visibility:

- Full queue and decision history.

Audit requirement:

- admin decision event with reason

## 4. Job Matching

Entry:

- Verified supplier opens home/jobs.

Success path:

1. API evaluates open jobs.
2. Matching uses trade, area, provider status, availability, capacity, plan, and marketplace ranking.
3. App lists relevant jobs.
4. Provider opens job detail.

Failure states:

- no matching jobs
- supplier not verified
- job expired
- job already assigned
- job hidden due to plan/ranking rules

Admin visibility:

- Job distribution and matched provider list.

Audit requirement:

- job created event
- provider matched event

## 5. Quote Submission

Entry:

- Provider opens a job that accepts quotes.

Success path:

1. Provider reviews job details.
2. Provider enters price manually or by voice.
3. Provider selects availability.
4. Provider adds optional note.
5. API validates quote.
6. API stores quote.
7. App shows submitted state.
8. Customer sees quote in MyKeyz Care Hub.

Failure states:

- provider not verified
- quote deadline passed
- invalid amount
- duplicate quote
- job no longer open
- provider blocked

Admin visibility:

- Quote list per job and provider.

Audit requirement:

- quote created event
- quote edited/withdrawn event

## 6. Reveal Competitor Price

Entry:

- Provider has submitted or is preparing quote for a job where reveal is allowed.

Success path:

1. App requests reveal.
2. API checks entitlement and credits.
3. API charges one included or purchased reveal if first reveal for this job.
4. API returns competitor price data allowed for that provider.
5. App shows price unlocked state.

Failure states:

- no credits
- payment required
- reveal not allowed for job
- provider already below/above ranking threshold where no comparison exists
- abuse/rate limit

Admin visibility:

- Reveal ledger and provider reveal history.

Audit requirement:

- reveal charged event
- reveal viewed event

## 7. Customer Chooses Provider

Entry:

- Customer reviews quotes in main MyKeyz app.

Success path:

1. Customer selects provider.
2. API marks winning quote.
3. API marks other quotes lost.
4. API creates or updates conversation.
5. Supplier receives app/WhatsApp notification.
6. Job becomes active for winning supplier.

Failure states:

- selected quote expired
- provider no longer available
- customer cancels
- payment/pre-authorization fails if enabled later

Admin visibility:

- Winner, losing quotes, selection timestamp.

Audit requirement:

- quote selected event
- job assigned event

## 8. Chat And Translation

Entry:

- Conversation exists for a job and provider.

Success path:

1. Supplier sends message in their language.
2. API stores original text and detected language.
3. Translation pipeline creates customer-language version.
4. Customer receives translated message.
5. Customer reply is translated for supplier.

Failure states:

- translation failed
- message blocked by moderation
- conversation closed
- network failure

Admin visibility:

- Conversation viewer for support/dispute review.

Audit requirement:

- message sent event
- translation failure event

## 9. Complete Job And Earnings

Entry:

- Winning provider has an active job.

Success path:

1. Provider marks job complete.
2. Customer/admin confirms completion depending on policy.
3. API creates earnings ledger entry.
4. API creates commission ledger entry for 10%.
5. Provider sees updated earnings.
6. Admin sees commission owed.

Failure states:

- provider did not win job
- job already completed
- customer disputes
- completion proof required

Admin visibility:

- Completion events, earnings, commission, disputes.

Audit requirement:

- job completed event
- earnings event
- commission event

## 10. Plan Upgrade

Entry:

- Provider opens Plans.

Success path:

1. Provider selects plan.
2. Apple IAP purchase completes.
3. Backend validates receipt.
4. Backend updates subscription entitlement.
5. App refreshes supplier plan.
6. Plan benefits apply server-side.

Failure states:

- payment cancelled
- receipt invalid
- Apple server unavailable
- entitlement expired

Admin visibility:

- Subscription status and receipt events.

Audit requirement:

- purchase attempt
- receipt validation
- entitlement change

# 09 - Release And TestFlight

This document extends `TESTFLIGHT-RUNBOOK.md`. Use that runbook for exact commands.

## Release Types

Native iOS build:

- Required when native config, dependencies, build number, permissions, or App Store/TestFlight binary changes.
- Use EAS build and submit.

OTA update:

- Use only for JS/assets changes that do not require a native rebuild.
- Follow project OTA policy before publishing.

Backend deploy:

- Required for API/database changes.
- Must be coordinated with mobile compatibility.

## Pre-Release Rules

- Do not release with secrets in code, docs, logs, or screenshots.
- Do not release with production pointing to hardcoded demo identity.
- Do not release if typecheck fails.
- Do not reuse Apple build number.
- Do not submit a new iOS binary without confirming App Store Connect state.

## TestFlight External Tester Rules

External testers require:

- uploaded valid build
- build added to external beta group
- tester added to external beta group
- beta app localization
- beta build localization
- beta app review details
- beta license agreement
- Beta App Review approval

Known current state:

- Build `2` is valid.
- External build state is waiting for beta review.
- `mzgdubai@gmail.com` is in the external group but remains not invited until Apple allows external testing.

## Release Verification

Mobile:

- install fresh
- login
- onboarding
- jobs
- quote
- reveal
- chat
- earnings
- settings

API:

- health endpoint
- auth request/verify
- supplier profile
- jobs
- quotes
- reveals
- conversations/messages
- earnings
- upload presign

Admin:

- supplier queue
- verification decision
- job inspection
- quote inspection
- audit log

## Rollback

Mobile:

- If native build is bad before external approval, submit a fixed higher build number.
- If OTA is bad, publish rollback update to prior known-good bundle.

Backend:

- Revert deploy only if database compatibility allows it.
- Prefer forward fix if migrations are already applied.

Database:

- Migrations must have explicit rollback notes where possible.
- Never manually edit production data without an audit record.

## Release Acceptance

A release is accepted when:

- app build or OTA is visible to target testers
- API health is green
- core smoke test passes
- no critical logs/errors appear after launch
- git is clean and pushed
- release notes include build/update IDs

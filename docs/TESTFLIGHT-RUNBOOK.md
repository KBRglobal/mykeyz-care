# MyKeyz Care TestFlight Runbook

Use this checklist for every iOS beta build. Do not skip steps.

This runbook is the iOS build/submit half of a release. The full repeatable release flow — backend pre-release gate (`npm run typecheck`, `npm run e2e:all`, `npm run verify:backup`), mobile gate (`npx tsc --noEmit`), env-var inventory, monitoring enablement, and rollback — lives in `09-RELEASE-AND-TESTFLIGHT.md` (Repeatable Release Checklist). What to watch after launch — analytics events, structured logs, error tracking, backup verification, rate limiting — lives in `MONITORING.md`. Do not duplicate those steps here; run this runbook at the Build + Submit step of that checklist.

## Ground Rules

- Never print secrets, API keys, private keys, provisioning data, or raw environment variables.
- Never reuse an App Store Connect build number.
- Submit by explicit EAS build ID, not by "latest".
- External TestFlight testers do not receive email until the build is available for external testing. For a new build, that usually requires Beta App Review.
- If a tester state is `NOT_INVITED`, the TestFlight email has not been sent yet.

## Local Preflight

1. Go to the app repo:

   ```bash
   cd /Users/claude/Documents/mykeyz-care
   ```

2. Confirm the branch and local changes:

   ```bash
   git status --short --branch
   ```

3. Run the app checks:

   ```bash
   npm run typecheck
   ```

4. Check the current highest App Store Connect build number for `com.mykeyz.care`.

   Current app identifiers:

   - EAS project: `@kbr_global/mykeyz-care`
   - Bundle ID: `com.mykeyz.care`
   - App Store Connect app ID: `6784050810`

5. Increment both values in `app.json`:

   - `expo.ios.buildNumber`
   - `expo.android.versionCode`

6. Commit and push the build-number change before starting EAS:

   ```bash
   git add app.json
   git commit -m "Bump build number for TestFlight"
   git push
   ```

## Build

1. Start the iOS build:

   ```bash
   npx eas-cli@latest build --platform ios --profile testflight --non-interactive --wait
   ```

2. Save the returned EAS build ID and artifact URL in the work log.

3. If the build fails, inspect the EAS build logs before changing code.

## Submit

1. Submit the exact build ID:

   ```bash
   npx eas-cli@latest submit --platform ios --id <EAS_BUILD_ID> --profile testflight --non-interactive --wait --verbose --verbose-fastlane
   ```

2. Verify App Store Connect shows the uploaded build as:

   - `processingState: VALID`
   - `expired: false`
   - expected build number

## External TestFlight Checklist

For external testers, uploading the binary is not enough.

1. Confirm the beta group exists.

   Current group:

   - Name: `Test`
   - Type: external

2. Add the build to the beta group.

3. Add the tester to the beta group.

   Current requested tester:

   - `mzgdubai@gmail.com`

4. Confirm beta app localization exists:

   - app description
   - feedback email
   - marketing URL if available
   - privacy policy URL if available

5. Confirm beta build localization exists:

   - `whatsNew`
   - locale `en-US`

6. Confirm Beta App Review details are filled:

   - contact first name
   - contact last name
   - contact phone
   - contact email
   - demo account requirement
   - notes for Apple review

7. Confirm Beta License Agreement has text.

8. Submit the build for Beta App Review.

9. Verify these states:

   - `betaReviewState: WAITING_FOR_REVIEW` after submission
   - `externalBuildState: WAITING_FOR_BETA_REVIEW` after submission

10. After Apple approves the beta, verify:

    - external build is available in the group
    - tester is no longer `NOT_INVITED`
    - tester receives the TestFlight email

## Known Failure Modes

- `ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE` during submit:
  - The build number was reused. Increment `app.json`, commit, build again, and submit the new build.

- Tester added but no email received:
  - Check tester state. If it is `NOT_INVITED`, the invite has not been sent.
  - Check external build state. If it is `WAITING_FOR_BETA_REVIEW`, wait for Apple Beta App Review approval.

- `Missing required information to submit for external testing`:
  - Fill Beta App Review details.
  - Fill Beta App Localization.
  - Fill Beta Build Localization.
  - Fill Beta License Agreement.
  - Check App Store Connect app metadata if the API still rejects submission.

## Current Build 2 Status

As of 2026-06-26:

- EAS build ID: `b41cde9c-fce3-4441-a9db-61abb9d6ae2e`
- App Store Connect build ID: `c673f7a7-6aee-4bd4-9212-162f558e3080`
- Build number: `2`
- Processing state: `VALID`
- Internal state: `READY_FOR_BETA_TESTING`
- External state: `WAITING_FOR_BETA_REVIEW`
- Beta review state: `WAITING_FOR_REVIEW`
- Submitted date: `2026-06-25T21:26:24-07:00`
- Tester `mzgdubai@gmail.com`: in group, state `NOT_INVITED` until external beta is approved/sent

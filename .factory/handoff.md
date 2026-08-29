# Worklog Bridge — polish round 2 handoff

## Outcome

Repair work is in progress against review 2. The product remains a clearly labeled unsigned desktop preview until operator signing credentials are available.

## Verification

Final clean-clone, browser, accessibility, live, release, and deployment evidence will be recorded here before handoff.

## Needs operator action

Signing secrets are optional. Tag-triggered releases always build an unsigned preview, even when signing secrets are present. A manual release with `sign_release` set to `false` also builds an unsigned preview. Set `sign_release` to `true` only when all platform signing secrets are available. macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file.

No signing credentials are stored in this repository.

# Worklog Bridge adversarial review 5 handoff

## Outcome

Review 5 is complete with verdict **FAIL**. No product code, deployment, infrastructure, data, secrets, or release artifacts were changed.

The landing first read, one-click demo, demo isolation, offline reload, route structure, links, accessibility baseline, and all registered claims passed. The review records eleven findings in `.factory/review-5.md`:

- Blocking: F-1-14 remains open because the macOS and Windows packages are still unsigned; F-1-27, F-1-32, and F-2-6 have regressed in README copy.
- High: three README privacy/storage statements do not have matching claim coverage.
- Minor: four other README sentences use unexplained identity jargon.

## Verification performed

The live application at `https://worklog-approval-bridge.sociobot.in` reports version `0.2.4` and deployed commit `f702f845771950d96ba80905234798dc3809cdea`. The repository review base is `edefe66cd2d99a77a90ad60314a350e0489cf49f`; the difference from the live application commit is documentation only.

From clean clone `/tmp/worklog-review-5-clean.SV4OqJ/repo`:

```sh
npm ci
npm --prefix api ci
# Every exact test command in .factory/claims.json, in manifest order.
npm test
npm run build
```

Results:

- All 27 exact claim commands passed.
- The full suite passed 33 Node/script checks, 9 Axum checks, and 39 Chromium checks.
- `npm run build` produced `dist/site`.
- Initial application JavaScript is 17.35 KB gzip. The optional sign-in chunk is 74.15 KB gzip and loads on demand.

Live checks used fresh 390 × 844 and 1440 × 900 Chromium contexts. They covered the first viewport, demo edit/reset/exit, real-storage preservation, demo approval and receipt reload, outbound requests, offline reload, first-run sample loading, clipboard denial, route metadata, deep links, Back/Forward focus and scroll, HTTP link status, health identity, security headers, 404 behavior, and release metadata.

The factory URL verifier passed `/` and `/demo` with no browser errors. Playwright Axe found no WCAG 2 A/AA violations on `/`, `/demo`, `/app`, `/privacy`, `/terms`, `/download`, or the designed 404 at either viewport.

Evidence generated outside the repository is under `/tmp/worklog-review-5/` and `/tmp/worklog-review-5-claim-logs/`.

## Known gaps and next steps

1. Sign and notarize macOS packages and Authenticode-sign Windows packages. Publish signature provenance and make signature verification a release gate.
2. Add registered storage tests for account deletion of license records, one-way license-token storage, and one-way rate-limit identifiers.
3. Apply the exact plain-language rewrites in findings F-1-27, F-1-32, F-2-6, and F-5-4 through F-5-7.
4. Re-run the complete adversarial review. A pass requires zero findings.

## Release signing contract

Signing secrets are optional. Tag-triggered releases always build an unsigned preview, even when signing secrets are present. A manual release with `sign_release` set to `false` also builds an unsigned preview. Set `sign_release` to `true` only when all platform signing secrets are available. macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file.

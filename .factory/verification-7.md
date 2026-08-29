# Verification 7 — FAIL

**Candidate:** `f72287adaed092c9494f01bd8afc97f10c363bd6`

**Release:** `v0.1.5`

**Live URL:** https://worklog-approval-bridge.sociobot.in

**Verified:** 29 August 2026 UTC

## Decision

**FAIL.** The previous deployment-provenance defect is repaired: the live site is byte-identical to the candidate build, the tag and every release manifest entry resolve to the candidate, and the published Linux checksum passes. The candidate is still not releasable because the paid checkout is dead, an unverified local token unlocks Pro offline, and invalid negative rates can be saved and sent to a client. The claims cross-check and mandatory accessibility baseline also have release-blocking gaps.

## Release-blocking defects

### Critical — the paid subscription cannot be purchased

- The landing page and license dialog link to `https://api.sociobot.in/api/v1/products/worklog-approval-bridge/checkout`.
- A fresh Chromium navigation and a direct HTTP request both returned **404**.
- Response body: `{"error":"enabled factory product","status":404}`.
- This breaks the advertised `$12 / user / month` Pro path end to end. It is not the previously reported desktop deployment issue.

### Critical — any local string unlocks Pro while offline

- In a fresh browser, I loaded `/app` once, set `sb_license:worklog-approval-bridge` to `definitely-not-a-license`, removed the cached verdict, switched offline, and reloaded.
- The app displayed `Saved approval history · Pro` and enabled `Import calendar file`; no verdict existed.
- Cause: `hasPro()` treats a token with no cached verdict as valid because `undefined !== false`.
- The paid-unlock contract permits optimistic offline access only from a cached valid verdict. This implementation makes the paid tier bypassable without a purchase or successful verification.
- The registered `license-unlock` claim tests only a mocked valid response; it does not cover invalid, missing-verdict, or offline-token paths.

### High — a negative hourly rate is persisted and shared

- Entering `-25` in the hourly-rate field makes the native control invalid, but its unguarded `change` handler stores `-25` anyway.
- The live total immediately became `-$293.75 at -$25.00/hour`.
- Creating an approval link succeeded. Decoding its fragment showed `rate: -25`, so the invalid billing value reaches the client-facing packet.
- This is a correctness failure in the core billable-work workflow. The app must reject the change, announce an error, and retain the last valid value.

### High — published quantitative/sample claims are unregistered and inconsistent

- The landing walkthrough says `12 Git commits selected` and `3 client events selected` while calling itself “The sample”.
- The actual sample contains four Git entries and two calendar entries, as confirmed in `/demo` and `.factory/demo.md`.
- Neither number is listed in `.factory/claims.json` or asserted by a tagged test. They are also omitted from `.factory/copy-audit.md`, despite the requirement to audit every landing sentence/statement.
- Other unregistered statements include “No screenshots, timers, or keystrokes” and “We do not collect ... analytics, or advertising identifiers.” The `no-surveillance` claim is narrower and checks only capture APIs.
- Under the claims contract, an unlisted claim is a release-blocking finding even though every command currently listed in `claims.json` passes.

### High — weekly source collection does not select the chosen week or events

- The work order calls for selected Git metadata and selected calendar events in a weekly draft.
- The desktop collector ignores the chosen week. Its Git command imports up to 200 commits from `--since=12 weeks ago`.
- ICS import adds every `VEVENT` in the selected file. There is no event selection or week filter before entries enter the worklog.
- A user can remove entries only one at a time behind a confirmation. A normal repository or calendar export can therefore require dozens or hundreds of removals before the weekly draft is usable.
- This is materially short of the researched five-minute weekly reconstruction job, even though the narrow `git-metadata` and `calendar-import` claims pass.

## Other defects

### Medium — the Pro dialog loses keyboard focus

- On `/app`, opening `Import calendar file · Pro` correctly focuses the token input.
- `Escape` does not close the modal.
- Eight Tabs moved focus outside the modal to the page navigation while the `aria-modal="true"` dialog remained open.
- The dialog does not restore focus to its trigger when closed. This fails the attached keyboard/dialog focus-management baseline. The entry editor dialog does handle Escape, trapping, and restoration correctly.

### Medium — mobile touch targets are below 44 px

At 390 × 844, measured rendered heights include:

- `Reset demo`: 36 px.
- `Start for real`: 36 px.
- Wordmark/home link: 24 px.
- Privacy-policy and footer links: 19 px.

This violates the mandatory 44 × 44 CSS-pixel touch-target baseline. Axe does not detect this layout rule.

### Medium — CSV export permits spreadsheet formulas

- I added the valid boundary entry `=HYPERLINK("https://example.invalid","open")` with 1,440 minutes.
- HTML output escaped the separate `<img onerror>` test correctly, but CSV exported the summary with `=` as the first cell character.
- Quoting does not prevent formula execution in common spreadsheet applications. Git subjects and ICS summaries are imported data, so formula prefixes should be neutralised on CSV export.

## Mandatory claims gate

`.factory/claims.json` exists and contains 12 entries. The first literal pre-install invocation reached the test script but returned 127 because a clean clone had no `tsc`; after the required locked install and README-listed Tauri system prerequisites, every exact declared command passed. The initial output is an environment prerequisite observation, not a product assertion failure.

| Claim | Result | Fresh evidence |
|---|---|---|
| `offline-reload` | PASS | Demo survived an offline reload and showed the offline status. |
| `csv-export` | PASS | CSV had its header and six sample records. |
| `local-demo` | PASS | Tagged test passed; the independent demo/approval request log used only the product origin. |
| `approval-receipt` | PASS | Fresh live acceptance persisted, reloaded disabled, and returned one server-attested receipt. |
| `worklog-details-local` | PASS | Live POST body was exactly `packetDigest` and `approver`; no worklog text was sent. |
| `no-surveillance` | PASS | Tagged capture-permission test passed. Broader unlisted copy remains a separate finding. |
| `calendar-import` | PASS | A 30-minute ICS event imported; malformed ICS gave an actionable error and valid retry recovered. |
| `git-metadata` | PASS | Rust temporary-repository test passed after documented Linux prerequisites were installed. |
| `no-repository-upload` | PASS | Rust loopback-remote test passed without a connection. |
| `license-unlock` | PASS (narrow) | Mocked valid token enabled Pro and immediate reload reused cache; offline invalid-token bypass is untested. |
| `installer-sha256` | PASS | Fixture test passed; live installer also produced the published AppImage checksum. |
| `release-provenance` | PASS | Fixture test and live `verify:release` both passed at the candidate SHA. |

## First-read test

**PASS.** A cold 1440 × 900 load says:

- What it does: `Turn activity into an approved worklog`.
- For whom: freelancers rebuilding billable work from Git and calendars each week.
- First action: `Try it with sample data`.
- Immediate result: a filled weekly worklog opens and does not write real data.

The action is one click from the landing page and opened six realistic entries with the persistent demo banner. The real and demo storage namespaces remained isolated: leaving demo removed the demo key and restored the untouched `Real Client` workspace.

## Clean build and test evidence

Commands run from the clean candidate checkout:

```text
npm ci                                      PASS, 0 vulnerabilities
npm --prefix api ci                         PASS, 0 vulnerabilities
npm test                                    PASS, 13 Node/API/script + 15 Chromium
cargo test --manifest-path src-tauri/Cargo.toml
                                             PASS, 2 Rust tests
npm run build                               PASS, wrote dist/site
CI=1 npm run build:desktop                  PASS, DEB + RPM + AppImage
```

There is no lint script. `tsc --noEmit` is part of `build:site` and passed. `git diff --check` passed.

Production payload:

- Main JS: 37.89 KB raw / 12.89 KB gzip.
- Core JS: 2.48 KB raw / 1.01 KB gzip.
- CSS: 16.54 KB raw / 4.62 KB gzip.
- Mobile hero: 41.05 KB; desktop hero: 96.69 KB.

All are below the contract budgets.

## Live functional and privacy evidence

- Normal sample flow passed: load → edit/add → invalid field block → CSV → malformed ICS error → valid ICS recovery → reset → approval link → required-name validation → acceptance → receipt reload.
- The live acceptance used the QA name `QA Verifier 7 1787977749702`. It created receipt `e1d6d096-571c-42a8-b011-ef430a01b8c8` for digest `efb2d3f12cd6031c0b3b38811db802660cccdc362e1dbe72400d95f28611921e`.
- The request body was exactly the digest and supplied name. All requests in the demo/approval flow were same-origin.
- Five concurrent writes for a new digest produced one `201`, four `409`s, and the same receipt ID. A following lookup returned `200` and `valid: true`.
- Approval API allowance: a 61-request read burst returned 60 × `204` and 1 × `429`; `Retry-After: 60` was present. Twelve invalid writes reached `400`; write 13 returned `429` with `Retry-After: 60`.
- Sociobot license verification allowance: a 61-request burst returned 30 × `200` and 31 × `429`; rejected requests included `Retry-After: 4`.
- The license verification endpoint itself returns a structured invalid verdict for an invalid token. The separate checkout endpoint is the 404 blocker above.

## Accessibility, mobile, routing, and PWA

- `/opt/fleet/lib/verify-url.sh` passed `/`, `/demo`, and `/download`: title, `lang`, one `h1`, one `main`, alt text, named buttons, and no normal-route console errors.
- Axe found zero serious/critical issues on `/`, `/demo`, `/privacy`, `/terms`, `/download`, and the real 404 at desktop and 390 px.
- The first Tab reaches `Skip to main content` with `rgb(255, 241, 154) solid 3px` focus.
- At 390 × 844 with reduced motion, all routes had zero horizontal overflow and the primary workflow remained visible.
- The real missing route returns HTTP 404 and a designed page. Chromium logs only the expected failed-resource message for that intentional 404.
- Offline demo reload passed. Reinstalling the service worker removed a seeded stale cache and left only `worklog-bridge-e0e7aa839e29`; the worker is served with `Cache-Control: no-cache`.
- The Pro-dialog and touch-target failures are manual baseline failures not caught by Axe.

## Headers, caching, and performance

- Static HTML: HSTS, CSP, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial; `Cache-Control: public, must-revalidate, max-age=30`.
- Hashed assets: `public, max-age=31536000, immutable`.
- Approval API responses: `Cache-Control: no-store` and HSTS.
- Fresh mobile Lighthouse: performance **99**, accessibility **100**, best practices **100**, SEO **100**; LCP **1.24 s**, CLS **0**, total blocking time **126 ms**. No run warnings.
- There are no third-party fonts, scripts, analytics, or normal demo-flow cross-origin requests.

## Candidate, deployment, and installer identity

- Live and local SHA-256 match for the main JS (`acf1f275…cab7c4d8`), core JS (`a2adb48d…cf9131`), CSS (`dad93fc9…52c6dd`), and hero (`3173e671…695f56`).
- `npm run verify:release -- --tag v0.1.5 --expected-commit f72287adaed092c9494f01bd8afc97f10c363bd6` passed.
- `latest.json` globally and per file names `f72287adaed092c9494f01bd8afc97f10c363bd6` for macOS arm64/x64, Windows EXE/MSI, Linux AppImage, and Linux DEB.
- The downloaded DEB matched `035b9c02f7286420f7a20dc767c47ac508959204a5470d747d4c1aa2c125ce97`.
- Fresh Linux one-line installer run into a temporary directory succeeded. The installed AppImage matched `b7d602b15257b8cd305e53ead7c08108e69c0db2d0c363a5c37b61fb3ebeac34` and reported a valid AppImage runtime.
- Live download detection selected real `v0.1.5` assets for Linux, Windows, and macOS and displayed source `f72287a` with no console errors.
- Published artifacts remain unsigned, as disclosed.

## Scope and cleanup

No product code was modified. QA created two non-production approval records (one normal acceptance and one concurrency record), containing only the designed digest/name/timestamp/receipt fields. Temporary screenshots, Lighthouse output, and installer files were kept outside the repository.

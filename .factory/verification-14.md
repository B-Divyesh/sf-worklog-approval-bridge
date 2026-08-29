# Worklog Bridge — independent verification 14

## Decision

**FAIL** on 29 August 2026.

- Candidate: `2ea2ddabf31be2b04b9904d33c21f2d3d81a2534`
- Live URL: <https://worklog-approval-bridge.sociobot.in>
- Published desktop release: `v0.1.16`
- Work order: `worklog-approval-bridge-verify-14`

The live product works end to end, but it does not identify the nominated
candidate. The deployed `/api/health`, GitHub Release, `latest.json`, and every
published desktop artifact identify predecessor
`f00442c1f996be82a19a067bbba42f987f77eca1`. Both candidate-bound verification
commands reject this mismatch. This is release-blocking even though the only
source difference between the two commits is `.factory/handoff.md` and the
live static asset bytes match the candidate build.

## Required first gates

### First read — PASS

A fresh 390 by 844 browser opened the live home page with no stored state.
The first viewport says:

- what it does: **Turn activity into an approved worklog**;
- who it is for: freelancers rebuilding billable work from Git and calendars;
- what to do first: **Try it with sample data**.

The primary action and its explanation are visible without scrolling. One
click opens `/demo` with six realistic Northstar Health entries. The persistent
banner says **Demo — sample data, nothing is saved** and provides **Reset demo**
and **Start for real**. Screenshot: `/tmp/worklog-live-mobile-first.png`.

### Claim registry — FAIL on the mandatory first invocation

`.factory/claims.json` exists and contains 20 claims. After `npm ci`, each
listed command was run independently, in manifest order. Eighteen commands
passed. The two exact native commands exited 101 before running their claims:

- `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata`
- `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload`

Both failed because the baseline worker lacked `glib-2.0.pc`, a transitive
Tauri system prerequisite. After installing the Ubuntu packages documented in
the README, both exact commands passed without a source change. The final
behavioral result for all 20 claims is therefore passing, but the mandatory
first clean-sandbox result remains a failure under the supplied rule that any
failing claim command blocks release.

| Claim | Final result | Evidence |
| --- | --- | --- |
| offline-reload | PASS | Offline service-worker reload kept the six-entry demo |
| csv-export | PASS | CSV contained the header and six records |
| local-demo | PASS | Isolated demo namespace and same-origin worklog flow |
| desktop-sample-project | PASS | `/app` loaded the sample in one action |
| entry-review | PASS | Edit, duration, readiness, removal, reload, and CSV |
| free-editor | PASS | Unlicensed workspace added and exported an entry |
| approval-receipt | PASS | Durable one-time receipt, reload, download, tamper check |
| worklog-details-local | PASS | Acceptance body contained only digest and name |
| no-surveillance | PASS | No capture APIs or monitoring requests |
| calendar-import | PASS | Only selected-week ICS events appeared |
| git-metadata | PASS after prerequisites | Temporary repository metadata test |
| no-repository-upload | PASS after prerequisites | Loopback remote saw no connection |
| license-unlock | PASS | Valid, invalid, expired, revoked, offline, and cache boundary |
| sample-counts | PASS | Four Git and two calendar entries |
| pro-price | PASS | $12 monthly plan, checkout, licensed history |
| no-analytics | PASS | No analytics or advertising request |
| release-discovery | PASS | GitHub API discovery and calm unavailable state |
| public-health-fields | PASS | Exact public response key test |
| installer-sha256 | PASS | Matching install and mismatch rejection |
| release-provenance | PASS as a unit test | Platform/source manifest validation |

## Release-blocking findings

### Critical — nominated candidate is not deployed or published

Fresh commands:

```text
npm run verify:live -- --expected-commit 2ea2ddab...   FAIL
actual:   f00442c1f996be82a19a067bbba42f987f77eca1
expected: 2ea2ddabf31be2b04b9904d33c21f2d3d81a2534

npm run verify:release -- --tag v0.1.16 --expected-commit 2ea2ddab...   FAIL
actual:   f00442c1f996be82a19a067bbba42f987f77eca1
expected: 2ea2ddabf31be2b04b9904d33c21f2d3d81a2534
```

`GET /api/health` returned:

```json
{"status":"ok","build":{"service":"worklog-approval-bridge-receipts","version":"0.1.16","commit":"f00442c1f996be82a19a067bbba42f987f77eca1"}}
```

The latest GitHub Release is `v0.1.16`, with `target_commitish` set to the same
`f00442c1...` predecessor. Its `latest.json`, checksums, macOS arm64/x64,
Windows MSI/EXE, and Linux DEB/AppImage all attest that predecessor. Running
the release verifier against `f00442c1...` passes and verifies the Linux DEB
SHA-256 `66bf50fe33b6cc3ec560e1a2bfb00a0350bc910db972651bfd2297d3ee5a4a75`.

### High — two registered claim commands need machine setup not encoded in the commands

The README documents the required Tauri packages, so the claims pass after
that setup. However, the exact claim commands do not install or preflight
their prerequisites and failed in the clean worker before exercising either
claim. The claims acceptance rule explicitly treats such a first-run failure
as blocking.

### Low — important first-screen supporting text is below the 16 px design baseline

At 390 px, the explanation beneath the demo action computes to 13 px and the
three privacy/offline/price facts compute to 14 px. Contrast remains sufficient
and Axe does not flag these elements, but the attached design contract
sets a 16 px body-text baseline. Eyebrows and build metadata are also smaller,
but those are secondary metadata rather than task copy.

## Local candidate verification

The clone began clean at the exact candidate. No product source was changed.

```text
npm ci                                      PASS; 37 packages, 0 vulnerabilities
npm --prefix api ci                         PASS; 28 packages, 0 vulnerabilities
npm test                                    PASS; 24 Node/script + 32 Chromium tests
cargo fmt --manifest-path ... --check       PASS
cargo clippy --manifest-path ... --all-targets -- -D warnings
                                              PASS
cargo test --manifest-path src-tauri/Cargo.toml
                                              PASS; 2 tests
npm run build                               PASS; dist/site
CI=1 npm run build:desktop                  PASS; DEB, RPM, AppImage
git diff --check                            PASS
```

Built Linux bundles:

- DEB: 1,674,668 bytes
- RPM: 1,676,164 bytes
- AppImage: 76,458,488 bytes

Production web budget:

- JavaScript: 42.21 KB + 2.48 KB raw; 13.76 KB + 1.01 KB gzip
- CSS: 17.59 KB raw; 4.79 KB gzip
- mobile hero: 41.05 KB WebP
- Lighthouse transferred bytes: 61.9 KB

There is no separate JavaScript lint script. TypeScript `--noEmit` runs in the
production build; Rust formatting and Clippy were run separately.

## Live end-to-end evidence

The smallest useful product flow passed on live production:

1. Entered the sample in one click and confirmed six entries in the isolated
   `demo:worklog-bridge:project` namespace.
2. Entered a negative hourly rate; the app explained the error and restored
   the previous value.
3. Rewrote an entry and saved the maximum 1,440-minute boundary.
4. Supplied malformed ICS input; the app explained the failure and recovered.
5. Imported a one-minute event at the start of the chosen week, excluded an
   event at the next-week boundary, and rejected an empty selection.
6. Exported the resulting eight-line CSV.
7. Created a private approval URL, exercised required-field validation,
   accepted it, reloaded it, and downloaded the server-attested receipt.
8. Confirmed the acceptance request body had exactly `packetDigest` and
   `approver`, with no worklog entry content.
9. Confirmed a modified fragment produces **This worklog was changed**.
10. Reset the demo and left it; the demo key was discarded and the real
    workspace remained empty with **Load sample project** visible.

Receipt persistence returned 204 before acceptance, 201 on acceptance, and
200 with the same receipt after reload. Five concurrent acceptances for a new
digest returned one 201 and four 409 responses; all converged on one receipt
ID, and a subsequent lookup returned `valid: true`.

The unlicensed path remains useful. A live invalid license check went only to
`api.sociobot.in`, returned 200 with an invalid verdict, removed the token from
the URL, kept Pro locked, and left editing and CSV export available. The paid
link returns 303 to hosted Dodo checkout through the Sociobot API.

## Privacy, accessibility, and browser checks

- The cold page requested only same-origin HTML, JS, CSS, and hero art.
- The complete demo/edit/export/share/accept flow sent worklog data only to
  the same origin. The only external browser request in the broader route scan
  was the documented GitHub Releases API call on `/download`.
- No analytics, advertising, remote fonts, third-party scripts, camera,
  microphone, screen, keystroke, or timer request was observed.
- Static response headers include CSP, `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and disabled camera, microphone,
  and geolocation. Health and approval responses use `Cache-Control: no-store`.
- Hashed assets use one-year immutable caching; HTML uses 30-second
  revalidation; `service-worker.js` uses `no-cache`.
- Local production JS, CSS, mobile hero, and service-worker SHA-256 values
  exactly match the live bytes.
- `/`, `/demo`, `/app`, `/privacy`, `/terms`, and `/download` return 200.
  The designed unknown route returns HTTP 404.
- The factory URL verifier passed every public route: one title, `lang=en`,
  one h1, main landmark, image alt text, labelled buttons, and no errors.
- Playwright Axe found zero serious or critical violations on all public
  routes at 390 px. The product suite also scans desktop and the approval route.
- Keyboard-only checks passed: skip link to the first main action, mobile menu,
  `n` add-entry shortcut, dialog focus trap, Escape focus restoration, and `e`
  CSV export. The focus ring is a visible 3 px `#fff19a` outline.
- At 390 px there is no horizontal page overflow and all tested controls meet
  the 44 px target baseline. Reduced-motion mode leaves zero active transitions
  or animations.
- The versioned service worker controlled the demo, removed a seeded stale
  cache during reinstall, and reloaded all six sample entries offline.
- No console error or uncaught page error appeared in the tested routes or flow.

Live mobile Lighthouse:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1,100 ms |
| LCP | 1,400 ms |
| TBT | 8 ms |
| CLS | 0 |

Navigation-only Lighthouse does not report INP.

## Rate limits and installer/release checks

Starting in a fresh fixed-minute window from one client:

- approval reads: 60 returned 204; request 61 returned 429 with
  `Retry-After: 60`;
- approval writes: one returned 201 and eleven returned 409 as immutable
  duplicates; request 13 returned 429 with `Retry-After: 60`.

The live Linux installer downloaded the published AppImage into an isolated
directory, verified it, and installed an executable ELF. Its SHA-256 is
`245d046803aeded1381828f63a746b68336d6b93e71998a40898f5d84cc9ef34`,
matching `SHA256SUMS`. This is valid evidence for the published predecessor,
not for candidate `2ea2ddab...`.

## Required next action

Publish a new immutable desktop release and deployment whose release target,
`latest.json`, every platform artifact, Download page, and `/api/health` all
identify one nominated source commit. Then rerun all claim commands in a
worker image with the documented Tauri prerequisites already installed, and
request fresh independent verification.

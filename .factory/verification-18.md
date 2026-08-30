# Independent verification 18 — PASS

**Candidate:** `aedc0f453580967435089a3dd79f6ffe7e124115`  
**Live target:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 30 August 2026 UTC

## Decision

**PASS — this candidate is releasable.** Fresh evidence shows that the live
site, receipt API, `v0.1.22` release, and desktop artifact manifest all identify
the nominated commit. The deployment-only failure from verification 17 is
resolved. No critical, high, or medium defect was found.

## Mandatory first gates

### Cold first read — PASS

A fresh 1440 × 900 browser context loaded the live page with HTTP 200 and no
console or page errors. The first screen answers all three required questions:

- **What:** “Turn activity into an approved worklog”.
- **For whom:** “For freelancers who rebuild billable work from Git and
  calendars each week.”
- **What to click first:** the visible “Try it with sample data” action; the
  adjacent sentence says a filled weekly worklog opens and real work stays
  unchanged.

The action opens `/demo` in one click. It immediately shows the six-entry
Northstar Health worklog and the persistent “Demo — sample data, nothing is
saved” banner. At 390 × 844 the same answer, action, and privacy/offline/price
facts remain in the first viewport.

### Claim registry — PASS

`.factory/claims.json` exists. After the clean root lockfile install
(`npm ci`), every listed command ran separately and verbatim. The API lockfile
install (`npm --prefix api ci`) also completed before the full suite:

| Claim | Result | Claim | Result |
| --- | --- | --- | --- |
| offline-reload | PASS | csv-export | PASS |
| local-demo | PASS | desktop-sample-project | PASS |
| entry-review | PASS | free-editor | PASS |
| approval-receipt | PASS | worklog-details-local | PASS |
| installed-app-locality | PASS | no-surveillance | PASS |
| calendar-import | PASS | git-metadata | PASS |
| no-repository-upload | PASS | license-unlock | PASS |
| sample-counts | PASS | pro-price | PASS |
| no-analytics | PASS | release-discovery | PASS |
| public-health-fields | PASS | installer-sha256 | PASS |
| release-provenance | PASS | release-signing-mode | PASS |

Result: **22 passed, 0 failed**. Landing and README claims were cross-checked
against the registry; no unlisted behavioral or privacy claim was found.

## Clean local quality gates — PASS

- Root and API installs completed with zero audit vulnerabilities.
- `npm test`: PASS — 29 Node/API/workflow tests and 37 Chromium tests.
- `npm run build`: PASS; TypeScript checking completed and `dist/site` was
  produced. No separate lint script exists.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: PASS.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets
  --all-features -- -D warnings`: PASS after installing the documented Linux
  Tauri prerequisites.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS — 2 native tests.
- `CI=1 npm run build:desktop`: PASS. Fresh outputs were AppImage 76,462,584
  bytes, DEB 1,678,572 bytes, and RPM 1,680,576 bytes. The fresh local
  AppImage SHA-256 was
  `f7101738aeb5d8b40ab795714861bad064a362ca1f2e57eadf5ef45d52215e19`.
- The release binary stayed alive for an eight-second Xvfb smoke test; only
  expected headless EGL/DRI3 warnings appeared.

## Live product and recovery paths — PASS

- Demo edit, review, export, share, accept, receipt download, reload, reset
  isolation, and offline behavior were exercised from fresh browser storage.
- A `0`-minute entry was rejected with the native message “Value must be
  greater than or equal to 1.” The `1440`-minute boundary saved successfully.
- A negative hourly rate was rejected, the previous value was restored, and
  the live error explained how to recover.
- The edited demo exported seven CSV records. Its approval receipt survived a
  reload and never contacted `/api/approvals`.
- In a fresh real workspace, a one-minute entry at the valid `$0` boundary was
  added and exported. The live approval was accepted as “Independent QA 18”,
  downloaded as attested receipt
  `85e5c738-4fe0-4486-9f14-ccddaa9c7780`, and remained immutable after reload.
- The acceptance POST contained exactly `approver` and `packetDigest`; it did
  not contain the client, summary, detail, rate, or repository data.
- A live invalid license returned a clear inactive-license message and left
  Pro locked. No sign-in is required, so the Entra tenant condition does not
  apply.

## Privacy, API, and security — PASS

- The complete demo flow contacted only
  `https://worklog-approval-bridge.sociobot.in`. It made no analytics,
  advertising, font, approval API, or capture request. Instrumented camera,
  display capture, and interval counts all remained zero.
- Static responses include CSP, HSTS, `nosniff`, strict referrer policy, and a
  permissions policy disabling camera, microphone, and geolocation. Root HTML
  revalidates after 30 seconds; hashed assets cache immutably for one year;
  the service worker uses `no-cache`; receipt API responses use `no-store`.
- `/api/health` returned version `0.1.22` and commit
  `aedc0f453580967435089a3dd79f6ffe7e124115` without configuration data.
- In a fresh fixed-minute window, approval reads 1–60 returned 204 and read 61
  returned `429` with `Retry-After: 60`. Invalid writes 1–12 returned 400 and
  write 13 returned `429` with `Retry-After: 60`. Observed allowance:
  **60 reads and 12 writes per client per minute**.
- Five concurrent valid acceptances for one new digest returned one 201 and
  four 409 responses, all with one receipt ID. A following lookup returned
  that valid receipt, confirming first-writer immutability and persistence.
- Sociobot license verification allowed 30 invalid-token checks; request 31
  returned `429` with `Retry-After: 4`. The checkout returned 303 to the hosted
  Dodo checkout.

## Deployment, release, and install — PASS

- `npm run verify:delivery` passed: live checkout, API identity, isolated demo,
  real approval lookup, routing, release provenance, and a downloaded DEB
  checksum all matched the candidate.
- `npm run verify:release -- --tag v0.1.22 --expected-commit aedc0f4…` passed.
  The verified published DEB SHA-256 is
  `34f17843fe50426ddc919f035296b7ff9c148b961b3a6a3eef05467367b81390`.
- GitHub release `v0.1.22` targets the full candidate and contains macOS arm64
  and x64 DMGs, Windows EXE and MSI, Linux AppImage and DEB, `SHA256SUMS`, and
  `latest.json`. Every manifest entry repeats the candidate commit.
- The live Linux one-line installer selected the immutable v0.1.22 AppImage,
  verified SHA-256
  `b55bcc47f79b80ff2ecd4cd3acbd1731dbf6f7fc7c05e27796d0392c6e0afedc`,
  and installed it in an isolated directory. Direct mounting is unavailable
  in this container because it has no FUSE device; the standard
  `APPIMAGE_EXTRACT_AND_RUN=1` fallback stayed alive for the smoke interval.
- Live main JavaScript and CSS are byte-for-byte equal to the locally built
  candidate assets. Unknown routes preserve HTTP 404 and show the designed
  recovery page. All discovered HTTP links resolved; the hosted checkout and
  immutable download links redirected as intended.

## Accessibility, PWA, and performance — PASS

- `/opt/fleet/lib/verify-url.sh` passed `/`, `/demo`, `/app`, `/privacy`,
  `/terms`, and `/download`: HTTP 200, route-specific title, `lang=en`, one h1,
  main landmark, image alternatives, labelled buttons, and no console errors.
- Independent Axe scans at 1440 px and 390 px found zero serious or critical
  findings on all six routes. No route had horizontal overflow.
- Every visible mobile link/button was at least 44 × 46 CSS px. The first Tab
  reveals the skip link with a 3 px `rgb(255, 241, 154)` outline; activation
  focuses the h1. `/`, `n`, Escape, modal trapping, and focus restoration work.
- Reduced-motion mode reports `scroll-behavior: auto` and 0.00001-second
  maximum animation/transition durations.
- The content-hashed service worker (`worklog-bridge-585177171e0d`) activates,
  updates successfully, owns the page, and preserves the demo on offline
  reload.
- Initial JavaScript is 15.93 KB gzip, CSS is 4.87 KB gzip, fonts are 0 bytes,
  and the largest hero WebP is 96.7 KB. All budgets pass.
- Mobile Lighthouse: performance 99, accessibility 100, best practices 100,
  SEO 100; FCP 0.905 s, LCP 1.205 s, CLS 0, TBT 92 ms. A sampled live
  interaction measured 32 ms to presentation.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: `.factory/copy-audit.md` still transcribes the old footer version
  `v0.1.20` instead of `v0.1.22`. Its word-count and banned-word conclusions
  remain valid, but the audit should be refreshed on the next documentation
  pass.

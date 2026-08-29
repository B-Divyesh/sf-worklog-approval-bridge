# Independent verification 16 — PASS

**Candidate:** `08a0778bc086f2dff4624eae5b1ba27a6435a31e`  
**Live target:** <https://worklog-approval-bridge.sociobot.in>  
**Release:** `v0.1.20`  
**Verified:** 29 August 2026 UTC

## Decision

**PASS.** The clean candidate, deployed site and API, and published desktop
release identify the nominated commit. The smallest useful product works end
to end: a freelancer can assemble and redact a weekly worklog from local
evidence, export it, share it in a private fragment URL, and receive a durable,
server-attested one-time acceptance without sending worklog text to the
receipt API.

## Mandatory first gates

### Cold first read — PASS

A fresh 1440 × 900 browser context loaded HTTP 200 with no console or page
errors. The first viewport answers all three required questions:

- What: **“Turn activity into an approved worklog.”**
- For whom: **“For freelancers who rebuild billable work from Git and
  calendars each week.”**
- First action: **“Try it with sample data.”** The adjacent sentence says a
  filled weekly worklog opens and real data is not saved.

The action appears once and opens `/demo` in one click. The demo immediately
shows the six-entry Northstar Health worklog and a persistent **“Demo — sample
data, nothing is saved”** banner with **Reset demo** and **Start for real**.
The same three answers and all three privacy/offline/price facts fit in the
390 × 844 first viewport.

### Claim registry — PASS

`.factory/claims.json` exists and contains 22 claims. After clean `npm ci`, I
ran every listed command separately. Every command exited 0 and every tagged
test passed.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `offline-reload` | PASS | Saved demo reloaded in a new offline browser context. |
| `csv-export` | PASS | CSV contained its header and six sample records. |
| `local-demo` | PASS | Edit, receipt, download, reset, and exit stayed in demo storage with no production approval call. |
| `desktop-sample-project` | PASS | `/app` first run loaded the six-entry sample in one action. |
| `entry-review` | PASS | Text, time, ready state, removal, reload, and resulting CSV were verified. |
| `free-editor` | PASS | An unlicensed real workspace added an entry and exported CSV. |
| `approval-receipt` | PASS | Mocked service recorded one acceptance, survived reload, verified its attestation, and downloaded a receipt. |
| `worklog-details-local` | PASS | Acceptance body contained only digest and supplied name. |
| `installed-app-locality` | PASS | Production `/app` import, edit, export, and link creation stayed in WebView storage with no app-network request. |
| `no-surveillance` | PASS | No screen, microphone, keystroke, or timer capture occurred. |
| `calendar-import` | PASS | Only selected events inside the chosen week were imported. |
| `git-metadata` | PASS | Temporary local repository returned hash, date, and subject. |
| `no-repository-upload` | PASS | Repository collection made no connection to its loopback remote. |
| `license-unlock` | PASS | Valid, invalid, absent, expired, revoked, offline, and 24-hour cache cases passed. |
| `sample-counts` | PASS | Landing counts matched four Git and two calendar entries. |
| `pro-price` | PASS | Controlled checkout asserted $12.00 monthly; licensed history survived reload. |
| `no-analytics` | PASS | Full sample approval/receipt request allowlist contained no analytics or advertising call. |
| `release-discovery` | PASS | GitHub API discovery selected only an immutable release and rendered its failure state. |
| `public-health-fields` | PASS | Health output exposed only service, version, and commit. |
| `installer-sha256` | PASS | Matching installer bytes passed and a mismatch stopped before installation. |
| `release-provenance` | PASS | Every desktop platform was bound to the immutable source commit. |
| `release-signing-mode` | PASS | Unsigned mode and complete/partial signing credential cases behaved as documented. |

The browser claim commands were the exact `npm test -- --grep
@claim:<id>` entries. The native commands were the exact `cargo test`
entries, and the four standalone Node commands were also run verbatim.

## Clean local gates and production builds

- Repository began clean at the exact candidate SHA.
- Root `npm ci`: 37 packages, 0 vulnerabilities. API `npm ci`: 28 packages,
  0 vulnerabilities.
- `npm test`: PASS — 27 Node/service/workflow tests and 36 Chromium tests.
- Type check: PASS through `tsc --noEmit` in the production build.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: PASS.
- Strict Clippy across all targets/features with `-D warnings`: PASS.
- Full Rust test suite: PASS — 2 tests.
- `npm run build`: PASS; produced `dist/site`.
- `CI=1 npm run build:desktop`: PASS after installing the Linux Tauri
  packages documented in the README. It produced a 76,462,584-byte AppImage,
  1,677,920-byte DEB, and 1,680,250-byte RPM. The binary is stripped.
- The freshly published AppImage was installed by `public/install.sh` into a
  temporary directory. Its SHA-256 was
  `923edf4f82632e985a05776c86b053c091999d0398f152dfa30eb233cc551f78`.
  Its runtime identified correctly and it remained running for the full
  eight-second Xvfb smoke window. Direct launch without a display failed at
  GTK initialization, as expected for this headless worker.

No JavaScript lint script is defined. TypeScript checking and Rust Clippy are
the available static gates.

## Live identity, release, and installer evidence

- `npm run verify:live -- --expected-commit 08a0778...`: PASS.
- `/api/health` returned version `0.1.20` and exact commit
  `08a0778bc086f2dff4624eae5b1ba27a6435a31e` with `Cache-Control: no-store`.
- `npm run verify:release -- --tag v0.1.20 --expected-commit 08a0778...`:
  PASS. It downloaded and checksum-verified the Linux DEB as
  `015b85607077c64306bc3282988a1bdb073f4b50717b1a9dd5c5962c7fbc615`.
- GitHub release `v0.1.20` targets the exact candidate and publishes
  macOS arm64/x64 DMGs, Windows MSI/EXE, Linux AppImage/DEB,
  `SHA256SUMS`, and `latest.json`. Every manifest record contains the exact
  candidate SHA.
- The live Download page detected Linux and linked the immutable v0.1.20
  AppImage. All local and external links returned 200 or the expected 302/303
  navigation response; mail links were excluded.
- Locally built main JS, core JS, CSS, and service worker hashes matched their
  live counterparts byte for byte.

## Independent live product flow

In a fresh real workspace I entered a client, repaired a rejected Tuesday week
start, and repaired a rejected negative rate. Required blank text, 0 minutes,
and 1,441 minutes remained invalid. The accepted boundary entries were one
minute and 1,440 minutes. Exported CSV contained exactly those two records.

The generated approval URL kept all visible worklog data after `#`. Its first
receipt lookup returned 204. Acceptance returned 201 with a UUID receipt,
SHA-256 digest, supplied name, server time, and attestation. Reload returned
200 and disabled acceptance. A second POST using a different name returned
409 with the original receipt and original approver unchanged. The actual
acceptance body was exactly:

```json
{"packetDigest":"74b821143b8d43399a47ade8b367b235b1db464fdc351f2c97a2dc1c1901d7e3","approver":"Independent QA 16"}
```

No client name, rate, entry text, duration, date, or repository content was
sent. A malformed ICS file produced the recoverable message “No calendar
events were found for the week of 2026-08-24. Choose another ICS file.”

The live hosted checkout opened on Dodo as **Sociobot | Checkout** and showed
**Worklog Bridge Pro — $12.00 / Month**. An invalid live license check returned
`{valid:false, reason:"invalid", expires_at:null}` with `no-store` and the
correct Worklog Bridge CORS origin. No sign-in is required, so the Entra tenant
requirement is not applicable.

## Privacy, security, and server behavior

- Playwright recorded only
  `https://worklog-approval-bridge.sociobot.in` during the complete real
  edit/export/share/accept/reload flow and during the demo receipt flow.
- There were no analytics, advertising, remote font, or capture requests and
  no console/page errors on valid routes.
- Browser response headers included a matching CSP, `frame-ancestors 'none'`,
  HSTS, `nosniff`, strict-origin referrer policy, and denied camera,
  microphone, and geolocation.
- HTML uses a 30-second revalidation policy; hashed JS/CSS use one-year
  immutable caching; the service worker uses `no-cache`; API/receipt responses
  use `no-store`.
- In a fresh single-client minute, reads 1–60 returned 204 and read 61 returned
  `429` with `Retry-After: 60`. Invalid writes 1–12 returned 400 and write 13
  returned `429` with `Retry-After: 60`. A separate concurrent burst admitted
  exactly 60 of 61 reads and returned one 429, also with `Retry-After: 60`.
  The observed allowance is therefore **60 reads and 12 writes per client per
  minute**.
- The receipt persisted across fresh requests and was immutable. The local
  concurrent storage test also passed its ETag contention case.

## Accessibility, mobile, PWA, and performance

- `/`, `/demo`, `/app`, `/privacy`, `/terms`, `/download`, and the real HTTP
  404 route were checked at 1440 × 900 and 390 × 844. Each had `lang="en"`, a
  route-specific title, one h1, one main landmark, complete image alternatives,
  no horizontal overflow, and no serious/critical Axe findings.
- The factory `verify-url.sh` passed all six public routes with no console
  errors, missing alt text, or unlabeled buttons.
- Keyboard smoke: first Tab revealed **Skip to main content** with a 3px
  `#fff19a` outline; Enter navigated to `#main`; `/` focused the entry filter;
  `n` opened the entry dialog; Escape closed it and restored **Add entry**.
- Back/forward restoration on live returned the home route to exactly
  `scrollY=1100` and restored focus to Privacy; forward returned Privacy to
  `scrollY=0` with its h1 focused.
- At 200% root text size on 390px, the page retained zero horizontal overflow
  and the sample action remained visible. Interactive controls met the 44px
  test; zero-sized mobile navigation links were inside the closed menu and
  not rendered targets.
- Reduced motion matched and reduced transition/animation duration to
  `0.00001s`, removed smooth scrolling, and used no looping animation.
- The active worker was `/service-worker.js`. Re-registration removed a seeded
  stale Worklog cache and left only `worklog-bridge-075444b8382a`; `/demo`
  then reloaded offline with its data and sandbox banner intact.
- Fresh mobile Lighthouse: Performance 96, Accessibility 100, Best Practices
  100, SEO 100; FCP 977 ms, LCP 1,277 ms, TBT 230 ms, CLS 0. Total first load
  was 62,889 bytes with 14,868 bytes transferred script, 5,132 bytes CSS, no
  font transfer, and no third-party transfer.
- Build sizes: 14.62 KB gzip main JS + 1.01 KB gzip core JS, 4.85 KB gzip CSS,
  and 41,054-byte mobile hero. All are well within the contract budgets.

## Documentation and claims audit

README, MIT license, `/privacy`, `/terms`, `.factory/demo.md`, design tokens,
motion policy, generated-art provenance, manifest, robots, sitemap, social
metadata, and a genuine 404 are present. The copy audit contains no sentence
over 22 words and no banned term. Each claim has one corresponding tagged or
explicitly named native test; no unlisted public product claim was found.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

The macOS and Windows packages are intentionally unsigned previews. This is
disclosed site-wide, on Download, in the package description, and in README;
it is an operator signing limitation, not an undisclosed product defect.

# Verification 8 — FAIL

**Candidate:** `c1c9aa9a22eca9c579696725b6b4d0ce7af7cae3`

**Live URL:** https://worklog-approval-bridge.sociobot.in

**Verified:** 29 August 2026 UTC

## Decision

**FAIL.** The local application, static deployment, demo, approval receipt flow, privacy boundary, accessibility automation, offline behavior, rate limits, and published checksums work. The release is not acceptable because the advertised paid subscription still leads to HTTP 404. In addition, the downloadable desktop release identifies source commit `5cad9b3…`, not the nominated candidate, and the receipt API has no health/build identity with which to establish its deployed revision.

## Release-blocking defects

### Critical — the advertised Pro subscription cannot be purchased

- The landing pricing section and license dialog link to `https://api.sociobot.in/api/v1/products/worklog-approval-bridge/checkout`.
- A fresh direct request on 29 August 2026 returned HTTP **404** and `{"error":"enabled factory product","status":404}`.
- This is the only purchase action for the advertised `$12 / user / month` Pro tier. Calendar import and saved approval history therefore cannot be purchased end to end.
- The license verification endpoint itself is available and correctly returned `{ "valid": false, "reason": "invalid" }` for a fresh invalid token. The missing checkout registration, not client-side verification, is the blocker.

### High — published desktop artifacts are not tied to the candidate commit

- `npm run verify:release -- --tag v0.1.6 --expected-commit c1c9aa9a22eca9c579696725b6b4d0ce7af7cae3` failed: the release tag resolves to `5cad9b3f575059ab4330637b3dd1d132580c35c7`.
- `/download` displays `Built from source 5cad9b3` on Linux, Windows, and macOS.
- `latest.json` consistently records `5cad9b3…` for every published file. The release is internally consistent and its checksums pass, but it is not a release of the nominated candidate.
- The only repository difference between `v0.1.6` and the candidate is `.factory/handoff.md`; the live static product bytes are nevertheless byte-identical to the candidate build. This limits practical risk but does not satisfy exact candidate provenance.

### High — the deployed API has no health/build identity

- `/api/health`, `/api/version`, and `/api/build` all return HTTP 404.
- Concurrency and rate-limit behavior match the source, but there is no endpoint or response field that identifies the deployed backend commit/version. The API half of the live deployment therefore cannot be proven to match `c1c9aa9…`.

## Other defects

### Medium — some links miss the 44 px target requirement

- At 390 px, the live `/download` link `See every release file` renders 173 × 19 CSS px.
- At desktop width, the four header navigation links render 16 px high.
- Primary mobile workflow controls, demo controls, footer links, and buttons meet the target. Axe does not detect this manual target-size rule.

### Medium — the three required plain facts fall below the cold first viewport

- At 1440 × 900, the headline, audience sentence, sample action, and its outcome are visible, so the explicit first-read gate passes.
- The privacy/offline/price fact list begins below the captured first viewport. The attached plain-words contract requires those three facts on the first screen.

## Mandatory claims gate

`.factory/claims.json` exists with 15 entries. Every exact command passed after the locked Node install and the README-documented Tauri Linux prerequisites were installed.

The two Rust commands were first attempted before installing those platform packages and exited 101 while `glib-sys` looked for `glib-2.0.pc`; neither test binary ran. After installing the documented packages, both exact commands passed. This was an environment bootstrap failure, not a failed product assertion.

| Claim | Result | Fresh evidence |
|---|---|---|
| `offline-reload` | PASS | Demo data survived offline reload. |
| `csv-export` | PASS | Export contained the header and six seeded records. |
| `local-demo` | PASS | Real and demo namespaces remained separate; the live flow used only the product origin. |
| `approval-receipt` | PASS | Fresh acceptance persisted across reload and returned a server-attested receipt. |
| `worklog-details-local` | PASS | Live POST body contained only `packetDigest` and `approver`. |
| `no-surveillance` | PASS | Capture/request instrumentation found no screen, media, timer, analytics, or advertising collection. |
| `calendar-import` | PASS | Only a selected in-week ICS event imported; a next-week event was excluded. |
| `git-metadata` | PASS | Temporary-repository Rust test returned only hash, date, and subject for the selected week. |
| `no-repository-upload` | PASS | Rust loopback-remote test observed no connection. |
| `license-unlock` | PASS | Valid/fresh, invalid, absent, expired, revoked, offline, and 24-hour states passed. |
| `sample-counts` | PASS | Landing and demo agree on four Git plus two calendar entries. |
| `pro-price` | PASS | `$12 / user / month`, ICS import, history, and required checkout URL are present. The checkout itself is dead, as reported above. |
| `no-analytics` | PASS | Demo/export/share request capture remained same-origin. |
| `installer-sha256` | PASS | Fixture test and fresh live Linux installer verified the published SHA-256. |
| `release-provenance` | PASS (claim fixture) | Fixture rejects mixed/stale sources; the live release is internally bound to `5cad9b3…`, not this candidate. |

## First-read gate

**PASS.** A cold 1440 × 900 visit answers the three required questions in plain words:

- What: `Turn activity into an approved worklog`.
- For whom: freelancers rebuilding billable work from Git and calendars each week.
- First click: `Try it with sample data`; adjacent text says a filled weekly worklog opens and does not affect real data.

The action is one click from the landing page. It opened six realistic Northstar Health entries with the persistent `Demo — sample data, nothing is saved` banner, `Reset demo`, and `Start for real`. A separately seeded `QA Real Workspace` survived entering/leaving demo, while the `demo:` key was discarded.

## Clean local verification

Commands run from candidate `c1c9aa9…`:

```text
npm ci                                      PASS; 0 vulnerabilities
npm --prefix api ci                         PASS; 0 vulnerabilities
npm test                                    PASS; 13 Node/API/script + 25 Chromium
cargo test --manifest-path src-tauri/Cargo.toml
                                             PASS; 2 tests
npm run build                               PASS; wrote dist/site
CI=1 npm run build:desktop                  PASS; DEB, RPM, AppImage
git diff --check                            PASS before report edits
```

There is no lint script. `tsc --noEmit` runs inside `build:site` and passed.

Production payload is within budget:

- Main JS: 42.44 KB raw / 13.93 KB gzip.
- Lazy Tauri core JS: 2.48 KB raw / 1.03 KB gzip.
- CSS: 17.21 KB raw / 4.75 KB gzip.
- Mobile hero: 41.05 KB; desktop hero: 96.69 KB.
- No remote fonts, third-party scripts, analytics, or advertising requests loaded.

## Live functional, privacy, and backend evidence

- Fresh normal flow passed: demo → edit/add → invalid recovery → ICS selection → CSV → approval link → client acceptance → receipt reload.
- Empty client, non-Monday week, negative rate, zero minutes, empty source selection, and malformed/no-week ICS were blocked with recovery text. A 1,440-minute boundary entry saved. HTML-like detail rendered as text.
- Fresh receipt: `3dff0e77-a832-4969-a4c2-11f87067cd81`; digest `cc1230ecf05e7e9a7af32765785569e7a5f4619c068686992c1f4135fb617b77`; approver `QA Verifier 8 1787983173463`.
- The acceptance POST was exactly `{"packetDigest":"cc1230ecf05e7e9a7af32765785569e7a5f4619c068686992c1f4135fb617b77","approver":"QA Verifier 8 1787983173463"}`. No client name, entry, detail, rate, repository path, or calendar content left the browser.
- All requests through demo, export, link creation, review, acceptance, and receipt reload used `https://worklog-approval-bridge.sociobot.in` only. Console/page errors: zero.
- Five concurrent writes for a new digest returned one 201 and four 409 responses with the same receipt ID. A following lookup returned 200 and `valid: true`, confirming immutable persistence.
- Approval allowance observed from one client in a fresh minute: reads 1–60 returned 204, read 61 returned 429 with `Retry-After: 60`; invalid writes 1–12 returned 400, write 13 returned 429 with `Retry-After: 60`.
- Sociobot license verification allowance observed: requests 1–30 returned 200, request 31 returned 429 with `Retry-After: 4`.
- Approval responses use `Cache-Control: no-store` and HSTS. The app does not require sign-in, so the Entra tenant condition is not applicable.

## Accessibility, mobile, routing, and offline

- `/opt/fleet/lib/verify-url.sh` passed the live root: title, `lang=en`, one H1, one main, image alt text, button names, and no console errors.
- Fresh Axe scans found zero serious/critical findings on `/`, `/demo`, `/privacy`, `/terms`, and `/download` at 1440 px and 390 px.
- Keyboard Tab reaches the skip link; after its reduced-motion 0.01 ms style transition it has a 3 px `#fff19a` focus outline. Entry and license dialogs trap focus, close on Escape, and restore their trigger. `/` focuses filtering and `n` opens a new entry.
- At 390 × 844 every tested route had zero horizontal overflow. The demo, worklog actions, and mobile navigation remained usable.
- Reduced-motion emulation reported no active animation and `scroll-behavior: auto`.
- Unknown paths return a genuine HTTP 404 with a designed recovery page. All internal routes, metadata files, social image, favicon, robots, sitemap, privacy, and terms return 200.
- Service-worker replacement removed a seeded stale cache, leaving only `worklog-bridge-c491297176d0`. Offline `/demo` reloaded with saved edits and an explicit offline status. The worker uses `Cache-Control: no-cache`.

## Headers, caching, performance, and deployment bytes

- HTML: HSTS, strict CSP, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial; `Cache-Control: public, must-revalidate, max-age=30`.
- Hashed JS/CSS: `Cache-Control: public, max-age=31536000, immutable`.
- Mobile Lighthouse: performance **98**, accessibility **100**, best practices **100**, SEO **100**; FCP 0.9 s, LCP 1.2 s, TBT 170 ms, CLS 0. No warnings.
- Live and candidate production hashes match for `index.html` (`c4912971…`), main JS (`27b7231a…`), CSS (`974f9c13…`), and service worker (`d3c36a2c…`). Thus the static site bytes match the candidate despite the release/API identity defects.

## Desktop delivery evidence

- The release contains macOS arm64/x64 DMGs, Windows EXE/MSI, Linux AppImage/DEB, `SHA256SUMS`, and `latest.json`.
- Internal release verification at its actual source commit `5cad9b3…` passed. The downloaded DEB matched `4c09f2bf…ca14`.
- A fresh Linux one-line install into a temporary directory succeeded. The installed AppImage matched `48505b11…329` and reported a valid type-2 AppImage runtime.
- Live OS detection selected a real v0.1.6 asset for Linux, Windows, and macOS with zero console errors.
- Packages are unsigned, and the download page discloses that fact.

## Scope and cleanup

No product code was modified. QA created two production approval records containing only the designed digest/name/timestamp/receipt fields: the normal acceptance above and concurrency receipt `b8e67150-94e5-4bbd-a435-79c56a0716fe`. Screenshots, Lighthouse output, headers, and installer files remained under `/tmp`.

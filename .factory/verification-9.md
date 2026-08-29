# Verification 9 — FAIL

**Candidate:** `28be18d63d2eac097439b143588fd3cbe2831f3c`
**Live URL:** https://worklog-approval-bridge.sociobot.in
**Verified:** 29 August 2026 UTC

## Decision

**FAIL.** The candidate builds and its local demo/claim suite is strong, but the live product is not an acceptable deployment of this candidate. The deployed receipt API identifies a previous commit, live rate limiting is not enforced, and a serious accessibility contrast defect exists on the client approval form. The published desktop release is also tied to the prior commit rather than this candidate.

## Required first checks

### Claims gate — PASS after documented desktop prerequisites

`.factory/claims.json` exists with 15 entries. I first ran every declared command from the clean checkout after `npm ci`, before opening the live site. The two Rust commands initially exited 101 because the disposable worker lacked `glib-2.0.pc`; no assertion ran. After installing the normal Tauri/Linux development prerequisites (`libglib2.0-dev`, WebKitGTK, appindicator, librsvg, `file`, `patchelf`, and `rpm`), both exact commands passed. This is an environment bootstrap issue, not a failed assertion.

| Claim | Exact command result |
|---|---|
| `offline-reload` | PASS |
| `csv-export` | PASS |
| `local-demo` | PASS |
| `approval-receipt` | PASS |
| `worklog-details-local` | PASS |
| `no-surveillance` | PASS |
| `calendar-import` | PASS |
| `git-metadata` | PASS |
| `no-repository-upload` | PASS |
| `license-unlock` | PASS |
| `sample-counts` | PASS |
| `pro-price` | PASS |
| `no-analytics` | PASS |
| `installer-sha256` | PASS |
| `release-provenance` | PASS (fixture claim; live release provenance fails below) |

### Cold first-read gate — PASS

A fresh 1440 × 900 page answered all three questions in plain words:

- **What:** “Turn activity into an approved worklog.”
- **For whom:** “For freelancers who rebuild billable work from Git and calendars each week.”
- **First action:** “Try it with sample data”; the adjacent sentence says a filled weekly worklog opens and real data is not saved.

The one-click action is present and opens a realistic six-entry Northstar Health worklog with the persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Start for real controls.

## Release-blocking defects

### Critical — live receipt API does not enforce its documented allowance

The source defines a 60-read/minute allowance and returns `429` with `Retry-After` when it is exceeded. Fresh live evidence does not do this.

- From one Node client, I issued **65 sequential** `GET /api/approvals?packetDigest=aaaa…` requests in one run.
- All **65 returned 204**. No request returned 429 and no `Retry-After` header was observed.
- This violates the required server-side request allowance and leaves the anonymous receipt endpoint unprotected from the documented abuse boundary.

### High — deployed backend identity is not the candidate

`GET /api/health` returned:

```json
{"status":"ok","build":{"service":"worklog-approval-bridge-receipts","version":"0.1.7","commit":"5fb3fbf55f08b881129f62cf3451371df3953138"}}
```

That differs from nominated candidate `28be18d63d2eac097439b143588fd3cbe2831f3c`. The local `npm run verify:live -- --expected-commit …` script incorrectly passed because it reads `EXPECTED_COMMIT` only from the environment and silently ignores its CLI argument; the raw health response is the authoritative fresh evidence.

### High — published desktop release is not the candidate

`npm run verify:release -- --tag v0.1.7 --expected-commit 28be18d63d2eac097439b143588fd3cbe2831f3c` failed:

```text
actual:   5fb3fbf55f08b881129f62cf3451371df3953138
expected: 28be18d63d2eac097439b143588fd3cbe2831f3c
```

The published release and `latest.json` are consistently tied to `5fb3fbf…`, not this candidate. The static app assets have the same names and bytes as the candidate production build, but the desktop artifact and server-side API provenance requirement is not met.

### High — serious Axe contrast failure on the approval route

Fresh Playwright Axe WCAG 2 A/AA scan of a real generated `/approve#…` URL reports one serious finding:

```text
color-contrast — label[for="approver"] “Your name”
foreground #abb5c2 on #f4eddf = 1.78:1; expected >= 4.5:1
```

This client-facing required field fails the attached accessibility baseline.

## Functional, privacy, and UX evidence

- Normal live flow passed: `/demo` → six sample entries → invalid negative rate recovery → approval link → client acceptance → immutable receipt. The receipt for `QA Verifier` displayed an ID, server time, attestation, and download action.
- The approval link placed worklog data in a `#` fragment. Browser request capture throughout the demo, sharing, review, acceptance, and receipt flow used **only** `https://worklog-approval-bridge.sociobot.in`.
- The live approval API requests were exactly one GET lookup and a POST; the POST did not expose worklog entries in its URL. No console errors or page errors occurred.
- The demo showed six entries, `Northstar Health`, 11 h 45 m, and the isolated demo banner. Negative hourly rate recovered with: “Hourly rate must be zero or more. The previous rate was kept.”
- The live receipt service accepted the packet once and displayed an attested receipt. This verification intentionally created a QA acceptance using only the designed digest/name/receipt fields.
- No sign-in is required, so the Microsoft Entra tenant condition is not applicable.

## Accessibility, mobile, offline, and headers

- At 390 × 844, `/demo` had no horizontal overflow (390 px scroll/client width), retained its demo banner and Copy approval link, and emitted no console errors.
- Keyboard regression coverage in `npm test` passed, including skip link, dialog focus trap/Escape restoration, shortcuts, and 44 px target checks.
- Reduced-motion media produced no running animation; its transition durations reduce to 0.01 ms.
- The service worker controlled the live page and offline reload of `/demo` successfully rendered “Review the weekly worklog.” Source regression coverage for versioned service-worker cache naming passed.
- Live root headers include HSTS, `nosniff`, strict-origin referrer policy, `frame-ancestors 'none'`, camera/microphone/geolocation denial, and a CSP limited to self plus the documented GitHub/Sociobot origins. Hashed JS/CSS use `Cache-Control: public, max-age=31536000, immutable`.
- A Lighthouse CLI run was attempted with the installed Playwright Chromium but could not connect to that browser in this container. Bundle evidence is nevertheless within the stated static budgets: main JS 42,476 B raw (13.97 KB gzip in Vite), lazy core 2,483 B (1.01 KB gzip), CSS 17,374 B (4.76 KB gzip), and mobile hero 41,054 B.

## Local quality gates

```text
npm ci                                      PASS (0 vulnerabilities)
npm test                                    PASS (14 Node/API/script + 27 Chromium tests)
cargo test --manifest-path src-tauri/Cargo.toml
                                             PASS (2 tests)
npm run build                               PASS; writes dist/site
CI=1 npm run build:desktop                  PASS; DEB, RPM, AppImage
git diff --check                            PASS before report edits
```

No standalone lint command is defined. `tsc --noEmit` runs inside `build:site` and passed. The desktop build produced:

- `src-tauri/target/release/bundle/deb/Worklog Bridge_0.1.7_amd64.deb`
- `src-tauri/target/release/bundle/rpm/Worklog Bridge-0.1.7-1.x86_64.rpm`
- `src-tauri/target/release/bundle/appimage/Worklog Bridge_0.1.7_amd64.AppImage`

## Required next steps

1. Deploy the receipt API from `28be18d…` and confirm `/api/health` returns that exact commit.
2. Diagnose durable rate-bucket persistence in the deployed Functions/Table configuration. Re-run a fresh 65-read, single-client check and require the 61st read to return 429 with `Retry-After`.
3. Raise approval-form label contrast to at least 4.5:1 and add an Axe scan that exercises a real approval fragment route.
4. Publish/tag desktop artifacts from the nominated candidate, then rerun `verify:release` against its exact SHA.
5. Repair `verify-live.mjs` to parse `--expected-commit` or invoke it with `EXPECTED_COMMIT`; it must not claim candidate identity without enforcing it.

No product source code was modified during this verification. Temporary screenshots, browser artifacts, and the unsuccessful Lighthouse output attempt are outside the repository.

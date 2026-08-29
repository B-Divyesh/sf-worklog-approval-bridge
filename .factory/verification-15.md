# Independent verification 15 — PASS

**Candidate:** `030f1ad3d775d5b618bc8999b8e26dd2f3e2b7a8`  
**Live target:** <https://worklog-approval-bridge.sociobot.in>  
**Release:** `v0.1.18`  
**Date:** 2026-08-29

## Decision

**PASS.** The deployed website, receipt service, published desktop release,
and local candidate all identify the nominated commit. The product completes
the researched job: a freelancer can select local work evidence, redact and
review a weekly worklog, export it, and obtain a one-time, durable,
server-attested client acceptance without sending worklog details to the
receipt service.

## Required first gates

### First read — PASS

A fresh cold load said **“Turn activity into an approved worklog”**, for
**“freelancers who rebuild billable work from Git and calendars each week”**.
The clear first action is **Try it with sample data**, followed by “A filled
weekly worklog opens next. Nothing is saved to your real data.” One click
opened the six-entry Northstar Health sample. `/demo` showed its persistent
“Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for
real**.

### Claim registry — PASS

`.factory/claims.json` exists with 20 claims. After a clean `npm ci`, I invoked
every listed command independently and all exited 0.

| Claim | Result | Command |
| --- | --- | --- |
| offline-reload | PASS | `npm test -- --grep @claim:offline-reload` |
| csv-export | PASS | `npm test -- --grep @claim:csv-export` |
| local-demo | PASS | `npm test -- --grep @claim:local-demo` |
| desktop-sample-project | PASS | `npm test -- --grep @claim:desktop-sample-project` |
| entry-review | PASS | `npm test -- --grep @claim:entry-review` |
| free-editor | PASS | `npm test -- --grep @claim:free-editor` |
| approval-receipt | PASS | `npm test -- --grep @claim:approval-receipt` |
| worklog-details-local | PASS | `npm test -- --grep @claim:worklog-details-local` |
| no-surveillance | PASS | `npm test -- --grep @claim:no-surveillance` |
| calendar-import | PASS | `npm test -- --grep @claim:calendar-import` |
| git-metadata | PASS | `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` |
| no-repository-upload | PASS | `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload` |
| license-unlock | PASS | `npm test -- --grep @claim:license-unlock` |
| sample-counts | PASS | `npm test -- --grep @claim:sample-counts` |
| pro-price | PASS | `npm test -- --grep @claim:pro-price` |
| no-analytics | PASS | `npm test -- --grep @claim:no-analytics` |
| release-discovery | PASS | `npm test -- --grep @claim:release-discovery` |
| public-health-fields | PASS | `node --test --test-name-pattern @claim:public-health-fields api/test/receipt-service.test.mjs` |
| installer-sha256 | PASS | `node --test --test-name-pattern @claim:installer-sha256 scripts/installer-verification.test.mjs` |
| release-provenance | PASS | `node --test --test-name-pattern @claim:release-provenance scripts/release-provenance.test.mjs` |

## Local quality and desktop package

- Clean `npm ci` passed (37 packages, no vulnerabilities); `npm --prefix api
  ci` passed (28 packages, no vulnerabilities).
- `npm test` passed: 27 Node/script and 33 Chromium tests.
- Rust format, strict Clippy, and the full Rust suite passed (two tests).
- `npm run build` passed and produced `dist/site`.
- `CI=1 npm run build:desktop` passed after installing the Linux Tauri packages
  explicitly documented in the README. It produced a 1,674,634-byte DEB, a
  1,676,153-byte RPM, and a 76,458,488-byte AppImage. A bare initial attempt
  stopped at the expected missing `glib-2.0.pc` system prerequisite; no source
  change was made before the documented-prerequisite rerun.

## Candidate and release identity

- `npm run verify:live -- --expected-commit
  030f1ad3d775d5b618bc8999b8e26dd2f3e2b7a8` passed. Live `/api/health`
  returned version `0.1.18` and the exact candidate SHA.
- `npm run verify:release -- --tag v0.1.18 --expected-commit
  030f1ad3d775d5b618bc8999b8e26dd2f3e2b7a8` passed and verified the published
  Linux DEB checksum `8a32b82658a1966c0d98beb779e8a1bdb073f4b50717b1a9dd5c5962c7fbc615`.
- SHA-256 checks of the built and live main JS, CSS, core JS, mobile hero, and
  service worker all matched byte-for-byte.

## Live end-to-end evidence

In an isolated live demo, I confirmed the six records, reset/exit controls,
CSV export, editing, a 1,440-minute saved entry, a one-minute calendar entry
at the selected-week start, and exclusion of a next-week event. A malformed
ICS file gave a recoverable “No calendar events were found … Choose another
ICS file” message. A negative hourly rate was rejected and restored to 135.

I created a unique approval packet, verified its worklog lives in the URL
fragment, and accepted it as “Independent QA”. The receipt API returned 204
before acceptance, 201 on acceptance, and 200 after reload. The acceptance
remained recorded, its control became disabled, the downloaded receipt had an
ID, SHA-256 digest, approver, time, and server attestation, and a modified
packet showed “This worklog was changed”. The recorded POST was exactly
`{"packetDigest":"<64 lowercase hex characters>","approver":"Independent QA"}`;
it contained no worklog text.

## Privacy, policy, and rate limits

- Cold-load and full demo/edit/export/approval request logs contacted only the
  same origin. There were no analytics, advertising, remote fonts, screen,
  camera, microphone, or timer requests. `/download` uses the documented
  GitHub API; the explicit paid action redirects through Sociobot/Dodo.
- Static responses set CSP with `frame-ancestors 'none'`, HSTS, `nosniff`,
  strict-origin referrer policy, and camera/microphone/geolocation denial.
  Approval and health responses are `no-store`; hashed assets are immutable for
  a year and the service worker is `no-cache`.
- In fresh single-client minute windows, approval reads 1–60 returned 204 and
  read 61 returned `429 Retry-After: 60`; invalid writes 1–12 returned 400 and
  write 13 returned `429 Retry-After: 60`. This proves the documented
  60-read/12-write allowance.

## Accessibility, PWA, and performance

- At 390 by 844, home, demo, app, privacy, terms, download, and the designed
  404 each had one title/h1/main, no horizontal overflow, 44px minimum
  controls, and zero serious/critical Axe violations.
- Keyboard smoke passed: first Tab reached the visible skip link with a 3px
  `#fff19a` focus outline; Enter followed `#main`. Product tests passed modal
  focus trapping/Escape restoration and keyboard shortcuts.
- Reduced motion reduces transition and animation durations to 0.01ms and
  removes transforms. The versioned service worker controlled the demo,
  reloaded it offline, and removed a seeded stale cache on re-registration.
- No application console or page errors occurred on valid routes or the full
  flow. Direct navigation to the deliberately HTTP-404 route produces the
  browser's expected network-404 console message while rendering its recovery
  page.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1,009ms, LCP 1,309ms, TBT 108ms, CLS 0, transferred bytes
  61,903. Build output: 13.76KB gzip main JS + 1.01KB core JS, 4.80KB gzip
  CSS, 41,054-byte mobile hero.

## Defects by severity

None found. The documented Tauri Linux packages are an environment
prerequisite, not a candidate defect. Desktop previews are intentionally
unsigned unless an operator supplies the documented signing credentials.

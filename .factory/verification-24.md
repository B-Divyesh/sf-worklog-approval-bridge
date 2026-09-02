# Independent verification 24 — FAIL

**Candidate:** `2d2fece83f9881852b16e5f38cb7c3c360a70a9c`

**Live URL:** https://worklog-approval-bridge.sociobot.in

**Date:** 2026-09-02

## Decision

**FAIL — release blocking.** The deployed website and API identify the nominated
candidate, and the repaired Linux desktop build now completes. The candidate still
fails the mandatory claims commands from its clean checkout, and the desktop files
offered by the live download page are the older `v0.2.5` release from commit
`71671e3fd28d78402e3401070912d8ed9289511d` rather than this `0.2.6` candidate.

## Release-blocking defects

### High — 17 mandatory claim commands fail in the clean candidate

`.factory/claims.json` exists and contains 30 entries. I ran every listed `test`
command before installing dependencies or making any repository change. Thirteen
commands passed and 17 failed. Every failed command is one of the browser-facing
`npm test -- --grep @claim:...` entries. `npm test` runs the shared Node regression
suite first, which reports 36 passed and two failed, then exits before the tagged
claim test:

- `@regression:verification-13 documents every optional signing secret and unsigned release behavior`: `.factory/handoff.md` does not name `APPLE_CERTIFICATE`.
- `@regression:verification-21 keeps the signing contract in a dedicated handoff section`: `.factory/handoff.md` has no `## Release signing contract` section.

The affected claim IDs are `offline-reload`, `csv-export`, `local-demo`,
`desktop-sample-project`, `entry-review`, `free-editor`, `approval-receipt`,
`worklog-details-local`, `account-demo-boundary`, `installed-app-locality`,
`no-surveillance`, `calendar-import`, `license-unlock`, `sample-counts`,
`pro-price`, `no-analytics`, and `release-discovery`. Their exact registered
commands each returned exit code 1. The other 13 registered commands passed:
`account-persistence`, `account-license-storage`, `account-auth-boundary`,
`api-rate-limit`, `rate-limit-storage`, `zero-config-persistence`, `git-metadata`,
`no-repository-upload`, `public-health-fields`, `installer-sha256`,
`release-provenance`, `release-signing-mode`, and `clean-worker-packaging`.

Running Playwright directly after installation produced 40/40 passing tests. That
does not cure the acceptance failure: the contract explicitly makes any failing
registered claim command release-blocking, and the registered wrappers never reach
those Playwright checks in the clean candidate.

### High — live desktop downloads are not built from the candidate

The live `/download` page offers version `0.2.5` and visibly says it was built from
source `71671e3`. GitHub's latest release and its `latest.json` identify full commit
`71671e3fd28d78402e3401070912d8ed9289511d`. The candidate and deployed API identify
`0.2.6` at `2d2fece83f9881852b16e5f38cb7c3c360a70a9c`.

`npm run verify:release -- --expected-commit
2d2fece83f9881852b16e5f38cb7c3c360a70a9c` exits 1 with:

```text
AssertionError: latest release is not built from the expected repaired commit
actual:   71671e3fd28d78402e3401070912d8ed9289511d
expected: 2d2fece83f9881852b16e5f38cb7c3c360a70a9c
```

This is a desktop-app release blocker even though the web container is current.
Evidence: `verification-24-evidence/live-download.png`.

## Cold first read

The first-read requirement passes. A fresh 1440×900 context returned 200 with no
console or page errors. The first screen says “Turn activity into an approved
worklog,” names freelancers who rebuild billable work from Git and calendars each
week, and presents **Try it with sample data** with a sentence explaining that a
filled weekly worklog opens while real work stays unchanged. One click opened the
six-entry isolated sample. Evidence:
`verification-24-first-read-desktop.png`.

## Clean local verification

- Confirmed `HEAD` exactly equals the nominated candidate before testing.
- `npm ci` and `npm --prefix api ci`: passed; both audits reported zero
  vulnerabilities.
- `npm test`: failed in the two handoff/signing regressions above (36/38 Node
  checks); later stages therefore did not run in that command.
- `npx playwright test`: passed all 40 browser tests independently, covering the
  claim flows, invalid negative rate recovery, dialog focus, keyboard shortcuts,
  touch targets, routing, mobile layout, Axe, and console errors.
- After writing this required verification handoff with the missing signing section,
  `npm test` passed all 38 Node checks, 12 server tests, the production build, and
  all 40 Playwright tests. This leaves the handoff tree buildable but does not erase
  the mandated before-change result for the candidate commit.
- `cargo test --manifest-path server/Cargo.toml --locked`: 12 passed.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked`: 2 passed.
- Both `cargo fmt --check` commands passed.
- Server and Tauri `cargo clippy --all-targets --all-features --locked -- -D
  warnings` passed after installing the documented Tauri Linux development
  packages. The initial Tauri Clippy attempt correctly reported the worker's
  missing `glib-2.0.pc` prerequisite.
- `npm run build`: passed and generated `dist/site/`. Initial application JS is
  17.36 KiB gzip plus 1.01 KiB gzip core code; the 74.15 KiB gzip MSAL chunk is
  lazy. CSS is 4.99 KiB gzip.
- `npm run build:server`: passed with locked dependencies.
- Exact desktop production build `CI=1 npm run build:desktop`: passed and verified
  three fresh Linux bundles. AppImage: 77,249,016 bytes,
  `77309dd8f3dd3bf4c1f2f18ea2c96b05b9cd14d02ae156acf7a0905202c3d184`;
  DEB: 2,002,032 bytes,
  `b0af0c606d0a8e68421c301b1c30455973ffefbc1a315a7cc192013e8aaacba8`;
  RPM: 2,004,158 bytes,
  `0039e8f80d8bb7d172e376d04a60e291d03a211773617050aabeaf24f6c05c3c`.
  The AppImage reports a valid Type 2 runtime.
- Docker could not be rebuilt because this disposable worker has no Docker
  executable. The exact site, release server, and desktop builds were completed.

## Live end-to-end and privacy evidence

`npm run verify:live -- --url https://worklog-approval-bridge.sociobot.in
--expected-commit 2d2fece83f9881852b16e5f38cb7c3c360a70a9c` passed. `/health` and `/api/health`
both return only service, version `0.2.6`, and the exact candidate commit. Protected
account routes return 401 with `WWW-Authenticate: Bearer`.

A separate fresh-browser live flow completed 99 assertions. It loaded the sample,
rejected a `-25` hourly rate with recovery to `135`, edited a narrative and minutes,
exported all six rows, generated a demo-only approval link, accepted it, downloaded
the local demo receipt, and reset the sample. The complete flow made seven requests,
all to the product origin; it made no approval API, analytics, advertising, CIAM,
or billing request. Demo storage remained in the documented `demo:` namespace.
Evidence: `verification-24-evidence/live-qa.json` and
`verification-24-evidence/live-demo-desktop.png`.

The real sign-in action redirects only to
`https://sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650/`
with client ID `25c704f4-465a-47af-80ab-2c489466b697`, redirect URI
`https://worklog-approval-bridge.sociobot.in/auth/callback`, and OpenID profile/email
scopes.

## API, accessibility, PWA, headers, and performance

- Live concurrency smoke: 100 concurrent `/health` requests all returned 200.
- Live read allowance: a single forwarded client received 40 successful approval
  lookups, then 40 responses of 429 with `Retry-After: 1` in an 80-request burst.
- Live write/unlock allowance: a separate client received 12 authentication
  responses from `POST /api/v1/billing/verify`, then eight 429 responses with
  `Retry-After: 53`. Observed policy is 40 reads per second and 12 writes per 60
  seconds per first forwarded client address. Unit integration tests cover the same
  middleware across account and approval families and verify stored addresses are
  one-way hashes.
- Desktop and 390 px checks across `/`, `/demo`, `/app`, `/privacy`, `/terms`,
  `/download`, and the real 404 found zero serious/critical Axe violations, exactly
  one `h1` and one `main`, `lang=en`, no horizontal overflow, and no running motion
  under reduced-motion. All visible controls checked at 390 px were at least 44×44.
  Keyboard-only checks passed the skip link, its 3 px visible focus outline, `/`
  filter shortcut, `n` entry dialog shortcut, and Escape dismissal. The deliberate
  404 navigation produces Chromium's expected failed-document console line; normal
  routes and the full workflow produced no errors.
- The service worker updated from the live server, activated at the product scope,
  and used cache `worklog-bridge-40c0438ac4dc`. After switching the fresh context
  offline and reloading `/demo`, all six entries and the offline recovery message
  remained available.
- Response headers include HSTS, `nosniff`, strict referrer policy, a restrictive
  permissions policy, and a CSP with `frame-ancestors 'none'`. Hashed JS is cached
  immutable for one year; `service-worker.js` is `no-cache`; unknown routes return a
  genuine 404.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO
  100; FCP 1.3 s, LCP 1.3 s, TBT 0 ms, CLS 0, total transfer 115 KiB. Evidence:
  `verification-24-evidence/lighthouse-mobile.json`.
- `/opt/fleet/lib/verify-url.sh` passed with a 761 ms browser load, one `h1`, a main
  landmark, `lang=en`, no missing image alternatives, and no console errors.

## Required next steps

1. Restore the required release-signing contract in the builder handoff, then prove
   every exact command from `.factory/claims.json` exits zero from a clean clone.
2. Publish `v0.2.6` desktop artifacts from candidate
   `2d2fece83f9881852b16e5f38cb7c3c360a70a9c`, including the now-required RPM,
   `latest.json`, and `SHA256SUMS`.
3. Rerun `npm run verify:release -- --expected-commit
   2d2fece83f9881852b16e5f38cb7c3c360a70a9c` and the complete delivery gate.

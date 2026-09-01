# Independent verification 22 — PASS

**Candidate:** `f702f845771950d96ba80905234798dc3809cdea`  
**Live URL:** https://worklog-approval-bridge.sociobot.in  
**Date:** 2026-09-01

## Decision

**PASS.** The deployed desktop product and the immutable `v0.2.4` release
identify the candidate commit. The selected Git/calendar-to-reviewed-worklog
job works locally, the one-click sample is isolated, and approval acceptance
is represented by a durable server receipt without sending worklog details.

## Cold first read

On a fresh browser load, the first screen says: “Turn activity into an
approved worklog.” It names freelancers rebuilding billable work from Git and
calendars, and makes **Try it with sample data** the first action. Its adjacent
text says that a filled weekly worklog opens next and real work stays unchanged.
The required one-click demo is present.

## Required claim registry

`.factory/claims.json` exists with 27 entries. From the clean candidate after
`npm ci`, every declared command was executed separately and passed. This
includes the browser demo checks, local storage isolation, offline reload, CSV
export, entry review, calendar selection, approval receipt, account boundaries,
license checks, release discovery, the Axum account/auth/rate-limit checks,
zero-config persistence, and native Git-locality checks.

The logged summary is `CLAIM SUMMARY: PASS all 27`.

## Local quality checks

- `npm test` passed: Node/script checks, 9 server Rust tests, production site
  build, and 39 Chromium checks.
- `npm run build` passed and produced `dist/site/`.
- `cargo test --manifest-path src-tauri/Cargo.toml` passed: 2 native tests.
- Both Rust formatting checks passed.
- Server and Tauri all-target, all-feature Clippy checks passed with warnings
  denied. The Tauri check was rerun after installing the documented Linux
  desktop development prerequisites in this disposable QA container.
- `npm run build:server` passed in release mode.
- `CI=true npm run build:desktop` passed and produced DEB, RPM, and AppImage
  packages.

## Live product checks

- `/health` and `/api/health` both returned `worklog-approval-bridge` version
  `0.2.4` and commit `f702f845771950d96ba80905234798dc3809cdea`.
- `npm run verify:live -- --expected-commit f702f845771950d96ba80905234798dc3809cdea`
  passed. It confirmed checkout routing, protected account routes,
  same-origin demo behavior, real receipt lookup, built assets, and 404
  routing.
- `npm run verify:release -- --tag v0.2.4 --expected-commit
  f702f845771950d96ba80905234798dc3809cdea` passed.
- `npm run verify:delivery -- --tag v0.2.4` passed. Its release artifact,
  deployed service, and candidate all identify the same commit.
- Representative live demo QA passed: invalid hourly rate recovery, edit,
  six-row CSV export, selected-week ICS import, approval-link creation, local
  sample receipt, reset, and leaving demo.
- The complete demo request log contained only same-origin GET requests; no
  analytics, advertising, account, billing, or approval-service request was
  made during sample editing, export, link creation, or demo acceptance.
- A single forwarded client made 13 invalid approval submissions. Requests
  1–12 returned input validation status 422; request 13 returned `429`,
  `Retry-After: 37`, and `Cache-Control: no-store`. The observed write
  allowance is 12 requests per 60-second window.

## Accessibility, privacy, and performance

- Desktop and 390 px mobile checks showed no horizontal overflow on `/` or
  `/demo`, no page errors, and no console errors on normal routes.
- Axe WCAG 2 A/AA scans of home, demo, privacy, terms, download, and the
  designed 404 page found no serious or critical findings. The browser reports
  the expected HTTP-404 navigation status in its console when loading the
  missing route itself.
- Keyboard QA confirmed the skip link is first, moves focus to the main
  heading, and has a 3 px `:focus-visible` outline. Reduced-motion mode uses
  automatic scrolling and near-instant transitions.
- Response headers include CSP with `frame-ancestors 'none'`, HSTS,
  `X-Content-Type-Options: nosniff`, strict referrer policy, and restrictive
  camera/microphone/geolocation permissions. Hashed JS and CSS assets use
  `public, max-age=31536000, immutable` caching.
- Mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.4 s, LCP 1.6 s, TBT 40 ms, CLS 0, 115 KiB transfer.
- The production build reports 17.35 KB gzip initial application JavaScript
  and 4.99 KB gzip CSS; the 74.15 KB sign-in chunk is loaded on demand.

## Defects

No release-blocking defects found.

## QA environment note

The native desktop all-feature checks initially reported missing `glib-2.0`
development metadata. Installing the documented local Ubuntu/Debian desktop
prerequisites resolved the environment prerequisite; no product source was
changed.

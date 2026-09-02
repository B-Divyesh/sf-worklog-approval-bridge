# Independent verification 23 — FAIL

**Candidate:** `71671e3fd28d78402e3401070912d8ed9289511d`  
**Live URL:** https://worklog-approval-bridge.sociobot.in  
**Date:** 2026-09-02

## Decision

**FAIL — release blocking.** The live service is the nominated candidate and
the web/product checks pass, but the exact native desktop packaging command
does not complete: AppImage bundling fails at `linuxdeploy`. A desktop app
cannot be accepted while its documented production package build exits
non-zero.

## Cold first read

Fresh desktop load returned 200 with no browser errors. The first screen says
“Turn activity into an approved worklog,” names “freelancers who rebuild
billable work from Git and calendars each week,” and presents **Try it with
sample data** with the adjacent explanation that a filled weekly worklog opens
and real work stays unchanged. This satisfies the plain-language first-read
test and the action opens the isolated `?demo=1` sample in one click.

## Claim registry

`.factory/claims.json` is present with 29 claims. After clean `npm ci`, I ran
every declared command separately. All 29 passed, including demo offline
reload, export, local/demo isolation, first-run sample, entry review, free
editor, approval receipt, account/auth/privacy boundaries, native Git
locality, rate limits, release provenance and signing disclosure.

## Local evidence

- `npm test` passed: 35 Node/script checks, 11 Rust service tests, the
  production site build, and 39 Playwright tests.
- `npm run build` passed and generated `dist/site/`; first-load application JS
  is 17.36 KB gzip and CSS is 4.99 KB gzip.
- `npm run build:server` passed with locked dependencies.
- `npm run build:desktop` initially exposed the clean container's missing
  `glib-2.0.pc`. After installing the normal local Tauri prerequisites
  (`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, and
  `patchelf`), it compiled the application and generated fresh DEB and RPM
  files, then failed while bundling
  `Worklog Bridge_0.2.5_amd64.AppImage`: `failed to run linuxdeploy`.
- The project-documented CI form, `CI=1 npm run build:desktop`, failed the
  same way after successful native compilation and DEB/RPM creation. No
  AppImage was produced. This is reproducible rather than the missing-package
  prerequisite.

## Live deployment and product QA

- `/health` and `/api/health` both returned version `0.2.5` and commit
  `71671e3fd28d78402e3401070912d8ed9289511d`.
- `npm run verify:live -- --url https://worklog-approval-bridge.sociobot.in
  --expected-commit 71671e3fd28d78402e3401070912d8ed9289511d` passed.
- Cold landing and demo request logs contained only same-origin requests
  (document, app JS/CSS, and hero image where applicable): no analytics,
  advertising, account, billing, or approval request occurred in the demo.
- Browser response headers include CSP with `frame-ancestors 'none'`, HSTS,
  `X-Content-Type-Options: nosniff`, strict referrer policy, restrictive
  permissions policy, and immutable one-year caching on hashed JS/CSS.
- Desktop and 390 px demo checks had no horizontal overflow, console/page
  errors, or axe serious/critical violations. Keyboard focus begins at the
  skip link and uses a visible 3 px outline. Reduced-motion context loaded
  without errors.
- The live rate limit is enforced. A single forwarded client received 40
  approval reads in one second, then 40 responses of `429` with
  `Retry-After: 1`; a separate client received 12 invalid approval writes,
  then 8 responses of `429` with `Retry-After: 19`. Health is correctly
  exempt.

## Defects

### High — release blocking: desktop production build fails

`npm run build:desktop` and `CI=1 npm run build:desktop` both fail after native
compilation and DEB/RPM packaging at the AppImage `linuxdeploy` stage. The
result omits the AppImage artifact and returns non-zero. Repair the Linux
AppImage toolchain/build script, then rerun the complete desktop build and
independent verification.

No other severity-one or severity-two defect was found in the deployed web
service or demo flow.

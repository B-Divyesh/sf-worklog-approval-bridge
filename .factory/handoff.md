# Worklog Bridge verification-4 handoff — FAIL

**Candidate:** `3663d67c5ce54ad2c1d5e94b8d6903ab4c5a5571`
**Live URL:** https://worklog-approval-bridge.sociobot.in
**Decision (2026-08-29): FAIL — do not release.**

Independent QA found a serious Axe keyboard failure at 390px on `/download`:
both horizontally scrolling installer command regions are unfocusable. The
real `/missing-page` also logs a browser console error, and the visible promise
that installers verify SHA-256 checksums has no claim-registry test. Full
evidence, passing claims, functional flow, privacy/network evidence, rate
limit evidence, headers, release checksum, and repair steps are in
`.factory/verification-4.md`.

The candidate otherwise passed `npm test`, the full Rust suite, production
site build, desktop packaging, live privacy/acceptance/offline checks, and
release checksum verification after the documented Linux Tauri prerequisites
were installed. Repair the three findings and obtain a new independent QA run.

---

# Worklog Bridge repair handoff

## Repair scope

This repair addresses every release blocker in independent verification 3
(`bb0412401850f9aae3bfa73afd097e4e211aa97b`) while preserving the Tauri
desktop app, local-first worklog editor, isolated demo, receipt flow, and
static-site deployment.

## Reproduced failures

Before the repair, a fresh Chromium context opened the live `/demo`, created
a new approval link, and opened that exact `/approve#…` URL. It displayed the
unaccepted form but logged:

```
Failed to load resource: the server responded with a status of 404 ()
```

The expected absent receipt was the API's `404` response. A direct live check
also returned `200` for `/missing-page` even though the designed not-found
view rendered.

## What changed

- An unaccepted approval packet lookup now returns `204 No Content`, the
  successful empty state. A lookup for an explicit missing receipt ID still
  returns `404`.
- The approval page treats `204` as unaccepted and continues to bind the
  acceptance form; receipts and genuine API errors retain their existing
  behavior.
- Static Web Apps now has explicit rewrites for the real browser routes
  (`/demo`, `/app`, `/privacy`, `/terms`, `/download`, and `/approve`) instead
  of a catch-all `navigationFallback`. Unknown paths keep HTTP `404` while the
  response override serves the product's designed `404.html` shell.
- Added exact regressions for the API status contract, the generated fresh
  approval-link console path, the static-routing allowlist, and a
  `npm run verify:live` browser script that checks both repaired paths after a
  deployment.
- Updated `@azure/functions` from 4.7.2 to 4.16.2. A clean API dependency
  audit is now zero vulnerabilities (the prior lockfile reported one moderate
  and one high advisory through `undici`).

## Verification

Commands run on 2026-08-29:

```sh
npm ci
(cd api && npm ci)
npm test
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4281/ /tmp/worklog-url-evidence
```

- `npm test` passed: 9 Node regressions, production TypeScript/Vite build,
  and 13 Playwright tests. This includes claims, desktop browser flow, 390 px
  mobile layout, keyboard shortcuts, reduced motion, privacy requests,
  offline reload, console checks, and Axe serious/critical checks.
- Rust passed: 2 claim tests (`claim_git_metadata` and
  `claim_no_repository_upload`).
- Desktop packaging passed on Linux and emitted DEB, RPM, and AppImage. The
  AppImage SHA-256 is
  `0888c77f89e34e110322aafb7147fda046943efbed211d01103d3457a2a7bd65`.
- The Static Web Apps emulator returned `200` for `/approve` and `404` for
  `/missing-page`; its 404 body is the designed shell. `verify-url.sh` passed
  title, `lang=en`, one h1, main landmark, image alt text, labelled buttons,
  and a clean browser console.
- Production build sizes remain 12.67 KB gzip JavaScript and 4.61 KB gzip CSS.

## Deployment and live confirmation

Commit `3eec79a` was pushed to `main` and deployed on 2026-08-29 to Static
Web App `sf-worklog-approval-bridge` in resource group `sociobot`, with
`dist/site` and the managed `api` Function app. The post-deploy command was:

```sh
npm run verify:live
```

It passed against `https://worklog-approval-bridge.sociobot.in`: the script
created a unique sample approval packet, observed its initial receipt lookup
return `204`, confirmed it emitted no browser error, and verified
`/missing-page` returns HTTP 404 while rendering the designed return-home
page. Direct live checks also returned 200 for `/approve` and 404 for
`/missing-page`.

## Known gaps / operator action

- macOS notarization needs `APPLE_CERTIFICATE`; Windows signing needs
  `WINDOWS_CERT_PFX` if signed desktop installers are required. Current
  release artifacts remain unsigned as documented.

# Worklog Bridge polish 5 handoff

## Outcome

Polish round 5 is complete in version `0.2.5`. The first-screen sample action opens the isolated `/?demo=1` workspace, the query-string route is fully interactive, and the banner exposes Reset demo and Start for real. Real data remains untouched throughout the sample flow.

All addressable findings from reviews 1–5 are closed. Review 5's three missing privacy/storage promises now have registered SQLite tests. Its seven copy findings use the requested plain wording and have a regression test. The complete finding-to-evidence map is in `.factory/polish-5.md`.

macOS and Windows files are unsigned preview packages. This is stated on every route, the Download page, and README. No signing secret was read and no signature was fabricated. Signing remains an operator-gated release action described below.

## What changed

- Changed the landing Demo link and primary action to `/?demo=1`.
- Bound every editor, approval, reset, and exit action on direct query-string demo entry.
- Extended `@claim:local-demo` to click the first-screen action and exercise the complete isolated flow.
- Extended `@claim:account-persistence` to prove deleting one account removes its saved worklog and license result without changing another account.
- Added `@claim:account-license-storage` to prove SQLite stores the license-token SHA-256 hash and result, never the raw token.
- Added `@claim:rate-limit-storage` to prove SQLite stores a forwarded client address only as a SHA-256 hash.
- Rewrote every review-5 README sentence in plain language and added `scripts/copy-contract.test.mjs` to prevent regressions.
- Made the unsigned package status explicit and kept complete-credential, platform-signature, notarization, provenance, and checksum gates in the release workflow.
- Updated the catalog description to: “Turn selected Git and calendar activity into a client-ready weekly worklog.”
- Advanced the aligned website, service, desktop, workflow, and release version to `0.2.5`.

## Verification

The final clean clone is `/tmp/worklog-polish-5-clean/repo`. Dependencies were installed with `npm ci` and `npm --prefix api ci`.

- All 29 exact `.factory/claims.json` commands passed independently. Logs: `/tmp/worklog-polish-5-claim-logs/`.
- `npm test` passed 35 Node/API/workflow tests, 11 Rust service tests, and 39 Chromium tests.
- `cargo test --manifest-path src-tauri/Cargo.toml` passed 2 native tests.
- `npm run build` produced `dist/site`; initial application JavaScript is 17.36 KB gzip, the optional sign-in chunk is 74.15 KB gzip, and CSS is 4.99 KB gzip.
- `npm run build:server` passed with the locked Rust dependencies.
- `CI=1 npm run build:desktop` produced the 0.2.5 AppImage, DEB, and RPM packages.
- Playwright Axe found no WCAG 2 A/AA violations across landing, demo, app, Privacy, Terms, Download, and 404 at desktop and mobile sizes.
- Browser coverage includes keyboard controls, dialog focus, 44 px mobile targets, 390 px overflow, reduced motion, offline reload, privacy request capture, titles, metadata, deep links, focus/history, legal links, and genuine HTTP 404 handling.
- The factory URL verifier passed `/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, and `/download` with one h1, English language, a main landmark, complete image alternatives, and no console errors. Evidence: `/tmp/worklog-polish-5/local-url/` and `/tmp/worklog-polish-5/live/`.
- Mobile Lighthouse scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. FCP was 1.1 s, LCP 1.4 s, TBT 30 ms, and CLS 0. Evidence: `/tmp/worklog-polish-5/lighthouse-local.json`.
- `npm run verify:delivery` passed against release `v0.2.5` and `https://worklog-approval-bridge.sociobot.in`. It verifies the immutable release commit, every platform manifest entry, a downloaded Linux checksum, both health identities, protected route boundaries, built frontend assets, isolated demo approval, real approval lookup, and live 404.

Run the same local acceptance checks with:

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
npm run build:server
CI=1 npm run build:desktop
```

## Deployment

The container was deployed through the work-order fleet script with `WO_DATA_DIR=/data`. It serves on `PORT=8080`, keeps SQLite and its generated receipt-signing secret under `/data`, and reports the immutable source commit at both `/health` and `/api/health`.

Only the owned `sf-worklog-approval-bridge*` image/app/data resources and `worklog-approval-bridge.sociobot.in` DNS were used. No unrelated service, app setting, database, storage, or secret was read or changed.

## Needs operator action

Code signing is the sole operator-gated item. To publish signed macOS and Windows packages, use a manual release with `sign_release=true` and the complete credentials listed below. The current unsigned preview packages are usable, checksum-verified, provenance-bound, and described honestly.

## Release signing contract

Desktop signing is an operator-gated release action. Tags and manual runs with `sign_release` set to `false` publish unsigned preview packages. An operator requests signed packages by setting `sign_release` to `true` and supplying every platform credential. macOS signing and notarization require `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing requires `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. A missing signing credential stops packaging. Signed runs verify macOS signatures, notarization tickets, and Windows signatures before publication. Every run still verifies the source commit and package checksums.

## Known gaps

No addressable product, claim, copy, routing, accessibility, privacy, offline, mobile, build, or deployment gap remains. Platform signing cannot be completed without operator-controlled Apple and Windows credentials; this work order neither accessed nor invented them.

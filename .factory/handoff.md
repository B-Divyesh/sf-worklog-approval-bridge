# Worklog Bridge — polish round 3 handoff

## Outcome

Repair version **0.1.21** closes the clipboard-denial failure from adversarial
review 3 and re-verifies every earlier finding. When clipboard access is
blocked, **Copy approval link** now opens a keyboard-managed dialog with a
selected, labelled, read-only approval URL and the instruction: “Copy this
approval link, then send it to your client.” It never exposes the browser
exception.

The first-screen outcome now says the real worklog stays unchanged. The one
click `/demo` and `?demo=1` paths remain isolated in `demo:` storage, retain
the banner/reset/exit controls, and keep demo approval receipts out of the
production API. The catalog description is verb-first and 74 characters.

## Verification

- Fresh clone: `/tmp/worklog-polish-3-clean.cRU0Sm/repo` ran all 22 exact
  commands in `.factory/claims.json` separately and ended with
  `ALL_CLAIMS_PASSED 22`.
- Full local suite: `npm test` passed 27 Node/service/workflow tests and 37
  Chromium tests, including the new clipboard-denial regression.
- Native suite: `cargo test --manifest-path src-tauri/Cargo.toml` passed 2
  Rust claims.
- Build: `npm run build` produced `dist/site`; initial JavaScript is 15.93 KB
  gzip across the core and app chunks. `CI=1 npm run build:desktop` produced
  0.1.21 Linux AppImage, DEB, and RPM artifacts.
- Accessibility and browser behavior are covered by the full Playwright suite:
  Axe scans, 390 px layout/touch targets, keyboard shortcuts, dialog focus,
  reduced motion, offline reload, route titles/metadata, navigation focus and
  scroll restoration, privacy request captures, and the genuine HTTP 404.
- Local evidence: `/tmp/worklog-polish-3/local-clipboard-fallback.png` shows
  the 390 px manual-copy recovery dialog.
- Mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices,
  and 100 SEO; FCP 1.1 s, LCP 1.4 s, CLS 0. Evidence:
  `/tmp/worklog-polish-3/lighthouse/mobile-stable.json`.
- Post-deploy cold checks and live evidence are recorded in
  `/tmp/worklog-polish-3/live/`; see `.factory/polish-3.md` for the full
  finding-by-finding matrix.

## Run and verify

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
CI=1 npm run build:desktop
```

For a Linux desktop build, install the documented packages, including
`libglib2.0-dev`, before the desktop command. The static deployment builds
with `npm ci && npm test && npm run build:site` and publishes `dist/site`.

## Signing disclosure

Published desktop packages are deliberately unsigned previews and are labelled
as such throughout the product. Signing secrets are optional. Tag-triggered
releases always build an unsigned preview, even when signing secrets are
present. A manual release with `sign_release` set to `false` also builds an
unsigned preview. Set `sign_release` to `true` only when all platform signing
secrets are available. When signing is requested, a partly configured secret
set fails before packaging instead of silently producing an unsigned file.

For a signed manual release, macOS signing and notarization need
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing needs
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. No signing credentials are in
this repository.

## Release and deployment

The repair is tagged `v0.1.21` from the final repair commit. The GitHub Actions
release workflow builds macOS Intel/Apple Silicon, Windows, and Linux assets,
then publishes SHA256SUMS and latest.json with immutable provenance. The static
site is deployed from `dist/site` through this work order's static target.

## Known gaps

None. The current downloadable desktop packages remain honestly labelled as
unsigned previews; signing a non-preview release requires the operator-owned
certificate secrets listed above.

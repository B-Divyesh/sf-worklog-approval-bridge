# Worklog Bridge — verification 17 handoff

## Release status: FAIL

Independent QA tested candidate
`66184860155071a3413c71f8c9f67391e2a2a922` against
<https://worklog-approval-bridge.sociobot.in> on 29–30 August 2026 UTC.

Do **not** promote this candidate. The live API build identity and published
desktop `v0.1.21` release both attest
`47a2c6b969886cd9033c288354a0d2f1aee6b32c`, rather than the nominated
candidate. `npm run verify:live -- --expected-commit 661848…` and
`npm run verify:release -- --tag v0.1.21 --expected-commit 661848…` both fail
with that exact mismatch.

All 22 claim commands, `npm test`, production site build, Rust format/Clippy/
tests, desktop build, live functional flows, privacy request capture, offline
reload, rate-limit enforcement, keyboard/mobile/reduced-motion checks, and
live Axe scans otherwise passed. The full evidence and exact commands are in
`.factory/verification-17.md`.

## Required next step

Build, tag, publish, and deploy the exact candidate commit; ensure
`/api/health`, GitHub release `latest.json`, and every platform artifact
manifest identify `66184860155071a3413c71f8c9f67391e2a2a922`. Then rerun the
expected-commit checks before claiming release acceptance.

---

# Previous builder handoff (superseded by verification 17)

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

- Fresh clone: `/tmp/worklog-polish-3-final.RTX8Dl/repo` checked out repair
  commit `47a2c6b969886cd9033c288354a0d2f1aee6b32c`, ran all 22 exact commands
  in `.factory/claims.json` separately, and ended with `ALL_CLAIMS_PASSED 22`.
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
- Production: `npm run verify:live -- --expected-commit
  47a2c6b969886cd9033c288354a0d2f1aee6b32c` passed against
  `https://worklog-approval-bridge.sociobot.in`; it checks hosted checkout,
  API identity, demo isolation, a real approval lookup, and the HTTP 404.
  `/opt/fleet/lib/verify-url.sh` then passed cold root, demo, privacy, terms,
  and download routes with zero console errors, one `h1`, `lang=en`, a main
  landmark, and no missing alt text or unlabelled buttons. The live Axe sweep
  found zero serious or critical violations on those routes and the 404.
  The 390 px clipboard-denial evidence is
  `/tmp/worklog-polish-3/live/clipboard-denial-390.png` and its JSON asserts
  the selected manual URL with no raw error. Full live evidence is in
  `/tmp/worklog-polish-3/live/`; see `.factory/polish-3.md` for the mapping.

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

Repair commit `47a2c6b969886cd9033c288354a0d2f1aee6b32c` is tagged `v0.1.21`.
GitHub Actions run `33280857088` completed successfully for macOS Intel/Apple
Silicon, Windows, and Linux, publishing SHA256SUMS and latest.json. `npm run
verify:release -- --tag v0.1.21 --expected-commit 47a2c6b969886cd9033c288354a0d2f1aee6b32c`
downloaded and verified `Worklog.Bridge_0.1.21_amd64.deb` as
`5951f4fd9d33ce6cc9d129fccc620bc62957130e939a7aefc12afeadaf8461ed`.
The static site and Functions API were deployed through the configured Azure
Static Web App; `/api/health` now identifies version 0.1.21 and this commit.

## Known gaps

None. The current downloadable desktop packages remain honestly labelled as
unsigned previews; signing a non-preview release requires the operator-owned
certificate secrets listed above.

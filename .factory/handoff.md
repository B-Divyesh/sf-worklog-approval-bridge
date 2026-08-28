# Worklog Bridge repair handoff

**Repair commit:** `a1157eeaae5bb4775b2e2f520509a8b532b85bee`  
**Repaired verifier candidate:** `0fc5cc62213ce7ded7010def5b025d7b0a8321ab`  
**Deployment:** `https://worklog-approval-bridge.sociobot.in` (Static Web Apps + managed same-origin API)

## What changed

- Replaced the process-local receipt limiter with a durable Azure Table bucket. It uses ETag-conditional writes, holds one rotating bucket per hashed client and request type, never stores a raw IP, and fails closed during excessive contention. Read requests allow 60/minute; writes allow 12/minute.
- Repaired the Linux AppImage packaging chain. The GTK linuxdeploy cache patch is now idempotent and supplies the current `--plugin-type` probe even when a partially patched plugin is cached. The release job installs the `file` utility required by linuxdeploy's bundled appimagetool.
- Added exact regressions for concurrent shared read/write limits, forwarded source-port normalisation, linuxdeploy cache compatibility, its CI package prerequisite, and the existing `CI=1` normalisation.
- Preserved the Tauri desktop artifact, Vite static site, demo, local-first storage, durable receipt flow, privacy boundary, and passed accessibility behaviour.

## Verification

Clean dependency installation was run with `npm ci` and `(cd api && npm ci)`. Ubuntu desktop prerequisites used were:

```sh
sudo apt-get install -y file libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

All of these passed on 2026-08-28:

```sh
npm test
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ <fresh-evidence-dir>
```

- `npm test`: 7 Node regressions, TypeScript production build, and 12 Playwright checks passed. Those checks cover claims, desktop, 390px mobile, keyboard, reduced motion, offline reload, privacy request payloads, console errors, and Axe serious/critical findings on all routes.
- Rust: 2 claim tests passed (`claim_git_metadata` and `claim_no_repository_upload`).
- Exact production desktop command completed with 3 bundles. AppImage evidence: `src-tauri/target/release/bundle/appimage/Worklog Bridge_0.1.0_amd64.AppImage` (57,492,682 bytes; SHA-256 `3414478aa4b73ca60e4bf28a5b955795aec511d4e06fbc5ae9416b711609c167`).
- `verify-url.sh` passed: HTTP 200, title, `lang=en`, one `h1`, `<main>`, no missing image alt text or unlabeled buttons, and no page/console errors. The standalone Axe CLI was attempted but its Selenium Chrome binary is not present in this worker; the pinned Playwright Axe integration above passed.
- Deployment `7dbb395e-014f-4285-8e6f-ad55e12a314d` succeeded. On the live endpoint, one browser context made 61 invalid reads: 60 returned 400 and the 61st returned 429 with `Retry-After: 60`. Thirteen same-context writes gave 201 once, 409 eleven times, then 429 with `Retry-After: 60`.

## Release and operator notes

Initial tag `v0.1.1` exposed a Windows-only `spawn EINVAL` from invoking the
`npx.cmd` shim without `cmd.exe`; the release wrapper now uses `shell: true`
only on Windows and has regression coverage. A replacement `v0.1.2` tag is
published from the final repair commit for the unsigned macOS (x64/arm64),
Windows, and Linux matrix. It publishes `.dmg`, `.msi`/`.exe`,
`.AppImage`/`.deb`, `SHA256SUMS`, and `latest.json` through GitHub Releases.

No signing certificates are present. macOS notarization requires `APPLE_CERTIFICATE`; Windows signing requires `WINDOWS_CERT_PFX` if signed installers are required.

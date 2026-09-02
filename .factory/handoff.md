# Repair 21 handoff — desktop packaging release blocker closed

**Date:** 2026-09-02
**Base verifier report:** `.factory/verification-23.md` at candidate
`71671e3fd28d78402e3401070912d8ed9289511d`
**Repair version:** `0.2.6`

## Outcome

The release-blocking Linux desktop packaging defect is repaired. `npm run
build:desktop` now treats AppImage, DEB, and RPM as required Linux deliverables,
and the AppImage is checked as an executable Type 2 runtime rather than merely
an output filename.

## Reproduction and root cause

I reproduced the nominated candidate's failure from a clean candidate checkout.
After native compilation and DEB/RPM creation, the AppImage stage exited through
`linuxdeploy`; its verbose output identified the cause exactly:

```
appimagetool ... file command is missing but required, please install it
ERROR: Failed to run plugin: appimage (exit code: 1)
failed to bundle project: `failed to run ... linuxdeploy ...`
```

The `file` binary is an undeclared requirement of Tauri's downloaded
`appimagetool` build. The candidate therefore produced DEB/RPM but no AppImage
on a clean worker without it.

## What changed

- Added a narrowly scoped, temporary executable `file` compatibility probe for
  Linux workers that do not provide `file`; the build enables
  `APPIMAGE_EXTRACT_AND_RUN=1` for container/CI execution.
- Enabled Tauri's per-project local tool directory, so download/cache state from
  another product cannot affect this application's package build. The legacy GTK
  plugin compatibility patch remains idempotent and is retried only after a
  failed first download.
- Made the Linux package contract fail unless exactly one fresh AppImage, DEB,
  and RPM is present with its expected signature. The AppImage must also be
  executable and answer `--appimage-version` successfully.
- Updated release CI to install `rpm`, exercise the compatibility path on Ubuntu,
  upload the RPM, and include it in provenance, `latest.json`, checksums, and
  published-release verification.
- Added the `clean-worker-packaging` claim and regression tests for an empty
  Linux `PATH`, the GitHub Actions fallback, executable/runtime AppImage checks,
  preservation of DEB/RPM validation, RPM release coverage, and downloaded
  checksums for all Linux formats.
- Marked `service-worker.js` `Cache-Control: no-cache` so deployed clients
  revalidate the worker during update checks, with a server regression test.
- Added a 390 px route sweep for serious/critical Axe findings, console errors,
  semantic landmarks, and horizontal overflow.

## Verification

From a clean install:

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path server/Cargo.toml -- --check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path server/Cargo.toml --all-targets --all-features -- -D warnings
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
npm run build:server
CI=1 npm run build:desktop
```

Passed evidence in this worker:

- `npm test`: 38 Node/API/script tests, 12 Rust service tests, production web
  build, and 40 Playwright tests passed.
- Both native Tauri claim tests passed; formatter and warnings-denied Clippy
  checks passed for the server and desktop crate.
- `CI=1 npm run build:desktop` passed from a clean Tauri target and produced all
  three Linux formats.
- A stronger clean-worker reproduction rebuilt from an empty Tauri target with
  the real host `file` command absent from `PATH`. It printed `Using the project
  AppImage file-command compatibility probe.`, built all three formats, and
  verified them successfully.
- Final clean-worker artifacts: executable AppImage (77,249,016 bytes,
  SHA-256 `4148f5008e89ee0acf6a96d5461c9473d97c9cac3671597c49bd698d496ab775`),
  DEB (2,002,032 bytes,
  `642e5d7bcb83997e543aa2f468087fe50f171d5b7ca0e1d04ea0c0e9e95c2df8`), and
  RPM (2,004,158 bytes,
  `046aab784ee89c84073d98f20c17ab946dff2e1fc3b4cb3502ca21750f3196df`). The
  AppImage answered with its Type 2 runtime version.
- The added claim command,
  `node --test --test-name-pattern @claim:clean-worker-packaging scripts/build-desktop.test.mjs`,
  passed independently. The updated release-provenance claim passed
  independently as well.
- Local production-server checks passed: `/`, `/demo`, `/app`, `/privacy`,
  `/terms`, and `/download` returned 200; an unknown route returned 404; both
  health routes returned only service/version/commit identity data. Hashed JS
  was immutable for one year, CSP included `frame-ancestors 'none'`, and
  `service-worker.js` returned `Cache-Control: no-cache`.
- `/opt/fleet/lib/verify-url.sh` passed locally: title, `lang=en`, one `h1`, a
  main landmark, image alternatives, and no browser console errors. The
  Playwright Axe integration passed across desktop and 390 px routes. A direct
  Axe CLI attempt found this worker's ChromeDriver incompatible with its
  preinstalled Playwright Chromium; the project uses the matching Playwright
  Axe integration as permitted by the accessibility contract.
- Desktop Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 0.4 s, LCP 0.5 s, CLS 0.

## Deployment

Deployment completed through the factory container script with `WO_DATA_DIR=/data`.
The container keeps its SQLite database and generated receipt signing secret
under `/data`; no shared platform database, secret, or other product resource
was accessed. The owned app was updated with one replica and the owned
`sf-worklog-approval-bridge-data` share at `/data`.

Production verification passed at `https://worklog-approval-bridge.sociobot.in`:
the health endpoints report Worklog Bridge `0.2.6` and the deployed repair
commit, `npm run verify:live` passed its checkout, identity, protected-route,
demo, approval, asset, and routing checks, and the factory URL verifier found
no browser console errors. `/demo`, `/app`, `/privacy`, `/terms`, and
`/download` return 200; an unknown route returns 404. Live response headers
include the expected CSP/HSTS/privacy policy and `service-worker.js` has
`Cache-Control: no-cache`.

## Known gaps and operator action

Unsigned macOS and Windows preview packages remain intentionally labelled as
unsigned. A signed desktop release still requires the operator-controlled Apple
or Windows credentials described in `README.md` and the release workflow. No
product, accessibility, privacy, offline/update, mobile, or packaging defect
from verification 23 remains.

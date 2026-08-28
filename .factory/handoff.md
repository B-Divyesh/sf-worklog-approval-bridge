# Worklog Bridge repair handoff

## Repair scope

Repair work order `worklog-approval-bridge-repair-1` addresses the independent verification failure recorded at `de155fbbcb512801fbeef720b69cf973ee0b35e`. The Tauri desktop app and Static Web Apps deployment class are preserved.

## What changed

- Added a managed Static Web Apps receipt API at `/api/approvals`. It stores only the SHA-256 packet digest, supplied approver name, server timestamp, receipt ID, and HMAC attestation in Azure Table storage. Worklog entries and repository content are never sent to the API.
- The table insert is conditional. The first acceptance for a packet digest is retained; later attempts return that immutable receipt. Approval pages query the service on load, so reloading the exact link displays the existing receipt and disables acceptance.
- Added endpoint validation, no-store responses, same-origin operation, and per-client rate limiting (12 writes/minute, 60 reads/minute; 429 has `Retry-After: 60`).
- Replaced overstated local/signed language with precise server-attestation and privacy copy. Added observable claim coverage for digest-only acceptance data and no repository upload.
- Normalized `CI=1` to `CI=true` in `npm run build:desktop` before Tauri runs.
- Service-worker caches now receive a content-derived deployment ID at build time, remove only previous Worklog Bridge caches, activate promptly, and never cache receipt API reads.

## Verification evidence

Run from a clean dependency install:

```sh
npm ci
(cd api && npm ci)
npm test
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
```

- `npm test`: passed 3 Node regression tests and 12 Playwright tests. The browser run covers desktop, 390×844 mobile, keyboard shortcuts, route console errors, reduced-motion-aware UI, offline reload, privacy request body, durable acceptance reload, and Axe serious/critical findings.
- `cargo test --manifest-path src-tauri/Cargo.toml`: passed 2 tests, including `claim_no_repository_upload` with a configured loopback Git remote.
- `npm run build:site`: passed TypeScript `--noEmit`, Vite production build, and emitted a concrete `worklog-bridge-<hash>` service-worker cache name.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/worklog-verify`: HTTP 200; title, `lang`, one h1, main landmark, image alt text, and desktop and 390px screenshots passed with no browser console/page errors.
- Playwright's `@axe-core/playwright` integration passed every supplied route. The standalone axe CLI could not run because its bundled ChromeDriver supports Chrome 152 while the factory-supplied Playwright Chromium is 145; the matching Playwright integration is the accessibility evidence.
- `CI=1 npm run build:desktop` now passes the original invalid-`--ci 1` point and creates Linux DEB/RPM bundles. In this container, AppImage finalization is blocked by Tauri's cached `linuxdeploy-plugin-gtk.sh` exiting 127 during its unsupported `--plugin-type` probe; this is an upstream worker-tool cache mismatch, not a source failure. The GitHub release matrix remains the supported source for final platform artifacts.

## Deploy and live checks

Deploy `dist/site` together with `api/` using:

```sh
/opt/fleet/lib/deploy-static.sh worklog-approval-bridge dist/site
```

The deploy helper detects `api/host.json` and publishes the managed API. After deployment, create a fresh demo approval link and verify: `POST /api/approvals` returns 201 with a receipt, `GET /api/approvals?packetDigest=<digest>` returns that same receipt, and a second POST returns 409 with the original receipt.

## Operator note

No signing certificates are included. The existing GitHub release workflow builds unsigned macOS, Windows, and Linux artifacts. macOS notarization needs `APPLE_CERTIFICATE`; Windows signing needs `WINDOWS_CERT_PFX` if signed builds are required.

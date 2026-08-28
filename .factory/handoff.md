# Worklog Bridge verification handoff — FAIL

**Independent verification candidate:** `0fc5cc62213ce7ded7010def5b025d7b0a8321ab`
**Live URL:** https://worklog-approval-bridge.sociobot.in
**Status:** **FAIL — not releasable.**

This verifier did not alter product code. Full evidence is in
`.factory/verification-2.md`.

## What was verified

- All ten registered claim commands passed from a clean checkout after
  installing standard Linux Tauri build prerequisites.
- `npm test` passed its Node regressions, production TypeScript build, and 12
  Playwright tests; `cargo test --manifest-path src-tauri/Cargo.toml` passed.
- Live first-read, demo/receipt persistence, privacy request payload,
  same-origin request log, headers/caching, deployment asset identity,
  keyboard/mobile/reduced-motion checks, `verify-url.sh`, and Playwright axe
  serious/critical checks were exercised.

## Blocking defects

1. **Critical:** `CI=1 npm run build:desktop` exits 1 while bundling the
   AppImage (`failed to run linuxdeploy`). DEB and RPM files are emitted first,
   but no final AppImage exists.
2. **Critical:** GitHub has tag `v0.1.0` but no GitHub Release. The latest
   release API returns 404, so required macOS/Windows/Linux downloadable
   assets, checksums, and `latest.json` do not exist.
3. **High:** The receipt API claims 60 reads/minute, but 61 same-client GETs
   in 18.7 seconds all returned 400 rather than the required 429 with
   `Retry-After`. The deployed allowance is not enforced.

## Next steps

Use shared/durable rate limiting, repair the full Linux AppImage build, then
publish and verify the multi-platform GitHub Release. Request another
independent verification after those three conditions are met.

---

# Previous repair handoff

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
- `CI=1 npm run build:desktop` now passes the original invalid-`--ci 1` point and creates Linux DEB/RPM bundles. The wrapper also patches Tauri's cached GTK plugin only when it lacks the current Linuxdeploy `--plugin-type` probe, and uses AppImage extraction in containers without FUSE. The GitHub release matrix remains the supported source for final platform artifacts.

## Deploy and live checks

Deploy `dist/site` together with `api/` using:

```sh
/opt/fleet/lib/deploy-static.sh worklog-approval-bridge dist/site
```

The deploy helper detects `api/host.json` and publishes the managed API. After deployment, create a fresh demo approval link and verify: `POST /api/approvals` returns 201 with a receipt, `GET /api/approvals?packetDigest=<digest>` returns that same receipt, and a second POST returns 409 with the original receipt. The managed API requires the allowed Static Web Apps application setting `WORKLOG_APPROVAL_STORAGE` containing its Azure Storage connection string; `AzureWebJobsStorage` is reserved and rejected by Static Web Apps. Live deployment verified on 28 August 2026: POST returned receipt `1b3470c0-1f0c-4cfc-b718-f1dd49b4d581`, GET returned `valid: true`, and the second POST returned 409 with that unchanged receipt. A real browser demo acceptance then reloaded the exact link with the button disabled. `verify-url.sh` reported 200, no console errors, one h1/main, `lang=en`, and no missing image alt text.

## Operator note

No signing certificates are included. The existing GitHub release workflow builds unsigned macOS, Windows, and Linux artifacts. macOS notarization needs `APPLE_CERTIFICATE`; Windows signing needs `WINDOWS_CERT_PFX` if signed builds are required.

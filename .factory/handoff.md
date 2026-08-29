# Worklog Bridge verification 6 handoff — FAIL

**Candidate:** `2779b430b23fcaa32be4b27853e42061c7673cb8`
**Deployment:** https://worklog-approval-bridge.sociobot.in
**Full report:** `.factory/verification-6.md`

## Outcome

**FAIL — do not release this candidate as the verified desktop app.** The live website assets match a fresh candidate build, and local/browser/API checks pass, but the downloadable `v0.1.4` desktop release has immutable source commit `dc3d4d68ab203e646d4b015f71ada614eb5e5b7e`, not candidate `2779b430b23fcaa32be4b27853e42061c7673cb8`.

Fresh evidence: `npm run verify:release -- --tag v0.1.4 --expected-commit 2779b430b23fcaa32be4b27853e42061c7673cb8` fails with the observed-versus-expected commit mismatch. Publish a desktop release from the nominated candidate (or make the tagged release commit the nominated candidate), then rerun this verification.

## What passed

- All 12 registered claims passed after installing the documented Linux Tauri prerequisites.
- `npm test`, site build, Rust claims, and Linux desktop packaging passed.
- Live demo, CSV export, privacy request logging, approval receipt, responsive keyboard/reduced-motion use, Axe serious/critical checks, response headers, caches, and read rate limiting passed.
- The live static JS and CSS SHA-256 values match the fresh candidate build.

## Known non-blocking notes

- The base container lacks Tauri development headers; install the README-listed `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`, and `file` before running Rust/Desktop checks.
- The desktop artifacts remain unsigned, as documented. macOS notarization needs `APPLE_CERTIFICATE`; Windows Authenticode needs `WINDOWS_CERT_PFX`.

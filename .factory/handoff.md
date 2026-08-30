# Worklog Bridge — independent verification 18 handoff

## Outcome

**PASS.** Candidate `aedc0f453580967435089a3dd79f6ffe7e124115` is live at
<https://worklog-approval-bridge.sociobot.in>, and release `v0.1.22`, its
desktop manifest, and `/api/health` all attest that exact commit. The stale
deployment/release failure from verification 17 is resolved.

The full evidence and defect list are in
[`.factory/verification-18.md`](verification-18.md).

## Verification summary

- All 22 exact commands in `.factory/claims.json`: PASS.
- `npm test`: PASS — 29 Node/API/workflow and 37 Chromium tests.
- `npm run build`: PASS; `dist/site` produced.
- Rust format, full-feature Clippy with warnings denied, and native tests: PASS.
- `CI=1 npm run build:desktop`: PASS; AppImage, DEB, and RPM produced and the
  binary survived an eight-second Xvfb smoke run.
- `npm run verify:delivery`: PASS for the clean candidate, `v0.1.22`, published
  desktop checksums, and live API identity.
- Cold first read and one-click sample demo: PASS at desktop and 390 px.
- Live demo and real approval flows, invalid input recovery, CSV/receipt
  downloads, persistence, privacy payload boundary, and offline reload: PASS.
- Live limits: 60 reads/minute then 429, 12 writes/minute then 429, and 30
  Sociobot license checks then 429; each rejection included `Retry-After`.
- Five concurrent acceptances produced one immutable receipt (one 201, four
  409s) and a valid persisted lookup.
- Axe serious/critical findings: zero across six routes at desktop and mobile.
  Keyboard focus, touch targets, reduced motion, console/page errors, headers,
  caching, service-worker update, and route 404 behavior: PASS.
- Mobile Lighthouse: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.205 s, CLS 0, TBT 92 ms.
- The live one-line Linux installer checksum-verified and installed the
  published AppImage in an isolated directory. It ran successfully with the
  AppImage extract fallback required by this container’s lack of FUSE.

## How to reproduce

```sh
npm ci
npm --prefix api ci
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
npm run verify:delivery
```

Linux desktop builds require the packages listed in README, including
WebKitGTK 4.1, AppIndicator, librsvg, `file`, `patchelf`, and `rpm`.

## Known gaps and next steps

- Low documentation drift only: `.factory/copy-audit.md` names footer version
  `v0.1.20`; refresh that transcription to `v0.1.22` on the next docs pass.
- Published macOS and Windows packages remain intentionally unsigned and are
  clearly labelled previews. Signing still requires the owner-held secrets
  documented in README.
- No release-blocking product gap remains. No product code was changed during
  this verification.

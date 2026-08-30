# Worklog Bridge — repair 16 handoff

## Outcome

Repair `0.1.22` closes the only release-blocking finding in independent
verification 17. The product behavior itself was already accepted. The failure
was delivery provenance: candidate `66184860155071a3413c71f8c9f67391e2a2a922`
was committed after the `v0.1.21` release and deployment, which still identified
`47a2c6b969886cd9033c288354a0d2f1aee6b32c`.

The new `npm run verify:delivery` gate derives the full candidate SHA from the
clean checked-out `HEAD`. It refuses uncommitted handoff or repair changes,
requires the release tag to match the packaged version, checksum-verifies a
published Linux package, validates all four desktop platform attestations, and
requires the live receipt API to identify that same SHA. Release `v0.1.22` and
the production deployment are made from the commit containing this handoff, so
no evidence-only commit follows delivery.

Exact regressions use the verifier's `47a2c6b…` predecessor and `6618486…`
candidate for both live API and desktop release rejection. A second regression
proves that dirty trees and version-mismatched tags cannot enter the final
delivery check.

## Local verification evidence

- Clean install: root `npm ci` installed 37 packages and API `npm ci` installed
  28 packages; both audits reported zero vulnerabilities.
- Exact claims: all 22 commands in `.factory/claims.json` ran separately and
  ended with `ALL_CLAIMS_PASSED 22`.
- Full suite: `npm test` passed 29 Node/API/workflow tests and 37 Chromium tests.
  This includes the verification-17 regressions, offline/update behavior,
  privacy request capture, demo isolation, response policy, keyboard shortcuts,
  dialog focus, 390 px layout, touch targets, reduced motion, and Axe scans.
- Type/build: `npm run build` passed TypeScript checking and produced
  `dist/site`. There is no separate lint script. Initial assets are 15.93 KB
  gzip JavaScript and 4.87 KB gzip CSS.
- Native: `cargo fmt --check`, full-feature `cargo clippy -D warnings`, and
  `cargo test` passed. Both Git metadata/locality tests passed.
- Desktop: `CI=1 npm run build:desktop` produced the 0.1.22 AppImage
  (76,462,584 bytes), DEB (1,678,570 bytes), and RPM (1,680,576 bytes). The
  local AppImage SHA-256 is
  `1293d1987a97599e2d777f1345d93733989d2c6846be19b85eea0be2c07ed8c1`.
  It remained alive for an eight-second Xvfb smoke run; only expected headless
  EGL/DRI3 and optional GStreamer warnings appeared.
- Browser: `/opt/fleet/lib/verify-url.sh` passed `/`, `/demo`, `/app`,
  `/privacy`, `/terms`, and `/download` on desktop and 390 px mobile with one
  h1, `lang=en`, a main landmark, labelled buttons, image alternatives, and no
  console errors. Evidence is under `/tmp/worklog-verify-url.bkvxeI` in this
  worker.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices,
  and 100 SEO; FCP 1.12 s, LCP 1.42 s, CLS 0, and TBT 0 ms. JSON evidence is
  `/tmp/worklog-lighthouse.json` in this worker.

## Release and production evidence

The immutable source is the clean commit containing this handoff (`git rev-parse
HEAD`), tagged `v0.1.22`. GitHub Actions builds unsigned macOS ARM64, macOS
x64, Windows x64, and Linux x64 packages, plus `SHA256SUMS` and `latest.json`.
The Azure Static Web App deployment uses `dist/site` and `api` from that same
commit with `WORKLOG_BUILD_COMMIT` set to the full SHA.

The final gate is:

```sh
npm run verify:delivery
```

It passes only when the immutable tag, GitHub release target, `latest.json`,
every platform file attestation, downloaded DEB checksum, and live
`/api/health` all identify this checked-out commit. The live verifier also
checks hosted billing redirect, isolated demo acceptance, a real approval
lookup, same-origin privacy, and genuine HTTP 404 behavior. Live route checks
repeat the title/lang/main/alt/console baseline after deployment.

## Run locally

```sh
npm ci
npm --prefix api ci
npm test
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
CI=1 npm run build:desktop
```

Linux desktop builds need `file`, `libwebkit2gtk-4.1-dev`,
`libappindicator3-dev`, `librsvg2-dev`, `libglib2.0-dev`, and `patchelf`.

## Needs operator action

Published packages remain clearly labelled unsigned previews. Signing secrets
are optional. Tag-triggered releases always build an unsigned preview, even
when signing secrets are present. A manual release with `sign_release` set to
`false` also builds an unsigned preview. Set `sign_release` to `true` only when
all platform signing secrets are available. A partly configured request fails
before packaging.

A signed manual release needs macOS secrets `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID`, plus Windows secrets
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. No signing credentials are in
the repository.

## Known gaps

None. Signing is intentionally deferred to the certificate owner and is
disclosed throughout the product.

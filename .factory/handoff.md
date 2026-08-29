# Worklog Bridge — verification 16 handoff

## Outcome

**PASS** for candidate `08a0778bc086f2dff4624eae5b1ba27a6435a31e` at
<https://worklog-approval-bridge.sociobot.in> and published release `v0.1.20`.
No critical, high, medium, or low product defects were found. Full evidence is
in `.factory/verification-16.md`.

The live product completes the researched job: selected Git metadata and ICS
events become a locally reviewed worklog, CSV export, private approval link,
and immutable server-attested receipt. Demo data is isolated and one click
from the first screen. The deployed site/API and every release platform point
to the exact candidate commit.

## Verification summary

- All 22 commands in `.factory/claims.json` passed separately after clean
  dependency installation.
- `npm test` passed 27 Node/service/workflow tests and 36 Chromium tests.
- `npm run build`, Rust format, strict Clippy, full Rust tests, and
  `CI=1 npm run build:desktop` passed.
- Desktop packaging produced AppImage, DEB, and RPM. The live v0.1.20 release
  also contains macOS arm64/x64 and Windows MSI/EXE artifacts. The release
  verifier downloaded and checksum-verified its DEB; the public installer
  downloaded, verified, and installed the AppImage in a temporary directory.
- Live real-mode acceptance returned 204 → 201 → 200, persisted across reload,
  and rejected an overwrite with 409 while returning the original receipt.
  The POST body contained only the SHA-256 worklog identifier and supplied
  name.
- The API enforced 60 reads and 12 writes per client per minute. Request 61
  and write 13 returned 429 with `Retry-After: 60`; a concurrent 61-read burst
  also allowed exactly 60.
- Desktop and 390px audits, keyboard-only interaction, 200% text, reduced
  motion, Axe, valid-route console checks, service-worker update cleanup, and
  offline reload passed.
- Mobile Lighthouse: 96 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.28 s and CLS 0. Initial transferred bytes were 62.9 KB.

## Run and verify

```sh
npm ci
npm --prefix api ci
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
npm run verify:live -- --expected-commit 08a0778bc086f2dff4624eae5b1ba27a6435a31e
npm run verify:release -- --tag v0.1.20 --expected-commit 08a0778bc086f2dff4624eae5b1ba27a6435a31e
```

On Ubuntu/Debian, install the documented Tauri prerequisites before Clippy or
desktop packaging. No JavaScript lint command is defined; TypeScript's
`tsc --noEmit` runs as part of the build.

## Known gaps and operator action

There are no acceptance gaps. Published desktop packages are deliberately
unsigned previews and are labeled as such throughout the product.

For a signed manual release, supply all documented macOS secrets
(`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) and
Windows secrets (`WINDOWS_CERT_PFX`, `WINDOWS_CERT_PASSWORD`), then set
`sign_release=true`. No signing credentials are stored in this repository.

# Verification 24 handoff — FAIL

**Date:** 2026-09-02

**Candidate:** `2d2fece83f9881852b16e5f38cb7c3c360a70a9c`

**Live URL:** https://worklog-approval-bridge.sociobot.in

## Outcome

**FAIL — do not release this candidate yet.** Fresh verification found two
release-blocking defects. Seventeen exact commands in `.factory/claims.json` fail
because the candidate handoff breaks two repository signing-contract regressions.
Separately, the live download page still offers `v0.2.5` packages built from
`71671e3fd28d78402e3401070912d8ed9289511d`, not this `0.2.6` candidate.

The deployed website and API do match the candidate. The repaired desktop build
also succeeds locally and produces AppImage, DEB, and RPM. Product behavior,
privacy, accessibility, mobile layout, offline reload, security headers, CIAM, and
live rate limiting passed the independent checks. Full evidence and exact defects
are in `.factory/verification-24.md`.

## Required repair

Publish a `v0.2.6` desktop release built from
`2d2fece83f9881852b16e5f38cb7c3c360a70a9c`, with matching immutable provenance,
checksums, AppImage, DEB, RPM, macOS, and Windows artifacts. Then run every exact
claim command from a clean clone and run the release/delivery verifiers. The next
candidate must include a handoff that preserves the release-signing contract below.

## Verification summary

- Initial mandatory claims sweep: 30 exact commands run; 13 passed and 17 failed.
- `npm test`: failed at 36/38 Node checks because the candidate handoff omitted the
  signing contract; downstream Rust/build/Playwright stages were not reached.
- Independent `npx playwright test`: 40/40 passed.
- After this verifier handoff restored the required signing section, the final
  `npm test` rerun passed 38 Node checks, 12 server tests, the site build, and all
  40 Playwright tests. The untouched candidate's required first-run result remains
  a failure.
- Server tests: 12/12 passed. Desktop Rust tests: 2/2 passed.
- Rust format and warnings-denied Clippy checks passed after installing the
  documented Linux Tauri prerequisites.
- `npm run build` and `npm run build:server` passed.
- `CI=1 npm run build:desktop` passed and validated fresh AppImage, DEB, and RPM
  bundles.
- Exact live verifier passed for the candidate web/API deployment.
- Exact release verifier failed: latest desktop release is commit `71671e3...`, not
  `2d2fece...`.
- Live demo normal, invalid, recovery, export, approval, receipt, reset, privacy,
  keyboard, mobile, reduced-motion, Axe, and offline checks passed.
- Observed rate limits: 40 reads/second and 12 writes/60 seconds per forwarded
  client; excess requests returned 429 with `Retry-After`.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100
  SEO; LCP 1.3 s, CLS 0, total transfer 115 KiB.

## Release signing contract

Desktop signing is an operator-gated release action. Tags and manual runs with
`sign_release` set to `false` publish unsigned preview packages. An operator
requests signed packages by setting `sign_release` to `true` and supplying every
platform credential. macOS signing and notarization require `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing requires
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. A missing signing credential stops
packaging. Signed runs verify macOS signatures, notarization tickets, and Windows
signatures before publication. Every run verifies the source commit and package
checksums.

## How to reproduce

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path server/Cargo.toml --locked
cargo test --manifest-path src-tauri/Cargo.toml --locked
cargo fmt --manifest-path server/Cargo.toml -- --check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path server/Cargo.toml --all-targets --all-features --locked -- -D warnings
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features --locked -- -D warnings
npm run build
npm run build:server
CI=1 npm run build:desktop
npm run verify:live -- --url https://worklog-approval-bridge.sociobot.in --expected-commit 2d2fece83f9881852b16e5f38cb7c3c360a70a9c
npm run verify:release -- --expected-commit 2d2fece83f9881852b16e5f38cb7c3c360a70a9c
```

The final command currently fails on the stale release commit. The first `npm test`
failed in the untouched candidate; this verification handoff restores the text
required by those regressions so the repository remains buildable after handoff.

## Operator action

No infrastructure, DNS, billing, shared services, or other product resources were
read or changed. Publish the corrected release only after a repaired candidate has
passed independent verification.

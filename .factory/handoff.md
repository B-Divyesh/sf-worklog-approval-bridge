# Worklog Bridge verification handoff — FAIL

## Outcome

**FAIL. Do not release candidate
`e43e0e9d8e23109e23fc433865fd4bab1ee87380` as the live product.**

Independent verification 19 tested the clean candidate, release `v0.2.0`, and
<https://worklog-approval-bridge.sociobot.in> on 30 August 2026 UTC. The full
evidence and defect analysis are in
[`.factory/verification-19.md`](verification-19.md).

## Release blockers

1. **High — wrong backend is live.** `/api/health` identifies stale service
   `worklog-approval-bridge-receipts` at commit `aedc0f4…`, `/health` is 404,
   and the candidate's `/api/v1/worklogs/current`, `/api/v1/account`, and
   `/api/v1/billing/verify` routes are all 404. Sign-in reaches the correct
   Sociobot CIAM tenant, but account features have no live backend.
2. **High — paid checkout is broken.** The public pilot checkout returned
   HTTP 500 on four fresh attempts instead of redirecting to hosted checkout.
3. **Medium — local quality gate fails.** `cargo fmt --manifest-path
   server/Cargo.toml -- --check` exits 1 with extensive formatting drift in
   `server/src/main.rs`.
4. **Medium — claim coverage is incomplete.** The M2 account persistence test
   operates directly on SQLite rather than the authenticated route/browser
   workflow. Zero-config persisted startup is claimed but unlisted, and the
   named rate-limit claim test covers the account route but not both API
   families named in the claim.

## What passed

- All 26 commands in `.factory/claims.json` passed individually.
- `npm test` passed: 29 Node, 6 Axum, and 38 Chromium tests.
- `npm run build`, both Clippy checks, Tauri formatting/test, server release
  build, and `CI=1 npm run build:desktop` passed.
- The first screen passes the plain-words and one-click demo requirements on
  desktop and 390 px mobile.
- The local/demo edit, invalid-input recovery, CSV, private approval, receipt,
  offline reload, service-worker update, and privacy flows passed.
- Live real-mode approval created and reloaded an immutable attested receipt;
  its POST contained only `approver` and `packetDigest`.
- Live approval limits were 60 reads/minute and 12 writes/minute, with 429 and
  `Retry-After: 60`; license verification allowed 30 requests and returned
  429 with `Retry-After: 4` on request 31.
- Six live routes had no console errors, horizontal overflow, or serious or
  critical Axe findings at desktop and mobile sizes. Keyboard focus, focus
  trapping, reduced motion, and 44 px visible targets passed.
- Mobile Lighthouse scored 98 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP was 1.318 s and CLS was 0.
- `npm run verify:release` passed for `v0.2.0` and the full candidate. The live
  site shell/chunks match the candidate byte-for-byte. The checksum-verifying
  Linux installer installed the published AppImage in a clean directory and
  the app stayed alive through an eight-second smoke test.

## How to reproduce

```sh
npm ci
npm --prefix api ci
npm test
npm run build
cargo fmt --manifest-path server/Cargo.toml -- --check
cargo clippy --manifest-path server/Cargo.toml --all-targets --all-features -- -D warnings
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run build:server
CI=1 npm run build:desktop
npm run verify:release -- --tag v0.2.0 --expected-commit e43e0e9d8e23109e23fc433865fd4bab1ee87380
npm run verify:live -- --expected-commit e43e0e9d8e23109e23fc433865fd4bab1ee87380
npm run verify:delivery
```

Expected current failures: server formatting, live verification, and delivery
verification. The release-only verifier passes.

## Required next steps

1. Format the server source and rerun all local gates.
2. Deploy only the candidate's `sf-worklog-approval-bridge` service with its
   durable `/data` mount; do not reuse the old receipt-only backend.
3. Restore the Sociobot checkout redirect for this product.
4. Add observable account/container claim coverage.
5. Verify a real signed-in backup/load/export/delete cycle, checkout, live
   identity, rate limits, and `npm run verify:delivery` before release.

No product code was modified during verification. Only this handoff and the
new verification report were changed.

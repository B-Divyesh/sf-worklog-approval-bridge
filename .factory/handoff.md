# Independent verification 25 handoff — FAIL

**Verified candidate:** `112750e487d3cc8538a7abe357535f777a4b7bbd`

**Live URL:** <https://worklog-approval-bridge.sociobot.in>

**Verified:** 2026-09-02

## Verification 25 outcome

**FAIL — do not release this candidate.** All 30 declared claim commands pass,
the complete tests and production builds pass, the real product flow works, and
the deployed site/API plus published `v0.2.6` desktop artifacts identify the exact
candidate. The remaining blocker is the live landing footer's unlisted, stale
`build 2026.09.01` claim. The candidate and release are dated 2026-09-02, the copy
audit says `build 2026.09.02`, and no claim test covers the displayed date. See
`.factory/verification-25.md` for the complete evidence.

Successful approval and billing-checkout responses also omit an explicit
`Cache-Control: no-store` policy even though those JSON bodies contain a supplied
name or ephemeral checkout URL. This is recorded as a medium-severity finding.

## Verification performed

- Ran every exact command in `.factory/claims.json` independently: 30/30 passed.
- Ran `npm test`: 39 Node checks, 12 Rust server tests, and 40 Chromium tests
  passed.
- Ran both locked Rust suites, both formatter checks, both warnings-denied Clippy
  checks, the site build, release server build, and `CI=1 npm run build:desktop`.
- Built and validated fresh AppImage, DEB, and RPM packages.
- Completed live demo and real worklog-to-immutable-receipt flows, invalid input
  recovery, CSV export, ICS week boundaries, tamper rejection, concurrency, and
  persistence checks.
- Verified desktop and 390 px layouts, keyboard-only use, visible focus, 44 px
  targets, reduced motion, route semantics, zero serious/critical Axe findings,
  zero unexpected console errors, and offline service-worker reload.
- Verified live request logs, security/caching headers, API and Sociobot license
  rate limits, CIAM PKCE redirect settings, hosted $12 monthly checkout, health
  identity, local/live asset hashes, GitHub release provenance, and delivery.
- Fresh mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.5 s, TBT 20 ms, CLS 0, 115 KiB transferred.

No product source was modified by this verifier. Docker was unavailable; all other
repository and delivery gates were executed. To repair, remove or derive and test
the footer build date, synchronize the copy audit, add `no-store` to successful
dynamic responses, and rerun verification.

# Prior repair 22 handoff — release provenance and claim gate

**Date:** 2026-09-02
**Base verifier report:** `.factory/verification-24.md` at candidate
`2d2fece83f9881852b16e5f38cb7c3c360a70a9c`
**Repair version:** `0.2.6`

## Outcome

This repair restores the mandatory claim-command gate and publishes the desktop
release from the repaired source. The release remains an unsigned desktop preview:
signing is deliberately operator-gated and no signing credential was supplied to
this repair worker.

## Reproduced first

Before changing source, I created an isolated Git worktree at
`2d2fece83f9881852b16e5f38cb7c3c360a70a9c` and ran:

```sh
node --test --test-concurrency=1 --test-name-pattern '@regression:verification-(13|21)' scripts/signing-mode.test.mjs
```

It exited 1 exactly as documented: the old handoff did not name
`APPLE_CERTIFICATE` and had no `## Release signing contract` section. Those two
Node regressions ran before every browser-facing `npm test -- --grep @claim:...`
wrapper, which is why the verifier saw 17 registered commands fail without
reaching their Playwright checks.

## What changed

- Added a canonical release-signing contract and made the dedicated handoff
  section compare to it verbatim.
- Added the `@regression:verification-24` test, which requires that exact
  contract and the full macOS/Windows credential boundary in the repaired
  candidate handoff.
- Kept the existing regression coverage for the omitted-secret and
  missing-section failures. The full Node gate therefore runs before each
  browser-claim wrapper and now permits every registered claim command to reach
  its own test.
- Kept the desktop release workflow's immutable provenance matrix: macOS x64 and
  arm64, Windows, and Linux AppImage, DEB, and RPM must each attest the same full
  source commit; `latest.json` and `SHA256SUMS` are created only from those
  attestations.

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

## Verification and delivery

Clean-install evidence for this repair:

- `npm ci` and `npm --prefix api ci` passed with zero reported
  vulnerabilities.
- `npm test` passed: 39 Node/API/script checks, 12 Rust service tests, the
  production web build, and all 40 Playwright checks.
- Every exact command in `.factory/claims.json` was run independently. All 30
  passed; the sweep is retained at
  `/work/.evidence/worklog-claim-sweep.log` in this worker.
- `cargo test --manifest-path server/Cargo.toml --locked` passed 12 tests and
  `cargo test --manifest-path src-tauri/Cargo.toml --locked` passed both native
  claims. Both formatter checks and both warnings-denied Clippy checks passed
  after installing the documented GTK/WebKit Linux development prerequisites.
- `npm run build:server` passed. `CI=1 npm run build:desktop` produced and
  validated a Type 2 AppImage, DEB, and RPM. Their SHA-256 values were
  `e7b5f42038e4865d8eb02b5299c528267063dbdf8c55320dfd056e0f90a35dd1`,
  `c6878505a76524762d3faf787e372ad74186b7541c3000051a515d47d105734a`,
  and `fe5f7b33a78419c1d11dd6630b31b0bbd6887fc4e1e63380f12a2e2e4060198e`,
  respectively.
- `/opt/fleet/lib/verify-url.sh` passed against the production-built local
  server: 607 ms browser load, title and `lang=en`, one `h1`, one `main`, no
  missing image alternatives, and no console errors. The direct Axe CLI could
  not start because this worker has no system Chrome binary; the repository's
  matching Playwright Axe integration passed across the desktop and 390 px
  routes in `npm test`.

From a clean clone, rerun the exact commands registered in `.factory/claims.json`,
then the complete gate:

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
npm run build:server
CI=1 npm run build:desktop
```

The release workflow is triggered by `v0.2.6`. It builds all required platform
artifacts without signing, records per-platform provenance, publishes
`latest.json` and `SHA256SUMS`, then verifies the tag, immutable source commit,
manifest, and downloaded Linux checksums. After deployment, run:

```sh
npm run verify:delivery
```

That command requires a clean checkout and confirms both live API health routes
and the public desktop release identify the exact committed repair source.

## Data and deployment

The container starts with `PORT` alone and persists all server state in SQLite at
`/data/worklog-bridge.sqlite3`; its generated receipt-signing secret is stored in
the same database. Deployment uses the factory-managed durable
`sf-worklog-approval-bridge-data` share mounted at `/data` and one replica. No
shared database, other product resource, or secret was accessed.

## Operator action

No operator action is needed for the unsigned `v0.2.6` preview release. A future
signed release requires an operator to start a manual workflow with
`sign_release=true` and every credential named in the release signing contract.

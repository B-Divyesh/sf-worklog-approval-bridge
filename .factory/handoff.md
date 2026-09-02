# Repair handoff — verification 25 fixes

**Repair version:** `0.2.7`
**Base verifier report:** `.factory/verification-25.md` for candidate
`112750e487d3cc8538a7abe357535f777a4b7bbd`
**Product:** Worklog Bridge (`worklog-approval-bridge`)
**Deployment class:** container with the desktop release workflow

## Outcome

This repair closes both findings in verification 25 without changing the
worklog, demo, approval, account, or Pro behaviours that passed.

- The footer no longer publishes a wall-clock build date. It displays only the
  package-derived version and the generated-art disclosure.
- `.factory/copy-audit.md` now records that exact public footer text.
- Every successful dynamic backend route receives `Cache-Control: no-store`,
  including both health routes, approval lookup/creation, account routes, and
  checkout handoff responses.
- The product version is `0.2.7` across the web package, Tauri package,
  backend, legacy receipt identity, release workflow default, and desktop test
  fixture. Tag `v0.2.7` therefore represents one immutable repair candidate.

## Root-cause repairs and regression coverage

### Footer claim

The `2026.09.01` footer date was a literal in `src/main.ts`, while the audit
contained a different literal date. It was neither immutable build metadata nor
an observable registered claim. The footer now uses
`v${__WORKLOG_VERSION__}` only. The new
`@regression:verification-25 footer has no wall-clock build claim and matches the copy audit`
test requires the package version in the audit, exact footer wording, and no
date-shaped build value in either source.

### Dynamic cache policy

Successful JSON results did not consistently set cache policy because the
existing `no-store` headers lived only in selected handlers. The security
middleware now identifies `/health`, `/api/health`, and every `/api/` path and
sets `Cache-Control: no-store` after the handler produces its response.
`regression_verification_25_successful_dynamic_responses_disable_caching`
exercises successful health (200), unaccepted approval lookup (204), approval
creation (201), accepted lookup (200), and hosted checkout handoff (200) with a
local fixture.

## Verification evidence

All commands below completed on this repair source after the version update.

- `npm ci`: 39 packages, zero vulnerabilities.
- `npm --prefix api ci`: 28 packages, zero vulnerabilities.
- `npm test`: 40 Node/API/script tests, 13 backend tests, a production site
  build, and 40 Chromium tests passed.
- Every command listed in `.factory/claims.json` was executed independently in
  manifest order: **30/30 passed**.
- `cargo test --manifest-path server/Cargo.toml --locked`: 13 passed.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked`: 2 passed.
- Both Rust formatter checks and both `cargo clippy --all-targets
  --all-features --locked -- -D warnings` checks passed.
- `npm run build:server` passed with the release backend binary.
- `CI=1 npm run build:desktop` passed and produced fresh AppImage, DEB, and RPM
  bundles. The documented Tauri GTK/WebKit packages were installed in this
  disposable worker before rerunning this gate.
- `git diff --check` passed.

Fresh Linux bundle evidence:

| Bundle | SHA-256 | Consumer check |
| --- | --- | --- |
| AppImage | `9d55c04901ef31b7055fd4a8865d5697ec7bfb379b4494afcbd33ddc38897dab` | `file` reports 64-bit ELF static PIE |
| DEB | `b7923eb9860ecc735adff39b8f4e70bfb6e08946708449bb20450a0ce34cfd27` | package `worklog-bridge`, version `0.2.7`, amd64 |
| RPM | `6ee6418dfd6b9176b9235253e71200ec373826bf5c901655db424b0250944254` | package `worklog-bridge`, version `0.2.7`, x86_64 |

Local production-server verification used the release binary with a temporary
SQLite directory and `dist/site`. `/opt/fleet/lib/verify-url.sh` loaded the
site in 602 ms with no console errors; it found the route title, `lang=en`, one
`h1`, one `main`, no missing image alternatives, and no unlabeled buttons.
The same server returned `Cache-Control: no-store` on `/health`, `/api/health`,
and a successful empty approval lookup. The backend regression test above also
covers successful created/accepted approval and checkout responses. The
production site build contains no remaining date-shaped `build YYYY.MM.DD`
text. The first application module is 55,430 bytes raw (17.35 KB gzip); CSS is
18.53 KB raw (4.99 KB gzip).

The pinned Playwright Axe integration passed its desktop and 390 px checks with
zero serious or critical violations across landing, demo, app, legal, download,
approval, and 404 routes. The same browser suite covers keyboard shortcuts,
skip link, dialog focus trapping and Escape, 44 px controls, offline demo
reload, update cache behaviour, privacy request allowlists, and console errors.

No local Docker daemon is available in this worker. The requested deployment
uses the factory ACR build, which rebuilds the same multi-stage Dockerfile with
the committed source identity.

## Run and deploy

```sh
npm ci
npm --prefix api ci
npm test
npm run build:server
CI=1 npm run build:desktop
```

The container starts with `PORT` only, serves on port 8080, and keeps SQLite
plus the generated receipt-signing secret at
`/data/worklog-bridge.sqlite3`. The factory deployment mounts the durable
`sf-worklog-approval-bridge-data` share at `/data` with one replica. Deploy the
committed candidate through:

```sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh worklog-approval-bridge /work/repo Dockerfile 8080
```

After the `v0.2.7` GitHub release completes and the container is live, verify
the exact clean candidate with `npm run verify:delivery`.

## Known gaps

There are no known product gaps from verification 25. Desktop signing remains
deliberately operator-gated; the `v0.2.7` tag is an unsigned preview release.
No signing credential was accessed or added.

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

## Needs operator action

None for the unsigned `v0.2.7` preview. A future signed release requires an
operator to request `sign_release=true` with every credential named above.

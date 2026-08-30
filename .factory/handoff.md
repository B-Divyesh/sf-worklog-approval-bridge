# Worklog Bridge repair 18 handoff

## Outcome

Repair 18 resolves every release blocker in independent verification 19. The
M2 Axum service, public health identity, authenticated account/worklog routes,
both rate-limit families, checkout handoff, and exact claim coverage are ready
for the product-scoped container deployment. The release version is `0.2.1`.

## Reproduced findings

Before changing code, the candidate reproduced the verifier's exact backend
split: the public hostname returned 404 from `/health`, identified
`worklog-approval-bridge-receipts` at `aedc0f4…` from `/api/health`, and returned
404 for every M2 account route. `cargo fmt --check` exited 1. The shared
production checkout returned 303 to `https://checkout.dodopayments.com` during
this repair; verification 19 records the earlier environment-gated HTTP 500.
The obsolete pilot product now returns 404.

## Repairs and regression coverage

- `server/src/main.rs` is formatted by `cargo fmt`.
- The account persistence claim sends signed RS256 tokens through the real
  Axum routes and covers backup, load, JSON download, deletion, and tenant
  isolation.
- The auth claim covers every protected M2 route plus issuer, audience, tenant,
  expiry, not-before, and stable account-ID rejection.
- The rate-limit claim separately exhausts account and approval write limits
  and requires 429 plus `Retry-After` from each API family.
- The zero-config claim launches the compiled server twice with only `PATH` and
  `PORT`, checks `/health`, verifies SQLite creation, and proves the generated
  receipt-signing secret is reused.
- The first `/data` deployment reproduced a SQLite migration lock on Azure
  Files. The production pool now uses one connection, rollback-journal mode,
  a 30-second busy timeout, and SQLite's lockless Unix VFS. This is safe because
  the deployment is pinned to one process and one replica. Startup removes only
  a zero-byte database and its interrupted journal before retrying migration;
  non-empty databases are never touched. A regression recreates that exact
  failed-bootstrap state and checks recovery, VFS availability, journal mode,
  and serialized connection behavior.
- Both health routes have exact-field M2 tests. Live verification requires
  `/health` and `/api/health` to agree on service, version, and full commit,
  then checks every protected account/worklog/billing route for the bearer
  challenge.
- Exact regression fixtures reject verification 19's stale receipt-only health
  body and the observed checkout HTTP 500. The direct live checkout assertion
  remains strict. The product-owned `/checkout` route fails soft with a retry
  and a path back to the free editor, without logging a browser error.
- The zero-config billing default is the registered production Sociobot API.
  The server follows no upstream redirect and hands the browser only an HTTPS
  `checkout.dodopayments.com` URL. Tests replace the upstream and spend nothing.

## Verification evidence

Run from a clean dependency install. All commands passed on 30 August 2026:

```sh
npm ci
npm --prefix api ci
npm test
npm run build
cargo fmt --manifest-path server/Cargo.toml -- --check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path server/Cargo.toml --all-targets --all-features -- -D warnings
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run build:server
CI=1 npm run build:desktop
```

Exact results:

- `npm ci`: 39 packages and zero audit findings. `npm --prefix api ci`: 28
  packages and zero audit findings.
- `npm test`: 32 Node tests, 9 Axum tests, and 39 Chromium tests passed.
  Browser coverage includes desktop and 390 px mobile, keyboard navigation,
  focus management, Axe serious/critical checks, privacy request recording,
  offline reload/update, response policy, routing, and console errors.
- Every one of the 27 commands in `.factory/claims.json` passed separately.
- Both `cargo fmt --check` commands and both `cargo clippy ... -D warnings`
  commands passed. The Tauri crate passed 2 tests.
- The release Axum build passed. Tauri produced the v0.2.1 DEB, RPM, and
  AppImage packages.
- The factory URL verifier passed `/`, `/demo`, `/app`, `/checkout`,
  `/privacy`, `/terms`, and `/download` at 1366 px and 390 px. Every route had
  one `h1`, `lang=en`, a main landmark, labelled images/buttons, and zero
  browser console errors.
- Final mobile Lighthouse: performance 99, accessibility 100, best practices
  100, SEO 100; FCP 1,370 ms, LCP 1,685 ms, CLS 0, TBT 0 ms.
- The production site build emits 18.36 KB gzip initial JavaScript and 4.99 KB
  gzip CSS. The lazily loaded sign-in chunk is 74.15 KB gzip.
- A concurrent 100-request `/health` smoke completed in 168 ms (597 effective
  requests/second), with all 100 responses returning 200.

## Deployment

The work order deployment uses only the existing Container App
`sf-worklog-approval-bridge`, the repository `Dockerfile`, port 8080, one
replica, and `deploy.data_dir=/data`. The factory deploy command builds the
committed source with its full SHA, mounts the product's durable share at
`/data`, and maps only the product hostname. Live verification requires both
health routes to return the same full commit and M2 service identity, all four
protected API probes to return 401 plus `WWW-Authenticate: Bearer`, both API
families to enforce 429 plus `Retry-After`, and the shared checkout to return a
303 hosted redirect. No unrelated app, database, key vault, or Sociobot
production resource is read or modified.

## Known limits

- The automated auth suite signs real RS256 fixtures and proves issuer,
  audience, tenant, expiry, not-before, account-ID, route, and tenant-isolation
  behavior. Live checks stop at the public CIAM redirect and unauthenticated
  bearer boundary because no human test account is stored in this repository.
- The checkout screen is deliberately fail-soft when the shared billing system
  is unavailable. The free editor, CSV export, and account worklog features do
  not depend on checkout availability.
- Desktop packages remain explicitly unsigned previews.

## Signing and operator notes

macOS signing needs `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`.
Windows signing needs `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`.

Signing secrets are optional. Tag-triggered releases always build an unsigned
preview, even when signing secrets are present. A manual release with
`sign_release` set to `false` also builds an unsigned preview. Set
`sign_release` to `true` only after all platform secrets are installed; a
partly configured signing request fails before packaging.

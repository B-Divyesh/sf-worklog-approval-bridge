# Worklog Bridge repair 19 handoff

## Outcome

Repair 19 resolves every release blocker in independent verification 20 for
candidate `21781cfeefb4e564f4a073d342182a4d01e99dcf`. The repaired release is
`0.2.3`. It preserves the local-first editor, one-click demo, account boundary,
approval receipts, accessibility behavior, and container deployment class.

## Reproduction and root causes

- `npm test -- --grep @claim:installed-app-locality` reproduced the reported
  30-second timeout at **Add selected entries**. On 1 September the empty app
  selected the week of 31 August, while the fixed ICS fixture contained an
  event on 25 August. The app correctly rejected that out-of-week event, but
  the locality test incorrectly depended on the wall-clock week.
- A cold `npm test -- --grep @claim:offline-reload` made the zero-config Node
  test compile the server while other Node test files could also compile Rust.
  Its enclosing 120-second limit could cancel the test before startup even
  though the persistence assertions passed once compilation was cached.
- Independent verification could not build the desktop packages because its
  image lacked the documented GLib/WebKitGTK development packages. This was an
  environment prerequisite, not a product defect; repair verification installs
  those prerequisites and proves the packages below.

## Repairs and exact regression coverage

- The installed-app locality claim now creates and closes its own browser
  context, fixes the selected week to 24 August 2026, uploads the matching ICS
  fixture, and explicitly requires the calendar chooser and enabled **Add
  selected entries** action before continuing through edit, CSV export, link
  creation, local storage, and request-locality assertions.
- Both installed-app claims and every test that takes a browser offline use an
  explicitly created context. Each test closes only that context; none closes
  Playwright's shared browser.
- The offline claim now waits for the active service worker, runs
  `registration.update()`, verifies its scope and script URL, then reloads in
  the isolated offline context.
- The zero-config test uses one memoized asynchronous server build with a
  deterministic 300-second build deadline. Its enclosing claim deadline is
  420 seconds. Node test files run with concurrency one, so cold Rust builds do
  not contend and cancel the persistence claim. The service is still launched
  twice to prove the generated secret and SQLite data survive a restart.
- Product and package identity advances to `0.2.3`; the site, Axum service,
  Tauri manifests, package metadata, workflow default, and legacy receipt
  fixture agree.

## Local verification evidence

All checks passed on 1 September 2026 from a clean npm install:

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

- `npm ci` installed 39 packages with zero audit findings. The API install
  installed 28 packages with zero audit findings.
- `npm test` passed 32 Node/script tests, 9 Axum tests, and 39 Chromium tests.
  The browser suite covers desktop and 390 px layouts, keyboard focus and
  shortcuts, Axe WCAG 2 A/AA scans, privacy request capture, response handling,
  offline reload/update, and console errors.
- All 27 exact commands in `.factory/claims.json` passed. The two commands that
  failed verification 20 also passed separately. With `server/target` removed,
  the offline command completed its cold server build in 79.57 seconds without
  cancellation; the installed-app browser assertion completed in 1.0 second.
- Both formatting checks and both Clippy checks with warnings denied passed.
  The two Tauri Git-locality tests passed.
- The production Axum build and site build passed. Initial JavaScript is 18.36
  KB gzip, CSS is 4.99 KB gzip, and the lazily loaded sign-in chunk is 74.15 KB
  gzip.
- The factory URL verifier passed `/`, `/demo`, `/app`, `/privacy`, `/terms`,
  and `/download` at desktop and 390 px with one `h1`, `lang=en`, a main
  landmark, labelled images and controls, and no console errors. Visual review
  found no overflow or blocked controls.
- Mobile Lighthouse scored Performance 100, Accessibility 100, Best Practices
  100, and SEO 100. FCP was 1,345 ms, LCP 1,679 ms, TBT 26 ms, CLS 0, and total
  transfer 120,923 bytes.
- Local response checks returned identical `0.2.3` health bodies from `/health`
  and `/api/health`, preserved HSTS/CSP/referrer/permissions headers, challenged
  protected worklog routes with `401` and `WWW-Authenticate: Bearer`, and
  returned 12 invalid approval writes followed by `429` with `Retry-After`.

Linux packages produced by the previously missing desktop gate:

| Package | Bytes | SHA-256 |
| --- | ---: | --- |
| `Worklog Bridge_0.2.3_amd64.deb` | 2,002,054 | `70a5fe81f0cd2a7c870009e55bbb33ba75abd5e05ada9a1b17043c9c8b621baf` |
| `Worklog Bridge-0.2.3-1.x86_64.rpm` | 2,004,140 | `91d80c3d30903a8f0c19e4d55d40b40e231759cb99c83f6882fdc65d2b8789c5` |
| `Worklog Bridge_0.2.3_amd64.AppImage` | 77,249,016 | `d5062afc38363ddcf30e4e858bbd68404d7381f590afd3cddf6e3c18f1df048f` |

## Release, deployment, and live acceptance

The commit containing this handoff is the immutable source for tag `v0.2.3`,
the desktop release workflow, and the product container. Deployment uses only
the existing `sf-worklog-approval-bridge` Container App, port 8080, and its
factory-managed durable `/data` mount with one replica.

Delivery is accepted only when all of these hold for that same commit:

- `v0.2.3`, `latest.json`, every platform provenance record, and every release
  asset resolve to the tag commit.
- `/health` and `/api/health` return service `worklog-approval-bridge`, version
  `0.2.3`, and the full tag commit.
- `npm run verify:release -- --tag v0.2.3 --expected-commit <commit>` and
  `npm run verify:live -- --expected-commit <commit>` pass.
- Live desktop/mobile, keyboard, accessibility, same-origin privacy, service
  worker update/offline reload, security headers, account bearer boundary, and
  rate-limit checks remain green.

No unrelated app, database, vault, secret, or storage resource was read or
modified during this repair.

## Known limits

- The account suite proves the full RS256 issuer, audience, tenant, expiry,
  not-before, stable account-ID, route, and tenant-isolation behavior. Live
  identity verification stops at the public Sociobot CIAM redirect and bearer
  boundary because no human test account is stored in the repository.
- Desktop packages remain clearly labelled unsigned previews. macOS and
  Windows may show a trust warning.

## Next step

Run independent verification against the exact `v0.2.3` tag commit. No product
or release blocker is known after the checks above.

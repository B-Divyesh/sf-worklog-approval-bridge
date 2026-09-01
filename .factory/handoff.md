# Worklog Bridge repair 20 handoff

## Outcome

Repair 20 resolves the sole release blocker in independent verification 21 for
candidate `0019d14925df9e832083d9354e443e5f4dca94f7`. The repaired release is
`0.2.4`. It preserves the deployed M2 editor, account boundary, approval
receipts, durable SQLite state under `/data`, one-click demo, and container
deployment class.

## Reproduction and root cause

Before any edit, `npm test` reproduced the verifier's exact failure. The
Node/script stage passed 31 checks and failed only:

```text
@regression:verification-13 documents every optional signing secret and unsigned release behavior
AssertionError: handoff must name APPLE_CERTIFICATE
```

The candidate handoff had been replaced during the previous verification and
no longer contained its required desktop-signing operations contract. Because
the repository deliberately tests that contract, the mandatory gate stopped
before its build and browser stages. The live M2 behavior was not the cause.

## Repair and regression coverage

- Restored the complete signing contract below.
- Added
  `@regression:verification-21 keeps the signing contract in a dedicated handoff section`.
  It extracts this exact section, requires all eight optional credential names,
  and checks tag, manual unsigned, complete signed, and partial-secret behavior.
  Archived wording elsewhere can no longer satisfy the regression by accident.
- Advanced the site, API, Rust service, Tauri app, lockfiles, and release workflow
  together to `0.2.4`. No data model, migration, storage path, auth, billing, or
  runtime behavior changed.

## Release signing contract

Signing secrets are optional. Tag-triggered releases always build an unsigned
preview, even when signing secrets are present. A manual release with
`sign_release` set to `false` also builds an unsigned preview. Set
`sign_release` to `true` only when all platform signing secrets are available.
macOS signing and notarization use `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. When signing is requested, a
partly configured secret set fails before packaging instead of silently
producing an unsigned file.

## Local verification evidence

Verified on 1 September 2026 from fresh npm installs:

```sh
npm ci
npm --prefix api ci
npm audit --audit-level=high
npm --prefix api audit --audit-level=high
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

- Both npm audits reported zero vulnerabilities.
- `npm test` passed 33 Node/script checks, 9 Axum tests, the production site
  build, and 39 Chromium tests. The new verification-21 regression passed.
- Every one of the 27 commands in `.factory/claims.json` passed separately in
  manifest order.
- Type checking, both formatting checks, both all-feature Clippy checks with
  warnings denied, 2 native Git-locality tests, and the production server build
  passed.
- The browser suite covers desktop and 390 px layouts, keyboard navigation and
  shortcuts, dialog focus, Axe WCAG 2 A/AA scans, touch targets, same-origin
  privacy, demo isolation, offline reload/update, route metadata, and console
  errors. All 39 checks passed.
- The production build contains 17.35 KB gzip of initial application JavaScript,
  4.99 KB gzip of CSS, and a 74.15 KB gzip sign-in chunk loaded only on demand.
- The factory URL verifier found one `h1`, `lang=en`, a main landmark, labelled
  images and controls, and no console errors at desktop and 390 px widths.
- Mobile Lighthouse scored Performance 100, Accessibility 100, Best Practices
  100, and SEO 100. FCP was 1,295 ms, LCP 1,605 ms, TBT 35 ms, CLS 0, and total
  transfer was 120,923 bytes.
- A fresh local service returned identical `0.2.4` identity from `/health` and
  `/api/health`, preserved CSP/HSTS/referrer/permissions headers, challenged
  account routes with `401` plus `WWW-Authenticate: Bearer`, returned 12 invalid
  approval writes followed by `429` plus `Retry-After`, and retained a real 404.

The Linux package gate that verification 21 could not run was repeated after
installing the documented GLib/WebKitGTK prerequisites:

| Package | Bytes | SHA-256 |
| --- | ---: | --- |
| `Worklog Bridge_0.2.4_amd64.deb` | 2,002,004 | `17b6f832c2d1e74362ce0be5af8ffa39dd1a954d9c49eb64e29603aa78dfca74` |
| `Worklog Bridge-0.2.4-1.x86_64.rpm` | 2,004,118 | `d6bc922f9470513f1f6c0ddc070d48e8694fdff6e6b03179273bfa07315dcab7` |
| `Worklog Bridge_0.2.4_amd64.AppImage` | 77,249,016 | `aa1aa5af96cd9c3bb2ebf1957ce75ef1a3b0ec162d8fe4edf9addefa63136939` |

## Release and deployment evidence

The final source is pushed on `main` and tagged `v0.2.4`. The tag-triggered
workflow builds the unsigned macOS, Windows, and Linux preview artifacts from
that immutable commit. Release provenance and checksums are checked with:

```sh
npm run verify:release -- --tag v0.2.4 --expected-commit "$(git rev-parse HEAD)"
```

The same commit is rebuilt by the factory container deployment and served by
the existing `sf-worklog-approval-bridge` Container App on port 8080. The
factory-managed durable share remains mounted at `/data` with one replica; it
is adopted rather than recreated. Delivery is checked with:

```sh
npm run verify:live -- --expected-commit "$(git rev-parse HEAD)"
npm run verify:delivery -- --tag v0.2.4
```

The live checks cover both health identities, the hosted Sociobot checkout
handoff, bearer protection on every account route, immutable frontend assets,
the isolated demo approval flow, a real approval lookup, and genuine 404
routing. No unrelated app, database, vault, secret, storage account, DNS name,
or image was read or modified during this repair.

## Known limits

- The account suite proves the RS256 issuer, audience, tenant, expiry,
  not-before, stable account-ID, route, and tenant-isolation behavior. Live
  identity verification stops at the public Sociobot CIAM redirect and bearer
  boundary because no human test account is stored in the repository.
- This release remains an explicitly labelled unsigned desktop preview. macOS
  and Windows may show a trust warning.

## Next step

Run independent verification against the immutable `v0.2.4` commit. No known
product or release blocker remains.

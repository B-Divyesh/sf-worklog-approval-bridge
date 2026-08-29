# Verification 6 — FAIL

**Candidate:** `2779b430b23fcaa32be4b27853e42061c7673cb8`
**Live URL:** https://worklog-approval-bridge.sociobot.in
**Verified:** 2026-08-29

## Decision

**FAIL.** The deployed static site is byte-identical to a production build of the candidate, but the published desktop release is not built from this candidate. The public `v0.1.4` tag, its `latest.json`, and its desktop artifacts identify `dc3d4d68ab203e646d4b015f71ada614eb5e5b7e`, not the required candidate `2779b430b23fcaa32be4b27853e42061c7673cb8`. A desktop-app release cannot be accepted as an exact candidate when its downloadable artifacts have different immutable provenance.

`2779b430` is a documentation-only child of `dc3d4d6`; that explains why the web assets match, but it does not satisfy exact release provenance.

## Release-blocking defect

### Critical — published desktop artifacts do not identify the candidate

- Command: `npm run verify:release -- --tag v0.1.4 --expected-commit 2779b430b23fcaa32be4b27853e42061c7673cb8`
- Result: failed with `latest release is not built from the expected repaired commit`.
- Observed release/tag/manifest commit: `dc3d4d68ab203e646d4b015f71ada614eb5e5b7e`.
- Expected candidate commit: `2779b430b23fcaa32be4b27853e42061c7673cb8`.
- Required remediation: create and publish a release from the candidate (or nominate the tagged source commit as the candidate before verification), then rerun the provenance check against that exact commit.

## Mandatory claims

`.factory/claims.json` exists and contains 12 claims. From a clean `npm ci`, each exact declared command was run through the documented `/demo` entry point where applicable. The two Rust tests initially could not compile in the bare container because `glib-2.0.pc` was absent; after installing the README-listed Tauri prerequisites, both passed. This is an environment prerequisite, not a remaining claim failure.

| Claim | Result | Evidence |
|---|---|---|
| `offline-reload` | PASS | `npm test -- --grep @claim:offline-reload` |
| `csv-export` | PASS | `npm test -- --grep @claim:csv-export` |
| `local-demo` | PASS | `npm test -- --grep @claim:local-demo` |
| `approval-receipt` | PASS | `npm test -- --grep @claim:approval-receipt` |
| `worklog-details-local` | PASS | `npm test -- --grep @claim:worklog-details-local` |
| `no-surveillance` | PASS | `npm test -- --grep @claim:no-surveillance` |
| `calendar-import` | PASS | `npm test -- --grep @claim:calendar-import` |
| `git-metadata` | PASS | `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` |
| `no-repository-upload` | PASS | `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload` |
| `license-unlock` | PASS | `npm test -- --grep @claim:license-unlock` |
| `installer-sha256` | PASS | declared Node test passed |
| `release-provenance` | PASS | declared fixture Node test passed; live candidate provenance fails separately above |

## First-read test

Cold load of `/` plainly says: “Turn activity into an approved worklog,” for freelancers rebuilding billable work from Git and calendars each week. The first action is the visible one-click **Try it with sample data** link, with the immediate outcome explained: a filled weekly worklog opens without writing real data. This satisfies the plain-words and sample-demo gate.

## Local quality gates

- `npm ci` and `npm --prefix api ci`: passed, with no reported vulnerabilities.
- `npm test`: passed (12 Node/script tests and 15 Chromium tests); this includes type checking, `vite build`, claims, accessibility, desktop/mobile workflow, offline reload, and response/console assertions.
- `npm run build`: passed and produced `dist/site`.
- `CI=1 npm run build:desktop`: completed after the documented Linux Tauri packages were installed; produced DEB, RPM, and AppImage bundles.
- Rust claim tests: 2/2 passed after prerequisite installation.
- No lint script is declared in `package.json`.
- Production initial payload: JavaScript 12,853 bytes gzip (main) + 1,010 bytes gzip (core); CSS 4,621 bytes gzip. All are within the stated budgets.

## Live functional, privacy, and API evidence

- Local candidate and live hashed assets are byte-identical: JS SHA-256 `7be04e9b323f7539a401637e0c9c567a5750a7319ce92ef7af37032c30d5eb43`; CSS SHA-256 `dad93fc95407ce3beb1e3cbe2620c04d9e2e10a438bd599725da1bd8e752c6dd`.
- The live end-to-end sample flow worked: landing → demo → CSV (seven lines: header plus six entries) → edited entry → private approval link → empty-name client-side rejection → acceptance → server-attested receipt. The recorded POST body was exactly `packetDigest` plus `approver`; the request log had only `https://worklog-approval-bridge.sociobot.in` during that flow.
- Receipt lookup subsequently returned HTTP 200 with `valid: true`, the same receipt ID, digest, name, timestamp, and attestation. `npm run verify:live` also passed its fresh-link/204/404 regression.
- The live GET allowance was observed as **60 requests per client per minute**: 60 requests returned 204, request 61 returned HTTP 429 with `Retry-After: 60`.
- Response headers: HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, camera/microphone/geolocation denial, and a scoped CSP. Hashed JS is `public, max-age=31536000, immutable`; service worker is `no-cache`.
- 390 × 844 reduced-motion checks across `/`, `/demo`, `/privacy`, `/terms`, `/download`, and `/missing-page`: no horizontal overflow; exactly one `h1` and one `main`; zero Axe serious/critical violations. The first Tab reaches “Skip to main content” with a visible `rgb(255, 241, 154) solid 3px` focus ring. Normal routes had no console/page errors. The intentional real 404 navigation emits Chrome’s expected failed-resource 404 diagnostic only.

## Scope notes

No source code was modified. This verification created two non-production QA acceptance receipts using the name “QA Verifier”; these contain only a digest, name, timestamp, receipt ID, and attestation, as designed.

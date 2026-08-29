# Independent verification 12 — PASS

**Candidate:** `1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3` (`v0.1.13`)

**Live URL:** <https://worklog-approval-bridge.sociobot.in>

**Verified:** 29 August 2026 UTC

## Decision

**PASS.** The exact nominated commit is live and is the source of the verified `v0.1.13` desktop release. All required claim tests pass from this checkout after installing the documented Tauri/Linux prerequisites. No product source was modified during verification.

## Required first checks

### Claim gate — PASS

`.factory/claims.json` exists and contains 15 claims. I ran every listed `test` command, using the fresh demo entry point for each browser claim. The clean container initially lacked `glib-2.0.pc`, so the two Rust commands could not compile. I installed the exact README packages (`file`, WebKitGTK, appindicator, librsvg, `patchelf`, and `rpm`) and reran both exact commands without source changes; both passed.

| Claim | Result | Evidence |
|---|---|---|
| `offline-reload` | PASS | Fresh `/demo` reloads offline with sample data. |
| `csv-export` | PASS | Header and six sample records asserted. |
| `local-demo` | PASS | Isolated demo storage and same-origin traffic asserted. |
| `approval-receipt` | PASS | One-time, durable, attested receipt asserted. |
| `worklog-details-local` | PASS | Body limited to digest and approver. |
| `no-surveillance` | PASS | No capture, keystroke, timer, or third-party request. |
| `calendar-import` | PASS | Selected in-week ICS event only. |
| `git-metadata` | PASS | Temporary local Git repository. |
| `no-repository-upload` | PASS | Loopback remote never connected. |
| `license-unlock` | PASS | Current verdict and one-day cache boundary. |
| `sample-counts` | PASS | Four Git plus two calendar entries. |
| `pro-price` | PASS | $12/month, features, and checkout route. |
| `no-analytics` | PASS | Sample workflow is product-origin only. |
| `installer-sha256` | PASS | Matching fixture installs; mismatch rejects. |
| `release-provenance` | PASS | Full desktop matrix is one immutable commit. |

### Cold first-read gate — PASS

At the live root, the cold first screen plainly says **“Turn activity into an approved worklog”**, identifies freelancers rebuilding billable work from Git and calendars each week, and provides **“Try it with sample data”** with what happens next. One click opens `/demo`; at 390 px it has no horizontal overflow. The demo banner says **“Demo — sample data, nothing is saved”**, with Reset demo and Start for real.

## Exact release and deployment identity — PASS

```text
npm run verify:live -- --expected-commit 1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3
PASS: live checkout, API identity, routing, approval regression checks

npm run verify:release -- --tag v0.1.13 --expected-commit 1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3
PASS: v0.1.13 at 1c21a77…; downloaded DEB SHA-256
d043be33b925771a5387cd9285af243894cf41d9335e1ae80ece130faf95b0d1
```

`/api/health` and the GitHub release verifier identify the nominated commit, resolving the prior deployment-only provenance failure.

## Functional, privacy, and backend evidence

- `npm test` passed: 21 Node/script tests and 29 Chromium tests, covering invalid-rate recovery, formula-safe CSV, keyboard dialog behavior, mobile controls, offline reload, every claim, and Axe.
- Live `verify:live` edited a demo entry, copied and opened a private approval link, confirmed the initial receipt lookup, acceptance control, no browser errors, and 404 behavior.
- A fresh live `POST /api/approvals` returned HTTP 201 with a server-attested receipt. The payload is only `{packetDigest, approver}`.
- Cold-live request capture contained only the product origin for landing assets. The complete local demo flow claim permits only same-origin worklog traffic.
- Live receipt throttling was exercised: after the documented 12 writes from one client/window, the next request returned HTTP 429 with `Retry-After: 60`. The suite separately passes the 60-read/minute and 12-write/minute boundary tests. There is no sign-in, so Entra is not applicable.

## Accessibility, browser quality, headers, and performance

- `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, 818 ms, no console/page errors, title, `lang=en`, one `h1`, `main`, no missing image alt text, and no unlabeled buttons.
- Fresh live Playwright Axe on `/demo` found zero serious/critical violations. The full local suite runs it on landing, demo, privacy, terms, download, 404, and approval pages with the same result.
- Standalone `@axe-core/cli` could not launch without a system Chrome binary in this container; this is environmental. The repo's pinned Playwright Axe integration passed.
- Root and assets carry CSP with response-header `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, permissions denial, and suitable caching. HTML is `max-age=30`, hashed JS one-year immutable, service worker `no-cache`, and health `no-store`.
- Local output: JS 14,892 bytes gzip total; CSS 4,769 bytes gzip; 768 px hero 41,054 bytes; 1280 px hero 96,692 bytes.

## Local install, tests, and build

```text
npm ci                                      PASS; 0 vulnerabilities
npm --prefix api ci                         PASS; 0 vulnerabilities
npm test                                    PASS; 21 Node/script + 29 Chromium
cargo test ... claim_git_metadata           PASS
cargo test ... claim_no_repository_upload   PASS
npm run build                               PASS; dist/site
CI=1 npm run build:desktop                  PASS; DEB, RPM, AppImage
git diff --check                            PASS
```

Linux build output: `Worklog Bridge_0.1.13_amd64.deb` (1,674,894 bytes), `Worklog Bridge-0.1.13-1.x86_64.rpm` (1,676,446 bytes), and `Worklog Bridge_0.1.13_amd64.AppImage` (76,462,584 bytes).

## Defects

No release-blocking or low-severity product defect found. The initially missing Linux Tauri libraries and missing standalone Axe Chrome binary were verifier-image prerequisites, not product defects; documented dependencies and the pinned Playwright path passed.

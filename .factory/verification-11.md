# Independent verification 11 — FAIL

**Candidate:** `6bb3669a456dec38d89faf3b7354e5ba07f743ac`

**Live URL:** <https://worklog-approval-bridge.sociobot.in>

**Verified:** 29 August 2026 UTC

## Decision

**FAIL — the live service and published desktop release do not identify the nominated candidate.** The deployed product is functional, but its immutable build identity and every `v0.1.11` desktop artifact point to predecessor `f0e8f881e89886ef2d7a7298a680925b1170f6a1`. Exact-candidate provenance is a release requirement.

Repository history shows that candidate `6bb3669…` adds only the repair-11 handoff to `f0e8f881…`; it is nevertheless the nominated candidate and has neither a matching deployment identity nor a release tag.

## Required first checks

### Claim gate — PASS after documented prerequisites

`.factory/claims.json` exists with 15 entries. I ran every listed command from the clean candidate checkout. `npm ci` completed with zero vulnerabilities. The two Rust commands initially stopped before test execution because the base worker lacked `glib-2.0.pc`. After installing the Tauri/Linux packages explicitly documented in the README (`file`, WebKitGTK, appindicator, librsvg, `patchelf`, and `rpm`), both exact commands passed without source changes.

| Claim | Result | Observable evidence |
|---|---|---|
| `offline-reload` | PASS | Fresh demo reloaded offline with the six entries and offline notice. |
| `csv-export` | PASS | CSV header plus six sample records. |
| `local-demo` | PASS | Isolated demo storage and same-origin worklog flow. |
| `approval-receipt` | PASS | One durable receipt survived reload and downloaded with attestation. |
| `worklog-details-local` | PASS | Acceptance body contained only `packetDigest` and `approver`. |
| `no-surveillance` | PASS | No capture API or timer activity. |
| `calendar-import` | PASS | Only an in-week ICS event was selectable and imported. |
| `git-metadata` | PASS | Temporary repository yielded hash, date, and subject for the selected week. |
| `no-repository-upload` | PASS | Repository with a loopback remote caused no remote connection. |
| `license-unlock` | PASS | Valid/current verdict and 24-hour cache boundaries enforced. |
| `sample-counts` | PASS | Four Git plus two calendar sample entries. |
| `pro-price` | PASS | `$12 / user / month`, features, and Sociobot route matched. |
| `no-analytics` | PASS | Sample flow contacted only the product origin. |
| `installer-sha256` | PASS | Matching fixture installed; mismatched fixture was rejected. |
| `release-provenance` | PASS at fixture level | Matrix fixture required all platforms and one immutable commit. |

### Cold first-read gate — PASS

At 1440 × 900 and 390 × 844, the first live screen answers all three questions in plain words:

- What: **“Turn activity into an approved worklog.”**
- For whom: **“For freelancers who rebuild billable work from Git and calendars each week.”**
- First click: **“Try it with sample data,”** followed by “A filled weekly worklog opens next. Nothing is saved to your real data.”

One click opened `/demo` with six realistic Northstar Health entries. The persistent banner says **“Demo — sample data, nothing is saved”** and provides **Reset demo** and **Start for real**.

## Release-blocking defect

### Critical — deployed and downloadable product is not candidate `6bb3669…`

Fresh `GET /api/health` returned HTTP 200 with `Cache-Control: no-store` and:

```json
{"status":"ok","build":{"service":"worklog-approval-bridge-receipts","version":"0.1.11","commit":"f0e8f881e89886ef2d7a7298a680925b1170f6a1"}}
```

The required check failed:

```text
npm run verify:live -- --expected-commit 6bb3669a456dec38d89faf3b7354e5ba07f743ac
AssertionError: deployed API commit differs from the nominated repair commit
actual:   f0e8f881e89886ef2d7a7298a680925b1170f6a1
expected: 6bb3669a456dec38d89faf3b7354e5ba07f743ac
```

The desktop release has the same mismatch. `v0.1.11` resolves to `f0e8f881…`; `/download` visibly says **“Built from source f0e8f88.”**

```text
npm run verify:release -- --tag v0.1.11 --expected-commit 6bb3669a456dec38d89faf3b7354e5ba07f743ac
AssertionError: latest release is not built from the expected repaired commit
actual:   f0e8f881e89886ef2d7a7298a680925b1170f6a1
expected: 6bb3669a456dec38d89faf3b7354e5ba07f743ac
```

For comparison, both verifiers pass when explicitly given predecessor `f0e8f881…`. Release verification downloaded `Worklog.Bridge_0.1.11_amd64.deb` and matched SHA-256 `e24e74beedd3e584c70fb96822ae62ba7b7a0db25e239652a83b6697373d3889`. The live hashed JavaScript and CSS bytes also match the candidate checkout because the only candidate delta is documentation. That byte equivalence does not supply the required immutable candidate identity.

## Other finding

### Low — sitemap omits the real `/app` route

The live `sitemap.xml` lists `/`, `/demo`, `/privacy`, `/terms`, and `/download`, but not the public empty-workspace route `/app`. This misses the attached site-structure requirement to list every real route. Dynamic private `/approve#…` URLs should remain excluded.

## Functional and resilience evidence

- Live demo started with six entries. A negative hourly rate was rejected with a plain recovery message and restored to `135`.
- Zero minutes failed native validation; the one-minute boundary saved and rendered as `0h 1m`.
- After adding the boundary entry, CSV export contained the header and seven records.
- An empty approval form was invalid. A completed acceptance created receipt `8e9a14aa-35b1-4a8d-8d0b-7d3d226b814a`, survived a new request and reload, disabled repeat acceptance, and returned the same receipt on a duplicate POST with HTTP 409.
- Changing packet content without changing its digest produced **“This worklog was changed”** and instructed the client to request a new link.
- A non-Monday date and negative rate both restored the previous valid values. Malformed ICS produced a useful error; a valid recovery file excluded an out-of-week event; selecting no events produced a corrective message; selecting one then succeeded.
- The empty real workspace, browser Git-unavailable message, 404 route, back/route behavior, and installer publishing fallback are implemented. Git collection itself passed the temporary-repository Rust test.

## Privacy, backend, and request limits

- The cold landing and complete demo/review/link flow sent worklog traffic only to `https://worklog-approval-bridge.sociobot.in`; no analytics, ads, remote fonts, or third-party scripts appeared.
- The observed acceptance request body was exactly `{"packetDigest":"026b…0809","approver":"Independent QA"}`. It contained no client name, summary, detail, rate, date, or repository content.
- A fresh process retrieved the same durable receipt. A duplicate acceptance with another name returned HTTP 409 and preserved the original name, timestamp, ID, and attestation.
- Approval endpoint, controlled within one fixed window: 61 concurrent reads produced 60 × HTTP 204 and 1 × HTTP 429 with `Retry-After: 60`. Thirteen concurrent invalid writes produced 12 × HTTP 400 and 1 × HTTP 429 with `Retry-After: 60`. Observed allowances: **60 reads/minute and 12 writes/minute per client**.
- Sociobot product verification: 31 concurrent invalid-token checks produced 30 × HTTP 200 and 1 × HTTP 429 with `Retry-After: 4`. Observed burst allowance: **30 requests before throttling**.
- The product does not require sign-in, so the Entra External ID requirement is not applicable.

## Accessibility, mobile, offline, and browser quality

- Playwright Axe scans found zero serious or critical violations on `/`, `/demo`, `/privacy`, `/terms`, `/download`, the real approval-fragment route, and the designed 404.
- `/opt/fleet/lib/verify-url.sh` passed against both the local production preview and live root: title, `lang=en`, one `h1`, one `main`, alt text, labels, and no load errors.
- Keyboard: first Tab revealed the skip link at `(8, 8)` with a 3 px focus outline; `/` focused filtering; `n` opened the entry dialog; focus stayed trapped; Escape closed it and restored **Add entry**.
- Reduced-motion media matched, exposed no active animations, disabled smooth scrolling, and reduced transitions to `0.01 ms`.
- At 390 × 844 the headline, audience sentence, and sample action all fit in the first viewport. Home and demo had no horizontal overflow, and no visible link/button measured below 44 px.
- Live service-worker update and offline reload passed. The cache was versioned as `worklog-bridge-256e951978b7`; the demo entries and offline notice remained available.
- Successful routes produced no console or page errors. The only observed 404 console message came from deliberately loading the designed missing-page route.

## Headers, caching, and performance

- Root headers include HSTS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation denial, and a restrictive CSP with response-header `frame-ancestors 'none'`.
- HTML uses `public, must-revalidate, max-age=30`; hashed JS/CSS and hero images use one-year immutable caching; `service-worker.js` uses `no-cache`; API/health responses use `no-store`.
- Initial JS: **14.89 KB gzip** total (`13.86 + 1.03 KB`); CSS: **4.77 KB gzip**; mobile hero WebP: **41.05 KB**; desktop hero: **96.69 KB**.
- Lighthouse mobile retry completed at Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, total transfer 61 KiB. INP is not measured by a navigation-only lab run.

## Local install, test, and build evidence

```text
npm ci                                      PASS; 0 vulnerabilities
npm --prefix api ci                         PASS; 0 vulnerabilities
npm test                                    PASS; 18 Node/script + 29 Chromium
cargo test --manifest-path src-tauri/Cargo.toml
                                              PASS; 2 Rust tests
npm run build                               PASS; writes dist/site
CI=1 npm run build:desktop                  PASS; DEB, RPM, AppImage
verify-url.sh local and live                PASS
git diff --check                            PASS before report edits
```

No standalone lint script exists; `tsc --noEmit` is part of the passing production build. Linux output was:

- `Worklog Bridge_0.1.11_amd64.deb` — 1,674,756 bytes
- `Worklog Bridge-0.1.11-1.x86_64.rpm` — 1,676,331 bytes
- `Worklog Bridge_0.1.11_amd64.AppImage` — 76,462,584 bytes

The live `install.sh` was exercised with an isolated `XDG_BIN_HOME`; it downloaded, checksum-verified, and installed the published x86-64 AppImage as an executable. Published macOS arm64/x64, Windows, Linux AppImage, and Linux DEB coverage passed the release verifier, but all belong to `f0e8f881…`, not this candidate.

## Required next step

Publish and deploy the exact nominated candidate (or nominate the already deployed `f0e8f881…` source rather than its later documentation commit). Require `/api/health`, the release tag, `target_commitish`, `latest.json`, every artifact provenance record, and the download page to identify one exact candidate SHA. Add `/app` to `sitemap.xml`, then rerun independent verification.

No product source code was modified during verification.

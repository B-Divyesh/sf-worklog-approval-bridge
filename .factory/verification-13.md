# Verification 13 — FAIL

**Date:** 29 August 2026  
**Candidate:** `183842c6d6ca3ad9cabdc1df1a4d275db09ccaec`  
**Live URL:** `https://worklog-approval-bridge.sociobot.in`  
**Verdict:** **FAIL**

## Release-blocking finding

### Critical — the deployed product and published desktop release are not this candidate

Fresh production evidence identifies the deployed receipt service as:

```json
{
  "status": "ok",
  "build": {
    "service": "worklog-approval-bridge-receipts",
    "version": "0.1.13",
    "commit": "1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3"
  }
}
```

That is not `183842c6d6ca3ad9cabdc1df1a4d275db09ccaec`. The production shell also serves the predecessor asset `index-D7yQGHDD.js`, and the latest GitHub Release is `v0.1.13` with `target_commitish` `1c21a77…`. `183842c…` has no tag pointing at it.

Both candidate-bound checks fail exactly as they should:

```text
npm run verify:live -- --expected-commit 183842c6d6ca3ad9cabdc1df1a4d275db09ccaec
AssertionError: deployed API commit differs from the nominated repair commit
actual:   1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3
expected: 183842c6d6ca3ad9cabdc1df1a4d275db09ccaec

npm run verify:release -- --tag v0.1.13 --expected-commit 183842c6d6ca3ad9cabdc1df1a4d275db09ccaec
AssertionError: latest release is not built from the expected repaired commit
actual:   1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3
expected: 183842c6d6ca3ad9cabdc1df1a4d275db09ccaec
```

The requested live/candidate match and a candidate desktop release therefore do not exist. Do not release this candidate until it is tagged, deployed, and both commands pass with its immutable commit.

### High — signing/release prerequisites added by the candidate are not documented truthfully

The candidate release workflow now hard-fails macOS jobs unless all of `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID` are set; Windows also requires `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`.

The current handoff says the packages are intentionally unsigned and names only `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`. It neither lists the other mandatory secrets nor explains that a release cannot run without them. This conflicts with the candidate workflow and the required operator handoff. Document the exact secrets and whether unsigned fallback is supported before attempting a candidate release.

## Required first-read result

Cold production load at 1440×900 passed the clarity gate (for the currently deployed predecessor):

- It says it turns Git and calendar activity into an approved/client-ready worklog.
- It says it is for freelancers rebuilding billable work each week.
- The first action is the one-click **Try it with sample data** link, with the adjacent explanation that a filled weekly worklog opens and real data is untouched.

The cold page made only same-origin document, JS, CSS, and image requests and logged no console or page errors. This does not cure the critical provenance mismatch above.

## Clean-checkout claims and local quality gates

Started from the clean detached candidate checkout, ran `npm ci` (0 vulnerabilities), then every command in `.factory/claims.json` against the product demo entry point. The two Rust commands initially reported missing `glib-2.0` development files; this is the README-documented Tauri prerequisite. After the documented Ubuntu/Debian package command, both exact Rust claim commands passed.

All 20 registered claims passed:

- Browser/demo claims: `offline-reload`, `csv-export`, `local-demo`, `desktop-sample-project`, `entry-review`, `free-editor`, `approval-receipt`, `worklog-details-local`, `no-surveillance`, `calendar-import`, `license-unlock`, `sample-counts`, `pro-price`, `no-analytics`, and `release-discovery`.
- Rust local-only claims: `git-metadata` and `no-repository-upload`.
- Node claims: `public-health-fields`, `installer-sha256`, and `release-provenance`.

Additional clean candidate checks:

```text
npm test                                      PASS — 21 Node/script + 32 Chromium tests
npm run build                                 PASS — dist/site/
CI=1 npm run build:desktop                    PASS — Linux DEB, RPM, AppImage
cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata
                                               PASS
cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload
                                               PASS
```

The built web budget is 13.77 KB gzip main JavaScript plus 1.01 KB gzip core JavaScript, and 4.79 KB gzip CSS. The local desktop build produced `Worklog Bridge_0.1.13_amd64.deb`, `Worklog Bridge-0.1.13-1.x86_64.rpm`, and `Worklog Bridge_0.1.13_amd64.AppImage`.

## Product exercise and browser QA

The full Chromium suite covered sample loading, edit/time/ready/remove/export/reload recovery, free workspace entry/export, negative-rate recovery, ICS week filtering, approval receipt single acceptance, offline reload, invalid/expired/revoked/offline license states, keyboard shortcuts, dialog focus trap/Escape restoration, 390 px layout, 44 px controls, and reduced-motion keyboard scrolling. It passed.

Fresh live checks on the current deployment found:

- `/`, `/demo`, `/app`, `/privacy`, `/terms`, and `/download` return 200 without console/page errors; an unknown route returns the intended 404 page.
- `verify-url.sh` passed: title, `lang=en`, one `h1`, `main`, image alt coverage, and no load errors.
- Axe on `/`, `/demo`, `/app`, `/privacy`, `/terms`, and `/download` found zero serious/critical violations. (Axe was injected in a `bypassCSP` test context; no CSP was weakened in production.)
- At 390 px, the landing and demo had no horizontal overflow, the first-screen demo action was present, six sample entries loaded, and reduced motion reported `scroll-behavior: auto`.
- The demo flow made no cross-origin request and no console/page error. The only captured requests were the product document and same-origin static assets.
- Production response headers include CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, camera/microphone/geolocation disabled, and HSTS. Hashed JS/CSS are `max-age=31536000, immutable`; the service worker is `no-cache`.
- The anonymous approval-read allowance is enforced at **60 GET requests per client per minute**: requests 1, 59, and 60 returned 204; request 61 returned `429`, `Retry-After: 60`, and `{"error":"Too many approval requests. Try again in one minute."}`.

## Evidence locations

Temporary reproducible logs and screenshots are outside the repository at `/tmp/worklog-qa/`, including `npm-test-full.log`, `npm-build.log`, `desktop-build.log`, `verify-live-candidate.log`, `verify-release-candidate.log`, response headers, and cold/mobile screenshots.

## Required next steps

1. Correct the release/operator documentation for all mandatory signing secrets, or restore an explicit unsigned release path.
2. Create an immutable tag and complete the all-platform release from `183842c…`.
3. Deploy that same commit and rerun both candidate-bound verification commands until they pass.

# Verification 10 — FAIL

**Candidate:** `170cfd8be5590896b01bd8f86004844d0c8905ac`
**Live URL:** <https://worklog-approval-bridge.sociobot.in>
**Verified:** 29 August 2026 UTC

## Decision

**FAIL — the deployed product and published desktop release do not match the nominated candidate commit.** This is a release-blocking provenance failure even though the currently deployed predecessor is functional and the candidate's local test/build gates pass.

## Required first checks

### Claim gate — PASS after documented desktop prerequisites

`.factory/claims.json` exists with 15 entries. From the clean checkout I ran `npm ci` and every declared claim test using the shipped `/demo` Playwright entry point where applicable. The two Rust commands initially stopped before test execution because this disposable Linux image lacked `glib-2.0.pc`; this is the documented Tauri system prerequisite, not a failed assertion. After installing the normal Tauri/Linux packages specified by the README (`libglib2.0-dev`, WebKitGTK, appindicator, librsvg, `file`, `patchelf`, and `rpm`), both exact Rust commands passed.

| Claim | Result |
|---|---|
| `offline-reload`, `csv-export`, `local-demo`, `approval-receipt` | PASS |
| `worklog-details-local`, `no-surveillance`, `calendar-import` | PASS |
| `git-metadata`, `no-repository-upload` | PASS |
| `license-unlock`, `sample-counts`, `pro-price`, `no-analytics` | PASS |
| `installer-sha256`, `release-provenance` | PASS (fixture-level claims) |

The complete `npm test` run also passed: 17 Node/script tests and 28 Chromium tests, including all browser claim tags, offline reload, privacy request capture, keyboard/focus handling, mobile controls, and serious/critical Axe scans.

### Cold first-read gate — PASS

A clean live load at desktop and 390 × 844 says what the product does, for whom, and what to do first in its first screen:

- **What:** “Turn activity into an approved worklog.”
- **For whom:** “For freelancers who rebuild billable work from Git and calendars each week.”
- **First action:** **Try it with sample data**, with the adjacent outcome “A filled weekly worklog opens next. Nothing is saved to your real data.”

The one-click action opened a realistic six-entry Northstar Health worklog and displayed the persistent **Demo — sample data, nothing is saved** banner with Reset demo and Start for real.

## Release-blocking defects

### Critical — live deployment is not candidate `170cfd8…`

Fresh `GET /api/health` returned HTTP 200 with:

```json
{"status":"ok","build":{"service":"worklog-approval-bridge-receipts","version":"0.1.9","commit":"44694c0b6dc7ba9728c4d5dd219aa5a155104aeb"}}
```

The expected candidate is `170cfd8be5590896b01bd8f86004844d0c8905ac`. `npm run verify:live -- --expected-commit 170cfd8…` failed with `deployed API commit differs from the nominated repair commit`. The repository history confirms this deployment is the `v0.1.9` predecessor; candidate `170cfd8` is later and changes `.factory/handoff.md` only. The candidate still has not been deployed under its own immutable identity.

### High — published desktop artifacts are tied to the predecessor, not the candidate

`npm run verify:release -- --tag v0.1.9 --expected-commit 170cfd8…` failed because release tag `v0.1.9` resolves to `44694c0b6dc7ba9728c4d5dd219aa5a155104aeb`.

For comparison, verification using that old commit passed and downloaded `Worklog.Bridge_0.1.9_amd64.deb`, confirming SHA-256 `1c5b23137ac38fff8e19cf5200e096bc769030662d057e5e70976bb889dd86c6`. This proves the release is internally consistent, but it is not the requested candidate artifact.

## Functional evidence (current live predecessor)

- `npm run build` passed; deploy output is `dist/site/`. Initial JavaScript is 44,959 bytes uncompressed (14,980 bytes gzip across the two JS chunks), within budget.
- Live end-to-end `npm run verify:live` passed: hosted checkout redirect, API health, demo-generated approval link, receipt lookup, and genuine HTTP 404 route.
- A fresh live demo request log through CSV export and approval-link creation contained only `https://worklog-approval-bridge.sociobot.in`; no console/page errors occurred.
- Live mobile 390 × 844 and desktop first screens had no horizontal overflow. The local test suite verifies keyboard-only controls, visible focus, skip link, dialog Escape/focus restoration, 44 px controls, and no Axe serious/critical issues; its live equivalent had no console errors.
- PWA: live `/service-worker.js` is `no-cache`, the active controller is scope `/`, cache `worklog-bridge-a10da0a6e428` is versioned, `registration.update()` succeeded, and `/demo` reloaded offline with sample content visible.
- Headers: HTTPS, HSTS, `nosniff`, strict referrer policy, restrictive CSP with response-header `frame-ancestors 'none'`, and immutable one-year cache headers on hashed JS/CSS. No third-party fonts/scripts load.
- Privacy and allowance: 65 sequential anonymous `GET /api/approvals` requests from one client produced 60 × `204`, then request 61 through 65 × `429` with `Retry-After: 60` seconds.

## Required next step

Deploy and tag/release the exact candidate `170cfd8be5590896b01bd8f86004844d0c8905ac` (or nominate a new build commit), set `WORKLOG_BUILD_COMMIT` to that SHA, then rerun the live and release provenance checks. Do not relabel the existing `v0.1.9` artifacts as this candidate.

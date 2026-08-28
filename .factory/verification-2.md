# Independent verification 2 — FAIL

**Candidate:** `0fc5cc62213ce7ded7010def5b025d7b0a8321ab`
**Live target:** https://worklog-approval-bridge.sociobot.in
**Verified:** 2026-08-28
**Decision:** **FAIL — do not release.**

## First read

Cold-loaded the live home page in a fresh Chromium context. It plainly says it
turns Git/calendar activity into an approved worklog, says it is for
freelancers rebuilding billable work, and tells the visitor to click **Try it
with sample data**. Its adjacent copy says that a filled weekly worklog opens
next and does not save to real data. This gate passes. The cold request log was
only same-origin document, JS, CSS, and hero-image requests; no console or
page errors occurred.

## Required claims gate

`.factory/claims.json` is present. From this clean checkout I ran every exact
listed command via the shipped demo entry point. The two Rust commands required
the normal Linux Tauri GTK/GLib/WebKit development prerequisites; after those
were installed, no source was changed and both passed.

| Claim | Command/result |
| --- | --- |
| offline-reload | `npm test -- --grep @claim:offline-reload` — PASS |
| csv-export | `npm test -- --grep @claim:csv-export` — PASS (header plus six records) |
| local-demo | `npm test -- --grep @claim:local-demo` — PASS |
| approval-receipt | `npm test -- --grep @claim:approval-receipt` — PASS (mocked receipt service) |
| worklog-details-local | `npm test -- --grep @claim:worklog-details-local` — PASS |
| no-surveillance | `npm test -- --grep @claim:no-surveillance` — PASS |
| calendar-import | `npm test -- --grep @claim:calendar-import` — PASS |
| git-metadata | `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` — PASS |
| no-repository-upload | `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload` — PASS |
| license-unlock | `npm test -- --grep @claim:license-unlock` — PASS |

`npm test` completed its Node regressions, TypeScript production build, and
12 Playwright tests. `cargo test --manifest-path src-tauri/Cargo.toml` passed
2 tests. There is no standalone lint script; `tsc --noEmit` is part of the
production build.

## Release blockers

### Critical — the required desktop release does not exist

The artifact class is `desktop-app`. Fresh GitHub API evidence at
`/repos/B-Divyesh/sf-worklog-approval-bridge/releases/latest` returned HTTP
404 (`"Not Found"`); the repository has tag `v0.1.0` but no release or assets.
Therefore there are no macOS, Windows, or Linux binaries, no `SHA256SUMS`, and
no `latest.json` to install or checksum. The live Download route cannot offer a
real platform asset. This violates the desktop release contract.

### Critical — the exact Linux production desktop build exits 1

From the clean checkout, after native Tauri dependencies were installed:

```sh
CI=1 npm run build:desktop
```

exited **1**. It built the application and emitted DEB and RPM bundles, then
failed at:

```text
Bundling Worklog Bridge_0.1.0_amd64.AppImage
failed to bundle project: `failed to run linuxdeploy`
```

No final `.AppImage` was produced. This independently reproduces a
deployment/build failure; the `CI=1` normalization repair did not make the
complete production build pass.

### High — documented API allowance is not enforced in the live deployment

The receipt endpoint documents 60 reads/minute (12 writes/minute) and its
source promises `429` plus `Retry-After: 60`. I issued 61 sequential GETs from
this single client in 18.7 seconds to:

```text
GET /api/approvals?packetDigest=not-a-digest
```

All **61** returned `400`; none returned `429` and none had `Retry-After`.
This is a live failure of the required documented request allowance. The
in-memory `Map` limiter is not a reliable limiter in the deployed serverless
environment (requests can reach separate workers). An unauthenticated receipt
API can consequently be called beyond its advertised bound.

## Functional, privacy, and deployment evidence

- Live receipt persistence itself works: a fresh digest POST returned `201`,
  its GET returned the same receipt with `valid: true`, and a second POST
  returned `409` with the unchanged receipt ID/timestamp/attestation.
- The live app's JS and CSS are byte-identical to the candidate's fresh
  `dist/site` build: JS SHA-256
  `36c455707c528ea37acb7c8bcd02d42380b82513d294bdaf8aac130ecc908f42`;
  CSS SHA-256
  `6717fd90ba0adaa23069f592db278d12d78488cbde4faeda70def33d3c94f959`.
- Response headers include CSP with same-origin default sources, HSTS,
  `X-Content-Type-Options: nosniff`, strict referrer policy, and a permissions
  policy denying camera and microphone. Hashed JS/CSS are immutable for one
  year; service worker is `no-cache`.
- The receipt POST body used only `packetDigest` and `approver`; no worklog
  content was sent. The all-demo claim test also passed its outgoing-origin
  assertion. No third-party font/script request was seen.
- The standalone `/opt/fleet/lib/verify-url.sh` check passed locally:
  HTTP 200, title/lang, one `h1`, `<main>`, no missing image alt text, no
  unlabeled buttons, and no console/page errors. Playwright's axe integration
  in the full test suite passed serious/critical checks for `/`, `/demo`,
  `/privacy`, `/terms`, `/download`, and a missing route. Local manual checks
  found skip-link first focus with a solid focus outline, `/` focusing filter,
  no 390px horizontal overflow, and reduced-motion transition duration
  `0.00001s`.
- Initial shipped JavaScript is 12.67 KB gzip and CSS 4.61 KB gzip, within the
  static budget. The 1280px hero is 96,692 bytes. No Lighthouse rerun was
  needed to establish the release blockers.

## Required repair before another verification

1. Replace the process-local receipt rate limiter with durable/shared
   per-client limiting. Verify a 61st read from one real client gets `429` and
   `Retry-After` (and likewise enforce the documented write allowance).
2. Make `CI=1 npm run build:desktop` complete including an AppImage; retain
   the produced artifact as build evidence.
3. Tag/publish a GitHub Release at the candidate commit with macOS (arm64 and
   x86_64), Windows, and Linux assets, `SHA256SUMS`, and valid `latest.json`.
   Verify a downloaded asset's checksum and that the live detected-platform
   link resolves.

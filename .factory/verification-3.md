# Independent verification 3 — FAIL

**Candidate:** `a29334e51fdfa70ac4f2b480e025640101bfa6cd`  
**Live target:** https://worklog-approval-bridge.sociobot.in  
**Verified:** 2026-08-28  
**Decision:** **FAIL — do not release until the console-error quality gate is repaired.**

## First read

Cold-loaded the live home page in a fresh Chromium context. The first screen
says **“Turn activity into an approved worklog”**, says it is **“For
freelancers who rebuild billable work from Git and calendars each week”**, and
offers **“Try it with sample data”**. Its adjacent explanation says that a
filled weekly worklog opens and nothing is saved to real data. This plainly
answers what it does, who it is for, and what to click first. The required
one-click demo gate passes.

## Required claim gate — PASS

`.factory/claims.json` exists. From the clean checkout at the candidate, after
`npm ci`, I ran every exact command listed in it. All passed through the
shipped demo or the stated local collector sandbox.

| Claim | Exact test | Result |
| --- | --- | --- |
| offline-reload | `npm test -- --grep @claim:offline-reload` | PASS |
| csv-export | `npm test -- --grep @claim:csv-export` | PASS — header plus six records |
| local-demo | `npm test -- --grep @claim:local-demo` | PASS |
| approval-receipt | `npm test -- --grep @claim:approval-receipt` | PASS |
| worklog-details-local | `npm test -- --grep @claim:worklog-details-local` | PASS |
| no-surveillance | `npm test -- --grep @claim:no-surveillance` | PASS |
| calendar-import | `npm test -- --grep @claim:calendar-import` | PASS |
| git-metadata | `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` | PASS |
| no-repository-upload | `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload` | PASS |
| license-unlock | `npm test -- --grep @claim:license-unlock` | PASS |

The complete quality suites also passed: `npm test` (7 Node regressions, the
production TypeScript/site build, and 12 Playwright checks) and
`cargo test --manifest-path src-tauri/Cargo.toml` (2 Rust tests). There is no
separate lint script; `tsc --noEmit` runs as part of the production build.

## Release-blocking defect

### High — a normal first approval-link visit logs a browser console error

A newly created approval link is normally not accepted yet. On cold loading
such a link, the app asks the receipt API whether a receipt exists. The API
correctly returns `404` for no receipt, and the UI correctly then allows the
client to accept. However Chromium emits this console error on that normal
first load:

```text
Failed to load resource: the server responded with a status of 404 ()
```

This violates the product’s required “no console errors on load” quality gate.
The current Playwright console-route test does not open a newly generated
approval URL, so it does not cover this customer path. The product must avoid
the browser error while preserving the expected unaccepted state (for example,
by making the receipt lookup use a non-error response for an absent receipt,
or by otherwise changing the protocol and its tests).

## Additional defect

### Medium — the not-found route has a 200 HTTP response

The UI renders its designed not-found screen for `/missing-page`, but a fresh
live `curl` received HTTP `200`, not `404`. `staticwebapp.config.json` has a
`responseOverrides.404` entry, but `navigationFallback` currently serves the
SPA first. This is not a real HTTP 404 and does not meet the site-structure
contract for an explicit 404 route.

## Functional, privacy, accessibility, and deployment evidence

- Full live flow: malformed ICS input reports “No calendar events were found
  in that file. Choose another ICS file.”; zero minutes is rejected by the
  labelled field; a 1,440-minute entry saves; an approval link is created;
  acceptance returns a server receipt; reload displays the same receipt and
  disables **Accept and record receipt**. Receipt `675922d8-2cc1-4413-847a-68e24fc3edb7`
  was observed as durable in this run.
- The observed acceptance POST body was exactly
  `{"packetDigest":"<64 hex chars>","approver":"Independent QA"}`. The demo
  flow requested only `https://worklog-approval-bridge.sociobot.in`; it made
  no third-party data requests. The demo namespace did not alter a seeded
  real-workspace sentinel.
- Live headers include a same-origin CSP with explicit GitHub/Sociobot
  connections, HSTS, `X-Content-Type-Options: nosniff`, a strict referrer
  policy, and a permissions policy denying camera and microphone. Hashed
  assets are `max-age=31536000, immutable`; the service worker is `no-cache`.
- A single client received 60 invalid receipt reads with `400`, then request
  61 received `429` and `Retry-After: 60`. It received 12 invalid receipt
  writes with `400`, then write 13 received `429` and `Retry-After: 60`.
  The documented allowances are therefore enforced live.
- The candidate’s fresh built JS SHA-256 is
  `36c455707c528ea37acb7c8bcd02d42380b82513d294bdaf8aac130ecc908f42`,
  matching the live JS byte-for-byte. Its CSS SHA-256 is
  `6717fd90ba0adaa23069f592db278d12d78488cbde4faeda70def33d3c94f959`,
  also matching live. The generated service worker also matched live
  byte-for-byte. Its cache name was `worklog-bridge-3db4204d6861`; reinstall
  removed a deliberately seeded old worklog cache, and offline demo reload
  showed saved sample work.
- On live `/`, `/demo`, `/privacy`, `/terms`, `/download`, and the in-app
  missing-page screen, Axe found zero serious or critical violations. At
  390×844, the demo had zero horizontal overflow and its primary approval
  action remained visible. Keyboard Tab first focused the skip link with a
  `rgb(255, 241, 154) solid 3px` outline. Reduced motion resolved transition
  duration to `0.00001s`.
- Live Lighthouse (Chromium) reported Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1206 ms, CLS 0, and TBT 0 ms. Initial
  shipped JS is 12.67 KB gzip and CSS is 4.61 KB gzip.
- `CI=1 npm run build:desktop` completed successfully on Linux and produced
  DEB, RPM, and AppImage bundles. The local AppImage SHA-256 was
  `ffc6c09edab4b8c5400885d8fd8afbd84adaa8a952d6bb040f8675c602f76b48`.
- The live Download route detected Linux without errors and linked to v0.1.3.
  The stable GitHub Release contains macOS x64/arm64, Windows MSI/EXE, Linux
  AppImage/DEB, `SHA256SUMS`, and valid `latest.json`. The downloaded release
  AppImage SHA-256
  `2f0c59c0131267b9d0f0ef36d381d970d1a88dfcc35aa5f517b358c643de2182`
  matches its published sum.

## Required repair and re-verification

1. Remove the expected-unaccepted-receipt `404` console error from a fresh
   approval link and add a Playwright route/console regression that opens this
   exact state.
2. Make unknown URLs return HTTP 404 while keeping the designed in-app
   not-found page and return-home action.
3. Re-run a clean independent verification after deployment.

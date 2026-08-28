# Independent verification — FAIL

**Candidate:** `7ce90bf9e2ff5bde70e5c91583c22165ca470a6e`
**Live target:** https://worklog-approval-bridge.sociobot.in
**Date:** 2026-08-28

## Decision

**FAIL.** The main job is not complete: the brief requires a client approval
link with immutable acceptance. The live product only creates a local,
replayable receipt.

## First read

Cold load plainly answered all required questions. It says it turns Git and
calendar activity into an approved worklog, is for freelancers rebuilding
billable work, and the first click is **Try it with sample data**. That link
opens `/demo` with a real Northstar Health weekly worklog.

## Claim registry (required first test)

`.factory/claims.json` exists. From a clean checkout after `npm ci`, every
listed command passed once the standard Linux Tauri development libraries
were installed:

| Claim | Result | Evidence |
| --- | --- | --- |
| offline-reload | PASS | `npm test -- --grep @claim:offline-reload` |
| csv-export | PASS | Six data rows and required header |
| local-demo | PASS | Demo request log was same-origin only |
| approval-receipt | PASS (narrow claim only) | Client JSON receipt downloads |
| no-surveillance | PASS | No capture APIs requested |
| calendar-import | PASS | In-memory ICS event imported with duration |
| git-metadata | PASS | `cargo test ... claim_git_metadata` against temp repo |
| license-unlock | PASS | Mocked verification and daily cache |

The initial Rust command could not compile before system libraries were
installed (`glib-2.0.pc` absent); it then passed unchanged. This was an
environment prerequisite, not a source change.

## Release blockers

### Critical: acceptance is local, mutable in practice, and non-durable

Fresh live evidence:

1. Opened `/demo`, copied an approval URL, accepted it as `Any Name`.
2. Its network log contained no non-site request.
3. Reloaded the exact approval URL: `#receipt-area` was empty and **Accept
   and create receipt** was enabled again.

The receipt's SHA-256 uses the packet digest, an arbitrary supplied name, and
a browser-generated timestamp. It is not signed by a service and is never
recorded. It detects altered packet bytes, but cannot prove that a particular
client accepted, when they did, or prevent another receipt. This violates the
researched brief's immutable acceptance requirement.

### High: visible claims are not all registered/proved

The landing promise “Worklogs stay on this device,” the assertion that the
product does not “upload a repository,” and “A signed digest proves which
entries the client saw” lack matching observable claim tests. `local-demo`
only assesses demo data and `approval-receipt` only assesses file download.
The claims contract makes this a release blocker.

### Medium: documented desktop build breaks when CI is `1`

Exact `npm run build:desktop` failed with:

```
error: invalid value '1' for '--ci' [possible values: true, false]
```

`CI=true npm run build:desktop` completed and produced DEB/RPM/AppImage.

### Medium: stale PWA cache risk

The active cache is `worklog-bridge-v1`; source hard-codes the same cache key
for future deployments. Offline reload passed, but the cache is not
deployment-versioned, so update cleanup cannot reliably remove old assets.

## Functional and quality evidence

- `npm test`: 11 Playwright tests passed. No separate lint command exists;
  TypeScript `--noEmit` runs in `npm run build`.
- Full Rust suite passed: 1 test passed, 0 failed.
- Live manual flow passed: edit, one-minute boundary, zero-minute validation,
  malformed ICS recovery, link creation, client acceptance, receipt output.
  No console/page error was observed.
- 390×844 demo had no horizontal overflow; keyboard focus begins at skip link;
  reduced motion disables transition movement. Supplied Axe checks report zero
  serious/critical findings across home, demo, privacy, terms, download and
  not-found.
- Live demo request log during the full worklog/review/link flow contained
  only `https://worklog-approval-bridge.sociobot.in`.
- Live headers: CSP, HSTS, `X-Content-Type-Options: nosniff`, strict referrer
  policy, camera/microphone denial, immutable hashed JS, and `no-cache`
  service worker. Sociobot verification rate limit was observed at request 30
  in one run: HTTP 429, `Retry-After: 0`; prior 29 returned 200.
- Lighthouse mobile: Performance 92, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1509 ms, CLS 0, TBT 354 ms. Initial JS is 13.14 KB gzip,
  CSS 4.61 KB gzip, and hero 96.7 KB.
- Local production JS and CSS hashes match live. The `v0.1.0` release has all
  required platform assets and metadata; the downloaded Linux AppImage hash
  matches `SHA256SUMS`.

## Required repair

Store an approval receipt durably and immutably, without uploading the
worklog content: submit only the packet digest plus a server-issued receipt
ID/timestamp/attestation, provide a verification endpoint, and add claim
tests for it. Then either remove or test each privacy/signature claim,
normalise `CI`, version the service-worker cache per deployment, and request
fresh independent verification.

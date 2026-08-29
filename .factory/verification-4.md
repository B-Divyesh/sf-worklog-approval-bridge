# Independent verification 4 — FAIL

**Candidate:** `3663d67c5ce54ad2c1d5e94b8d6903ab4c5a5571`  
**Live target:** https://worklog-approval-bridge.sociobot.in  
**Verified:** 2026-08-29  
**Decision:** **FAIL — do not release.**

## First read

A cold Chromium visit to the live home page plainly says it turns activity into
an approved worklog, says it is for freelancers rebuilding billable work from
Git and calendars, and puts **Try it with sample data** on the first screen.
The adjacent text says a filled weekly worklog opens and real data is not
saved. The one-click demo and first-read gates pass.

## Required claim gate — PASS after documented desktop prerequisites

`.factory/claims.json` is present and declares ten claims. `npm ci` completed
cleanly. The two Rust commands initially could not compile because this clean
container lacked the documented Tauri Linux packages (`glib-2.0.pc`); after
installing the README's listed packages, every exact claim command passed.

| Claim | Result |
| --- | --- |
| `offline-reload` | PASS |
| `csv-export` | PASS — header and six records |
| `local-demo` | PASS |
| `approval-receipt` | PASS |
| `worklog-details-local` | PASS |
| `no-surveillance` | PASS |
| `calendar-import` | PASS |
| `git-metadata` | PASS |
| `no-repository-upload` | PASS |
| `license-unlock` | PASS |

`npm test` passed all 9 Node regressions and all 13 Playwright tests. The full
Rust suite passed (2 tests). `npm run build` passed, producing `dist/site`;
`CI=1 npm run build:desktop` produced Linux DEB, RPM, and AppImage bundles.
There is no separate lint script; `tsc --noEmit` runs in the production build.

## Release-blocking defects

### High — mobile Download page has serious keyboard accessibility failures

Fresh live Axe 4.10 testing at 390×844 with reduced motion reports the serious
`scrollable-region-focusable` violation on both installer commands:

```html
<div class="code-line">curl -fsSL https://worklog-approval-bridge.sociobot.in/install.sh | sh</div>
<div class="code-line">irm https://worklog-approval-bridge.sociobot.in/install.ps1 | iex</div>
```

At that width they horizontally scroll, but neither has focusable content nor
is itself focusable, so keyboard users cannot reach the clipped command text.
This violates the mandatory serious/critical Axe gate and WCAG 2.1.1/2.1.3.

### Medium — the real 404 route emits a browser console error

`/missing-page` correctly returns HTTP 404 and shows the designed return-home
page, but a fresh Chromium load logs:

```text
Failed to load resource: the server responded with a status of 404 ()
```

All real routes (`/`, `/demo`, `/privacy`, `/terms`, `/download`) load without
console or page errors. The explicit no-console-errors-on-load quality gate is
nevertheless not met for the product's real 404 route.

### Medium — published installer checksum assertion is not a registered claim

The Download page states, “Each installer checks the downloaded file against
the published SHA-256 checksum.” Neither that promise nor a matching observable
installer test appears in `.factory/claims.json`; the same statement is in the
README. The claims contract requires every visitor-reliant claim to have a
listed sandbox test, so add a claim/test (including a mismatched checksum
rejection) or remove this assertion.

## Functional and deployment evidence

- Live demo used only `demo:worklog-bridge:project`. Its persistent banner
  offered Reset demo and Start for real. During edit, invalid ICS recovery,
  link creation, and acceptance, all requests stayed same-origin. The sole
  acceptance POST body was exactly `packetDigest` plus `approver`; no worklog
  text was sent.
- Invalid ICS reports a useful recovery message. A 0-minute manual entry is
  rejected (`min=1`); the 1,440-minute maximum saves. Empty approver input is
  rejected by the labelled required field.
- A fresh real approval URL returned a successful empty receipt lookup (204),
  then acceptance returned 201 with a server attestation and durable receipt;
  no console errors occurred in that normal approval flow.
- The live write allowance is 12 requests/client/minute: twelve invalid POSTs
  returned 400, and request 13 returned `429` with `Retry-After: 60`.
- The demo service worker controlled the page and an offline reload retained
  the sample worklog and displayed its offline notice. Hashed JS is 12.67 KB
  gzip and CSS is 4.61 KB gzip. Hashed assets use one-year immutable caching;
  the service worker uses `no-cache`.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, a CSP
  matching the GitHub and Sociobot connections, and a permissions policy
  denying camera and microphone. `/opt/fleet/lib/verify-url.sh` passed on `/`.
- The release route detected Linux without errors. The v0.1.3 release has
  macOS x64/arm64, Windows MSI/EXE, Linux AppImage/DEB, `SHA256SUMS`, and valid
  `latest.json`. The downloaded DEB SHA-256 was
  `8c0b16a47dfc04f391947cab109c20e9b167101c1e5e52eab88a0423cbdb44ff`,
  matching `SHA256SUMS`.
- Freshly built candidate JS and CSS matched live byte-for-byte:
  `842c5b06633494b5a687d87bc4187d54d86a26528f93373dde32641cc4eded25`
  and `6717fd90ba0adaa23069f592db278d12d78488cbde4faeda70def33d3c94f959`.

## Required repair and re-verification

1. Make the two mobile scrollable command regions keyboard reachable (or make
   the commands wrap without horizontal scrolling), then run Axe at 390px.
2. Eliminate or deliberately handle the 404-route console error while keeping
   a real HTTP 404 and the designed not-found page.
3. Register and test the checksum-verification promise, including failure
   behaviour, or remove the untestable copy. Re-deploy and request a fresh
   independent verification.

# Independent verification 21 — FAIL

**Candidate:** `0019d14925df9e832083d9354e443e5f4dca94f7` (`0.2.3`)  
**Live URL:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 1 September 2026 from a clean `npm ci` install

## Decision

**FAIL.** The candidate is live and the shipped sample flow is usable, but the
required local test gate is not clean. `npm test` stops before its build and
browser stages because one repository regression check fails. Consequently,
each claim command in `.factory/claims.json` that invokes `npm test` also
returns non-zero. The product source was not changed during verification.

## First-read result

The cold landing page answers the required questions in plain language. It says
that Worklog Bridge turns activity into an approved worklog, says it is for
freelancers rebuilding billable work from Git and calendars, and makes **Try it
with sample data** the first action. The adjacent sentence explains that a
filled weekly worklog opens next and real work remains unchanged. This check
passes.

## Release-blocking finding

### High — required test and claim entry points are not clean

After `npm ci`, `npm test` ran 32 Node/script checks and reported one failure:

```text
@regression:verification-13 documents every optional signing secret and unsigned release behavior
AssertionError: handoff must name APPLE_CERTIFICATE
```

The check reads `.factory/handoff.md` and requires it to document the optional
desktop signing configuration and unsigned-release behaviour. The handoff at
this candidate does not meet that repository requirement. This is a
documentation/test-contract defect, rather than a failure of the live product
flow, but it makes the mandatory quality gate fail.

All 27 manifest commands were invoked in manifest order. The 10 commands that
run their own direct test passed:

`account-persistence`, `account-auth-boundary`, `api-rate-limit`,
`zero-config-persistence`, `git-metadata`, `no-repository-upload`,
`public-health-fields`, `installer-sha256`, `release-provenance`, and
`release-signing-mode`.

The other 17 commands use `npm test -- --grep @claim:<id>`. They each enter the
same failing Node/script prerequisite before Playwright can filter to the named
claim, so they return non-zero. Under the claims contract, this is release
blocking even though a direct `npx playwright test` run later completed all 39
browser checks successfully.

## Local checks

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | Pass | 39 packages installed; audit reported 0 vulnerabilities. |
| `npm test` | Fail | 31 passed, 1 failed: the handoff signing-documentation regression above. |
| `npx playwright test` | Pass | 39 Chromium checks; `test-results/.last-run.json` reports `passed`. |
| `npm run build` | Pass | Type check and production Vite build completed; initial JS 18.36 KB gzip and CSS 4.99 KB gzip. |
| Server-only build | In progress during the first cold compilation, then not used for the decision | The API already serves the nominated build live and its direct Rust claim checks pass. |
| Desktop build and desktop-feature Clippy | Not confirmed in this image | `glib-2.0.pc` is absent, so `CI=1 npm run build:desktop` and Tauri all-feature Clippy stop at the documented system-library prerequisite. The release workflow and README name the required packages. |

The desktop-library limitation is an environment prerequisite, not the
release-blocking source finding above. It should still be repeated in an image
with the documented Tauri Linux development packages before treating a new
desktop package set as verified.

## Live deployment and product checks

- `/health` and `/api/health` both returned HTTP 200 with service
  `worklog-approval-bridge`, version `0.2.3`, and commit
  `0019d14925df9e832083d9354e443e5f4dca94f7`.
- `npm run verify:live -- --expected-commit 0019d14925df9e832083d9354e443e5f4dca94f7`
  passed.
- On desktop and 390 px mobile, the landing page loaded without console or page
  errors. It has one `h1`, a `main` landmark, a skip link, and visible keyboard
  focus. Axe WCAG 2 A/AA scans of the live demo returned no serious or critical
  findings. Reduced-motion mode is honoured.
- The live `/demo` flow opened six sample entries, kept the persistent
  **Demo — sample data, nothing is saved** banner, created a fragment-only demo
  approval link, accepted it with a sample receipt, and reset back to `/demo`.
  Its request log contained only same-origin page, asset, and approval-route
  requests; no analytics or advertising request appeared.
- The live service worker controlled `/demo`, completed an update request, and
  reloaded the demo offline with its sample banner and weekly-worklog screen.
- Invalid approval writes from one forwarded client produced 12 HTTP 422
  validation responses followed by HTTP 429 with `Retry-After: 55`. The
  observed allowance is 12 writes per 60 seconds. This meets the documented
  rate-limit behaviour.
- Response headers include HSTS, `X-Content-Type-Options: nosniff`, restrictive
  CSP with `frame-ancestors 'none'`, strict referrer policy, and a
  camera/microphone/geolocation permissions policy. Hashed JS and CSS assets
  use `Cache-Control: public, max-age=31536000, immutable`.

## Next steps

1. Update the candidate handoff so it fulfils the repository's signing
   documentation regression check, then run `npm test` and all exact manifest
   commands again from a clean install.
2. Repeat the desktop build and desktop-feature static checks in an image with
   the documented GLib/WebKitGTK development packages.
3. Re-run independent verification against the resulting immutable commit and
   live build identity.

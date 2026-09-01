# Independent verification 20 — FAIL

**Candidate:** `21781cfeefb4e564f4a073d342182a4d01e99dcf` (`v0.2.2`)  
**Live URL:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 1 September 2026, from a clean dependency install

## Result

**FAIL.** The release-blocking claim gate is not clean: 2 of the 27 commands
declared in `.factory/claims.json` returned non-zero. The full `npm test` run
also failed on the installed-app locality test. No product code was changed.

## Release-blocking findings

### High — `installed-app-locality` claim does not pass

The exact declared command returned exit 1:

```sh
npm test -- --grep @claim:installed-app-locality
```

The Chromium test timed out after 30 seconds waiting to click **Add selected
entries** after it uploaded an ICS file at the configured `/app` route:

```text
locator.click: Test timeout of 30000ms exceeded.
waiting for getByRole('button', { name: 'Add selected entries' })
tests/claims.spec.ts:447
```

The full `npm test` suite also ended with that same failed test (`39` browser
tests attempted; Playwright's `.last-run.json` reports `status: failed`). This
is a promised installed-app privacy/locality flow, so it cannot be accepted
until the shipped test and observable flow pass reliably from a clean profile.

### High — declared `offline-reload` command is not clean on first run

The exact command for `offline-reload` returned exit 1 from the clean clone:

```sh
npm test -- --grep @claim:offline-reload
```

The filtered browser test was not the direct cause. Its prerequisite
`node --test api/test/*.test.mjs scripts/*.test.mjs` cancelled
`@claim:zero-config-persistence` after its 120-second timeout while it built
the server for the first time. The command reported `31` passes and `1`
cancelled test, then exited non-zero. The standalone zero-config claim command
did pass after compilation was cached. The claims contract nevertheless
requires every declared command to pass from a clean clone.

### Medium — desktop package build is not independently reproducible here

`CI=1 npm run build:desktop` exited 1 because this verifier image lacks the
system `glib-2.0` development package (`pkg-config` cannot locate
`glib-2.0.pc`). This is an environment prerequisite rather than a source-code
diagnostic, but it leaves the Linux desktop artifact unconfirmed in this run.

## Claim command ledger

All 27 declared commands were run in manifest order. Twenty-five passed.

| Result | Claim IDs |
| --- | --- |
| Pass | `csv-export`, `local-demo`, `desktop-sample-project`, `entry-review`, `free-editor`, `approval-receipt`, `worklog-details-local`, `account-demo-boundary`, `account-persistence`, `account-auth-boundary`, `api-rate-limit`, `zero-config-persistence`, `no-surveillance`, `calendar-import`, `git-metadata`, `no-repository-upload`, `license-unlock`, `sample-counts`, `pro-price`, `no-analytics`, `release-discovery`, `public-health-fields`, `installer-sha256`, `release-provenance`, `release-signing-mode` |
| Fail | `offline-reload`, `installed-app-locality` |

Raw command output is retained in the verifier session log
`/tmp/worklog-claim-tests.log`; the installed-app trace is at
`test-results/claims--claim-installed-ap-420cf-n-the-packaged-app-frontend-chromium/trace.zip`.

## Local checks

- `npm ci` — pass (39 packages; 0 audit findings).
- `npm --prefix api ci` — pass (28 packages; 0 audit findings).
- `npm test` — fail: the installed-app locality test above.
- `npm run build` — pass; `dist/site/` written.
- `npm run build:server` — pass; release binary written.
- `cargo fmt --manifest-path server/Cargo.toml -- --check` — pass.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` — pass.
- `cargo clippy --manifest-path server/Cargo.toml --all-targets --all-features -- -D warnings` — pass.
- `cargo test --manifest-path src-tauri/Cargo.toml` — pass (2 tests).

The production site emits 92.51 KB gzip JavaScript across its initial and
lazily loaded chunks (18.36 KB initial plus 74.15 KB sign-in chunk) and 4.99
KB gzip CSS, within the applicable budgets.

## Live deployment and product checks

The deployed server matches the candidate exactly:

```json
{"status":"ok","build":{"service":"worklog-approval-bridge","version":"0.2.2","commit":"21781cfeefb4e564f4a073d342182a4d01e99dcf"}}
```

Both `/health` and `/api/health` returned that body. SHA-256 checks matched
the locally built candidate for the live JavaScript, CSS, hero image, and
service worker. The root and unknown-route responses were respectively 200
and 404. Hashed assets use `Cache-Control: public, max-age=31536000,
immutable`; the response headers include HSTS, `nosniff`, a restrictive CSP,
strict referrer policy, and a camera/microphone/geolocation permissions policy.

First-read result: the cold landing screen plainly says it turns activity into
an approved worklog, names freelancers who rebuild billable work from Git and
calendars, and presents **Try it with sample data** with the next action
explained. The sample action is one click. This requirement passes.

On desktop and a 390 px viewport, pages had one `h1`, one `main`, no console
or page errors, no horizontal overflow, and visible keyboard focus from the
skip link onward. Axe WCAG 2 A/AA scans of `/`, `/demo`, `/privacy`, and
`/terms` reported zero serious or critical findings. The live demo accepted a
valid ICS event, showed the useful empty-selection recovery message, enforced
required summary and 1–1440-minute bounds, and produced a demo approval link.
Its request log contained only same-origin requests and no console errors.

After one online reload the live service worker controlled the page; an offline
`/demo` reload retained the demo banner and weekly-worklog screen. An explicit
service-worker `update()` completed with the expected active worker and no
waiting/installation error.

For the live rate check, 13 invalid approval writes from one forwarded client
received 12 × 422 then 429 with `Retry-After: 17` and `Cache-Control:
no-store`. A concurrent 60-request approval read check received 40 × 204 and
20 × 429 with `Retry-After: 1`. This confirms the observed limits of 12 writes
per minute and 40 reads per second for this API family.

Source review confirms account sign-in is configured only for the required
Sociobot Entra External ID authority
`https://sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650/`,
with the specified client ID, PKCE, session storage, and `openid profile email`
scopes. The live sign-in and hosted checkout were not followed in this run so
the verifier did not connect to non-product resources.

## Next step

Make the installed-app ICS path deterministic and ensure every command in
`.factory/claims.json` passes from an uncached clean clone. Re-run the desktop
build in an image that supplies the Tauri Linux development libraries, then
repeat this independent verification.

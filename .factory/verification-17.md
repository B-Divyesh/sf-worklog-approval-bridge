# Independent verification 17 — FAIL

**Candidate:** `66184860155071a3413c71f8c9f67391e2a2a922`  
**Live target:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 29–30 August 2026 UTC

## Decision

**FAIL — do not release this candidate.** The deployed API and published
desktop release identify `47a2c6b969886cd9033c288354a0d2f1aee6b32c`, not the
nominated candidate. This is a release-provenance failure even though the
candidate is a descendant of that commit and the currently served JS and CSS
are byte-for-byte equal to the locally built candidate assets.

Fresh evidence:

- `GET /api/health` returned HTTP 200, `Cache-Control: no-store`, version
  `0.1.21`, and build commit `47a2c6b969886cd9033c288354a0d2f1aee6b32c`.
- `npm run verify:live -- --expected-commit 661848…` failed with exactly that
  actual/expected mismatch.
- `npm run verify:release -- --tag v0.1.21 --expected-commit 661848…` failed:
  `latest.json` and the tag identify `47a2c6b…`. The same command passes only
  when expected commit is `47a2c6b…`; it checksum-verified
  `Worklog.Bridge_0.1.21_amd64.deb` as
  `5951f4fd9d33ce6cc9d129fccc620bc62957130e939a7aefc12afeadaf8461ed`.
- `git diff 47a2c6b..6618486` contains only `.factory/handoff.md` and
  `.factory/polish-3.md`; that does not remove the requirement for the live
  deployment and release manifest to attest the submitted commit.

## Mandatory first gates

### Cold first read — PASS

A fresh 1440 × 900 context loaded the landing page with HTTP 200 and no page
or console errors. The first screen plainly says:

- **What:** “Turn activity into an approved worklog”.
- **For whom:** “For freelancers who rebuild billable work from Git and
  calendars each week.”
- **First action:** “Try it with sample data”; adjacent copy says a filled
  weekly worklog opens and real work stays unchanged.

The action opens `/demo` in one click. It immediately shows the Northstar
Health six-entry worklog and the persistent “Demo — sample data, nothing is
saved” banner with Reset demo and Start for real. The same first-screen
answers fit at 390 × 844.

### Claim registry — PASS

`.factory/claims.json` exists. After clean `npm ci` and `npm --prefix api ci`,
all 22 listed commands were run separately and verbatim from this checkout:

| Claim | Result | Claim | Result |
| --- | --- | --- | --- |
| offline-reload | PASS | csv-export | PASS |
| local-demo | PASS | desktop-sample-project | PASS |
| entry-review | PASS | free-editor | PASS |
| approval-receipt | PASS | worklog-details-local | PASS |
| installed-app-locality | PASS | no-surveillance | PASS |
| calendar-import | PASS | git-metadata | PASS |
| no-repository-upload | PASS | license-unlock | PASS |
| sample-counts | PASS | pro-price | PASS |
| no-analytics | PASS | release-discovery | PASS |
| public-health-fields | PASS | installer-sha256 | PASS |
| release-provenance | PASS | release-signing-mode | PASS |

The exact-command log is `/tmp/worklog-verify-17-claims.log` in the verifier
environment; it records 22 results and zero failures.

## Local quality gates — PASS

- `npm test`: PASS — 27 Node/workflow tests and 37 Chromium tests.
- `npm run build`: PASS; `dist/site` was produced. TypeScript checking is part
  of this build. No separate lint script exists.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: PASS.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings`: PASS.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS — 2 native tests.
- `CI=1 npm run build:desktop`: PASS after installing the Linux prerequisites
  documented in README. It produced AppImage (76,462,584 bytes), DEB
  (1,678,558 bytes), and RPM (1,680,598 bytes). The local AppImage SHA-256 was
  `5d5efeadbc41f10001b9432c17487cc6ea8b55a1a0fea189de44e2f2af252bba`.
  The built binary stayed alive for an eight-second Xvfb smoke run; only
  expected headless EGL/DRI3 warnings appeared.

## Product, privacy, API, and deployment checks — PASS except provenance

- In a fresh real workspace I verified a rejected negative rate and recovery,
  created a real private approval link, accepted it once as “Independent QA
  17”, downloaded its receipt, and reloaded the immutable receipt. The first
  acceptance returned a receipt UUID and server attestation.
- A separate Playwright privacy run recorded only the product origin. The
  acceptance POST was exactly a packet digest and approver name; it contained
  neither “Sensitive local title” nor its detailed worklog text.
- Demo offline reload passed with the active `/service-worker.js`; its banner
  and worklog remained visible after `context.setOffline(true)` and reload.
- A browser client received 60 successful receipt reads and the 61st returned
  `429` with `Retry-After: 60`. It received 12 invalid writes and the 13th
  returned `429` with `Retry-After: 60`. Observed allowance: **60 reads and 12
  writes per client per minute**.
- Browser request logs showed no analytics, advertising, remote fonts,
  screenshots, keystroke capture, or timer APIs in the sample and real flows.
  No sign-in is required, so the Entra tenant condition is not applicable.
- The live static main JS and CSS hashes matched local candidate assets exactly.
  Initial build sizes are 14.92 KB gzip main JS, 1.01 KB gzip core JS, and
  4.87 KB gzip CSS; all are within the stated budgets.
- Root HTML uses 30-second revalidation; hashed JS/CSS are one-year immutable;
  service worker is `no-cache`. CSP, HSTS, `nosniff`, referrer policy, and
  disabled camera/microphone/geolocation headers were present.

## Accessibility and responsive checks — PASS

`verify-url.sh` passed `/`, `/demo`, `/privacy`, `/terms`, and `/download`:
each has a title, `lang=en`, exactly one h1, main landmark, image alternatives,
and no valid-route console errors. Independent Axe scans on desktop and 390 px
mobile found zero serious or critical violations on `/`, `/demo`, `/app`,
`/privacy`, `/terms`, and `/download`; each had no horizontal overflow.

Keyboard smoke passed: first Tab reveals “Skip to main content” with a
3-pixel `rgb(255, 241, 154)` outline; Enter moves to main; `n` opens Add entry;
Escape returns focus to Add entry. With reduced motion, scroll is `auto` and
transition/animation durations are `0.00001s`.

## Defects by severity

- **Critical — candidate not deployed or released:** live `/api/health`, the
  `v0.1.21` tag, and published `latest.json` attest `47a2c6b…`, not
  `6618486…`. Rebuild/release and deploy the exact nominated commit, then
  rerun the two expected-commit verification commands.
- High: none found.
- Medium: none found.
- Low: none found.

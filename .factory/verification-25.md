# Independent verification 25 — FAIL

**Candidate:** `112750e487d3cc8538a7abe357535f777a4b7bbd`  
**Live URL:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 2 September 2026  
**Work order:** `worklog-approval-bridge-verify-25`

## Decision

**FAIL — release blocking.** The candidate fixes verification 24's two blockers:
all 30 mandatory claim commands now pass from the clean candidate, and the live
site, API, GitHub release, manifest, checksums, and desktop packages all identify
the exact candidate. The product also completed its real worklog-to-receipt flow.

The landing footer nevertheless publishes an unlisted and stale claim:
`build 2026.09.01`. Candidate `112750e...` was committed at
`2026-09-02T05:33:11Z`, the live files were last modified on 2 September, and
release `v0.2.6` was published at `2026-09-02T05:40:24Z`. The candidate's own
`.factory/copy-audit.md` records the footer as `build 2026.09.02`, while the source
and live page say `build 2026.09.01`. No `.factory/claims.json` entry tests the
displayed build date. The attached claims contract makes an unlisted public claim
release-blocking.

## Required first gates

### First read — PASS

A fresh 1440 x 900 browser and a fresh 390 x 844 browser opened the live root.
The first viewport plainly answers all three questions:

- What it does: **Turn activity into an approved worklog**.
- Who it serves: freelancers rebuilding billable work from Git and calendars.
- What to do first: **Try it with sample data**.

The next-result sentence is visible beside the action. One click opens the six-entry
Northstar Health sample, with the persistent **Demo — sample data, nothing is
saved** banner, **Reset demo**, and **Start for real**. Cold load returned 200 and
made only four same-origin requests: HTML, one initial JS file, CSS, and responsive
hero art. It produced no console or page error.

### Claim registry — 30/30 PASS

`.factory/claims.json` exists and contains 30 entries. After `npm ci`, every listed
`test` command was run independently, in manifest order, from the clean candidate.
All returned exit code 0.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `offline-reload` | PASS | Six-entry demo reloaded under a fresh offline context |
| `csv-export` | PASS | CSV header plus six sample records |
| `local-demo` | PASS | Demo edits/receipt/reset remained in `demo:` storage and avoided the approval API |
| `desktop-sample-project` | PASS | `/app` first run loaded the six-entry sample in one action |
| `entry-review` | PASS | Text, time, ready state, removal, reload, and CSV were exercised |
| `free-editor` | PASS | Unlicensed workspace added and exported an entry |
| `approval-receipt` | PASS | One-time acceptance, reload, signature verification, and receipt download |
| `worklog-details-local` | PASS | Acceptance body contained only worklog identifier and supplied name |
| `account-demo-boundary` | PASS | Demo started no sign-in, account, or billing traffic |
| `account-persistence` | PASS | Two-account API isolation plus backup/load/export/delete |
| `account-license-storage` | PASS | SQLite retained a token hash and result, never the raw token |
| `account-auth-boundary` | PASS | Missing and invalid issuer/audience/tenant/time/account tokens were rejected |
| `api-rate-limit` | PASS | Account and approval families returned 429 plus `Retry-After` |
| `rate-limit-storage` | PASS | Known forwarded address was present only as a SHA-256 hash |
| `zero-config-persistence` | PASS | PORT-only service reused generated secret and SQLite state after restart |
| `installed-app-locality` | PASS | Production `/app` import/edit/export/share made no application network request |
| `no-surveillance` | PASS | No screenshot, key-capture, or timer API use |
| `calendar-import` | PASS | Only selected-week ICS events were offered |
| `git-metadata` | PASS | Local temporary repository yielded hash, date, and subject |
| `no-repository-upload` | PASS | Loopback remote observed no repository connection |
| `license-unlock` | PASS | Valid/current, invalid, absent, expired, revoked, offline, and 24-hour states |
| `sample-counts` | PASS | Four Git plus two calendar sample entries |
| `pro-price` | PASS | $12 monthly checkout fixture, ICS access, and saved approval history |
| `no-analytics` | PASS | Sample approval flow matched the exact request allowlist |
| `release-discovery` | PASS | GitHub API discovery and unavailable immutable-release state |
| `public-health-fields` | PASS | Both health routes exposed only status and build identity fields |
| `installer-sha256` | PASS | Checksum mismatch stopped installation |
| `release-provenance` | PASS | Every required platform was bound to one immutable source commit |
| `release-signing-mode` | PASS | Unsigned mode and complete-credential gate were enforced |
| `clean-worker-packaging` | PASS | Missing `file` probe received the packaged compatibility fallback |

The per-claim summary and individual command logs were retained during the run in
`/tmp/worklog-qa-claims/`.

## Release-blocking finding

### High — the landing page contains an unlisted, stale build-date claim

Fresh evidence from the candidate and live page:

```text
src/main.ts footer:  Unsigned desktop packages · v0.2.6 · build 2026.09.01 · ...
live footer:         Unsigned desktop packages · v0.2.6 · build 2026.09.01 · ...
candidate commit:    2026-09-02T05:33:11Z
GitHub publication:  2026-09-02T05:40:24Z
copy audit:          Unsigned desktop packages · v0.2.6 · build 2026.09.02
matching claim IDs:  []
```

This is both internally inconsistent and outside the claim registry. Remove the
date, derive and test it from immutable build metadata, or add a dedicated claim
whose sandbox proves the displayed value. The source and public copy must then
agree with the copy audit.

## Additional finding

### Medium — successful dynamic responses omit an explicit cache policy

Fresh response inspection found no `Cache-Control` header on successful health,
approval lookup/creation, and billing-checkout responses. Approval JSON contains a
supplied client name, and checkout JSON contains an ephemeral hosted-session URL.
Protected-route errors and rate-limit errors correctly use `Cache-Control:
no-store`; successful dynamic responses should do the same. Static caching is
otherwise correct: hashed assets use one-year immutable caching and
`service-worker.js` uses `no-cache`.

## Clean local verification

No product source was changed during QA. The documented Ubuntu Tauri prerequisites
were installed after the first optional Clippy/desktop attempt reported missing
`glib-2.0.pc`; both checks then passed.

```text
npm ci                                           PASS; 39 packages, 0 vulnerabilities
npm --prefix api ci                              PASS; 29 packages, 0 vulnerabilities
npm test                                         PASS; 39 Node + 12 Rust + 40 Chromium
npm run build                                    PASS; dist/site
cargo test --manifest-path server/Cargo.toml --locked
                                                   PASS; 12 tests
cargo test --manifest-path src-tauri/Cargo.toml --locked
                                                   PASS; 2 tests
cargo fmt --manifest-path server/Cargo.toml -- --check
                                                   PASS
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
                                                   PASS
cargo clippy (server and Tauri, all targets/features, -D warnings)
                                                   PASS
npm run build:server                             PASS
CI=1 npm run build:desktop                       PASS; AppImage, DEB, RPM
git diff --check                                 PASS
```

There is no separate JavaScript lint script; `tsc --noEmit` runs in the production
build. Docker was unavailable in this worker, so the Dockerfile was inspected but
not rebuilt. It uses `rust:1-slim`, a multi-stage non-root runtime, `ARG
BUILD_SHA=dev`, `/data`, and `PORT=8080` as required.

Fresh local Linux bundles:

| Bundle | Bytes | SHA-256 |
| --- | ---: | --- |
| AppImage | 77,249,016 | `1250aae05ef16bc2ad45061f6ccc94f89bfd3a1742966188eacdaeb442470dbd` |
| DEB | 2,002,040 | `e656bea6858320acdba50ff0d938022d3d39aff5bc59db99c4534f9113dd1bbd` |
| RPM | 2,004,158 | `1d461b2560dc77bb38f1d54920f23f7452aa53f84402a33e4a39485a35a414d2` |

The AppImage identifies as an executable Type 2 runtime and exposes the expected
runtime options.

## Live product and recovery paths

The live demo and real workspace completed the smallest useful job end to end:

1. Loaded six realistic entries in one click and confirmed the isolated storage
   boundary.
2. Rejected a negative hourly rate and a non-Monday week, explained each error, and
   restored the previous value.
3. Rejected 1,441 minutes and saved the 1,440-minute boundary.
4. Explained a malformed/empty ICS file, included a one-minute Monday-boundary
   event, excluded the next-week boundary, and rejected an empty source selection.
5. Exported the reviewed entries to CSV, created a demo receipt locally, reset the
   demo, and discarded all demo keys when leaving.
6. In a fresh real workspace, added and exported a one-minute entry without a
   license, generated an approval link, blocked empty acceptance, then received
   201 for acceptance and 200 for the same receipt after reload.
7. Confirmed the real POST had exactly `packetDigest` and `approver`, downloaded the
   server-attested receipt, and rejected a changed fragment as **This worklog was
   changed**.

The complete landing/demo/real-approval browser logs contained no analytics,
advertising, remote font, third-party script, console, or uncaught page error. The
normal demo and real editor/receipt flows used only the product origin. The download
page alone uses the documented GitHub Releases API. The installed app's Tauri
capability list is `core:default`; its CSP allows only self, the Sociobot API, and
the Tauri IPC origins.

## Backend, identity, billing, and delivery

- `npm run verify:live -- --expected-commit 112750e...`: PASS.
- `npm run verify:release -- --expected-commit 112750e...`: PASS.
- `npm run verify:delivery`: PASS.
- `/health` and `/api/health` return version `0.2.6` and exact commit
  `112750e487d3cc8538a7abe357535f777a4b7bbd`.
- Local `index.html`, initial JS, CSS, mobile hero, and service worker SHA-256 values
  match the live bytes.
- GitHub `v0.2.6` targets the exact candidate and publishes macOS arm64/x64,
  Windows MSI/EXE, Linux AppImage/DEB/RPM, `latest.json`, and `SHA256SUMS`.
- A fresh live checkout opened `checkout.dodopayments.com` and displayed **Worklog
  Bridge Pro**, **$12.00**, and **/ Month**. No payment was attempted.
- Sign-in redirected only to
  `sociobotcustomers.ciamlogin.com/35c6fe40-0ec0-46b6-98c6-213ad4de6650/`
  with the required client ID, callback URL, OpenID/profile/email scopes, and S256
  PKCE. Protected routes returned 401, `WWW-Authenticate: Bearer`, and `no-store`.
- One hundred concurrent health requests returned 100 x 200 in 414 ms.
- Five concurrent acceptances for a fresh digest returned one 201 and four 409;
  the subsequent lookup returned the one valid receipt.
- Product API read allowance observed: 40 per client per one-second window; the
  next 40 burst requests returned 429 with `Retry-After: 1`.
- Product API billing/write allowance observed: 12 per client per 60 seconds; the
  next eight requests returned 429 with `Retry-After: 23` at the sampled point.
- Sociobot product-license endpoint allowance observed: 30 requests in its active
  window; the next 50 burst requests returned 429 with `Retry-After: 4`.

## Accessibility, responsive behavior, PWA, and performance

- The factory URL verifier passed in 780 ms: title, `lang=en`, one `h1`, one main
  landmark, image alternatives, labelled buttons, and zero console errors.
- A fresh live Axe sweep across `/`, `/demo`, `/app`, `/privacy`, `/terms`,
  `/download`, and the real 404 at both 1440 px and 390 px found zero serious or
  critical violations.
- Every tested route had exactly one `h1` and `main`, route-specific title, no
  horizontal overflow, and no visible control below 44 x 44 CSS px.
- Keyboard-only checks passed the skip link, 3 px focus ring, `/` filter shortcut,
  `n` entry dialog, focus trap, Escape dismissal, and `e` CSV export.
- Reduced-motion contexts had zero running animations on every route.
- A newly installed service worker removed a seeded stale cache, controlled the
  page, and reloaded `/demo` offline with six entries plus the offline status.
- Security headers include HSTS, `nosniff`, strict-origin referrer policy,
  camera/microphone/geolocation denial, and a response-header CSP with
  `frame-ancestors 'none'`.
- Initial page JS is 55.45 KB raw / 17.36 KB gzip, plus no eagerly loaded auth
  bundle. CSS is 18.53 KB raw / 4.99 KB gzip. Mobile hero is 41.05 KB. Lighthouse
  transferred 115 KiB total.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.4 s, LCP 1.5 s, TBT 20 ms, CLS 0.

## Required repair

1. Remove or correctly derive the footer build date and register an observable
   claim test if the date remains public.
2. Make `.factory/copy-audit.md` match the actual landing text.
3. Add `Cache-Control: no-store` to successful dynamic API responses and test it.
4. Rerun all 30 claim commands, the full suite/builds, live first read, delivery
   identity, and response-header checks against the repaired candidate.

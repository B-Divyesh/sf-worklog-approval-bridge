# Turn selected work into an approved client worklog — verification 26

**Verdict: PASS**  
**Findings:** 0  
**Untested claims:** 0  
**Implementation candidate:** `287fc7d9138320a79b125e1329f88869e4d43b88` (`v0.2.7`)  
**Live URL:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 5 September 2026  
**Work order:** `worklog-approval-bridge-verify-26`

## Decision

PASS. The clean candidate, live web service, published desktop release, and
Linux desktop application complete the current M2 work. Every registered claim
command passed. The live service and release identify the exact candidate.
There are no findings at any severity and no untested public claims.

No product code changed during this verification. The report-only commit differs
from the implementation candidate; its exact SHA is recorded in
`.factory/handoff.md` after this report is committed.

## Job, audience, and first action

These answers were visible before scrolling in fresh 1440 × 900 and 390 × 844
browser contexts:

| Question | Answer shown on the first screen | Result |
| --- | --- | --- |
| What is the job? | Turn activity into an approved worklog. | PASS |
| Who is it for? | Freelancers who rebuild billable work from Git and calendars each week. | PASS |
| What happens first? | **Try it with sample data** opens a filled worklog and leaves real work unchanged. | PASS |

The three local-data, offline, and price facts also fit in both first viewports.
The wording is direct, and the first action is clear.

## Current milestone and external dependencies

M2 is complete. The shipped scope is local Git and selected-week ICS collection,
review and redaction, CSV export, private approval links, signed receipts,
optional Sociobot account backup, and the $12 monthly Pro checkout. M3 team
workflows and M4 operational additions remain planned. They were not treated as
current promises.

| Dependency | Independent result |
| --- | --- |
| Product service and SQLite | Both health routes identify `0.2.7` and the candidate. Local PORT-only restart testing reused SQLite state and the generated signing secret. |
| Sociobot sign-in | A fresh sign-in attempt reached the documented tenant with the expected client, callback, scopes, and S256 PKCE. No account was created. |
| Sociobot/Dodo billing | The live product checkout handoff returned a hosted checkout address. The browser fixture proves the displayed $12 monthly amount and failure recovery. No payment was attempted. |
| GitHub Releases | Tag `v0.2.7`, `latest.json`, checksums, and every platform artifact identify the candidate. |
| Desktop signing | The current files are deliberately and visibly unsigned previews. The tested manual release gate requires the complete signing configuration. This is the current public scope, not a hidden signed-release claim. |

No AI feature is promised or needed for the current local-first worklog flow.
Adding one would send more work data outside the device without improving the
required reconstruction and review steps.

## Live product flow

A fresh live browser run completed 231 assertions with no failed assertion.

- The landing action opened `/?demo=1` in one click.
- The Northstar Health sample showed four Git entries and two calendar entries.
- **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real**
  stayed available through review and approval.
- A negative hourly rate was rejected and restored to 135.
- A 1,441-minute entry was rejected; the 1,440-minute boundary saved.
- An edited client summary appeared in the six-row CSV export.
- Empty approval was blocked by the labelled required fields.
- Valid demo acceptance created a local receipt that survived reload.
- Reset restored the original six entries and removed the demo receipt.
- Leaving the demo removed every `demo:` key and restored the seeded real
  workspace byte-for-byte.
- The entire sample flow made only same-origin GET requests. It made no approval,
  account, billing, analytics, advertising, remote-font, or third-party-script
  request.

The browser suite also passed malformed and empty inputs, calendar week
selection, checkout failure recovery, invalid and stale licenses, changed
approval data, clipboard denial, CSV formula neutralisation, and normal recovery
paths. No production worklog or approval record was created during live QA.

## Claim commands

The detached clean checkout received `npm ci` and `npm --prefix api ci`; both
reported zero vulnerabilities. Every command in `.factory/claims.json` then
completed successfully in manifest order. Thirty log files cover all 30 claims.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `offline-reload` | PASS | Six entries and the offline status survived a fresh offline reload. |
| `csv-export` | PASS | Export contained the header and six sample records. |
| `local-demo` | PASS | Edit, receipt, reload, reset, and exit remained in demo storage. |
| `desktop-sample-project` | PASS | `/app` loaded the six-entry sample in one action. |
| `entry-review` | PASS | Text, time, ready state, removal, reload, and CSV were checked. |
| `free-editor` | PASS | An unlicensed workspace added and exported an entry. |
| `approval-receipt` | PASS | One-time acceptance, persistence, signature check, and download passed. |
| `worklog-details-local` | PASS | Acceptance contained only the worklog identifier and supplied name. |
| `account-demo-boundary` | PASS | Demo started no sign-in, backup, or billing request. |
| `account-persistence` | PASS | Two-account isolation covered backup, load, export, and deletion. |
| `account-license-storage` | PASS | SQLite stored the hash and result, never the raw license. |
| `account-auth-boundary` | PASS | Issuer, audience, tenant, time, algorithm, and stable account ID were enforced. |
| `api-rate-limit` | PASS | Account and approval routes returned 429 with a retry time. |
| `rate-limit-storage` | PASS | The client address was stored only as a one-way hash. |
| `zero-config-persistence` | PASS | PORT-only startup reused SQLite state and the generated secret after restart. |
| `installed-app-locality` | PASS | Import, edit, export, and link creation made no app-network request. |
| `no-surveillance` | PASS | No screen, microphone, keystroke, or timer capture occurred. |
| `calendar-import` | PASS | Only selected events in the chosen week were offered. |
| `git-metadata` | PASS | A local repository yielded hash, date, and subject. |
| `no-repository-upload` | PASS | A loopback remote received no connection. |
| `license-unlock` | PASS | Valid, absent, invalid, expired, revoked, offline, and one-day states passed. |
| `sample-counts` | PASS | The sample contains four Git and two calendar entries. |
| `pro-price` | PASS | The $12 monthly fixture, ICS access, and saved history passed. |
| `no-analytics` | PASS | The complete sample approval flow matched the request allowlist. |
| `release-discovery` | PASS | Immutable release selection and the unavailable state passed. |
| `public-health-fields` | PASS | Both health routes expose only status and build identity. |
| `installer-sha256` | PASS | A checksum mismatch stopped installation. |
| `release-provenance` | PASS | Every platform artifact was bound to one source commit. |
| `release-signing-mode` | PASS | Unsigned preview and complete-credential signing modes passed. |
| `clean-worker-packaging` | PASS | The missing `file` probe received the packaging fallback. |

Landing, application, download, legal, README, and copy-audit statements were
cross-checked with the registry and regression tests. No missing, false,
incomplete, or untested public claim remains.

## Clean checkout quality gates

The documented Ubuntu Tauri prerequisites were installed before native runtime
and packaging checks.

| Command | Result |
| --- | --- |
| `npm test` | PASS: 40 Node/API/script tests, 13 server tests, site build, and 40 Chromium tests. |
| `cargo test --manifest-path server/Cargo.toml --locked` | PASS: 13 tests. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS: 2 tests. |
| Both `cargo fmt --check` commands | PASS. |
| Both all-target/all-feature Clippy commands with `-D warnings` | PASS. |
| `npm run build` | PASS; wrote `dist/site/`. |
| `npm run build:server` | PASS; wrote the release service binary. |
| `CI=1 npm run build:desktop` | PASS; wrote AppImage, DEB, and RPM packages. |
| `git diff --check` | PASS. |
| `npm run verify:live` | PASS for the exact candidate. |
| `npm run verify:release` | PASS for `v0.2.7` and the exact candidate. |
| `npm run verify:delivery` | PASS for live, release, and desktop identity. |

Fresh Linux build results:

| Package | Size | SHA-256 |
| --- | ---: | --- |
| AppImage | 77,249,016 bytes | `a44cd2a48f5b4d1a7e36fc9fb3fe4a117b647e4becee30b237a79de366103c5d` |
| DEB | 2,002,002 bytes | `74d23fdd8c22dd03ce7943e51b7960427f8961ed8cb2a63a3965456e7d6fd054` |
| RPM | 2,004,134 bytes | `52611463cefcfc0a488f8033010ee9c0b5c9ac5484b911dcccb6c8b5da86ff67` |

The separately downloaded release AppImage matched its published SHA-256,
extracted successfully, and stayed running under Xvfb for the eight-second
consumer smoke. Its isolated XDG profile did not touch existing application
data. The expected Xvfb software-rendering warning was non-fatal.

Docker is not installed in this verifier image. The multi-stage Dockerfile was
inspected for `rust:1-slim`, non-root runtime, `BUILD_SHA=dev`, `/data`, and
`PORT=8080`; the release server build and exact live delivery checks passed.

## Backend and live request limits

- `/health` and `/api/health` returned 200, version `0.2.7`, the exact candidate,
  only the documented fields, and `Cache-Control: no-store`.
- A successful empty approval lookup returned 204 with `no-store`.
- The successful checkout handoff returned 200 with `no-store`.
- The verification-25 regression covered successful 200, 201, and 204 dynamic
  responses, including receipt creation and lookup, without changing live data.
- A protected worklog request returned 401 with `WWW-Authenticate: Bearer` and
  `no-store`.
- One read client received 40 × 204, then 40 × 429. Every 429 had
  `Retry-After`.
- One write client received 12 validation responses, then 8 × 429. Every 429
  had `Retry-After`.
- One hundred concurrent health requests returned 100 × 200 in 741 ms.
- The account claim used two signed test identities and proved tenant isolation.
- The restart claim started the service with only PORT twice and reused the
  generated secret and SQLite database.

## Accessibility, routes, offline use, and performance

- The factory URL verifier passed `/` and `/demo`: title, `lang=en`, one `h1`,
  one `main`, image alternatives, labelled buttons, and no console error.
- Live Axe checks covered `/`, `/demo`, `/app`, `/privacy`, `/terms`,
  `/download`, and the designed 404 at 1440 px and 390 px. There were zero
  serious or critical violations.
- Keyboard checks covered the skip link, visible 3 px focus, `/` filter, `n`
  entry dialog, focus containment, Escape, and CSV export.
- Every checked mobile control was at least 44 px high. There was no horizontal
  overflow. The viewport permits zoom, and desktop text at 200% retained the
  heading and primary action without horizontal overflow.
- Reduced-motion contexts had no running animations.
- Route titles, descriptions, canonicals, social metadata, favicon, touch icon,
  `robots.txt`, and the sitemap were present. The sitemap includes all public
  product routes.
- The missing-page request deliberately returned HTTP 404 and showed **Page not
  found** with **Return home**. This expected 404 is not a defect.
- A new service worker activated, removed a seeded stale cache, retained one
  current cache, and reloaded the six-entry demo offline.
- Initial application JavaScript is 57.91 KB raw across the initial chunks;
  CSS is 18.53 KB raw; the mobile hero is 41.05 KB. The larger sign-in chunk is
  lazy.
- Mobile Lighthouse scored Performance 99, Accessibility 100, Best Practices
  100, and SEO 100. LCP was 1.63 s, TBT 0 ms, CLS 0, and total transfer 118 KB.

## Earlier findings

Every earlier review, polish, and verification file present in `.factory` was
read. The current disposition was checked against the clean source, exact claim
commands, fresh package, and live runtime.

| Earlier finding set | Current proof | Disposition |
| --- | --- | --- |
| Review 1 `F-1-1`–`F-1-14` | First-run sample, complete claim coverage, free tier, installed-app locality, release discovery, health fields, and explicit unsigned-preview state all pass. | Closed |
| Review 1 minor `F-1-15`–`F-1-34` | Current landing, README, copy audit, and copy-contract tests use the prescribed plain terms and sentence limits. | Closed |
| Review 2 `F-2-1`–`F-2-7` | Demo approval isolation, history focus/scroll, signing claim, route metadata, consistent terms, receipt wording, and real 404 all pass. | Closed |
| Review 3 `F-3-1` | Clipboard denial exposes a selected link and plain recovery instruction; focus returns correctly. | Closed |
| Review 5 `F-5-1`–`F-5-3` | Account/license deletion, one-way license hash, and one-way client-address hash have direct claim tests. | Closed |
| Review 5 minor `F-5-4`–`F-5-7` | CIAM, `oid`, JWKS, and token-field jargon are absent from user-facing README explanations. | Closed |
| Verification 1–4 | Durable receipts, registered claims, CI desktop build, cache versioning, live limits, real 404, keyboard-scrolling commands, and checksum coverage pass. | Closed |
| Verification 5–11 | Candidate/release provenance, checkout, license enforcement, input bounds, calendar selection, focus, touch targets, CSV safety, health identity, rate limits, contrast, and `/app` sitemap entry pass. | Closed |
| Verification 12, 15–18, and 22 | These reports recorded PASS and no open defects; their covered behavior still passes. | Confirmed |
| Verification 14 | Exact candidate delivery, self-contained claim setup, and 16 px first-screen support text pass. | Closed |
| Verification 19 | M2 backend, checkout, formatting, account HTTP coverage, approval rate limiting, and zero-config persistence pass. | Closed |
| Verification 20 | Installed locality and offline commands are clean; native packaging is reproducible after documented prerequisites. | Closed |
| Verification 21 | Handoff signing documentation and clean claim entry points pass. | Closed |
| Verification 23 | The AppImage, DEB, and RPM build completes. | Closed |
| Verification 24 | All 30 claim commands pass, and live/release desktop provenance matches the candidate. | Closed |
| Verification 25 stale footer date | Live footer is `v0.2.7` with no wall-clock build date; source and copy audit match; regression passes. | Closed |
| Verification 25 dynamic caching | Live health, empty approval, checkout, and protected responses use `no-store`; successful created/accepted paths pass the backend regression. | Closed |

The repository does not contain a `verification-13.md`; the retained
verification-13 signing regression passed in the 40-test Node suite.

## Findings

None.

Finding count: **0**. Untested claim count: **0**.

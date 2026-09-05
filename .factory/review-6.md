# Turn selected work into an approved client worklog — review 6

**Verdict: PASS**

**Findings:** 0

**Untested claims:** 0

**Current milestone:** M2 — accounts, persistence, and subscription wiring

**Implementation candidate:** `287fc7d9138320a79b125e1329f88869e4d43b88` (`v0.2.7`)

**Documentation baseline:** `9020806127ca6bd44fd3014ce8fdf2fc28d7a09c`

**Live URL:** <https://worklog-approval-bridge.sociobot.in>
**Reviewed:** 5 September 2026

## Decision

PASS. The live service, published desktop release, and clean candidate complete
the current M2 work. All 30 claim commands pass. No public claim is missing or
untested. There are no findings at any severity.

The documentation baseline is later than the implementation candidate. Its only
changes are `.factory/verification-26.md` and `.factory/handoff.md`. The live
frontend bytes, API build identity, and desktop release all match the
implementation candidate. No new product image was needed for the report-only
commits.

No product code changed during this review.

## Job, audience, and first action

Fresh 1440 × 900 and 390 × 844 browser contexts showed these answers before any
scrolling:

| Question | Visible answer | Result |
| --- | --- | --- |
| What is the job? | Turn activity into an approved worklog. | PASS |
| Who is it for? | Freelancers who rebuild billable work from Git and calendars each week. | PASS |
| What is the first action? | **Try it with sample data** opens a filled worklog and leaves real work unchanged. | PASS |

The local-data, offline, and $12 monthly facts also fit in both first viewports.
The words are direct. Public headings name their content and do not use mood copy.

## Current milestone

M2 is complete. The current product covers selected Git and ICS activity, worklog
review, redaction, CSV export, private approval links, signed receipts, optional
Sociobot account backup, and the monthly Pro checkout.

M3 team workflows and M4 operations remain planned. They are not shown or tested
as current capabilities.

## External dependencies

| Dependency | Fresh result |
| --- | --- |
| Product service and SQLite | Both health routes identify version `0.2.7` and the candidate. A PORT-only local restart reused SQLite state and the generated signing secret. |
| Sociobot sign-in | Sign in reached the documented tenant, client, callback, identity scopes, and S256 PKCE. No account was created. |
| Sociobot and Dodo billing | The product endpoint returned a `303` to the hosted Dodo checkout. The claim fixture proved the $12 monthly item and recovery from an upstream error. No payment was started. |
| GitHub Releases | `v0.2.7`, `latest.json`, checksums, and all platform entries identify the candidate. |
| Desktop trust | The current macOS and Windows files are deliberately described as unsigned previews. The release gate requires all signing credentials before a signed release. |

No AI feature is promised. The current import, review, export, backup, and
approval flow already covers the implied M2 work. Adding model use would send
more work data away from the device without a required user benefit.

## Live sample and real-data boundary

The desktop and phone runs started in new browser contexts.

- The landing action opened the six-entry Northstar Health sample in one click.
- The sample contained four Git entries and two calendar entries.
- **Demo — sample data, nothing is saved** stayed visible during review and approval.
- A negative hourly rate was rejected and restored to `135`.
- A `1,441` minute entry was rejected. A `1,440` minute entry saved.
- The edited summary appeared in a six-row CSV export.
- Missing name and confirmation fields blocked approval without creating a receipt.
- A valid sample acceptance created a local receipt that survived reload.
- Reset restored all six original entries and removed the sample receipt.
- **Start for real** removed every `demo:` key.
- The seeded real workspace remained byte-for-byte unchanged.
- The sample made only same-origin GET requests.
- It made no approval, account, billing, analytics, advertising, font, or script request.
- No production worklog, account, payment, or approval record was created.

The full browser suite also covers a damaged approval link, changed approval
data, clipboard denial, CSV formula neutralisation, unavailable checkout,
invalid licenses, empty states, and normal recovery paths.

## Claim commands

The detached candidate received `npm ci` and `npm --prefix api ci`. Both audits
reported zero vulnerabilities. Every command in `.factory/claims.json` then ran
exactly as written and returned zero.

| Claim | Result | Checked outcome |
| --- | --- | --- |
| `offline-reload` | PASS | Six entries and the offline state survived reload. |
| `csv-export` | PASS | CSV contained its header and six sample rows. |
| `local-demo` | PASS | Edit, receipt, reload, reset, and exit stayed in sample storage. |
| `desktop-sample-project` | PASS | The first-run app loaded the sample in one action. |
| `entry-review` | PASS | Text, time, readiness, removal, reload, and export worked. |
| `free-editor` | PASS | An unlicensed workspace added and exported an entry. |
| `approval-receipt` | PASS | One-time acceptance, persistence, signature check, and download worked. |
| `worklog-details-local` | PASS | Acceptance sent only the worklog identifier and supplied name. |
| `account-demo-boundary` | PASS | The sample started no sign-in, backup, or billing request. |
| `account-persistence` | PASS | Two accounts stayed separate through save, load, export, and deletion. |
| `account-license-storage` | PASS | SQLite stored the token hash and result, not the raw token. |
| `account-auth-boundary` | PASS | Issuer, audience, tenant, time, algorithm, and account ID were enforced. |
| `api-rate-limit` | PASS | Account and approval routes returned `429` with a retry time. |
| `rate-limit-storage` | PASS | The client address appeared only as a one-way hash. |
| `zero-config-persistence` | PASS | PORT-only startup reused the database and generated secret after restart. |
| `installed-app-locality` | PASS | Import, edit, export, and link creation made no app-network request. |
| `no-surveillance` | PASS | No screen, microphone, key, or timer capture occurred. |
| `calendar-import` | PASS | Only chosen events in the selected week were offered. |
| `git-metadata` | PASS | A local repository yielded hash, date, and subject. |
| `no-repository-upload` | PASS | A loopback remote received no connection. |
| `license-unlock` | PASS | Valid, absent, invalid, expired, revoked, offline, and day-boundary states worked. |
| `sample-counts` | PASS | The sample has four Git and two calendar entries. |
| `pro-price` | PASS | The $12 monthly fixture, ICS access, and saved history worked. |
| `no-analytics` | PASS | The complete sample approval flow matched its request allowlist. |
| `release-discovery` | PASS | Immutable release selection and its unavailable state worked. |
| `public-health-fields` | PASS | Both health routes exposed only health and build identity. |
| `installer-sha256` | PASS | A checksum mismatch stopped installation. |
| `release-provenance` | PASS | Every desktop platform was tied to one source commit. |
| `release-signing-mode` | PASS | Preview and complete-credential signing modes worked. |
| `clean-worker-packaging` | PASS | A missing `file` tool received the packaging fallback. |

Landing, app, legal, download, README, and copy-audit statements were compared
with this registry and the regression suite. No false, incomplete, missing, or
untested public claim remains.

## Clean checkout quality gates

The documented Linux Tauri packages were installed before native packaging and
runtime checks.

| Command | Result |
| --- | --- |
| `npm test` | PASS: 40 Node/API/script tests, 13 server tests, and 40 Chromium tests. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS: 2 tests. |
| `cargo test --manifest-path server/Cargo.toml --locked` | PASS: 13 tests. |
| Both Rust formatter checks | PASS. |
| Both all-target, all-feature Clippy checks with `-D warnings` | PASS. |
| `npm run build` | PASS; produced `dist/site/`. |
| `npm run build:server` | PASS; produced the release service. |
| `CI=1 npm run build:desktop` | PASS; produced AppImage, DEB, and RPM packages. |
| `npm run verify:live -- --expected-commit 287fc7d…` | PASS. |
| `npm run verify:delivery` | PASS for live, release, and desktop identity. |
| `git diff --check` | PASS. |

Fresh Linux bundles:

| Package | Size | SHA-256 |
| --- | ---: | --- |
| AppImage | 77,249,016 bytes | `a35c933bb1d8e81168563194aac47b9afd9f35265948350c4319968c402d5fd3` |
| DEB | 2,002,006 bytes | `b1240aa97ce8e6d7cf14d6e9212162c4fca2995212a4649f86aad2d5c3e47167` |
| RPM | 2,004,134 bytes | `63d3287f7a90049349c3f9949364d99e660155c172bb66a7e17f863728bfaa23` |

The initial application JavaScript is 57.91 KB raw. CSS is 18.53 KB raw. The
phone hero is 41.05 KB. The larger sign-in module is loaded only when needed.

The published AppImage matched SHA-256
`8f0f73fce3ae1823ff392609437d170862dc2f6f17221236fc31889450522565`.
It stayed open for the eight-second Xvfb smoke in a new XDG profile. The timeout
exit was expected because the desktop window remained running.

## Backend and request limits

- `/health` and `/api/health` returned `200`, `no-store`, version `0.2.7`, and the candidate.
- Their JSON contained only health status and service build identity.
- An anonymous account request returned `401`, `WWW-Authenticate: Bearer`, and `no-store`.
- One read client received 40 × `204` and then 40 × `429`.
- One write client received 12 × `422` and then 8 × `429`.
- Every `429` contained `Retry-After`.
- One hundred concurrent health requests returned 100 × `200` in 60 ms.
- Two signed test identities proved worklog and license-row isolation.
- The restart claim proved SQLite and signing-secret reuse with only PORT set.

The local Docker command was unavailable in this worker. The multi-stage
Dockerfile uses `rust:1-slim`, a non-root runtime user, `/data`, `PORT=8080`, and
`BUILD_SHA=dev`. The release server build and exact live identity both passed.

## Accessibility, routes, offline use, and performance

- The factory URL check passed `/` and `/demo` with no console errors.
- Live Axe checks covered seven routes at desktop and phone sizes.
- No route had a serious or critical Axe violation.
- Every checked page had `lang=en`, one `h1`, and one `main`.
- Keyboard checks covered the skip link, 3 px focus ring, shortcuts, dialog focus, Escape, and export.
- The local suite checked all visible controls at 44 × 44 px or larger.
- No checked phone route had horizontal overflow.
- Reduced-motion contexts had no running animations.
- Route titles, descriptions, canonicals, social art, icons, robots, and sitemap passed.
- All rendered links returned a success or expected redirect.
- The unknown route returned HTTP `404` and showed **Page not found** with **Return home**.
- The deliberate `404` is expected and is not a defect.
- A damaged approval link stayed on `/approve` and explained how to recover.
- The service worker removed a seeded stale cache and kept one current cache.
- The six-entry sample reloaded offline and showed the offline state.
- Mobile Lighthouse scored 100 for Performance, Accessibility, Best Practices, and SEO.
- Lighthouse measured LCP at 1.3 s, TBT at 20 ms, CLS at 0, and 115 KiB transferred.

The app uses one documented dark treatment. Contrast, focus, labels, landmarks,
dialog state, live regions, alternative text, zoom support, and reduced motion
also pass the full browser suite.

## Privacy and data controls

The live sample request record contains only same-origin GETs. Account backup is
explicit. The app offers account download and deletion, and the privacy page
gives a direct privacy contact. Claims cover local storage, optional backup,
tenant isolation, one-way license and address hashes, and deletion. No analytics,
third-party fonts, third-party scripts, raw model keys, or repository uploads
were found.

## Earlier findings

Every earlier review, polish, and verification report in `.factory` was checked.
The current source, claim logs, live runtime, release, and installed package give
the following dispositions.

| Earlier finding set | Current proof | Disposition |
| --- | --- | --- |
| Review 1 `F-1-1` | The installed-app first-run claim loads the six-entry sample in one action. | Closed |
| Review 1 `F-1-2`–`F-1-4` | License states, hosted price/history, and the full analytics allowlist pass their exact claim commands. | Closed |
| Review 1 `F-1-5`–`F-1-13` | Review, free tier, approval fields, release discovery, health, and installed locality are registered and pass. Unsupported device, merchant, and uninstall wording was removed. | Closed |
| Review 1 `F-1-14` | The whole site and README label the relevant desktop packages as unsigned previews. The signing-mode claim passes. | Closed for the current preview scope |
| Review 1 minor `F-1-15`–`F-1-34` | The current copy audit and copy-contract tests use the required plain terms and sentence limits. | Closed |
| Review 2 `F-2-1`–`F-2-3` | Sample approval stays local, history navigation restores state, and signing behavior is registered. | Closed |
| Review 2 minor `F-2-4`–`F-2-7` | Route descriptions, consistent terms, receipt wording, and the plain 404 all pass. | Closed |
| Review 3 `F-3-1` | Clipboard denial shows a selectable link and keeps focus in the recovery path. | Closed |
| Review 4 | It recorded PASS; its covered paths still pass. | Confirmed |
| Review 5 `F-1-27`, `F-1-32`, and `F-2-6` | Reader-facing license, link, and receipt text no longer uses the flagged internal terms. | Closed |
| Review 5 `F-5-1`–`F-5-3` | Account deletion, license hashing, and address hashing have direct claim tests. | Closed |
| Review 5 minor `F-5-4`–`F-5-7` | CIAM, `oid`, JWKS, and token-field jargon are absent from reader-facing explanations. | Closed |
| Verification 1–4 | Durable receipts, claim coverage, CI builds, cache versioning, live limits, real 404, keyboard scrolling, and checksum coverage pass. | Closed |
| Verification 5–11 | Provenance, checkout, license control, bounds, calendar selection, focus, touch, CSV safety, health, limits, contrast, and sitemap checks pass. | Closed |
| Verification 12, 15, 16, 18, and 22 | These reports recorded PASS. Their checked behavior still passes. | Confirmed |
| Verification 14 | Exact delivery, clean claim setup, and 16 px first-screen support text pass. | Closed |
| Verification 17 | Live, release, and download identities match the candidate. | Closed |
| Verification 19 | The M2 backend, checkout, formatting, HTTP account routes, approval limits, and zero-config runtime pass. | Closed |
| Verification 19 low note | The hidden ICS input is operated by its visible labelled button. The visible control passes the 44 px check. | Confirmed, not a defect |
| Verification 20 | Installed locality and offline commands pass from the clean checkout. Native packages build after documented setup. | Closed |
| Verification 21 | The handoff signing section and every claim entry point pass. | Closed |
| Verification 23 | AppImage, DEB, and RPM packaging completes. | Closed |
| Verification 24 | All 30 claim commands pass, and live desktop provenance matches the candidate. | Closed |
| Verification 25 footer date | The live footer uses version `0.2.7` with no wall-clock build date. Its regression passes. | Closed |
| Verification 25 dynamic caching | Live dynamic success, auth, and limit responses use `no-store`. The backend regression covers creation and lookup too. | Closed |
| Verification 26 | It recorded 30/30 claims and zero findings. This review repeated the required checks independently. | Confirmed |
| Polish 1, 2, 3, and 5 | Their recorded repair closures match the current tests and live behavior above. | Confirmed |

There is no `verification-13.md` in the repository. Its retained provenance and
signing regressions pass in the current Node suite.

## Evidence

- Claim logs: `/work/.evidence/review-6-claims/`
- Live browser and API evidence: `/work/.evidence/review-6-live/`
- Factory URL checks: `/work/.evidence/review-6-url-root/` and `/work/.evidence/review-6-url-demo/`
- Lighthouse JSON: `/work/.evidence/review-6-lighthouse.json`
- Quality logs: `/work/.evidence/review-6-quality-*.log`
- Required report copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`

## Findings

None.

Finding count: **0**. Untested claim count: **0**.

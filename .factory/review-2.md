# Adversarial first-read review 2 — FAIL

Reviewed 29 August 2026 against base `6fdf8575d0e91aca057eefac86c7259c10e07b53` and <https://worklog-approval-bridge.sociobot.in>.

## Verdict

**FAIL.** The first screen is clear, the realistic six-entry sample opens in one click, Reset works, browser real/demo data remain separate, all 20 registered commands exit successfully, and the identity is distinct. There are 6 blocking, 1 high, and 4 minor findings. Four blocking findings recur from review 1 because their prescribed fixes remain incomplete.

## Cold first read

Fresh Chromium contexts were opened at 390 × 844 and 1440 × 900 without scrolling.

| Question | Answer from the first screen | Result |
|---|---|---|
| What does it do? | Turns Git and calendar activity into a weekly worklog a client can approve. | PASS |
| For whom? | Freelancers reconstructing billable work each week. | PASS |
| What should I click first? | **Try it with sample data**; adjacent copy says a filled worklog opens and real data is untouched. | PASS |

The exact text was “Turn activity into an approved worklog,” “For freelancers who rebuild billable work from Git and calendars each week,” and “Try it with sample data.” At 390 px all three facts ended at y=757 inside the 844 px viewport; at desktop they ended at y=859 inside 900 px.

## Findings

Recurring findings retain their review-1 IDs as required by the history check.

### Blocking

#### F-2-1 — Demo approval leaves the sandbox and can write to production storage

- **Quote/location:** `/demo`: “Demo — sample data, nothing is saved.” **Copy approval link** produces `/approve#…` without a demo marker. The approval page has no demo banner and enables **Accept and record receipt**.
- **Evidence:** A fresh live run opened the sample link and immediately called live `GET /api/approvals?packetDigest=…`. `src/main.ts:562` posts acceptance to `/api/approvals`; `api/src/functions/approvals.js:8,51` writes the persistent `worklogapprovals` table. Tests replace this API with memory.
- **Why:** A user enters an isolated demo and silently crosses into production persistence during its primary workflow.
- **Fix:** Keep a demo marker/banner on `/approve`, use an in-memory or TTL demo receipt store, reset that receipt with Reset demo, and test zero production-table writes through create/open/accept/download/reset.

#### F-1-3 — `pro-price` still does not test the hosted $12 charge

- **Quote/location:** “Pro costs $12 per user each month.” `tests/claims.spec.ts:310-323` checks the site label, features, and checkout `href` only.
- **Evidence:** Live checkout independently displayed “$12.00 / Month,” but the registered test never follows or fixtures checkout.
- **Why:** A checkout link does not prove the amount charged. Review 1 required this exact boundary.
- **Fix:** Follow a controlled Sociobot checkout response and assert product, `$12.00`, and monthly interval, while retaining the history assertion.

#### F-1-4 — `no-analytics` still stops before approval and receipt

- **Location:** `tests/claims.spec.ts:326-335` loads demo, exports CSV, and copies a link, but never opens it, accepts, reloads, or downloads the receipt.
- **Why:** Tracking added only to `/approve` or receipt handling would pass. Review 1 required the entire flow.
- **Fix:** Extend the tagged test through link opening, acceptance, receipt reload, and download with an exact path allowlist.

#### F-1-11 — Installed-app locality remains asserted without an installed-app privacy test

- **Quotes:** Hero: “Worklog details stay on this device.” Privacy: “Worklog Bridge keeps project data in the app or browser storage you control.”
- **Evidence:** `worklog-details-local` runs in a browser demo and asserts only the acceptance body. `no-repository-upload` tests the Rust collector, not packaged-app storage/network behavior.
- **Why:** Review 1 required packaged-app observation or narrower copy. The absolute hero line also omits that a shared link sends visible details to its recipient.
- **Fix:** Say “Worklogs are stored on this device until you share a private link.” Add a packaged-app claim capturing network and file writes through import, edit, export, and sharing.

#### F-1-14 — Published desktop packages remain unsigned

- **Quotes:** Download: “Unsigned preview: Confirm you trust this preview before opening it.” README says tag releases always build unsigned.
- **Evidence:** `v0.1.18` publishes DMG, MSI/EXE, AppImage, and DEB artifacts. The workflow defaults signing off and tag releases cannot enable it. The handoff calls this a known constraint.
- **Why:** The primary artifact is a desktop app. Only Download is labeled preview; landing and README present the product normally.
- **Fix:** Publish notarized macOS and Authenticode-signed Windows packages with verified provenance, or label the whole product and README as an unsigned preview.

#### F-2-2 — Back navigation loses the previous scroll position

- **Location:** `src/main.ts:615-622` calls `scrollTo(0, 0)` for pushed navigation and every `popstate`.
- **Evidence:** From landing y=1200, opening Privacy then Back restored `/` and h1 focus but returned y=0, not y=1200.
- **Why:** Back does not restore the visitor’s place, violating required history behavior.
- **Fix:** Save scroll/focus per history entry. Focus the new h1 on push; restore saved focus/scroll on Back/Forward. Add a mid-page test.

### High

#### F-2-3 — README signing-mode claims are unlisted

- **Quote/location:** README line 74 claims optional secrets, always-unsigned tag builds, manual signed/unsigned behavior, and failure on partial secrets.
- **Evidence:** `scripts/signing-mode.test.mjs` tests them, but `.factory/claims.json` has no signing-mode entry.
- **Fix:** Register one `release-signing-mode` claim selecting those tests, or remove the promises.

### Minor

#### F-2-4 — Non-root routes reuse the landing description

`/demo`, `/app`, `/privacy`, `/terms`, `/download`, and 404 all expose the landing meta/OG/Twitter description. `src/main.ts:607-612` updates only canonical and social titles. Add route-specific descriptions; for example, Privacy: “How Worklog Bridge stores and shares your data.”

#### F-2-5 — One concept has three names

Landing says “Review each line” and “client-ready weekly record”; README says “Rewrite each line”; the app and terminology table use “entry” and “worklog.” Use “Review each entry,” “Rewrite each entry…,” and “client-ready worklog.”

#### F-2-6 — README uses “server-attested” jargon

Rewrite “A client can accept a worklog once and download a server-attested receipt” as “A client can accept a worklog once and download a receipt that identifies the accepted worklog.”

#### F-2-7 — The 404 headings are metaphors

Delete “The receipt rail ends here” and replace “This page is not on the worklog” with “Page not found.” Keep the useful address explanation and **Return home**.

## Landing-page copy audit

Counts treat hyphenated terms, code, paths, and prices as one word. Multi-sentence elements are split. No sentence exceeds 22 words and no banned marketing term appears.

| ID | Exact text | Words | Result |
|---|---|---:|---|
| L1 | Turn activity into an approved worklog | 6 | OK |
| L2 | For freelancers who rebuild billable work from Git and calendars each week. | 12 | OK |
| L3 | Try it with sample data | 5 | OK; result-naming action |
| L4 | A filled weekly worklog opens next. | 6 | OK |
| L5 | Nothing is saved to your real data. | 7 | F-2-1 |
| L6 | Worklog details stay on this device | 6 | F-1-11 |
| L7 | Saved work stays available offline after the first visit | 9 | OK |
| L8 | Free editor and exports · Pro is $12 per user each month | 11 | F-1-3 test scope |
| L9 | Review selected Git commits and calendar events before sharing. | 9 | OK |
| L10 | Sample weekly worklog | 3 | OK |
| L11 | Preview the worklog before sharing | 5 | OK |
| L12 | The sample shows selected commits and events rewritten for a client. | 11 | OK |
| L13 | Select Git commits and calendar events | 6 | OK |
| L14 | Write what the client needs | 5 | OK |
| L15 | Keep the receipt | 3 | OK |
| L16 | The receipt identifies the exact worklog the client accepted. | 9 | OK |
| L17 | How it works | 3 | OK |
| L18 | Create and approve a worklog in three steps | 8 | OK |
| L19 | Select sources | 2 | OK |
| L20 | Point the desktop app at a Git repository. | 8 | OK |
| L21 | Pro users can also import an ICS calendar file. | 9 | OK |
| L22 | Review each line | 3 | F-2-5 |
| L23 | Set time, rewrite technical notes, and remove anything the client should not see. | 13 | F-2-5 |
| L24 | Send for approval | 3 | OK |
| L25 | Copy a private link. | 4 | OK |
| L26 | The client can accept it once and download a receipt signed by the receipt service. | 15 | OK |
| L27 | What Worklog Bridge collects | 4 | OK |
| L28 | Only selected commits and calendar events enter the worklog | 9 | OK |
| L29 | The app reads commit details and imported calendar fields. | 9 | OK |
| L30 | You review every shared word. | 5 | OK |
| L31 | Acceptance sends only the worklog identifier, supplied name, and server time. | 11 | OK |
| L32 | The worklog stays in the private link. | 7 | OK |
| L33 | What Worklog Bridge does not collect | 6 | OK |
| L34 | capture screens | 2 | OK |
| L35 | record keystrokes | 2 | OK |
| L36 | run a background timer | 4 | OK |
| L37 | upload a repository | 3 | OK |
| L38 | Monthly plan | 2 | OK |
| L39 | Free editor and Pro calendar tools | 6 | OK |
| L40 | Worklog Bridge Pro | 3 | OK |
| L41 | $12 / user / month | 3 | F-1-3 test scope |
| L42 | Keep the free editor and exports. | 6 | OK |
| L43 | Add calendar imports and saved approval history. | 7 | OK |
| L44 | ICS calendar import | 3 | OK |
| L45 | Saved approval history | 3 | OK |
| L46 | Start Pro subscription | 3 | OK; result-naming action |
| L47 | Subscriptions open in Sociobot checkout. | 5 | OK |
| L48 | Worklog Bridge turns selected Git and calendar activity into a client-ready weekly record. | 13 | F-2-5 |
| L49 | Generated hero art disclosed in the design record. | 8 | OK |

Other preview labels are all 1–4 words: the three screen labels, source names/counts, two sample entries and their metadata, “Accepted,” and “28 Aug.” Navigation labels are nouns, not action buttons.

## README copy audit

Every README sentence follows. No sentence exceeds 22 words. Technical names in setup/architecture are necessary identifiers.

| ID | Line | Exact sentence | Words | Result |
|---|---:|---|---:|---|
| R1 | 3 | Turn Git and calendar activity into a client-ready worklog. | 9 | OK |
| R2 | 5 | Worklog Bridge is for freelance developers and small consultancies that rebuild billable work each week. | 15 | OK |
| R3 | 5 | The desktop app reads commit dates, subjects, and hashes from a repository you choose for one Monday-to-Sunday week. | 18 | OK |
| R4 | 5 | Pro adds selected ICS calendar imports and saved approval history. | 10 | OK |
| R5 | 5 | You can rewrite, time, remove, and mark each entry ready before sharing. | 12 | OK |
| R6 | 7 | The free editor exports CSV. | 5 | OK |
| R7 | 7 | It creates a private approval link with the worklog after the `#`. | 11 | OK |
| R8 | 7 | Browsers do not send that part of the link to the server. | 12 | OK |
| R9 | 7 | A client can accept a worklog once and download a server-attested receipt. | 12 | F-2-6 |
| R10 | 7 | The receipt service receives only a SHA-256 worklog identifier and the supplied name. | 13 | OK |
| R11 | 7 | It never receives entries or repository content. | 7 | OK |
| R12 | 7 | Saved work remains available offline after the first visit. | 9 | OK |
| R13 | 7 | The demo sends worklog data only to this site. | 9 | F-2-1 for persistence |
| R14 | 7 | The product does not request camera, microphone, or screen access. | 10 | OK |
| R15 | 9 | Try the isolated sample at `/demo` or `https://worklog-approval-bridge.sociobot.in/demo`. | 8 | OK |
| R16 | 9 | It uses `demo:worklog-bridge:project` and never reads the real workspace key. | 10 | OK |
| R17 | 9 | In the installed app, select Load sample project on the empty first-run screen. | 13 | OK |
| R18 | 13 | Requirements: Node.js 22, npm, Rust stable, Git, and Tauri 2 system packages for your platform. | 15 | OK |
| R19 | 15 | On Ubuntu or Debian, desktop packaging also needs `file`: | 9 | OK |
| R20 | 28 | Open `http://localhost:1420/demo` for the sample or `/app` for a real workspace. | 11 | OK |
| R21 | 39 | Playwright 1.58.2 uses the browser path supplied by the factory worker. | 11 | OK |
| R22 | 39 | The claim registry is `.factory/claims.json`. | 5 | OK |
| R23 | 39 | The demo contract is `.factory/demo.md`. | 5 | OK |
| R24 | 43 | Open the installed app and name the client and week. | 10 | OK |
| R25 | 44 | Choose Load sample project to try it safely, or choose a local Git repository. | 14 | OK |
| R26 | 45 | Select matching weekly commits. | 4 | OK |
| R27 | 45 | Only hash, date, and subject enter the draft. | 8 | OK |
| R28 | 46 | Add manual entries or use Pro to select matching-week events from an ICS file. | 14 | OK |
| R29 | 47 | Rewrite each line, set its minutes, and mark it ready. | 10 | F-2-5 |
| R30 | 48 | Export CSV or copy the approval link. | 7 | OK |
| R31 | 49 | Ask the client to review, accept once, and download the receipt. | 11 | OK |
| R32 | 51 | The approval link contains visible worklog details. | 7 | OK |
| R33 | 51 | Treat it like a private document. | 6 | OK |
| R34 | 55 | Pro costs $12 per user each month. | 7 | F-1-3 scope |
| R35 | 55 | It adds ICS import and saved approval history. | 8 | OK |
| R36 | 55 | The subscription link opens Sociobot checkout. | 6 | OK |
| R37 | 55 | On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, removed from the address, and checked at most once per day. | 18 | OK |
| R38 | 55 | Users can also paste a license in the calendar import dialog. | 11 | OK |
| R39 | 55 | Offline Pro access needs a valid license check saved less than 24 hours ago. | 14 | OK |
| R40 | 55 | A token alone never unlocks Pro. | 6 | OK |
| R41 | 59 | Vanilla TypeScript and Vite power the interface. | 7 | OK |
| R42 | 60 | Tauri 2 and a small Rust command read Git metadata on the selected path. | 14 | OK |
| R43 | 61 | Local storage is split between real and demo namespaces. | 9 | OK |
| R44 | 62 | Approval payloads use URL fragments, which browsers do not send in HTTP requests. | 13 | OK |
| R45 | 63 | The same-origin receipt API stores only a worklog identifier, name, server time, receipt ID, and attestation. | 16 | OK |
| R46 | 64 | There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture. | 13 | F-1-4 scope |
| R47 | 66 | See `/privacy` and `/terms` in the site. | 7 | OK |
| R48 | 66 | The night-market design and generated-image provenance are recorded in `.factory/design.md`. | 10 | OK |
| R49 | 70 | `npm run build:site` writes `dist/site/index.html`. | 5 | OK |
| R50 | 70 | Deploy that directory as the static site. | 7 | OK |
| R51 | 70 | The release workflow builds macOS, Windows, and Linux bundles. | 9 | OK |
| R52 | 70 | A pushed version tag or manual full commit starts it. | 10 | OK |
| R53 | 70 | Each matrix job records bundle checksums and its source commit. | 10 | OK |
| R54 | 70 | Publishing stops if one artifact came from another commit. | 9 | OK |
| R55 | 70 | The workflow publishes `SHA256SUMS` and `latest.json` with the immutable source commit. | 11 | OK |
| R56 | 72 | The download page reads release metadata from the GitHub API. | 10 | OK |
| R57 | 72 | It shows that release files are not available yet when the API cannot provide an immutable release. | 17 | OK |
| R58 | 72 | It never fetches a GitHub redirect URL. | 7 | OK |
| R59 | 72 | The macOS and Linux `/install.sh` installer rejects a release file when its SHA-256 does not match the published checksum. | 19 | OK |
| R60 | 74 | Signing secrets are optional. | 4 | F-2-3 |
| R61 | 74 | Tag-triggered releases always build an unsigned preview, even when signing secrets are present. | 13 | F-2-3; F-1-14 |
| R62 | 74 | A manual release with `sign_release` set to `false` also builds an unsigned preview. | 13 | F-2-3; F-1-14 |
| R63 | 74 | Set `sign_release` to `true` only when all platform signing secrets are available. | 12 | F-2-3 |
| R64 | 74 | macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. | 11 | F-2-3 |
| R65 | 74 | Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. | 6 | F-2-3 |
| R66 | 74 | When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file. | 19 | F-2-3 |
| R67 | 76 | The anonymous receipt health endpoint is `/api/health`. | 7 | OK |
| R68 | 76 | It returns only service name, version, and a validated deployed source commit. | 12 | OK |
| R69 | 76 | It never returns configuration or storage settings. | 7 | OK |
| R70 | 76 | The static deployment supplies that commit as `WORKLOG_BUILD_COMMIT` or its standard `BUILD_SOURCEVERSION` value. | 13 | OK |
| R71 | 78 | After publishing a release, verify its tag, source commit, platform matrix, manifest, and a downloaded Linux checksum. | 17 | OK |
| R72 | 86 | MIT © 2026 Sociobot (Param Factory). | 5 | OK |

README headings — Worklog Bridge; Run locally; Test and build; How to use it; Pro license; Privacy and architecture; Release and deploy; License — all name their sections. Code blocks are commands, not sentences or buttons.

## Demo and sandbox evidence

- One click opened six Northstar Health entries: four Git, two calendar, five ready, one needing review, totaling 11h 45m and $1,586.25.
- Banner, Reset demo, and Start for real were visible.
- Editing an entry to “DEMO MUTATION,” then Reset, restored the original and removed the mutation.
- Seeded real workspace `QA REAL WORKSPACE` survived demo entry, edit, reset, and exit; leaving removed the `demo:` key.
- Offline reload retained the sample and showed the offline status. Requests were only to the product origin and hashed shell assets.
- The demo-generated approval link lost its banner and contacted the persistent API: F-2-1.

## Claim execution

Clean clone: `/tmp/worklog-review-2-Go0VZ5/repo`. Both npm installs reported zero vulnerabilities. Every exact command ran separately.

| Claim | Command | Result |
|---|---|---|
| offline-reload | `npm test -- --grep @claim:offline-reload` | PASS |
| csv-export | `npm test -- --grep @claim:csv-export` | PASS |
| local-demo | `npm test -- --grep @claim:local-demo` | PASS; misses reset/approval storage (F-2-1) |
| desktop-sample-project | `npm test -- --grep @claim:desktop-sample-project` | PASS |
| entry-review | `npm test -- --grep @claim:entry-review` | PASS |
| free-editor | `npm test -- --grep @claim:free-editor` | PASS |
| approval-receipt | `npm test -- --grep @claim:approval-receipt` | PASS with mocked storage |
| worklog-details-local | `npm test -- --grep @claim:worklog-details-local` | PASS; installed scope incomplete (F-1-11) |
| no-surveillance | `npm test -- --grep @claim:no-surveillance` | PASS |
| calendar-import | `npm test -- --grep @claim:calendar-import` | PASS |
| git-metadata | `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` | PASS |
| no-repository-upload | `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload` | PASS |
| license-unlock | `npm test -- --grep @claim:license-unlock` | PASS |
| sample-counts | `npm test -- --grep @claim:sample-counts` | PASS |
| pro-price | `npm test -- --grep @claim:pro-price` | PASS; checkout amount omitted (F-1-3) |
| no-analytics | `npm test -- --grep @claim:no-analytics` | PASS; approval omitted (F-1-4) |
| release-discovery | `npm test -- --grep @claim:release-discovery` | PASS |
| public-health-fields | `node --test --test-name-pattern @claim:public-health-fields api/test/receipt-service.test.mjs` | PASS |
| installer-sha256 | `node --test --test-name-pattern @claim:installer-sha256 scripts/installer-verification.test.mjs` | PASS |
| release-provenance | `node --test --test-name-pattern @claim:release-provenance scripts/release-provenance.test.mjs` | PASS |

The full clean-clone `npm test` passed 27 Node/script and 33 Chromium tests. `npm run build` produced `dist/site`; initial JS was 14.77 KB gzip. `verify:live` and `verify:release` passed for deployed/released `030f1ad3d775d5b618bc8999b8e26dd2f3e2b7a8`.

Signing behavior in F-2-3 is the only unlisted README claim group. The demo no-save promise lacks a production-like acceptance-storage test. No command exit failure was hidden; the identified problem is insufficient test scope.

## History verification

Every review-1 finding was checked live and in current source.

| Earlier ID | Verification | Result |
|---|---|---|
| F-1-1 | `/app` has **Load sample project**; Tauri opens `/app`; one action reaches six-entry demo. | Fixed |
| F-1-2 | Tagged test covers valid, absent, invalid, expired, revoked, offline, and 24-hour states. | Fixed |
| F-1-3 | History added; hosted amount still untested. | **BLOCKING — repeated** |
| F-1-4 | Allowlist added; approval/receipt still omitted. | **BLOCKING — repeated** |
| F-1-5 | Registered test covers edit, minutes, ready, removal, reload, CSV. | Fixed |
| F-1-6 | Cross-device license text removed. | Fixed |
| F-1-7 | Merchant/refund/cancellation text removed. | Fixed |
| F-1-8 | Identity limitation kept only in Terms. | Fixed as specified |
| F-1-9 | Release discovery registered and tested. | Fixed |
| F-1-10 | Health fields registered and exact keys tested. | Fixed |
| F-1-11 | Download narrowed; broader locality claim lacks packaged-app test. | **BLOCKING — repeated** |
| F-1-12 | Privacy gives explicit manual desktop-data removal. | Fixed |
| F-1-13 | Unlicensed real workspace adds and exports an entry. | Fixed |
| F-1-14 | Download says preview; current public desktop packages remain unsigned. | **BLOCKING — repeated** |
| F-1-15 | Decorative hero eyebrow removed. | Fixed |
| F-1-16 | Hero caption names Git/calendar inputs. | Fixed |
| F-1-17 | “Sample weekly worklog.” | Fixed |
| F-1-18 | “Preview the worklog before sharing.” | Fixed |
| F-1-19 | Preview sentence names commits/events and client. | Fixed |
| F-1-20 | “Traces” heading removed. | Fixed |
| F-1-21 | Landing receipt text names the accepted worklog. | Fixed |
| F-1-22 | Three-step heading names worklog creation/approval. | Fixed |
| F-1-23 | Privacy label names collection. | Fixed |
| F-1-24 | Privacy heading names commits/events. | Fixed |
| F-1-25 | Negative privacy heading is complete. | Fixed |
| F-1-26 | Pricing heading names the tools. | Fixed |
| F-1-27 | Offline Pro sentence split/simplified. | Fixed |
| F-1-28 | Release workflow sentence split. | Fixed |
| F-1-29 | Subjective “calm” copy removed. | Fixed |
| F-1-30 | README names dates, subjects, hashes. | Fixed |
| F-1-31 | README uses “only to this site.” | Fixed for origin wording |
| F-1-32 | README explains the `#` portion. | Fixed |
| F-1-33 | “Packet digest” replaced with the specific identifier. | Fixed |
| F-1-34 | Pricing label is “Monthly plan.” | Fixed |

Prior-handoff checks: live/release provenance resolves `v0.1.18` to `030f1ad…`; native claims run without GUI packages; mobile first-screen support text is at least 16 px; full suite/build claims were reconfirmed. The handoff’s known unsigned gap remains F-1-14.

## Structure, accessibility, links, and identity

- Distinct per-route titles, one h1/main, `lang=en`, canonicals, social image metadata, SVG/favicon, and Apple icon are present. Social image is 1200 × 630.
- The designed missing route returns HTTP 404 and links home; its copy is F-2-7.
- Push navigation focuses the h1 and goes top. Back restores route/h1 but not scroll, F-2-2.
- Every discovered internal route returned 200 except intentional 404. Checkout, Sociobot, GitHub release, and Linux asset resolved 200; mail links were explicit exceptions.
- Header/footer, Privacy, and Terms are consistent.
- `verify-url.sh` passed root/demo with no console errors. Live Axe at 390 and 1440 found zero violations on root, demo, Privacy, Terms, Download, and 404.
- No 390 px overflow. Full tests passed touch target, keyboard, dialog focus, reduced-motion, offline, and console checks.
- Night-market receipt rails, cyan/amber/mint states, ticket edges, hard shadows, mono metadata, and original art form a distinct non-template identity.
- CSP/security headers are response headers. Sitemap, robots, service worker, manifest, and assets resolve. Route descriptions remain generic, F-2-4.

## Missed leverage

No separate finding. The brief’s import/export loop exists: Git, ICS, manual edit, CSV, private sharing, and receipts. AI is not necessary and would add privacy/cost; no decorative AI or provider key exists. Sync would conflict with local-first scope unless optional.

## What would make this perfect

Keep demo approval entirely sandboxed; complete hosted-price, full-flow analytics, and packaged-app privacy tests; sign desktop packages or label the whole product preview; restore Back/Forward state; register signing claims; set route descriptions; standardize entry/worklog terms; and replace the jargon and 404 metaphors. Rerun every claim command, full suite/build, production-like demo storage audit, packaged-app privacy capture, link crawl, and accessibility checks. Only a zero-finding rerun should pass.

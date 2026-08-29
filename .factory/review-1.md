# Adversarial first-read review 1 — FAIL

Reviewed 29 August 2026 against repository base `4aafb0e1a9f0a8694e6523391490eedeb07d7735` and the live site at <https://worklog-approval-bridge.sociobot.in>.

## Verdict

**FAIL.** The public landing page is clear and its browser demo is realistic, isolated, resettable, and usable. However, the installed desktop product opens on an empty workspace without the required first-run **Load sample project** action. There are also incomplete claim tests, unlisted claims, an unsigned desktop release, and plain-language defects. A pass requires zero findings and no untested claim.

Finding count: 1 blocking, 13 high, and 20 minor.

## Cold first read

Fresh Chromium contexts were used at 390 × 844 and 1440 × 900. Nothing was scrolled before recording this interpretation.

| Question | Answer from the first screen | Result |
|---|---|---|
| What does it do? | It turns selected Git and calendar activity into a weekly worklog that a client can approve. | PASS |
| For whom? | Freelancers who reconstruct billable work each week. | PASS |
| What should I click first? | **Try it with sample data**; the adjacent text says a filled worklog opens and real data is untouched. | PASS |

The exact text that supplied those answers was “Turn activity into an approved worklog,” “For freelancers who rebuild billable work from Git and calendars each week,” and “Try it with sample data.” The three required facts were visible above the fold at both sizes. No first-read blocking finding applies.

## Findings

Findings are ordered by severity. Every proposed rewrite is intentionally direct; it is not alternate marketing copy.

### Blocking

#### F-1-1 — The installed app has no first-run sample-project action

- **Location/quote:** Tauri opens `/app` (`src-tauri/tauri.conf.json`), whose empty state says “No work entries yet” and offers “Add first entry.” The only sample-related control is the header link “Demo.”
- **Why this fails:** The artifact class is `desktop-app`. The demo-sandbox contract requires **Load sample project** on the first-run screen. A new desktop user is dropped into empty client, rate, source, and entry fields and is not told that “Demo” loads a complete local sample. This is a weak desktop demo even though the website CTA correctly opens `/demo` in one click.
- **Concrete fix:** Put a primary **Load sample project** action beside **Add first entry** in the installed app’s empty state. It must load the shipped six-entry sample into the `demo:` namespace, show the persistent demo banner, preserve the real namespace, and support Reset demo and Start for real. Add a Tauri/Playwright claim that begins at the configured first-run URL and verifies that one action opens the populated sample.

### High

#### F-1-2 — `license-unlock` does not test the claim registered for it

- **Location/quote:** `.factory/claims.json`: “Only a current valid Sociobot license enables Pro features; a valid verdict is cached for one day.” Its sandbox promises valid, invalid, expired, revoked, absent, offline, and 24-hour-boundary verdicts.
- **Why this fails:** `npm test -- --grep @claim:license-unlock` runs one tagged browser test. That test covers a valid response and a same-session reload only. The invalid, absent, expired, revoked, offline, and boundary cases are separate untagged regressions and are skipped by the registry command.
- **Concrete fix:** Move every promised state into the single `@claim:license-unlock` test, or change the registered command/tag so it selects the complete license suite. Assert Pro controls and saved history are unavailable in every invalid state.

#### F-1-3 — `pro-price` checks labels, not the paid outcome

- **Location/quote:** `.factory/claims.json`: “Pro costs $12 per user each month and includes ICS import and saved approval history.”
- **Why this fails:** The tagged test only reads `$12 / user / month`, two feature labels, and the checkout URL. It does not verify the hosted checkout amount or that a licensed user can save and later see approval history. The live checkout did show `$12.00 / Month`, but that evidence is outside the registered test.
- **Concrete fix:** Extend `@claim:pro-price` to follow the Sociobot route in a controlled fixture and assert the $12 monthly item. In an isolated licensed workspace, create an approval link, reload, and assert its saved history record is present.

#### F-1-4 — `no-analytics` would miss same-origin analytics

- **Location/quote:** `.factory/claims.json`: “The sample flow sends no analytics or advertising request.”
- **Why this fails:** The tagged test asserts only that every request has the product origin. A new request to `/analytics`, `/events`, or another same-origin collector would still pass.
- **Concrete fix:** Assert an explicit request-path allowlist for the full demo, export, sharing, acceptance, and receipt flow. Fail on analytics/advertising paths regardless of origin.

#### F-1-5 — Entry review capabilities are an unlisted claim

- **Location/quote:** Landing: “Set time, rewrite technical notes, and remove anything the client should not see.” README: “Every entry can be rewritten, timed, removed, or marked ready before sharing.”
- **Why this fails:** No `claims.json` entry tests the full edit, duration, removal, and ready-state workflow.
- **Concrete fix:** Add an `entry-review` claim and one demo test that edits text, changes minutes, toggles readiness, removes an entry, reloads, and verifies the resulting export/link. Otherwise remove the capability sentence.

#### F-1-6 — Cross-device license use is an unlisted claim

- **Location/quote:** Landing pricing list: “License use on another device.”
- **Why this fails:** `license-unlock` verifies a token in one browser store. It does not prove that the same license may be used on another device or state any device limit.
- **Concrete fix:** State the actual device allowance and add a claim/test using two clean client stores, or remove this pricing bullet.

#### F-1-7 — Merchant, cancellation, and refund statements are unlisted claims

- **Location/quote:** Landing: “Sociobot/Dodo is the merchant of record. Cancel under its checkout terms.” README: “Checkout uses the Sociobot billing API; no payment provider is embedded here.” Privacy: “Checkout and refunds are handled by Sociobot/Dodo.” Terms: “Billing, cancellation, and refunds follow the terms shown during checkout.”
- **Why this fails:** `pro-price` checks only the href. It does not establish merchant identity, cancellation/refund handling, or the absence of a directly embedded provider.
- **Concrete fix:** Add a billing-route claim that verifies the Sociobot response, hosted merchant identity, price, and linked cancellation/refund terms. Split or remove any clause the test cannot establish.

#### F-1-8 — The legal-identity limitation is unlisted

- **Location/quote:** README: “It does not verify the approver's legal identity.” Terms: “It does not verify legal identity or replace legal advice.”
- **Why this fails:** This is an important reliance boundary, but no registered test confirms that acceptance uses only a supplied name and has no identity-verification step.
- **Concrete fix:** Add the limitation to the approval-receipt claim and assert the exact acceptance fields and absence of an identity/authentication exchange, or state the limitation only in terms without presenting it as verified product behavior.

#### F-1-9 — Download-page network behavior is unlisted

- **Location/quote:** README: “The site reads release metadata from the GitHub API and falls back to a calm publishing message. It never fetches a GitHub redirect URL.”
- **Why this fails:** Untagged download tests exist, but neither statement has a `claims.json` entry. The phrase “calm publishing message” is also not an observable result.
- **Concrete fix:** Register a `release-discovery` claim whose test asserts the exact API request, selected asset, no redirect probe, and fallback copy. Replace “calm publishing message” with “a message that says the release files are not available yet.”

#### F-1-10 — The health-endpoint disclosure is unlisted

- **Location/quote:** README: “It returns only service name, version, and a validated deployed source commit; it never returns configuration or storage settings.”
- **Why this fails:** An untagged regression checks this response, but the statement has no claim registry entry and therefore is not selected or reported as a claim.
- **Concrete fix:** Add `public-health-fields` to `claims.json` and point it at the existing regression after tagging it. Assert the exact response-key allowlist.

#### F-1-11 — Installed-app locality is not tested in the desktop sandbox

- **Location/quote:** Download page: “Your worklogs remain local after installation.”
- **Why this fails:** The browser privacy claim tests the web demo. The Rust claims test Git access. No registered installed-app test observes storage and outbound traffic for editing, export, and link creation inside Tauri.
- **Concrete fix:** Add a desktop privacy claim that runs the packaged app with an isolated profile and captures network/file writes through the main flow, or narrow the sentence to the web behavior already proved.

#### F-1-12 — Uninstall behavior is an unlisted platform claim

- **Location/quote:** Privacy: “Uninstalling the desktop app removes access to its local data.”
- **Why this fails:** Uninstall persistence differs by platform, and no registered installer/uninstaller test checks it. “Removes access” is also unclear about whether data remains on disk.
- **Concrete fix:** Say exactly whether each installer deletes or retains app data and add platform uninstall tests. If deletion is not guaranteed, replace it with manual deletion instructions.

#### F-1-13 — “Free” is asserted but not tested as a tier boundary

- **Location/quote:** Landing: “Free core tools · Pro is $12 per user each month” and “Keep the free editor and exports.” README: “The free editor exports CSV.”
- **Why this fails:** `csv-export` proves export in demo mode, and `pro-price` reads pricing copy. Neither verifies that the real, unlicensed workspace permits editing and CSV export without checkout or a license token.
- **Concrete fix:** Add a `free-editor` claim that starts with empty real storage and no license, creates/edits an entry, and exports it. Keep the word “free” only after this passes.

#### F-1-14 — Published desktop installers are unsigned

- **Location/quote:** Download page: “Unsigned preview: The first release is unsigned. Your operating system may ask you to confirm that you trust it.” The earlier handoff lists signing as operator work.
- **Why this fails:** The primary artifact is a desktop app. Unsigned macOS and Windows packages trigger trust warnings and leave a material release task unfinished. The disclosure is honest, but this review’s pass standard is “nothing left to do.”
- **Concrete fix:** Sign and notarize the macOS release, Authenticode-sign Windows packages, publish signature provenance, and add verification to the release gate. Until then, label the whole product as a preview rather than only the installer notice.

### Minor copy findings

| ID | Exact quote/location | Why it fails plain words | Concrete rewrite |
|---|---|---|---|
| F-1-15 | Hero eyebrow: “Local work evidence · client approval” | Decorative label; “work evidence” is abstract and duplicates the headline. | Delete it. |
| F-1-16 | Hero caption: “Your selected traces move through one review rail.” | “Traces” and “review rail” are unexplained metaphors. | “Review selected Git commits and calendar events before sharing.” |
| F-1-17 | Preview eyebrow: “A weekly record, already in motion” | Mood heading that does not name the section. | “Sample weekly worklog” |
| F-1-18 | Preview heading: “See the whole handoff before you share” | “Handoff” is jargon and the heading does not say what is previewed. | “Preview the worklog before sharing” |
| F-1-19 | Preview: “The sample moves from selected evidence to plain client language.” | “Moves” and “evidence” are abstract; “plain” is an unproved adjective. | “The sample shows selected commits and events rewritten for a client.” |
| F-1-20 | Walkthrough heading: “Choose the traces” | “Traces” conflicts with “sources,” “activity,” “evidence,” and “entries.” | “Select Git commits and calendar events” |
| F-1-21 | Walkthrough: “A server-attested digest records the packet the client accepted.” | “Server-attested,” “digest,” and “packet” are unexplained in first-read copy. | “The receipt identifies the exact worklog the client accepted.” |
| F-1-22 | How-it-works heading: “From evidence to answer in three steps” | “Answer” does not name the result, and “evidence” changes the term again. | “Create and approve a worklog in three steps” |
| F-1-23 | Privacy eyebrow: “A boundary, not a tracker” | Mood/metaphor heading; it does not name the section. | “What Worklog Bridge collects” |
| F-1-24 | Privacy heading: “Only chosen evidence enters the worklog” | “Evidence” is vague and inconsistent with the concrete source names. | “Only selected commits and calendar events enter the worklog” |
| F-1-25 | Privacy heading: “Worklog Bridge does not” | It is incomplete when read as a heading list. | “What Worklog Bridge does not collect” |
| F-1-26 | Pricing heading: “Start free, add recurring workflows” | “Recurring workflows” does not name calendar import or saved history. | “Free editor and Pro calendar tools” |
| F-1-27 | README: “Offline Pro access requires a cached, unexpired valid verdict that is less than 24 hours old; a token by itself never unlocks Pro.” (23 words) | Exceeds the 22-word cap and uses internal “verdict” language. | “Offline Pro access needs a valid license check saved less than 24 hours ago. A token alone never unlocks Pro.” |
| F-1-28 | README: “`.github/workflows/release.yml` builds unsigned macOS Intel/Apple Silicon, Windows, and Linux bundles from the pushed `v*` tag or a nominated full commit on manual dispatch.” (23 words) | Exceeds the 22-word cap and packs platforms, triggers, and provenance into one sentence. | “The release workflow builds unsigned macOS, Windows, and Linux bundles. A pushed version tag or manual full commit starts it.” |
| F-1-29 | README: “falls back to a calm publishing message” | “Calm” is mood copy and cannot be verified. | “shows that release files are not available yet” |
| F-1-30 | README: “The Tauri desktop app reads metadata from a repository the user names for the chosen Monday-to-Sunday week.” | Framework-first wording and unexplained “metadata” obscure the user action. | “The desktop app reads commit dates, subjects, and hashes from a repository you choose for one Monday-to-Sunday week.” |
| F-1-31 | README: “The demo sends no worklog data to another origin.” | “Origin” is browser jargon in user-facing privacy copy. | “The demo sends worklog data only to this site.” |
| F-1-32 | README: “It also creates a private approval link whose worklog is stored in the URL fragment.” | “URL fragment” is unexplained jargon. | “It puts the worklog after the `#` in a private approval link, so browsers do not send it to the server.” |
| F-1-33 | README: “The receipt service receives only the packet digest and supplied name, never worklog entries or repository content.” | “Packet digest” is undefined on first use. | “The receipt service receives only a SHA-256 worklog identifier and the supplied name. It never receives entries or repository content.” |
| F-1-34 | Pricing eyebrow: “Simple monthly plan” | “Simple” is a promotional adjective and gives no plan detail. | “Monthly plan” |

## Landing-page copy audit

Counts treat hyphenated terms and paths as one word and ignore decorative separators. Sample values and dates are included where they communicate product behavior. `OK` means only that the unit has no copy finding; factual coverage is assessed separately above.

| # | Landing copy | Words | Result |
|---:|---|---:|---|
| 1 | Local work evidence · client approval | 5 | F-1-15 |
| 2 | Turn activity into an approved worklog | 6 | OK |
| 3 | For freelancers who rebuild billable work from Git and calendars each week. | 12 | OK |
| 4 | Try it with sample data | 5 | OK; result-naming action |
| 5 | A filled weekly worklog opens next. | 6 | OK |
| 6 | Nothing is saved to your real data. | 7 | OK |
| 7 | Worklog details stay on this device | 6 | OK |
| 8 | Saved work stays available offline after the first visit | 9 | OK |
| 9 | Free core tools · Pro is $12 per user each month | 10 | F-1-13 |
| 10 | Your selected traces move through one review rail. | 8 | F-1-16 |
| 11 | A weekly record, already in motion | 6 | F-1-17 |
| 12 | See the whole handoff before you share | 7 | F-1-18 |
| 13 | The sample moves from selected evidence to plain client language. | 10 | F-1-19 |
| 14 | Screen 01 · Select | 3 | OK |
| 15 | Choose the traces | 3 | F-1-20 |
| 16 | 4 Git commits selected | 4 | OK |
| 17 | 2 client events selected | 4 | OK |
| 18 | Screen 02 · Review | 3 | OK |
| 19 | Write what the client needs | 5 | OK |
| 20 | Added audit log export | 4 | OK; sample entry |
| 21 | Reduced dashboard query time | 4 | OK; sample entry |
| 22 | Screen 03 · Approve | 3 | OK |
| 23 | Keep the receipt | 3 | OK |
| 24 | A server-attested digest records the packet the client accepted. | 9 | F-1-21 |
| 25 | How it works | 3 | OK |
| 26 | From evidence to answer in three steps | 7 | F-1-22 |
| 27 | Select sources | 2 | OK |
| 28 | Point the desktop app at a Git repository. | 8 | OK |
| 29 | Pro users can also import an ICS calendar file. | 9 | OK |
| 30 | Review each line | 3 | OK |
| 31 | Set time, rewrite technical notes, and remove anything the client should not see. | 13 | F-1-5 |
| 32 | Send for approval | 3 | OK |
| 33 | Copy a private link. | 4 | OK |
| 34 | The client can accept it once and download a server-attested receipt. | 12 | OK |
| 35 | A boundary, not a tracker | 5 | F-1-23 |
| 36 | Only chosen evidence enters the worklog | 6 | F-1-24 |
| 37 | The app reads commit metadata and imported calendar fields. | 9 | OK |
| 38 | You review every shared word. | 5 | OK |
| 39 | Acceptance sends only the packet digest, supplied name, and server time. | 11 | OK |
| 40 | The worklog stays in the private link. | 7 | OK |
| 41 | Worklog Bridge does not | 4 | F-1-25 |
| 42 | capture screens | 2 | OK |
| 43 | record keystrokes | 2 | OK |
| 44 | run a background timer | 4 | OK |
| 45 | upload a repository | 3 | OK |
| 46 | Simple monthly plan | 3 | F-1-34 |
| 47 | Start free, add recurring workflows | 5 | F-1-26 |
| 48 | Worklog Bridge Pro | 3 | OK |
| 49 | $12 / user / month | 4 | OK |
| 50 | Keep the free editor and exports. | 6 | F-1-13 |
| 51 | Add calendar imports and saved approval history. | 7 | F-1-3 |
| 52 | ICS calendar import | 3 | OK |
| 53 | Saved approval packet history | 4 | F-1-3 |
| 54 | License use on another device | 5 | F-1-6 |
| 55 | Start Pro subscription | 3 | OK; result-naming action |
| 56 | Sociobot/Dodo is the merchant of record. | 7 | F-1-7 |
| 57 | Cancel under its checkout terms. | 5 | F-1-7 |
| 58 | Worklog Bridge turns selected work traces into a client-ready weekly record. | 11 | OK |
| 59 | Generated hero art disclosed in the design record. | 7 | OK |

Navigation labels (“Demo,” “Download,” “Pricing,” “Privacy,” “Terms,” and “Built by Param Factory”) are links, not sentences or action buttons. The two landing-page CTA labels are result-naming verbs. No landing sentence exceeds 22 words and no banned marketing word appears.

## README copy audit

Code blocks are commands rather than sentences and are excluded. All seven README headings—Run locally, Test and build, How to use it, Pro license, Privacy and architecture, Release and deploy, and License—name their sections and pass.

| # | README sentence | Words | Result |
|---:|---|---:|---|
| 1 | Turn selected Git and calendar activity into a client-ready weekly worklog. | 11 | OK |
| 2 | Worklog Bridge is for freelance developers and small consultancies that reconstruct billable work at week-end. | 15 | OK |
| 3 | The Tauri desktop app reads metadata from a repository the user names for the chosen Monday-to-Sunday week. | 17 | F-1-30 |
| 4 | A Pro license adds selected ICS calendar imports and saved approval history. | 12 | F-1-3 |
| 5 | Every entry can be rewritten, timed, removed, or marked ready before sharing. | 12 | F-1-5 |
| 6 | The free editor exports CSV. | 5 | F-1-13 |
| 7 | It also creates a private approval link whose worklog is stored in the URL fragment. | 15 | F-1-32 |
| 8 | A client can accept a packet once and download a server-attested receipt. | 12 | OK |
| 9 | The receipt service receives only the packet digest and supplied name, never worklog entries or repository content. | 17 | F-1-33 |
| 10 | Saved work remains available offline after the first visit. | 9 | OK |
| 11 | The demo sends no worklog data to another origin. | 9 | F-1-31 |
| 12 | The product does not request camera, microphone, or screen access. | 10 | OK |
| 13 | Try the isolated sample at `/demo` or `https://worklog-approval-bridge.sociobot.in/demo`. | 8 | OK |
| 14 | It uses the `demo:worklog-bridge:project` storage key and never reads the real workspace key. | 13 | OK; covered behaviorally by local-demo |
| 15 | Requirements: Node.js 22, npm, Rust stable, Git, and the Tauri 2 system packages for your platform. | 16 | OK |
| 16 | On Ubuntu/Debian Linux, desktop packaging also needs `file` because linuxdeploy's AppImage generator uses it. | 14 | OK |
| 17 | Open `http://localhost:1420/demo` for sample data or `/app` for an empty real workspace. | 12 | OK |
| 18 | Playwright 1.58.2 uses the browser path supplied by the factory worker. | 11 | OK |
| 19 | The claim registry is `.factory/claims.json`, and the demo contract is `.factory/demo.md`. | 11 | OK |
| 20 | Open the installed app and name the client and week. | 10 | OK |
| 21 | Enter a local repository path, then choose Read Git. | 9 | OK |
| 22 | Select the matching weekly commits; only hash, date, and subject metadata enter the draft. | 14 | OK |
| 23 | Add manual entries or use Pro to select matching-week events from an ICS file. | 14 | OK |
| 24 | Rewrite each line, set its minutes, and mark it ready. | 10 | F-1-5 |
| 25 | Export CSV or copy the approval link. | 7 | OK |
| 26 | Ask the client to review, accept once, and download the server-attested receipt. | 12 | OK |
| 27 | The approval link contains visible worklog details. | 7 | OK |
| 28 | Treat it like a private document. | 6 | OK |
| 29 | It does not verify the approver's legal identity. | 8 | F-1-8 |
| 30 | Pro costs $12 per user each month. | 7 | F-1-3 |
| 31 | Checkout uses the Sociobot billing API; no payment provider is embedded here. | 12 | F-1-7 |
| 32 | On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, stripped from the address, and verified at most once per day. | 18 | OK |
| 33 | Users can also paste a license in the calendar import dialog. | 11 | OK |
| 34 | Offline Pro access requires a cached, unexpired valid verdict that is less than 24 hours old; a token by itself never unlocks Pro. | 23 | F-1-27 |
| 35 | Vanilla TypeScript and Vite power the interface. | 7 | OK; implementation note |
| 36 | Tauri 2 and a small Rust command read Git metadata on the selected path. | 14 | OK |
| 37 | Local storage is split between real and demo namespaces. | 9 | OK |
| 38 | Approval payloads use URL fragments, which browsers do not send in HTTP requests. | 13 | F-1-32 |
| 39 | The managed same-origin receipt API stores only a packet digest, name, server timestamp, receipt ID, and attestation in Azure Table storage. | 21 | OK; technical architecture section |
| 40 | There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture. | 13 | F-1-4 for analytics test scope; other clauses are covered |
| 41 | See `/privacy` and `/terms` in the site. | 7 | OK |
| 42 | The night-market design and generated-image provenance are recorded in `.factory/design.md`. | 10 | OK |
| 43 | `npm run build:site` writes `dist/site/index.html`. | 5 | OK |
| 44 | Deploy that directory as the static site. | 7 | OK |
| 45 | `.github/workflows/release.yml` builds unsigned macOS Intel/Apple Silicon, Windows, and Linux bundles from the pushed `v*` tag or a nominated full commit on manual dispatch. | 23 | F-1-28 |
| 46 | Each matrix job records its own bundle checksums and source commit. | 11 | OK |
| 47 | Publishing stops if one artifact came from another commit. | 9 | OK |
| 48 | The workflow publishes `SHA256SUMS` and `latest.json`; every manifest file records the immutable source commit. | 14 | OK |
| 49 | The site reads release metadata from the GitHub API and falls back to a calm publishing message. | 17 | F-1-9, F-1-29 |
| 50 | It never fetches a GitHub redirect URL. | 7 | F-1-9 |
| 51 | The macOS and Linux `/install.sh` installer rejects a release file when its SHA-256 does not match the published checksum. | 19 | OK |
| 52 | The anonymous receipt health endpoint is `/api/health`. | 7 | F-1-10 |
| 53 | It returns only service name, version, and a validated deployed source commit; it never returns configuration or storage settings. | 19 | F-1-10 |
| 54 | The static deployment supplies that commit as `WORKLOG_BUILD_COMMIT` (or its standard `BUILD_SOURCEVERSION` value). | 16 | OK |
| 55 | After publishing a release, verify its tag, source commit, platform matrix, manifest, and a downloaded Linux checksum. | 17 | OK |
| 56 | MIT © 2026 Sociobot (Param Factory). | 5 | OK |

Average README sentence length is 11.9 words. Two sentences exceed the 22-word hard cap.

## Browser demo and sandbox evidence

- The first-screen CTA opened `/demo` in one click.
- The first demo screen already showed Northstar Health, four Git entries, two calendar entries, 11 h 45 m, and realistic summaries.
- The persistent banner read “Demo — sample data, nothing is saved” and exposed Reset demo and Start for real.
- After changing “Investigated slow dashboard queries” to “DEMO MUTATION,” Reset demo restored the original entry.
- A separately seeded real workspace named `QA REAL WORKSPACE` survived demo entry, mutation, reset, and Start for real. The demo key was discarded on exit.
- The live request log through load, CSV export, approval-link creation, and offline reload contained only the product origin. No request body contained sample worklog text.
- After the service worker was ready, offline reload retained the sample and showed “You are offline. Saved work remains available.”
- Browser console/page errors were zero in the landing, demo, export, sharing, and offline checks.

This passes the web sandbox checks. F-1-1 remains because the desktop first-run presentation does not meet the desktop-specific demo contract.

## Claim execution

The commands below were run from a separate local clone at `/tmp/worklog-review-1-njNpCa/repo`. `npm ci` and `npm --prefix api ci` reported zero vulnerabilities. The two Rust commands initially stopped before test execution because the base image lacked the README-listed Tauri packages; after installing those documented packages, both exact commands passed.

| Claim ID | Registered command | Result | Evidence |
|---|---|---|---|
| offline-reload | `npm test -- --grep @claim:offline-reload` | PASS | Demo reloaded offline with saved entries. |
| csv-export | `npm test -- --grep @claim:csv-export` | PASS | Header plus six records. |
| local-demo | `npm test -- --grep @claim:local-demo` | PASS | Demo/real isolation and product-origin request set. |
| approval-receipt | `npm test -- --grep @claim:approval-receipt` | PASS | Single receipt, reload, download, and tamper state. |
| worklog-details-local | `npm test -- --grep @claim:worklog-details-local` | PASS | Exact two-field acceptance body. |
| no-surveillance | `npm test -- --grep @claim:no-surveillance` | PASS | No media/display/timer calls or other origin. |
| calendar-import | `npm test -- --grep @claim:calendar-import` | PASS | Only in-week event imported. |
| git-metadata | `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` | PASS | One temporary local commit. |
| no-repository-upload | `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload` | PASS | Loopback remote received no connection. |
| license-unlock | `npm test -- --grep @claim:license-unlock` | PASS command; incomplete assertion | F-1-2. |
| sample-counts | `npm test -- --grep @claim:sample-counts` | PASS | Four Git plus two calendar entries. |
| pro-price | `npm test -- --grep @claim:pro-price` | PASS command; incomplete assertion | F-1-3. |
| no-analytics | `npm test -- --grep @claim:no-analytics` | PASS command; incomplete assertion | F-1-4. |
| installer-sha256 | `node --test --test-name-pattern @claim:installer-sha256 scripts/installer-verification.test.mjs` | PASS | Match accepted; mismatch rejected. |
| release-provenance | `node --test --test-name-pattern @claim:release-provenance scripts/release-provenance.test.mjs` | PASS | Fixture matrix stayed on one commit. |

The complete `npm test` suite passed: 21 Node tests and 29 Chromium tests. `npm run build` passed and wrote `dist/site`; initial JavaScript was 14.90 KB gzip across both chunks.

## History verification

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files. The current handoff contains verification-12 and repair-12 history. Its prior repair items were checked in both live behavior and source:

| Earlier handoff item | Verification | Result |
|---|---|---|
| Release and deployed API provenance | `verify:live` and `verify:release` both resolved v0.1.13 to `1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3`. | Fixed |
| Sitemap omitted `/app` | Live and source sitemap list `/app` and exclude private `/approve` packets. | Fixed |
| Exact predecessor regressions | The full Node suite passed the verification-11 predecessor tests. | Fixed |
| Footer version was hand-written | Live footer, package, Tauri config, and health endpoint report 0.1.13; source injects the package version at build. | Fixed |
| Unsigned packages | Live Download page still labels the release unsigned. | Unresolved; F-1-14 |

## Structure, links, accessibility, and visual identity

- Root title is `Worklog Bridge — Build client-ready worklogs` (48 characters). Demo, App, Privacy, Terms, Download, Approval, and 404 routes set distinct `Thing — Worklog Bridge` titles.
- Every checked route has `lang=en`, one `main`, one `h1`, a canonical URL, description, Open Graph/Twitter image metadata, SVG favicon, and Apple touch icon.
- `/missing-page` returns a genuine HTTP 404 and the designed “This page is not on the worklog” recovery screen.
- SPA navigation moved focus to the new `h1`; Back restored the prior route and focused its `h1`.
- Every discovered internal route and asset returned 200, except the intentional 404. Sociobot, hosted checkout, GitHub release, and AppImage links resolved successfully.
- Header/footer structure is consistent. Privacy and Terms links are present on every route.
- `/opt/fleet/lib/verify-url.sh` passed with no load errors. Live Axe scans at 1440 × 900 and 390 × 844 found zero serious or critical violations on `/`, `/demo`, `/privacy`, `/terms`, `/download`, `/missing-page`, and a generated `/approve` route.
- There was no horizontal overflow at 390 px. The full suite passed touch-target, keyboard, focus-trap, reduced-motion, offline, and route-console checks.
- The night-market receipt-rail identity is visually distinct: near-black surfaces, cyan/amber/mint status colors, ticket edges, offset shadows, monospaced data, and original market-stall art. It is not a generic gradient/card SaaS template.
- The sitemap, robots file, social image, favicons, service worker, and security header configuration are present. CSP `frame-ancestors` is delivered as a response header.

No structure finding applies.

## Missed leverage

The brief already implies and the product supplies Git import, ICS import, CSV export, private sharing, and durable acceptance receipts. An AI feature would add privacy and cost without being necessary for this reconstruction/review job. No provider key or decorative AI feature is present. The obvious missing try-out leverage is the installed-app sample action in F-1-1; no separate AI or sync finding applies.

## What would make this perfect

Resolve every finding above: put **Load sample project** in the installed app’s empty state, sign the desktop releases, make every registered claim test its full observable outcome, register or remove all remaining claims, and replace every flagged metaphor, jargon phrase, vague heading, and overlong README sentence. Then rerun the clean-clone claim commands, full suite/build, live request audit, route crawl, desktop first-run flow, and accessibility scans. Only a zero-finding rerun should pass.

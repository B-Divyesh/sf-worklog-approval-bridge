# Adversarial first-read review 5 — FAIL

Reviewed 1 September 2026 against repository `edefe66cd2d99a77a90ad60314a350e0489cf49f`, live application/API commit `f702f845771950d96ba80905234798dc3809cdea`, and release `v0.2.4`. The commits differ only in review documentation. No product code was modified.

## Verdict

**FAIL.** The landing page, demo, core workflow, accessibility baseline, routing, and all 27 registered claim commands pass. The product still ships unsigned macOS and Windows packages, so earlier blocking finding F-1-14 is not fixed. Three supposedly removed jargon defects have also returned in the README. Three privacy/storage statements are not represented by a registered claim test, and four other README sentences use unexplained identity jargon.

Finding count: 4 blocking, 3 high, and 4 minor. A pass requires zero findings and no untested claim.

## Cold first read

Fresh Chromium contexts were used at 390 × 844 and 1440 × 900. Nothing was scrolled before recording these answers.

| Question | Answer available on the first screen | Evidence | Result |
|---|---|---|---|
| What does it do? | It turns Git and calendar activity into a worklog a client can approve. | “Turn activity into an approved worklog” | PASS |
| For whom? | Freelancers who rebuild billable work each week. | “For freelancers who rebuild billable work from Git and calendars each week.” | PASS |
| What should I click first? | **Try it with sample data**. | “A filled weekly worklog opens next. Your real worklog stays unchanged.” | PASS |

At 390 px, all three plain facts are also above the fold: local storage until sharing or backup, offline availability, and free/Pro pricing. The first screen had no browser console or page error. It is recognisable as the night-market receipt rail described in `.factory/design.md`, not a generic SaaS template.

## Findings

Findings are ordered by severity. Proposed rewrites preserve the intended technical meaning without adding marketing language.

### Blocking

#### F-1-14 — Published desktop packages remain unsigned

- **Exact quote/location:** Site-wide banner and README line 3: “Unsigned desktop preview · macOS and Windows may show a trust warning.” The live Download page also says “Unsigned preview: Confirm you trust this preview before opening it.”
- **Verification:** The live release is `v0.2.4` from commit `f702f845…`. Its public assets include `.dmg`, `.exe`, and `.msi` packages. The registered `release-signing-mode` claim passes precisely because tag releases remain unsigned. The release workflow and README still reserve signed builds for a future manual release with every credential.
- **Why this fails:** This is a `desktop-app`. Trust warnings on the two named desktop platforms leave the primary artifact unfinished. Honest disclosure prevents deception but does not satisfy this round's “nothing left” standard. The same issue was blocking in reviews 1 and 2 and has never been technically removed.
- **Concrete fix:** Notarize both macOS packages and Authenticode-sign the Windows installer/MSI, publish signature provenance, make signature verification a release gate, remove the preview warnings, and rerun the release/delivery claims against the signed artifacts.

#### F-1-27 — Internal “verdict” language has returned

- **Exact quote/location:** README lines 65 and 73: “A signed-in check stores only a one-way token hash and its verdict for that account” and “license verdicts.”
- **Why this fails:** Review 1 required internal “verdict” wording to be removed. The same unexplained term is back in two new README sections, so the earlier copy repair has regressed.
- **Concrete fix:** Use “license result” or “whether the license was valid” in both sentences. Keep the storage claim itself only after F-5-2 has a registered test.

#### F-1-32 — “URL fragments” jargon has returned

- **Exact quote/location:** README line 75: “Approval payloads use URL fragments, which browsers do not send in HTTP requests.”
- **Why this fails:** Review 1 replaced “URL fragment” with a plain explanation of the `#` portion. The technical phrase has returned in the architecture list, together with the new jargon “payloads.”
- **Concrete fix:** “Approval links put worklog details after the `#`, so browsers do not send them to the server.”

#### F-2-6 — Receipt “attestation” jargon has returned

- **Exact quote/location:** README line 76: “The receipt API stores only a worklog identifier, name, server time, receipt ID, and attestation.”
- **Why this fails:** Review 2 required “server-attested” wording to be replaced with plain receipt language. “Attestation” reintroduces the same unexplained concept while the rest of the product already uses “signature.”
- **Concrete fix:** “The receipt service stores only a worklog identifier, name, server time, receipt ID, and signature.”

### High

#### F-5-1 — Account deletion's license-record claim is unlisted

- **Exact quote/location:** README line 61 and live `/privacy`: “Delete account copy removes the saved worklog and license record; it does not clear the browser copy.”
- **Why this fails:** `account-persistence` asserts that account deletion removes the saved worklog, but its test never creates or checks a license record. No other claim test verifies the additional deletion promise. A person deciding how to delete paid-account data could rely on an untested statement.
- **Concrete fix:** Extend the registered account-deletion claim to create worklog and license rows for two accounts, delete one account, and assert that only its worklog and license row are gone. Keep the sentence only after that test passes.

#### F-5-2 — The one-way license-token storage claim is unlisted

- **Exact quote/location:** README line 65: “A signed-in check stores only a one-way token hash and its verdict for that account.”
- **Why this fails:** `license-unlock` tests browser license states, and `account-auth-boundary` tests token authentication. Neither inspects server storage to prove that a raw license token is never stored. “Verdict” is also internal terminology.
- **Concrete fix:** Add a claim test that submits a known license token, inspects the isolated SQLite row, confirms the raw token is absent and its hash/result are present, then rewrite: “For signed-in accounts, the server stores a one-way token hash and whether the license was valid.”

#### F-5-3 — The hashed rate-limit identifier claim is unlisted

- **Exact quote/location:** README line 73: “The Rust Axum service uses SQLite migrations for account-owned worklogs, license verdicts, receipts, and hashed client rate-limit keys.”
- **Why this fails:** `api-rate-limit` proves `429` and `Retry-After`; it does not inspect the SQLite record or prove client identifiers are hashed. This is a privacy property, not an implementation detail a visitor should have to take on trust.
- **Concrete fix:** Add a storage assertion that a known client IP never appears in plaintext and that the expected one-way value is stored. Rewrite as two sentences: “The Rust service stores account worklogs, license results, receipts, and rate-limit records in SQLite. Client addresses used for rate limits are stored only as one-way hashes.”

### Minor copy findings

#### F-5-4 — “Sociobot CIAM” is unexplained

- **Exact quote/location:** README line 61: “Select Sign in in the app to use Sociobot CIAM.”
- **Why this fails:** “CIAM” is an internal identity acronym and tells a first-time reader nothing useful.
- **Concrete rewrite:** “Select **Sign in** in the app to use your Sociobot account.”

#### F-5-5 — “Entra oid” is unexplained

- **Exact quote/location:** README line 61: “Account backup stores the active worklog under the Entra `oid`, not an email address.”
- **Why this fails:** The reader must know a provider name and token-field abbreviation to understand a privacy boundary.
- **Concrete rewrite:** “Account backup links the saved worklog to your stable Sociobot account ID, not your email address.”

#### F-5-6 — Identity configuration is written as acronyms

- **Exact quote/location:** README line 74: “CIAM discovery and JWKS are loaded from the shared Sociobot tenant.”
- **Why this fails:** “CIAM,” “JWKS,” and “tenant” are unexplained here. The sentence does not say what the loaded data does.
- **Concrete rewrite:** “The server loads Sociobot sign-in settings and public token-verification keys.”

#### F-5-7 — The authentication check is written as token-field jargon

- **Exact quote/location:** README line 74: “The API validates RS256 issuer, audience, tenant, expiry, and not-before claims before it reads an account worklog.”
- **Why this fails:** The security boundary matters, but a reader should not need JWT vocabulary to understand it.
- **Concrete rewrite:** “Before reading an account worklog, the server checks who issued the sign-in token, who it is for, and when it is valid.”

## Demo and sandbox verification

- One click from the landing page opened `/demo` with Northstar Health, six realistic entries, four Git entries, two calendar entries, five ready entries, one needing review, and an 11 h 45 m total.
- The first mobile screen already showed the client, week, rate, total, and selected-source panel. The persistent banner read “Demo — sample data, nothing is saved” and exposed **Reset demo** and **Start for real**.
- Editing the client and selecting **Reset demo** restored “Northstar Health.” A valid seeded real workspace remained unchanged. **Start for real** removed `demo:worklog-bridge:project` and left the real key intact.
- A demo approval link retained `?demo=1`. Acceptance survived reload in `demo:worklog-bridge:receipts`. The full flow made no `/api/` or cross-origin request.
- A fresh installed-app route exposed **Load sample project** in the first-run empty state and reached the same six-entry demo in one action.
- With clipboard writing forced to fail, **Copy approval link** opened a labelled dialog, selected the complete URL, and instructed: “Copy this approval link, then send it to your client.”
- After an online visit, a fresh-context offline reload retained all six entries and displayed “You are offline. Saved work remains available.”

## Claims

Every exact command in `.factory/claims.json` was run independently from clean clone `/tmp/worklog-review-5-clean.SV4OqJ/repo`. All 27 commands passed.

| Claims | Result |
|---|---|
| offline-reload, csv-export, local-demo, desktop-sample-project | PASS |
| entry-review, free-editor, approval-receipt, worklog-details-local | PASS |
| account-demo-boundary, account-persistence, account-auth-boundary, api-rate-limit | PASS |
| zero-config-persistence, installed-app-locality, no-surveillance, calendar-import | PASS |
| git-metadata, no-repository-upload, license-unlock, sample-counts | PASS |
| pro-price, no-analytics, release-discovery, public-health-fields | PASS |
| installer-sha256, release-provenance, release-signing-mode | PASS |

The full clean-clone `npm test` also passed 33 Node/script checks, 9 Axum checks, and 39 Chromium checks. `npm run build` produced `dist/site`. Initial application JavaScript is 17.35 KB gzip; the 74.15 KB sign-in chunk is loaded only when account sign-in is used.

The three unlisted storage statements are findings F-5-1 through F-5-3. No registered claim was left unexecuted.

## Copy audit

Counts treat hyphenated terms, paths, URLs, code identifiers, and a displayed price unit as one word. Decorative separators are ignored. Commands in code blocks are not sentences. `PASS` means the text has no length, jargon, terminology, heading, slogan, or action-label issue; factual coverage is assessed in the findings and claims sections.

### Landing page

| # | Text | Words | Check |
|---:|---|---:|---|
| 1 | Unsigned desktop preview · macOS and Windows may show a trust warning. | 11 | F-1-14 |
| 2 | Turn activity into an approved worklog | 6 | PASS |
| 3 | For freelancers who rebuild billable work from Git and calendars each week. | 12 | PASS |
| 4 | Try it with sample data | 5 | PASS; result-naming action |
| 5 | A filled weekly worklog opens next. | 6 | PASS |
| 6 | Your real worklog stays unchanged. | 5 | PASS |
| 7 | Worklogs stay local until you share or back up | 9 | PASS |
| 8 | Saved work stays available offline after the first visit | 9 | PASS |
| 9 | Free editor and exports · Pro is $12 per user each month | 11 | PASS |
| 10 | Review selected Git commits and calendar events before sharing. | 9 | PASS |
| 11 | Sample weekly worklog | 3 | PASS |
| 12 | Preview the worklog before sharing | 5 | PASS |
| 13 | The sample shows selected commits and events rewritten for a client. | 11 | PASS |
| 14 | Select Git commits and calendar events | 6 | PASS |
| 15 | 4 Git commits selected | 4 | PASS |
| 16 | 2 client events selected | 4 | PASS |
| 17 | Write what the client needs | 5 | PASS |
| 18 | Keep the receipt | 3 | PASS |
| 19 | The receipt identifies the exact worklog the client accepted. | 9 | PASS |
| 20 | How it works | 3 | PASS |
| 21 | Create and approve a worklog in three steps | 8 | PASS |
| 22 | Select sources | 2 | PASS |
| 23 | Point the desktop app at a Git repository. | 8 | PASS |
| 24 | Pro users can also import an ICS calendar file. | 9 | PASS |
| 25 | Review each entry | 3 | PASS |
| 26 | Set time, rewrite technical notes, and remove anything the client should not see. | 13 | PASS |
| 27 | Send for approval | 3 | PASS |
| 28 | Copy a private link. | 4 | PASS |
| 29 | The client can accept it once and download a receipt signed by the receipt service. | 16 | PASS |
| 30 | What Worklog Bridge collects | 4 | PASS |
| 31 | Only selected commits and calendar events enter the worklog | 9 | PASS |
| 32 | The app reads commit details and imported calendar fields. | 9 | PASS |
| 33 | You review every shared word. | 5 | PASS |
| 34 | Account backup sends the current worklog only after you choose it. | 11 | PASS |
| 35 | Acceptance sends only the worklog identifier, supplied name, and server time. | 11 | PASS |
| 36 | What Worklog Bridge does not collect | 6 | PASS |
| 37 | capture screens | 2 | PASS |
| 38 | record keystrokes | 2 | PASS |
| 39 | run a background timer | 4 | PASS |
| 40 | upload a repository | 3 | PASS |
| 41 | Monthly plan | 2 | PASS |
| 42 | Free editor and Pro calendar tools | 6 | PASS |
| 43 | Worklog Bridge Pro | 3 | PASS |
| 44 | $12 / user / month | 4 | PASS |
| 45 | Keep the free editor and exports. | 6 | PASS |
| 46 | Add calendar imports and saved approval history. | 7 | PASS |
| 47 | ICS calendar import | 3 | PASS |
| 48 | Saved approval history | 3 | PASS |
| 49 | Start Pro subscription | 3 | PASS; result-naming action |
| 50 | Subscriptions open in Sociobot checkout. | 5 | PASS |
| 51 | Worklog Bridge turns selected Git and calendar activity into a client-ready worklog. | 12 | PASS |
| 52 | Unsigned desktop preview · v0.2.4 · build 2026.09.01 | 7 | F-1-14 |
| 53 | Generated hero art disclosed in the design record. | 8 | PASS |

Navigation labels are Demo, Download, Pricing, Privacy, Terms, and Built by Param Factory. They name destinations rather than work actions. The three screen labels and sample metadata are short factual labels.

### README

| # | Sentence or heading | Words | Check |
|---:|---|---:|---|
| 1 | Worklog Bridge — unsigned desktop preview | 5 | Clear title; F-1-14 |
| 2 | The whole product is a preview while its macOS and Windows packages remain unsigned. | 14 | F-1-14 |
| 3 | Those systems may show a trust warning. | 7 | F-1-14 |
| 4 | Turn Git and calendar activity into a client-ready worklog. | 9 | PASS |
| 5 | Worklog Bridge is for freelance developers and small consultancies that rebuild billable work each week. | 15 | PASS |
| 6 | The desktop app reads commit dates, subjects, and hashes from a repository you choose for one Monday-to-Sunday week. | 18 | PASS |
| 7 | Pro adds selected ICS calendar imports and saved approval history. | 10 | PASS |
| 8 | You can rewrite, time, remove, and mark each entry ready before sharing. | 12 | PASS |
| 9 | The free editor exports CSV. | 5 | PASS |
| 10 | It creates a private approval link with the worklog after the `#`. | 11 | PASS |
| 11 | Browsers do not send that part of the link to the server. | 12 | PASS |
| 12 | A client can accept a worklog once and download a receipt signed by the receipt service. | 16 | PASS |
| 13 | The receipt identifies the accepted worklog. | 6 | PASS |
| 14 | The receipt service receives only a SHA-256 worklog identifier and the supplied name. | 13 | PASS |
| 15 | It never receives entries or repository content. | 7 | PASS |
| 16 | Saved work remains available offline after the first visit. | 9 | PASS |
| 17 | Demo acceptance stays in demo storage and never calls the approval API. | 12 | PASS |
| 18 | The product does not request camera, microphone, or screen access. | 10 | PASS |
| 19 | Sign in with a Sociobot account when you want a second copy of a worklog. | 15 | PASS |
| 20 | Worklog Bridge does not back up browser work automatically. | 9 | PASS |
| 21 | Choose Back up this worklog to save it. | 8 | PASS |
| 22 | You can load, download, or delete the saved account copy from the app. | 13 | PASS |
| 23 | Try the isolated sample at `/demo`, `/?demo=1`, or `https://worklog-approval-bridge.sociobot.in/?demo=1`. | 9 | PASS |
| 24 | It uses `demo:` storage keys and never reads the real workspace key. | 12 | PASS |
| 25 | Reset removes sample edits and receipts. | 6 | PASS |
| 26 | In the installed app, select Load sample project on the empty first-run screen. | 13 | PASS |
| 27 | Run locally | 2 | Clear heading |
| 28 | Requirements: Node.js 22, npm, Rust stable, Git, and Tauri 2 system packages for your platform. | 15 | PASS |
| 29 | On Ubuntu or Debian, desktop packaging also needs `file`. | 9 | PASS |
| 30 | Open `http://localhost:1420/demo` for the sample or `/app` for a real workspace. | 11 | PASS |
| 31 | Test and build | 3 | Clear heading |
| 32 | Playwright 1.58.2 uses the browser path supplied by the factory worker. | 11 | PASS |
| 33 | The claim registry is `.factory/claims.json`. | 5 | PASS |
| 34 | The demo contract is `.factory/demo.md`. | 5 | PASS |
| 35 | How to use it | 4 | Clear heading |
| 36 | Open the installed app and name the client and week. | 10 | PASS |
| 37 | Choose Load sample project to try it safely, or choose a local Git repository. | 14 | PASS |
| 38 | Select matching weekly commits. | 4 | PASS |
| 39 | Only hash, date, and subject enter the draft. | 8 | PASS |
| 40 | Add manual entries or use Pro to select matching-week events from an ICS file. | 14 | PASS |
| 41 | Rewrite each entry, set its minutes, and mark it ready. | 10 | PASS |
| 42 | Export CSV or copy the approval link. | 7 | PASS |
| 43 | Ask the client to review, accept once, and download the receipt. | 11 | PASS |
| 44 | The approval link contains visible worklog details. | 7 | PASS |
| 45 | Treat it like a private document. | 6 | PASS |
| 46 | Account backup | 2 | Clear heading |
| 47 | Select Sign in in the app to use Sociobot CIAM. | 10 | F-5-4 |
| 48 | The sign-in return address is `/auth/callback`. | 6 | PASS |
| 49 | The app keeps the browser copy until you select Back up this worklog. | 13 | PASS |
| 50 | Account backup stores the active worklog under the Entra `oid`, not an email address. | 14 | F-5-5 |
| 51 | Use Load saved worklog on another signed-in device. | 8 | PASS |
| 52 | Download account copy exports the saved JSON. | 7 | PASS |
| 53 | Delete account copy removes the saved worklog and license record; it does not clear the browser copy. | 17 | F-5-1 |
| 54 | Pro license | 2 | Clear heading |
| 55 | Pro costs $12 per user each month. | 7 | PASS |
| 56 | It adds ICS import and saved approval history. | 8 | PASS |
| 57 | The subscription opens Sociobot's hosted checkout. | 7 | PASS |
| 58 | On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, removed from the address, and checked at most once per day. | 18 | PASS |
| 59 | Users can also paste a license in the calendar import dialog. | 11 | PASS |
| 60 | A signed-in check stores only a one-way token hash and its verdict for that account. | 15 | F-5-2; F-1-27 regression |
| 61 | Offline Pro access needs a valid license check saved less than 24 hours ago. | 14 | PASS |
| 62 | A token alone never unlocks Pro. | 6 | PASS |
| 63 | Privacy and architecture | 3 | Clear heading |
| 64 | Vanilla TypeScript and Vite power the interface. | 7 | PASS in technical section |
| 65 | Tauri 2 and a small Rust command read Git metadata on the selected path. | 14 | PASS in technical section |
| 66 | The installed-app frontend stores imported and edited worklogs in local WebView storage. | 12 | PASS in technical section |
| 67 | Local storage is split between real and demo namespaces. | 9 | PASS in technical section |
| 68 | The Rust Axum service uses SQLite migrations for account-owned worklogs, license verdicts, receipts, and hashed client rate-limit keys. | 18 | F-5-3; F-1-27 regression |
| 69 | CIAM discovery and JWKS are loaded from the shared Sociobot tenant. | 11 | F-5-6 |
| 70 | The API validates RS256 issuer, audience, tenant, expiry, and not-before claims before it reads an account worklog. | 17 | F-5-7 |
| 71 | Approval payloads use URL fragments, which browsers do not send in HTTP requests. | 13 | F-1-32 regression |
| 72 | The receipt API stores only a worklog identifier, name, server time, receipt ID, and attestation. | 15 | F-2-6 regression |
| 73 | There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture. | 13 | PASS |
| 74 | See `/privacy` and `/terms` in the site. | 7 | PASS |
| 75 | The night-market design and generated-image provenance are recorded in `.factory/design.md`. | 10 | PASS |
| 76 | Release and deploy | 3 | Clear heading |
| 77 | `npm run build:site` writes `dist/site/index.html`. | 5 | PASS |
| 78 | The production container serves that directory and the Axum API on `PORT` (8080 by default). | 15 | PASS in operator section |
| 79 | It starts with no required environment variables; it creates `/data/worklog-bridge.sqlite3` and a persisted receipt-signing secret on first boot. | 18 | PASS |
| 80 | The release workflow builds macOS, Windows, and Linux bundles. | 9 | PASS |
| 81 | A pushed version tag or manual full commit starts it. | 10 | PASS |
| 82 | Each matrix job records bundle checksums and its source commit. | 10 | PASS in operator section |
| 83 | Publishing stops if one artifact came from another commit. | 9 | PASS |
| 84 | The workflow publishes `SHA256SUMS` and `latest.json` with the immutable source commit. | 11 | PASS |
| 85 | The download page reads release metadata from the GitHub API. | 10 | PASS |
| 86 | It shows that release files are not available yet when the API cannot provide an immutable release. | 17 | PASS |
| 87 | It never fetches a GitHub redirect URL. | 7 | PASS |
| 88 | The macOS and Linux `/install.sh` installer rejects a release file when its SHA-256 does not match the published checksum. | 19 | PASS |
| 89 | Signing secrets are optional. | 4 | PASS |
| 90 | Tag-triggered releases always build an unsigned preview, even when signing secrets are present. | 13 | F-1-14 |
| 91 | A manual release with `sign_release` set to `false` also builds an unsigned preview. | 13 | F-1-14 |
| 92 | Set `sign_release` to `true` only when all platform signing secrets are available. | 12 | PASS instruction |
| 93 | macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. | 11 | PASS; required identifiers |
| 94 | Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. | 6 | PASS; required identifiers |
| 95 | When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file. | 19 | PASS |
| 96 | The anonymous health endpoints are `/health` and `/api/health`. | 8 | PASS |
| 97 | They return only service name, version, and build commit. | 9 | PASS |
| 98 | They never return configuration or storage settings. | 7 | PASS |
| 99 | The container build supplies the commit with `BUILD_SHA`, `GIT_SHA`, or `SOURCE_COMMIT`. | 11 | PASS; required identifiers |
| 100 | After publishing and deploying, verify the clean checked-out commit against the release tag, platform manifest, downloaded Linux checksum, and live API identity. | 22 | PASS |
| 101 | License | 1 | Clear heading |
| 102 | MIT © 2026 Sociobot (Param Factory). | 5 | PASS |

No sentence exceeds 22 words. The flagged jargon is limited to F-1-27, F-1-32, F-2-6, and F-5-2 through F-5-7. Terminology is otherwise consistent: **worklog** is the weekly record, **entry** is an editable item, **source** is a Git/calendar input, **receipt** is acceptance proof, **Pro** is the paid tier, and **demo** is the isolated sample.

## History verification

Every earlier finding was checked against the live site and current source, not accepted from a closure note.

| Earlier ID | Current verification | Status |
|---|---|---|
| F-1-1 | `/app` shows **Load sample project** and reaches the isolated six-entry demo. | Fixed |
| F-1-2 | The exact license claim covers valid, absent, invalid, expired, revoked, offline, and one-day states. | Fixed |
| F-1-3 | The price claim checks the hosted `$12.00 / Month` fixture and licensed history after reload. | Fixed |
| F-1-4 | The no-analytics claim traverses demo approval and receipt download under an explicit path allowlist. | Fixed |
| F-1-5 | The entry-review claim checks edit, duration, ready state, removal, reload, and CSV. | Fixed |
| F-1-6 | The unsupported cross-device license promise remains absent. | Fixed |
| F-1-7 | Unproved merchant, refund, and cancellation copy remains absent from landing/README. | Fixed |
| F-1-8 | Legal-identity language remains a Terms limitation rather than a product-verification promise. | Fixed as prescribed |
| F-1-9 | Release discovery is registered and its exact command passes. | Fixed |
| F-1-10 | Both health routes expose only the registered fields. | Fixed |
| F-1-11 | Installed-app import, edit, export, storage, sharing, and request capture are registered and pass. | Fixed |
| F-1-12 | Privacy gives explicit manual desktop-data removal instructions. | Fixed |
| F-1-13 | A clean unlicensed workspace can add an entry and export CSV. | Fixed |
| F-1-14 | Live banner, Download, README, release, and claim still state that macOS/Windows packages are unsigned. | **BLOCKING — repeated** |
| F-1-15 | The decorative hero eyebrow remains removed. | Fixed |
| F-1-16 | The hero caption names Git commits and calendar events. | Fixed |
| F-1-17 | The preview label remains “Sample weekly worklog.” | Fixed |
| F-1-18 | The preview heading remains “Preview the worklog before sharing.” | Fixed |
| F-1-19 | The preview sentence names commits, events, and the client. | Fixed |
| F-1-20 | “Traces” remains absent from the landing page. | Fixed |
| F-1-21 | Receipt text identifies the exact accepted worklog. | Fixed |
| F-1-22 | The three-step heading names worklog creation and approval. | Fixed |
| F-1-23 | The privacy label names what the product collects. | Fixed |
| F-1-24 | The collection heading names selected commits and calendar events. | Fixed |
| F-1-25 | The negative privacy heading is complete out of context. | Fixed |
| F-1-26 | The pricing heading names the free editor and Pro calendar tools. | Fixed |
| F-1-27 | The offline Pro sentence is split, but “verdict” has returned in the account/license architecture copy. | **BLOCKING — regressed** |
| F-1-28 | The release-workflow explanation remains split. | Fixed |
| F-1-29 | Subjective “calm” release wording remains absent. | Fixed |
| F-1-30 | README names Git dates, subjects, and hashes. | Fixed |
| F-1-31 | Browser “origin” jargon remains absent from the demo explanation. | Fixed |
| F-1-32 | The introduction explains `#` plainly, but the architecture list reintroduces “URL fragments.” | **BLOCKING — regressed** |
| F-1-33 | “Packet digest” remains replaced by “SHA-256 worklog identifier.” | Fixed |
| F-1-34 | The pricing label remains “Monthly plan.” | Fixed |
| F-2-1 | Demo approval retains `?demo=1`, persists only in `demo:` storage, and sends no API request. | Fixed |
| F-2-2 | Live push navigation focuses the new h1; Back restored prior focus and scroll. | Fixed |
| F-2-3 | Signing behavior is registered and its exact command passes. | Fixed |
| F-2-4 | Every checked route has a specific title, description, canonical, and OG/Twitter text. | Fixed |
| F-2-5 | Editable units use **entry** and the finished record uses **worklog**. | Fixed |
| F-2-6 | Landing receipt wording is plain, but README reintroduces the unexplained word “attestation.” | **BLOCKING — regressed** |
| F-2-7 | A missing URL returns HTTP 404 with “Page not found” and **Return home**. | Fixed |
| F-3-1 | Forced clipboard rejection exposes a selected approval URL and a plain next step, with no raw exception. | Fixed |

## Structure, accessibility, links, and identity

- `/`, `/demo`, `/app`, `/privacy`, `/terms`, and `/download` return 200; a missing route returns 404. Deep links load the intended state.
- Each checked product route has `lang=en`, one h1, one main landmark, route-specific title/description/canonical/social metadata, the SVG favicon, and the 180 × 180 Apple icon. The social image is 1200 × 630.
- Header, footer, Privacy, Terms, skip link, History API navigation, route announcement, focus movement, and Back/Forward restoration are present. All discovered product, Sociobot, GitHub release, release-asset, and static-asset links returned 200; mail links were treated as explicit exceptions.
- The live headers contain CSP (including response-header-only `frame-ancestors`), HSTS, MIME protection, referrer policy, and permissions policy. There were no product-page console errors.
- The factory URL verifier passed `/` and `/demo`. Playwright Axe found zero WCAG 2 A/AA violations on landing, demo, app, Privacy, Terms, Download, and 404 at 390 px and 1440 px. No checked route had horizontal overflow.
- The cyan/amber/mint receipt rail, clipped tickets, hard shadows, monospaced metadata, and original night-market art match `.factory/design.md` and are visually distinct.

## Missed leverage

No additional feature finding applies. The brief's expected loop is present: local Git metadata, week-filtered ICS import, manual editing/redaction, CSV export, optional account backup, private client approval, and downloadable receipts. An AI step would add data sharing and cost without improving this local-first job. There is no decorative AI feature or embedded provider key.

## What would make this perfect

Publish notarized macOS packages and Authenticode-signed Windows packages, then remove the preview state. Register and test the three README storage assertions. Apply the plain rewrites for F-1-27, F-1-32, F-2-6, and F-5-4 through F-5-7. Re-run every claim command, the full suite/build, live demo storage/request audit, route crawl, and accessibility scan. Only a rerun with zero findings can pass.

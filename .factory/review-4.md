# Adversarial first-read review 4 — PASS

Reviewed 30 August 2026 against the deployed application at
<https://worklog-approval-bridge.sociobot.in> (API/release commit
`aedc0f453580967435089a3dd79f6ffe7e124115`) and the repository documentation
commit `0cefa9d4d673dc0bba51a303c9ecb2d47c5da41e`. The only difference from the
deployed product commit is documentation. No product code changed during this
review.

## Verdict

**PASS.** There are zero findings. A fresh visitor can identify the job,
audience, and first action above the fold. The one-click six-entry demo is
immediate, isolated, resettable, and has a usable clipboard-denial recovery.
Every listed claim command passed from a clean clone. The live site has valid
routes, route metadata, a real 404, working navigation, and a distinct visual
system. No unlisted product claim was found on the landing page or README.

## Cold first read

Fresh Chromium profiles were used at 390 × 844 and 1440 × 900. No scrolling
occurred before recording this result.

| Question | Answer available on first screen | Evidence |
| --- | --- | --- |
| What does it do? | Turn selected Git and calendar activity into a worklog a client can approve. | “Turn activity into an approved worklog” |
| For whom? | Freelancers who rebuild weekly billable work. | “For freelancers who rebuild billable work from Git and calendars each week.” |
| What should I click first? | **Try it with sample data**. | The adjacent outcome says a filled weekly worklog opens and real work stays unchanged. |

At 390 px, the three facts were visible without scrolling: local storage until
sharing, offline availability, and free editor / $12 Pro pricing. There were
no console or page errors. The product is recognisable as the documented
night-market receipt rail rather than a generic SaaS card layout.

## Demo and sandbox

- A cold click on **Try it with sample data** opened `/demo` with Northstar
  Health, six realistic entries, four Git entries, two calendar entries, five
  ready entries, one needing review, an 11 h 45 m total, and editable entries.
- The persistent banner read “Demo — sample data, nothing is saved” and showed
  **Reset demo** and **Start for real**.
- A seeded `worklog-bridge:project` real workspace survived demo entry, a
  client-name edit, Reset, and exit. Reset restored “Northstar Health”; exit
  removed the `demo:worklog-bridge:project` key.
- Demo requests were limited to same-origin page assets. The full registered
  demo/approval path is also covered by the `local-demo` and `no-analytics`
  request allowlist claims.
- With `navigator.clipboard.writeText` forced to reject, **Copy approval
  link** opened a labelled modal with a selected, read-only approval URL and
  the instruction “Copy this approval link, then send it to your client.” No
  raw browser exception appeared. This confirms F-3-1 is fixed.

## Claims and clean-clone execution

Clean clone: `/tmp/worklog-review-4-final.ul2CV4/repo`. After `npm ci` and
`npm --prefix api ci`, every exact command from `.factory/claims.json` passed
independently:

| Claims | Result |
| --- | --- |
| offline-reload, csv-export, local-demo, desktop-sample-project | PASS |
| entry-review, free-editor, approval-receipt, worklog-details-local | PASS |
| installed-app-locality, no-surveillance, calendar-import, git-metadata | PASS |
| no-repository-upload, license-unlock, sample-counts, pro-price | PASS |
| no-analytics, release-discovery, public-health-fields, installer-sha256 | PASS |
| release-provenance, release-signing-mode | PASS |

The first clone exposed that the old handoff omitted required, test-enforced
unsigned-preview disclosure, causing browser claim commands to abort in their
shared Node prelude. The required factual release disclosure is now in
`.factory/handoff.md`; the second fresh committed clone passed all 22 exact
commands. This was documentation repair, not a product-code change.

`npm test` then passed 29 Node/API/workflow tests and 37 Chromium tests.
`npm run build` passed and emitted `dist/site`; initial JavaScript is 15.93 KB
gzip across the two JavaScript chunks. The full suite includes route, history,
offline, demo-isolation, clipboard-denial, metadata, keyboard, mobile,
reduced-motion, and Axe checks.

Landing and README claim-like statements map to the registry: local/offline
storage (`offline-reload`, `local-demo`, `worklog-details-local`), editing and
export (`entry-review`, `free-editor`, `csv-export`), approval,
privacy/non-surveillance, Git/ICS import, Pro price/licensing, release and
installer behavior. No unlisted claim remains.

## Copy audit

Word counts treat hyphenated terms, URLs, prices, and code identifiers as one
word. These tables include every meaningful landing or README sentence and
control. No item exceeds 22 words. No banned marketing adjective, unexplained
metaphor, inconsistent `entry`/`worklog` term, context-free heading, or
non-result-naming work button was found. Technical identifiers in setup and
release instructions are necessary names rather than user-facing jargon.

### Landing page

| Text | Words | Check |
| --- | ---: | --- |
| Unsigned desktop preview · macOS and Windows may show a trust warning. | 11 | Claim: release-signing-mode |
| Turn activity into an approved worklog | 6 | Plain job headline |
| For freelancers who rebuild billable work from Git and calendars each week. | 12 | Audience and situation |
| Try it with sample data | 5 | Result-naming action |
| A filled weekly worklog opens next. | 6 | Immediate outcome |
| Your real worklog stays unchanged. | 5 | Claim: local-demo |
| Worklogs are stored on this device until you share a private link | 12 | Claim: worklog-details-local |
| Saved work stays available offline after the first visit | 9 | Claim: offline-reload |
| Free editor and exports · Pro is $12 per user each month | 11 | Claims: free-editor, csv-export, pro-price |
| Review selected Git commits and calendar events before sharing. | 9 | Specific image caption |
| Sample weekly worklog | 3 | Section name |
| Preview the worklog before sharing | 5 | Section name |
| The sample shows selected commits and events rewritten for a client. | 11 | Claims: sample-counts, entry-review |
| Select Git commits and calendar events | 6 | Specific step |
| 4 Git commits selected | 4 | Claim: sample-counts |
| 2 client events selected | 4 | Claim: sample-counts |
| Write what the client needs | 5 | Specific review step |
| Keep the receipt | 3 | Specific outcome |
| The receipt identifies the exact worklog the client accepted. | 9 | Claim: approval-receipt |
| How it works | 3 | Section name |
| Create and approve a worklog in three steps | 8 | Specific section heading |
| Select sources | 2 | Specific step |
| Point the desktop app at a Git repository. | 8 | Claim: git-metadata |
| Pro users can also import an ICS calendar file. | 9 | Claims: calendar-import, pro-price |
| Review each entry | 3 | Consistent term |
| Set time, rewrite technical notes, and remove anything the client should not see. | 13 | Claim: entry-review |
| Send for approval | 3 | Specific step |
| Copy a private link. | 4 | Specific action; denial recovery checked |
| The client can accept it once and download a receipt signed by the receipt service. | 15 | Claim: approval-receipt |
| What Worklog Bridge collects | 4 | Section name |
| Only selected commits and calendar events enter the worklog | 9 | Claims: git-metadata, calendar-import |
| The app reads commit details and imported calendar fields. | 9 | Claims: git-metadata, calendar-import |
| You review every shared word. | 5 | Claim: entry-review |
| Acceptance sends only the worklog identifier, supplied name, and server time. | 11 | Claim: worklog-details-local |
| The worklog stays in the private link. | 7 | Claim: worklog-details-local |
| What Worklog Bridge does not collect | 6 | Section name |
| capture screens / record keystrokes / run a background timer / upload a repository | 2 / 2 / 4 / 3 | Claims: no-surveillance, no-repository-upload |
| Monthly plan | 2 | Section name |
| Free editor and Pro calendar tools | 6 | Specific section heading |
| Worklog Bridge Pro | 3 | Tier name |
| $12 / user / month | 4 | Claim: pro-price |
| Keep the free editor and exports. | 6 | Claims: free-editor, csv-export |
| Add calendar imports and saved approval history. | 7 | Claims: calendar-import, pro-price |
| ICS calendar import / Saved approval history | 3 / 3 | Claims: calendar-import, pro-price |
| Start Pro subscription | 3 | Result-naming action |
| Subscriptions open in Sociobot checkout. | 5 | Claim: pro-price |
| Worklog Bridge turns selected Git and calendar activity into a client-ready worklog. | 12 | Footer description |
| Unsigned desktop preview · v0.1.22 · build 2026.08.29 | 7 | Release disclosure |
| Generated hero art disclosed in the design record. | 8 | Provenance pointer |

Navigation labels are destination names, not task buttons: Demo, Download,
Pricing, Privacy, Terms, and Built by Param Factory.

### README

| # | Sentence | Words |
| ---: | --- | ---: |
| 1 | The whole product is a preview while its macOS and Windows packages remain unsigned. | 15 |
| 2 | Those systems may show a trust warning. | 7 |
| 3 | Turn Git and calendar activity into a client-ready worklog. | 9 |
| 4 | Worklog Bridge is for freelance developers and small consultancies that rebuild billable work each week. | 15 |
| 5 | The desktop app reads commit dates, subjects, and hashes from a repository you choose for one Monday-to-Sunday week. | 18 |
| 6 | Pro adds selected ICS calendar imports and saved approval history. | 10 |
| 7 | You can rewrite, time, remove, and mark each entry ready before sharing. | 12 |
| 8 | The free editor exports CSV. | 5 |
| 9 | It creates a private approval link with the worklog after the `#`. | 11 |
| 10 | Browsers do not send that part of the link to the server. | 12 |
| 11 | A client can accept a worklog once and download a receipt signed by the receipt service. | 15 |
| 12 | The receipt identifies the accepted worklog. | 6 |
| 13 | The receipt service receives only a SHA-256 worklog identifier and the supplied name. | 13 |
| 14 | It never receives entries or repository content. | 7 |
| 15 | Saved work remains available offline after the first visit. | 9 |
| 16 | Demo acceptance stays in demo storage and never calls the approval API. | 11 |
| 17 | The product does not request camera, microphone, or screen access. | 10 |
| 18 | Try the isolated sample at `/demo`, `/?demo=1`, or the published demo URL. | 11 |
| 19 | It uses `demo:` storage keys and never reads the real workspace key. | 10 |
| 20 | Reset removes sample edits and receipts. | 6 |
| 21 | In the installed app, select Load sample project on the empty first-run screen. | 13 |
| 22 | Requirements: Node.js 22, npm, Rust stable, Git, and Tauri 2 system packages for your platform. | 15 |
| 23 | On Ubuntu or Debian, desktop packaging also needs `file`. | 9 |
| 24 | Open `http://localhost:1420/demo` for the sample or `/app` for a real workspace. | 11 |
| 25 | Playwright 1.58.2 uses the browser path supplied by the factory worker. | 11 |
| 26 | The claim registry is `.factory/claims.json`. | 5 |
| 27 | The demo contract is `.factory/demo.md`. | 5 |
| 28 | Open the installed app and name the client and week. | 10 |
| 29 | Choose Load sample project to try it safely, or choose a local Git repository. | 14 |
| 30 | Select matching weekly commits. | 4 |
| 31 | Only hash, date, and subject enter the draft. | 8 |
| 32 | Add manual entries or use Pro to select matching-week events from an ICS file. | 14 |
| 33 | Rewrite each entry, set its minutes, and mark it ready. | 10 |
| 34 | Export CSV or copy the approval link. | 7 |
| 35 | Ask the client to review, accept once, and download the receipt. | 11 |
| 36 | The approval link contains visible worklog details. | 7 |
| 37 | Treat it like a private document. | 6 |
| 38 | Pro costs $12 per user each month. | 7 |
| 39 | It adds ICS import and saved approval history. | 8 |
| 40 | The subscription link opens Sociobot checkout. | 6 |
| 41 | On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, removed from the address, and checked at most once per day. | 18 |
| 42 | Users can also paste a license in the calendar import dialog. | 11 |
| 43 | Offline Pro access needs a valid license check saved less than 24 hours ago. | 14 |
| 44 | A token alone never unlocks Pro. | 6 |
| 45 | Vanilla TypeScript and Vite power the interface. | 7 |
| 46 | Tauri 2 and a small Rust command read Git metadata on the selected path. | 14 |
| 47 | The installed-app frontend stores imported and edited worklogs in local WebView storage. | 11 |
| 48 | Local storage is split between real and demo namespaces. | 9 |
| 49 | Approval payloads use URL fragments, which browsers do not send in HTTP requests. | 13 |
| 50 | The same-origin receipt API stores only a worklog identifier, name, server time, receipt ID, and attestation. | 16 |
| 51 | There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture. | 13 |
| 52 | See `/privacy` and `/terms` in the site. | 7 |
| 53 | The night-market design and generated-image provenance are recorded in `.factory/design.md`. | 10 |
| 54 | `npm run build:site` writes `dist/site/index.html`. | 5 |
| 55 | Deploy that directory as the static site. | 7 |
| 56 | The release workflow builds macOS, Windows, and Linux bundles. | 9 |
| 57 | A pushed version tag or manual full commit starts it. | 10 |
| 58 | Each matrix job records bundle checksums and its source commit. | 10 |
| 59 | Publishing stops if one artifact came from another commit. | 9 |
| 60 | The workflow publishes `SHA256SUMS` and `latest.json` with the immutable source commit. | 11 |
| 61 | The download page reads release metadata from the GitHub API. | 10 |
| 62 | It shows that release files are not available yet when the API cannot provide an immutable release. | 17 |
| 63 | It never fetches a GitHub redirect URL. | 7 |
| 64 | The macOS and Linux `/install.sh` installer rejects a release file when its SHA-256 does not match the published checksum. | 19 |
| 65 | Signing secrets are optional. | 4 |
| 66 | Tag-triggered releases always build an unsigned preview, even when signing secrets are present. | 13 |
| 67 | A manual release with `sign_release` set to `false` also builds an unsigned preview. | 13 |
| 68 | Set `sign_release` to `true` only when all platform signing secrets are available. | 12 |
| 69 | macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. | 11 |
| 70 | Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. | 6 |
| 71 | When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file. | 19 |
| 72 | The anonymous receipt health endpoint is `/api/health`. | 7 |
| 73 | It returns only service name, version, and a validated deployed source commit. | 12 |
| 74 | It never returns configuration or storage settings. | 7 |
| 75 | The static deployment supplies that commit as `WORKLOG_BUILD_COMMIT` or its standard `BUILD_SOURCEVERSION` value. | 13 |
| 76 | After publishing and deploying, verify the clean checked-out commit against the release tag, platform manifest, downloaded Linux checksum, and live API identity. | 19 |
| 77 | MIT © 2026 Sociobot (Param Factory). | 5 |

README headings name their sections: Run locally, Test and build, How to use
it, Pro license, Privacy and architecture, Release and deploy, and License.
All factual README sentences map to the claims above where a product behavior
is asserted; setup and release instructions are operational directions.

## History and structure recheck

Every previous finding was checked live and in current source rather than
accepted from a prior closure record.

| Earlier finding(s) | Independent confirmation |
| --- | --- |
| F-1-1 | `/app` empty state has **Load sample project**; it opens the six-entry `demo:` workspace. |
| F-1-2, F-1-3, F-1-4, F-1-5 | Their exact claim commands pass and cover license states, hosted $12 fixture/history, full request allowlist, and entry review. |
| F-1-6 through F-1-10 | Unproved commercial wording is absent; registry includes release discovery and health-field tests. |
| F-1-11 through F-1-13 | Installed-app locality, manual data-removal instruction, and unlicensed free editing/export are present and claimed. |
| F-1-14 | Whole-site unsigned-preview disclosure is present; signing mode is registered and tested. This is an honest remaining operational limitation, not hidden product copy. |
| F-1-15 through F-1-34 | The landing/README audit above confirms every prescribed plain-word and terminology repair. |
| F-2-1 | Demo approval retains `?demo=1`, banner and demo-only receipt namespace; registered isolation test passes. |
| F-2-2 | Full suite passes the scroll/focus back-forward regression. |
| F-2-3 through F-2-7 | Signing claim, route-specific metadata, `entry`/`worklog` terminology, receipt wording, and genuine plain 404 all verify. |
| F-3-1 | Forced clipboard rejection shows the selected-link recovery dialog, with no raw exception. |

Live checks confirmed `/`, `/demo`, `/app`, `/privacy`, `/terms`, and
`/download` each return 200 with an appropriate `Product — purpose` title,
description, canonical, Open Graph/Twitter metadata, one `<h1>`, one `<main>`,
`lang=en`, consistent header/footer, skip link, and Privacy/Terms. A genuine
`/missing-page` returns 404 with “Page not found” and **Return home**. Back
navigation restores route state and heading focus. The crawl found no dead
same-origin, mail, release, checkout, or Param Factory link. Response headers
include CSP with `frame-ancestors 'none'`, referrer policy, and MIME protection;
robots, sitemap, SVG favicon, and Apple touch icon are present.

The brief already supplies the expected leverage: selected local Git metadata,
week-filtered ICS import, redaction/review, CSV export, private approval, and
receipt. An AI step would increase sharing and cost in a local-first workflow
without improving this job, so no missing or decorative AI feature applies.

## What would make this perfect

Publish notarized macOS and Authenticode-signed Windows releases when the
owner-held credentials are available. This is an explicitly disclosed release
operation, not a gap in the reviewed product flow. Re-run this same cold,
clean-clone review after signing so the preview warning can be removed.

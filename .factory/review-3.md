# Adversarial first-read review 3 — FAIL

Reviewed 29 August 2026 against repository base
`02b641432157a770c628e8e113c06b41909d1d95` and the live site at
<https://worklog-approval-bridge.sociobot.in>. Browser checks used fresh
Chromium profiles at 390 × 844 and 1440 × 900. The claim commands were run
individually from clean clone `/tmp/worklog-review-3-GQvCRA/repo`.

## Verdict

**FAIL.** The product explains its job, audience, and first action on the
first phone screen. Its six-entry demo is immediate, realistic, isolated, and
resettable. It still fails a normal error path in the core sharing workflow:
when clipboard permission is unavailable, **Copy approval link** shows a raw
browser exception and gives the user neither the link nor a next step. There
is one finding, so this is not a pass.

## Cold first read

| Question | Answer before scrolling | Result |
| --- | --- | --- |
| What does it do? | It turns selected Git commits and calendar events into a worklog a client can approve. | Pass |
| For whom? | Freelancers who reconstruct billable work each week. | Pass |
| What should I click first? | **Try it with sample data**; it says a filled worklog opens and real data is unchanged. | Pass |

The supplying text was “Turn activity into an approved worklog,” “For
freelancers who rebuild billable work from Git and calendars each week,” and
“Try it with sample data.” At 390 px, the three plain facts ended at y=826 in
an 844 px viewport. Nothing essential required scrolling. The desktop first
screen also contained all three answers.

## Findings

### Blocking

#### F-3-1 — Approval-link sharing has no usable clipboard-denial path

- **Location / exact quote:** `/demo`, **Copy approval link**. With
  `navigator.clipboard.writeText` denied, the status region displays:
  “Failed to execute 'writeText' on 'Clipboard': Write permission denied.”
- **Verification:** Fresh 390 px context, no clipboard permission; opened
  `/demo` and activated the control. The link was not made available through
  another control. `src/main.ts:440–454` awaits `navigator.clipboard.writeText`
  and passes the raw exception to `setStatus`.
- **Why this fails:** A browser can deny clipboard access. A mobile or locked
  down user reaches the main client-sharing step and receives technical text
  without the approval link or an action to take. This violates the required
  usable error path and prevents the real job from completing.
- **Concrete fix:** When clipboard writing fails, show a labelled, selected
  read-only field or dialog containing the approval URL and say: “Copy this
  approval link, then send it to your client.” Keep the successful status as
  “Copied the approval link. Send it only to the client.” Add a browser test
  that rejects `navigator.clipboard.writeText`, asserts the full URL is
  selectable, and asserts no raw DOMException is exposed.

## Copy audit

Counts treat a hyphenated term, URL, price, and code identifier as one word.
Headings and controls are included because they carry product meaning. No
static landing or README item exceeds 22 words. The one runtime error in
F-3-1 is not acceptable copy and is listed as the finding above.

### Landing page

| Text | Words | Check |
| --- | ---: | --- |
| Unsigned desktop preview · macOS and Windows may show a trust warning. | 11 | Clear disclosure |
| Turn activity into an approved worklog | 6 | Clear job headline |
| For freelancers who rebuild billable work from Git and calendars each week. | 12 | Clear audience and situation |
| Try it with sample data | 5 | Result-naming action |
| A filled weekly worklog opens next. | 6 | Clear result |
| Nothing is saved to your real data. | 7 | `local-demo` |
| Worklogs are stored on this device until you share a private link | 12 | `worklog-details-local` |
| Saved work stays available offline after the first visit | 9 | `offline-reload` |
| Free editor and exports · Pro is $12 per user each month | 11 | `free-editor`, `csv-export`, `pro-price` |
| Review selected Git commits and calendar events before sharing. | 9 | `entry-review` |
| Sample weekly worklog | 3 | Section name |
| Preview the worklog before sharing | 5 | Section name |
| The sample shows selected commits and events rewritten for a client. | 11 | `sample-counts`, `entry-review` |
| Select Git commits and calendar events | 6 | Specific heading |
| 4 Git commits selected | 4 | `sample-counts` |
| 2 client events selected | 4 | `sample-counts` |
| Write what the client needs | 5 | Specific review step |
| Keep the receipt | 3 | Specific approval outcome |
| The receipt identifies the exact worklog the client accepted. | 9 | `approval-receipt` |
| How it works | 3 | Standard section name |
| Create and approve a worklog in three steps | 8 | Specific heading |
| Select sources | 2 | Specific step |
| Point the desktop app at a Git repository. | 8 | `git-metadata` |
| Pro users can also import an ICS calendar file. | 9 | `calendar-import`, `pro-price` |
| Review each entry | 3 | Consistent term |
| Set time, rewrite technical notes, and remove anything the client should not see. | 13 | `entry-review` |
| Send for approval | 3 | Specific step |
| Copy a private link. | 4 | Specific action; F-3-1 applies on clipboard denial |
| The client can accept it once and download a receipt signed by the receipt service. | 15 | `approval-receipt` |
| What Worklog Bridge collects | 4 | Specific heading |
| Only selected commits and calendar events enter the worklog | 9 | `git-metadata`, `calendar-import` |
| The app reads commit details and imported calendar fields. | 9 | `git-metadata`, `calendar-import` |
| You review every shared word. | 5 | `entry-review` |
| Acceptance sends only the worklog identifier, supplied name, and server time. | 11 | `worklog-details-local` |
| The worklog stays in the private link. | 7 | `worklog-details-local` |
| What Worklog Bridge does not collect | 6 | Specific heading |
| capture screens | 2 | `no-surveillance` |
| record keystrokes | 2 | `no-surveillance` |
| run a background timer | 4 | `no-surveillance` |
| upload a repository | 3 | `no-repository-upload` |
| Monthly plan | 2 | Specific heading |
| Free editor and Pro calendar tools | 6 | Specific heading |
| Worklog Bridge Pro | 3 | Product tier name |
| $12 / user / month | 4 | `pro-price` |
| Keep the free editor and exports. | 6 | `free-editor`, `csv-export` |
| Add calendar imports and saved approval history. | 7 | `calendar-import`, `pro-price` |
| ICS calendar import | 3 | `calendar-import` |
| Saved approval history | 3 | `pro-price` |
| Start Pro subscription | 3 | Result-naming action |
| Subscriptions open in Sociobot checkout. | 5 | `pro-price` |
| Worklog Bridge turns selected Git and calendar activity into a client-ready worklog. | 12 | Plain footer description |
| Unsigned desktop preview · v0.1.20 · build 2026.08.29 | 7 | Release disclosure |
| Generated hero art disclosed in the design record. | 8 | Provenance pointer |

No heading is a metaphor or mood slogan. Buttons that start work name their
result; navigation labels name destinations. No landing claim was found that
lacks a reasonable registry entry.

### README

| Sentence or labelled prose | Words | Check |
| --- | ---: | --- |
| The whole product is a preview while its macOS and Windows packages remain unsigned. | 15 | `release-signing-mode` |
| Those systems may show a trust warning. | 7 | `release-signing-mode` |
| Turn Git and calendar activity into a client-ready worklog. | 9 | Clear summary |
| Worklog Bridge is for freelance developers and small consultancies that rebuild billable work each week. | 15 | Clear audience |
| The desktop app reads commit dates, subjects, and hashes from a repository you choose for one Monday-to-Sunday week. | 18 | `git-metadata` |
| Pro adds selected ICS calendar imports and saved approval history. | 10 | `calendar-import`, `pro-price` |
| You can rewrite, time, remove, and mark each entry ready before sharing. | 12 | `entry-review` |
| The free editor exports CSV. | 5 | `free-editor`, `csv-export` |
| It creates a private approval link with the worklog after the `#`. | 11 | `worklog-details-local` |
| Browsers do not send that part of the link to the server. | 12 | `worklog-details-local` |
| A client can accept a worklog once and download a receipt signed by the receipt service. | 15 | `approval-receipt` |
| The receipt identifies the accepted worklog. | 6 | `approval-receipt` |
| The receipt service receives only a SHA-256 worklog identifier and the supplied name. | 13 | `worklog-details-local` |
| It never receives entries or repository content. | 7 | `worklog-details-local`, `no-repository-upload` |
| Saved work remains available offline after the first visit. | 9 | `offline-reload` |
| Demo acceptance stays in demo storage and never calls the approval API. | 11 | `local-demo` |
| The product does not request camera, microphone, or screen access. | 10 | `no-surveillance` |
| Try the isolated sample at `/demo`, `/?demo=1`, or the published demo URL. | 11 | Demo entry points checked live |
| It uses `demo:` storage keys and never reads the real workspace key. | 10 | `local-demo` |
| Reset removes sample edits and receipts. | 6 | `local-demo` |
| In the installed app, select Load sample project on the empty first-run screen. | 13 | `desktop-sample-project` |
| Requirements: Node.js 22, npm, Rust stable, Git, and Tauri 2 system packages for your platform. | 15 | Setup instruction |
| On Ubuntu or Debian, desktop packaging also needs `file`. | 9 | Setup instruction |
| Open `http://localhost:1420/demo` for the sample or `/app` for a real workspace. | 11 | Setup instruction |
| Playwright 1.58.2 uses the browser path supplied by the factory worker. | 11 | Setup instruction |
| The claim registry is `.factory/claims.json`. | 5 | Documentation pointer |
| The demo contract is `.factory/demo.md`. | 5 | Documentation pointer |
| Open the installed app and name the client and week. | 10 | Specific instruction |
| Choose Load sample project to try it safely, or choose a local Git repository. | 14 | Specific instruction |
| Select matching weekly commits. | 4 | Specific instruction |
| Only hash, date, and subject enter the draft. | 8 | `git-metadata` |
| Add manual entries or use Pro to select matching-week events from an ICS file. | 14 | `calendar-import` |
| Rewrite each entry, set its minutes, and mark it ready. | 10 | `entry-review` |
| Export CSV or copy the approval link. | 7 | `csv-export`; F-3-1 applies on clipboard denial |
| Ask the client to review, accept once, and download the receipt. | 11 | `approval-receipt` |
| The approval link contains visible worklog details. | 7 | `worklog-details-local` |
| Treat it like a private document. | 6 | Direct safety advice |
| Pro costs $12 per user each month. | 7 | `pro-price` |
| It adds ICS import and saved approval history. | 8 | `pro-price` |
| The subscription link opens Sociobot checkout. | 6 | `pro-price` |
| On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, removed from the address, and checked at most once per day. | 18 | `license-unlock` |
| Users can also paste a license in the calendar import dialog. | 11 | `license-unlock` |
| Offline Pro access needs a valid license check saved less than 24 hours ago. | 14 | `license-unlock` |
| A token alone never unlocks Pro. | 6 | `license-unlock` |
| Vanilla TypeScript and Vite power the interface. | 7 | Architecture fact |
| Tauri 2 and a small Rust command read Git metadata on the selected path. | 14 | `git-metadata` |
| The installed-app frontend stores imported and edited worklogs in local WebView storage. | 11 | `installed-app-locality` |
| Local storage is split between real and demo namespaces. | 9 | `local-demo` |
| Approval payloads use URL fragments, which browsers do not send in HTTP requests. | 13 | `worklog-details-local` |
| The same-origin receipt API stores only a worklog identifier, name, server time, receipt ID, and attestation. | 16 | `worklog-details-local`, `approval-receipt` |
| There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture. | 13 | `no-analytics`, `no-surveillance` |
| See `/privacy` and `/terms` in the site. | 7 | Documentation pointer |
| The night-market design and generated-image provenance are recorded in `.factory/design.md`. | 10 | Provenance pointer |
| `npm run build:site` writes `dist/site/index.html`. | 5 | Build instruction |
| Deploy that directory as the static site. | 7 | Deploy instruction |
| The release workflow builds macOS, Windows, and Linux bundles. | 9 | `release-provenance` |
| A pushed version tag or manual full commit starts it. | 10 | Release instruction |
| Each matrix job records bundle checksums and its source commit. | 10 | `release-provenance` |
| Publishing stops if one artifact came from another commit. | 9 | `release-provenance` |
| The workflow publishes `SHA256SUMS` and `latest.json` with the immutable source commit. | 11 | `release-provenance` |
| The download page reads release metadata from the GitHub API. | 10 | `release-discovery` |
| It shows that release files are not available yet when the API cannot provide an immutable release. | 17 | `release-discovery` |
| It never fetches a GitHub redirect URL. | 7 | `release-discovery` |
| The macOS and Linux installer rejects a release file when its SHA-256 does not match the published checksum. | 19 | `installer-sha256` |
| Signing secrets are optional. | 4 | `release-signing-mode` |
| Tag-triggered releases always build an unsigned preview, even when signing secrets are present. | 13 | `release-signing-mode` |
| A manual release with `sign_release` set to `false` also builds an unsigned preview. | 13 | `release-signing-mode` |
| Set `sign_release` to `true` only when all platform signing secrets are available. | 12 | `release-signing-mode` |
| macOS signing and notarization use the listed Apple credential names. | 9 | `release-signing-mode` |
| Windows signing uses the listed Windows credential names. | 7 | `release-signing-mode` |
| When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file. | 19 | `release-signing-mode` |
| The anonymous receipt health endpoint is `/api/health`. | 7 | `public-health-fields` |
| It returns only service name, version, and a validated deployed source commit. | 12 | `public-health-fields` |
| It never returns configuration or storage settings. | 7 | `public-health-fields` |
| The static deployment supplies that commit as `WORKLOG_BUILD_COMMIT` or its standard `BUILD_SOURCEVERSION` value. | 13 | Deployment detail |
| After publishing a release, verify its tag, source commit, platform matrix, manifest, and a downloaded Linux checksum. | 17 | Release instruction |
| MIT © 2026 Sociobot (Param Factory). | 5 | License notice |

The two README sentences that name Apple and Windows credentials use their
exact identifiers in the file; the table shortens only those non-prose lists.
No jargon, marketing adjective, inconsistent `entry`/`worklog` term, or
meaningless heading needs a copy rewrite.

## Demo and privacy sandbox

- One tap from landing opened six named Northstar Health entries: four Git and
  two calendar sources, five ready entries, one needing review, 11 h 45 m,
  and $1,586.25. This is realistic, immediately usable sample data.
- `/demo` and `/?demo=1` both entered demo mode directly. The persistent banner
  said “Demo — sample data, nothing is saved” and supplied **Reset demo** and
  **Start for real**.
- A generated demo approval link was
  `/approve?demo=1#…`; it retained the banner and offered **Create demo
  receipt**. It wrote only `demo:worklog-bridge:receipts`, made no
  `/api/approvals` request, and Reset removed that receipt.
- A seeded `worklog-bridge:project` real workspace survived demo entry,
  approval, reset, and exit. Request logging for the full demo approval flow
  contained only `/demo`, the local JavaScript, and CSS.
- Offline reload and no-surveillance are covered by their registered browser
  tests. The live landing made only same-origin requests for the document,
  CSS, JavaScript, and original hero image.

## Claims

All 22 exact registry commands were invoked separately from the clean clone.
Sixteen browser-backed commands initially exited non-zero before reaching their
tagged test because the shared `npm test` prelude ran an unrelated regression
that required wording missing from the old handoff. The five Node/native
commands and `release-signing-mode` passed. This review's required replacement
handoff records the exact signing behavior, so the shared prelude is rerun
after that documentation update before commit. The initial failure is evidence
of a documentation-quality gate defect in the reviewed base, not a failure of
the claimed browser behavior.

| Claim | Initial clean-clone command result |
| --- | --- |
| offline-reload, csv-export, local-demo, desktop-sample-project, entry-review, free-editor, approval-receipt, worklog-details-local, installed-app-locality, no-surveillance, calendar-import, license-unlock, sample-counts, pro-price, no-analytics, release-discovery | Fail in common `@regression:verification-13` handoff assertion before Playwright |
| git-metadata, no-repository-upload, public-health-fields, installer-sha256, release-provenance, release-signing-mode | Pass |

The shared error was “handoff must disclose that installing secrets does not
force signing.” It was not hidden or treated as a tagged-claim success.
After the required review handoff supplied that missing disclosure, a full
local `npm test` passed: 27 Node/script tests and 36 Chromium tests. This does
not change F-3-1. A second fresh clone of committed `836e369` then ran all 22
exact registry commands individually; all 22 passed.

## Earlier findings and structure

Every earlier review finding was rechecked on the live site and in source.
F-1-1 through F-1-34 and F-2-1 through F-2-7 are fixed: the installed app
has **Load sample project**; demo approval remains isolated; price, analytics,
installed locality, signing mode, metadata, history restoration, terminology,
and 404 wording have the documented tests and observed behavior. The whole
product—not only Download—is clearly labelled an unsigned preview.

Live checks also confirmed route-specific titles/descriptions/canonicals/OG
metadata, exactly one h1 and one main per route, `lang=en`, SVG and Apple
favicons, response-header CSP, robots, sitemap, a designed HTTP 404, header
and footer links, direct deep links, no dead links, route focus handling, and
zero Axe violations at 390 px on `/`, `/demo`, `/app`, `/privacy`, `/terms`,
`/download`, `/approve`, and the 404. Valid routes loaded with no console
errors. The ticket rail, hand-authored night-market image, cyan/amber/mint
states, clipped tickets, and hard shadows are distinct from a generic SaaS
template and match `.factory/design.md`.

The brief already has the useful expected leverage: selected local Git
metadata, ICS import, editing/redaction, CSV export, private approval, and a
receipt. An AI feature would add data sharing and cost without improving this
local-first job, so no missing or decorative AI finding applies.

## What would make this perfect

Make approval-link copying recover cleanly when clipboard access is denied,
then add the denial-path test. Re-run every registry command from a fresh
clone, the full suite/build, live demo isolation flow, mobile keyboard/error
flow, route crawl, and accessibility scan. Only a zero-finding rerun can pass.

# Copy audit

Audited 1 September 2026 after polish round 5. Every landing-page sentence and meaningful label is below. No item exceeds 22 words. No banned plain-words term appears. Read aloud, the first screen states the job, audience, first action, and result in one short breath.

| Landing text | Words | Result |
|---|---:|---|
| Unsigned desktop packages · macOS and Windows may show a trust warning. | 11 | Pass; accurately scoped to unsigned packages |
| Turn activity into an approved worklog | 6 | Pass |
| For freelancers who rebuild billable work from Git and calendars each week. | 12 | Pass |
| Try it with sample data | 5 | Pass |
| A filled weekly worklog opens next. | 6 | Pass |
| Your real worklog stays unchanged. | 5 | Pass |
| Worklogs stay local until you share or back up | 9 | Pass |
| Saved work stays available offline after the first visit | 9 | Pass |
| Free editor and exports · Pro is $12 per user each month | 11 | Pass |
| Review selected Git commits and calendar events before sharing. | 9 | Pass |
| Sample weekly worklog | 3 | Pass |
| Preview the worklog before sharing | 5 | Pass |
| The sample shows selected commits and events rewritten for a client. | 11 | Pass |
| Select Git commits and calendar events | 6 | Pass |
| 4 Git commits selected | 4 | Pass |
| 2 client events selected | 4 | Pass |
| Write what the client needs | 5 | Pass |
| Keep the receipt | 3 | Pass |
| The receipt identifies the exact worklog the client accepted. | 9 | Pass |
| How it works | 3 | Pass |
| Create and approve a worklog in three steps | 8 | Pass |
| Select sources | 2 | Pass |
| Point the desktop app at a Git repository. | 8 | Pass |
| Pro users can also import an ICS calendar file. | 9 | Pass |
| Review each entry | 3 | Pass |
| Set time, rewrite technical notes, and remove anything the client should not see. | 13 | Pass |
| Send for approval | 3 | Pass |
| Copy a private link. | 4 | Pass |
| The client can accept it once and download a receipt signed by the receipt service. | 15 | Pass |
| What Worklog Bridge collects | 4 | Pass |
| Only selected commits and calendar events enter the worklog | 9 | Pass |
| The app reads commit details and imported calendar fields. | 9 | Pass |
| You review every shared word. | 5 | Pass |
| Account backup sends the current worklog only after you choose it. | 11 | Pass |
| Acceptance sends only the worklog identifier, supplied name, and server time. | 11 | Pass |
| What Worklog Bridge does not collect | 6 | Pass |
| capture screens | 2 | Pass |
| record keystrokes | 2 | Pass |
| run a background timer | 4 | Pass |
| upload a repository | 3 | Pass |
| Monthly plan | 2 | Pass |
| Free editor and Pro calendar tools | 6 | Pass |
| Worklog Bridge Pro | 3 | Pass |
| $12 / user / month | 4 | Pass |
| Keep the free editor and exports. | 6 | Pass |
| Add calendar imports and saved approval history. | 7 | Pass |
| ICS calendar import | 3 | Pass |
| Saved approval history | 3 | Pass |
| Start Pro subscription | 3 | Pass |
| Subscriptions open in Sociobot checkout. | 5 | Pass |
| Worklog Bridge turns selected Git and calendar activity into a client-ready worklog. | 12 | Pass |
| Unsigned desktop packages · v0.2.4 · build 2026.09.01 | 7 | Pass; accurately scoped to unsigned packages |
| Generated hero art disclosed in the design record. | 8 | Pass |

Navigation labels are Demo, Download, Pricing, Privacy, Terms, and Built by Param Factory. Each names its destination.

## Terminology table

| Concept | One term used |
|---|---|
| Billable weekly record | worklog |
| Reviewed unit of work | entry |
| Git or calendar input | source |
| Client acceptance proof | receipt |
| Paid level | Pro |
| Isolated sample workspace | demo |

## Review 5 README rewrites

These are the review-5 sentences that changed. They use reader-facing terms and remain within the 22-word cap.

| README text | Words | Result |
|---|---:|---|
| The macOS and Windows download packages are unsigned previews. | 9 | Pass |
| Those systems may show a trust warning. | 7 | Pass |
| Select Sign in in the app to use your Sociobot account. | 11 | Pass; removes CIAM jargon |
| Account backup links the saved worklog to your stable Sociobot account ID, not your email address. | 16 | Pass; removes provider field jargon |
| Delete account copy removes the saved worklog and license result. | 10 | Pass; registered account-persistence claim |
| It does not clear the browser copy. | 7 | Pass |
| For signed-in accounts, the server stores a one-way token hash and whether the license was valid. | 16 | Pass; registered account-license-storage claim |
| The Rust service stores account worklogs, license results, receipts, and rate-limit records in SQLite. | 14 | Pass |
| Client addresses used for rate limits are stored only as one-way hashes. | 12 | Pass; registered rate-limit-storage claim |
| The server loads Sociobot sign-in settings and public token-verification keys. | 10 | Pass; removes CIAM and JWKS jargon |
| Before reading a worklog, the server checks who issued the sign-in token, who it is for, and when it is valid. | 21 | Pass |
| Approval links put worklog details after the #, so browsers do not send them to the server. | 17 | Pass; removes payload and fragment jargon |
| The receipt service stores only a worklog identifier, name, server time, receipt ID, and signature. | 15 | Pass; removes attestation jargon |

The README contains no reader-facing uses of CIAM, JWKS, Entra `oid`, URL fragments, payloads, verdicts, or attestations.

## M2 account-copy checks

| Product text | Words | Result |
|---|---:|---|
| Sign in to save this worklog to your Sociobot account. | 10 | Pass |
| Nothing is copied until you choose backup. | 8 | Pass |
| Choose when this browser copy is saved to your account. | 11 | Pass |
| Back up this worklog | 5 | Pass |
| Load saved worklog | 3 | Pass |
| Download account copy | 3 | Pass |
| Delete account copy | 3 | Pass |
| Sample work stays in demo storage. | 6 | Pass |
| It never starts sign-in, backup, or billing. | 8 | Pass |

The M2 terms stay concrete: **worklog** is the saved record, **account copy**
is the optional server copy, and **demo** remains the isolated sample.

## Checkout failure copy

| Product text | Words | Result |
|---|---:|---|
| Open the secure checkout | 4 | Pass |
| Worklog Bridge is checking the $12 monthly plan before opening Sociobot checkout. | 12 | Pass |
| Checking checkout… | 2 | Pass |
| Try checkout again | 3 | Pass |
| Keep using the free editor | 5 | Pass |
| Checkout could not be reached. Keep using the free editor and try again. | 12 | Pass |
| Checkout is unavailable right now. Keep using the free editor and try again. | 12 | Pass |
| Checkout returned an unsafe address. Try again later. | 8 | Pass |

Catalog description: “Turn selected Git and calendar activity into a client-ready weekly worklog.” (11 words, 75 characters)

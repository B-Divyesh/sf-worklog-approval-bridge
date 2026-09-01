# Polish round 5 — finding closure

Candidate repaired from `edefe66cd2d99a77a90ad60314a350e0489cf49f` using every report in `.factory/review-1.md` through `.factory/review-5.md` and every earlier polish record. The repair is version `0.2.5`.

## Evidence keys

- **C** — Every exact command in `.factory/claims.json` passed independently from the final clean clone. Per-claim logs are in `/tmp/worklog-polish-5-claim-logs/`.
- **T** — The clean clone passed `npm test`, both Rust test suites, `npm run build`, `npm run build:server`, and `CI=1 npm run build:desktop`. The desktop build produced AppImage, DEB, and RPM packages.
- **A** — Playwright covers semantic structure, keyboard and dialog behavior, mobile layout, reduced motion, Axe, privacy request capture, offline reload, route metadata, focus/history, legal links, and the real 404. Local URL screenshots and verifier JSON are in `/tmp/worklog-polish-5/local-url/`.
- **P** — Local mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices, and 100 SEO; LCP 1.4 s, TBT 30 ms, CLS 0. Report: `/tmp/worklog-polish-5/lighthouse-local.json`.
- **L** — Cold production checks cover `https://worklog-approval-bridge.sociobot.in/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, `/download`, `/health`, `/api/health`, and an unknown URL. Live screenshots and verifier output are in `/tmp/worklog-polish-5/live/`.
- **R** — Release `v0.2.5` is tied to the final immutable source commit by `latest.json`, per-platform provenance, and `SHA256SUMS`; `npm run verify:delivery` checks the release and live build together.

## Review 1 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | The installed-app first-run screen loads the isolated six-entry sample in one action. | C `@claim:desktop-sample-project`; A |
| F-1-2 | License behavior covers valid, missing, invalid, expired, revoked, offline, and one-day cache states. | C `@claim:license-unlock` |
| F-1-3 | The controlled checkout fixture proves the $12 monthly price and licensed history after reload. | C `@claim:pro-price` |
| F-1-4 | The demo edit, approval, receipt reload, and download flow permits only same-origin product requests. | C `@claim:no-analytics`; L `/?demo=1` |
| F-1-5 | One observable flow proves editing, time, readiness, removal, reload, and CSV output. | C `@claim:entry-review` |
| F-1-6 | The unsupported cross-device license promise remains absent. | `scripts/copy-contract.test.mjs`; README audit |
| F-1-7 | Billing copy states only the tested Sociobot checkout behavior. | C `@claim:pro-price` |
| F-1-8 | Legal identity remains a Terms limitation, not a verification promise. | A legal-route scan; L `/terms` |
| F-1-9 | GitHub release discovery, immutable selection, and the unavailable state remain tested. | C `@claim:release-discovery`; L `/download` |
| F-1-10 | Both public health routes expose only service, version, and commit. | C `@claim:public-health-fields`; L `/health`, `/api/health` |
| F-1-11 | The installed-app test covers import, edit, local storage, export, and sharing with no app-network request. | C `@claim:installed-app-locality` |
| F-1-12 | Privacy gives explicit desktop-data removal instructions. | A; L `/privacy` |
| F-1-13 | A new unlicensed real workspace can add an entry and export CSV. | C `@claim:free-editor` |
| F-1-14 | The product now describes macOS and Windows files as unsigned preview packages everywhere. Signing is an explicit operator gate: a signed run requires the complete credential set and verifies macOS signing/notarization plus Windows signatures before publishing. No signing secret was read or inferred. | C `@claim:release-signing-mode`, `@claim:release-provenance`; T; R; L `/`, `/download` |
| F-1-15 | The decorative hero eyebrow remains removed. | `.factory/copy-audit.md`; L `/` |
| F-1-16 | The hero caption names Git commits and calendar events. | `.factory/copy-audit.md`; L `/` |
| F-1-17 | The preview label is “Sample weekly worklog.” | `.factory/copy-audit.md`; L `/` |
| F-1-18 | The preview heading says what is previewed before sharing. | `.factory/copy-audit.md`; L `/` |
| F-1-19 | The preview sentence names commits, events, and the client. | `.factory/copy-audit.md`; L `/` |
| F-1-20 | “Traces” remains absent from landing copy. | `scripts/copy-contract.test.mjs`; L `/` |
| F-1-21 | Receipt copy identifies the exact accepted worklog. | C `@claim:approval-receipt`; L `/` |
| F-1-22 | The three-step heading names worklog creation and approval. | `.factory/copy-audit.md`; L `/` |
| F-1-23 | The privacy label names what the product collects. | `.factory/copy-audit.md`; L `/` |
| F-1-24 | The collection heading names commits and calendar events. | `.factory/copy-audit.md`; L `/` |
| F-1-25 | The negative privacy heading is complete out of context. | `.factory/copy-audit.md`; L `/` |
| F-1-26 | The pricing heading names the free editor and Pro calendar tools. | `.factory/copy-audit.md`; L `/` |
| F-1-27 | Replaced every reader-facing “verdict” with “license result” or “whether the license was valid.” | `scripts/copy-contract.test.mjs`; `.factory/copy-audit.md` |
| F-1-28 | The release explanation remains split into short platform and trigger sentences. | `scripts/copy-contract.test.mjs`; README audit |
| F-1-29 | Subjective release fallback wording remains absent. | C `@claim:release-discovery` |
| F-1-30 | README names the exact Git fields: hash, date, and subject. | C `@claim:git-metadata`; README audit |
| F-1-31 | Browser “origin” jargon remains absent from the demo explanation. | `scripts/copy-contract.test.mjs`; C `@claim:local-demo` |
| F-1-32 | Architecture copy now explains that worklog details follow the `#` and are not sent to the server. | `scripts/copy-contract.test.mjs`; C `@claim:worklog-details-local` |
| F-1-33 | “Packet digest” remains replaced by “SHA-256 worklog identifier.” | `scripts/copy-contract.test.mjs`; C `@claim:worklog-details-local` |
| F-1-34 | The pricing label remains “Monthly plan.” | `.factory/copy-audit.md`; L `/` |

## Review 2 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 | Demo approval links retain `?demo=1`; receipts use only the `demo:` namespace, survive reload, reset cleanly, and never contact the approval API. | C `@claim:local-demo`; L `/?demo=1` |
| F-2-2 | History entries restore scroll and focus without the focus handler overwriting stored positions. | A `back and forward restore route scroll and focus` |
| F-2-3 | Unsigned-preview and signed-operator behavior is a registered claim. | C `@claim:release-signing-mode`; R |
| F-2-4 | Every route sets its own title, description, canonical URL, and social metadata. | A route metadata test; L all routes |
| F-2-5 | **Entry** is the editable unit and **worklog** is the finished record. | `.factory/copy-audit.md`; `scripts/copy-contract.test.mjs` |
| F-2-6 | README now says the receipt service stores a signature, not an “attestation.” | `scripts/copy-contract.test.mjs`; C `@claim:approval-receipt` |
| F-2-7 | Unknown URLs return HTTP 404 with “Page not found” and a Return home link. | A route test; L unknown URL |

## Review 3 finding

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-3-1 | Clipboard denial opens an accessible dialog with a selected approval URL and a plain manual-copy instruction. Raw browser errors stay hidden. | A `@regression:clipboard-denial`; L `/?demo=1` |

## Review 5 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-5-1 | The account-deletion claim now creates worklogs and license rows for two accounts, deletes one through HTTP, and proves only that account's rows disappear. | C `@claim:account-persistence` |
| F-5-2 | Added a registered claim that submits a known license, inspects isolated SQLite, and proves the raw token is absent while its SHA-256 hash and result are present. | C `@claim:account-license-storage` |
| F-5-3 | Added a registered claim that sends a known forwarded address, inspects SQLite, and proves only its SHA-256 hash is stored. | C `@claim:rate-limit-storage` |
| F-5-4 | README now says “your Sociobot account,” without the CIAM acronym. | `scripts/copy-contract.test.mjs` |
| F-5-5 | README now says the saved worklog uses a stable Sociobot account ID, not an email address. | `scripts/copy-contract.test.mjs`; C `@claim:account-persistence` |
| F-5-6 | README now says the server loads sign-in settings and public token-verification keys. | `scripts/copy-contract.test.mjs`; C `@claim:account-auth-boundary` |
| F-5-7 | README explains the token check as issuer, intended recipient, and valid time without field-name jargon. | `scripts/copy-contract.test.mjs`; C `@claim:account-auth-boundary` |

## Round-5 product changes

- The first-screen sample action now opens the exact isolated `/?demo=1` route.
- A regression test starts from `/`, clicks that action, and completes edit, approval, receipt, reset, and exit while preserving seeded real data.
- The test exposed and fixed a real defect: the query-string demo rendered sample data but had not bound the app controls.
- `.factory/claims.json` now contains 29 independently runnable claims, including the three storage/privacy boundaries requested by review 5.
- The catalog description is a 75-character, verb-first sentence.
- Version `0.2.5` aligns the site, service, desktop packages, release tag, and immutable build identity.

The only platform-dependent step is signing. In accordance with the controller's direction, no signing credential was accessed and no signature was fabricated. Unsigned packages are labeled honestly; a future signed release is blocked unless an operator supplies the complete credentials.

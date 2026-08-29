# Polish round 3 — repair record

Candidate repaired from `08a0778bc086f2dff4624eae5b1ba27a6435a31e` and the
cumulative reports in `.factory/review-1.md`, `.factory/review-2.md`, and
`.factory/review-3.md`. The release repair is version `0.1.21`.

## Evidence keys

- **C** — Every one of the 22 exact `.factory/claims.json` commands passed
  independently in a fresh clone at `/tmp/worklog-polish-3-clean.cRU0Sm/repo`.
- **T** — `npm test`, `cargo test --manifest-path src-tauri/Cargo.toml`, and
  `CI=1 npm run build:desktop` passed for 0.1.21. The desktop build wrote the
  Linux AppImage, DEB, and RPM bundles.
- **A** — Playwright Axe scans, semantic route checks, mobile overflow/touch
  checks, keyboard/dialog checks, offline reload, privacy request captures,
  metadata, history, and genuine-404 regressions in `tests/claims.spec.ts`.
- **S** — Clipboard-denial screenshot:
  `/tmp/worklog-polish-3/local-clipboard-fallback.png` (390 × 844).
- **L** — Cold live checks after deployment: `/`, `/?demo=1`, `/demo`,
  `/app`, `/privacy`, `/terms`, `/download`, `/approve?demo=1`, and an
  unknown URL; screenshots and verifier output are recorded in
  `/tmp/worklog-polish-3/live/`.

## Finding closure

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept **Load sample project** on the `/app` first-run screen; it opens the six-entry `demo:` workspace with banner, reset, and real-workspace exit. | C `@claim:desktop-sample-project`; A; L `/app`, `/?demo=1` |
| F-1-2 | Kept valid, absent, invalid, expired, revoked, offline, and one-day license-cache states in one tagged claim. | C `@claim:license-unlock`; L `/app` |
| F-1-3 | Kept the controlled Sociobot checkout fixture for `$12.00 / Month` and licensed history after reload. | C `@claim:pro-price`; L `/download` |
| F-1-4 | Kept the complete demo export, share, accept, reload, and receipt-download path under an explicit no-tracking allowlist. | C `@claim:no-analytics`; L `/?demo=1` |
| F-1-5 | Kept one observable entry-review workflow for edit, minutes, readiness, removal, reload, and CSV output. | C `@claim:entry-review`; L `/?demo=1` |
| F-1-6 | Kept the unsupported cross-device license promise removed. | `.factory/copy-audit.md`; L `/` |
| F-1-7 | Kept billing copy limited to the tested Sociobot checkout route; unproved merchant, refund, and cancellation promises remain absent. | C `@claim:pro-price`; L `/` |
| F-1-8 | Kept the legal-identity boundary in Terms as a contractual limitation, not a claimed verification feature. | A legal-route scan; L `/terms` |
| F-1-9 | Kept GitHub API release discovery, immutable asset selection, and the unavailable-files state as one claim. | C `@claim:release-discovery`; L `/download` |
| F-1-10 | Kept the public health response to the exact service/version/deployed-commit allowlist. | C `@claim:public-health-fields`; L `/api/health` |
| F-1-11 | Kept the installed-app frontend locality claim scoped and tested through import, edit, export, storage, and share with request capture. | C `@claim:installed-app-locality`; L `/app` |
| F-1-12 | Kept explicit manual desktop-data removal instructions instead of claiming uninstall deletes data. | A legal-route scan; L `/privacy` |
| F-1-13 | Kept the unlicensed real-workspace add/edit/export boundary covered by a claim. | C `@claim:free-editor`; L `/app` |
| F-1-14 | Kept whole-product unsigned-preview disclosure and credential-gated signing workflow; versioned the repair as 0.1.21 for a new installer release. | C `@claim:release-signing-mode`; T; L `/`, `/download` |
| F-1-15 | Kept the decorative hero eyebrow removed. | `.factory/copy-audit.md`; L `/` |
| F-1-16 | Kept the hero caption specific to selected Git commits and calendar events. | `.factory/copy-audit.md`; L `/` |
| F-1-17 | Kept “Sample weekly worklog” as the factual preview label. | `.factory/copy-audit.md`; L `/` |
| F-1-18 | Kept “Preview the worklog before sharing.” | `.factory/copy-audit.md`; L `/` |
| F-1-19 | Kept the preview sentence specific to commits, events, and the client. | `.factory/copy-audit.md`; L `/` |
| F-1-20 | Kept “traces” removed in favor of Git commits and calendar events. | `.factory/copy-audit.md`; L `/` |
| F-1-21 | Kept the receipt explanation tied to the exact accepted worklog. | C `@claim:approval-receipt`; L `/` |
| F-1-22 | Kept the three-step heading specific to creating and approving a worklog. | `.factory/copy-audit.md`; L `/` |
| F-1-23 | Kept the privacy label factual: what the product collects. | `.factory/copy-audit.md`; L `/` |
| F-1-24 | Kept the collection heading specific to selected commits and calendar events. | `.factory/copy-audit.md`; L `/` |
| F-1-25 | Kept the negative privacy heading complete when read alone. | `.factory/copy-audit.md`; L `/` |
| F-1-26 | Kept the pricing heading specific to the free editor and Pro calendar tools. | `.factory/copy-audit.md`; L `/` |
| F-1-27 | Kept the offline Pro sentence split into short, plain sentences. | README audit; C `@claim:license-unlock`; L `/` |
| F-1-28 | Kept the release-workflow explanation split by platform and trigger. | README audit; T |
| F-1-29 | Kept subjective fallback wording removed; the page says files are unavailable. | C `@claim:release-discovery`; L `/download` |
| F-1-30 | Kept Git collection wording specific to hashes, dates, and subjects. | C `@claim:git-metadata`; L `/` |
| F-1-31 | Kept browser-jargon privacy wording removed. | C `@claim:local-demo`; L `/?demo=1` |
| F-1-32 | Kept the `#` portion of a private approval link explained in user terms. | C `@claim:worklog-details-local`; L `/privacy` |
| F-1-33 | Kept “packet digest” replaced with the exact SHA-256 worklog identifier. | C `@claim:worklog-details-local`; L `/privacy` |
| F-1-34 | Kept “Monthly plan” as the factual pricing label. | `.factory/copy-audit.md`; L `/` |
| F-2-1 | Kept `?demo=1` on sample approval URLs. Demo receipts use only `demo:worklog-bridge:receipts`, reset clears them, and no production approval request occurs. | C `@claim:local-demo`; L `/?demo=1`, `/approve?demo=1` |
| F-2-2 | Kept per-history-entry scroll/focus state and restoration guard. | A `back and forward restore route scroll and focus`; L `/privacy` then Back |
| F-2-3 | Kept signing behavior registered as a claim. | C `@claim:release-signing-mode`; T |
| F-2-4 | Kept route-specific title, description, canonical, Open Graph, and Twitter metadata. | A `routes set specific metadata and the 404 uses plain recovery copy`; L all routes |
| F-2-5 | Kept **entry** for the editable unit and **worklog** for the finished record. | `.factory/copy-audit.md`; L `/`, `/demo` |
| F-2-6 | Kept receipt wording plain and specific to the accepted worklog. | `.factory/copy-audit.md`; C `@claim:approval-receipt`; L `/` |
| F-2-7 | Kept the genuine 404 as “Page not found” with a Return home link. | A route/404 regression; L `/not-a-real-page` |
| F-3-1 | Added an accessible clipboard-denial recovery dialog. It selects a labelled read-only approval URL and says “Copy this approval link, then send it to your client.” The status supplies a plain next step; raw browser exceptions are never shown. | A `@regression:clipboard-denial shows a selected approval link without browser error text`; S; L `/?demo=1` |

## Round-3 additions

- The first-screen result now says “Your real worklog stays unchanged.”
- `.factory/catalog-description.txt` is a verb-first, 74-character sentence.
- Linux desktop prerequisites now include `libglib2.0-dev`, which the Tauri
  WebView build requires.

No unresolved review finding remains.

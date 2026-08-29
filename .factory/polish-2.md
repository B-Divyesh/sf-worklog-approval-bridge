# Polish round 2 — finding closure

Candidate reviewed: `6fdf8575d0e91aca057eefac86c7259c10e07b53`  
Adversarial report: `e0a59515e8c9bcb002121ef5aff9f5628914b64a`

Every finding from review rounds 1 and 2 was rechecked. Evidence paths below are from the final clean-clone and cold live runs.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept **Load sample project** as the installed app's first-run action. It opens the six-entry isolated sample. | `@claim:desktop-sample-project`; `/tmp/worklog-polish-2/live-demo/screenshot-desktop.png` |
| F-1-2 | Kept license checks for valid, absent, invalid, expired, revoked, offline, and 24-hour cache states. | `@claim:license-unlock` |
| F-1-3 | Followed a controlled Sociobot checkout fixture and asserted the hosted **$12.00 / Month** outcome and retained licensed history. | `@claim:pro-price` |
| F-1-4 | Traversed demo editing, approval, receipt reload, and download while recording every request and rejecting analytics or advertising traffic. | `@claim:no-analytics`; `@claim:local-demo`; live `npm run verify:live` |
| F-1-5 | Kept entry editing, minutes, readiness, removal, reload, and exported results registered as one observable claim. | `@claim:entry-review` |
| F-1-6 | Kept the unsupported cross-device license statement removed. | `.factory/copy-audit.md`; landing and README audit |
| F-1-7 | Kept checkout copy limited to the tested Sociobot route; no merchant, refund, or cancellation promise remains. | `@claim:pro-price`; copy audit |
| F-1-8 | Kept the legal-identity limitation in Terms, where it describes the contract rather than product behavior. | `/terms`; accessibility route test |
| F-1-9 | Kept GitHub API release discovery, immutable asset selection, cache, and unavailable-files state registered and tested. | `@claim:release-discovery` |
| F-1-10 | Kept the public health response restricted to service, version, and deployed commit. | `@claim:public-health-fields`; live `/api/health` |
| F-1-11 | Replaced the absolute hero claim with the precise sharing boundary. Added an installed-app sandbox that imports, edits, exports, and shares without API or outbound traffic. | `@claim:installed-app-locality`; `@claim:worklog-details-local` |
| F-1-12 | Kept explicit manual removal instructions for desktop data. | `/privacy`; route accessibility test |
| F-1-13 | Kept editing and CSV export available in a clean, unlicensed real workspace. | `@claim:free-editor` |
| F-1-14 | Labeled the entire product, every route footer, Download, and README as an unsigned desktop preview. Registered signing behavior and partial-secret failure as a claim. | `@claim:release-signing-mode`; `/tmp/worklog-polish-2/live-root/screenshot-desktop.png` |
| F-1-15 | Kept the decorative hero eyebrow removed. | `.factory/copy-audit.md` |
| F-1-16 | Kept the first-screen caption specific to Git commits and calendar events. | `.factory/copy-audit.md`; live root screenshot |
| F-1-17 | Kept the factual “Sample weekly worklog” section label. | `.factory/copy-audit.md` |
| F-1-18 | Kept the preview heading specific to the worklog. | `.factory/copy-audit.md` |
| F-1-19 | Kept the preview sentence specific to selected commits, events, and the client. | `.factory/copy-audit.md` |
| F-1-20 | Kept “traces” removed in favor of Git commits and calendar events. | `.factory/copy-audit.md` |
| F-1-21 | Kept the receipt explanation in plain words and tied it to the accepted worklog. | `.factory/copy-audit.md`; `@claim:approval-receipt` |
| F-1-22 | Kept the three-step heading specific to creating and approving a worklog. | `.factory/copy-audit.md` |
| F-1-23 | Kept the privacy label factual: what Worklog Bridge collects. | `.factory/copy-audit.md` |
| F-1-24 | Kept the privacy heading specific to selected commits and calendar events. | `.factory/copy-audit.md` |
| F-1-25 | Kept the negative privacy heading complete when read alone. | `.factory/copy-audit.md` |
| F-1-26 | Kept the pricing heading specific to the free editor and Pro calendar tools. | `.factory/copy-audit.md` |
| F-1-27 | Kept the Pro offline explanation split into short, plain sentences. | README copy audit |
| F-1-28 | Kept the release workflow explanation split by platforms and trigger. | README copy audit |
| F-1-29 | Kept the subjective “calm” wording removed; the fallback states that release files are unavailable. | `@claim:release-discovery` |
| F-1-30 | Kept Git import wording specific to commit dates, subjects, and hashes. | README copy audit; `@claim:git-metadata` |
| F-1-31 | Kept browser jargon out of the demo privacy sentence. | README copy audit; `@claim:local-demo` |
| F-1-32 | Kept the `#` portion of private approval links explained in plain words. | README copy audit; `@claim:worklog-details-local` |
| F-1-33 | Kept “packet digest” replaced by the specific SHA-256 worklog identifier. | README copy audit; `@claim:worklog-details-local` |
| F-1-34 | Kept the pricing label factual: “Monthly plan.” | `.factory/copy-audit.md` |
| F-2-1 | Demo links now include `?demo=1`. Demo acceptance and receipts use `demo:worklog-bridge:receipts`, never call `/api/approvals`, survive reload, clear on reset, and leave real data untouched. | `@claim:local-demo`; live `npm run verify:live`; `/tmp/worklog-polish-2/live-demo/` |
| F-2-2 | History state records scroll and focused-element index. A restoration guard prevents focus events from overwriting saved positions. | `back and forward restore route scroll and focus`, 10 consecutive passes |
| F-2-3 | Added signing behavior to the claim registry and a dedicated source/workflow/README test. | `@claim:release-signing-mode`; `.factory/claims.json` |
| F-2-4 | Added route-specific description, Open Graph description, canonical URL, and title updates for Demo, Worklog, Download, Privacy, Terms, and 404. | `routes set specific metadata and the 404 uses plain recovery copy`; live verifier JSON under `/tmp/worklog-polish-2/live-*` |
| F-2-5 | Standardized the editable unit as **entry** and the finished artifact as **worklog**. | `.factory/copy-audit.md` terminology table; source/README search |
| F-2-6 | Replaced “server-attested” with a receipt signed by the service and plain acceptance language. | README copy audit; `@claim:approval-receipt` |
| F-2-7 | Replaced metaphorical 404 copy with “Page not found” and a “Return home” link. | genuine live HTTP 404; route metadata/404 test |

## Acceptance evidence

- Every one of the 22 commands in `.factory/claims.json` passed separately from a clean clone. Logs: `/tmp/worklog-polish-2/release-claim-logs/`.
- The same clean clone passed 27 Node/service/workflow tests, 36 Chromium tests, 2 Rust tests, and `npm run build`. Logs: `/tmp/worklog-polish-2/release-*.log`.
- `npm run build:desktop` produced the 0.1.20 AppImage, Debian, and RPM bundles under `src-tauri/target/release/bundle/`.
- Local mobile Lighthouse scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. FCP was 1.1 s, LCP 1.4 s, TBT 0 ms, and CLS 0. Evidence: `/tmp/worklog-polish-2/lighthouse.json`.
- Cold live checks covered `/`, `/?demo=1`, `/privacy`, `/terms`, the isolated approval flow, a real approval lookup, hosted checkout, API identity, console errors, and a genuine HTTP 404. Evidence: `/tmp/worklog-polish-2/live-*` and `/tmp/worklog-polish-2/live-e2e-final.log`.
- Playwright Axe reported zero violations on the final live landing, demo, Privacy, Terms, and Download routes. Evidence: `/tmp/worklog-polish-2/axe-live/playwright-results.json`.

No review finding remains open.

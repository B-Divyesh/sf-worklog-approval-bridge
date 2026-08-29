# Polish round 1

Candidate repaired from `4aafb0e1a9f0a8694e6523391490eedeb07d7735`; adversarial report: `.factory/review-1.md`.

| Finding | Change made | Evidence |
|---|---|---|
| F-1-1 | Added **Load sample project** to the `/app` empty state. It enters `/demo`, seeds only `demo:`, preserves real storage, and shows the banner/reset/exit controls. | `@claim:desktop-sample-project`; `tests/claims.spec.ts`; local demo screenshot `/tmp/worklog-evidence/local-demo/screenshot-desktop.png` |
| F-1-2 | The one license claim test now exercises valid, absent, invalid, expired, revoked, offline, and 24-hour cache states. | `@claim:license-unlock` |
| F-1-3 | The price claim now verifies the price, included features, Sociobot checkout route, and persistent licensed approval history. | `@claim:pro-price` |
| F-1-4 | The analytics claim now allows only explicit shell paths and rejects analytics, advertising, collection, event, and telemetry paths. | `@claim:no-analytics` |
| F-1-5 | Registered and tested the full entry review workflow. | `@claim:entry-review` |
| F-1-6 | Removed the untestable cross-device license statement. | landing copy audit |
| F-1-7 | Reduced checkout wording to the tested Sociobot checkout route; removed merchant/refund/cancellation assertions. | `@claim:pro-price`; `@claim:release-discovery` |
| F-1-8 | Kept the legal-identity limitation only in Terms, not product behavior copy. | `/terms` route accessibility test |
| F-1-9 | Registered the API-only immutable-release discovery and unavailable-files state. | `@claim:release-discovery` |
| F-1-10 | Registered the exact public health field allowlist. | `@claim:public-health-fields` |
| F-1-11 | Removed the unsupported installed-app locality assertion from Download. The desktop sample behavior is tested separately. | `@claim:desktop-sample-project` |
| F-1-12 | Replaced ambiguous uninstall wording with an explicit manual desktop-data removal instruction. | `/privacy` route test |
| F-1-13 | Registered an unlicensed real-workspace editing/export claim. | `@claim:free-editor` |
| F-1-14 | Made the entire download experience explicitly a preview while the release workflow now blocks macOS/Windows publication unless notarization and Authenticode secrets are present and verifies signatures. | `.github/workflows/release.yml`; `/download` screenshot in local route suite |
| F-1-15 | Removed the hero eyebrow. | landing copy audit |
| F-1-16 | Rewrote the hero caption with Git and calendar terms. | landing copy audit |
| F-1-17 | Replaced the preview eyebrow with “Sample weekly worklog.” | landing copy audit |
| F-1-18 | Rewrote the preview heading. | landing copy audit |
| F-1-19 | Rewrote the preview description. | landing copy audit |
| F-1-20 | Replaced “traces” with Git commits and calendar events. | landing copy audit |
| F-1-21 | Rewrote the receipt explanation in plain words. | landing copy audit |
| F-1-22 | Rewrote the three-step heading. | landing copy audit |
| F-1-23 | Replaced the privacy eyebrow with a factual label. | landing copy audit |
| F-1-24 | Replaced vague source wording with selected commits and calendar events. | landing copy audit |
| F-1-25 | Completed the privacy heading. | landing copy audit |
| F-1-26 | Rewrote the pricing heading with the actual free and Pro tools. | landing copy audit |
| F-1-27 | Split and simplified the Pro offline sentence. | README audit |
| F-1-28 | Split and simplified the release-workflow sentence. | README audit |
| F-1-29 | Replaced subjective fallback language with the actual unavailable-files message. | `@claim:release-discovery` |
| F-1-30 | Rewrote Git behavior in user terms. | README audit |
| F-1-31 | Replaced browser-jargon privacy wording. | README audit; `@claim:local-demo` |
| F-1-32 | Explained the `#` portion of the private link in plain words. | README audit |
| F-1-33 | Replaced “packet digest” with “SHA-256 worklog identifier.” | README audit; `@claim:worklog-details-local` |
| F-1-34 | Replaced the promotional pricing eyebrow. | landing copy audit |

## Verification

- Clean clone: all 20 `.factory/claims.json` commands passed after `npm ci`, `npm --prefix api ci`, and the documented Tauri Linux packages.
- Full local suite: `npm test` passed (21 Node tests, 32 Chromium tests); `cargo test --manifest-path src-tauri/Cargo.toml` passed (2 Rust tests).
- Build: `npm run build` passed; initial JavaScript is 14.78 KB gzip across two chunks.
- Local browser verification: `/opt/fleet/lib/verify-url.sh` passed for `/` and `/demo`; evidence is in `/tmp/worklog-evidence/local-root/` and `/tmp/worklog-evidence/local-demo/`.
- Playwright Axe scans cover `/`, `/demo`, `/privacy`, `/terms`, `/download`, `/missing-page`, and approval routes with no serious or critical violations.

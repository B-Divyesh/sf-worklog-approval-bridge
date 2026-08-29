# Worklog Bridge — polish round 2 handoff

## Outcome

All findings in `.factory/review-1.md` and `.factory/review-2.md` are closed. Worklog Bridge remains a Tauri 2 desktop app with its original editorial ledger design. The site and every app route clearly identify the current build as an unsigned desktop preview.

The sample path is one click from the first screen and opens directly at `https://worklog-approval-bridge.sociobot.in/?demo=1`. Sample edits and approvals use only `demo:` storage. Reset removes sample edits and receipts. Start for real removes every demo key without reading or changing the real workspace.

## Verification

- Every command in `.factory/claims.json` passed separately from the clean clone `/tmp/worklog-polish2-final-sof9pa/repo`. All 22 logs are in `/tmp/worklog-polish-2/final-claim-logs/`.
- `npm test` passed 27 Node/service/workflow tests and 36 Chromium tests. This includes keyboard, mobile, metadata, HTTP 404, focus/scroll restoration, Axe, privacy, offline, demo isolation, hosted pricing, and receipt flows.
- `cargo test --manifest-path src-tauri/Cargo.toml` passed 2 Rust tests for Git metadata and repository-upload boundaries.
- `npm run build` produced `dist/site`. Initial JavaScript is 15.60 KB gzip; CSS is 4.85 KB gzip.
- `npm run build:desktop` produced `Worklog Bridge_0.1.19_amd64.AppImage`, `.deb`, and `.rpm` bundles locally.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; FCP 1.1 s, LCP 1.4 s, TBT 0 ms, CLS 0. Evidence: `/tmp/worklog-polish-2/lighthouse.json`.
- The worker URL verifier returned no console errors and found a title, `lang="en"`, one h1, a main landmark, and complete image/button names on `/`, `/?demo=1`, `/privacy`, and `/terms`. Screenshots and JSON: `/tmp/worklog-polish-2/live-*`.
- The live end-to-end verifier passed hosted checkout, exact API identity, demo-only acceptance with no approval API call, real approval lookup, and genuine HTTP 404 behavior. Log: `/tmp/worklog-polish-2/live-e2e-final.log`.
- The release verifier checks that the `v0.1.19` target, `latest.json`, checksums, and all platform provenance records resolve to one source commit.

Run locally with `npm ci && npm test && npm run build`. Run the desktop shell with `npm run tauri dev`. The complete finding map is `.factory/polish-2.md`.

## Known gaps

No review or product acceptance gaps remain. Published packages are deliberately unsigned preview builds and are labeled that way throughout the product.

## Needs operator action

Signing secrets are optional. Tag-triggered releases always build an unsigned preview, even when signing secrets are present. A manual release with `sign_release` set to `false` also builds an unsigned preview. Set `sign_release` to `true` only when all platform signing secrets are available. macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. When signing is requested, a partly configured secret set fails before packaging instead of silently producing an unsigned file.

No signing credentials are stored in this repository.

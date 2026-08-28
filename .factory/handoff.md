# Worklog Bridge handoff

## What was built

- Tauri 2 desktop app with a Vite and vanilla TypeScript interface.
- Local worklog editor with client, week, rate, manual entries, review state, redaction by removal, filtering, and keyboard shortcuts.
- Rust Git collector that reads hash, date, and subject from an explicitly named repository. It does not read file contents.
- Pro-gated ICS calendar import and local approval packet history.
- CSV export for every user.
- Private approval links whose packet lives in the URL fragment. The client view checks the packet digest, records acceptance, and downloads a receipt containing the packet and two SHA-256 digests.
- One-click `/demo` with six realistic entries in a separate `demo:` storage namespace, plus reset and exit controls.
- $12/user/month Sociobot checkout, return-token storage, restore field, daily verification cache, offline optimistic state, and inactive-license handling.
- Static landing, `/download`, `/privacy`, `/terms`, `/approve`, and styled not-found routes.
- Night-market neon identity, an original generated hero, responsive WebP images, an original app icon, and a 1200×630 social card.
- Service worker shell cache, release-aware platform downloads, checksum-checking install scripts, and a four-target GitHub Actions release workflow.

## How to run

```sh
npm ci
npm run dev
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

`npm run build` produces `dist/site/index.html`, the exact static deploy root. Use `npm run dev:tauri` for the desktop shell after installing the Tauri system prerequisites.

## Verification completed

- `npm test`: 11 Playwright tests passed in Chromium 1.58.2.
- Claims covered: offline reload, CSV export, same-origin demo flow, digest receipt, no capture APIs, ICS import, Pro license activation, and Git metadata collection.
- `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata`: passed against a temporary one-commit repository.
- Axe: zero serious or critical findings across home, demo, privacy, terms, download, and not-found routes. Color contrast checks were enabled.
- Console crawl: no browser console errors across those routes.
- Mobile: 390×844 demo workflow passed with no horizontal overflow.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Production budget: 12.13 KB gzip initial app JavaScript, 4.61 KB gzip CSS, 44 KB mobile hero WebP, 96 KB desktop hero WebP, and no runtime font download.
- Lighthouse mobile on the production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0, TBT 20 ms. INP is unavailable in a lab run; TBT is the interaction proxy.

## Design and privacy notes

- `.factory/design.md` contains palette, typography, spacing, motion, prompt, provenance, and responsive decisions.
- The generated source image and prompt sidecars are in `assets/src/`. Build-time Sharp output keeps both hero variants under 100 KB.
- The demo never reads or writes the real `worklog-bridge:project` key.
- The app makes no tracking request. Network use is limited to explicit billing verification and GitHub release metadata.
- The brief specifies a $12 monthly subscription. That recurring price takes precedence over the attached paid-unlock skill’s one-time-purchase wording; the same Sociobot checkout and license verification contract is used.

## Known limits

- Calendar v1 imports user-selected ICS files. It does not request Google or Microsoft OAuth access.
- Approval links are practical for weekly worklogs but use URL fragments rather than a hosted database. The client must return the downloaded receipt to the worker for off-device retention.
- Approval digests detect changed packet data but do not verify a client’s legal identity.
- The desktop source picker is a typed repository path in v0.1. A native folder picker is a suitable follow-up.

## Needs operator action

- Run or approve the `v0.1.0` GitHub Actions release and confirm all `.dmg`, `.msi`/`.exe`, `.AppImage`, `.deb`, `SHA256SUMS`, and `latest.json` assets.
- macOS and Windows bundles are intentionally unsigned. For signing, configure `APPLE_CERTIFICATE`, Apple notarization credentials, and `WINDOWS_CERT_PFX` plus its password, then extend the workflow with the operator’s certificate details.
- Register the product slug with the Sociobot billing system and set the production return URL. No product ID is hardcoded.
- Deploy `dist/site/` through the factory. No DNS or infrastructure changes were made here.

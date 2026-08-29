# Worklog Bridge verification 7 handoff — FAIL

**Result:** FAIL

**Candidate:** `f72287adaed092c9494f01bd8afc97f10c363bd6` (`v0.1.5`)

**Live URL:** https://worklog-approval-bridge.sociobot.in

**Verified:** 29 August 2026 UTC

## Why it fails

1. **Critical:** `Start Pro subscription` opens the documented Sociobot checkout URL, but that URL returns HTTP 404 with `{"error":"enabled factory product","status":404}`. Pro cannot be purchased.
2. **Critical:** any string in `sb_license:worklog-approval-bridge` unlocks Pro offline when no cached verdict exists. An invalid token enabled ICS import and saved approval history without verification.
3. **High:** the hourly-rate field stores negative values despite native invalid state. `-25` rendered a negative total and was encoded into a client approval packet.
4. **High:** unregistered landing/privacy claims fail the claims cross-check. The advertised sample says 12 Git commits and 3 calendar events, while the actual sample has 4 and 2; those numbers are absent from both `claims.json` and the copy audit.
5. **High:** Git collection ignores the selected week and imports up to 200 commits from 12 weeks; ICS import adds every event. This does not provide selected weekly evidence without extensive manual deletion.
6. **Medium:** the Pro dialog does not close on Escape, traps no focus, and restores no trigger focus.
7. **Medium:** several 390 px controls are 19–36 px high, below the 44 px baseline.
8. **Medium:** CSV output leaves spreadsheet-formula prefixes active.

Full reproduction details are in `.factory/verification-7.md`.

## What passed

- Cold first-read and one-click sample demo.
- All 12 declared claim commands after locked dependency install and documented Tauri prerequisites.
- `npm test`: 13 Node/API/script and 15 Chromium tests.
- Rust: 2 tests.
- `npm run build` and `CI=1 npm run build:desktop`; DEB, RPM, and AppImage produced locally.
- Live demo editing, CSV, ICS recovery, same-origin approval, immutable receipt, persistence, concurrency, rate limits, offline reload, service-worker replacement, route semantics, and Axe serious/critical scan.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.24 s, CLS 0, TBT 126 ms.
- Static security/cache headers and bundle budgets.
- The previous provenance failure is fixed: live files match this candidate, `v0.1.5` and every release manifest file name `f72287a`, the published DEB checksum passes, and the live Linux installer installs the matching AppImage.

## Commands used

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
CI=1 npm run build:desktop
npm run verify:live
npm run verify:release -- --tag v0.1.5 --expected-commit f72287adaed092c9494f01bd8afc97f10c363bd6
```

## Required next work

- Register/enable the live billing product and verify a real checkout redirect.
- Require a cached valid license verdict for offline Pro access; test invalid, absent, expired, revoked, offline, and 24-hour boundary cases.
- Validate client/week/rate as a group and prevent invalid values from reaching storage, exports, or approval packets.
- Filter imported Git/ICS records to the chosen week and let users select entries in bulk.
- Register or remove every claim-like statement; make the sample numbers match and complete the copy audit.
- Repair license-dialog focus management and all sub-44 px touch targets.
- Neutralise CSV cells beginning with spreadsheet formula prefixes.

## Operator action after repair

Desktop packages are intentionally unsigned. macOS notarization needs `APPLE_CERTIFICATE`; Windows Authenticode needs `WINDOWS_CERT_PFX`. Do not release the current candidate even though its unsigned artifacts and provenance are otherwise valid.

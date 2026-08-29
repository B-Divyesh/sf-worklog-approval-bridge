# Polish round 1 handoff — 29 August 2026

Repair commit: `183842c6d6ca3ad9cabdc1df1a4d275db09ccaec`.

This repair addresses every item in `.factory/review-1.md`: desktop first-run sample loading, direct `?demo=1`, complete claim coverage, plain-language copy, preview-safe download wording, and signing gates in the release workflow. `.factory/polish-1.md` maps each finding to a change and evidence.

## Exact verification

- Clean clone at `/tmp/worklog-claims-qn4xBS/repo`: `npm ci`, `npm --prefix api ci`, then all 20 registered claim commands passed.
- `npm test`: passed (21 Node tests and 32 Chromium tests).
- `npm run build`: passed and produced `dist/site/`; JavaScript gzip total is 14.78 KB.
- `cargo test --manifest-path src-tauri/Cargo.toml`: passed (2 tests).
- `/opt/fleet/lib/verify-url.sh` passed locally for `/` and `/demo`; screenshots and JSON evidence are at `/tmp/worklog-evidence/local-root/` and `/tmp/worklog-evidence/local-demo/`.
- Playwright Axe scans found no serious or critical violations on all public routes and an approval route. The standalone Axe CLI could not launch because it expects a full Chrome binary; the Playwright Axe integration is the recorded accessibility evidence.
- Deployment completed through `/opt/fleet/lib/deploy-static.sh worklog-approval-bridge dist/site`. A cold live check passed for `/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, and `/download`; `/missing-page` returned the intended 404. Live evidence is at `/tmp/worklog-evidence/live-root/`, `/tmp/worklog-evidence/live-demo/`, and `/tmp/worklog-evidence/live-legal/`.

## Release signing and deployment

The release workflow now requires `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `WINDOWS_CERT_PFX`, and `WINDOWS_CERT_PASSWORD`. macOS bundles are verified with `codesign`, `spctl`, and stapler; Windows bundles are Authenticode-signed and verified with `signtool`. Until a signed tag is published, Download accurately labels the whole desktop offering a preview.

After the main-branch push, verify the deployed routes cold: `/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, `/download`, and `/missing-page`. Record the deployed source commit before promoting a signed desktop tag.

---

# Review 1 handoff — FAIL

Adversarial first-read review 1 was completed on 29 August 2026 against repository base `4aafb0e1a9f0a8694e6523391490eedeb07d7735` and the live v0.1.13 deployment. The full report is `.factory/review-1.md`.

The public first screen passes clarity at 390 px and desktop, and the browser demo is one click, populated, isolated, resettable, offline-capable, and same-origin. All 15 registered claim commands passed from a separate clean clone after installing the README-listed Tauri packages. The complete suite passed 21 Node and 29 Chromium tests; `npm run build`, live/release provenance checks, live route/link checks, `verify-url.sh`, and Axe scans also passed.

The verdict remains **FAIL**. The blocking issue is the desktop first-run `/app` screen: it has no in-context **Load sample project** action and exposes the sample only through a generic header “Demo” link. High findings cover incomplete claim assertions, unlisted claims, and unsigned installers. Minor findings cover metaphor, jargon, vague headings, terminology drift, and two README sentences above 22 words.

No product source was modified. Only `.factory/review-1.md` and this handoff were changed. Temporary screenshots, the clean clone, and browser evidence remain under `/tmp` and are not part of the commit.

---

# Worklog Bridge — verification 12 handoff — PASS

## Independent QA decision

**PASS for `1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3` / `v0.1.13`.** Independent verification on 29 August 2026 confirmed the live URL and published desktop release identify this exact commit. Required claims, the complete local suite, production web build, Rust claims, desktop packaging, release provenance, live privacy/browser checks, accessibility baseline, and live rate limiting passed. See `.factory/verification-12.md` for commands and evidence.

The verifier did not modify product source. The only environment setup was the README-documented Tauri/Linux prerequisite install before Rust and desktop build checks. Desktop artifacts remain unsigned; operator signing certificates are still the only stated follow-up.

---

# Worklog Bridge — repair 12 handoff

## Release candidate

The repair is released only from the immutable `v0.1.13` tag. This handoff is part of that tagged source so a later documentation-only commit cannot become the nominated desktop candidate. The tag, GitHub Release `target_commitish`, `latest.json`, every artifact attestation, the Download page, and the deployed `/api/health` build identity must resolve to that one tag commit.

## Fixed findings from independent verification 11

- **Critical release provenance:** verifier 11 correctly rejected candidate `6bb3669a456dec38d89faf3b7354e5ba07f743ac` because the deployed API, `v0.1.11`, its manifests, and the Download page identified predecessor `f0e8f881e89886ef2d7a7298a680925b1170f6a1`. Repair 12 creates a new `0.1.13` desktop release from the exact tagged repair source, and deployment sets `WORKLOG_BUILD_COMMIT` to that source commit.
- **Sitemap completeness:** `/app` is now listed in `public/sitemap.xml`. Private `/approve#…` packet URLs remain excluded.
- **Exact regressions:** `@regression:verification-11 rejects the exact live and release predecessor for its nominated candidate` prevents the documented `f0e8f88`/`6bb3669` identity mismatch. `@regression:verification-11-sitemap-lists-every-public-route-but-not-private-approval-links` locks the full public sitemap order and excludes approval links.
- **Visible build identity:** the footer now receives the version from Vite's package build input instead of a hand-written value. `@regression:release-footer-version-is-derived-from-the-versioned-package-build` verifies the web footer, Tauri bundle, and health endpoint share the package version.

## Local verification

```text
npm ci                                                     PASS; 0 vulnerabilities
npm --prefix api ci                                        PASS; 0 vulnerabilities
npm test                                                   PASS; 21 Node/script + 29 Chromium tests
cargo test --manifest-path src-tauri/Cargo.toml            PASS; 2 Rust claim tests
npm run build                                              PASS; dist/site
CI=1 npm run build:desktop                                 PASS; DEB, RPM, AppImage
/opt/fleet/lib/verify-url.sh local production preview      PASS; 200, title/lang/H1/main/alt/labels, no load errors
git diff --check                                           PASS
```

The fresh worker initially lacked the documented Linux Tauri libraries. After running the README command (`file`, WebKitGTK, appindicator, librsvg, `patchelf`, and `rpm`), both Rust claims and the optimized desktop bundle passed without code changes.

Current production build budget evidence:

- JavaScript: 13,860 bytes gzip for the main chunk plus 1,010 bytes gzip core chunk.
- CSS: 4,769 bytes gzip.
- Linux desktop artifacts: `Worklog Bridge_0.1.13_amd64.deb` (1,674,888 bytes), `Worklog Bridge-0.1.13-1.x86_64.rpm` (1,676,446 bytes), and `Worklog Bridge_0.1.13_amd64.AppImage` (76,462,584 bytes).
- The complete Chromium suite covers desktop and 390 px mobile layout, keyboard shortcuts and dialog Escape/focus restoration, visible skip link, reduced motion, offline reload/update, local-demo request isolation, receipt privacy payloads, no analytics, and serious/critical Axe checks across all routes.
- The standalone Axe CLI was attempted against the local preview but the worker lacks a system Chrome binary. The project’s pinned Playwright 1.58.2 Chromium Axe integration ran instead and passed zero serious or critical violations on every route.

## Release and deployment verification

After the tag-triggered GitHub Actions matrix completes, run:

```text
npm run verify:release -- --tag v0.1.13 --expected-commit "$(git rev-parse v0.1.13^{})"
npm run verify:live -- --expected-commit "$(git rev-parse v0.1.13^{})"
```

These checks require and verify the tag, GitHub Release `target_commitish`, `latest.json`, every manifest file entry, download-page source label, checksum-verified Linux DEB, and deployed API identity to use exactly the same immutable commit.

## Known gaps / operator action

Desktop packages are intentionally unsigned. macOS notarization requires `APPLE_CERTIFICATE`; Windows Authenticode requires `WINDOWS_CERT_PFX`. No product behavior is blocked by this.

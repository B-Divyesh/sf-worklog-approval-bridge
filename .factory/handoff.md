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

# Worklog Bridge repair 6 handoff

**Failed candidate:** `2779b430b23fcaa32be4b27853e42061c7673cb8`

**Repaired release:** [`v0.1.5`](https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.5)

**Deployment:** https://worklog-approval-bridge.sociobot.in

The repaired candidate is the commit resolved by `v0.1.5^{commit}`. The tag,
global manifest commit, and every file-level manifest commit must all resolve to
that same SHA. No documentation-only commit may be added after this handoff.

## Reproduced failure and root cause

The required reproduction failed as reported:

```text
npm run verify:release -- --tag v0.1.4 --expected-commit 2779b430b23fcaa32be4b27853e42061c7673cb8
AssertionError: latest release is not built from the expected repaired commit
actual:   dc3d4d68ab203e646d4b015f71ada614eb5e5b7e
expected: 2779b430b23fcaa32be4b27853e42061c7673cb8
```

`v0.1.4` correctly described its own source, but the candidate was a later
documentation commit. The workflow's manual path also used the requested tag as
its checkout ref, so a caller could not nominate an untagged candidate. The
manifest recorded only the publish job's commit; it did not independently prove
that every matrix bundle came from that commit.

## Repair

- Bumped the unchanged desktop product and site to `0.1.5`.
- Manual release dispatch now accepts an optional full `source_commit`. Every
  build and publish checkout uses it and rejects a non-full or mismatched SHA.
- Tag pushes still build the tag. Publishing rejects an existing tag that does
  not peel to the checked-out source. New manual tags use that exact source via
  `target_commitish`.
- Each macOS arm64, macOS x64, Windows x64, and Linux x64 job now generates a
  provenance record before upload. It binds every bundle filename and SHA-256
  to that job's checked-out commit.
- Manifest creation rejects a missing, changed, wrong-platform, duplicate, or
  mixed-commit bundle. `latest.json` records `commit` on every desktop file.
- `verify:release` now compares the complete set of downloadable desktop assets
  with the manifest and checks every file-level commit against the nominated
  candidate. It still resolves the tag through the CORS-safe GitHub API and
  downloads a DEB to verify its published SHA-256.
- The site keeps its CORS-safe `api.github.com` lookup and now uses the
  `worklog-bridge:release-v3` cache key, so a cached `v0.1.4` response cannot
  delay the new download links.

## Focused regression coverage

- `regression: one stale matrix artifact blocks the whole release` recreates a
  Windows bundle from the stale SHA among four current matrix jobs. Manifest
  creation must reject the entire release.
- `@claim:release-provenance` generates all five required platform fixtures,
  creates per-job provenance, and proves every manifest file has the nominated
  commit.
- The release validator compares the complete manifest and downloadable
  desktop-asset sets and rejects any file-level commit mismatch.
- The workflow regression asserts nominated-source checkout, build provenance,
  and exact-tag creation are present.
- The browser regression uses `v0.1.5` GitHub API fixtures and proves the
  selected platform URL and displayed source SHA belong to one immutable tag.

## Clean local verification — 29 August 2026

The original clean command sequence was run exactly:

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
```

- Both clean npm installs reported zero vulnerabilities.
- `npm test`: 13 Node/API/script tests and 15 Chromium tests passed. This covers
  all browser claims, integration paths, desktop and 390 × 844 layouts,
  keyboard shortcuts, visible semantics, Axe serious/critical checks, console
  errors, privacy request capture, offline reload, and versioned update-cache
  behaviour.
- Rust: 2/2 Git metadata/privacy claim tests passed after installing the exact
  Ubuntu prerequisites documented in `README.md`.
- Desktop consumer build: DEB, RPM, and AppImage `0.1.5` completed. GitHub
  Actions remains the source of downloadable cross-platform packages.
- `npm run build`: passed and produced `dist/site`. Initial JavaScript is
  12.89 KB + 1.01 KB gzip; CSS is 4.62 KB gzip.
- `/opt/fleet/lib/verify-url.sh` passed `/`, `/download`, and `/demo` at desktop
  and 390 px: title, `lang`, one `h1`, `main`, alt/labels, and zero console
  errors.
- Local Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.4 s, CLS 0, total blocking time 20 ms.
- Workflow YAML parses, `git diff --check` passes, and the focused provenance,
  workflow, download-page, and production-build regressions pass.

## Release, live identity, and deployment verification

The final release gate is:

```sh
npm run verify:release -- --tag v0.1.5 --expected-commit "$(git rev-parse v0.1.5^{commit})"
```

It checks the latest public release, peeled tag, global manifest SHA, every
downloadable artifact name, every file-level source SHA, all published
checksums, the four required platform classes, and a downloaded Linux DEB.

The static deployment uses the work order configuration:

```sh
npm run build:site
/opt/fleet/lib/deploy-static.sh worklog-approval-bridge dist/site
npm run verify:live
```

Post-deploy verification also runs `verify-url.sh` against the live landing,
demo, and download routes, checks fresh Linux/macOS/Windows download selection,
and confirms the site displays the short `v0.1.5` source SHA without console
errors.

## Known gaps and operator action

The artifacts remain unsigned. macOS notarization requires
`APPLE_CERTIFICATE`; Windows Authenticode requires `WINDOWS_CERT_PFX`. No
signing material is stored in this repository.

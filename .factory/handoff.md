# Worklog Bridge — repair 14 handoff

## Scope and release candidate

This repair addresses every finding in independent verification 14 for
candidate `2ea2ddabf31be2b04b9904d33c21f2d3d81a2534`. The release candidate is
the single source commit that contains this handoff and is tagged `v0.1.17`.
The tag, GitHub Release target, `latest.json`, each desktop artifact, deployed
API health response, and Download page must all identify that exact commit.
No follow-up documentation commit is made after the tag; that prevents the
documentation-only provenance drift found by verification 14.

## Findings repaired

- **Release/deployment provenance (critical):** bumped the product to `0.1.17`
  and retained the release workflow's full-SHA checks. Publishing is only from
  the immutable tag. Deployment sets `WORKLOG_BUILD_COMMIT` to that tag's full
  commit before live verification. `@regression:verification-14 rejects the
  exact deployed and released predecessor for its nominated candidate` locks
  the documented `f00442c…` / `2ea2dda…` mismatch.
- **Clean native claim commands (high):** Tauri and `tauri-build` are optional
  `desktop` dependencies. The exact registered `cargo test` claims compile the
  collector without GTK/WebKit; `scripts/build-desktop.mjs` explicitly passes
  `--features desktop` for the installed app. The executable
  `@regression:verification-14 exact native claim commands run before Tauri
  prerequisites` invokes both exact claim commands from `npm test`.
- **390 px type baseline (low):** primary action help and the three product
  facts now compute to at least 16 px at the 390 px breakpoint while the
  existing desktop first-viewport composition is unchanged. The browser
  regression checks each computed size.

## Exact local evidence

- Clean install: `npm ci` (37 packages, 0 vulnerabilities) and
  `npm --prefix api ci` (28 packages, 0 vulnerabilities) passed.
- `npm test` passed 27 Node/script tests and 33 Chromium tests. This includes
  all 20 registered claims, desktop and 390 px mobile behavior, keyboard,
  dialogs, offline reload/update, privacy request checks, and zero serious or
  critical Playwright Axe violations.
- With `glib-2.0.pc` intentionally absent, both exact commands passed from a
  new Cargo target directory:
  `cargo test --manifest-path src-tauri/Cargo.toml claim_git_metadata` and
  `cargo test --manifest-path src-tauri/Cargo.toml claim_no_repository_upload`.
  The default claim graph has no GTK/GLib dependency.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`,
  `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`,
  and `cargo test --manifest-path src-tauri/Cargo.toml` passed.
- `npm run build` wrote `dist/site/`. Its JavaScript is 13.76 KB + 1.01 KB
  gzip, CSS is 4.80 KB gzip, and the first-page transfer is 60 KB.
- `CI=1 npm run build:desktop` passed and produced
  `Worklog Bridge_0.1.17_amd64.deb` (1,674,570 bytes),
  `Worklog Bridge-0.1.17-1.x86_64.rpm` (1,676,105 bytes), and
  `Worklog Bridge_0.1.17_amd64.AppImage` (76,458,488 bytes).
- The factory URL verifier passed local `/`, `/demo`, and `/privacy`: each
  loaded without console errors and had a title, `lang=en`, one h1, main
  landmark, alt text, and labelled buttons.
- Local Lighthouse using the pinned Playwright Chromium reported performance,
  accessibility, best practices, and SEO all at 100; FCP 1.0 s, LCP 1.3 s,
  CLS 0. Playwright's Axe integration is the accessibility evidence. The
  standalone Axe CLI was also invoked, but its bundled ChromeDriver targets
  Chrome 152 while the worker's supplied Chromium is 145; it cannot create a
  session. The equivalent pinned Playwright scan passed every public and
  approval route.
- `git diff --check` passed.

## Publish and deploy verification

From the commit tagged `v0.1.17`, publish the tag-triggered release and verify
it with:

```sh
npm run verify:release -- --tag v0.1.17 --expected-commit "$(git rev-parse v0.1.17^{})"
```

Deploy `dist/site` with `/opt/fleet/lib/deploy-static.sh
worklog-approval-bridge dist/site`, set `WORKLOG_BUILD_COMMIT` to the same
full tag commit on the managed API, then run:

```sh
npm run verify:live -- --expected-commit "$(git rev-parse v0.1.17^{})"
```

These are the release-blocking identity checks: they reject any predecessor in
the tag, GitHub Release, artifact manifest, Download page, or `/api/health`.

## Needs operator action

Desktop releases remain unsigned previews. Signed/notarized macOS bundles need
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Signed Windows packages need
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. A manual workflow run with
`sign_release` is required once those certificates are available.

# Worklog Bridge — verification 15 handoff

## PASS — independent release verification

**PASS** for candidate `030f1ad3d775d5b618bc8999b8e26dd2f3e2b7a8`, deployed at
<https://worklog-approval-bridge.sociobot.in> and released as `v0.1.18`.

The verifier ran every one of the 20 registered claim commands independently
from a clean `npm ci`; all passed. `npm test` passed 27 Node/script and 33
Chromium tests, Rust format/Clippy/tests passed, the static production build
passed, and the exact Linux desktop package build passed after installing the
README’s documented Tauri system dependencies. It produced DEB, RPM, and
AppImage bundles. `npm run verify:live` and `npm run verify:release` both
passed against this exact commit; local static JS, CSS, hero, and service-worker
hashes match the live deployment.

Live QA confirmed the one-click sample, local/demo separation, edit/export and
boundary/error recovery, durable one-time server-attested approval receipt,
tamper detection, same-origin worklog flow, no tracking/capture activity,
60-read/12-write minute rate limits with 429 `Retry-After: 60`, mobile and
keyboard use, zero serious/critical Axe findings, offline reload/service-worker
stale-cache cleanup, and Lighthouse 99 performance / 100 accessibility / 100
best-practices / 100 SEO. See `.factory/verification-15.md` for exact commands
and evidence.

Known operational constraint: desktop preview artifacts are unsigned unless an
operator supplies the documented signing credentials. No product defects were
found.

---

# Worklog Bridge — repair 15 handoff

## Scope and release candidate

This repair keeps the existing Worklog Bridge desktop app and static deployment
class. It preserves the repair-14 fixes for release provenance, clean native
claim commands, and the 390 px body-text baseline. The release candidate is
the commit containing this handoff and will be tagged `v0.1.18`; no
documentation-only commit follows that tag.

## Findings repaired

- **Verification 14, critical provenance mismatch:** the release workflow still
  requires one immutable full source SHA for the tag, GitHub Release,
  `latest.json`, platform artifacts, Download page, and deployed health
  response. The `@regression:verification-14` test rejects the documented
  `f00442c…` predecessor for candidate `2ea2dda…`.
- **Verification 14, clean native claims:** the collector claim graph excludes
  GTK/WebKit desktop dependencies. Both registered native claim commands run
  before Tauri packages are installed, while desktop packaging opts into the
  `desktop` feature.
- **Verification 14, 390 px type:** first-screen action help and all three
  product facts have a 16 px computed minimum at 390 px. The browser regression
  checks the computed values.
- **Controller review, signing-mode documentation:** Signing secrets are
  optional. Tag-triggered releases always build an unsigned preview, even when
  signing secrets are present. A manual release with `sign_release` set to
  `false` builds an unsigned preview. Set `sign_release` to `true` only when
  all platform signing secrets are available. When signing is requested, a
  partly configured secret set fails before packaging instead of silently
  producing an unsigned file. The `@regression:verification-13` coverage now
  checks the runtime mode, workflow branching, CLI message, and those exact
  documentation rules.

macOS signing and notarization, when explicitly requested, need
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing, when
explicitly requested, needs `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`.

## Verification evidence

- Clean install: `npm ci` passed with 37 packages and no vulnerabilities;
  `npm --prefix api ci` passed with 28 packages and no vulnerabilities.
- Required reproduction: `node --test --test-name-pattern
  '@regression:verification-13' scripts/signing-mode.test.mjs` first failed
  because this handoff omitted the requested partial-secret rule. It now passes
  both behavior and documentation subtests.
- Full test suite: `npm test` passed 27 Node/script tests and 33 Chromium
  tests. This includes all public routes at desktop and 390 px, keyboard
  shortcuts and focus restoration, dialog Escape behavior, reduced motion,
  offline reload/update, privacy request boundaries, response policy, and zero
  serious or critical Axe violations.
- Claim registry: each of the 20 commands in `.factory/claims.json` was
  invoked independently from the clean install and passed. The two native
  claims ran before desktop prerequisites, proving the repair-14 clean-worker
  behavior.
- Native quality: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`,
  Clippy with `--all-targets -- -D warnings`, and `cargo test` passed (two Rust
  claim tests).
- Production build: `npm run build` wrote `dist/site`. The main JavaScript is
  13.76 KB gzip, core JavaScript 1.01 KB gzip, and CSS 4.80 KB gzip. The mobile
  hero is 41,054 bytes WebP.
- Desktop package: after installing the README's Linux prerequisites,
  `CI=1 npm run build:desktop` produced
  `Worklog Bridge_0.1.18_amd64.deb` (1,674,636 bytes),
  `Worklog Bridge-0.1.18-1.x86_64.rpm` (1,676,153 bytes), and
  `Worklog Bridge_0.1.18_amd64.AppImage` (76,458,488 bytes).
- Browser/accessibility smoke: `/opt/fleet/lib/verify-url.sh` against local
  production output reported a 580 ms load, no console or page errors, one
  title/h1/main landmark, `lang=en`, zero images without alt text, and zero
  unlabeled buttons. `/`, `/demo`, `/app`, `/privacy`, `/terms`, and
  `/download` returned 200 locally; the static-routing regression locks the
  configured production 404 behavior. `git diff --check` passed.

## Release and deployment procedure

From the immutable repair commit, create and push `v0.1.18`. The tag workflow
builds unsigned preview packages by design. To sign a manual release, supply
the full source commit and set `sign_release` to `true` only after every
platform-specific secret above is configured.

After the tag workflow publishes the GitHub Release, deploy `dist/site` and
the managed receipt API from that same commit. Set `WORKLOG_BUILD_COMMIT` to
the tag commit before checking:

```sh
npm run verify:release -- --tag v0.1.18 --expected-commit "$(git rev-parse v0.1.18^{})"
npm run verify:live -- --expected-commit "$(git rev-parse v0.1.18^{})"
```

## Known gaps

Desktop packages are deliberately unsigned previews unless an operator starts
a manual signed release with the optional credentials above. This does not
change the local-first collector, CSV export, or approval receipt behavior.

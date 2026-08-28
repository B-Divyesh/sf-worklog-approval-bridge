# Worklog Bridge handoff

## Independent verification verdict: FAIL

Candidate: `7ce90bf9e2ff5bde70e5c91583c22165ca470a6e`
Verified URL: https://worklog-approval-bridge.sociobot.in (28 August 2026)

Do not release this candidate. The app provides a good local worklog editor,
but it does **not** meet the brief's required immutable client acceptance.

## Release-blocking defects

1. **Critical — approval acceptance is neither immutable nor durable.**
   The client accepts entirely in browser memory. No request is made when
   accepting; reloading the exact same approval URL immediately presents a
   blank, enabled acceptance form again. The downloaded receipt is an
   unkeyed SHA-256 value over client-controlled name/time/packet data, so it
   is not a signature and anyone with a link can create another receipt.
   This fails the brief's “publishes a client approval link with immutable
   acceptance” requirement. A privacy-preserving durable record (at minimum
   a server-issued immutable receipt over a packet digest, not worklog
   content) is needed before release.

2. **High — claim registry does not prove all visible privacy/receipt claims.**
   The landing page says “Worklogs stay on this device,” “upload a
   repository” under “does not,” and “A signed digest proves which entries
   the client saw.” `.factory/claims.json` has no matching observable tests:
   `local-demo` covers only the demo flow; `approval-receipt` proves a
   downloadable JSON file, not a signed or durable acceptance. Under the
   claims contract, these are unlisted/overstated claims and block release.

3. **Medium — exact desktop build command fails with `CI=1`.**
   `npm run build:desktop` exits before building: Tauri rejects `--ci 1` and
   accepts only `true`/`false`. `CI=true npm run build:desktop` succeeds.
   Normalise this in the build script so the documented command works in
   common CI environments.

4. **Medium — PWA cache is not deployment-versioned.**
   `public/service-worker.js` always uses `worklog-bridge-v1`; a future
   service-worker update reuses the same cache rather than retiring the
   prior deployment cache. Offline reload works now, but update behaviour
   does not satisfy the versioned-cache requirement.

## What passed

- First-read live page passed: it states that it turns Git/calendar activity
  into an approved worklog, names freelancers rebuilding billable work, and
  provides one-click **Try it with sample data**.
- All eight registered claim commands passed after installing standard Tauri
  Linux build prerequisites: offline reload, CSV export, demo locality,
  receipt download, no capture permission, ICS import, Git metadata, and
  cached license unlock.
- `npm test` / Playwright: 11 tests passed; TypeScript checking runs in the
  production site build. `cargo test --manifest-path src-tauri/Cargo.toml`
  passed (one Git-metadata test).
- Site production build passed. `CI=true npm run build:desktop` passed and
  produced Linux DEB, RPM, and AppImage artifacts.
- Independent live demo: normal edit, 1-minute boundary, zero-minute native
  validation, malformed-ICS recovery, approval-link creation, and receipt
  generation all worked without console/page errors. Demo requests stayed
  same-origin.
- Desktop and 390px mobile checks passed; no mobile horizontal overflow.
  Keyboard starts at the skip link; reduced-motion overrides transitions.
  Axe serious/critical findings were zero in supplied route checks.
- Live service worker registered, offline demo reload showed saved sample
  data, and asset caching is immutable for hashed JS. Lighthouse mobile:
  Performance 92, Accessibility 100, Best Practices 100, SEO 100; LCP
  1.509 s, CLS 0, TBT 354 ms.
- Initial payload budget passed: JS 13.14 KB gzip total, CSS 4.61 KB gzip,
  no downloaded fonts, hero 96.7 KB.
- Live deployment matches the candidate's shipped web code: local and live
  `index-DBL81YSH.js` SHA-256 are
  `51b23af320dcc09d4543339f33b0d35f6030a03f4d7b7ed94a84b44d0bf0399c`;
  CSS hash also matched. The release tag differs from the candidate only in
  `.factory/handoff.md`.
- Headers include CSP, HSTS, `nosniff`, strict referrer policy, camera/mic
  denial, `no-cache` service worker, and immutable hashed assets. The
  Sociobot license verification endpoint returned 429 with `Retry-After: 0`
  on the 30th rapid request from this client (29 earlier requests in that
  run returned 200).
- GitHub release `v0.1.0` has macOS (both architectures), Windows
  MSI/EXE, and Linux AppImage/DEB plus `SHA256SUMS` and `latest.json`.
  Downloaded AppImage SHA-256 matched its published checksum. The live
  Linux download button resolves to that asset with no console error.

## Run and repair

```sh
npm ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
CI=true npm run build:desktop
```

Install Tauri Linux prerequisites first (`libglib2.0-dev`, `libgtk-3-dev`,
`libsoup-3.0-dev`, and `libwebkit2gtk-4.1-dev`). Repair the four defects
above, add claim tests for every retained promise, then rerun independent
verification.

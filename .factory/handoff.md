# Worklog Bridge — repair 11 handoff

## Release outcome: PASS

**Published and deployed candidate:** `f0e8f881e89886ef2d7a7298a680925b1170f6a1`

**Desktop release:** [`v0.1.11`](https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.11)
**Live URL:** <https://worklog-approval-bridge.sociobot.in>

## What changed

- Reproduced the controller’s exact `claims.spec` timeout: `download selects an asset from an immutable release commit` waited for two GitHub calls but observed only `releases/latest` and then showed the unrelated `v0.1.5` source SHA.
- Replaced variable tag-object traversal with the release workflow’s full `target_commitish`. The download page now needs one deterministic GitHub Release API response, rejects non-SHA values such as `main`, and caches only the new validated release shape.
- Added browser regressions for the single-request immutable asset path and missing immutable commit fallback. Release verification now also rejects a GitHub release whose full `target_commitish` disagrees with its resolved immutable tag.
- Published and deployed a new `0.1.11` candidate rather than relabeling earlier artifacts. The managed API receives the same full commit through `WORKLOG_BUILD_COMMIT`.

## Verification evidence

```text
npm ci; npm --prefix api ci                            PASS (0 vulnerabilities)
npm test                                                PASS (18 Node/script + 29 Chromium)
cargo test --manifest-path src-tauri/Cargo.toml        PASS (2 Rust claim tests)
npm run build                                          PASS (dist/site; 13.89 KB gzip initial app JS)
CI=1 npm run build:desktop                             PASS (Linux DEB, RPM, AppImage)
verify-url.sh local and live production URLs           PASS (200; title, lang, H1, main, alt, console)
npm run verify:release -- --tag v0.1.11 --expected-commit <SHA>
                                                        PASS
npm run verify:live -- --expected-commit <SHA>         PASS
```

The exact browser regression first failed with `Expected length: 2; Received length: 1`, then passed with one explicit `releases/latest` request, the selected versioned asset, and source `f0e8f88`. The malformed `target_commitish: "main"` regression renders the calm publishing state and exposes no download action.

GitHub Actions run <https://github.com/B-Divyesh/sf-worklog-approval-bridge/actions/runs/33246925098> passed macOS arm64/x64, Windows, Linux, and publish. Published `latest.json`, `SHA256SUMS`, DMGs, MSI/EXE, AppImage, and DEB all resolve to the candidate. The release verifier downloaded and hashed `Worklog.Bridge_0.1.11_amd64.deb`: `e24e74beedd3e584c70fb96822ae62ba7b7a0db25e239652a83b6697373d3889`.

Live `/api/health` returns `0.1.11` and exact commit `f0e8f881e89886ef2d7a7298a680925b1170f6a1`. Live `/download` selected a `v0.1.11` AppImage and displayed `Built from source f0e8f88.` without console errors. Desktop and 390 × 844 mobile checks passed with no overflow; keyboard reaches the skip link first; a first-visit demo reloaded offline after `registration.update()`; demo traffic stayed same-origin. The anonymous receipt policy returned 60 × `204`, then `429` with `Retry-After: 60`. Live response headers include HSTS, `nosniff`, strict referrer policy, restrictive CSP with response-header `frame-ancestors 'none'`, no-cache service worker, and immutable hashed assets.

The standalone `@axe-core/cli` was attempted with the factory Playwright Chromium but its bundled ChromeDriver 152 cannot drive Chromium 145. The in-repo Playwright Axe suite ran on that installed Chromium and passed all serious/critical checks across every route.

## Known gaps / operator action

No product release blockers remain. Desktop bundles are intentionally unsigned. macOS notarization needs `APPLE_CERTIFICATE`; Windows Authenticode needs `WINDOWS_CERT_PFX`.

---

# Historical repair 10 handoff

## Release outcome: PASS

**Published and deployed candidate:** `57e2b3529311b69bf5697ff1b5dda5adb481df9c`

**Desktop release:** [`v0.1.10`](https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.10)
**Live URL:** <https://worklog-approval-bridge.sociobot.in>

The verifier's exact release failure was reproduced before the repair: `verify:release --tag v0.1.9 --expected-commit 170cfd8be5590896b01bd8f86004844d0c8905ac` rejected predecessor `44694c0b6dc7ba9728c4d5dd219aa5a155104aeb`. The exact historical live mismatch is covered by regression; after `npm ci`, the live expected-commit assertion also correctly rejects the old candidate against the new deployment.

`170cfd8…` was a documentation-only commit after immutable `v0.1.9`. Relabeling it would have violated provenance, so this repair publishes the new versioned candidate above from one source SHA.

## What changed

- Added an exact regression for verification 10: it rejects the old live health identity and old `v0.1.9` release for nominated `170cfd8…`.
- Manual desktop release dispatch now requires an explicit full `source_commit`; every matrix build, attestation, tag, manifest, and release verification uses it.
- Bumped desktop, API, and site version to `0.1.10` and set production `WORKLOG_BUILD_COMMIT` to the full candidate SHA before deploying `dist/site` and `api`.

## Evidence

```text
npm ci; npm --prefix api ci                           PASS (0 vulnerabilities)
npm test                                               PASS (18 Node/script + 28 Chromium tests)
cargo test --manifest-path src-tauri/Cargo.toml       PASS (2 Rust claim tests)
npm run build                                         PASS (dist/site; 13.97 KB gzip initial app JS)
CI=1 npm run build:desktop                            PASS (Linux DEB, RPM, AppImage)
verify-url.sh local production preview                PASS (200; title, lang, one H1, main, alt, no console errors)
npm run verify:live -- --expected-commit <SHA>        PASS
npm run verify:release -- --tag v0.1.10 --expected-commit <SHA>
                                                       PASS
```

Live `/api/health` returns `0.1.10` and exact commit `57e2b3529311b69bf5697ff1b5dda5adb481df9c`. The release verifier downloaded and hashed `Worklog.Bridge_0.1.10_amd64.deb`: `4eb9049b72f82b9403346de06968229c9618db7d13d64f1834ab0b3123a64551`.

GitHub Actions run <https://github.com/B-Divyesh/sf-worklog-approval-bridge/actions/runs/33245442101> passed the macOS arm64/x64, Windows, Linux, and publish jobs. It published DMGs, MSI/EXE, AppImage/DEB, `SHA256SUMS`, and `latest.json`, all tied to the candidate source commit.

Live desktop and 390 × 844 mobile demo checks passed without horizontal overflow or console errors; the skip link is first in keyboard order. The passing browser suite covers offline/update, same-origin privacy, approval receipts, keyboard/dialog behavior, touch controls, and serious/critical Axe checks. Live headers include HSTS, `nosniff`, strict referrer policy, restrictive CSP, response-header `frame-ancestors 'none'`, and `service-worker.js` is `no-cache`.

## Known gaps / operator action

No release blockers remain. Desktop bundles are intentionally unsigned. macOS notarization needs `APPLE_CERTIFICATE`; Windows Authenticode needs `WINDOWS_CERT_PFX`.

---

# Historical verifier 10 handoff

## Release verdict: **FAIL**

**Candidate:** `170cfd8be5590896b01bd8f86004844d0c8905ac`
**URL tested:** <https://worklog-approval-bridge.sociobot.in>

The candidate must not be accepted: live `/api/health` identifies `44694c0b6dc7ba9728c4d5dd219aa5a155104aeb`, and `v0.1.9` desktop artifacts are tied to that same predecessor rather than the nominated candidate. `npm run verify:live -- --expected-commit 170cfd8…` and `npm run verify:release -- --tag v0.1.9 --expected-commit 170cfd8…` both fail on this exact mismatch.

All local product checks otherwise passed after installing the README-documented Tauri/Linux prerequisites: all 15 registered claims, full `npm test` (17 Node/script + 28 Chromium), both Rust metadata/privacy tests, and `npm run build` to `dist/site/`. The current live predecessor also passed its end-to-end approval flow, same-origin demo request log, offline PWA reload/update check, mobile layout, response-header review, and 60-read/minute rate-limit check (61st request `429`, `Retry-After: 60`).

**Next step:** deploy and publish the exact `170cfd8…` source (or nominate a new candidate), set its `WORKLOG_BUILD_COMMIT`, then rerun the provenance checks. Full evidence is in `.factory/verification-10.md`.

---

# Historical builder handoff — repair 9

**Repair candidate and deployed source:** `44694c0b6dc7ba9728c4d5dd219aa5a155104aeb`

**Desktop release:** [`v0.1.9`](https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.9)

**Live URL:** <https://worklog-approval-bridge.sociobot.in>

## Fixed release blockers

- Reproduced the live rate-limit escape after the first deployment: 65 sequential anonymous receipt reads all returned `204`, including request 61. Azure can vary `x-forwarded-for` by source port, so it formed a new bucket for each request.
- The API now prefers Azure Static Web Apps' stable `x-azure-clientip` value and hashes it before storing the rate-bucket key. The new endpoint-boundary regression varies forwarded ports for 61 reads and requires reads 1–60 to return `204`, read 61 to return `429`, and `Retry-After: 60` to be present.
- Reproduced the stale health identity (`5fb3fbf…`) and deployed the repaired API with `WORKLOG_BUILD_COMMIT=44694c0…`. Fresh `GET /api/health` returns exactly:

  ```json
  {"status":"ok","build":{"service":"worklog-approval-bridge-receipts","version":"0.1.9","commit":"44694c0b6dc7ba9728c4d5dd219aa5a155104aeb"}}
  ```

- Reproduced the verifier’s `verify:live --expected-commit …` defect: the previous script silently ignored the CLI value. It now parses strict CLI options, gives the CLI value precedence, and enforces identity before browser checks. A deliberate mismatch now fails with `deployed API commit differs from the nominated repair commit`.
- Raised the approval form’s `Your name` label from inherited `#abb5c2` on `#f4eddf` (1.78:1) to `#17202c` (AA contrast). A new Playwright Axe regression exercises an actual generated approval-fragment URL and has no serious or critical violations.
- Published the exact repaired desktop candidate as `v0.1.9`; it is not a renamed old artifact. The release workflow completed successfully and generated macOS x64/arm64, Windows MSI/EXE, and Linux AppImage/DEB, plus `SHA256SUMS` and `latest.json` from the same source SHA.

## Verification evidence

Clean dependencies:

```text
npm ci                              PASS, 0 vulnerabilities
npm --prefix api ci                 PASS, 0 vulnerabilities
```

Quality gates:

```text
npm test                            PASS: 17 Node/script + 28 Chromium tests
cargo test --manifest-path src-tauri/Cargo.toml
                                    PASS: 2 tests
npm run build                       PASS: dist/site
CI=1 npm run build:desktop          PASS: 0.1.9 DEB, RPM, AppImage
git diff --check                    PASS
```

Browser and accessibility coverage includes desktop, 390 px mobile overflow and touch targets, keyboard shortcuts, dialog focus/Escape restoration, skip link, reduced motion, offline reload/service worker, privacy request capture, approval receipt, billing verdict behavior, and Axe serious/critical scans. `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174/ <tempdir>` passed: HTTP 200, title, `lang=en`, one H1, main landmark, image alt text, labeled buttons, no console errors. The standalone `@axe-core/cli` could not run because this container has no system Chrome binary; Playwright’s installed Chromium ran the project’s Axe coverage successfully.

Fresh live Playwright verification at 390 × 844 passed: `/demo` had no horizontal overflow, retained the visible Copy approval link, and logged no browser errors.

Production checks:

```text
GET /api/health                     PASS: version 0.1.9, commit 44694c0…
65 sequential receipt reads         PASS: request 61 = 429, Retry-After = 60
npm run verify:live -- --expected-commit 44694c0…
                                    PASS
wrong --expected-commit             PASS: correctly rejected
npm run verify:release -- --tag v0.1.9 --expected-commit 44694c0…
                                    PASS
```

The published release verifier downloaded `Worklog.Bridge_0.1.9_amd64.deb` and confirmed SHA-256 `1c5b23137ac38fff8e19cf5200e096bc769030662d057e5e70976bb889dd86c6` against the release manifest.

## Deploy and operation

The production Static Web App was deployed from `dist/site` and `api` using its existing `sf-worklog-approval-bridge` deployment configuration. `WORKLOG_BUILD_COMMIT` was set to the deployed candidate SHA before deployment. The tag-triggered GitHub Actions release run completed successfully.

The desktop packages are intentionally unsigned. macOS notarization requires `APPLE_CERTIFICATE`; Windows Authenticode requires `WINDOWS_CERT_PFX`.

## Known gaps

No product release blockers remain. The only verifier-tool limitation was the missing system Chrome binary for standalone Axe CLI; the equivalent in-repo Playwright Axe checks passed on its installed Chromium.

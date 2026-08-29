# Worklog Bridge — repair 9 handoff

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

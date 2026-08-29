# Independent verification 8 handoff — FAIL

**Candidate:** `c1c9aa9a22eca9c579696725b6b4d0ce7af7cae3`

**Live URL:** https://worklog-approval-bridge.sociobot.in

**Verified:** 29 August 2026 UTC

## Status

**FAIL. Do not release this candidate.**

The core product, local builds, live static deployment, demo, receipt flow, privacy boundary, offline behavior, accessibility automation, performance, checksums, concurrency, and rate limits passed. Three release blockers remain:

1. **Critical:** `https://api.sociobot.in/api/v1/products/worklog-approval-bridge/checkout` returns HTTP 404 with `{"error":"enabled factory product","status":404}`. The advertised Pro subscription cannot be purchased.
2. **High:** published v0.1.6 desktop artifacts identify source `5cad9b3f575059ab4330637b3dd1d132580c35c7`, not candidate `c1c9aa9a22eca9c579696725b6b4d0ce7af7cae3`. Candidate-targeted `verify:release` fails.
3. **High:** the live receipt API exposes no health/build identity (`/api/health`, `/api/version`, and `/api/build` return 404), so its deployed commit cannot be matched to the candidate.

Two medium defects also remain: `See every release file` is a 19 px-high target at 390 px (desktop header links are 16 px high), and the required privacy/offline/price facts fall below the cold 1440 × 900 first viewport.

Full evidence is in [verification-8.md](verification-8.md).

## Verification summary

```text
npm ci                                      PASS
npm --prefix api ci                         PASS
all 15 .factory/claims.json commands        PASS after documented Tauri prerequisites
npm test                                    PASS (13 Node/API/script + 25 Chromium)
cargo test --manifest-path src-tauri/Cargo.toml
                                             PASS (2 tests)
npm run build                               PASS (dist/site)
CI=1 npm run build:desktop                  PASS (DEB, RPM, AppImage)
/opt/fleet/lib/verify-url.sh <live URL> ...  PASS
Lighthouse mobile                           98/100/100/100; LCP 1.2 s; CLS 0
verify:release expected candidate            FAIL (release is 5cad9b3…)
verify:release expected 5cad9b3…             PASS
```

The live static HTML, main JS, CSS, and service worker are byte-identical to the candidate build. The fresh end-to-end acceptance created receipt `3dff0e77-a832-4969-a4c2-11f87067cd81`; its outgoing POST contained only the packet digest and supplied name. Approval limits are 60 reads/minute and 12 writes/minute; Sociobot license verification allows 30 requests before 429. Every observed 429 included `Retry-After`.

## Required next actions

1. Register/enable `worklog-approval-bridge` in the Sociobot billing service and verify that checkout redirects to a real hosted subscription checkout.
2. Publish desktop artifacts from the exact candidate chosen for release, or nominate the already-tagged `5cad9b3…` commit instead of `c1c9aa9…`.
3. Add an authenticated or non-sensitive API health/build identity that reports the deployed version/commit.
4. Raise the remaining link hit areas to at least 44 × 44 CSS px and keep the three plain facts in the initial viewport.

No product code was changed during verification.

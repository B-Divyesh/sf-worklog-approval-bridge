# Independent verification 5 — FAIL

**Candidate:** `b4be2aa3a0f57a2020748be55cf3a4f6cb28c956`  
**Live URL:** https://worklog-approval-bridge.sociobot.in  
**Verified:** 2026-08-29  
**Result:** **FAIL — the published desktop downloads are not built from this candidate.**

## Required first checks

The clean checkout was at the candidate SHA before installation. `npm ci` completed
with zero vulnerabilities. The first cold live page returned 200 and plainly says
what the product does (“Turn activity into an approved worklog”), for whom (“For
freelancers who rebuild billable work from Git and calendars”), and what to do first
(the visible one-click **Try it with sample data** link, with its outcome beside it).
It therefore passes the plain-words and demo first-screen gate.

`.factory/claims.json` exists and lists eleven claims. Each declared command was run
from the clean checkout using the shipped demo/browser entry point where applicable.
The Rust commands were re-run after installing the normal Linux Tauri build headers
missing from the disposable base image (`glib-2.0.pc`); this was an environment
prerequisite, not a product-test failure.

| Claim ID | Result | Evidence |
| --- | --- | --- |
| `offline-reload` | PASS | Demo reload retained the sample while offline. |
| `csv-export` | PASS | CSV header and six demo records asserted. |
| `local-demo` | PASS | Browser claim test observed only the local origin. |
| `approval-receipt` | PASS | One acceptance, reload, receipt ID and attestation asserted. |
| `worklog-details-local` | PASS | POST body asserted as digest plus approver only. |
| `no-surveillance` | PASS | No media/screen capture request. |
| `calendar-import` | PASS | ICS summary and 90-minute duration asserted. |
| `git-metadata` | PASS | `cargo test … claim_git_metadata` passed. |
| `no-repository-upload` | PASS | `cargo test … claim_no_repository_upload` passed. |
| `license-unlock` | PASS | Recorded Sociobot verification fixture and one-day cache asserted. |
| `installer-sha256` | PASS | Matching fixture installs; mismatch rejects before installation. |

## Local quality gates

- `npm test`: PASS — 10 Node/script tests, production TypeScript/Vite build, and
  all 14 Playwright tests passed. There is no separate lint script; `tsc --noEmit`
  is part of the production build.
- `npm run build`: PASS — `dist/site` produced. Initial payload: JS 12.72 KB gzip
  plus 1.01 KB gzip shared JS; CSS 4.62 KB gzip.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS — 2 Rust tests.
- `CI=1 npm run build:desktop`: PASS after installing standard Linux Tauri
  prerequisites. It produced DEB, RPM, and AppImage bundles. Candidate checksums:
  `27199ef26170944aff28732d9f41a740a4cf39bd650aaadce9d27ac44ef7e3f4`
  (DEB), `5f744d43f083ebaf6e031a8aa15ad44f4bfa3672d1ea878375bbc5bbb05beef9`
  (RPM), and `d039b8602b97d1b5744e1aebd8f819c2fe872ae11af0e45de7f1cae3d601e1e4`
  (AppImage).

## Live functional, privacy, accessibility, and platform checks

- `npm run verify:live`: PASS. A new approval link received successful empty
  lookup `204`, had no browser errors, and `/missing-page` returned actual HTTP
  404 with the designed not-found screen.
- The independent live normal flow entered `/demo`, confirmed the persistent
  “Demo — sample data, nothing is saved” banner and isolated
  `demo:worklog-bridge:project` storage, exported seven-line CSV, made a private
  link, rejected empty approver input, accepted as `Independent QA`, and reloaded
  into a disabled one-time receipt. The actual receipt ID was
  `6d3d712e-7336-4c69-a956-a26478dbd96b`.
- During that entire demo/edit/export/share/acceptance browser flow every request
  was `https://worklog-approval-bridge.sociobot.in`. The only acceptance POST body
  was `{\"packetDigest\":\"…64 hex…\",\"approver\":\"Independent QA\"}`. No
  worklog text left the page; no console/page errors occurred.
- Invalid ICS input showed “No calendar events were found in that file. Choose
  another ICS file.” A duration of 0 was rejected by native validation; the 1,440
  minute maximum saved and rendered as 24h.
- At 390×844 with `prefers-reduced-motion: reduce`, `/`, `/demo`, `/privacy`,
  `/terms`, `/download`, and `/missing-page` had no horizontal overflow and Axe
  4.10 reported zero serious/critical findings. The mobile installer commands are
  focusable and scroll with ArrowRight. The first keyboard Tab reaches the visible
  skip link with a 3px focus outline; demo keyboard shortcuts also pass in the
  repository suite. Reduced-motion CSS makes animation and transition duration
  effectively instant.
- Live headers include HTTPS HSTS, `nosniff`, strict-origin referrer policy, CSP
  with only self plus the documented GitHub/Sociobot connections, and a permissions
  policy that denies camera, microphone, and geolocation. Hashed assets cache for
  one year immutable; HTML caches for 30 seconds; the service worker uses no-cache.
- API allowance verified live with one fixed client identity: twelve malformed
  `POST /api/approvals` requests returned 400 and request 13 returned **429** with
  `Retry-After: 60`. Observed write allowance: **12 requests/client/minute**.

## Deployment identity and release-blocking defect

The web deployment **does** match the candidate: the deployed JS SHA-256 is
`d2ac9c72ea3e0c600170d72f4903d1d20c16a14e017da5aca4092997b538e1a3` and
CSS SHA-256 is
`dad93fc95407ce3beb1e3cbe2620c04d9e2e10a438bd599725da1bd8e752c6dd`,
identical to the candidate `dist/site` output. `origin/main` is exactly
`b4be2aa3a0f57a2020748be55cf3a4f6cb28c956`.

### High — Download page installs a stale desktop release, not the candidate

The public Download page obtains GitHub’s latest release and directs Linux users to
`v0.1.3`. GitHub shows `refs/tags/v0.1.3^{}` at `ae2c0d8e8e28210d5423bb8ae82b20d8d99c0daa`,
an ancestor of the candidate. `git diff ae2c0d8..b4be2aa` contains the later
approval-lookup/404 repair and the mobile keyboard-accessibility repair in the
bundled frontend (`src/main.ts` and `src/style.css`), plus their tests. Those
changes cannot be in an artifact released from the ancestor tag.

The downloadable Linux DEB was independently downloaded; its SHA-256
`8c0b16a47dfc04f391947cab109c20e9b167101c1e5e52eab88a0423cbdb44ff` correctly
matches that stale release’s `SHA256SUMS`, but it is not a candidate artifact.
The candidate’s fresh local DEB hash is different (listed above). Thus checksum
integrity exists for the old release, but the desktop application the customer is
asked to install does not contain this candidate’s repaired behavior.

This violates the desktop-app release contract and the requested live-candidate
match. Publish a new tag/release from `b4be2aa` (or its descendant) with fresh
macOS x64/arm64, Windows, and Linux artifacts, `SHA256SUMS`, and `latest.json`;
then re-check that the Download page selects that release and that an artifact is
traceable to the release commit.

## Verdict

**FAIL.** No other release-blocking functional, privacy, accessibility, build,
claims, or rate-limit defect was found in the candidate web deployment. The stale
published desktop artifact alone blocks release acceptance.

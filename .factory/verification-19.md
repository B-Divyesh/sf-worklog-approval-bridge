# Independent verification 19 — FAIL

**Candidate:** `e43e0e9d8e23109e23fc433865fd4bab1ee87380` (`v0.2.0`)  
**Live target:** <https://worklog-approval-bridge.sociobot.in>  
**Verified:** 30 August 2026 UTC  
**Work order:** `worklog-approval-bridge-verify-19`

## Decision

**FAIL — do not release this candidate as the live product.** The shipped
frontend and desktop release match the candidate and the local product works,
but the live M2 Axum service is absent, the paid checkout returns HTTP 500,
and the repository's Rust formatting check fails. These are independent
release blockers.

## Defects by severity

### High — the live deployment does not contain the candidate backend

The repository's own deployment check fails:

```text
npm run verify:live -- --expected-commit e43e0e9d8e23109e23fc433865fd4bab1ee87380
AssertionError: actual 'worklog-approval-bridge-receipts'
                expected 'worklog-approval-bridge'
```

Fresh route evidence confirms a split, stale deployment:

- `/api/health` returns HTTP 200 with service
  `worklog-approval-bridge-receipts`, version `0.2.0`, and commit
  `aedc0f453580967435089a3dd79f6ffe7e124115`.
- `/health` returns HTTP 404, although the candidate and README require it.
- `/api/v1/worklogs/current`, `/api/v1/account`, and
  `/api/v1/billing/verify` all return HTTP 404. The candidate service exposes
  these routes and an unauthenticated worklog request must return 401 with
  `WWW-Authenticate: Bearer`.
- The sign-in button correctly redirects to the Sociobot tenant, but account
  backup, load, export, deletion, and server-side license checks cannot work
  because their live routes do not exist.

`npm run verify:delivery` first verified release `v0.2.0` at the full candidate
commit, then failed on the same live identity assertion. This is fresh
evidence, not the earlier deployment-only failure.

The frontend is not stale: live `index.html`, the two application chunks, the
MSAL chunk, and CSS are byte-for-byte equal to the local candidate build.

### High — the live Pro checkout is unavailable

The landing page's **Start Pro subscription** link targets the documented
Sociobot pilot checkout. Four fresh GET requests returned HTTP 500 with no
redirect:

```json
{"error":"Internal server error","status":500}
```

The expected result is a redirect to hosted checkout. A visitor cannot buy
the advertised $12/user/month subscription.

### Medium, release-blocking — Rust formatting gate fails

`cargo fmt --manifest-path server/Cargo.toml -- --check` exits 1 and prints an
extensive diff for `server/src/main.rs`. No code was changed during this QA.
The desktop crate formatting check and both Clippy checks pass.

### Medium, release-blocking — claim coverage does not prove all README promises

All declared claim commands pass, but the registry is incomplete for the M2
account workflow and container runtime promises:

- README lines 11 and 61 promise opt-in backup plus load, download, and delete
  behavior. `account-persistence` directly inserts and queries SQLite rows in
  `server/src/main.rs`; it does not exercise authenticated HTTP routes or the
  browser workflow.
- README line 83 promises zero-required-config startup, `/data` persistence,
  and first-boot secret generation. No `.factory/claims.json` entry names and
  tests that combined observable claim.
- `api-rate-limit` claims both account and approval APIs, but its named Rust
  test exercises only `/api/v1/worklogs/current`. Approval limiting is covered
  by an untagged Node regression, not by the claim's listed command alone.

The live 404s demonstrate why the account claim's current database-only test
is insufficient as a release gate.

### Low

- The visually hidden ICS file input measures 1 px wide by 44 px high. It is
  activated by the labelled 44 px import button and is not itself a visible
  touch target, so this is noted but not treated as an accessibility failure.

## Mandatory first gates

### Cold first read — PASS

A fresh browser profile loaded the live page at 1440 × 900 and 390 × 844. The
first screen answers all required questions in plain words:

- **What:** “Turn activity into an approved worklog.”
- **For whom:** freelancers rebuilding billable work from Git and calendars.
- **What first:** “Try it with sample data,” followed by an explanation that a
  filled weekly worklog opens and the real worklog stays unchanged.

The action opens `/demo` in one click. The six-entry sample and persistent
“Demo — sample data, nothing is saved” banner appear immediately. The three
privacy/offline/price facts remain in the first mobile viewport. Cold-load
requests were same-origin only, with no console or page errors.

### Claim registry — commands PASS, coverage finding above

`.factory/claims.json` exists. After `npm ci`, each of its 26 commands was run
verbatim and separately from this clean candidate checkout:

| Claim | Result | Claim | Result |
| --- | --- | --- | --- |
| offline-reload | PASS | csv-export | PASS |
| local-demo | PASS | desktop-sample-project | PASS |
| entry-review | PASS | free-editor | PASS |
| approval-receipt | PASS | worklog-details-local | PASS |
| account-demo-boundary | PASS | account-persistence | PASS |
| account-auth-boundary | PASS | api-rate-limit | PASS |
| installed-app-locality | PASS | no-surveillance | PASS |
| calendar-import | PASS | git-metadata | PASS |
| no-repository-upload | PASS | license-unlock | PASS |
| sample-counts | PASS | pro-price | PASS |
| no-analytics | PASS | release-discovery | PASS |
| public-health-fields | PASS | installer-sha256 | PASS |
| release-provenance | PASS | release-signing-mode | PASS |

Result: **26 command passes, 0 command failures**. The coverage defects above
remain release-blocking under the claim contract.

## Clean local quality gates

- `npm ci`: PASS; 40 packages, zero audit vulnerabilities.
- `npm --prefix api ci`: PASS; 29 packages, zero audit vulnerabilities.
- `npm test`: PASS; 29 Node tests, 6 Axum tests, and 38 Chromium tests.
- `npm run build`: PASS; TypeScript checking and the exact Vite production
  build produced `dist/site`.
- `cargo fmt --manifest-path server/Cargo.toml -- --check`: **FAIL**.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: PASS.
- Clippy with `--all-targets --all-features -- -D warnings` for both Rust
  crates: PASS.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS; 2 tests.
- `npm run build:server`: PASS with `--release --locked`.
- `CI=1 npm run build:desktop`: PASS. Fresh artifacts: AppImage 76,786,168
  bytes, DEB 2,001,324 bytes, RPM 2,003,007 bytes. The AppImage remained
  running through an eight-second Xvfb smoke interval; only headless graphics
  and optional GStreamer warnings appeared.
- The candidate server started in a clean temporary directory with only
  `PORT` and `PATH`. `/health` returned candidate service/version, the account
  route returned 401 with `WWW-Authenticate: Bearer`, and SQLite plus the
  generated signing secret were created in the fallback `data` directory.
- No separate npm lint script exists.

## Live end-to-end behavior

### Local-first workflow — PASS

From fresh storage on 390 px mobile:

- `/demo` loaded six entries and the isolation banner.
- A `0`-minute entry was rejected by native validation.
- The valid `1440`-minute boundary saved successfully.
- A `-25` hourly rate produced the recovery message and restored `$135`.
- CSV exported seven records and contained the new boundary entry.
- The demo approval created a local receipt, survived reload, and made only
  same-origin GET requests. It never contacted `/api/approvals`.
- Reduced-motion mode used `scroll-behavior: auto` and 0.00001-second
  transition/animation durations.

A fresh real workspace also passed its browser flow at the `$0` and one-minute
boundaries. It exported one row, created a private fragment link, accepted as
“Independent QA 19 browser,” downloaded attested receipt
`51b5e873-f5a4-4e11-8aff-da3fd20a8d64`, and remained disabled/immutable after
reload. The acceptance POST contained exactly `approver` and `packetDigest`.

### Approval API — PASS on the stale receipt service

- One client received 60 successful reads; excess requests returned 429 with
  `Retry-After: 60`.
- One client received 12 invalid write responses; request 13 returned 429
  with `Retry-After: 60`.
- Five concurrent valid acceptances for a fresh digest returned one 201 and
  four 409 responses. Every response contained receipt
  `2414342c-8c19-4905-a68f-2c782216e2ac`; a later lookup returned it as valid.

The Sociobot license verification endpoint allowed 30 invalid-token checks;
request 31 returned 429 with `Retry-After: 4`.

### Authentication — PASS configuration, backend unavailable

The live sign-in action uses:

- authority `https://sociobotcustomers.ciamlogin.com`;
- tenant `35c6fe40-0ec0-46b6-98c6-213ad4de6650`;
- client ID `25c704f4-465a-47af-80ab-2c489466b697`;
- PKCE `S256`; and
- redirect `https://worklog-approval-bridge.sociobot.in/auth/callback`.

The subsequent candidate account APIs are missing live, as described above.

## Privacy and response headers

- Cold landing and complete demo flow requests were same-origin only. No
  analytics, advertising, remote font, approval API, camera, microphone,
  screen capture, or timer request occurred.
- Static responses include CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict referrer policy, and a permissions policy disabling
  camera, microphone, and geolocation.
- Root HTML revalidates after 30 seconds; hashed assets use one-year immutable
  caching; `service-worker.js` uses `no-cache`; approval API responses use
  `no-store`.
- The live `/api/health` response discloses only status and build identity,
  but its identity is stale.

## Accessibility, responsive behavior, PWA, and performance

- `/opt/fleet/lib/verify-url.sh` passed `/`, `/demo`, `/app`, `/privacy`,
  `/terms`, and `/download`: HTTP 200, route title, `lang=en`, one h1, main
  landmark, image alternatives, labelled buttons, and no console errors.
- Independent Axe scans at 1440 px and 390 px found zero serious or critical
  findings across all six routes. No route had horizontal overflow.
- Visible link/button controls met the 44 px target baseline at both widths.
- Keyboard checks passed: visible 3 px yellow skip-link focus, skip activation,
  `/` filter shortcut, `n` add shortcut, modal focus trap, Escape close, and
  focus restoration.
- The service worker registered, updated, and populated cache
  `worklog-bridge-55ef34622464`; offline reload preserved six demo entries and
  showed the offline state.
- Production output: initial application JavaScript 53.65 KB raw / 16.96 KB
  gzip, CSS 18.53 KB raw / 4.99 KB gzip, no font payload, mobile hero 41.05 KB.
  Even all JavaScript chunks total about 92.1 KB gzip.
- Mobile Lighthouse: performance 98, accessibility 100, best practices 100,
  SEO 100; FCP 1.018 s, LCP 1.318 s, CLS 0, TBT 181 ms, total transfer 65.5 KB.

## Release and installer

- `npm run verify:release -- --tag v0.2.0 --expected-commit e43e0e9…`:
  PASS. The published DEB is tied to the full candidate and has SHA-256
  `6d9d66859fcd2503f8abe9f472e47c7d54cd821f28449e6bc1db8c6d12bbb423`.
- The live installer script is byte-for-byte equal to the candidate. In a
  clean temporary install directory it downloaded the immutable AppImage,
  verified SHA-256
  `f1349e893e315a4d87709f3b1db86150e6be02de02e50efca0af894c60c00405`,
  and installed it. The installed binary remained running for the eight-second
  smoke interval using the documented AppImage extraction fallback.

## Required next verification

1. Deploy the candidate Axum container so `/health`, `/api/health`, and every
   `/api/v1/*` route identify the full candidate and operate against durable
   `/data` storage.
2. Restore the product checkout redirect.
3. Format `server/src/main.rs` and keep the formatting check in the gate.
4. Add observable claim tests for account backup/load/export/delete and
   zero-config persisted startup, and make the rate-limit claim test cover
   both named API families.
5. Repeat all 26 claim commands, `npm test`, both Rust gates, desktop build,
   live checkout, authenticated account workflow, and `npm run verify:delivery`.

# Worklog Bridge repair handoff

## Outcome

The Milestone 2 container now serves the Vite frontend from its real
`dist/site/assets` directory. The live shell, all four emitted JavaScript and
CSS chunks, known SPA routes, and `/health` work together. The existing Tauri
desktop app, local/demo storage separation, Sociobot CIAM account backup,
SQLite APIs, approval receipts, and Sociobot billing integration remain in
place.

The repair also fixes a second integration fault found by the live workflow:
Axum could not extract `Path<Option<String>>` on `/api/approvals`, so a new
approval lookup returned 500. Separate handlers now cover collection and
receipt-ID routes. The same end-to-end pass showed that Rust's default
snake_case receipt fields did not match the existing camelCase frontend API;
the server now preserves the established receipt schema.

## Reproduction and root cause

On 2026-08-30 at 04:02 UTC, the deployed
`bbff110af6ade67b23a2aea181aeab107e96661e` container returned 200 HTML from
`/`, but both referenced files failed:

- `/assets/index-D1wU5F8Q.js` — 404, `text/plain; charset=utf-8`
- `/assets/index-DPr_pJGE.css` — 404, `text/plain; charset=utf-8`

The Axum wildcard for `/assets/{*path}` yields only the part after `/assets/`.
The handler joined that value directly to `/app/dist/site`, looking for the
files beside `index.html` instead of below `/app/dist/site/assets`. With
`X-Content-Type-Options: nosniff`, the browser correctly refused the 404
bodies and never rendered the app.

## Changes and regression coverage

- The asset handler keeps the `assets/` directory, lets `ServeFile` assign the
  extension MIME, and adds one-year immutable caching to successful assets.
- `regression_hashed_frontend_assets_keep_directory_mime_and_bytes` builds a
  temporary Vite-shaped directory and checks status, MIME, body, caching, the
  `/privacy` SPA shell, and `/health` JSON through the real Axum router.
- `verify-live.mjs` recursively follows every hashed JS/CSS reference,
  including lazy imports, and rejects missing, empty, or wrongly typed assets.
- `regression_unaccepted_approval_lookup_is_a_successful_empty_response`
  proves `/api/approvals?packetDigest=…` returns the intended 204 instead of an
  extractor error, then creates and retrieves a signed receipt using the
  frontend's camelCase field names.

## Verification evidence

Clean dependency setup and the original build gates:

```sh
npm ci
npm --prefix api ci
npm test
npm run build
CI=1 npm run build:desktop
```

Results: zero npm audit findings; 29 Node/API/workflow tests, 6 Axum tests,
and 38 Chromium tests passed. The browser suite covers desktop and 390 px
mobile layouts, keyboard shortcuts, dialog focus, Axe serious/critical scans,
offline reload and service-worker update behavior, request privacy, demo
isolation, account boundaries, and license behavior. The desktop command
produced Linux DEB, RPM, and AppImage bundles after installing the README's
documented system packages.

Additional checks passed:

```sh
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo clippy --manifest-path server/Cargo.toml --all-targets --all-features -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
npm run build:server
```

A release-mode local service passed the complete `verify:live` flow. It found
all four assets (`index-D1wU5F8Q.js`, `index-DPr_pJGE.css`,
`index-DilQieBS.js`, and `core-DhEqZVGG.js`), then passed the isolated demo,
real approval lookup, SPA routing, and health identity checks.

The final custom-domain gate is:

```sh
npm run verify:live -- --expected-commit "$(git rev-parse HEAD)"
```

The app-owned checks passed against
`https://worklog-approval-bridge.sociobot.in`. Each of the four hashed assets
returned 200, its JavaScript or CSS MIME, non-empty bytes, and `Cache-Control:
public, max-age=31536000, immutable`. `/health` returned version `0.2.0` and
the full final commit. The demo, live approval creation/reload, and CIAM
authorization redirect also passed without console errors. The Sociobot
checkout returned the required 303 redirect to the hosted Dodo checkout, so
the complete `verify:live` command passed.

`/opt/fleet/lib/verify-url.sh` passed `/`, `/demo`, `/app`, `/privacy`,
`/terms`, and `/download`: each returned 200 with a route title, `lang=en`, one
`h1`, a main landmark, complete image alternatives and button names, and no
console errors. Final evidence is under
`/tmp/worklog-repair-evidence-dec73d3/`.
Mobile Lighthouse scored performance 100, accessibility 100, best practices
100, and SEO 100 (FCP 1.2 s, LCP 1.5 s, CLS 0, TBT 0 ms). Initial JavaScript
is 16.96 KB gzip, CSS is 4.99 KB gzip, and the lazy MSAL chunk is 74.15 KB
gzip.

## Build and deployment

The production image was rebuilt from the final committed tree with all three
identity arguments set to the full commit:

```sh
commit="$(git rev-parse HEAD)"
az acr build --registry sociobotregistry \
  --image "sf-worklog-approval-bridge:${commit:0:12}" \
  --build-arg BUILD_SHA="$commit" \
  --build-arg GIT_SHA="$commit" \
  --build-arg SOURCE_COMMIT="$commit" .
az containerapp update --resource-group sociobot \
  --name sf-worklog-approval-bridge \
  --image "sociobotregistry.azurecr.io/sf-worklog-approval-bridge:${commit:0:12}"
```

The existing Container App, custom domain, ingress, CIAM defaults, SQLite
schema, billing endpoints, and desktop release configuration were not
replaced or narrowed. The repair commits and this handoff are pushed to
`origin/main`.

## Known gap and operator action

The factory-created Container App currently has no Azure Files volume in its
deployment template. The service writes SQLite and its receipt-signing secret
under `/data`, but that directory is revision-local until the factory mounts
durable storage. Repository policy forbids provisioning infrastructure from
this repair. Before relying on cross-revision account backups or receipts, the
operator must attach a dedicated read-write Azure Files volume at `/data` and
then repeat a write, revision restart, and read test.

The desktop release remains an unsigned preview. macOS signing needs
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing needs
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`.

Signing secrets are optional. Tag-triggered releases always build an unsigned
preview, even when signing secrets are present. A manual release with
`sign_release` set to `false` also builds an unsigned preview. Set
`sign_release` to `true` only after all platform secrets are installed; a
partly configured signing request fails before packaging.

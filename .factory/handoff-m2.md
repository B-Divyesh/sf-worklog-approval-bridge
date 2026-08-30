# Worklog Bridge — M2 handoff

## Outcome

M2 implements accounts, durable account copies, billing wiring, a production
container service, and the supporting security controls. The existing local
editor remains usable without an account. A signed-in person explicitly backs
up a selected worklog; nothing from the demo is ever sent to sign-in, account,
or billing services.

The resulting service is Rust/Axum with SQLite migrations. It starts on
`PORT` with no required environment variables, generates and persists its
receipt-signing secret on first boot, and serves its Vite frontend. It exposes
`/health` and `/api/health`; authenticated worklog, export, deletion, and
billing-verdict routes validate Sociobot Entra tokens and enforce durable,
client-IP rate limits with `429` and `Retry-After`.

## What shipped

- Sociobot Entra External ID PKCE sign-in/sign-out, callback route, session
  storage cache, and a compact signed-in account ticket in `/app`.
- SQLite migration `server/migrations/0001_m2_accounts.*.sql`, tenant-scoped
  current worklog storage, account CSV export, account deletion, receipt and
  license-verdict tables, and reversible migration coverage.
- Backend OIDC discovery/JWKS loading and RS256 JWT validation for issuer,
  tenant, audience, expiry, not-before, and stable `oid` ownership.
- Pilot Sociobot/Dodo checkout and verification wiring. License tokens stay
  local; the server stores only a token hash and verification verdict when a
  signed-in account verifies one.
- Demo account boundary claim and test: `/demo` has no sign-in, backup, or
  billing path and uses only its `demo:` storage namespace.
- Multi-stage non-root Docker image, static SPA routing, health identity,
  security headers, SQLite-backed rate limiter, and first-boot secret
  generation. The remote image build succeeded as
  `sociobotregistry.azurecr.io/worklog-approval-bridge:010ba0a`, digest
  `sha256:83d16f9d8f6bcd29dc1497529255e5b2129a9e12afe32e2d33400ce09bc41e8c`.
- Clean-cache desktop packaging repair: the build script patches a freshly
  downloaded legacy GTK linuxdeploy plugin and retries once. Linux Debian,
  RPM, and AppImage bundles build successfully.

## Verification

Completed locally on 2026-08-30:

```sh
npm test
# 29 Node/API checks, 4 Axum tests, and 38 Playwright tests passed

jq -r '.[].test' .factory/claims.json | sort -u | while IFS= read -r command; do
  sh -c "$command"
done
# every M1 and M2 claim command passed

npm run build
CI=1 npm run build:desktop
```

`npm test` includes the browser accessibility and console-error checks. The
final browser run passed all 38 tests. The site build's initial application
JavaScript is 17.97 KB gzip; MSAL is a 74.15 KB gzip lazy chunk and is not
loaded by the public/demo route.

The release service was also cold-started with only `PORT` set. It generated
its SQLite secret/store, fetched the CIAM discovery document and JWKS, served
`/health`, and returned `429` plus `Retry-After` after the configured
allowance. Azure Container Registry task `ch1dw` completed successfully.

## Launch blockers / operator action

M2 is **not deployed to the live product URL**. I did not invent a Container
App or DNS target: Azure has no provisioned `worklog-approval-bridge` app or
durable `/data` mount. Therefore a cold live check would only test the prior
M1 static release, not this M2 service.

Before deployment, an operator needs to:

1. Register the pilot billing product for `worklog-approval-bridge`. The
   live pilot checkout currently responds `404` with `enabled factory
   product`, and the pilot product catalogue does not contain this slug.
2. Confirm/register the Entra SPA redirect URI
   `https://worklog-approval-bridge.sociobot.in/auth/callback`. The worker's
   Azure identity could not read the shared app registration.
3. Provision the named Container App, map the product hostname, and mount
   durable writable storage at `/data`. Deploy the tagged image (or rebuild
   the final pushed commit with the normal build args), then cold-check
   `/health`, `/demo`, the sign-in return, and the pilot checkout.
4. After pilot checkout succeeds, switch the billing base to the production
   Sociobot billing endpoint as part of release configuration.

## Run and operate

```sh
npm ci
npm --prefix api ci
npm test
npm run build
npm run build:server
PORT=8080 ./server/target/release/worklog-approval-bridge-server
```

For container builds, pass `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT` when
available. They default safely to `dev`. Persist `/data`; otherwise account
copies, receipts, licensing verdicts, rate-limit state, and the generated
secret are intentionally lost on a container replacement.

## M3 needs

Do not add team workflows until the three operator actions above are complete
and a real CIAM sign-in plus pilot payment return has been exercised at the
live URL. M3 can then add client workspaces, reviewer roles, receipt search,
and worklog templates while keeping source selection/redaction local.

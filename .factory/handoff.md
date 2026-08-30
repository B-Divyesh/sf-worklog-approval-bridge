# Worklog Bridge handoff

## Current release candidate

M2 adds Sociobot Entra accounts, durable opted-in worklog copies, pilot
Sociobot/Dodo billing wiring, rate-limited Axum APIs, SQLite migrations, and
a production container. The local-first editor and one-click `/demo` remain
public and isolated. Full M2 evidence is in `.factory/handoff-m2.md`; M1's
adversarial review remains in `.factory/review-4.md`.

## Verify

```sh
npm ci
npm --prefix api ci
npm test
npm run build
CI=1 npm run build:desktop
```

Open `/demo` in a fresh browser profile for the six-entry sample. The demo
banner has **Reset demo** and **Start for real**. It keeps data only in the
`demo:worklog-bridge:` namespace and never triggers account or billing calls.

For the service, use `npm run build:server`, then run the generated binary
with `PORT=8080`. It needs no other environment variables and persists its
first-boot secret and SQLite database under `/data` when that mount exists.

## Deployment status

The M2 image was built successfully in ACR, but M2 has not been deployed to
`https://worklog-approval-bridge.sociobot.in`: the required Container App,
durable `/data` mount, hostname mapping, pilot billing product, and confirmed
CIAM callback registration are not available to this worker. Those exact
operator actions and their evidence are listed in `.factory/handoff-m2.md`.

## Known limitations

The desktop release remains an unsigned preview on macOS and Windows. The
site and README disclose that those systems may show a trust warning. Linux
release assets are checksummed. Platform signing remains an owner-held
operational step.

## Release-signing disclosure

Signing secrets are optional. Tag-triggered releases always build an unsigned
preview, even when signing secrets are present. A manual release with
`sign_release` set to `false` also builds an unsigned preview. Set
`sign_release` to `true` only when all platform secrets are available. When
signing is requested, a partly configured secret set fails before packaging
instead of silently producing an unsigned file.

macOS signing and notarization use `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`.

# Worklog Bridge — adversarial review 4 handoff

## Outcome

This review records the deployed release at commit
`aedc0f453580967435089a3dd79f6ffe7e124115` and repository documentation
commit `2a0747eb382726c7eb9b1173b7ece3e9bd13f99b`. No product code changed.
The live review, source review, and clean-clone claim matrix are recorded in
`.factory/review-4.md`.

## How to verify

```sh
npm ci
npm --prefix api ci
npm test
npm run build
for test in $(jq -r '.[].test' .factory/claims.json); do eval "$test"; done
npm run verify:live -- --expected-commit aedc0f453580967435089a3dd79f6ffe7e124115
```

Open `https://worklog-approval-bridge.sociobot.in/demo` in a fresh browser
profile for the six-entry sample. The demo banner supplies **Reset demo** and
**Start for real**. The demo uses only the `demo:worklog-bridge:` storage
namespace.

## Release-signing disclosure

Signing secrets are optional. Tag-triggered releases always build an unsigned
preview, even when signing secrets are present. A manual release with
`sign_release` set to `false` also builds an unsigned preview. Set
`sign_release` to `true` only when all platform signing secrets are available.
When signing is requested, a partly configured secret set fails before
packaging instead of silently producing an unsigned file.

macOS signing and notarization use `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`.

## Known product limitations

The desktop release remains an unsigned preview on macOS and Windows. The
site and README disclose that those systems may show a trust warning. Linux
release assets are checksummed. Signing remains the next operational release
step; it requires the owner-held credentials listed above.

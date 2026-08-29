# Worklog Bridge — review 3 handoff

## Outcome

Independent adversarial review 3 is **FAIL**. No product code was changed.
The live site and demo were checked at 390 px and desktop, and this handoff
and `.factory/review-3.md` are the only review artifacts added.

One blocking product gap remains: if a browser denies clipboard access, **Copy
approval link** exposes a raw `writeText` exception and does not provide the
link for manual copying. See `F-3-1` in `.factory/review-3.md` for the exact
reproduction and required recovery UI/test.

## What was verified

- Cold landing copy identified what the product does, its freelance audience,
  and **Try it with sample data** before scrolling at both tested widths.
- `/demo` and `/?demo=1` opened the six-entry Northstar Health sample with the
  persistent demo banner, Reset, and Start for real controls.
- Demo approval retained `?demo=1`, wrote only demo receipt storage, made no
  approval API request, reset its receipt, and left a seeded real workspace
  unchanged.
- Link crawl, route metadata, deep links, 404, header/footer, mobile layout,
  request logging, and Axe scans were checked live. Valid routes had no
  console errors.
- Every claims-registry command was run from a fresh clone. Five Node/native
  commands and the signing-mode command passed. Sixteen browser-backed
  commands initially stopped in an unrelated handoff wording regression before
  their tagged Playwright tests; details are in the review.
- After this required handoff supplied the missing signing disclosure, the
  repository's full local `npm test` passed (27 Node/script tests and 36
  Chromium tests), and `npm run build` passed. A second clean clone of the
  committed review state then passed all 22 exact registry commands
  individually.

## Run and verify

```sh
npm ci
npm --prefix api ci
npm test
npm run build
```

For every registered claim, run the command recorded in
`.factory/claims.json` from a clean clone. Use `/demo` for the isolated sample.

## Signing disclosure

Published desktop packages are deliberately unsigned previews and are labelled
as such throughout the product. Signing secrets are optional. Tag-triggered
releases always build an unsigned preview, even when signing secrets are
present. A manual release with `sign_release` set to `false` also builds an
unsigned preview. Set `sign_release` to `true` only when all platform signing
secrets are available. When signing is requested, a partly configured secret
set fails before packaging instead of silently producing an unsigned file.

For a signed manual release, macOS signing and notarization need
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing needs
`WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. No signing credentials are in
this repository.

## Known gap / next step

Implement the F-3-1 clipboard fallback and its rejected-clipboard browser
test. Then repeat the full clean-clone claims matrix and live sandbox audit.

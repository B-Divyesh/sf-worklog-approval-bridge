# Worklog Bridge

Turn Git and calendar activity into a client-ready worklog.

Worklog Bridge is for freelance developers and small consultancies that rebuild billable work each week. The desktop app reads commit dates, subjects, and hashes from a repository you choose for one Monday-to-Sunday week. Pro adds selected ICS calendar imports and saved approval history. You can rewrite, time, remove, and mark each entry ready before sharing.

The free editor exports CSV. It creates a private approval link with the worklog after the `#`. Browsers do not send that part of the link to the server. A client can accept a worklog once and download a server-attested receipt. The receipt service receives only a SHA-256 worklog identifier and the supplied name. It never receives entries or repository content. Saved work remains available offline after the first visit. The demo sends worklog data only to this site. The product does not request camera, microphone, or screen access.

Try the isolated sample at `/demo` or <https://worklog-approval-bridge.sociobot.in/demo>. It uses `demo:worklog-bridge:project` and never reads the real workspace key. In the installed app, select **Load sample project** on the empty first-run screen.

## Run locally

Requirements: Node.js 22, npm, Rust stable, Git, and [Tauri 2 system packages](https://v2.tauri.app/start/prerequisites/) for your platform.

On Ubuntu or Debian, desktop packaging also needs `file`:

```sh
sudo apt-get update
sudo apt-get install -y file libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf rpm
```

```sh
npm ci
npm run dev          # website and browser app
npm run dev:tauri    # installed-app shell
```

Open `http://localhost:1420/demo` for the sample or `/app` for a real workspace.

## Test and build

```sh
npm test             # builds, then runs Node and Playwright tests
cargo test --manifest-path src-tauri/Cargo.toml
npm run build        # writes the deployable site to dist/site/
npm run build:desktop
```

Playwright 1.58.2 uses the browser path supplied by the factory worker. The claim registry is [.factory/claims.json](.factory/claims.json). The demo contract is [.factory/demo.md](.factory/demo.md).

## How to use it

1. Open the installed app and name the client and week.
2. Choose **Load sample project** to try it safely, or choose a local Git repository.
3. Select matching weekly commits. Only hash, date, and subject enter the draft.
4. Add manual entries or use Pro to select matching-week events from an ICS file.
5. Rewrite each line, set its minutes, and mark it ready.
6. Export CSV or copy the approval link.
7. Ask the client to review, accept once, and download the receipt.

The approval link contains visible worklog details. Treat it like a private document.

## Pro license

Pro costs $12 per user each month. It adds ICS import and saved approval history. The subscription link opens Sociobot checkout. On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, removed from the address, and checked at most once per day. Users can also paste a license in the calendar import dialog. Offline Pro access needs a valid license check saved less than 24 hours ago. A token alone never unlocks Pro.

## Privacy and architecture

- Vanilla TypeScript and Vite power the interface.
- Tauri 2 and a small Rust command read Git metadata on the selected path.
- Local storage is split between real and demo namespaces.
- Approval payloads use URL fragments, which browsers do not send in HTTP requests.
- The same-origin receipt API stores only a worklog identifier, name, server time, receipt ID, and attestation.
- There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture.

See `/privacy` and `/terms` in the site. The night-market design and generated-image provenance are recorded in [.factory/design.md](.factory/design.md).

## Release and deploy

`npm run build:site` writes `dist/site/index.html`. Deploy that directory as the static site. The release workflow builds macOS, Windows, and Linux bundles. A pushed version tag or manual full commit starts it. Each matrix job records bundle checksums and its source commit. Publishing stops if one artifact came from another commit. The workflow publishes `SHA256SUMS` and `latest.json` with the immutable source commit.

The download page reads release metadata from the GitHub API. It shows that release files are not available yet when the API cannot provide an immutable release. It never fetches a GitHub redirect URL. The macOS and Linux `/install.sh` installer rejects a release file when its SHA-256 does not match the published checksum.

Tag releases publish an unsigned preview, regardless of ambient organization secrets. A manual release can set `sign_release` to request signed packages. macOS signing and notarization use `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`. Windows signing uses `WINDOWS_CERT_PFX` and `WINDOWS_CERT_PASSWORD`. A partly configured secret set fails before packaging instead of silently producing an unsigned file.

The anonymous receipt health endpoint is `/api/health`. It returns only service name, version, and a validated deployed source commit. It never returns configuration or storage settings. The static deployment supplies that commit as `WORKLOG_BUILD_COMMIT` or its standard `BUILD_SOURCEVERSION` value.

After publishing a release, verify its tag, source commit, platform matrix, manifest, and a downloaded Linux checksum:

```sh
npm run verify:release -- --tag v0.1.16 --expected-commit "$(git rev-parse v0.1.16^{})"
```

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).

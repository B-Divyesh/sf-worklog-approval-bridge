# Worklog Bridge

Turn selected Git and calendar activity into a client-ready weekly worklog.

Worklog Bridge is for freelance developers and small consultancies that reconstruct billable work at week-end. The Tauri desktop app reads metadata from a repository the user names. A Pro license adds ICS calendar import and saved approval history. Every entry can be rewritten, timed, removed, or marked ready before sharing.

The free editor exports CSV. It also creates a private approval link whose worklog is stored in the URL fragment. A client can accept a packet once and download a server-attested receipt. The receipt service receives only the packet digest and supplied name, never worklog entries or repository content. Saved work remains available offline after the first visit. The demo sends no worklog data to another origin. The product does not request camera, microphone, or screen access.

Try the isolated sample at `/demo` or `https://worklog-approval-bridge.sociobot.in/demo`. It uses the `demo:worklog-bridge:project` storage key and never reads the real workspace key.

## Run locally

Requirements: Node.js 22, npm, Rust stable, Git, and the [Tauri 2 system packages](https://v2.tauri.app/start/prerequisites/) for your platform.

```sh
npm ci
npm run dev          # website and browser app
npm run dev:tauri    # installed-app shell
```

Open `http://localhost:1420/demo` for sample data or `/app` for an empty real workspace.

## Test and build

```sh
npm test             # builds, then runs all Playwright claims and accessibility checks
cargo test --manifest-path src-tauri/Cargo.toml
npm run build        # writes the deployable site to dist/site/
npm run build:desktop
```

Playwright 1.58.2 uses the browser path supplied by the factory worker. The claim registry is [.factory/claims.json](.factory/claims.json), and the demo contract is [.factory/demo.md](.factory/demo.md).

## How to use it

1. Open the installed app and name the client and week.
2. Enter a local repository path, then choose **Read Git**. Only hash, date, and subject metadata enter the draft.
3. Add manual entries or use Pro to import an ICS file.
4. Rewrite each line, set its minutes, and mark it ready.
5. Export CSV or copy the approval link.
6. Ask the client to review, accept once, and download the server-attested receipt.

The approval link contains visible worklog details. Treat it like a private document. It does not verify the approver's legal identity.

## Pro license

Pro costs $12 per user each month. Checkout uses the Sociobot billing API; no payment provider is embedded here. On return, `?license=<token>` is stored as `sb_license:worklog-approval-bridge`, stripped from the address, and verified at most once per day. Users can also paste a license in the calendar import dialog. The app keeps a cached valid state while offline.

## Privacy and architecture

- Vanilla TypeScript and Vite power the interface.
- Tauri 2 and a small Rust command read Git metadata on the selected path.
- Local storage is split between real and demo namespaces.
- Approval payloads use URL fragments, which browsers do not send in HTTP requests. The managed same-origin receipt API stores only a packet digest, name, server timestamp, receipt ID, and attestation in Azure Table storage.
- There are no analytics, third-party scripts, remote fonts, screenshots, timers, or keystroke capture.

See `/privacy` and `/terms` in the site. The night-market design and generated-image provenance are recorded in [.factory/design.md](.factory/design.md).

## Release and deploy

`npm run build:site` writes `dist/site/index.html`. Deploy that directory as the static site. `.github/workflows/release.yml` builds unsigned macOS Intel/Apple Silicon, Windows, and Linux bundles for `v*` tags. It publishes `SHA256SUMS` and `latest.json` with the GitHub Release.

The site reads release metadata from the GitHub API and falls back to a calm publishing message. It never fetches a GitHub redirect URL. `/install.sh` and `/install.ps1` verify release checksums before installation.

## License

[MIT](LICENSE) © 2026 Sociobot (Param Factory).

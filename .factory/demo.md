# Demo sandbox

- URL: `https://worklog-approval-bridge.sociobot.in/demo` or `https://worklog-approval-bridge.sociobot.in/?demo=1` (local equivalents work too).
- First action: “Try it with sample data” on the landing page.
- Desktop first run: open `/app` and select “Load sample project”. It opens the same isolated sample in one action.
- Sample: Northstar Health week of 24 August 2026, with four Git entries and two calendar entries. Five entries are ready and one needs review. Imported Git and calendar sources are filtered to the selected Monday-to-Sunday week and shown for selection before they enter a worklog.
- Approval: sample links retain `?demo=1` and the persistent banner. Acceptance creates a local `demo:worklog-bridge:receipts` record and never calls `/api/approvals`.
- Reset: use “Reset demo” in the persistent amber banner. It restores the six entries and deletes every sample receipt.
- Leave: use “Start for real”. Demo records are discarded from the active view and never copied into real storage.
- Storage: the demo uses only `demo:worklog-bridge:project` and `demo:worklog-bridge:receipts`. Real mode uses `worklog-bridge:project`; demo code does not read or write that key.
- Account boundary: `/demo` does not show sign-in or account backup controls. It does not load CIAM, call account APIs, or call the pilot billing gateway. Sample work cannot be copied into an account.
- Network: the bundled sample and demo approval need no API. Approval details stay after the `#` in the link. Real acceptance sends only the worklog identifier and supplied name to the same-origin receipt API.
- Test entry point: Playwright opens `/demo` in a fresh browser context.

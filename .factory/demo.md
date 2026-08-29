# Demo sandbox

- URL: `https://worklog-approval-bridge.sociobot.in/demo` or `https://worklog-approval-bridge.sociobot.in/?demo=1` (local equivalents work too).
- First action: “Try it with sample data” on the landing page.
- Desktop first run: open `/app` and select “Load sample project”. It opens the same isolated sample in one action.
- Sample: Northstar Health week of 24 August 2026, with four Git entries and two calendar entries. Five entries are ready and one needs review. Imported Git and calendar sources are filtered to the selected Monday-to-Sunday week and shown for selection before they enter a worklog.
- Reset: use “Reset demo” in the persistent amber banner.
- Leave: use “Start for real”. Demo records are discarded from the active view and never copied into real storage.
- Storage: the demo uses only `localStorage` key `demo:worklog-bridge:project`. Real mode uses `worklog-bridge:project`; demo code does not read or write that key.
- Network: the bundled sample needs no network. Approval details stay after the `#` in the link. Client acceptance sends only the worklog identifier and supplied name to the same-origin receipt API; no worklog entries are sent.
- Test entry point: Playwright opens `/demo` in a fresh browser context.

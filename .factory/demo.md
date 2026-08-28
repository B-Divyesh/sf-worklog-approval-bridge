# Demo sandbox

- URL: `https://worklog-approval-bridge.sociobot.in/demo` or local `http://127.0.0.1:4173/demo`.
- First action: “Try it with sample data” on the landing page.
- Sample: Northstar Health week of 24 August 2026, with four Git entries and two calendar entries. Five entries are ready and one needs review.
- Reset: use “Reset demo” in the persistent amber banner.
- Leave: use “Start for real”. Demo records are discarded from the active view and never copied into real storage.
- Storage: the demo uses only `localStorage` key `demo:worklog-bridge:project`. Real mode uses `worklog-bridge:project`; demo code does not read or write that key.
- Network: the bundled sample needs no network. Approval packet data stays in the URL fragment.
- Test entry point: Playwright opens `/demo` in a fresh browser context.

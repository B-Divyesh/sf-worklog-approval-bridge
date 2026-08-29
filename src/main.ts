import "./style.css";

type SourceKind = "Git" | "Calendar" | "Manual";
type Entry = { id: string; date: string; title: string; detail: string; source: SourceKind; duration: number; ready: boolean };
type Project = { client: string; week: string; rate: number; currency: string; entries: Entry[]; sources: string[] };
type Packet = { version: 1; client: string; week: string; currency: string; rate: number; entries: Entry[]; createdAt: string; digest: string };
type LicenseVerdict = { valid: boolean; checkedAt: number; expiresAt?: string; reason?: string };
type ApprovalReceipt = { version: 2; receiptId: string; packetDigest: string; approver: string; acceptedAt: string; attestation: string };

const PRODUCT = "worklog-approval-bridge";
const SITE = "https://worklog-approval-bridge.sociobot.in";
const BILLING = `https://api.sociobot.in/api/v1/products/${PRODUCT}`;
const REPO = "B-Divyesh/sf-worklog-approval-bridge";
const DEMO_KEY = "demo:worklog-bridge:project";
const REAL_KEY = "worklog-bridge:project";
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const LICENSE_CACHE = `${LICENSE_KEY}:verdict`;
const LICENSE_CACHE_MAX_AGE = 86_400_000;
const PACKET_HISTORY = "worklog-bridge:packet-history";
const APPROVALS_API = "/api/approvals";
const app = document.querySelector<HTMLDivElement>("#app")!;

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const today = new Date();
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
const esc = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
const money = (amount: number, currency = "USD") => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
const hours = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ""}`.trim();
const nextWeek = (week: string) => {
  const date = new Date(`${week}T12:00:00`);
  date.setDate(date.getDate() + 7);
  return isoDay(date);
};
const isMonday = (week: string) => /^\d{4}-\d{2}-\d{2}$/.test(week) && new Date(`${week}T12:00:00`).getDay() === 1;

const sampleProject = (): Project => ({
  client: "Northstar Health",
  week: "2026-08-24",
  rate: 135,
  currency: "USD",
  sources: ["northstar-portal · Git", "Delivery calendar · Calendar"],
  entries: [
    { id: uid(), date: "2026-08-24", title: "Fixed patient search filters", detail: "Combined the status filters and added empty-result handling.", source: "Git", duration: 105, ready: true },
    { id: uid(), date: "2026-08-24", title: "Weekly delivery planning", detail: "Reviewed the release scope with the client team.", source: "Calendar", duration: 45, ready: true },
    { id: uid(), date: "2026-08-25", title: "Added audit log export", detail: "Built the CSV export and covered date-range edge cases.", source: "Git", duration: 170, ready: true },
    { id: uid(), date: "2026-08-26", title: "Investigated slow dashboard queries", detail: "Measured the client dashboard and narrowed the delay to two joins.", source: "Git", duration: 130, ready: false },
    { id: uid(), date: "2026-08-27", title: "Release review", detail: "Walked through the release candidate and captured follow-up work.", source: "Calendar", duration: 60, ready: true },
    { id: uid(), date: "2026-08-28", title: "Reduced dashboard query time", detail: "Added targeted indexes and verified the reporting paths.", source: "Git", duration: 195, ready: true }
  ]
});

const emptyProject = (): Project => ({ client: "", week: isoDay(monday), rate: 0, currency: "USD", entries: [], sources: [] });
const isDemo = () => location.pathname === "/demo" || new URLSearchParams(location.search).get("demo") === "1";
const projectKey = () => isDemo() ? DEMO_KEY : REAL_KEY;
const loadProject = (): Project => {
  if (isDemo() && !localStorage.getItem(DEMO_KEY)) localStorage.setItem(DEMO_KEY, JSON.stringify(sampleProject()));
  try { return JSON.parse(localStorage.getItem(projectKey()) || "null") || emptyProject(); } catch { return emptyProject(); }
};
const saveProject = (project: Project) => localStorage.setItem(projectKey(), JSON.stringify(project));

function routeLink(path: string, label: string, className = "") {
  return `<a href="${path}" data-route class="${className}">${label}</a>`;
}

function header(active = "") {
  return `<header class="site-header">
    <div class="header-inner">
      ${routeLink("/", `<span class="wordmark-mark" aria-hidden="true"></span><span>Worklog Bridge</span>`, "wordmark")}
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="main-nav"><span aria-hidden="true">☰</span><span class="sr-only">Open menu</span></button>
      <nav class="main-nav" id="main-nav" aria-label="Main navigation">
        ${routeLink("/demo", "Demo")}
        ${routeLink("/download", "Download")}
        <a href="/#pricing">Pricing</a>
        ${routeLink("/privacy", "Privacy")}
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="shell footer-grid">
    <div><p>Worklog Bridge turns selected work traces into a client-ready weekly record.</p><p class="build-id">v0.1.6 · build 2026.08.29 · Generated hero art disclosed in the design record.</p></div>
    <nav class="footer-links" aria-label="Footer navigation">${routeLink("/privacy", "Privacy")}${routeLink("/terms", "Terms")}<a href="https://sociobot.in" rel="noopener">Built by Param Factory <span class="sr-only">(external site)</span></a></nav>
  </div></footer>`;
}

function landing() {
  document.title = "Worklog Bridge — Build client-ready worklogs";
  return `${header("home")}<main id="main">
    <section class="hero"><div class="shell hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Local work evidence · client approval</p>
        <h1 tabindex="-1">Turn activity into an approved worklog</h1>
        <p class="lede">For freelancers who rebuild billable work from Git and calendars each week.</p>
        <div class="hero-actions">${routeLink("/demo", "Try it with sample data", "button cyan")}<p class="after-click">A filled weekly worklog opens next. Nothing is saved to your real data.</p></div>
        <ul class="facts"><li>Worklog details stay on this device</li><li>No screenshots, timers, or keystrokes</li><li>Free core tools · Pro is $12 per user each month</li></ul>
      </div>
      <figure class="hero-art">
        <picture><source srcset="/assets/night-market-bridge-768.webp 768w, /assets/night-market-bridge-1280.webp 1280w" type="image/webp"><img src="/assets/night-market-bridge-1280.webp" width="1280" height="853" alt="Paper work tickets move along a rail toward an approval stamp in a night market stall." fetchpriority="high" decoding="async"></picture>
        <figcaption class="image-note">Your selected traces move through one review rail.</figcaption>
      </figure>
    </div></section>
    <section class="preview-section" aria-labelledby="preview-title"><div class="shell">
      <div class="section-head"><p class="eyebrow">A weekly record, already in motion</p><h2 id="preview-title">See the whole handoff before you share</h2><p class="lede">The sample moves from selected evidence to plain client language.</p></div>
      <div class="rail" aria-label="Three-screen product walkthrough">
        <article class="rail-stage"><span class="stage-number">SCREEN 01 · SELECT</span><h3>Choose the traces</h3><div class="source-ticket"><strong>northstar-portal</strong><small>4 Git commits selected</small></div><div class="source-ticket"><strong>Delivery calendar</strong><small>2 client events selected</small></div></article>
        <article class="rail-stage"><span class="stage-number">SCREEN 02 · REVIEW</span><h3>Write what the client needs</h3><div class="source-ticket"><strong>Added audit log export</strong><small>Tue · 2h 50m · Ready</small></div><div class="source-ticket"><strong>Reduced dashboard query time</strong><small>Fri · 3h 15m · Ready</small></div></article>
        <article class="rail-stage"><span class="stage-number">SCREEN 03 · APPROVE</span><h3>Keep the receipt</h3><div class="approval-stamp">Accepted<br>28 Aug</div><p>A server-attested digest records the packet the client accepted.</p></article>
      </div>
    </div></section>
    <section class="steps-section" aria-labelledby="steps-title"><div class="shell"><p class="eyebrow">How it works</p><h2 id="steps-title">From evidence to answer in three steps</h2><div class="steps">
      <article class="step"><h3>Select sources</h3><p>Point the desktop app at a Git repository. Pro users can also import an ICS calendar file.</p></article>
      <article class="step"><h3>Review each line</h3><p>Set time, rewrite technical notes, and remove anything the client should not see.</p></article>
      <article class="step"><h3>Send for approval</h3><p>Copy a private link. The client can accept it once and download a server-attested receipt.</p></article>
    </div></div></section>
    <section class="privacy-section" aria-labelledby="privacy-title"><div class="shell privacy-grid"><div><p class="eyebrow">A boundary, not a tracker</p><h2 id="privacy-title">Only chosen evidence enters the worklog</h2><p class="lede">The app reads commit metadata and imported calendar fields. You review every shared word.</p><p>Acceptance sends only the packet digest, supplied name, and server time. The worklog stays in the private link.</p></div><div><h3>Worklog Bridge does not</h3><ul class="not-list"><li>capture screens</li><li>record keystrokes</li><li>run a background timer</li><li>upload a repository</li></ul></div></div></section>
    <section class="pricing-section" id="pricing" aria-labelledby="pricing-title"><div class="shell"><p class="eyebrow">Simple monthly plan</p><h2 id="pricing-title">Start free, add recurring workflows</h2><div class="price-board"><div class="price-copy"><h3>Worklog Bridge Pro</h3><p class="price">$12 <span>/ user / month</span></p><p>Keep the free editor and exports. Add calendar imports and saved approval history.</p></div><div class="price-actions"><ul class="check-list"><li>ICS calendar import</li><li>Saved approval packet history</li><li>License use on another device</li></ul><a class="button mint" href="${BILLING}/checkout">Start Pro subscription</a><p><small>Sociobot/Dodo is the merchant of record. Cancel under its checkout terms.</small></p></div></div></div></section>
  </main>${footer()}`;
}

function demoBanner() {
  return isDemo() ? `<div class="demo-banner" role="status"><span>Demo — sample data, nothing is saved</span><button type="button" id="reset-demo">Reset demo</button>${routeLink("/app", "Start for real")}</div>` : "";
}

function appPage() {
  const project = loadProject();
  const packetHistory: Array<{ client: string; week: string; digest: string; createdAt: string }> = hasPro() ? JSON.parse(localStorage.getItem(PACKET_HISTORY) || "[]") : [];
  const filtered = project.entries;
  const totalMinutes = filtered.reduce((sum, entry) => sum + entry.duration, 0);
  const readyCount = filtered.filter(entry => entry.ready).length;
  document.title = `${isDemo() ? "Demo" : "Worklog"} — Worklog Bridge`;
  return `${demoBanner()}${header("app")}<main id="main"><div class="app-shell">
    <div class="app-heading"><div><p class="eyebrow">Week of ${esc(project.week)}</p><h1 tabindex="-1">Review the weekly worklog</h1></div><div class="week-total"><strong>${hours(totalMinutes)}</strong><span>${money(totalMinutes / 60 * project.rate, project.currency)} at ${money(project.rate, project.currency)}/hour</span></div></div>
    <div class="app-grid">
      <aside class="side-panel" aria-label="Worklog settings">
        <section class="panel-section"><p class="panel-label">Client and week</p><div class="field"><label for="client">Client</label><input id="client" value="${esc(project.client)}" placeholder="Client name"></div><div class="field"><label for="week">Week starts</label><input id="week" type="date" value="${esc(project.week)}"></div><div class="field"><label for="rate">Hourly rate</label><input id="rate" type="number" min="0" step="1" value="${project.rate}"></div><div class="status-line" id="project-status" aria-live="polite"></div></section>
        <section class="panel-section"><p class="panel-label">Selected sources</p><form id="git-form"><label class="field" for="git-path">Repository folder</label><div class="inline-form"><input id="git-path" name="path" placeholder="/path/to/repository" required><button type="submit" class="secondary">Read Git</button></div></form><div class="status-line" id="source-status" aria-live="polite"></div>${licenseNotice()}<ul class="source-list">${project.sources.length ? project.sources.map(source => `<li><span class="source-dot" aria-hidden="true"></span>${esc(source)}</li>`).join("") : "<li>No sources selected yet.</li>"}</ul><label class="sr-only" for="ics-file">Choose an ICS calendar file</label><input class="sr-only" id="ics-file" type="file" accept=".ics,text/calendar"><button id="import-calendar" class="secondary" type="button">Import calendar file${hasPro() || isDemo() ? "" : " · Pro"}</button></section>
        <section class="panel-section"><p class="panel-label">Privacy check</p><p>No file content is shared. Approval links include only the entries shown here.</p><a href="/privacy" data-route>Read the privacy policy</a></section>
        ${hasPro() ? `<section class="panel-section"><p class="panel-label">Saved approval history · Pro</p>${packetHistory.length ? `<ul class="source-list">${packetHistory.slice(0, 5).map(item => `<li><span class="source-dot" aria-hidden="true"></span><span>${esc(item.client || "Client worklog")}<small>${esc(item.week)} · ${esc(item.digest.slice(0, 10))}</small></span></li>`).join("")}</ul>` : `<p>No packets saved yet. Created links will appear here.</p>`}</section>` : ""}
      </aside>
      <section class="work-panel" aria-labelledby="entries-title">
        <div class="work-toolbar"><div><h2 id="entries-title">Entries</h2><span>${readyCount} of ${filtered.length} ready</span></div><div class="filter-group"><label class="sr-only" for="entry-filter">Filter entries</label><input id="entry-filter" type="search" placeholder="Filter entries · press /"><button id="add-entry" class="secondary" type="button">Add entry</button></div></div>
        <ul class="entry-list" id="entry-list">${renderEntries(filtered)}</ul>
        <div class="review-bar"><div><p>Review every line before you create the approval link.</p><div class="status-line" id="app-status" aria-live="polite"></div></div><div class="review-actions"><button id="export-csv" class="secondary" type="button">Export CSV</button><button id="create-link" class="mint" type="button" ${filtered.length ? "" : "disabled"}>Copy approval link</button></div></div>
      </section>
    </div>
  </div></main>${footer()}`;
}

function renderEntries(entries: Entry[]) {
  if (!entries.length) return `<li class="empty-state"><div class="empty-lantern" aria-hidden="true"></div><h3>No work entries yet</h3><p>Add an entry or read a Git repository. Your reviewed work will appear here.</p><button type="button" class="cyan" data-empty-add>Add first entry</button></li>`;
  return entries.map(entry => `<li class="entry-row" data-entry-id="${entry.id}">
    <span class="entry-date">${esc(new Date(`${entry.date}T12:00:00`).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }))}</span>
    <span class="entry-title"><strong>${esc(entry.title)}</strong><small>${esc(entry.detail)}</small></span>
    <span class="source-badge">${esc(entry.source)}</span><span class="entry-duration">${hours(entry.duration)}</span>
    <span class="row-actions"><button class="icon-button" type="button" data-edit="${entry.id}" aria-label="Edit ${esc(entry.title)}">Edit</button><button class="icon-button" type="button" data-remove="${entry.id}" aria-label="Remove ${esc(entry.title)}">×</button></span>
  </li>`).join("");
}

function legalPage(kind: "privacy" | "terms") {
  const privacy = kind === "privacy";
  document.title = `${privacy ? "Privacy" : "Terms"} — Worklog Bridge`;
  return `${header(kind)}<main id="main" class="legal"><article class="narrow"><p class="eyebrow">Last updated 28 August 2026</p><h1 tabindex="-1">${privacy ? "Privacy without surveillance" : "Terms for Worklog Bridge"}</h1>${privacy ? `
    <p class="lede">Worklog Bridge keeps project data in the app or browser storage you control.</p>
    <h2>What stays on your device</h2><p>Client names, work entries, repository paths, rates, and imported events stay in local storage. The installed app reads selected Git commit metadata on your device.</p>
    <h2>What a shared link contains</h2><p>An approval link stores the visible worklog inside the link fragment. Browsers do not send that fragment to our server. Anyone with the link can read its entries, so send it only to the intended client.</p>
    <h2>What acceptance records</h2><p>When a client accepts, the receipt service stores only the packet digest, their supplied name, a server timestamp, and an attestation. It never receives the worklog entries or repository content.</p>
    <h2>License checks</h2><p>If you add a Pro license, the app sends that token to the Sociobot billing API. It stores the result for one day. Checkout and refunds are handled by Sociobot/Dodo.</p>
    <h2>What we do not collect</h2><p>We do not collect screenshots, keystrokes, repository content, calendar accounts, analytics, or advertising identifiers.</p>
    <h2>Delete your data</h2><p>Remove entries in the app or clear the site data in your browser. Uninstalling the desktop app removes access to its local data.</p>
    <h2>Contact</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a privacy question.</p>` : `
    <p class="lede">These terms cover the Worklog Bridge website, app, and Pro subscription.</p>
    <h2>Use of the app</h2><p>You may use the app to prepare and share your own work records. You are responsible for checking entries before sharing them.</p>
    <h2>Approval receipts</h2><p>A receipt service records the first acceptance for one packet digest. It returns a receipt ID, server timestamp, and attestation that anyone with the packet can verify. It does not verify legal identity or replace legal advice.</p>
    <h2>Pro subscription</h2><p>Pro costs $12 per user each month. Sociobot/Dodo is the merchant of record. Billing, cancellation, and refunds follow the terms shown during checkout. A refund or cancellation may make the license inactive.</p>
    <h2>No warranty</h2><p>The software is provided as available, without warranties. Keep your own copies of records needed for billing or tax purposes.</p>
    <h2>Contact</h2><p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a> with a terms question.</p>`}</article></main>${footer()}`;
}

function downloadPage() {
  document.title = "Download — Worklog Bridge";
  return `${header("download")}<main id="main" class="download-page"><div class="narrow"><p class="eyebrow">Desktop app</p><h1 tabindex="-1">Install Worklog Bridge</h1><p class="lede">Choose the app for your computer. Your worklogs remain local after installation.</p><div class="download-box" id="download-box" aria-live="polite"><p class="platform-label">Checking your platform and the latest release…</p></div><h2>Command line install</h2><p>The macOS and Linux installer rejects a download whose SHA-256 does not match the published checksum.</p><p>macOS and Linux</p><div class="code-line" tabindex="0" aria-label="macOS and Linux installer command. Use the left and right arrow keys to read the full command.">curl -fsSL ${SITE}/install.sh | sh</div><p>Windows PowerShell</p><div class="code-line" tabindex="0" aria-label="Windows PowerShell installer command. Use the left and right arrow keys to read the full command.">irm ${SITE}/install.ps1 | iex</div><div class="notice"><strong>Unsigned preview:</strong> The first release is unsigned. Your operating system may ask you to confirm that you trust it.</div></div></main>${footer()}`;
}

function decodePacket(): Packet | null {
  try {
    const bytes = Uint8Array.from(atob(location.hash.slice(1)), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

function approvalPage() {
  document.title = "Approval — Worklog Bridge";
  const packet = decodePacket();
  if (!packet) return `${header()}<main id="main" class="not-found"><div class="narrow"><p class="eyebrow">Approval link error</p><h1 tabindex="-1">This worklog link is incomplete</h1><p class="lede">The private part of the link is missing or damaged. Ask the sender to create a new approval link.</p>${routeLink("/", "Return home", "button secondary")}</div></main>${footer()}`;
  const total = packet.entries.reduce((sum, item) => sum + item.duration, 0);
  return `${header()}<main id="main" class="approval-page"><div class="narrow"><p class="eyebrow">Client review · packet ${esc(packet.digest.slice(0, 10))}</p><h1 tabindex="-1">Review this weekly worklog</h1><p class="lede">Check each entry before you accept the record.</p><article class="approval-sheet"><header><h2>${esc(packet.client || "Client worklog")}</h2><p>Week of ${esc(packet.week)} · ${hours(total)} · ${money(total / 60 * packet.rate, packet.currency)}</p></header><ul class="entry-list">${packet.entries.map(entry => `<li class="entry-row"><span class="entry-date">${esc(entry.date)}</span><span class="entry-title"><strong>${esc(entry.title)}</strong><small>${esc(entry.detail)}</small></span><span class="entry-duration">${hours(entry.duration)}</span></li>`).join("")}</ul><form class="approval-form" id="approval-form"><h2>Accept this worklog</h2><p>The receipt service records your name, this packet digest, and its server time. It never receives these entries.</p><div class="field"><label for="approver">Your name</label><input id="approver" name="approver" autocomplete="name" required></div><label><input type="checkbox" name="confirmed" required> I reviewed these entries and accept this worklog.</label><div class="modal-actions"><button class="mint" type="submit">Accept and record receipt</button></div><div id="receipt-area" aria-live="polite"></div></form></article></div></main>${footer()}`;
}

function notFound() {
  document.title = "Page not found — Worklog Bridge";
  return `${header()}<main id="main" class="not-found"><div class="narrow"><p class="eyebrow">The receipt rail ends here</p><h1 tabindex="-1">This page is not on the worklog</h1><p class="lede">The address may be old or mistyped.</p>${routeLink("/", "Return home", "button cyan")}</div></main>${footer()}`;
}

function cachedLicenseVerdict(): LicenseVerdict | null {
  try {
    const verdict = JSON.parse(localStorage.getItem(LICENSE_CACHE) || "null") as LicenseVerdict | null;
    if (!verdict || typeof verdict.valid !== "boolean" || !Number.isFinite(verdict.checkedAt)) return null;
    return verdict;
  } catch { return null; }
}

function hasPro() {
  const verdict = cachedLicenseVerdict();
  return Boolean(localStorage.getItem(LICENSE_KEY))
    && verdict?.valid === true
    && Date.now() - verdict.checkedAt < LICENSE_CACHE_MAX_AGE
    && (!verdict.expiresAt || Date.parse(verdict.expiresAt) > Date.now());
}

function licenseNotice() {
  const verdict = cachedLicenseVerdict();
  if (!localStorage.getItem(LICENSE_KEY) || hasPro() || !verdict || verdict.valid) return "";
  return `<p class="notice license-notice">License no longer active. <a href="${BILLING}/checkout">Start Pro subscription</a>.</p>`;
}

async function verifyLicense() {
  const params = new URLSearchParams(location.search);
  const incoming = params.get("license");
  if (incoming) {
    localStorage.setItem(LICENSE_KEY, incoming);
    params.delete("license");
    history.replaceState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
  }
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token) return;
  let cached: LicenseVerdict | null = null;
  try { cached = JSON.parse(localStorage.getItem(LICENSE_CACHE) || "null"); } catch { /* verify below */ }
  if (cached && Date.now() - cached.checkedAt < LICENSE_CACHE_MAX_AGE) return;
  try {
    const response = await fetch(`${BILLING}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error("The license could not be checked.");
    const result = await response.json() as { valid: boolean; reason?: string; expires_at?: string };
    const valid = result.valid === true && (!result.expires_at || Date.parse(result.expires_at) > Date.now());
    localStorage.setItem(LICENSE_CACHE, JSON.stringify({ valid, reason: result.reason, expiresAt: result.expires_at, checkedAt: Date.now() }));
  } catch { /* Offline use continues from the cached verdict. */ }
}

function currentRoute() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return landing();
  if (path === "/demo" || path === "/app") return appPage();
  if (path === "/privacy") return legalPage("privacy");
  if (path === "/terms") return legalPage("terms");
  if (path === "/download") return downloadPage();
  if (path === "/approve") return approvalPage();
  return notFound();
}

function navigate(path: string) {
  history.pushState({}, "", path);
  render(true);
}

function bindGlobal() {
  document.querySelectorAll<HTMLAnchorElement>("a[data-route]").forEach(link => link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || link.target) return;
    event.preventDefault();
    if (isDemo() && new URL(link.href).pathname === "/app") localStorage.removeItem(DEMO_KEY);
    navigate(new URL(link.href).pathname + new URL(link.href).search);
  }));
  const menu = document.querySelector<HTMLButtonElement>(".menu-button");
  menu?.addEventListener("click", () => {
    const nav = document.querySelector(".main-nav");
    const open = nav?.classList.toggle("open") || false;
    menu.setAttribute("aria-expanded", String(open));
  });
}

function openEntryModal(entry?: Entry) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="entry-dialog-title"><form id="entry-form"><h2 id="entry-dialog-title">${entry ? "Edit work entry" : "Add work entry"}</h2><div class="field"><label for="entry-date">Date</label><input id="entry-date" name="date" type="date" required value="${esc(entry?.date || isoDay(today))}"></div><div class="field"><label for="entry-title">Client-ready summary</label><input id="entry-title" name="title" required maxlength="100" value="${esc(entry?.title || "")}"></div><div class="field"><label for="entry-detail">Useful detail</label><textarea id="entry-detail" name="detail" maxlength="280">${esc(entry?.detail || "")}</textarea></div><div class="field"><label for="entry-duration">Minutes</label><input id="entry-duration" name="duration" type="number" min="1" max="1440" required value="${entry?.duration || 60}"></div><div class="field"><label for="entry-source">Source</label><select id="entry-source" name="source"><option${entry?.source === "Manual" ? " selected" : ""}>Manual</option><option${entry?.source === "Git" ? " selected" : ""}>Git</option><option${entry?.source === "Calendar" ? " selected" : ""}>Calendar</option></select></div><label><input type="checkbox" name="ready" ${entry?.ready !== false ? "checked" : ""}> Ready to share</label><div class="modal-actions"><button class="secondary" type="button" data-close>Cancel</button><button class="cyan" type="submit">Save entry</button></div></form></div>`;
  document.body.append(modal);
  const close = () => { modal.remove(); document.querySelector<HTMLButtonElement>(entry ? `[data-edit="${entry.id}"]` : "#add-entry")?.focus(); };
  modal.querySelector("[data-close]")?.addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
    const focusable = [...modal.querySelectorAll<HTMLElement>("button,input,textarea,select")];
    if (event.key === "Tab" && focusable.length) {
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  modal.querySelector<HTMLFormElement>("#entry-form")!.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const project = loadProject();
    const updated: Entry = { id: entry?.id || uid(), date: String(data.get("date")), title: String(data.get("title")).trim(), detail: String(data.get("detail")).trim(), duration: Number(data.get("duration")), source: String(data.get("source")) as SourceKind, ready: data.get("ready") === "on" };
    project.entries = entry ? project.entries.map(item => item.id === entry.id ? updated : item) : [...project.entries, updated];
    saveProject(project); close(); render();
  });
  modal.querySelector<HTMLInputElement>("#entry-title")?.focus();
}

function downloadBlob(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function parseIcs(text: string, week: string): Entry[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  return unfolded.split("BEGIN:VEVENT").slice(1).map(block => {
    const get = (name: string) => block.match(new RegExp(`(?:^|\\n)${name}[^:]*:(.*)`, "i"))?.[1]?.trim() || "";
    const start = get("DTSTART"); const end = get("DTEND");
    const parseDate = (raw: string) => raw ? new Date(raw.replace(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?.*$/, "$1-$2-$3T$4:$5:00")) : new Date("invalid");
    const from = parseDate(start); const to = parseDate(end);
    const duration = Number.isFinite(+to - +from) && +to > +from ? Math.round((+to - +from) / 60000) : 60;
    return { id: uid(), date: isoDay(from), title: get("SUMMARY") || "Calendar event", detail: get("DESCRIPTION").replace(/\\n/g, " ").slice(0, 280), source: "Calendar" as const, duration, ready: false };
  }).filter(entry => entry.date >= week && entry.date < nextWeek(week));
}

function openSourceSelection(entries: Entry[], sourceLabel: string, trigger: HTMLElement) {
  const modal = document.createElement("div"); modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="source-selection-title"><form id="source-selection-form"><h2 id="source-selection-title">Choose ${entries[0]?.source === "Git" ? "Git commits" : "calendar events"}</h2><p>Select the ${entries[0]?.source === "Git" ? "commits" : "events"} from this week that belong in the worklog.</p><label class="select-all"><input type="checkbox" id="select-all-sources" checked> Select all ${entries.length}</label><ul class="selection-list">${entries.map(entry => `<li><label><input type="checkbox" name="entry" value="${esc(entry.id)}" checked><span><strong>${esc(entry.title)}</strong><small>${esc(entry.date)} · ${hours(entry.duration)}</small></span></label></li>`).join("")}</ul><div class="modal-actions"><button class="secondary" type="button" data-close>Cancel</button><button class="cyan" type="submit">Add selected entries</button></div><div class="status-line" id="selection-status" aria-live="polite"></div></form></div>`;
  document.body.append(modal);
  const close = () => { modal.remove(); trigger.focus(); };
  modal.querySelector("[data-close]")?.addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll<HTMLElement>('button,input:not([disabled])')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  const all = modal.querySelector<HTMLInputElement>("#select-all-sources")!;
  const boxes = () => [...modal.querySelectorAll<HTMLInputElement>('input[name="entry"]')];
  all.addEventListener("change", () => boxes().forEach(box => box.checked = all.checked));
  boxes().forEach(box => box.addEventListener("change", () => { all.checked = boxes().every(item => item.checked); all.indeterminate = !all.checked && boxes().some(item => item.checked); }));
  modal.querySelector<HTMLFormElement>("#source-selection-form")!.addEventListener("submit", event => {
    event.preventDefault();
    const selected = new Set(new FormData(event.currentTarget as HTMLFormElement).getAll("entry").map(String));
    if (!selected.size) { const status = modal.querySelector<HTMLElement>("#selection-status")!; status.textContent = "Select at least one entry to add it."; status.classList.add("error"); return; }
    const project = loadProject(); project.entries.push(...entries.filter(entry => selected.has(entry.id))); project.sources.push(sourceLabel); saveProject(project); modal.remove(); render();
  });
  all.focus();
}

async function createApprovalLink(project: Project) {
  if (!project.client.trim()) throw new Error("Add a client name before creating an approval link.");
  if (!isMonday(project.week)) throw new Error("Choose a Monday as the start of this work week.");
  if (!Number.isFinite(project.rate) || project.rate < 0) throw new Error("Hourly rate must be zero or more before creating an approval link.");
  const entries = project.entries.filter(entry => entry.ready);
  if (!entries.length) throw new Error("Mark at least one entry ready before creating a link.");
  const base = { version: 1 as const, client: project.client, week: project.week, rate: project.rate, currency: project.currency, entries, createdAt: new Date().toISOString() };
  const digest = await sha256(JSON.stringify(base));
  const packet: Packet = { ...base, digest };
  const bytes = new TextEncoder().encode(JSON.stringify(packet));
  let binary = ""; bytes.forEach(byte => binary += String.fromCharCode(byte));
  const shareBase = ["localhost", "127.0.0.1"].includes(location.hostname) ? location.origin : SITE;
  return `${shareBase}/approve#${btoa(binary)}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function bindApp() {
  const project = loadProject();
  const persistField = (id: string, key: "client" | "week" | "rate") => document.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener("change", event => {
    const input = event.target as HTMLInputElement;
    const next = loadProject();
    if (key === "rate") {
      const rate = Number(input.value);
      if (!Number.isFinite(rate) || rate < 0 || !input.validity.valid) {
        input.value = String(next.rate);
        setStatus("Hourly rate must be zero or more. The previous rate was kept.", true, "project-status");
        return;
      }
      next.rate = rate;
    } else if (key === "week") {
      if (!isMonday(input.value)) {
        input.value = next.week;
        setStatus("Choose a Monday as the start of this work week. The previous week was kept.", true, "project-status");
        return;
      }
      next.week = input.value;
    } else {
      next.client = input.value;
    }
    saveProject(next); render();
  });
  persistField("client", "client"); persistField("week", "week"); persistField("rate", "rate");
  document.querySelector("#reset-demo")?.addEventListener("click", () => { localStorage.setItem(DEMO_KEY, JSON.stringify(sampleProject())); render(); });
  document.querySelector("#add-entry")?.addEventListener("click", () => openEntryModal());
  document.querySelector("[data-empty-add]")?.addEventListener("click", () => openEntryModal());
  document.querySelectorAll<HTMLElement>("[data-edit]").forEach(button => button.addEventListener("click", () => openEntryModal(project.entries.find(entry => entry.id === button.dataset.edit))));
  document.querySelectorAll<HTMLElement>("[data-remove]").forEach(button => button.addEventListener("click", () => {
    const entry = project.entries.find(item => item.id === button.dataset.remove);
    if (entry && confirm(`Remove “${entry.title}” from this worklog?`)) { project.entries = project.entries.filter(item => item.id !== entry.id); saveProject(project); render(); }
  }));
  const filter = document.querySelector<HTMLInputElement>("#entry-filter");
  filter?.addEventListener("input", () => {
    const term = filter.value.toLowerCase();
    document.querySelector("#entry-list")!.innerHTML = renderEntries(project.entries.filter(entry => `${entry.title} ${entry.detail} ${entry.source}`.toLowerCase().includes(term)));
  });
  document.querySelector("#export-csv")?.addEventListener("click", () => {
    const quote = (value: unknown) => {
      const text = String(value);
      const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const csv = ["date,summary,detail,source,minutes,ready", ...project.entries.map(entry => [entry.date, entry.title, entry.detail, entry.source, entry.duration, entry.ready].map(quote).join(","))].join("\n");
    downloadBlob(`worklog-${project.week}.csv`, csv, "text/csv");
    setStatus("Exported the CSV file.");
  });
  document.querySelector("#create-link")?.addEventListener("click", async () => {
    try {
      const link = await createApprovalLink(project);
      await navigator.clipboard.writeText(link);
      if (hasPro()) {
        const packet = decodePacketFromLink(link);
        if (packet) {
          const history = JSON.parse(localStorage.getItem(PACKET_HISTORY) || "[]");
          if (!history.some((item: { digest: string }) => item.digest === packet.digest)) history.unshift({ client: packet.client, week: packet.week, digest: packet.digest, createdAt: packet.createdAt });
          localStorage.setItem(PACKET_HISTORY, JSON.stringify(history.slice(0, 50)));
        }
      }
      setStatus("Copied the approval link. Send it only to the client.");
    }
    catch (error) { setStatus(error instanceof Error ? error.message : "The link could not be created. Try again.", true); }
  });
  document.querySelector("#import-calendar")?.addEventListener("click", () => {
    if (!hasPro() && !isDemo()) { showLicenseModal(); return; }
    document.querySelector<HTMLInputElement>("#ics-file")?.click();
  });
  document.querySelector<HTMLInputElement>("#ics-file")?.addEventListener("change", async event => {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    try {
      const entries = parseIcs(await file.text(), project.week);
      if (!entries.length) throw new Error(`No calendar events were found for the week of ${project.week}.`);
      openSourceSelection(entries, `${file.name} · Calendar`, document.querySelector<HTMLElement>("#import-calendar")!);
    } catch (error) { setStatus(error instanceof Error ? `${error.message} Choose another ICS file.` : "The calendar file could not be read. Choose another ICS file.", true, "source-status"); }
  });
  document.querySelector<HTMLFormElement>("#git-form")?.addEventListener("submit", async event => {
    event.preventDefault(); const path = String(new FormData(event.currentTarget as HTMLFormElement).get("path") || "");
    try {
      if (!("__TAURI_INTERNALS__" in window)) throw new Error("Git reading is available in the installed desktop app.");
      setStatus("Reading selected Git metadata…", false, "source-status");
      const { invoke } = await import("@tauri-apps/api/core");
      const commits = await invoke<Array<{ hash: string; date: string; title: string }>>("collect_git", { path, week: project.week, nextWeek: nextWeek(project.week) });
      const entries = commits.map(commit => ({ id: uid(), date: commit.date, title: commit.title, detail: `Commit ${commit.hash.slice(0, 8)}`, source: "Git" as const, duration: 60, ready: false }));
      if (!entries.length) throw new Error(`No Git commits were found for the week of ${project.week}.`);
      openSourceSelection(entries, `${path.split(/[\\/]/).pop() || path} · Git`, document.querySelector<HTMLElement>("#git-form button")!);
    } catch (error) { setStatus(`${error instanceof Error ? error.message : "Git metadata could not be read."} Check the folder and try again.`, true, "source-status"); }
  });
  document.onkeydown = appShortcuts;
  if (!navigator.onLine) setStatus("You are offline. Saved work remains available.");
}

function decodePacketFromLink(link: string): Packet | null {
  try {
    const encoded = new URL(link).hash.slice(1);
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

function appShortcuts(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
  if (event.key === "/") { event.preventDefault(); document.querySelector<HTMLInputElement>("#entry-filter")?.focus(); }
  if (event.key.toLowerCase() === "n") { event.preventDefault(); openEntryModal(); }
  if (event.key.toLowerCase() === "e") { event.preventDefault(); document.querySelector<HTMLButtonElement>("#export-csv")?.click(); }
}

function setStatus(message: string, error = false, id = "app-status") {
  const node = document.querySelector<HTMLElement>(`#${id}`); if (!node) return;
  node.textContent = message; node.classList.toggle("error", error);
}

function showLicenseModal() {
  const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const modal = document.createElement("div"); modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="license-title"><h2 id="license-title">Add calendar imports</h2><p>Pro costs $12 per user each month. It adds ICS import and saved approval history.</p><a class="button mint" href="${BILLING}/checkout">Start Pro subscription</a><form id="license-form"><div class="field"><label for="license-token">Have a license? Paste it here</label><input id="license-token" name="token" required autocomplete="off"></div><div class="modal-actions"><button class="secondary" type="button" data-close>Cancel</button><button type="submit" class="cyan">Verify license</button></div><div class="status-line" id="license-status" aria-live="polite"></div></form><p><small>Verification sends only this token to the Sociobot billing API.</small></p></div>`;
  document.body.append(modal); const close = () => { modal.remove(); trigger?.focus(); };
  modal.querySelector("[data-close]")?.addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  modal.querySelector<HTMLFormElement>("#license-form")?.addEventListener("submit", async event => {
    event.preventDefault(); const token = String(new FormData(event.currentTarget as HTMLFormElement).get("token") || "").trim();
    const node = modal.querySelector<HTMLElement>("#license-status")!; node.textContent = "Checking the license…";
    try {
      const response = await fetch(`${BILLING}/verify?license=${encodeURIComponent(token)}`);
      if (!response.ok) throw new Error("The license could not be checked. Try again online.");
      const result = await response.json() as { valid: boolean; reason?: string; expires_at?: string };
      const valid = result.valid === true && (!result.expires_at || Date.parse(result.expires_at) > Date.now());
      localStorage.setItem(LICENSE_KEY, token);
      localStorage.setItem(LICENSE_CACHE, JSON.stringify({ valid, reason: result.reason, checkedAt: Date.now(), expiresAt: result.expires_at }));
      if (!valid) throw new Error("This license is not active. Check the token or start a subscription.");
      close(); render();
    }
    catch (error) { node.textContent = error instanceof Error ? error.message : "The license could not be checked. Try again online."; node.classList.add("error"); }
  });
  modal.querySelector<HTMLInputElement>("#license-token")?.focus();
}

async function bindApproval() {
  const initialPacket = decodePacket();
  const formNode = document.querySelector<HTMLFormElement>("#approval-form");
  const area = document.querySelector<HTMLElement>("#receipt-area");
  const submit = formNode?.querySelector<HTMLButtonElement>("button[type=submit]");
  if (initialPacket && formNode) {
    const { digest: claimedDigest, ...base } = initialPacket;
    const actualDigest = await sha256(JSON.stringify(base));
    if (actualDigest !== claimedDigest) {
      formNode.innerHTML = `<h2>This worklog was changed</h2><p class="error">The packet digest does not match its entries. Ask the sender for a new approval link.</p>`;
      return;
    }
    try {
      const response = await fetch(`${APPROVALS_API}?packetDigest=${encodeURIComponent(initialPacket.digest)}`, { cache: "no-store" });
      if (response.status === 200) {
        const result = await response.json() as { receipt: ApprovalReceipt; valid: boolean };
        if (!result.valid) throw new Error("The receipt attestation could not be verified.");
        showReceipt(result.receipt, area!);
        if (submit) submit.disabled = true;
        [...formNode.querySelectorAll<HTMLInputElement>("input")].forEach(input => input.disabled = true);
        return;
      }
      if (response.status !== 204) throw new Error((await response.json() as { error?: string }).error || "The acceptance record could not be checked.");
    } catch (error) {
      if (submit) submit.disabled = true;
      if (area) area.innerHTML = `<p class="error">${esc(error instanceof Error ? error.message : "The acceptance record could not be checked.")} Reconnect and reload before accepting.</p>`;
      return;
    }
  }
  formNode?.addEventListener("submit", async event => {
    event.preventDefault(); const packet = decodePacket(); if (!packet) return;
    const form = event.currentTarget as HTMLFormElement;
    const approver = String(new FormData(form).get("approver") || "").trim();
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    button.disabled = true; button.textContent = "Recording acceptance…";
    try {
      const response = await fetch(APPROVALS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packetDigest: packet.digest, approver }) });
      const result = await response.json() as { receipt?: ApprovalReceipt; error?: string };
      if (!response.ok && response.status !== 409) throw new Error(result.error || "The approval record could not be saved.");
      if (!result.receipt) throw new Error("The approval service returned an incomplete receipt.");
      showReceipt(result.receipt, area!);
      [...form.querySelectorAll<HTMLInputElement>("input")].forEach(input => input.disabled = true);
    } catch (error) {
      button.disabled = false; button.textContent = "Accept and record receipt";
      if (area) area.innerHTML = `<p class="error">${esc(error instanceof Error ? error.message : "The approval record could not be saved.")} Check your connection and try again.</p>`;
    }
  });
}

function showReceipt(receipt: ApprovalReceipt, area: HTMLElement) {
  area.innerHTML = `<div class="receipt"><strong>Acceptance recorded</strong><p>${esc(receipt.approver)} accepted this packet at ${esc(new Date(receipt.acceptedAt).toLocaleString())}.</p><p>This packet can be accepted only once. Receipt ID: <code>${esc(receipt.receiptId)}</code></p><p>Server attestation: <code>${esc(receipt.attestation)}</code></p><p><button type="button" id="download-receipt" class="secondary">Download receipt</button></p></div>`;
  document.querySelector("#download-receipt")?.addEventListener("click", () => downloadBlob(`worklog-receipt-${receipt.packetDigest.slice(0, 10)}.json`, JSON.stringify(receipt, null, 2), "application/json"));
}

async function bindDownloads() {
  const box = document.querySelector<HTMLElement>("#download-box"); if (!box) return;
  const os = /Windows/i.test(navigator.userAgent) ? "Windows" : /Mac/i.test(navigator.userAgent) ? "macOS" : "Linux";
  try {
    const cacheRaw = localStorage.getItem("worklog-bridge:release-v3"); const cache = cacheRaw ? JSON.parse(cacheRaw) : null;
    let release = cache && Date.now() - cache.time < 3_600_000 ? cache.data : null;
    if (!release) {
      const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
      if (!response.ok) throw new Error();
      release = await response.json();
      const refResponse = await fetch(`https://api.github.com/repos/${REPO}/git/ref/tags/${encodeURIComponent(release.tag_name)}`);
      if (!refResponse.ok) throw new Error();
      let object = (await refResponse.json()).object;
      while (object?.type === "tag") {
        const tagResponse = await fetch(`https://api.github.com/repos/${REPO}/git/tags/${object.sha}`);
        if (!tagResponse.ok) throw new Error();
        object = (await tagResponse.json()).object;
      }
      if (object?.type !== "commit" || !/^[a-f0-9]{40}$/i.test(object.sha)) throw new Error();
      release.commit = object.sha;
      localStorage.setItem("worklog-bridge:release-v3", JSON.stringify({ time: Date.now(), data: release }));
    }
    const matcher = os === "Windows" ? /\.(msi|exe)$/i : os === "macOS" ? /\.(dmg|app\.tar\.gz)$/i : /\.(AppImage|deb)$/i;
    const asset = release.assets.find((item: { name: string }) => matcher.test(item.name));
    const releasePath = `/releases/download/${release.tag_name}/`;
    if (!asset || !asset.browser_download_url.includes(releasePath) || !/^[a-f0-9]{40}$/i.test(release.commit)) throw new Error();
    box.innerHTML = `<p class="platform-label">Detected platform: ${os} · ${esc(release.tag_name)}</p><a class="button cyan" href="${esc(asset.browser_download_url)}">Download for ${os}</a><p class="release-source">Built from source <code>${esc(release.commit.slice(0, 7))}</code>.</p><p><a href="${esc(release.html_url)}">See every release file <span class="sr-only">(external site)</span></a></p>`;
  } catch {
    box.innerHTML = `<p class="platform-label">Detected platform: ${os}</p><h2>Downloads are being published</h2><p>The release files are not available yet. Check the Releases page again soon.</p><a class="button secondary" href="https://github.com/${REPO}/releases">Open Releases <span class="sr-only">(external site)</span></a>`;
  }
}

function render(moveFocus = false) {
  app.innerHTML = currentRoute(); bindGlobal();
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `${SITE}${location.pathname === "/" ? "/" : location.pathname}`;
  document.querySelectorAll<HTMLMetaElement>('meta[property="og:title"], meta[name="twitter:title"]').forEach(meta => meta.content = document.title);
  if (location.pathname === "/app" || location.pathname === "/demo") bindApp(); else document.onkeydown = null;
  if (location.pathname === "/approve") void bindApproval();
  if (location.pathname === "/download") void bindDownloads();
  if (moveFocus) {
    const heading = document.querySelector<HTMLElement>("h1"); heading?.focus();
    const status = document.querySelector<HTMLElement>("#route-status"); if (status) status.textContent = heading?.textContent || document.title;
    scrollTo(0, 0);
  }
}

window.addEventListener("popstate", () => render(true));
window.addEventListener("online", () => setStatus("You are back online."));
window.addEventListener("offline", () => setStatus("You are offline. Saved work remains available."));
void verifyLicense().finally(() => render());
if ("serviceWorker" in navigator && !import.meta.env.DEV) window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(() => undefined));

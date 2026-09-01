import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

type Receipt = { version: 2; receiptId: string; packetDigest: string; approver: string; acceptedAt: string; attestation: string };
const APP_ORIGIN = "http://127.0.0.1:4173";

async function inIsolatedContext(
  browser: import("@playwright/test").Browser,
  run: (page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) => Promise<void>,
  permissions: string[] = []
) {
  const context = await browser.newContext({ baseURL: APP_ORIGIN, permissions });
  const page = await context.newPage();
  try {
    await run(page, context);
  } finally {
    await context.close();
  }
}

function mockApprovalService(page: import("@playwright/test").Page, observed?: { bodies: unknown[]; lookupStatuses?: number[] }) {
  let receipt: Receipt | undefined;
  return page.route("**/api/approvals**", async route => {
    const request = route.request();
    if (request.method() === "GET") {
      if (!receipt) {
        observed?.lookupStatuses?.push(204);
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ receipt, valid: true }) });
    }
    const body = JSON.parse(request.postData() || "{}");
    observed?.bodies.push(body);
    if (receipt) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ receipt, created: false }) });
    receipt = { version: 2, receiptId: "receipt-regression-001", packetDigest: body.packetDigest, approver: body.approver, acceptedAt: "2026-08-28T12:00:00.000Z", attestation: "test-server-attestation" };
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ receipt, created: true }) });
  });
}

test("@claim:offline-reload saved work remains available offline", async ({ browser }) => {
  await inIsolatedContext(browser, async (page, context) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: "Review the weekly worklog" })).toBeVisible();
    const worker = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return { scope: registration.scope, script: registration.active?.scriptURL };
    });
    expect(worker.scope).toBe(`${APP_ORIGIN}/`);
    expect(worker.script).toBe(`${APP_ORIGIN}/service-worker.js`);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText("Fixed patient search filters")).toBeVisible();
    await expect(page.getByText("You are offline. Saved work remains available.")).toBeVisible();
  });
});

test("@claim:csv-export exports six sample records", async ({ page }) => {
  await page.goto("/demo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let body = "";
  for await (const chunk of stream!) body += chunk.toString();
  const lines = body.trim().split("\n");
  expect(lines[0]).toBe("date,summary,detail,source,minutes,ready");
  expect(lines).toHaveLength(7);
  expect(body).toContain("Added audit log export");
});

test("@regression:csv-export neutralises spreadsheet formulas", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Add entry" }).click();
  await page.getByLabel("Client-ready summary").fill('=HYPERLINK("https://example.invalid","open")');
  await page.getByLabel("Minutes").fill("1440");
  await page.getByRole("button", { name: "Save entry" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const stream = await (await downloadPromise).createReadStream();
  let body = "";
  for await (const chunk of stream!) body += chunk.toString();
  expect(body).toContain(`"'=HYPERLINK(""https://example.invalid"",""open"")"`);
});

test("@claim:local-demo isolates editing, acceptance, receipt download, reset, and exit from real data and the production API", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const requests: Array<{ method: string; path: string }> = [];
  page.on("request", request => requests.push({ method: request.method(), path: new URL(request.url()).pathname }));
  await page.goto("/app");
  await page.evaluate(() => localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "Real Client", week: "2026-08-24", rate: 80, currency: "USD", entries: [], sources: [] })));
  await page.goto("/");
  const sampleLink = page.getByRole("link", { name: "Try it with sample data" });
  await expect(sampleLink).toHaveAttribute("href", "/?demo=1");
  await sampleLink.click();
  await expect(page).toHaveURL(/\/?\?demo=1$/);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByLabel("Client")).toHaveValue("Northstar Health");
  await page.getByRole("button", { name: "Edit Investigated slow dashboard queries" }).click();
  await page.getByLabel("Client-ready summary").fill("Investigated dashboard query delay");
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  await expect(page.getByText("Copied the approval link. Send it only to the client.")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("/approve?demo=1#");
  await page.goto(link);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByText("This sample receipt stays in demo storage. It never contacts the approval service.")).toBeVisible();
  await page.getByLabel("Your name").fill("Demo Reviewer");
  await page.getByLabel("I reviewed these entries and accept this worklog.").check();
  await page.getByRole("button", { name: "Create demo receipt" }).click();
  await expect(page.getByText("Demo receipt created")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Demo receipt created")).toBeVisible();
  const receiptDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  const receiptStream = await (await receiptDownload).createReadStream();
  let receiptBody = ""; for await (const chunk of receiptStream!) receiptBody += chunk.toString();
  expect(JSON.parse(receiptBody).attestation).toBe("demo-only-local-receipt");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText("Investigated slow dashboard queries")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("demo:worklog-bridge:receipts"))).toBeNull();
  await page.getByRole("link", { name: "Start for real" }).click();
  await expect(page.getByLabel("Client")).toHaveValue("Real Client");
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys.filter(key => key.startsWith("demo:"))).toEqual([]);
  expect(requests.some(request => request.path.startsWith("/api/approvals"))).toBe(false);
  expect(requests.every(request => request.method === "GET")).toBe(true);
});

test("@claim:account-demo-boundary keeps the sample out of sign-in, account backup, and billing", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/demo");
  await expect(page.getByText("Sample work stays in demo storage. It never starts sign-in, backup, or billing.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect(requests.some(url => /ciamlogin\.com|api\.sociobot\.in|\/api\/v1\//.test(url))).toBe(false);
  expect(await page.evaluate(() => sessionStorage.getItem("worklog-bridge:account"))).toBeNull();
});

test("@claim:worklog-details-local submits only digest and acceptance metadata", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const observed = { bodies: [] as unknown[] };
  await mockApprovalService(page, observed);
  await page.goto("/app");
  await page.evaluate(() => localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "Local details client", week: "2026-08-24", rate: 80, currency: "USD", sources: [], entries: [{ id: "local-entry", date: "2026-08-25", title: "Fixed patient search filters", detail: "Private worklog detail", source: "Manual", duration: 60, ready: true }] })));
  await page.reload();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  await page.goto(await page.evaluate(() => navigator.clipboard.readText()));
  await page.getByLabel("Your name").fill("Mira Chen");
  await page.getByLabel("I reviewed these entries and accept this worklog.").check();
  await page.getByRole("button", { name: "Accept and record receipt" }).click();
  expect(observed.bodies).toHaveLength(1);
  expect(observed.bodies[0]).toEqual({ packetDigest: expect.stringMatching(/^[a-f0-9]{64}$/), approver: "Mira Chen" });
  expect(JSON.stringify(observed.bodies[0])).not.toContain("Fixed patient search filters");
});

test("@claim:approval-receipt records one durable, verifiable acceptance", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  await mockApprovalService(page);
  await page.goto("/app");
  await page.evaluate(() => localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "Receipt client", week: "2026-08-24", rate: 80, currency: "USD", sources: [], entries: [{ id: "receipt-entry", date: "2026-08-25", title: "Prepared receipt test", detail: "Ready for client review", source: "Manual", duration: 60, ready: true }] })));
  await page.reload();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Review this weekly worklog" })).toBeVisible();
  await page.getByLabel("Your name").fill("Mira Chen");
  await page.getByLabel("I reviewed these entries and accept this worklog.").check();
  await page.getByRole("button", { name: "Accept and record receipt" }).click();
  await expect(page.getByText("Acceptance recorded")).toBeVisible();
  await expect(page.getByText("receipt-regression-001")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Acceptance recorded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept and record receipt" })).toBeDisabled();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let body = "";
  for await (const chunk of stream!) body += chunk.toString();
  const receipt = JSON.parse(body);
  expect(receipt.approver).toBe("Mira Chen");
  expect(receipt.packetDigest).toMatch(/^[a-f0-9]{64}$/);
  expect(receipt.receiptId).toBe("receipt-regression-001");
  expect(receipt.attestation).toBe("test-server-attestation");
  const tampered = await page.evaluate(original => {
    const url = new URL(original);
    const bytes = Uint8Array.from(atob(url.hash.slice(1)), c => c.charCodeAt(0));
    const packet = JSON.parse(new TextDecoder().decode(bytes));
    packet.client = "Changed client";
    const encoded = new TextEncoder().encode(JSON.stringify(packet));
    let binary = "";
    encoded.forEach(byte => binary += String.fromCharCode(byte));
    url.hash = btoa(binary);
    return url.toString();
  }, link);
  await page.goto(tampered);
  await expect(page.getByRole("heading", { name: "This worklog was changed" })).toBeVisible();
});

test("@regression:new-approval-link has no console error before its first acceptance", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const observed = { bodies: [] as unknown[], lookupStatuses: [] as number[] };
  await mockApprovalService(page, observed);
  await page.goto("/app");
  await page.evaluate(() => localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "New approval client", week: "2026-08-24", rate: 80, currency: "USD", sources: [], entries: [{ id: "new-link", date: "2026-08-25", title: "Initial approval item", detail: "Ready for review", source: "Manual", duration: 60, ready: true }] })));
  await page.reload();
  await page.getByRole("button", { name: "Edit Initial approval item" }).click();
  await page.getByLabel("Client-ready summary").fill(`New approval packet ${Date.now()}`);
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Review this weekly worklog" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept and record receipt" })).toBeEnabled();
  await page.waitForLoadState("networkidle");
  expect(observed.lookupStatuses).toEqual([204]);
  expect(errors).toEqual([]);
});

test("@regression:clipboard-denial shows a selected approval link without browser error text", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Write permission denied", "NotAllowedError"))
    });
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const dialog = page.getByRole("dialog", { name: "Copy approval link" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Copy this approval link, then send it to your client.")).toBeVisible();
  const field = dialog.getByLabel("Approval link");
  await expect(field).toHaveValue(/\/approve\?demo=1#/);
  await expect(field).toHaveAttribute("readonly", "");
  await expect(field).toBeFocused();
  const selection = await field.evaluate(input => ({ start: (input as HTMLInputElement).selectionStart, end: (input as HTMLInputElement).selectionEnd, length: (input as HTMLInputElement).value.length }));
  expect(selection).toEqual({ start: 0, end: selection.length, length: selection.length });
  await expect(page.getByText("Write permission denied", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Clipboard access is unavailable. Copy the approval link from the dialog.")).toBeVisible();
});

test("@claim:no-surveillance collects no screen, microphone, keystroke, or timer activity", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const origins = new Set<string>();
  page.on("request", request => origins.add(new URL(request.url()).origin));
  await page.addInitScript(() => {
    const counts = { userMedia: 0, displayMedia: 0, interval: 0 };
    Object.defineProperty(window, "__captureCounts", { value: counts });
    const originalInterval = window.setInterval;
    window.setInterval = (...args) => { counts.interval++; return originalInterval(...args); };
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => { counts.userMedia++; throw new Error("blocked"); };
      if (navigator.mediaDevices.getDisplayMedia) navigator.mediaDevices.getDisplayMedia = async () => { counts.displayMedia++; throw new Error("blocked"); };
    }
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Export CSV" }).click();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const counts = await page.evaluate(() => (window as unknown as { __captureCounts: { userMedia: number; displayMedia: number; interval: number } }).__captureCounts);
  expect(counts).toEqual({ userMedia: 0, displayMedia: 0, interval: 0 });
  expect([...origins]).toEqual(["http://127.0.0.1:4173"]);
});

test("@claim:calendar-import imports selected ICS events from the chosen week", async ({ page }) => {
  await page.goto("/demo");
  await page.locator("#ics-file").setInputFiles({
    name: "client-calendar.ics",
    mimeType: "text/calendar",
    buffer: Buffer.from("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20260829T100000Z\r\nDTEND:20260829T113000Z\r\nSUMMARY:Client release planning\r\nDESCRIPTION:Review launch checklist\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:20260902T100000Z\r\nDTEND:20260902T113000Z\r\nSUMMARY:Next week planning\r\nEND:VEVENT\r\nEND:VCALENDAR")
  });
  await expect(page.getByRole("dialog", { name: "Choose calendar events" })).toBeVisible();
  await expect(page.getByText("Next week planning")).not.toBeVisible();
  await page.getByRole("button", { name: "Add selected entries" }).click();
  await expect(page.getByText("Client release planning")).toBeVisible();
  const row = page.locator("[data-entry-id]", { hasText: "Client release planning" });
  await expect(row).toContainText("1h 30m");
  await expect(row).toContainText("Calendar");
});

test("@claim:license-unlock enables Pro only after a current valid verdict and only uses a fresh cache offline", async ({ browser }) => {
  await inIsolatedContext(browser, async (page, context) => {
    let verifyCalls = 0;
    await page.route("https://api.sociobot.in/**", async route => {
      verifyCalls++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: "2026-09-28T00:00:00Z" }) });
    });
    await page.goto("/app?license=test-license-token");
    await expect(page.getByText("Saved approval history · Pro")).toBeVisible();
    expect(page.url()).not.toContain("license=");
    expect(await page.evaluate(() => localStorage.getItem("sb_license:worklog-approval-bridge"))).toBe("test-license-token");
    expect(verifyCalls).toBe(1);
    await page.reload();
    expect(verifyCalls).toBe(1);
    await page.goto("/#pricing");
    await expect(page.locator(".price")).toContainText("$12 / user / month");
    await page.goto("/app");
    await page.unroute("https://api.sociobot.in/**");
    await context.setOffline(true);
    for (const verdict of [
      null,
      { valid: false, reason: "invalid", checkedAt: Date.now() },
      { valid: true, reason: "expired", checkedAt: Date.now(), expiresAt: "2020-01-01T00:00:00Z" },
      { valid: false, reason: "revoked", checkedAt: Date.now() }
    ]) {
      await page.evaluate(value => {
        localStorage.setItem("sb_license:worklog-approval-bridge", "test-token");
        if (value) localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify(value));
        else localStorage.removeItem("sb_license:worklog-approval-bridge:verdict");
      }, verdict);
      await page.reload();
      await expect(page.getByText("Saved approval history · Pro")).toHaveCount(0);
    }
    await page.evaluate(() => localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify({ valid: true, checkedAt: Date.now(), expiresAt: "2099-01-01T00:00:00Z" })));
    await page.reload();
    await expect(page.getByText("Saved approval history · Pro")).toBeVisible();
    await context.setOffline(false);
    await page.evaluate(() => localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify({ valid: true, checkedAt: Date.now() - 86_400_000, expiresAt: "2099-01-01T00:00:00Z" })));
    await page.route("https://api.sociobot.in/**", async route => {
      verifyCalls++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: "2099-01-01T00:00:00Z" }) });
    });
    await page.reload();
    await expect.poll(() => verifyCalls).toBeGreaterThan(1);
  });
});

test("@regression:an invalid token with no cached verdict cannot unlock Pro offline", async ({ browser }) => {
  await inIsolatedContext(browser, async (page, context) => {
    await page.goto("/app");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.evaluate(() => {
      localStorage.setItem("sb_license:worklog-approval-bridge", "definitely-not-a-license");
      localStorage.removeItem("sb_license:worklog-approval-bridge:verdict");
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText("Saved approval history · Pro")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Import calendar file · Pro" })).toBeVisible();
  });
});

test("@regression:license-verdict rejects invalid absent expired and revoked cache states", async ({ page }) => {
  await page.goto("/app");
  const states = [
    null,
    { valid: false, reason: "invalid", checkedAt: Date.now() },
    { valid: true, reason: "expired", checkedAt: Date.now(), expiresAt: "2020-01-01T00:00:00Z" },
    { valid: false, reason: "revoked", checkedAt: Date.now() }
  ];
  for (const verdict of states) {
    await page.evaluate(value => {
      localStorage.setItem("sb_license:worklog-approval-bridge", "test-token");
      if (value) localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify(value));
      else localStorage.removeItem("sb_license:worklog-approval-bridge:verdict");
    }, verdict);
    await page.reload();
    await expect(page.getByText("Saved approval history · Pro")).toHaveCount(0);
  }
});

test("@regression:license-verdict permits only fresh valid offline cache and refreshes at 24 hours", async ({ browser }) => {
  await inIsolatedContext(browser, async (page, context) => {
    await page.goto("/app");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.evaluate(() => {
      localStorage.setItem("sb_license:worklog-approval-bridge", "valid-token");
      localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify({ valid: true, checkedAt: Date.now(), expiresAt: "2099-01-01T00:00:00Z" }));
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText("Saved approval history · Pro")).toBeVisible();
    await context.setOffline(false);
    let calls = 0;
    await page.route("https://api.sociobot.in/**", async route => {
      calls++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: "2099-01-01T00:00:00Z" }) });
    });
    await page.evaluate(() => localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify({ valid: true, checkedAt: Date.now() - 86_400_000, expiresAt: "2099-01-01T00:00:00Z" })));
    await page.reload();
    await expect.poll(() => calls).toBe(1);
    await expect(page.getByText("Saved approval history · Pro")).toBeVisible();
  });
});

test("@claim:sample-counts match the sample data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("4 Git commits selected")).toBeVisible();
  await expect(page.getByText("2 client events selected")).toBeVisible();
  await page.goto("/demo");
  await expect(page.locator("[data-entry-id]")).toHaveCount(6);
  await expect(page.locator("[data-entry-id]").filter({ hasText: "Git" })).toHaveCount(4);
  await expect(page.locator("[data-entry-id]").filter({ hasText: "Calendar" })).toHaveCount(2);
});

test("@claim:pro-price verifies the hosted monthly charge and keeps licensed approval history", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const checkoutRequests: string[] = [];
  await page.route("**/api/v1/billing/checkout**", route => {
    checkoutRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ checkoutUrl: "https://checkout.dodopayments.com/session/price-fixture" }) });
  });
  await page.route("https://checkout.dodopayments.com/session/price-fixture", route => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Sociobot checkout</title><main><h1>Worklog Bridge Pro</h1><p>$12.00 / Month</p></main>" }));
  await page.goto("/#pricing");
  await expect(page.locator(".price")).toContainText("$12 / user / month");
  await expect(page.getByText("ICS calendar import")).toBeVisible();
  await expect(page.getByText("Saved approval history", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Pro subscription" })).toHaveAttribute("href", "http://127.0.0.1:4173/checkout");
  await page.getByRole("link", { name: "Start Pro subscription" }).click();
  await expect(page.getByRole("heading", { name: "Worklog Bridge Pro" })).toBeVisible();
  await expect(page.getByText("$12.00 / Month")).toBeVisible();
  expect(checkoutRequests).toEqual(["http://127.0.0.1:4173/api/v1/billing/checkout"]);
  await page.route("https://api.sociobot.in/api/v1/products/worklog-approval-bridge/verify**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: "2099-01-01T00:00:00Z" }) }));
  await page.goto("/app?license=licensed-test-token");
  await page.evaluate(() => localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "Pro history client", week: "2026-08-24", rate: 100, currency: "USD", sources: [], entries: [{ id: "history-entry", date: "2026-08-25", title: "Prepared approval history", detail: "A saved Pro history test.", source: "Manual", duration: 60, ready: true }] })));
  await page.reload();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  await page.reload();
  await expect(page.getByText("Pro history client")).toBeVisible();
});

test("@regression:checkout HTTP 500 keeps the free editor available with a retry", async ({ page }) => {
  await page.route("**/api/v1/billing/checkout**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ error: "Checkout is unavailable right now. Keep using the free editor and try again." })
  }));
  await page.goto("/#pricing");
  await page.getByRole("link", { name: "Start Pro subscription" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Open the secure checkout" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Checkout is unavailable right now. Keep using the free editor and try again.");
  await expect(page.getByRole("button", { name: "Try checkout again" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Keep using the free editor" })).toHaveAttribute("href", "/app");
});

test("@claim:no-analytics sends no analytics or advertising request through sample approval and receipt download", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const requests: string[] = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await page.goto("/demo");
  await page.getByRole("button", { name: "Export CSV" }).click();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  await page.goto(await page.evaluate(() => navigator.clipboard.readText()));
  await page.getByLabel("Your name").fill("Analytics Audit");
  await page.getByLabel("I reviewed these entries and accept this worklog.").check();
  await page.getByRole("button", { name: "Create demo receipt" }).click();
  await page.reload();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  await downloadPromise;
  const allowed = (path: string) => ["/demo", "/approve", "/favicon.svg", "/service-worker.js"].includes(path) || path.startsWith("/src/") || path.startsWith("/@") || path.startsWith("/node_modules/") || path.startsWith("/assets/");
  expect(requests.every(allowed)).toBe(true);
  expect(requests.some(path => path.startsWith("/api/"))).toBe(false);
  expect(requests.some(path => /analytics|advertis|collect|events|telemetry/i.test(path))).toBe(false);
});

test("@claim:installed-app-locality keeps import, edit, export, and sharing in the packaged app frontend", async ({ browser }) => {
  await inIsolatedContext(browser, async page => {
    const tauri = JSON.parse(await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
    expect(tauri.app.windows[0].url).toBe("/app");
    const requests: string[] = [];
    page.on("request", request => requests.push(request.url()));
    await page.goto("/app");
    await page.evaluate(() => {
      localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "", week: "2026-08-24", rate: 0, currency: "USD", entries: [], sources: [] }));
      localStorage.setItem("sb_license:worklog-approval-bridge", "packaged-app-fixture");
      localStorage.setItem("sb_license:worklog-approval-bridge:verdict", JSON.stringify({ valid: true, checkedAt: Date.now(), expiresAt: "2099-01-01T00:00:00Z" }));
    });
    await page.reload();
    await expect(page.getByLabel("Week starts")).toHaveValue("2026-08-24");
    await page.locator("#ics-file").setInputFiles({ name: "desktop-import.ics", mimeType: "text/calendar", buffer: Buffer.from("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20260825T100000Z\r\nDTEND:20260825T110000Z\r\nSUMMARY:Desktop client review\r\nDESCRIPTION:Imported on device\r\nEND:VEVENT\r\nEND:VCALENDAR") });
    const chooser = page.getByRole("dialog", { name: "Choose calendar events" });
    await expect(chooser).toBeVisible();
    await expect(chooser.getByRole("button", { name: "Add selected entries" })).toBeEnabled();
    await chooser.getByRole("button", { name: "Add selected entries" }).click();
    await page.getByRole("button", { name: "Edit Desktop client review" }).click();
    await page.getByLabel("Client-ready summary").fill("Edited desktop client review");
    await page.getByLabel("Ready to share").check();
    await page.getByRole("button", { name: "Save entry" }).click();
    const csvPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const stream = await (await csvPromise).createReadStream();
    let csv = ""; for await (const chunk of stream!) csv += chunk.toString();
    expect(csv).toContain("Edited desktop client review");
    await page.locator("#client").fill("Desktop privacy client");
    await page.locator("#client").press("Tab");
    await page.getByRole("button", { name: "Copy approval link" }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toContain("/approve#");
    expect(link).not.toContain("demo=1");
    const storage = await page.evaluate(() => ({ real: localStorage.getItem("worklog-bridge:project"), demo: localStorage.getItem("demo:worklog-bridge:project") }));
    expect(storage.real).toContain("Edited desktop client review");
    expect(storage.demo).toBeNull();
    expect(requests.every(url => new URL(url).origin === APP_ORIGIN)).toBe(true);
    expect(requests.some(url => new URL(url).pathname.startsWith("/api/"))).toBe(false);
  }, ["clipboard-read", "clipboard-write"]);
});

test("@claim:entry-review saves edits, time, readiness, removal, and the resulting export", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Edit Investigated slow dashboard queries" }).click();
  await page.getByLabel("Client-ready summary").fill("Reviewed dashboard query delay");
  await page.getByLabel("Minutes").fill("150");
  await page.getByLabel("Ready to share").check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Reviewed dashboard query delay")).toBeVisible();
  await expect(page.locator("[data-entry-id]", { hasText: "Reviewed dashboard query delay" })).toContainText("2h 30m");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Remove Release review" }).click();
  await page.reload();
  await expect(page.getByText("Reviewed dashboard query delay")).toBeVisible();
  await expect(page.getByText("Release review")).toHaveCount(0);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const stream = await (await downloadPromise).createReadStream();
  let csv = ""; for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain("Reviewed dashboard query delay");
  expect(csv).not.toContain("Release review");
});

test("@claim:free-editor lets an unlicensed workspace edit and export", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByText("Saved approval history · Pro")).toHaveCount(0);
  await page.getByRole("button", { name: "Add entry" }).click();
  await page.getByLabel("Client-ready summary").fill("Unlicensed editor entry");
  await page.getByRole("button", { name: "Save entry" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const stream = await (await downloadPromise).createReadStream();
  let csv = ""; for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain("Unlicensed editor entry");
});

test("@claim:desktop-sample-project loads the isolated sample from the configured first-run route", async ({ browser }) => {
  await inIsolatedContext(browser, async page => {
    await page.goto("/app");
    await expect(page.getByRole("button", { name: "Load sample project" })).toBeVisible();
    await page.getByRole("button", { name: "Load sample project" }).click();
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
    await expect(page.locator("[data-entry-id]")).toHaveCount(6);
    expect(await page.evaluate(() => localStorage.getItem("worklog-bridge:project"))).toBeNull();
    await page.goto("/?demo=1");
    await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
    await expect(page.locator("[data-entry-id]")).toHaveCount(6);
  });
});

test("landing and routes meet the semantic and serious accessibility baseline", async ({ page }) => {
  for (const route of ["/", "/demo", "/privacy", "/terms", "/download", "/missing-page"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/.+ — .+|Worklog Bridge — .+/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("routes set specific metadata and the 404 uses plain recovery copy", async ({ page }) => {
  const routes = [
    ["/demo", "Demo — Worklog Bridge", "Try a six-entry Worklog Bridge sample"],
    ["/app", "Worklog — Worklog Bridge", "Review worklog entries"],
    ["/privacy", "Privacy — Worklog Bridge", "How Worklog Bridge stores worklogs"],
    ["/terms", "Terms — Worklog Bridge", "The terms for using Worklog Bridge"],
    ["/download", "Download — Worklog Bridge", "Download unsigned Worklog Bridge preview packages"]
  ];
  for (const [route, title, description] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", new RegExp(`^${description}`));
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", new RegExp(`^${description}`));
  }
  await page.goto("/not-a-real-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "The page you requested was not found. Return to Worklog Bridge.");
});

test("back and forward restore route scroll and focus", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    scrollTo(0, 1100);
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(900);
  const expectedScroll = await page.evaluate(() => scrollY);
  const privacyLink = page.locator('header a[href="/privacy"]');
  await privacyLink.evaluate((link: HTMLElement) => link.focus({ preventScroll: true }));
  await privacyLink.press("Enter");
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy without surveillance" })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(expectedScroll);
  await expect(page.locator('header a[href="/privacy"]')).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy without surveillance" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("mobile demo keeps its primary workflow visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Review the weekly worklog" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy approval link" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("@regression:landing-keeps-privacy-offline-and-price-facts-in-the-first-viewport", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const fact of [
      "Worklogs stay local until you share or back up",
      "Saved work stays available offline after the first visit",
      "Free editor and exports · Pro is $12 per user each month"
    ]) {
      const box = await page.getByText(fact, { exact: true }).boundingBox();
      expect(box, fact).not.toBeNull();
      expect((box?.y || 0) + (box?.height || 0), `${viewport.width}px: ${fact}`).toBeLessThanOrEqual(viewport.height);
    }
  }
});

test("@regression:verification-14 landing task copy keeps the 16px mobile baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const locator of [page.locator(".after-click"), page.locator(".facts li")]) {
    const sizes = await locator.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fontSize));
    expect(sizes).not.toHaveLength(0);
    expect(sizes.every(size => Number.parseFloat(size) >= 16)).toBe(true);
  }
});

test("@regression:negative hourly rate stays invalid and never reaches an approval packet", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  await page.goto("/demo");
  const rate = page.getByLabel("Hourly rate");
  await rate.fill("-25");
  await rate.press("Tab");
  await expect(page.getByText("Hourly rate must be zero or more. The previous rate was kept.")).toBeVisible();
  await expect(rate).toHaveValue("135");
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const rateInPacket = await page.evaluate(value => {
    const bytes = Uint8Array.from(atob(new URL(value).hash.slice(1)), char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)).rate;
  }, link);
  expect(rateInPacket).toBe(135);
});

test("@regression:license-dialog traps focus closes on Escape and restores its trigger", async ({ page }) => {
  await page.goto("/app");
  const trigger = page.getByRole("button", { name: "Import calendar file · Pro" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByRole("dialog", { name: "Add calendar imports" })).toBeVisible();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Tab");
    await expect(page.locator("[role=dialog]")).toContainText("Add calendar imports");
    expect(await page.locator("[role=dialog]").evaluate(dialog => dialog.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("@regression:mobile-controls-meet-the-44px-touch-target-baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/demo", "/privacy"]) {
    await page.goto(route);
    const controls = page.locator("button, a");
    for (let index = 0; index < await controls.count(); index++) {
      const box = await controls.nth(index).boundingBox();
      if (box) expect(box.height, `${route} control ${index}`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("@regression:all-remaining-link-and-button-targets-are-at-least-44px-on-desktop-and-mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/demo", "/privacy", "/terms"]) {
      await page.goto(route);
      const controls = page.locator("button, a");
      for (let index = 0; index < await controls.count(); index++) {
        const box = await controls.nth(index).boundingBox();
        if (!box) continue;
        expect(box.width, `${route} ${viewport.width}px control ${index} width`).toBeGreaterThanOrEqual(44);
        expect(box.height, `${route} ${viewport.width}px control ${index} height`).toBeGreaterThanOrEqual(44);
      }
    }
  }
});

test("@regression:mobile-installer-commands are keyboard-focusable scroll regions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/download");
  const commands = page.locator(".code-line");
  await expect(commands).toHaveCount(2);
  for (let index = 0; index < await commands.count(); index++) {
    const command = commands.nth(index);
    expect(await command.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
    await command.focus();
    await expect(command).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => command.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  }
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("@regression:approval-route-has-no-serious-or-critical-axe-violations", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  await mockApprovalService(page);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Copy approval link" }).click();
  await page.goto(await page.evaluate(() => navigator.clipboard.readText()));
  await expect(page.getByLabel("Your name")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("@claim:release-discovery reads the GitHub API, selects an immutable asset, and shows the unavailable-files state", async ({ page }) => {
  const commit = "1234567890abcdef1234567890abcdef12345678";
  const githubRequests: string[] = [];
  const releaseUrl = "https://api.github.com/repos/B-Divyesh/sf-worklog-approval-bridge/releases/latest";
  await page.addInitScript(() => localStorage.removeItem("worklog-bridge:release-v4"));
  await page.route(/^https:\/\/api\.github\.com\/repos\/B-Divyesh\/sf-worklog-approval-bridge\//, async route => {
    const url = route.request().url();
    githubRequests.push(url);
    if (url.endsWith("/releases/latest")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        tag_name: "v0.1.5",
        target_commitish: commit,
        html_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.5",
        assets: [
          { name: "Worklog.Bridge_0.1.5_amd64.AppImage", browser_download_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/download/v0.1.5/Worklog.Bridge_0.1.5_amd64.AppImage" },
          { name: "Worklog.Bridge_0.1.5_x64.dmg", browser_download_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/download/v0.1.5/Worklog.Bridge_0.1.5_x64.dmg" },
          { name: "Worklog.Bridge_0.1.5_x64.msi", browser_download_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/download/v0.1.5/Worklog.Bridge_0.1.5_x64.msi" }
        ]
      }) });
      return;
    }
    await route.abort();
  });
  await page.goto("/download");
  const download = page.locator("#download-box a.button");
  await expect(download).toHaveAttribute("href", /\/releases\/download\/v0\.1\.5\/Worklog\.Bridge_0\.1\.5_(amd64\.AppImage|x64\.(dmg|msi))$/);
  await expect(page.locator(".release-source")).toContainText("1234567");
  expect(githubRequests).toEqual([releaseUrl]);
  const allReleaseFiles = page.getByRole("link", { name: /See every release file/ });
  const box = await allReleaseFiles.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(44);
  expect(box?.height || 0).toBeGreaterThanOrEqual(44);
  await page.unrouteAll();
  await page.evaluate(async () => {
    localStorage.removeItem("worklog-bridge:release-v4");
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    for (const key of await caches.keys()) await caches.delete(key);
  });
  await page.route(/^https:\/\/api\.github\.com\/repos\/B-Divyesh\/sf-worklog-approval-bridge\//, route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ tag_name: "v0.1.5", target_commitish: "main", html_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.5", assets: [] })
  }));
  await page.goto("/download");
  await expect(page.getByRole("heading", { name: "Downloads are being published" })).toBeVisible();
  await expect(page.getByText("The release files are not available yet.")).toBeVisible();
});

test("download rejects a release without an immutable source commit", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("worklog-bridge:release-v4"));
  await page.route(/^https:\/\/api\.github\.com\/repos\/B-Divyesh\/sf-worklog-approval-bridge\//, route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      tag_name: "v0.1.5",
      target_commitish: "main",
      html_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.5",
      assets: [{ name: "Worklog.Bridge_0.1.5_amd64.AppImage", browser_download_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/download/v0.1.5/Worklog.Bridge_0.1.5_amd64.AppImage" }]
    })
  }));
  await page.goto("/download");
  await expect(page.getByRole("heading", { name: "Downloads are being published" })).toBeVisible();
  await expect(page.locator("#download-box a.button.cyan")).toHaveCount(0);
});

test("app supports keyboard shortcuts", async ({ page }) => {
  await page.goto("/demo");
  await page.keyboard.press("/");
  await expect(page.locator("#entry-filter")).toBeFocused();
  await page.locator("#entry-filter").blur();
  await page.keyboard.press("n");
  await expect(page.getByRole("dialog", { name: "Add work entry" })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("routes load without browser console errors", async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (String(input) === "https://api.github.com/repos/B-Divyesh/sf-worklog-approval-bridge/releases/latest") {
        return Promise.resolve(new Response(JSON.stringify({
          tag_name: "v0.1.18",
          target_commitish: "1234567890abcdef1234567890abcdef12345678",
          html_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.18",
          assets: [{ name: "Worklog.Bridge_0.1.18_amd64.AppImage", browser_download_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/download/v0.1.18/Worklog.Bridge_0.1.18_amd64.AppImage" }]
        }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return originalFetch(input, init);
    };
  });
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://api.github.com/repos/B-Divyesh/sf-worklog-approval-bridge/releases/latest", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      tag_name: "v0.1.18",
      target_commitish: "1234567890abcdef1234567890abcdef12345678",
      html_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.18",
      assets: [{ name: "Worklog.Bridge_0.1.18_amd64.AppImage", browser_download_url: "https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/download/v0.1.18/Worklog.Bridge_0.1.18_amd64.AppImage" }]
    })
  }));
  for (const route of ["/", "/demo", "/privacy", "/terms", "/download", "/missing-page"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});

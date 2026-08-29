import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

type Receipt = { version: 2; receiptId: string; packetDigest: string; approver: string; acceptedAt: string; attestation: string };

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

test("@claim:offline-reload saved work remains available offline", async ({ page, context }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Review the weekly worklog" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Fixed patient search filters")).toBeVisible();
  await expect(page.getByText("You are offline. Saved work remains available.")).toBeVisible();
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

test("@claim:local-demo sends no worklog data to another origin", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const origins = new Set<string>();
  page.on("request", request => origins.add(new URL(request.url()).origin));
  await page.goto("/demo");
  await page.getByRole("button", { name: "Edit Investigated slow dashboard queries" }).click();
  await page.getByLabel("Client-ready summary").fill("Investigated dashboard query delay");
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  await expect(page.getByText("Copied the approval link. Send it only to the client.")).toBeVisible();
  expect([...origins]).toEqual(["http://127.0.0.1:4173"]);
});

test("@claim:worklog-details-local submits only digest and acceptance metadata", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
  const observed = { bodies: [] as unknown[] };
  await mockApprovalService(page, observed);
  await page.goto("/demo");
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
  await page.goto("/demo");
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
  await page.goto("/demo");
  await page.getByRole("button", { name: "Edit Investigated slow dashboard queries" }).click();
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

test("@claim:no-surveillance requests no capture permissions", async ({ page }) => {
  await page.addInitScript(() => {
    const counts = { userMedia: 0, displayMedia: 0 };
    Object.defineProperty(window, "__captureCounts", { value: counts });
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => { counts.userMedia++; throw new Error("blocked"); };
      if (navigator.mediaDevices.getDisplayMedia) navigator.mediaDevices.getDisplayMedia = async () => { counts.displayMedia++; throw new Error("blocked"); };
    }
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const counts = await page.evaluate(() => (window as unknown as { __captureCounts: { userMedia: number; displayMedia: number } }).__captureCounts);
  expect(counts).toEqual({ userMedia: 0, displayMedia: 0 });
});

test("@claim:calendar-import imports an ICS event", async ({ page }) => {
  await page.goto("/demo");
  await page.locator("#ics-file").setInputFiles({
    name: "client-calendar.ics",
    mimeType: "text/calendar",
    buffer: Buffer.from("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20260829T100000Z\r\nDTEND:20260829T113000Z\r\nSUMMARY:Client release planning\r\nDESCRIPTION:Review launch checklist\r\nEND:VEVENT\r\nEND:VCALENDAR")
  });
  await expect(page.getByText("Client release planning")).toBeVisible();
  const row = page.locator("[data-entry-id]", { hasText: "Client release planning" });
  await expect(row).toContainText("1h 30m");
  await expect(row).toContainText("Calendar");
});

test("@claim:license-unlock enables Pro after verification", async ({ page }) => {
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
});

test("landing and routes meet the semantic and serious accessibility baseline", async ({ page }) => {
  for (const route of ["/", "/demo", "/privacy", "/terms", "/download", "/missing-page"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/.+ — .+|Worklog Bridge — .+/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  }
});

test("mobile demo keeps its primary workflow visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Review the weekly worklog" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy approval link" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
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
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  for (const route of ["/", "/demo", "/privacy", "/terms", "/download", "/missing-page"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});

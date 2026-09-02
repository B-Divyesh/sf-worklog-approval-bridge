import { chromium } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const origin = "https://worklog-approval-bridge.sociobot.in";
const checks = [];
const assert = (condition, name, detail = "") => {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) throw new Error(`${name}: ${detail}`);
};

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on("request", request => requests.push({ method: request.method(), url: request.url(), type: request.resourceType() }));
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`page: ${error.message}`));

  const landing = await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  assert(landing?.status() === 200, "landing returns 200", String(landing?.status()));
  assert((await page.getByRole("heading", { level: 1 }).innerText()).toLowerCase().includes("approved worklog"), "first screen says what it does");
  assert((await page.getByText(/For freelancers who rebuild billable work/).count()) === 1, "first screen names its audience");
  const sample = page.getByRole("link", { name: "Try it with sample data" });
  assert(await sample.isVisible(), "one-click sample action is visible");
  await sample.click();
  await page.waitForLoadState("networkidle");
  assert(page.url().endsWith("/?demo=1"), "sample opens in one click", page.url());
  assert(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo boundary banner is persistent");
  assert(await page.locator("[data-entry-id]").count() === 6, "demo loads six realistic entries");

  const rate = page.getByLabel("Hourly rate");
  await rate.fill("-25");
  await rate.press("Tab");
  assert(await page.getByText("Hourly rate must be zero or more. The previous rate was kept.").isVisible(), "invalid negative rate explains recovery");
  assert(await rate.inputValue() === "135", "invalid rate restores prior value", await rate.inputValue());

  await page.getByRole("button", { name: "Edit Investigated slow dashboard queries" }).click();
  await page.getByLabel("Client-ready summary").fill("Reviewed dashboard query delay");
  await page.getByLabel("Minutes").fill("120");
  await page.getByRole("button", { name: "Save entry" }).click();
  assert(await page.getByText("Reviewed dashboard query delay").isVisible(), "edited narrative is saved");

  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csvDownload = await csvPromise;
  const csvStream = await csvDownload.createReadStream();
  let csv = "";
  for await (const chunk of csvStream) csv += chunk.toString();
  assert(csv.includes("Reviewed dashboard query delay"), "CSV contains reviewed narrative");
  assert(csv.trim().split("\n").length === 7, "CSV contains header plus six entries", String(csv.trim().split("\n").length));

  await page.getByRole("button", { name: "Copy approval link" }).click();
  const approvalUrl = await page.evaluate(() => navigator.clipboard.readText());
  assert(approvalUrl.includes("/approve?demo=1#"), "demo approval link stays in demo mode", approvalUrl);
  await page.goto(approvalUrl, { waitUntil: "networkidle" });
  await page.getByLabel("Your name").fill("Independent QA");
  await page.getByLabel("I reviewed these entries and accept this worklog.").check();
  await page.getByRole("button", { name: "Create demo receipt" }).click();
  assert(await page.getByText("Demo receipt created").isVisible(), "demo approval creates a receipt");
  const receiptPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  const receiptStream = await (await receiptPromise).createReadStream();
  let receiptText = "";
  for await (const chunk of receiptStream) receiptText += chunk.toString();
  const receipt = JSON.parse(receiptText);
  assert(receipt.attestation === "demo-only-local-receipt", "demo receipt is explicitly local", receipt.attestation);
  await page.getByRole("button", { name: "Reset demo" }).click();
  assert(await page.getByText("Investigated slow dashboard queries").isVisible(), "reset restores sample data");

  const storageKeys = await page.evaluate(() => Object.keys(localStorage).sort());
  const requestOrigins = [...new Set(requests.map(request => new URL(request.url).origin))];
  assert(requestOrigins.every(value => value === origin), "demo flow sends only same-origin requests", requestOrigins.join(", "));
  assert(!requests.some(request => new URL(request.url).pathname.startsWith("/api/approvals")), "demo never calls production approval API");
  assert(!requests.some(request => /analytics|doubleclick|googletag|facebook/i.test(request.url)), "demo sends no analytics or ad requests");
  assert(storageKeys.every(key => key.startsWith("demo:") || key.startsWith("worklog-bridge:release")), "demo storage stays namespaced", storageKeys.join(", "));
  assert(errors.length === 0, "main live flow has no console or page errors", errors.join(" | "));
  await page.screenshot({ path: ".factory/verification-24-evidence/live-demo-desktop.png", fullPage: true });
  await context.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const keyboardPage = await keyboardContext.newPage();
  await keyboardPage.goto(`${origin}/demo`, { waitUntil: "networkidle" });
  await keyboardPage.keyboard.press("Tab");
  const firstFocus = await keyboardPage.evaluate(() => ({
    text: document.activeElement?.textContent?.trim(),
    href: document.activeElement?.getAttribute("href"),
    outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
    outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
  }));
  assert(firstFocus.href === "#main", "keyboard starts on skip link", JSON.stringify(firstFocus));
  assert(firstFocus.outlineStyle !== "none" && Number.parseFloat(firstFocus.outlineWidth) >= 3, "focused skip link has a visible 3px outline", JSON.stringify(firstFocus));
  await keyboardPage.keyboard.press("Enter");
  assert(await keyboardPage.locator("#main").evaluate(node => node.contains(document.activeElement)), "skip link moves focus into main");
  await keyboardPage.keyboard.press("/");
  assert(await keyboardPage.locator("#entry-filter").evaluate(node => node === document.activeElement), "slash shortcut focuses filter");
  await keyboardPage.locator("#entry-filter").blur();
  await keyboardPage.keyboard.press("n");
  assert(await keyboardPage.getByRole("dialog", { name: "Add work entry" }).isVisible(), "keyboard shortcut opens entry dialog");
  await keyboardPage.keyboard.press("Escape");
  assert(await keyboardPage.getByRole("dialog").count() === 0, "Escape closes the dialog");
  await keyboardContext.close();

  const routeResults = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const routeContext = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const routePage = await routeContext.newPage();
    const routeErrors = [];
    let currentRoute = "";
    routePage.on("console", message => { if (message.type() === "error") routeErrors.push({ route: currentRoute, text: `console: ${message.text()}` }); });
    routePage.on("pageerror", error => routeErrors.push({ route: currentRoute, text: `page: ${error.message}` }));
    for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/download", "/missing-page"]) {
      currentRoute = route;
      const response = await routePage.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      const axe = await new AxeBuilder({ page: routePage }).analyze();
      const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
      const metrics = await routePage.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        lang: document.documentElement.lang,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        moving: document.getAnimations().filter(animation => animation.playState === "running").length,
        title: document.title,
      }));
      routeResults.push({ viewport: viewport.width, route, status: response?.status(), severeAxe: severe.map(v => v.id), ...metrics });
      assert(route === "/missing-page" ? response?.status() === 404 : response?.status() === 200, `${viewport.width}px ${route} returns expected status`, String(response?.status()));
      assert(metrics.h1 === 1 && metrics.main === 1 && metrics.lang === "en", `${viewport.width}px ${route} has semantic baseline`, JSON.stringify(metrics));
      assert(!metrics.overflow, `${viewport.width}px ${route} has no horizontal overflow`);
      assert(metrics.moving === 0, `${viewport.width}px ${route} respects reduced motion`, String(metrics.moving));
      assert(severe.length === 0, `${viewport.width}px ${route} has no serious/critical Axe findings`, severe.map(v => v.id).join(", "));
    }
    const unexpectedErrors = routeErrors.filter(error => !(error.route === "/missing-page" && /status of 404/.test(error.text)));
    routeResults.push({ viewport: viewport.width, routeErrors });
    assert(unexpectedErrors.length === 0, `${viewport.width}px route sweep has no unexpected console/page errors`, JSON.stringify(unexpectedErrors));
    if (viewport.width === 390) await routePage.screenshot({ path: ".factory/verification-24-evidence/live-mobile-last-route.png", fullPage: true });
    await routeContext.close();
  }

  await writeFile(".factory/verification-24-evidence/live-qa.json", JSON.stringify({ checks, requests, routeResults }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, requests: requests.length, requestOrigins, routeResults }, null, 2));
} finally {
  await browser.close();
}

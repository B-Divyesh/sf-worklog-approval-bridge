import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { assertCheckoutRedirect, assertM2Health, liveVerificationOptions } from "./verify-live-options.mjs";

const billingCheckout = "https://api.sociobot.in/api/v1/products/worklog-approval-bridge/checkout";
const { target, expectedCommit } = liveVerificationOptions(process.argv.slice(2));

async function verifyFrontendAssets() {
  const root = await fetch(`${target}/`);
  assert.equal(root.status, 200, "the live root must return the frontend shell");
  assert.match(root.headers.get("content-type") || "", /^text\/html\b/i, "the live root must be HTML");
  const pending = [...new Set((await root.text()).match(/\/assets\/[A-Za-z0-9._-]+\.(?:js|css)\b/g) || [])];
  const checked = new Set();

  while (pending.length) {
    const path = pending.shift();
    if (checked.has(path)) continue;
    checked.add(path);
    const response = await fetch(new URL(path, target));
    assert.equal(response.status, 200, `${path} must be served from the container's built assets directory`);
    const contentType = response.headers.get("content-type") || "";
    if (path.endsWith(".css")) assert.match(contentType, /^text\/css\b/i, `${path} must use a CSS MIME type`);
    else assert.match(contentType, /^(?:text|application)\/javascript\b/i, `${path} must use a JavaScript MIME type`);
    const body = await response.text();
    assert.ok(body.length > 0, `${path} must not be empty`);
    for (const match of body.matchAll(/(?:\/assets\/|\.\/)[A-Za-z0-9._-]+\.(?:js|css)\b/g)) {
      const nested = new URL(match[0], new URL(path, target)).pathname;
      if (!checked.has(nested)) pending.push(nested);
    }
  }

  assert.ok([...checked].some(path => path.endsWith(".js")), "the live shell must reference JavaScript");
  assert.ok([...checked].some(path => path.endsWith(".css")), "the live shell must reference CSS");
  return [...checked].sort();
}

const checkout = await fetch(billingCheckout, { redirect: "manual" });
assertCheckoutRedirect(checkout.status, checkout.headers.get("location"));

let healthBody;
for (const path of ["/health", "/api/health"]) {
  const health = await fetch(`${target}${path}`, { headers: { Accept: "application/json" } });
  assert.equal(health.status, 200, `${path} must expose the M2 public health/build identity`);
  const body = await health.json();
  assertM2Health(body, expectedCommit);
  healthBody ||= body;
  assert.deepEqual(body, healthBody, "both public health routes must identify the same build");
}

for (const route of [
  { path: "/api/v1/worklogs/current", method: "GET" },
  { path: "/api/v1/account/export", method: "GET" },
  { path: "/api/v1/account", method: "DELETE" },
  { path: "/api/v1/billing/verify", method: "POST", body: JSON.stringify({ license: "live-route-boundary" }) }
]) {
  const response = await fetch(`${target}${route.path}`, {
    method: route.method,
    body: route.body,
    headers: route.body ? { "Content-Type": "application/json" } : undefined
  });
  assert.equal(response.status, 401, `${route.method} ${route.path} must be the protected M2 route`);
  assert.equal(response.headers.get("www-authenticate"), "Bearer", `${route.path} must advertise bearer authentication`);
}
const frontendAssets = await verifyFrontendAssets();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const receiptLookupStatuses = [];
const demoRequests = [];
page.on("request", request => {
  if (new URL(page.url() || target).searchParams.get("demo") === "1") demoRequests.push(request.url());
});
page.on("response", response => {
  const url = new URL(response.url());
  if (url.origin === target && url.pathname === "/api/approvals" && response.request().method() === "GET") receiptLookupStatuses.push(response.status());
});

try {
  await page.goto(`${target}/demo`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Edit Investigated slow dashboard queries" }).click();
  await page.getByLabel("Client-ready summary").fill(`Live receipt check ${Date.now()}`);
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const approvalLink = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(approvalLink, /\/approve\?demo=1#/, "the live sample must create a demo-only approval link");
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(approvalLink, { waitUntil: "networkidle" });
  await assert.doesNotReject(() => page.getByRole("heading", { name: "Review this weekly worklog" }).waitFor());
  await assert.doesNotReject(() => page.getByText("Demo — sample data, nothing is saved").waitFor());
  await page.getByLabel("Your name").fill("Live Demo Reviewer");
  await page.getByLabel("I reviewed these entries and accept this worklog.").check();
  await page.getByRole("button", { name: "Create demo receipt" }).click();
  await assert.doesNotReject(() => page.getByText("Demo receipt created").waitFor());
  await page.reload({ waitUntil: "networkidle" });
  await assert.doesNotReject(() => page.getByText("Demo receipt created").waitFor());
  assert.equal(demoRequests.some(url => new URL(url).pathname.startsWith("/api/approvals")), false, "demo acceptance must not contact the approval API");
  assert.equal(demoRequests.every(url => new URL(url).origin === target), true, "the demo flow must remain same-origin");

  await page.goto(`${target}/app`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("worklog-bridge:project", JSON.stringify({ client: "Live verifier", week: "2026-08-24", rate: 80, currency: "USD", sources: [], entries: [{ id: "live", date: "2026-08-25", title: "Verify deployed approval", detail: "Live release check", source: "Manual", duration: 30, ready: true }] })));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Copy approval link" }).click();
  const realApprovalLink = await page.evaluate(() => navigator.clipboard.readText());
  assert.doesNotMatch(realApprovalLink, /[?&]demo=1/, "a real workspace must not create a demo link");
  await page.goto(realApprovalLink, { waitUntil: "networkidle" });
  await assert.doesNotReject(() => page.getByRole("heading", { name: "Review this weekly worklog" }).waitFor());
  assert.equal(await page.getByRole("button", { name: "Accept and record receipt" }).isEnabled(), true);
  assert.deepEqual(receiptLookupStatuses, [204], "a new approval packet must receive the successful empty receipt response");
  assert.deepEqual(errors, [], "a new approval link must not log a browser error while it checks for a receipt");

  const missing = await page.goto(`${target}/missing-page`, { waitUntil: "domcontentloaded" });
  assert.equal(missing?.status(), 404, "unknown live routes must retain HTTP 404");
  await assert.doesNotReject(() => page.getByRole("heading", { name: "Page not found" }).waitFor());
  console.log(`Live checkout, both health identities, protected M2 routes, ${frontendAssets.length} frontend assets, isolated demo, real approval lookup, and routing passed for ${target}`);
} finally {
  await browser.close();
}

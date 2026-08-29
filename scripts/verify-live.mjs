import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { assertDeployedCommit, liveVerificationOptions } from "./verify-live-options.mjs";

const billingCheckout = "https://api.sociobot.in/api/v1/products/worklog-approval-bridge/checkout";
const { target, expectedCommit } = liveVerificationOptions(process.argv.slice(2));

const checkout = await fetch(billingCheckout, { redirect: "manual" });
assert.equal(checkout.status, 303, "the advertised Pro checkout must redirect to hosted checkout, not return 404");
assert.match(checkout.headers.get("location") || "", /^https:\/\/checkout\.dodopayments\.com\//, "checkout redirect must use the hosted Dodo checkout");

const health = await fetch(`${target}/api/health`, { headers: { Accept: "application/json" } });
assert.equal(health.status, 200, "the receipt API must expose a public health/build identity");
const healthBody = await health.json();
assert.equal(healthBody.status, "ok");
assert.equal(healthBody.build?.service, "worklog-approval-bridge-receipts");
assert.match(healthBody.build?.version || "", /^\d+\.\d+\.\d+$/);
assert.match(healthBody.build?.commit || "", /^[a-f0-9]{7,64}$/);
assertDeployedCommit(healthBody.build.commit, expectedCommit);

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
  console.log(`Live checkout, API identity, isolated demo, real approval lookup, and routing passed for ${target}`);
} finally {
  await browser.close();
}

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
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(approvalLink, { waitUntil: "networkidle" });
  await assert.doesNotReject(() => page.getByRole("heading", { name: "Review this weekly worklog" }).waitFor());
  assert.equal(await page.getByRole("button", { name: "Accept and record receipt" }).isEnabled(), true);
  assert.deepEqual(receiptLookupStatuses, [204], "a new approval packet must receive the successful empty receipt response");
  assert.deepEqual(errors, [], "a new approval link must not log a browser error while it checks for a receipt");

  const missing = await page.goto(`${target}/missing-page`, { waitUntil: "domcontentloaded" });
  assert.equal(missing?.status(), 404, "unknown live routes must retain HTTP 404");
  await assert.doesNotReject(() => page.getByRole("heading", { name: "This page is not on the worklog" }).waitFor());
  console.log(`Live checkout, API identity, routing, and approval regressions passed for ${target}`);
} finally {
  await browser.close();
}

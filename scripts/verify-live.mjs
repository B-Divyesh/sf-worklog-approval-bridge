import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const target = (process.env.LIVE_URL || "https://worklog-approval-bridge.sociobot.in").replace(/\/$/, "");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();

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
  assert.deepEqual(errors, [], "a new approval link must not log a browser error while it checks for a receipt");

  const missing = await page.goto(`${target}/missing-page`, { waitUntil: "domcontentloaded" });
  assert.equal(missing?.status(), 404, "unknown live routes must retain HTTP 404");
  await assert.doesNotReject(() => page.getByRole("heading", { name: "This page is not on the worklog" }).waitFor());
  console.log(`Live routing and approval regressions passed for ${target}`);
} finally {
  await browser.close();
}

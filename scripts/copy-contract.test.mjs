import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("@regression:review-5 keeps README privacy and account copy in plain words", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  for (const jargon of [
    /Sociobot CIAM/i,
    /Entra `oid`/i,
    /\bCIAM discovery\b/i,
    /\bJWKS\b/i,
    /\blicense verdicts?\b/i,
    /\bURL fragments?\b/i,
    /\bapproval payloads?\b/i,
    /\battestation\b/i
  ]) {
    assert.doesNotMatch(readme, jargon);
  }

  for (const sentence of [
    "Select **Sign in** in the app to use your Sociobot account.",
    "Account backup links the saved worklog to your stable Sociobot account ID, not your email address.",
    "For signed-in accounts, the server stores a one-way token hash and whether the license was valid.",
    "Client addresses used for rate limits are stored only as one-way hashes.",
    "Approval links put worklog details after the `#`, so browsers do not send them to the server.",
    "The receipt service stores only a worklog identifier, name, server time, receipt ID, and signature."
  ]) {
    assert.ok(readme.includes(sentence), `missing required plain-language sentence: ${sentence}`);
  }
});

test("@regression:catalog-description is verb-first and no longer than 120 characters", async () => {
  const description = (await readFile(new URL("../.factory/catalog-description.txt", import.meta.url), "utf8")).trim();
  assert.match(description, /^Turn\b/);
  assert.ok(description.length <= 120, `catalog description is ${description.length} characters`);
  assert.doesNotMatch(description, /seamless|effortless|robust|powerful|intuitive|reimagine|supercharge|delightful|journey|ecosystem/i);
});

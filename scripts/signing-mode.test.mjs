import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { signingMode, signingSecrets } from "./signing-mode.mjs";

test("@regression:verification-13 release signing has an explicit unsigned fallback and rejects partial credentials", async () => {
  assert.deepEqual(signingMode("macos", {}), { enabled: false, missing: signingSecrets.macos });
  assert.deepEqual(signingMode("windows", {}), { enabled: false, missing: signingSecrets.windows });
  assert.equal(signingMode("macos", Object.fromEntries(signingSecrets.macos.map(name => [name, "configured"]))).enabled, true);
  assert.equal(signingMode("windows", Object.fromEntries(signingSecrets.windows.map(name => [name, "configured"]))).enabled, true);
  assert.throws(() => signingMode("macos", { APPLE_CERTIFICATE: "configured" }), /signing is partly configured.*APPLE_CERTIFICATE_PASSWORD/);
  assert.throws(() => signingMode("windows", { WINDOWS_CERT_PFX: "configured" }), /signing is partly configured.*WINDOWS_CERT_PASSWORD/);

  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.match(workflow, /id: macos-signing[\s\S]*node scripts\/signing-mode\.mjs macos/);
  assert.match(workflow, /if: startsWith\(matrix\.os, 'macos'\) && steps\.macos-signing\.outputs\.enabled == 'true'/);
  assert.match(workflow, /id: windows-signing[\s\S]*node scripts\/signing-mode\.mjs windows/);
  assert.match(workflow, /if: startsWith\(matrix\.os, 'windows'\) && steps\.windows-signing\.outputs\.enabled == 'true'/);
});

test("@regression:verification-13 documents every optional signing secret and unsigned release behavior", async () => {
  const [readme, handoff] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../.factory/handoff.md", import.meta.url), "utf8")
  ]);
  for (const name of [...signingSecrets.macos, ...signingSecrets.windows]) {
    assert.match(readme, new RegExp(`\\b${name}\\b`), `README must name ${name}`);
    assert.match(handoff, new RegExp(`\\b${name}\\b`), `handoff must name ${name}`);
  }
  for (const document of [readme, handoff]) {
    assert.match(document, /unsigned preview/i);
    assert.match(document, /partly configured/i);
  }
});

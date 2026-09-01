import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { signingMode, signingModeMessage, signingSecrets } from "./signing-mode.mjs";

test("@claim:release-signing-mode keeps unsigned previews explicit and rejects partial signing credentials", async () => {
  const macosCredentials = Object.fromEntries(signingSecrets.macos.map(name => [name, "configured"]));
  const windowsCredentials = Object.fromEntries(signingSecrets.windows.map(name => [name, "configured"]));
  assert.deepEqual(signingMode("macos", macosCredentials), { enabled: false, missing: [] }, "ambient secrets must not sign a tag release");
  assert.deepEqual(signingMode("windows", windowsCredentials), { enabled: false, missing: [] }, "ambient secrets must not sign a tag release");
  assert.deepEqual(signingMode("macos", { APPLE_CERTIFICATE: "configured" }), { enabled: false, missing: [] }, "an unsigned release must also ignore partial ambient secrets");
  assert.equal(signingMode("macos", macosCredentials, true).enabled, true);
  assert.equal(signingMode("windows", windowsCredentials, true).enabled, true);
  assert.throws(() => signingMode("macos", { APPLE_CERTIFICATE: "configured" }, true), /signing was requested but is partly configured.*APPLE_CERTIFICATE_PASSWORD/);
  assert.throws(() => signingMode("windows", { WINDOWS_CERT_PFX: "configured" }, true), /signing was requested but is partly configured.*WINDOWS_CERT_PASSWORD/);

  const [workflow, main, readme] = await Promise.all([
    readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8"),
    readFile(new URL("../src/main.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8")
  ]);
  assert.match(workflow, /sign_release:[\s\S]*type: boolean[\s\S]*default: false/);
  assert.match(workflow, /Operator gate: require complete credentials and verify signed packages/);
  assert.match(workflow, /id: macos-signing[\s\S]*node scripts\/signing-mode\.mjs macos/);
  assert.match(workflow, /if: startsWith\(matrix\.os, 'macos'\) && steps\.macos-signing\.outputs\.enabled == 'true'/);
  assert.match(workflow, /id: windows-signing[\s\S]*node scripts\/signing-mode\.mjs windows/);
  assert.match(workflow, /if: startsWith\(matrix\.os, 'windows'\) && steps\.windows-signing\.outputs\.enabled == 'true'/);
  const unsignedBuild = workflow.match(/- name: Build unsigned Tauri bundles([\s\S]*?)- name: Build signed macOS bundles/)?.[1] || "";
  assert.match(unsignedBuild, /macos-signing\.outputs\.enabled != 'true'/);
  assert.doesNotMatch(unsignedBuild, /APPLE_/, "empty APPLE_* variables still make Tauri attempt certificate import");

  assert.match(signingModeMessage("macos", signingMode("macos", macosCredentials), false), /optional and was not requested.*unsigned preview/i);
  assert.match(signingModeMessage("windows", signingMode("windows", windowsCredentials, true), true), /was requested and every required credential is present/i);
  assert.match(main, /Unsigned desktop packages · macOS and Windows may show a trust warning\./);
  assert.match(readme, /macOS and Windows download packages are unsigned previews/i);
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
  for (const [name, document] of [["README", readme], ["handoff", handoff]]) {
    const compact = document.replace(/\s+/g, " ");
    assert.match(compact, /Desktop signing is an operator-gated release action\./i, `${name} must identify the operator gate`);
    assert.match(compact, /Tags and manual runs.*sign_release.*false.*unsigned preview packages/i, `${name} must document unsigned package behavior`);
    assert.match(compact, /operator requests signed packages.*sign_release.*true.*every platform credential/i, `${name} must document the complete signing requirement`);
    assert.match(compact, /missing signing credential stops packaging/i, `${name} must document the requested-signing failure mode`);
    assert.match(compact, /verify.*macOS signatures.*notarization tickets.*Windows signatures.*before publication/i, `${name} must document signature verification`);
    assert.match(compact, /verifies the source commit and package checksums/i, `${name} must keep provenance checks explicit`);
  }
});

test("@regression:verification-21 keeps the signing contract in a dedicated handoff section", async () => {
  const handoff = await readFile(new URL("../.factory/handoff.md", import.meta.url), "utf8");
  const section = handoff.match(/^## Release signing contract\s*$[\s\S]*?(?=^#{1,2}\s|(?![\s\S]))/m)?.[0];
  assert.ok(section, "handoff must keep a dedicated Release signing contract section");

  for (const name of [...signingSecrets.macos, ...signingSecrets.windows]) {
    assert.match(section, new RegExp(`\\b${name}\\b`), `release signing section must name ${name}`);
  }

  const compact = section.replace(/\s+/g, " ");
  assert.match(compact, /Desktop signing is an operator-gated release action\./i);
  assert.match(compact, /Tags and manual runs.*sign_release.*false.*unsigned preview packages/i);
  assert.match(compact, /operator requests signed packages.*sign_release.*true.*every platform credential/i);
  assert.match(compact, /missing signing credential stops packaging/i);
  assert.match(compact, /verify.*macOS signatures.*notarization tickets.*Windows signatures.*before publication/i);
  assert.match(compact, /verifies the source commit and package checksums/i);
});

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createReleaseManifest } from "./release-manifest.mjs";
import { validateRelease } from "./verify-release.mjs";

const repairedCommit = "b4be2aa3a0f57a2020748be55cf3a4f6cb28c956";
const staleCommit = "ae2c0d8e8e28210d5423bb8ae82b20d8d99c0daa";

test("@claim:release-provenance binds every required desktop platform to the tagged source commit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "worklog-release-"));
  try {
    for (const name of ["Worklog.Bridge_aarch64.dmg", "Worklog.Bridge_x64.dmg", "Worklog.Bridge_x64.msi", "Worklog.Bridge_amd64.AppImage", "Worklog.Bridge_amd64.deb"]) {
      await writeFile(join(directory, name), `fixture:${name}`);
    }
    const manifest = await createReleaseManifest(directory, "v0.1.4", repairedCommit, "B-Divyesh/sf-worklog-approval-bridge");
    const sums = await readFile(join(directory, "SHA256SUMS"), "utf8");
    const release = { tag_name: "v0.1.4", assets: [...manifest.files.map(file => ({ name: file.name })), { name: "latest.json" }, { name: "SHA256SUMS" }] };
    validateRelease(release, manifest, sums, repairedCommit, repairedCommit);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("regression: stale desktop release cannot represent a repaired candidate", () => {
  const staleManifest = { version: "0.1.3", tag: "v0.1.3", commit: staleCommit, files: [] };
  assert.throws(
    () => validateRelease({ tag_name: "v0.1.3", assets: [] }, staleManifest, "", staleCommit, repairedCommit),
    /latest release is not built from the expected repaired commit/
  );
});

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createBuildProvenance } from "./build-provenance.mjs";
import { createReleaseManifest } from "./release-manifest.mjs";
import { validateRelease } from "./verify-release.mjs";

const repairedCommit = "b4be2aa3a0f57a2020748be55cf3a4f6cb28c956";
const staleCommit = "ae2c0d8e8e28210d5423bb8ae82b20d8d99c0daa";

test("@claim:release-provenance binds every required desktop platform to the tagged source commit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "worklog-release-"));
  try {
    const fixtures = ["Worklog.Bridge_aarch64.dmg", "Worklog.Bridge_x64.dmg", "Worklog.Bridge_x64.msi", "Worklog.Bridge_amd64.AppImage", "Worklog.Bridge_amd64.deb"];
    for (const name of fixtures) {
      await writeFile(join(directory, name), `fixture:${name}`);
    }
    for (const [label, matcher] of [["macos-arm64", /aarch64/], ["macos-x64", /x64\.dmg/], ["windows-x64", /\.msi/], ["linux-x64", /\.(?:AppImage|deb)$/]]) {
      const platformDirectory = await mkdtemp(join(tmpdir(), `worklog-${label}-`));
      for (const name of fixtures.filter(name => matcher.test(name))) await writeFile(join(platformDirectory, name), `fixture:${name}`);
      await createBuildProvenance(platformDirectory, label, repairedCommit, join(directory, `provenance-${label}.json`));
      await rm(platformDirectory, { recursive: true, force: true });
    }
    const manifest = await createReleaseManifest(directory, "v0.1.4", repairedCommit, "B-Divyesh/sf-worklog-approval-bridge");
    const sums = await readFile(join(directory, "SHA256SUMS"), "utf8");
    const release = { tag_name: "v0.1.4", assets: [...manifest.files.map(file => ({ name: file.name })), { name: "latest.json" }, { name: "SHA256SUMS" }] };
    validateRelease(release, manifest, sums, repairedCommit, repairedCommit);
    const staleFileManifest = structuredClone(manifest);
    staleFileManifest.files[0].commit = staleCommit;
    assert.throws(
      () => validateRelease(release, staleFileManifest, sums, repairedCommit, repairedCommit),
      /was not built from the nominated candidate/
    );
    assert.throws(
      () => validateRelease({ ...release, assets: [...release.assets, { name: "untracked-setup.exe" }] }, manifest, sums, repairedCommit, repairedCommit),
      /latest\.json must cover every downloadable desktop artifact/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("regression: one stale matrix artifact blocks the whole release", async () => {
  const directory = await mkdtemp(join(tmpdir(), "worklog-stale-matrix-"));
  try {
    const fixtures = {
      "macos-arm64": ["Worklog.Bridge_aarch64.dmg"],
      "macos-x64": ["Worklog.Bridge_x64.dmg"],
      "windows-x64": ["Worklog.Bridge_x64.msi"],
      "linux-x64": ["Worklog.Bridge_amd64.AppImage", "Worklog.Bridge_amd64.deb"]
    };
    for (const [label, names] of Object.entries(fixtures)) {
      const platformDirectory = await mkdtemp(join(tmpdir(), `worklog-${label}-`));
      for (const name of names) {
        await writeFile(join(directory, name), `fixture:${name}`);
        await writeFile(join(platformDirectory, name), `fixture:${name}`);
      }
      await createBuildProvenance(platformDirectory, label, label === "windows-x64" ? staleCommit : repairedCommit, join(directory, `provenance-${label}.json`));
      await rm(platformDirectory, { recursive: true, force: true });
    }
    await assert.rejects(
      createReleaseManifest(directory, "v0.1.4", repairedCommit, "B-Divyesh/sf-worklog-approval-bridge"),
      /provenance-windows-x64\.json was built from .* expected/
    );
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

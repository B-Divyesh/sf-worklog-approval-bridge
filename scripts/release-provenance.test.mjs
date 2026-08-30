import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createBuildProvenance } from "./build-provenance.mjs";
import { createReleaseManifest } from "./release-manifest.mjs";
import { validateRelease } from "./verify-release.mjs";
import { assertDeployedCommit } from "./verify-live-options.mjs";
import { assertCandidateReady } from "./verify-delivery.mjs";

const repairedCommit = "b4be2aa3a0f57a2020748be55cf3a4f6cb28c956";
const staleCommit = "ae2c0d8e8e28210d5423bb8ae82b20d8d99c0daa";
const verificationTenCandidate = "170cfd8be5590896b01bd8f86004844d0c8905ac";
const verificationTenPredecessor = "44694c0b6dc7ba9728c4d5dd219aa5a155104aeb";
const verificationElevenCandidate = "6bb3669a456dec38d89faf3b7354e5ba07f743ac";
const verificationElevenPredecessor = "f0e8f881e89886ef2d7a7298a680925b1170f6a1";
const verificationThirteenCandidate = "183842c6d6ca3ad9cabdc1df1a4d275db09ccaec";
const verificationThirteenPredecessor = "1c21a77c5cdb5a7d8ab0114f2e839753cdc9a5f3";
const verificationFourteenCandidate = "2ea2ddabf31be2b04b9904d33c21f2d3d81a2534";
const verificationFourteenPredecessor = "f00442c1f996be82a19a067bbba42f987f77eca1";
const verificationSeventeenCandidate = "66184860155071a3413c71f8c9f67391e2a2a922";
const verificationSeventeenPredecessor = "47a2c6b969886cd9033c288354a0d2f1aee6b32c";

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
    const release = { tag_name: "v0.1.4", target_commitish: repairedCommit, assets: [...manifest.files.map(file => ({ name: file.name })), { name: "latest.json" }, { name: "SHA256SUMS" }] };
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
    () => validateRelease({ tag_name: "v0.1.3", target_commitish: staleCommit, assets: [] }, staleManifest, "", staleCommit, repairedCommit),
    /latest release is not built from the expected repaired commit/
  );
});

test("@regression:verification-10 rejects the exact live and release predecessor for its nominated candidate", () => {
  assert.throws(
    () => assertDeployedCommit(verificationTenPredecessor, verificationTenCandidate),
    /deployed API commit differs from the nominated repair commit/
  );
  const staleManifest = { version: "0.1.9", tag: "v0.1.9", commit: verificationTenPredecessor, files: [] };
  assert.throws(
    () => validateRelease({ tag_name: "v0.1.9", target_commitish: verificationTenPredecessor, assets: [] }, staleManifest, "", verificationTenPredecessor, verificationTenCandidate),
    /latest release is not built from the expected repaired commit/
  );
});

test("@regression:verification-11 rejects the exact live and release predecessor for its nominated candidate", () => {
  assert.throws(
    () => assertDeployedCommit(verificationElevenPredecessor, verificationElevenCandidate),
    /deployed API commit differs from the nominated repair commit/
  );
  const staleManifest = { version: "0.1.11", tag: "v0.1.11", commit: verificationElevenPredecessor, files: [] };
  assert.throws(
    () => validateRelease({ tag_name: "v0.1.11", target_commitish: verificationElevenPredecessor, assets: [] }, staleManifest, "", verificationElevenPredecessor, verificationElevenCandidate),
    /latest release is not built from the expected repaired commit/
  );
});

test("@regression:verification-13 rejects the exact deployed and released predecessor for its nominated candidate", () => {
  assert.throws(
    () => assertDeployedCommit(verificationThirteenPredecessor, verificationThirteenCandidate),
    /deployed API commit differs from the nominated repair commit/
  );
  const staleManifest = { version: "0.1.13", tag: "v0.1.13", commit: verificationThirteenPredecessor, files: [] };
  assert.throws(
    () => validateRelease({ tag_name: "v0.1.13", target_commitish: verificationThirteenPredecessor, assets: [] }, staleManifest, "", verificationThirteenPredecessor, verificationThirteenCandidate),
    /latest release is not built from the expected repaired commit/
  );
});

test("@regression:verification-14 rejects the exact deployed and released predecessor for its nominated candidate", () => {
  assert.throws(
    () => assertDeployedCommit(verificationFourteenPredecessor, verificationFourteenCandidate),
    /deployed API commit differs from the nominated repair commit/
  );
  const staleManifest = { version: "0.1.16", tag: "v0.1.16", commit: verificationFourteenPredecessor, files: [] };
  assert.throws(
    () => validateRelease({ tag_name: "v0.1.16", target_commitish: verificationFourteenPredecessor, assets: [] }, staleManifest, "", verificationFourteenPredecessor, verificationFourteenCandidate),
    /latest release is not built from the expected repaired commit/
  );
});

test("@regression:verification-17 rejects the exact deployed and released predecessor for its nominated candidate", () => {
  assert.throws(
    () => assertDeployedCommit(verificationSeventeenPredecessor, verificationSeventeenCandidate),
    /deployed API commit differs from the nominated repair commit/
  );
  const staleManifest = { version: "0.1.21", tag: "v0.1.21", commit: verificationSeventeenPredecessor, files: [] };
  assert.throws(
    () => validateRelease({ tag_name: "v0.1.21", target_commitish: verificationSeventeenPredecessor, assets: [] }, staleManifest, "", verificationSeventeenPredecessor, verificationSeventeenCandidate),
    /latest release is not built from the expected repaired commit/
  );
});

test("@regression:verification-17 delivery gate requires a clean, version-matched candidate", () => {
  assert.deepEqual(
    assertCandidateReady({ commit: verificationSeventeenCandidate, status: "", version: "0.1.22", tag: "v0.1.22" }),
    { commit: verificationSeventeenCandidate, tag: "v0.1.22" }
  );
  assert.throws(
    () => assertCandidateReady({ commit: verificationSeventeenCandidate, status: " M .factory/handoff.md", version: "0.1.22", tag: "v0.1.22" }),
    /commit every repair and handoff change/
  );
  assert.throws(
    () => assertCandidateReady({ commit: verificationSeventeenCandidate, status: "", version: "0.1.22", tag: "v0.1.21" }),
    /delivery tag must match/
  );
});

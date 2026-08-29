import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { patchGtkPlugin } from "./linuxdeploy-plugin.mjs";

test("@regression:ci-one-desktop-build normalises CI=1 before invoking Tauri", async () => {
  const source = await readFile(new URL("./build-desktop.mjs", import.meta.url), "utf8");
  assert.match(source, /process\.env\.CI === "1"\) process\.env\.CI = "true"/);
  assert.match(source, /patchGtkPlugin/);
  assert.match(source, /APPIMAGE_EXTRACT_AND_RUN/);
  assert.match(source, /shell: process\.platform === "win32"/);
});

test("@regression:appimage-linuxdeploy-plugin adds the required type probe to a partially patched cache", () => {
  const stale = `case "$1" in
        --plugin-api-version)
            echo "0"
            exit 0
            ;;
        --appdir)
            APPDIR="$2"
            ;;
    esac`;
  const patched = patchGtkPlugin(stale);
  assert.match(patched, /--plugin-type\)\s*\n\s*echo "input"\s*\n\s*exit 0\s*\n\s*;;/);
  assert.equal(patchGtkPlugin(patched), patched, "the cache patch is idempotent");
});

test("@regression:appimage-linuxdeploy-ci-installs-file-command", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.match(workflow, /apt-get install -y file\s+libwebkit2gtk-4\.1-dev/);
  assert.doesNotMatch(workflow, /prerelease:\s*true/);
  assert.match(workflow, /source_commit:/);
  assert.match(workflow, /inputs\.source_commit \|\| github\.sha/);
  assert.match(workflow, /build-provenance\.mjs/);
  assert.match(workflow, /target_commitish:/);
});

test("@regression:versioned-service-worker derives a release-specific cache name", async () => {
  const [worker, postbuild] = await Promise.all([
    readFile(new URL("../public/service-worker.js", import.meta.url), "utf8"),
    readFile(new URL("./postbuild.mjs", import.meta.url), "utf8")
  ]);
  assert.match(worker, /worklog-bridge-__BUILD_ID__/);
  assert.match(postbuild, /createHash\("sha256"\).*index\.html/s);
  assert.match(postbuild, /worker\.replace\("__BUILD_ID__", buildId\)/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("@regression:ci-one-desktop-build normalises CI=1 before invoking Tauri", async () => {
  const source = await readFile(new URL("./build-desktop.mjs", import.meta.url), "utf8");
  assert.match(source, /process\.env\.CI === "1"\) process\.env\.CI = "true"/);
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

import assert from "node:assert/strict";
import test from "node:test";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { linuxBundleRoot, requestedLinuxBundles, verifyLinuxDesktopArtifacts } from "./desktop-artifacts.mjs";
import { prepareDesktopBuildEnvironment } from "./desktop-build-env.mjs";
import { patchGtkPlugin } from "./linuxdeploy-plugin.mjs";

test("@regression:ci-one-desktop-build normalises CI=1 before invoking Tauri", async () => {
  const [source, environment] = await Promise.all([
    readFile(new URL("./build-desktop.mjs", import.meta.url), "utf8"),
    readFile(new URL("./desktop-build-env.mjs", import.meta.url), "utf8")
  ]);
  assert.match(source, /process\.env\.CI === "1"\) process\.env\.CI = "true"/);
  assert.match(source, /patchGtkPlugin/);
  assert.match(source, /await patchCachedGtkPlugin\(\)/);
  assert.match(source, /exitCode !== 0 && process\.platform === "linux"/);
  assert.match(environment, /APPIMAGE_EXTRACT_AND_RUN/);
  assert.match(source, /shell: process\.platform === "win32"/);
  assert.match(source, /\["tauri", "build", "--features", "desktop"/);
  assert.match(source, /verifyLinuxDesktopArtifacts/);
});

test("@claim:clean-worker-packaging supplies appimagetool's file probe when the worker has none", async () => {
  const root = await mkdtemp(join(tmpdir(), "worklog-file-probe-test-"));
  const env = { PATH: "", WORKLOG_FORCE_FILE_SHIM: "0" };
  const prepared = await prepareDesktopBuildEnvironment({ env, platform: "linux", temporaryRoot: root });
  try {
    assert.equal(prepared.usedFileShim, true);
    assert.equal(env.APPIMAGE_EXTRACT_AND_RUN, "1");
    const result = spawnSync("file", ["anything"], { env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  } finally {
    await prepared.cleanup();
    await rm(root, { recursive: true, force: true });
  }
});

test("@regression:verification-23 release CI forces the clean-worker AppImage fallback", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  const config = JSON.parse(await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
  assert.match(workflow, /WORKLOG_FORCE_FILE_SHIM:\s*\$\{\{ startsWith\(matrix\.os, 'ubuntu'\)/);
  assert.equal(config.bundle.useLocalToolsDir, true);
});

test("@regression:verification-23 requires an executable AppImage runtime while preserving DEB and RPM", async () => {
  const root = await mkdtemp(join(tmpdir(), "worklog-bundle-contract-test-"));
  const signatures = {
    appimage: Buffer.from([0x7f, 0x45, 0x4c, 0x46]),
    deb: Buffer.from("!<arch>\n"),
    rpm: Buffer.from([0xed, 0xab, 0xee, 0xdb])
  };
  const probed = [];
  const appImageProbe = async artifact => { probed.push(artifact); };
  try {
    for (const [kind, signature] of Object.entries(signatures)) {
      await mkdir(join(root, kind), { recursive: true });
      const artifact = join(root, kind, `worklog.${kind === "appimage" ? "AppImage" : kind}`);
      await writeFile(artifact, Buffer.concat([signature, Buffer.alloc(2048)]));
      await chmod(artifact, 0o755);
    }
    assert.deepEqual(requestedLinuxBundles([]), ["appimage", "deb", "rpm"]);
    assert.match(linuxBundleRoot(["--target", "x86_64-unknown-linux-gnu"], "/repo"), /x86_64-unknown-linux-gnu/);
    assert.equal((await verifyLinuxDesktopArtifacts({
      bundleRoot: root,
      bundles: requestedLinuxBundles([]),
      appImageProbe
    })).length, 3);
    assert.deepEqual(probed, [join(root, "appimage", "worklog.AppImage")]);

    await chmod(join(root, "appimage", "worklog.AppImage"), 0o644);
    await assert.rejects(
      verifyLinuxDesktopArtifacts({ bundleRoot: root, bundles: ["appimage"], appImageProbe }),
      /AppImage is not executable/
    );
    await chmod(join(root, "appimage", "worklog.AppImage"), 0o755);

    let nonAppImageProbeCalled = false;
    assert.equal((await verifyLinuxDesktopArtifacts({
      bundleRoot: root,
      bundles: ["deb", "rpm"],
      appImageProbe: async () => { nonAppImageProbeCalled = true; }
    })).length, 2);
    assert.equal(nonAppImageProbeCalled, false, "DEB and RPM must not execute the AppImage probe");

    await rm(join(root, "appimage"), { recursive: true });
    await assert.rejects(
      verifyLinuxDesktopArtifacts({ bundleRoot: root, bundles: requestedLinuxBundles([]), appImageProbe }),
      /Expected one fresh \.AppImage/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("@regression:verification-14 native claims compile without Tauri platform libraries", async () => {
  const [cargo, lib, main] = await Promise.all([
    readFile(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8"),
    readFile(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8"),
    readFile(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8")
  ]);
  assert.match(cargo, /\[features\][\s\S]*desktop = \["dep:tauri", "dep:tauri-build"\]/);
  assert.match(cargo, /tauri = \{ version = "2", optional = true, features = \[\] \}/);
  assert.match(cargo, /tauri-build = \{ version = "2", optional = true, features = \[\] \}/);
  assert.match(await readFile(new URL("../src-tauri/build.rs", import.meta.url), "utf8"), /#\[cfg\(feature = "desktop"\)\]/);
  assert.match(lib, /#\[cfg\(feature = "desktop"\)\]\n#\[tauri::command\]/);
  assert.match(main, /#\[cfg\(not\(feature = "desktop"\)\)\]/);
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

test("@regression:appimage-linuxdeploy-ci-installs-required-packaging-commands", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.match(workflow, /apt-get install -y file\s+libwebkit2gtk-4\.1-dev[^\n]*\brpm\b/);
  assert.match(workflow, /-name '\*\.rpm'/);
  assert.doesNotMatch(workflow, /prerelease:\s*true/);
  assert.match(workflow, /source_commit:/);
  assert.match(workflow, /source_commit:\s*\n\s*description: Full immutable source commit to package and release\s*\n\s*required: true/);
  assert.match(workflow, /inputs\.source_commit \|\| github\.sha/);
  assert.match(workflow, /build-provenance\.mjs/);
  assert.match(workflow, /target_commitish:\s*\$\{\{ steps\.source\.outputs\.commit \}\}/);
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

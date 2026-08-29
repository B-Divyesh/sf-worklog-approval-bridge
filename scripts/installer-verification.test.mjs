import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

const installer = new URL("../public/install.sh", import.meta.url);
const assetName = "worklog-bridge.AppImage";
const assetBytes = "Worklog Bridge installer regression fixture\n";
const assetHash = createHash("sha256").update(assetBytes).digest("hex");

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", code => resolve({ code, stdout, stderr }));
  });
}

async function makeFixture(checksum) {
  const root = await mkdtemp(join(tmpdir(), "worklog-bridge-installer-"));
  const bin = join(root, "bin");
  const curl = join(bin, "curl");
  await mkdir(bin);
  await writeFile(curl, `#!/bin/sh
set -eu
out=""
url=""
need_out=0
for arg in "$@"; do
  if [ "$need_out" = 1 ]; then out="$arg"; need_out=0; continue; fi
  if [ "$arg" = "-o" ]; then need_out=1; continue; fi
  case "$arg" in http://*|https://*) url="$arg" ;; esac
done
if [ -z "$out" ]; then
  printf '%s' '{"assets":[{"browser_download_url":"https://downloads.test/${assetName}"}]}'
elif [ "\${url##*/}" = "SHA256SUMS" ]; then
  printf '%s  %s\\n' "$TEST_INSTALLER_SHA" "${assetName}" > "$out"
else
  printf '%s' '${assetBytes}' > "$out"
fi
`);
  await chmod(curl, 0o755);
  return {
    root,
    async execute() {
      return run("sh", [installer.pathname], {
        cwd: root,
        env: {
          ...process.env,
          HOME: join(root, "home"),
          XDG_BIN_HOME: join(root, "installed"),
          PATH: `${bin}:${process.env.PATH}`,
          TEST_INSTALLER_SHA: checksum
        }
      });
    }
  };
}

test("@claim:installer-sha256 installs matching bytes and rejects mismatched SHA-256 before installation", async () => {
  const matching = await makeFixture(assetHash);
  try {
    const result = await matching.execute();
    assert.equal(result.code, 0, result.stderr);
    assert.equal(await readFile(join(matching.root, "installed", "worklog-bridge"), "utf8"), assetBytes);
    assert.match(result.stdout, /Installed Worklog Bridge/);
  } finally {
    await rm(matching.root, { recursive: true, force: true });
  }

  const mismatched = await makeFixture("0".repeat(64));
  try {
    const result = await mismatched.execute();
    assert.notEqual(result.code, 0, "the installer must refuse tampered bytes");
    assert.match(result.stderr, /Checksum verification failed/);
    await assert.rejects(readFile(join(mismatched.root, "installed", "worklog-bridge")));
  } finally {
    await rm(mismatched.root, { recursive: true, force: true });
  }
});

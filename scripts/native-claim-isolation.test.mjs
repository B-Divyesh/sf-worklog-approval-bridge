import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const manifest = fileURLToPath(new URL("../src-tauri/Cargo.toml", import.meta.url));

function runNativeClaim(name) {
  return new Promise((resolve, reject) => {
    const child = spawn("cargo", ["test", "--manifest-path", manifest, name], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdio: "pipe"
    });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(output) : reject(new Error(`${name} exited ${code}\n${output}`)));
  });
}

test("@regression:verification-14 exact native claim commands run before Tauri prerequisites", async () => {
  for (const claim of ["claim_git_metadata", "claim_no_repository_upload"]) {
    const output = await runNativeClaim(claim);
    assert.match(output, new RegExp(`test tests::${claim} \\.{3} ok`));
  }
});

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = join(root, "server", "Cargo.toml");
const binary = join(root, "server", "target", "debug", process.platform === "win32" ? "worklog-approval-bridge-server.exe" : "worklog-approval-bridge-server");

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function stop(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGINT");
  await Promise.race([
    new Promise(resolve => child.once("exit", resolve)),
    new Promise(resolve => setTimeout(resolve, 5_000))
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function startServer(cwd, port) {
  const child = spawn(binary, [], {
    cwd,
    env: { PATH: process.env.PATH || "", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited before health check:\n${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return { child, body: await response.json(), output: () => output };
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await stop(child);
  throw new Error(`server did not become healthy:\n${output}`);
}

test("@claim:zero-config-persistence starts with only PORT and reuses its generated SQLite secret", { timeout: 120_000 }, async () => {
  assert.equal(existsSync("/data"), false, "this sandbox must exercise the documented local fallback when /data is not mounted");
  const build = spawnSync("cargo", ["build", "--manifest-path", manifest, "--locked"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const directory = await mkdtemp(join(tmpdir(), "worklog-zero-config-"));
  const port = await availablePort();
  const serverManifest = await readFile(manifest, "utf8");
  const version = serverManifest.match(/^version = "([^"]+)"$/m)?.[1];
  assert.ok(version);
  try {
    const first = await startServer(directory, port);
    assert.deepEqual(first.body, {
      status: "ok",
      build: { service: "worklog-approval-bridge", version, commit: "dev" }
    });
    await stop(first.child);
    assert.match(first.output(), /"generated_receipt_signing_secret":true/);
    const database = join(directory, "data", "worklog-bridge.sqlite3");
    assert.ok((await stat(database)).size > 0);

    const second = await startServer(directory, port);
    assert.deepEqual(second.body, first.body);
    await stop(second.child);
    assert.match(second.output(), /"generated_receipt_signing_secret":false/);
    assert.ok((await stat(database)).size > 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const FULL_COMMIT = /^[a-f0-9]{40}$/;

export function assertCandidateReady({ commit, status, version, tag }) {
  assert.match(commit, FULL_COMMIT, "delivery verification requires a full Git commit");
  assert.equal(status, "", "commit every repair and handoff change before delivery verification");
  assert.equal(tag, `v${version}`, "delivery tag must match the packaged product version");
  return { commit, tag };
}

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

export function currentCandidate(tagOverride) {
  const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return assertCandidateReady({
    commit: git("rev-parse", "HEAD").toLowerCase(),
    status: git("status", "--porcelain", "--untracked-files=all"),
    version,
    tag: tagOverride || `v${version}`
  });
}

function run(script, args) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args], {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (!key || !value || !["--tag", "--repo", "--url"].includes(key)) throw new Error(`Unknown or incomplete option: ${key || "(missing)"}`);
    args.set(key, value);
  }
  const { commit, tag } = currentCandidate(args.get("--tag"));
  const releaseArgs = ["--tag", tag, "--expected-commit", commit];
  if (args.has("--repo")) releaseArgs.push("--repo", args.get("--repo"));
  run("./verify-release.mjs", releaseArgs);
  const liveArgs = ["--expected-commit", commit];
  if (args.has("--url")) liveArgs.push("--url", args.get("--url"));
  run("./verify-live.mjs", liveArgs);
  process.stdout.write(`Delivery verified: ${tag}, the desktop artifacts, and the deployed API all identify ${commit}.\n`);
}

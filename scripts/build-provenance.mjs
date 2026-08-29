import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const artifactPattern = /\.(?:dmg|msi|exe|AppImage|deb)$/i;

async function artifactPaths(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await artifactPaths(path));
    else if (artifactPattern.test(entry.name)) paths.push(path);
  }
  return paths.sort();
}

export async function createBuildProvenance(directory, label, commit, output) {
  if (!/^(?:macos-arm64|macos-x64|windows-x64|linux-x64)$/.test(label)) throw new Error(`Invalid build label: ${label}`);
  if (!/^[a-f0-9]{40}$/i.test(commit)) throw new Error("Build commit must be a full Git SHA.");
  const paths = await artifactPaths(directory);
  if (!paths.length) throw new Error(`No desktop artifacts found in ${directory}.`);
  const files = [];
  for (const path of paths) {
    const bytes = await readFile(path);
    files.push({ name: basename(path).replaceAll(" ", "."), sha256: createHash("sha256").update(bytes).digest("hex") });
  }
  const provenance = { schemaVersion: 1, label, commit: commit.toLowerCase(), files };
  await writeFile(output, `${JSON.stringify(provenance, null, 2)}\n`);
  return provenance;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [directory, label, commit, output] = process.argv.slice(2);
  if (!directory || !label || !commit || !output) {
    throw new Error("Usage: node scripts/build-provenance.mjs <bundle-dir> <platform-label> <commit> <output>");
  }
  const provenance = await createBuildProvenance(directory, label, commit, output);
  process.stdout.write(`Recorded ${provenance.files.length} ${provenance.label} artifact(s) from ${provenance.commit}.\n`);
}

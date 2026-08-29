import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

export function platformFor(name) {
  if (/(aarch64|arm64).*\.dmg$/i.test(name)) return "macos-arm64";
  if (/\.dmg$/i.test(name)) return "macos-x64";
  if (/\.(msi|exe)$/i.test(name)) return "windows-x64";
  if (/\.(AppImage|deb)$/i.test(name)) return "linux-x64";
  return null;
}

export async function createReleaseManifest(directory, tag, commit, repository) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error(`Invalid release tag: ${tag}`);
  if (!/^[a-f0-9]{40}$/i.test(commit)) throw new Error("Release commit must be a full Git SHA.");
  const names = (await readdir(directory)).filter(name => platformFor(name)).sort();
  const files = [];
  for (const name of names) {
    const bytes = await readFile(join(directory, name));
    files.push({
      platform: platformFor(name),
      name,
      url: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(name)}`,
      sha256: createHash("sha256").update(bytes).digest("hex")
    });
  }
  for (const platform of ["macos-arm64", "macos-x64", "windows-x64", "linux-x64"]) {
    if (!files.some(file => file.platform === platform)) throw new Error(`Missing required ${platform} release asset.`);
  }
  if (!files.some(file => /\.AppImage$/i.test(file.name)) || !files.some(file => /\.deb$/i.test(file.name))) {
    throw new Error("Linux release must include AppImage and DEB assets.");
  }
  const manifest = { version: tag.slice(1), tag, commit: commit.toLowerCase(), files };
  const sums = files.map(file => `${file.sha256}  ${file.name}`).join("\n") + "\n";
  await writeFile(join(directory, "SHA256SUMS"), sums);
  await writeFile(join(directory, "latest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [directory, tag, commit, repository] = process.argv.slice(2);
  if (!directory || !tag || !commit || !repository) {
    throw new Error("Usage: node scripts/release-manifest.mjs <directory> <tag> <commit> <owner/repo>");
  }
  const manifest = await createReleaseManifest(directory, tag, commit, repository);
  process.stdout.write(`Prepared ${manifest.files.length} release files from ${manifest.commit}.\n`);
}

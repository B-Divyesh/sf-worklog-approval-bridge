import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { platformFor } from "./release-manifest.mjs";

const requiredPlatforms = ["macos-arm64", "macos-x64", "windows-x64", "linux-x64"];

export function validateRelease(release, manifest, sumsText, tagCommit, expectedCommit) {
  assert.equal(release.tag_name, manifest.tag, "latest.json tag must match the GitHub release");
  assert.equal(manifest.version, manifest.tag.slice(1), "manifest version must match its tag");
  assert.match(manifest.commit, /^[a-f0-9]{40}$/i, "latest.json must record the full source commit");
  assert.equal(manifest.commit.toLowerCase(), tagCommit.toLowerCase(), "release tag and latest.json must identify the same source commit");
  if (expectedCommit) assert.equal(tagCommit.toLowerCase(), expectedCommit.toLowerCase(), "latest release is not built from the expected repaired commit");
  const sourceCommit = (expectedCommit || tagCommit).toLowerCase();
  for (const platform of requiredPlatforms) {
    assert.ok(manifest.files.some(file => file.platform === platform), `missing ${platform} manifest entry`);
  }
  assert.ok(manifest.files.some(file => /\.AppImage$/i.test(file.name)), "missing Linux AppImage");
  assert.ok(manifest.files.some(file => /\.deb$/i.test(file.name)), "missing Linux DEB");
  const assets = new Map(release.assets.map(asset => [asset.name, asset]));
  const downloadableArtifacts = release.assets.filter(asset => platformFor(asset.name)).map(asset => asset.name).sort();
  assert.deepEqual(manifest.files.map(file => file.name).sort(), downloadableArtifacts, "latest.json must cover every downloadable desktop artifact");
  const sums = new Map(sumsText.trim().split(/\r?\n/).map(line => {
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    assert.ok(match, `invalid SHA256SUMS line: ${line}`);
    return [match[2], match[1].toLowerCase()];
  }));
  for (const file of manifest.files) {
    assert.ok(assets.has(file.name), `${file.name} is absent from the GitHub release`);
    assert.match(file.commit, /^[a-f0-9]{40}$/i, `${file.name} must record its full source commit`);
    assert.equal(file.commit.toLowerCase(), sourceCommit, `${file.name} was not built from the nominated candidate`);
    assert.equal(sums.get(file.name), file.sha256, `${file.name} checksum differs between manifest and SHA256SUMS`);
    assert.ok(file.url.includes(`/releases/download/${manifest.tag}/`), `${file.name} URL does not use the release tag`);
  }
}

async function json(response, label) {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

async function resolveTagCommit(fetcher, api, tag, headers) {
  let object = (await json(await fetcher(`${api}/git/ref/tags/${encodeURIComponent(tag)}`, { headers }), "tag ref")).object;
  while (object?.type === "tag") {
    object = (await json(await fetcher(`${api}/git/tags/${object.sha}`, { headers }), "annotated tag")).object;
  }
  if (object?.type !== "commit" || !/^[a-f0-9]{40}$/i.test(object.sha)) throw new Error("Release tag does not resolve to a commit.");
  return object.sha;
}

export async function verifyPublishedRelease({ repository, tag, expectedCommit, fetcher = fetch, token = "" }) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "worklog-bridge-release-verifier" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const api = `https://api.github.com/repos/${repository}`;
  const release = await json(await fetcher(`${api}/releases/latest`, { headers }), "latest release");
  if (tag && release.tag_name !== tag) throw new Error(`Latest release is ${release.tag_name}, expected ${tag}.`);
  const byName = name => release.assets.find(asset => asset.name === name)?.browser_download_url;
  const manifestUrl = byName("latest.json");
  const sumsUrl = byName("SHA256SUMS");
  if (!manifestUrl || !sumsUrl) throw new Error("Release is missing latest.json or SHA256SUMS.");
  const manifestResponse = await fetcher(manifestUrl, { headers });
  const sumsResponse = await fetcher(sumsUrl, { headers });
  if (!manifestResponse.ok || !sumsResponse.ok) throw new Error("Release metadata could not be downloaded.");
  const manifest = await manifestResponse.json();
  const sumsText = await sumsResponse.text();
  const tagCommit = await resolveTagCommit(fetcher, api, release.tag_name, headers);
  validateRelease(release, manifest, sumsText, tagCommit, expectedCommit);
  const deb = manifest.files.find(file => /\.deb$/i.test(file.name));
  const artifactResponse = await fetcher(deb.url, { headers });
  if (!artifactResponse.ok) throw new Error(`Linux DEB returned HTTP ${artifactResponse.status}`);
  const actual = createHash("sha256").update(Buffer.from(await artifactResponse.arrayBuffer())).digest("hex");
  assert.equal(actual, deb.sha256, "downloaded Linux DEB does not match its published checksum");
  return { release, manifest, tagCommit, checkedAsset: deb.name, checkedSha256: actual };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
  const repository = args.get("--repo") || process.env.GITHUB_REPOSITORY || "B-Divyesh/sf-worklog-approval-bridge";
  const result = await verifyPublishedRelease({
    repository,
    tag: args.get("--tag"),
    expectedCommit: args.get("--expected-commit"),
    token: process.env.GITHUB_TOKEN || ""
  });
  process.stdout.write(`Verified ${result.release.tag_name} at ${result.tagCommit}; ${result.checkedAsset} ${result.checkedSha256}.\n`);
}

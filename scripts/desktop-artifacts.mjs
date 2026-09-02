import { open, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const BUNDLE_TYPES = {
  appimage: { directory: "appimage", suffix: ".AppImage", magic: Buffer.from([0x7f, 0x45, 0x4c, 0x46]) },
  deb: { directory: "deb", suffix: ".deb", magic: Buffer.from("!<arch>\n") },
  rpm: { directory: "rpm", suffix: ".rpm", magic: Buffer.from([0xed, 0xab, 0xee, 0xdb]) }
};

export function requestedLinuxBundles(args) {
  const index = args.findIndex(argument => argument === "--bundles" || argument === "-b");
  if (index === -1) return Object.keys(BUNDLE_TYPES);
  const value = args[index + 1] ?? "";
  if (value === "all") return Object.keys(BUNDLE_TYPES);
  return value.split(",").map(item => item.trim().toLowerCase()).filter(item => item in BUNDLE_TYPES);
}

export function linuxBundleRoot(args, repositoryRoot) {
  const targetIndex = args.findIndex(argument => argument === "--target");
  const target = targetIndex === -1 ? undefined : args[targetIndex + 1];
  return join(repositoryRoot, "src-tauri", "target", ...(target ? [target] : []), "release", "bundle");
}

export async function verifyLinuxDesktopArtifacts({ bundleRoot, bundles, startedAt = 0 }) {
  const verified = [];
  for (const bundle of bundles) {
    const contract = BUNDLE_TYPES[bundle];
    if (!contract) continue;
    const directory = join(bundleRoot, contract.directory);
    let names = [];
    try {
      names = (await readdir(directory)).filter(name => name.endsWith(contract.suffix));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (names.length !== 1) {
      throw new Error(`Expected one fresh ${contract.suffix} in ${directory}; found ${names.length}.`);
    }

    const artifact = join(directory, names[0]);
    const metadata = await stat(artifact);
    if (metadata.size < 1024 || metadata.mtimeMs + 1000 < startedAt) {
      throw new Error(`Desktop artifact is empty or stale: ${artifact}`);
    }

    const handle = await open(artifact, "r");
    try {
      const header = Buffer.alloc(contract.magic.length);
      await handle.read(header, 0, header.length, 0);
      if (!header.equals(contract.magic)) {
        throw new Error(`Desktop artifact has the wrong file signature: ${artifact}`);
      }
    } finally {
      await handle.close();
    }
    verified.push(artifact);
  }
  return verified;
}

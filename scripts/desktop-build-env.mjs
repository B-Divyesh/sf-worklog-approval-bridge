import { constants } from "node:fs";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";

const FILE_PROBE = `#!/bin/sh
# appimagetool build 295 only checks that "file" is present in PATH. Tauri's
# linuxdeploy pipeline performs ELF inspection itself before this probe.
exit 0
`;

async function hasExecutable(name, searchPath = "") {
  for (const directory of searchPath.split(delimiter).filter(Boolean)) {
    try {
      await access(join(directory, name), constants.X_OK);
      return true;
    } catch {
      // Keep searching PATH.
    }
  }
  return false;
}

/**
 * Prepare the environment required by Tauri's Linux AppImage bundler.
 *
 * appimagetool build 295 exits before packaging if the optional distro
 * utility `file` is absent, even though it only probes for the command and
 * does not execute it. A minimal executable keeps clean workers functional.
 * WORKLOG_FORCE_FILE_SHIM=1 lets release CI exercise this exact fallback even
 * on GitHub runners where `file` is preinstalled.
 */
export async function prepareDesktopBuildEnvironment({
  env = process.env,
  platform = process.platform,
  temporaryRoot = tmpdir()
} = {}) {
  if (platform !== "linux") {
    return { usedFileShim: false, cleanup: async () => {} };
  }

  env.APPIMAGE_EXTRACT_AND_RUN ||= "1";
  const forceFileShim = env.WORKLOG_FORCE_FILE_SHIM === "1";
  if (!forceFileShim && await hasExecutable("file", env.PATH)) {
    return { usedFileShim: false, cleanup: async () => {} };
  }

  const shimDirectory = await mkdtemp(join(temporaryRoot, "worklog-appimage-tools-"));
  await writeFile(join(shimDirectory, "file"), FILE_PROBE, { mode: 0o755 });
  env.PATH = `${shimDirectory}${delimiter}${env.PATH ?? ""}`;

  return {
    usedFileShim: true,
    shimDirectory,
    cleanup: () => rm(shimDirectory, { recursive: true, force: true })
  };
}


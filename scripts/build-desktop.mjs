import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { readFile, writeFile } from "node:fs/promises";
import { patchGtkPlugin } from "./linuxdeploy-plugin.mjs";

// Tauri's clap parser accepts CI=true/false, while common CI providers expose CI=1.
if (process.env.CI === "1") process.env.CI = "true";
// The AppImage tooling must extract rather than FUSE-mount in CI containers.
if (process.platform === "linux") process.env.APPIMAGE_EXTRACT_AND_RUN ||= "1";

// Tauri 2.11 can cache an older GTK linuxdeploy plugin beside a newer
// linuxdeploy binary. The old plugin lacks the required API type probe and
// makes AppImage packaging exit 127 before it touches application code.
const gtkPlugin = `${homedir()}/.cache/tauri/linuxdeploy-plugin-gtk.sh`;
async function patchCachedGtkPlugin() {
  try {
    const source = await readFile(gtkPlugin, "utf8");
    const patched = patchGtkPlugin(source);
    if (patched === source) return false;
    await writeFile(gtkPlugin, patched);
    return true;
  } catch {
    // The plugin is downloaded by Tauri during its first Linux bundle.
    return false;
  }
}

await patchCachedGtkPlugin();

const command = process.platform === "win32" ? "npx.cmd" : "npx";
// Windows cannot directly spawn a .cmd shim with Node's default CreateProcess
// mode. Run the npx shim through cmd.exe while every other platform stays
// shell-free.
// Tauri's native runtime is intentionally opt-in so the registered Rust
// claims can run in a clean, non-desktop worker. Every installable bundle
// explicitly restores it here.
function runBuild() {
  return new Promise(resolve => {
    const child = spawn(command, ["tauri", "build", "--features", "desktop", ...process.argv.slice(2)], {
      stdio: "inherit", env: process.env, shell: process.platform === "win32"
    });
    child.once("error", () => resolve(1));
    child.once("exit", code => resolve(code ?? 1));
  });
}

let exitCode = await runBuild();
// On a fresh cache, Tauri downloads the legacy GTK plugin after the first
// patch attempt. Patch it and retry once so an AppImage build works in a
// clean clone as well as an already-warmed runner.
if (exitCode !== 0 && process.platform === "linux" && await patchCachedGtkPlugin()) {
  exitCode = await runBuild();
}
process.exit(exitCode);

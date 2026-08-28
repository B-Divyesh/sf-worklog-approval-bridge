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
try {
  const source = await readFile(gtkPlugin, "utf8");
  const patched = patchGtkPlugin(source);
  if (patched !== source) await writeFile(gtkPlugin, patched);
} catch { /* The plugin is downloaded by Tauri during its first Linux bundle. */ }

const command = process.platform === "win32" ? "npx.cmd" : "npx";
// Windows cannot directly spawn a .cmd shim with Node's default CreateProcess
// mode. Run the npx shim through cmd.exe while every other platform stays
// shell-free.
const child = spawn(command, ["tauri", "build", ...process.argv.slice(2)], {
  stdio: "inherit", env: process.env, shell: process.platform === "win32"
});
child.on("exit", code => process.exit(code ?? 1));

import { spawn } from "node:child_process";

// Tauri's clap parser accepts CI=true/false, while common CI providers expose CI=1.
if (process.env.CI === "1") process.env.CI = "true";
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["tauri", "build", ...process.argv.slice(2)], { stdio: "inherit", env: process.env });
child.on("exit", code => process.exit(code ?? 1));

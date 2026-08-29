import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const signingSecrets = {
  macos: [
    "APPLE_CERTIFICATE",
    "APPLE_CERTIFICATE_PASSWORD",
    "APPLE_SIGNING_IDENTITY",
    "APPLE_ID",
    "APPLE_PASSWORD",
    "APPLE_TEAM_ID"
  ],
  windows: ["WINDOWS_CERT_PFX", "WINDOWS_CERT_PASSWORD"]
};

export function signingMode(platform, environment = process.env, requested = false) {
  const required = signingSecrets[platform];
  if (!required) throw new Error(`Unsupported signing platform: ${platform}`);
  if (!requested) return { enabled: false, missing: [] };
  const present = required.filter(name => typeof environment[name] === "string" && environment[name].trim());
  const missing = required.filter(name => !present.includes(name));
  if (missing.length) {
    throw new Error(`${platform} signing was requested but is partly configured. Add ${missing.join(", ")} or run without signed release mode to build an unsigned preview.`);
  }
  return { enabled: true, missing: [] };
}

export function signingModeMessage(platform, mode, requested) {
  const label = platform === "macos" ? "macOS" : "Windows";
  if (mode.enabled) {
    return `${label} signing was requested and every required credential is present; signed release checks are enabled.`;
  }
  if (!requested) {
    return `${label} signing is optional and was not requested; building an unsigned preview.`;
  }
  return `${label} signing is disabled; building an unsigned preview.`;
}

async function main() {
  const platform = process.argv[2];
  const requested = process.env.SIGN_RELEASE === "true";
  const result = signingMode(platform, process.env, requested);
  process.stdout.write(`${signingModeMessage(platform, result, requested)}\n`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `enabled=${result.enabled}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

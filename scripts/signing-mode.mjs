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

export function signingMode(platform, environment = process.env) {
  const required = signingSecrets[platform];
  if (!required) throw new Error(`Unsupported signing platform: ${platform}`);
  const present = required.filter(name => typeof environment[name] === "string" && environment[name].trim());
  if (present.length === 0) return { enabled: false, missing: required };
  const missing = required.filter(name => !present.includes(name));
  if (missing.length) {
    throw new Error(`${platform} signing is partly configured. Add ${missing.join(", ")} or remove the other ${platform} signing secrets to build an unsigned preview.`);
  }
  return { enabled: true, missing: [] };
}

async function main() {
  const platform = process.argv[2];
  const result = signingMode(platform);
  const label = platform === "macos" ? "macOS" : "Windows";
  process.stdout.write(result.enabled
    ? `${label} signing credentials are complete; signed release checks are enabled.\n`
    : `${label} signing credentials are absent; building an unsigned preview.\n`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `enabled=${result.enabled}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

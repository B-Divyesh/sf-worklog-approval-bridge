import assert from "node:assert/strict";

const COMMIT = /^[a-f0-9]{7,64}$/i;

export function liveVerificationOptions(argv = [], environment = process.env) {
  let expectedCommit = environment.EXPECTED_COMMIT;
  let target = environment.LIVE_URL || "https://worklog-approval-bridge.sociobot.in";
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option !== "--expected-commit" && option !== "--url") throw new Error(`Unknown option: ${option}`);
    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
    if (option === "--expected-commit") expectedCommit = value;
    else target = value;
  }
  if (expectedCommit && !COMMIT.test(expectedCommit)) throw new Error("--expected-commit must be a 7 to 64 character hexadecimal Git commit.");
  return { target: target.replace(/\/$/, ""), expectedCommit: expectedCommit?.toLowerCase() };
}

export function assertDeployedCommit(actualCommit, expectedCommit) {
  if (expectedCommit) assert.equal(actualCommit, expectedCommit, "deployed API commit differs from the nominated repair commit");
}

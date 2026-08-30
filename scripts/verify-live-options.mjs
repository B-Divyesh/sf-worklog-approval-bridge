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

export function assertM2Health(body, expectedCommit) {
  assert.deepEqual(Object.keys(body).sort(), ["build", "status"]);
  assert.deepEqual(Object.keys(body.build || {}).sort(), ["commit", "service", "version"]);
  assert.equal(body.status, "ok");
  assert.equal(body.build.service, "worklog-approval-bridge", "the deployed service must be the M2 backend, not the receipt-only predecessor");
  assert.match(body.build.version || "", /^\d+\.\d+\.\d+$/);
  assert.match(body.build.commit || "", /^[a-f0-9]{7,64}$/);
  assertDeployedCommit(body.build.commit, expectedCommit);
}

export function assertCheckoutRedirect(status, location) {
  assert.equal(status, 303, `the advertised Pro checkout must redirect to hosted checkout; received HTTP ${status}`);
  assert.match(location || "", /^https:\/\/checkout\.dodopayments\.com\//, "checkout redirect must use the hosted Dodo checkout");
}

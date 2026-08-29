const COMMIT = /^[a-f0-9]{7,64}$/i;

/**
 * Deliberately small public deployment identity. Never return arbitrary
 * environment values from the health endpoint: it is anonymous by design.
 */
export function buildIdentity(environment = process.env) {
  const commit = [environment.WORKLOG_BUILD_COMMIT, environment.BUILD_SOURCEVERSION, environment.GITHUB_SHA]
    .find(value => typeof value === "string" && COMMIT.test(value));
  return {
    service: "worklog-approval-bridge-receipts",
    version: "0.1.14",
    commit: commit ? commit.toLowerCase() : "unavailable"
  };
}

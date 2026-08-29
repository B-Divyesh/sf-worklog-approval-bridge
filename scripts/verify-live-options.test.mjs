import assert from "node:assert/strict";
import test from "node:test";
import { assertDeployedCommit, liveVerificationOptions } from "./verify-live-options.mjs";

test("@regression:verify-live-cli-expected-commit is parsed and enforced", () => {
  const expected = "a".repeat(40);
  const options = liveVerificationOptions(["--expected-commit", expected], { EXPECTED_COMMIT: "b".repeat(40) });
  assert.equal(options.expectedCommit, expected);
  assert.throws(() => assertDeployedCommit("b".repeat(40), options.expectedCommit), /deployed API commit differs/);
  assert.doesNotThrow(() => assertDeployedCommit(expected, options.expectedCommit));
});

test("@regression:verify-live-cli-rejects-unknown-or-incomplete-arguments", () => {
  assert.throws(() => liveVerificationOptions(["--expected-commit"], {}), /Missing value/);
  assert.throws(() => liveVerificationOptions(["--unexpected"], {}), /Unknown option/);
});

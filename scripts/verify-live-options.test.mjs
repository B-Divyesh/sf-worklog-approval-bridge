import assert from "node:assert/strict";
import test from "node:test";
import { assertCheckoutRedirect, assertDeployedCommit, assertM2Health, liveVerificationOptions } from "./verify-live-options.mjs";

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

test("@regression:verification-19 rejects the exact stale receipt-only backend", () => {
  assert.throws(
    () => assertM2Health({
      status: "ok",
      build: {
        service: "worklog-approval-bridge-receipts",
        version: "0.2.0",
        commit: "aedc0f453580967435089a3dd79f6ffe7e124115"
      }
    }, "e43e0e9d8e23109e23fc433865fd4bab1ee87380"),
    /must be the M2 backend/
  );
});

test("@regression:checkout HTTP 500 stays a failing, actionable release gate", () => {
  assert.throws(
    () => assertCheckoutRedirect(500, null),
    /must redirect to hosted checkout; received HTTP 500/
  );
  assert.doesNotThrow(() => assertCheckoutRedirect(303, "https://checkout.dodopayments.com/session/test"));
});

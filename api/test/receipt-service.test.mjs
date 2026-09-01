import assert from "node:assert/strict";
import test from "node:test";
import { acceptApproval, normaliseApproval, verifyAttestation } from "../src/receipt-service.js";
import { clientRateKey, consumeRateLimit, READ_LIMIT, WRITE_LIMIT } from "../src/rate-limit.js";
import { missingReceiptStatus } from "../src/approval-protocol.js";
import { buildIdentity } from "../src/build-identity.js";
import { handleApprovalRequest } from "../src/approval-handler.js";

function memoryStore() {
  const records = new Map();
  return {
    async findByDigest(digest) { return records.get(digest) || null; },
    async createIfAbsent(receipt) { if (records.has(receipt.packetDigest)) return false; records.set(receipt.packetDigest, receipt); return true; },
    async getSigningSecret() { return "regression-secret"; }
  };
}

test("@regression:immutable-approval records the first acceptance once and attests it", async () => {
  const store = memoryStore();
  const digest = "a".repeat(64);
  const clock = () => new Date("2026-08-28T12:00:00.000Z");
  const first = await acceptApproval({ packetDigest: digest, approver: "Mira Chen" }, store, clock, () => "receipt-001");
  const second = await acceptApproval({ packetDigest: digest, approver: "Other Name" }, store, clock, () => "receipt-002");
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.receipt.receiptId, "receipt-001");
  assert.equal(second.receipt.approver, "Mira Chen");
  assert.equal(verifyAttestation(first.receipt, "regression-secret"), true);
  assert.throws(() => normaliseApproval({ packetDigest: "not-a-digest", approver: "Mira" }));
});

function concurrentRateStore() {
  const rows = new Map();
  let revision = 0;
  const conflict = (statusCode) => Object.assign(new Error("conditional write failed"), { statusCode });
  return {
    async getRateBucket(rowKey) {
      const row = rows.get(rowKey);
      return row && { ...row };
    },
    async createRateBucket(row) {
      if (rows.has(row.rowKey)) throw conflict(409);
      rows.set(row.rowKey, { ...row, etag: String(++revision) });
    },
    async replaceRateBucket(row) {
      const current = rows.get(row.rowKey);
      if (!current || current.etag !== row.etag) throw conflict(412);
      rows.set(row.rowKey, { ...row, etag: String(++revision) });
    }
  };
}

test("@regression:durable-rate-limit rejects the 61st shared read and 13th shared write", async () => {
  const store = concurrentRateStore();
  const now = Date.parse("2026-08-28T12:00:00.000Z");
  const reads = await Promise.all(Array.from({ length: READ_LIMIT + 1 }, () => consumeRateLimit(store, { client: "203.0.113.8", method: "GET", now })));
  assert.equal(reads.filter(result => result.allowed).length, READ_LIMIT);
  assert.equal(reads.find(result => !result.allowed)?.retryAfter, 60);
  const writes = await Promise.all(Array.from({ length: WRITE_LIMIT + 1 }, () => consumeRateLimit(store, { client: "203.0.113.8", method: "POST", now })));
  assert.equal(writes.filter(result => result.allowed).length, WRITE_LIMIT);
  assert.equal(writes.find(result => !result.allowed)?.retryAfter, 60);
});

test("@regression:approval-api-returns-429-and-retry-after-on-the-61st-sequential-read", async () => {
  const store = concurrentRateStore();
  store.findByDigest = async () => null;
  const request = {
    method: "GET",
    params: {},
    query: new URLSearchParams({ packetDigest: "a".repeat(64) })
  };
  const responses = [];
  for (let index = 0; index <= READ_LIMIT; index += 1) {
    request.headers = new Headers({
      "x-azure-clientip": "203.0.113.61",
      "x-forwarded-for": `203.0.113.61:${44000 + index}`
    });
    responses.push(await handleApprovalRequest(request, async () => store, Date.parse("2026-08-28T12:00:00.000Z")));
  }
  assert.deepEqual(responses.slice(0, READ_LIMIT).map(response => response.status), Array(READ_LIMIT).fill(204));
  assert.equal(responses[READ_LIMIT].status, 429);
  assert.equal(responses[READ_LIMIT].headers["Retry-After"], "60");
});

test("@regression:durable-rate-limit does not treat a forwarded source port as a new client", () => {
  assert.equal(clientRateKey("203.0.113.8:44123, 10.0.0.2"), clientRateKey("203.0.113.8:51234, 10.0.0.2"));
});

test("@regression:unaccepted-approval-lookup is a successful empty response", () => {
  assert.equal(missingReceiptStatus(undefined), 204);
  assert.equal(missingReceiptStatus("receipt-that-does-not-exist"), 404);
});

test("@claim:public-health-fields exposes only service, version, and deployed commit", () => {
  const identity = buildIdentity({ WORKLOG_BUILD_COMMIT: "ABCDEF0123456789", DATABASE_URL: "must-not-leak" });
  assert.deepEqual(identity, {
    service: "worklog-approval-bridge-receipts",
    version: "0.2.3",
    commit: "abcdef0123456789"
  });
  assert.equal(buildIdentity({ WORKLOG_BUILD_COMMIT: "not-a-commit" }).commit, "unavailable");
  assert.equal(JSON.stringify(identity).includes("must-not-leak"), false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { acceptApproval, normaliseApproval, verifyAttestation } from "../src/receipt-service.js";
import { clientRateKey, consumeRateLimit, READ_LIMIT, WRITE_LIMIT } from "../src/rate-limit.js";

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

test("@regression:durable-rate-limit does not treat a forwarded source port as a new client", () => {
  assert.equal(clientRateKey("203.0.113.8:44123, 10.0.0.2"), clientRateKey("203.0.113.8:51234, 10.0.0.2"));
});

import assert from "node:assert/strict";
import test from "node:test";
import { acceptApproval, normaliseApproval, verifyAttestation } from "../src/receipt-service.js";

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

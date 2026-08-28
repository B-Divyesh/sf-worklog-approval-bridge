import { createHmac, randomUUID } from "node:crypto";

const DIGEST = /^[a-f0-9]{64}$/;

export function normaliseApproval(input) {
  const packetDigest = String(input?.packetDigest || "").toLowerCase();
  const approver = String(input?.approver || "").trim().replace(/\s+/g, " ");
  if (!DIGEST.test(packetDigest)) throw new ReceiptError(400, "A valid packet digest is required.");
  if (!approver || approver.length > 160) throw new ReceiptError(400, "Enter a name of up to 160 characters.");
  return { packetDigest, approver };
}

export function attestReceipt(receipt, secret) {
  const message = [receipt.version, receipt.receiptId, receipt.packetDigest, receipt.approver, receipt.acceptedAt].join("|");
  return createHmac("sha256", secret).update(message).digest("base64url");
}

export function verifyAttestation(receipt, secret) {
  return Boolean(receipt?.attestation) && attestReceipt(receipt, secret) === receipt.attestation;
}

export async function acceptApproval(input, store, now = () => new Date(), newId = randomUUID) {
  const { packetDigest, approver } = normaliseApproval(input);
  const existing = await store.findByDigest(packetDigest);
  if (existing) return { receipt: existing, created: false };
  const acceptedAt = now().toISOString();
  const receipt = {
    version: 2,
    receiptId: newId(),
    packetDigest,
    approver,
    acceptedAt,
    attestation: ""
  };
  receipt.attestation = attestReceipt(receipt, await store.getSigningSecret());
  const created = await store.createIfAbsent(receipt);
  return { receipt: created ? receipt : await store.findByDigest(packetDigest), created };
}

export class ReceiptError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

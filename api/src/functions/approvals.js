import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { randomBytes } from "node:crypto";
import { acceptApproval, ReceiptError, verifyAttestation } from "../receipt-service.js";
import { consumeRateLimit } from "../rate-limit.js";
import { missingReceiptStatus } from "../approval-protocol.js";

const TABLE = "worklogapprovals";
const SECRET_PARTITION = "system";
const SECRET_ROW = "attestation";

function json(status, body) {
  return { status, jsonBody: body, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } };
}

function noContent(status) {
  return { status, headers: { "Cache-Control": "no-store" } };
}

function table() {
  // Azure Static Web Apps reserves AzureWebJobsStorage. A product-specific
  // application setting keeps the receipt table independent of host storage.
  const connection = process.env.WORKLOG_APPROVAL_STORAGE || process.env.AzureWebJobsStorage;
  if (!connection) throw new ReceiptError(503, "Approval records are not configured yet. Ask the sender to try again later.");
  return TableClient.fromConnectionString(connection, TABLE);
}

async function ensureTable(client) {
  try { await client.createTable(); } catch (error) { if (error.statusCode !== 409) throw error; }
}

function entityToReceipt(entity) {
  if (!entity) return null;
  return {
    version: Number(entity.version), receiptId: entity.receiptId, packetDigest: entity.partitionKey,
    approver: entity.approver, acceptedAt: entity.acceptedAt, attestation: entity.attestation
  };
}

async function storage() {
  const client = table();
  await ensureTable(client);
  return {
    async findByDigest(packetDigest) {
      try { return entityToReceipt(await client.getEntity(packetDigest, "receipt")); }
      catch (error) { if (error.statusCode === 404) return null; throw error; }
    },
    async createIfAbsent(receipt) {
      try {
        await client.createEntity({ partitionKey: receipt.packetDigest, rowKey: "receipt", ...receipt });
        return true;
      } catch (error) { if (error.statusCode === 409) return false; throw error; }
    },
    async getSigningSecret() {
      try { return (await client.getEntity(SECRET_PARTITION, SECRET_ROW)).value; }
      catch (error) {
        if (error.statusCode !== 404) throw error;
        const value = randomBytes(32).toString("base64url");
        try { await client.createEntity({ partitionKey: SECRET_PARTITION, rowKey: SECRET_ROW, value }); return value; }
        catch (conflict) { if (conflict.statusCode === 409) return (await client.getEntity(SECRET_PARTITION, SECRET_ROW)).value; throw conflict; }
      }
    },
    async getRateBucket(rowKey) {
      try {
        const entity = await client.getEntity("rate-limit", rowKey);
        return { rowKey, bucket: Number(entity.bucket), count: Number(entity.count), expiresAt: entity.expiresAt, etag: entity.etag };
      } catch (error) { if (error.statusCode === 404) return null; throw error; }
    },
    async createRateBucket(bucket) {
      return client.createEntity({ partitionKey: "rate-limit", ...bucket });
    },
    async replaceRateBucket(bucket) {
      return client.updateEntity({ partitionKey: "rate-limit", rowKey: bucket.rowKey, bucket: bucket.bucket, count: bucket.count, expiresAt: bucket.expiresAt }, "Replace", { etag: bucket.etag });
    }
  };
}

app.http("approvals", {
  methods: ["GET", "POST"], route: "approvals/{receiptId?}", authLevel: "anonymous",
  handler: async (request) => {
    try {
      const store = await storage();
      const limit = await consumeRateLimit(store, { client: request.headers.get("x-forwarded-for") || "unknown", method: request.method });
      if (!limit.allowed) return { ...json(429, { error: "Too many approval requests. Try again in one minute." }), headers: { "Cache-Control": "no-store", "Content-Type": "application/json", "Retry-After": String(limit.retryAfter) } };
      if (request.method === "GET") {
        const receiptId = request.params.receiptId;
        const packetDigest = request.query.get("packetDigest")?.toLowerCase();
        if (!packetDigest || !/^[a-f0-9]{64}$/.test(packetDigest)) throw new ReceiptError(400, "A valid packet digest is required.");
        const receipt = await store.findByDigest(packetDigest);
        if (!receipt) {
          const status = missingReceiptStatus(receiptId);
          return status === 204 ? noContent(status) : json(status, { error: "Receipt not found." });
        }
        const valid = verifyAttestation(receipt, await store.getSigningSecret());
        if (receiptId && receiptId !== receipt.receiptId) return json(404, { error: "Receipt not found." });
        return json(200, { receipt, valid });
      }
      const result = await acceptApproval(await request.json(), store);
      return json(result.created ? 201 : 409, { receipt: result.receipt, created: result.created });
    } catch (error) {
      if (error instanceof ReceiptError) return json(error.status, { error: error.message });
      console.error("approval request failed", error);
      return json(503, { error: "The approval record could not be saved. Try again shortly." });
    }
  }
});

import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { randomBytes } from "node:crypto";
import { ReceiptError } from "../receipt-service.js";
import { buildIdentity } from "../build-identity.js";
import { handleApprovalRequest } from "../approval-handler.js";

const TABLE = "worklogapprovals";
const SECRET_PARTITION = "system";
const SECRET_ROW = "attestation";

function json(status, body) {
  return { status, jsonBody: body, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } };
}

app.http("approvalHealth", {
  methods: ["GET"], route: "health", authLevel: "anonymous",
  handler: async () => json(200, { status: "ok", build: buildIdentity() })
});

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
  handler: async (request) => handleApprovalRequest(request, storage)
});

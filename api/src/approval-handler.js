import { acceptApproval, ReceiptError, verifyAttestation } from "./receipt-service.js";
import { consumeRateLimit } from "./rate-limit.js";
import { missingReceiptStatus } from "./approval-protocol.js";

function json(status, body) {
  return { status, jsonBody: body, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } };
}

function noContent(status) {
  return { status, headers: { "Cache-Control": "no-store" } };
}

/**
 * Keep the request policy independent of Azure Functions plumbing so the
 * public boundary (including its rate-limit response) can be tested exactly.
 */
export async function handleApprovalRequest(request, getStore, now = Date.now()) {
  try {
    const store = await getStore();
    // Azure Static Web Apps supplies x-azure-clientip without a connection
    // port. x-forwarded-for may include a new source port per request, which
    // would otherwise create a new anonymous rate bucket for one client.
    const client = request.headers.get("x-azure-clientip") || request.headers.get("x-forwarded-for") || "unknown";
    const limit = await consumeRateLimit(store, {
      client,
      method: request.method,
      now
    });
    if (!limit.allowed) {
      return {
        ...json(429, { error: "Too many approval requests. Try again in one minute." }),
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfter)
        }
      };
    }
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

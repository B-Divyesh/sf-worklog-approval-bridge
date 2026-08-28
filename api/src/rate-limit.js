import { createHash } from "node:crypto";

export const READ_LIMIT = 60;
export const WRITE_LIMIT = 12;
const WINDOW_MS = 60_000;
// A burst can legitimately contain all 60 read slots. Retrying beyond that
// worst case preserves the allowance while the ETag prevents overselling it.
const MAX_RETRIES = 128;

export function clientRateKey(forwardedFor = "unknown") {
  const first = String(forwardedFor).split(",")[0].trim();
  // Some Azure front doors append a transient source port. The port identifies
  // a connection, not a client, and would let sequential requests evade the
  // shared bucket.
  const bracketedV6 = first.match(/^\[([^\]]+)](?::\d+)?$/);
  const ipv4WithPort = first.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  const client = bracketedV6?.[1] || ipv4WithPort?.[1] || first || "unknown";
  // The durable table needs a stable key, but must never retain a raw IP.
  return createHash("sha256").update(client).digest("hex");
}

/**
 * Consume one request from a shared fixed-minute bucket. The store's replace
 * operation is ETag-conditional, so concurrent Functions workers cannot all
 * accept the same final slot.
 */
export async function consumeRateLimit(store, { client, method, now = Date.now() }) {
  const bucket = Math.floor(now / WINDOW_MS);
  const limit = method === "POST" ? WRITE_LIMIT : READ_LIMIT;
  // One rotating row per client/action avoids retaining an unbounded history
  // of request windows. The IP-derived key is a one-way digest.
  const rowKey = `${method === "POST" ? "write" : "read"}:${clientRateKey(client)}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const current = await store.getRateBucket(rowKey);
    if (!current) {
      try {
        await store.createRateBucket({ rowKey, bucket, count: 1, expiresAt: new Date((bucket + 1) * WINDOW_MS).toISOString() });
        return { allowed: true, retryAfter: 0 };
      } catch (error) {
        if (error?.statusCode === 409) continue;
        throw error;
      }
    }
    if (Number(current.bucket) !== bucket) {
      try {
        await store.replaceRateBucket({ ...current, bucket, count: 1, expiresAt: new Date((bucket + 1) * WINDOW_MS).toISOString() });
        return { allowed: true, retryAfter: 0 };
      } catch (error) {
        if (error?.statusCode === 412) continue;
        throw error;
      }
    }
    if (Number(current.count) >= limit) return { allowed: false, retryAfter: 60 };
    try {
      await store.replaceRateBucket({ ...current, count: Number(current.count) + 1 });
      return { allowed: true, retryAfter: 0 };
    } catch (error) {
      if (error?.statusCode === 412) continue;
      throw error;
    }
  }
  // Fail closed if a burst keeps conflicting; do not accidentally bypass a
  // documented allowance when a shared store is under contention.
  return { allowed: false, retryAfter: 1 };
}

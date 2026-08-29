/**
 * A packet without an acceptance is the normal starting state for an approval
 * link. It is not a missing API resource, so clients can check it without
 * producing a browser-level failed-resource error.
 */
export function missingReceiptStatus(receiptId) {
  return receiptId ? 404 : 204;
}

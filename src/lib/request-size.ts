/** Refused before `request.json()` runs; see isBodyTooLarge. */
export const MAX_REQUEST_BODY_BYTES = 16 * 1024;

/**
 * Whether a request's declared `content-length` exceeds the limit.
 *
 * Checked against the header rather than the parsed body so an oversized
 * payload is rejected before `request.json()` spends the work reading and
 * parsing it. A missing or malformed header reads as "not too large" here —
 * `request.json()` still has to run and will fail or succeed on its own.
 */
export function isBodyTooLarge(
  headers: Headers,
  maxBytes: number = MAX_REQUEST_BODY_BYTES
): boolean {
  const contentLength = headers.get("content-length");
  if (!contentLength) return false;

  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > maxBytes;
}

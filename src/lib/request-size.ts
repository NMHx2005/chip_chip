/** Refused before the body is read; see isBodyTooLarge and readJsonWithLimit. */
export const MAX_REQUEST_BODY_BYTES = 16 * 1024;

/**
 * Whether a request's declared `content-length` exceeds the limit.
 *
 * A fast pre-check only: it lets an honestly-labelled oversized request be
 * refused without even starting to read the body. It proves nothing on its
 * own — a chunked request (no `content-length` at all) or a request whose
 * header understates its real size sails through this check, which is what
 * `readJsonWithLimit` is for. A missing or malformed header reads as "not too
 * large" here.
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

export type JsonBodyResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; reason: "too_large" }
  | { ok: false; reason: "invalid_json" };

/**
 * Reads a request body as JSON while capping how many bytes it will ever
 * buffer — the authoritative check `isBodyTooLarge` cannot be: a chunked
 * request has no `content-length` to pre-check, and nothing stops a client
 * from sending more bytes than a header it did include. Counts bytes as they
 * stream in and cancels the reader the moment the count would exceed
 * `maxBytes`, so an oversized body is never fully buffered in memory the way
 * `request.json()` would.
 */
export async function readJsonWithLimit<T = unknown>(
  request: Request,
  maxBytes: number = MAX_REQUEST_BODY_BYTES
): Promise<JsonBodyResult<T>> {
  const body = request.body;
  if (!body) return { ok: false, reason: "invalid_json" };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { ok: false, reason: "too_large" };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const value = JSON.parse(new TextDecoder("utf-8").decode(bytes)) as T;
    return { ok: true, value };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

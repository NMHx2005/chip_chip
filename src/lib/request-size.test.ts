import { describe, expect, it } from "vitest";
import { MAX_REQUEST_BODY_BYTES, isBodyTooLarge, readJsonWithLimit } from "@/lib/request-size";

function headersWith(contentLength: string | null): Headers {
  const headers = new Headers();
  if (contentLength !== null) headers.set("content-length", contentLength);
  return headers;
}

/**
 * A `Request` whose body is a live `ReadableStream` fed one chunk at a time,
 * like a real chunked-transfer-encoding upload — no `content-length` header,
 * so `isBodyTooLarge` cannot see this coming and only `readJsonWithLimit`'s
 * own byte counting can catch it.
 */
function chunkedRequest(chunks: string[]): Request {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  return new Request("http://test.local/api", {
    method: "POST",
    body: stream,
    // Required by the Fetch spec for a streamed request body.
    duplex: "half",
  } as RequestInit);
}

describe("isBodyTooLarge", () => {
  it("accepts a body at the limit", () => {
    expect(isBodyTooLarge(headersWith(String(MAX_REQUEST_BODY_BYTES)))).toBe(false);
  });

  it("rejects a body one byte over the limit", () => {
    expect(isBodyTooLarge(headersWith(String(MAX_REQUEST_BODY_BYTES + 1)))).toBe(true);
  });

  it("accepts an empty body", () => {
    expect(isBodyTooLarge(headersWith("0"))).toBe(false);
  });

  it("does not reject when content-length is missing", () => {
    // Nothing to compare against yet; the JSON parse below still guards size.
    expect(isBodyTooLarge(headersWith(null))).toBe(false);
  });

  it("does not reject a malformed content-length", () => {
    expect(isBodyTooLarge(headersWith("not-a-number"))).toBe(false);
  });
});

/**
 * A chunked request whose underlying stream's `cancel()` rejects — some
 * streams (proxies, certain polyfills) behave this way. `readJsonWithLimit`
 * must still resolve with `too_large`, not throw, once the byte limit is
 * exceeded.
 */
function chunkedRequestWithFailingCancel(chunks: string[]): Request {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
    cancel() {
      throw new Error("cancel not supported");
    },
  });

  return new Request("http://test.local/api", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit);
}

describe("readJsonWithLimit", () => {
  it("still returns too_large when the stream's cancel() rejects", async () => {
    const request = chunkedRequestWithFailingCancel(["{\"a\":\"", "xxxxxxxxxx", "\"}"]);

    const result = await readJsonWithLimit(request, 10);
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });

  it("rejects a chunked stream (no content-length) once it exceeds the limit", async () => {
    const request = chunkedRequest(["{\"a\":\"", "xxxxxxxxxx", "\"}"]);
    expect(request.headers.get("content-length")).toBeNull();

    const result = await readJsonWithLimit(request, 10);
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });

  it("accepts a body exactly at the limit", async () => {
    const json = '{"a":1}';
    expect(json.length).toBe(7);

    const result = await readJsonWithLimit(chunkedRequest([json]), 7);
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("reads invalid JSON as its own result", async () => {
    const result = await readJsonWithLimit(chunkedRequest(["not json"]), MAX_REQUEST_BODY_BYTES);
    expect(result).toEqual({ ok: false, reason: "invalid_json" });
  });

  it("reads an empty body as invalid JSON", async () => {
    const result = await readJsonWithLimit(chunkedRequest([]), MAX_REQUEST_BODY_BYTES);
    expect(result).toEqual({ ok: false, reason: "invalid_json" });
  });
});

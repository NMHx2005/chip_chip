import { describe, expect, it } from "vitest";
import { MAX_REQUEST_BODY_BYTES, isBodyTooLarge } from "@/lib/request-size";

function headersWith(contentLength: string | null): Headers {
  const headers = new Headers();
  if (contentLength !== null) headers.set("content-length", contentLength);
  return headers;
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

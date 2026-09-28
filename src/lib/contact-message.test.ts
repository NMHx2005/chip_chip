import { describe, expect, it } from "vitest";
import { mailtoHref, parseMessagePayload } from "@/lib/contact-message";

const valid = {
  kind: "feedback",
  name: "  Lan  ",
  email: " lan@example.com ",
  body: "  Bài hay quá!  ",
  locale: "vi",
};

describe("parseMessagePayload", () => {
  it("trims and accepts a well-formed message", () => {
    expect(parseMessagePayload(valid)).toEqual({
      ok: true,
      honeypot: false,
      value: {
        kind: "feedback",
        name: "Lan",
        email: "lan@example.com",
        body: "Bài hay quá!",
        postId: null,
        locale: "vi",
      },
    });
  });

  it("treats a filled hidden field as a bot", () => {
    expect(parseMessagePayload({ ...valid, website: "http://spam.test" })).toEqual({
      ok: true,
      honeypot: true,
    });
  });

  it("makes email optional", () => {
    const result = parseMessagePayload({ ...valid, email: "" });
    expect(result.ok && !result.honeypot && result.value.email).toBeNull();
  });

  it.each([
    [{ ...valid, kind: "spam" }, "kind_invalid"],
    [{ ...valid, name: "" }, "name_length"],
    [{ ...valid, name: "x".repeat(81) }, "name_length"],
    [{ ...valid, body: "   " }, "body_length"],
    [{ ...valid, body: "x".repeat(4001) }, "body_length"],
    [{ ...valid, email: "not-an-email" }, "email_invalid"],
    [{ ...valid, email: `${"x".repeat(250)}@a.io` }, "email_invalid"],
    [{ ...valid, locale: "fr" }, "locale_invalid"],
    [{ ...valid, postId: "not-a-uuid" }, "post_invalid"],
  ])("rejects %o with %s", (payload, error) => {
    expect(parseMessagePayload(payload)).toEqual({ ok: false, error });
  });

  it("rejects non-string fields instead of throwing", () => {
    for (const bad of [["x"], { a: 1 }, 42, null, true]) {
      expect(parseMessagePayload({ ...valid, name: bad }).ok).toBe(false);
      expect(parseMessagePayload({ ...valid, body: bad }).ok).toBe(false);
      expect(parseMessagePayload({ ...valid, kind: bad }).ok).toBe(false);
    }
  });

  it("rejects a payload that is not an object", () => {
    for (const bad of [null, "text", 1, []]) {
      expect(parseMessagePayload(bad)).toEqual({ ok: false, error: "invalid_payload" });
    }
  });

  it("accepts a content error tied to an article", () => {
    const result = parseMessagePayload({
      ...valid,
      kind: "content_error",
      postId: "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e",
    });
    expect(result.ok && !result.honeypot && result.value.postId).toBe(
      "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e"
    );
  });
});

describe("mailtoHref", () => {
  it("round-trips a normal address", () => {
    const email = "lan@example.com";
    const href = mailtoHref(email);
    expect(decodeURIComponent(href.slice("mailto:".length))).toBe(email);
  });

  it("percent-encodes header-injection characters", () => {
    const href = mailtoHref("a@b.com?bcc=x@evil.test&subject=Hi");
    expect(href.startsWith("mailto:")).toBe(true);
    const afterPrefix = href.slice("mailto:".length);
    expect(afterPrefix).not.toMatch(/[?&=]/);
  });
});

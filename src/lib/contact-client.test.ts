import { describe, expect, it, vi } from "vitest";
import {
  MESSAGE_LIMITS,
  buildMessagePayload,
  checkMessagePayload,
  messageErrorKey,
  sendMessage,
  type MessageFields,
} from "@/lib/contact-client";
import { parseMessagePayload } from "@/lib/contact-message";

const fields: MessageFields = {
  kind: "contact",
  name: "  Lan  ",
  email: " lan@example.com ",
  body: "  Xin chào!  ",
  website: "",
  postId: null,
};

function reply(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

describe("buildMessagePayload", () => {
  it("trims the fields and adds the locale", () => {
    expect(buildMessagePayload(fields, "vi")).toEqual({
      kind: "contact",
      name: "Lan",
      email: "lan@example.com",
      body: "Xin chào!",
      website: "",
      postId: null,
      locale: "vi",
    });
  });

  it("builds a payload the server accepts, including a content error on an article", () => {
    const postId = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";
    const payload = buildMessagePayload({ ...fields, kind: "content_error", postId }, "en");
    const parsed = parseMessagePayload(payload);
    expect(parsed.ok && !parsed.honeypot && parsed.value).toMatchObject({
      kind: "content_error",
      postId,
      locale: "en",
    });
  });
});

describe("checkMessagePayload", () => {
  const base = buildMessagePayload(fields, "vi");

  it("refuses a name or message made only of spaces once trimmed", () => {
    expect(checkMessagePayload(buildMessagePayload({ ...fields, name: "   " }, "vi"))).toBe("nameLength");
    expect(checkMessagePayload(buildMessagePayload({ ...fields, body: " \n\t " }, "vi"))).toBe("bodyLength");
  });

  it("accepts a message with or without an email", () => {
    expect(checkMessagePayload(base)).toBeNull();
    expect(checkMessagePayload({ ...base, email: "" })).toBeNull();
  });

  it.each([
    [{ name: "" }, "nameLength"],
    [{ name: "x".repeat(MESSAGE_LIMITS.name + 1) }, "nameLength"],
    [{ body: "" }, "bodyLength"],
    [{ body: "x".repeat(MESSAGE_LIMITS.body + 1) }, "bodyLength"],
    [{ email: "not-an-email" }, "emailInvalid"],
    [{ email: `${"x".repeat(250)}@a.io` }, "emailInvalid"],
  ])("rejects %o as %s", (change, key) => {
    expect(checkMessagePayload({ ...base, ...change })).toBe(key);
  });

  it("accepts the limits themselves", () => {
    expect(
      checkMessagePayload({
        ...base,
        name: "x".repeat(MESSAGE_LIMITS.name),
        body: "x".repeat(MESSAGE_LIMITS.body),
      })
    ).toBeNull();
  });
});

describe("messageErrorKey", () => {
  it("maps each route code to its message", () => {
    expect(messageErrorKey("rate_limited")).toBe("rateLimited");
    expect(messageErrorKey("name_length")).toBe("nameLength");
    expect(messageErrorKey("body_length")).toBe("bodyLength");
    expect(messageErrorKey("email_invalid")).toBe("emailInvalid");
    expect(messageErrorKey("post_not_found")).toBe("postNotFound");
    expect(messageErrorKey("post_invalid")).toBe("postNotFound");
  });

  it("reads anything else as a generic failure", () => {
    for (const code of ["insert_failed", "server_not_configured", "invalid_json", "toString", "__proto__", 42, null, undefined]) {
      expect(messageErrorKey(code)).toBe("generic");
    }
  });
});

describe("sendMessage", () => {
  const payload = buildMessagePayload(fields, "vi");

  it("posts JSON to /api/messages and reports success", async () => {
    const fetchImpl = reply(200, { ok: true });
    await expect(sendMessage(payload, fetchImpl)).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("reports the rate limit", async () => {
    await expect(sendMessage(payload, reply(429, { error: "rate_limited" }))).resolves.toEqual({
      ok: false,
      error: "rateLimited",
    });
  });

  it("reports a validation error from the server", async () => {
    await expect(sendMessage(payload, reply(400, { error: "email_invalid" }))).resolves.toEqual({
      ok: false,
      error: "emailInvalid",
    });
  });

  it("reports a missing article", async () => {
    await expect(sendMessage(payload, reply(404, { error: "post_not_found" }))).resolves.toEqual({
      ok: false,
      error: "postNotFound",
    });
  });

  it("reports a network failure", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sendMessage(payload, fetchImpl)).resolves.toEqual({ ok: false, error: "network" });
  });

  it("reads a non-JSON error page as a generic failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
    });
    await expect(sendMessage(payload, fetchImpl)).resolves.toEqual({ ok: false, error: "generic" });
  });

  it("does not spend a request on a message the server would refuse", async () => {
    const fetchImpl = reply(200, { ok: true });
    await expect(sendMessage({ ...payload, body: "" }, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "bodyLength",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards a filled honeypot and reads the server's quiet success as sent", async () => {
    const fetchImpl = reply(200, { ok: true });
    const bot = buildMessagePayload({ ...fields, website: "http://spam.test" }, "vi");
    await expect(sendMessage(bot, fetchImpl)).resolves.toEqual({ ok: true });
    const init = fetchImpl.mock.calls[0][1] as { body: string };
    expect(JSON.parse(init.body)).toMatchObject({ website: "http://spam.test" });
    expect(parseMessagePayload(JSON.parse(init.body))).toEqual({ ok: true, honeypot: true });
  });
});

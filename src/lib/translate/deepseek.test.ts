import { describe, expect, it, vi } from "vitest";
import {
  BATCH_CHARS,
  DEFAULT_MODEL,
  TranslateError,
  batchSegments,
  maxTokensFor,
  translateSegments,
} from "@/lib/translate/deepseek";

const items = [
  { id: "s1", text: "Bán dẫn" },
  { id: "s2", text: "<b>Vùng cấm</b> <m1/>" },
];

function sentBody(fetchImpl: { mock: { calls: Parameters<typeof fetch>[] } }, call = 0) {
  return JSON.parse(String(fetchImpl.mock.calls[call][1]?.body));
}

function reply(content: unknown, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const good = JSON.stringify({
  translations: [
    { id: "s1", text: "Semiconductor" },
    { id: "s2", text: "<b>Band gap</b> <m1/>" },
  ],
});

describe("translateSegments", () => {
  it("posts one JSON-mode request with the key, the model and every segment", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(good));
    const result = await translateSegments(items, { apiKey: "test-key", fetchImpl });

    expect(result).toEqual([
      { id: "s1", text: "Semiconductor" },
      { id: "s2", text: "<b>Band gap</b> <m1/>" },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-key");
    const body = sentBody(fetchImpl);
    expect(body.model).toBe(DEFAULT_MODEL);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.temperature).toBeLessThanOrEqual(0.3);
    expect(body.max_tokens).toBe(maxTokensFor(items));
    expect(body.messages[0].content).toContain("JSON");
    expect(body.messages[0].content).toContain("Example output");
    expect(body.messages[0].content).toContain("vùng cấm = band gap");
    expect(JSON.parse(body.messages[1].content)).toEqual({ segments: items });
  });

  it("uses the configured model", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(good));
    await translateSegments(items, { apiKey: "k", model: "deepseek-flash", fetchImpl });
    expect(sentBody(fetchImpl).model).toBe("deepseek-flash");
  });

  it("retries exactly once when JSON mode answers with empty content", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(reply("")).mockResolvedValueOnce(reply(good));
    const result = await translateSegments(items, { apiKey: "k", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it("gives up with a friendly error after a second empty answer", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply("  "));
    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(
      "DeepSeek trả về bản dịch rỗng. Thử lại."
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("turns malformed JSON into a friendly error without leaking the reply", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply("{not json <secret>"));
    const error = await translateSegments(items, { apiKey: "k", fetchImpl }).catch((e) => e);
    expect(error).toBeInstanceOf(TranslateError);
    expect(error.message).toBe("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
  });

  it("drops entries that are not {id, text} strings", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      reply(JSON.stringify({ translations: [{ id: "s1", text: 5 }, null, { id: "s2", text: "ok" }] }))
    );
    expect(await translateSegments(items, { apiKey: "k", fetchImpl })).toEqual([{ id: "s2", text: "ok" }]);
  });

  it.each([
    [401, "Khoá DeepSeek không hợp lệ. Kiểm tra DEEPSEEK_API_KEY."],
    [402, "Tài khoản DeepSeek đã hết số dư."],
    [429, "DeepSeek đang quá tải. Thử lại sau ít phút."],
    [500, "DeepSeek không phản hồi được lúc này. Thử lại sau."],
  ])("maps HTTP %i to a friendly message", async (status, message) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("internal details", { status }));
    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(message);
  });

  it("reports a network failure or timeout in plain words", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted", "TimeoutError");
    });
    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(
      "Không kết nối được DeepSeek hoặc quá thời gian chờ. Thử lại."
    );
  });

  it("refuses to run without a key and never calls the network", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(translateSegments(items, { apiKey: undefined, fetchImpl })).rejects.toThrow(
      "Chưa cấu hình DEEPSEEK_API_KEY."
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends long input as sequential batches and stops starting new ones after the deadline", async () => {
    const long = Array.from({ length: 3 }, (_, i) => ({ id: `s${i + 1}`, text: "x".repeat(BATCH_CHARS - 10) }));
    let clock = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      clock += 40_000;
      const { segments } = JSON.parse(JSON.parse(String(init?.body)).messages[1].content);
      return reply(JSON.stringify({ translations: segments }));
    });
    const result = await translateSegments(long, {
      apiKey: "k",
      fetchImpl,
      deadline: 70_000,
      now: () => clock,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.map((r) => r.id)).toEqual(["s1", "s2"]);
  });

  it("does not start a new batch when less than 20s of the budget remains", async () => {
    const long = [
      { id: "s1", text: "x".repeat(BATCH_CHARS - 10) },
      { id: "s2", text: "x".repeat(BATCH_CHARS - 10) },
    ];
    let clock = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      // Leaves 10s of a 70s budget after the first batch — too little to start another.
      clock += 60_000;
      const { segments } = JSON.parse(JSON.parse(String(init?.body)).messages[1].content);
      return reply(JSON.stringify({ translations: segments }));
    });
    const result = await translateSegments(long, {
      apiKey: "k",
      fetchImpl,
      deadline: 70_000,
      now: () => clock,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.map((r) => r.id)).toEqual(["s1"]);
  });

  it("returns the batches already translated instead of throwing when a later batch aborts", async () => {
    const long = [
      { id: "s1", text: "x".repeat(BATCH_CHARS - 10) },
      { id: "s2", text: "x".repeat(BATCH_CHARS - 10) },
    ];
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply(JSON.stringify({ translations: [{ id: "s1", text: "S1" }] })))
      .mockRejectedValueOnce(new DOMException("The operation was aborted", "AbortError"));

    const result = await translateSegments(long, { apiKey: "k", fetchImpl });

    expect(result).toEqual([{ id: "s1", text: "S1" }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns an empty result without throwing when the very first batch aborts on a deadline-shortened timeout", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted", "TimeoutError");
    });

    const result = await translateSegments(items, {
      apiKey: "k",
      fetchImpl,
      deadline: 50_000,
      now: () => 0,
    });

    expect(result).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("still throws the friendly error when the first batch aborts on a full, un-shortened timeout", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted", "TimeoutError");
    });

    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(
      "Không kết nối được DeepSeek hoặc quá thời gian chờ. Thử lại."
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("keeps the batches already translated when a later batch returns a hard API error", async () => {
    const long = [
      { id: "s1", text: "x".repeat(BATCH_CHARS - 10) },
      { id: "s2", text: "x".repeat(BATCH_CHARS - 10) },
    ];
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply(JSON.stringify({ translations: [{ id: "s1", text: "S1" }] })))
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }));

    const result = await translateSegments(long, { apiKey: "k", fetchImpl });

    expect(result).toEqual([{ id: "s1", text: "S1" }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("batchSegments", () => {
  it("keeps order and never splits a segment", () => {
    const list = [
      { id: "a", text: "x".repeat(6) },
      { id: "b", text: "x".repeat(6) },
      { id: "c", text: "x".repeat(20) },
    ];
    expect(batchSegments(list, 10).map((batch) => batch.map((item) => item.id))).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ]);
    expect(batchSegments(list, 12).map((batch) => batch.map((item) => item.id))).toEqual([
      ["a", "b"],
      ["c"],
    ]);
    expect(batchSegments([], 10)).toEqual([]);
  });
});

import "server-only";

import { GLOSSARY } from "@/lib/translate/glossary";

/**
 * Vietnamese → English draft translation through DeepSeek's OpenAI-compatible
 * chat API. Plain `fetch`, no SDK; `fetchImpl` and `now` exist so tests never
 * touch the network or the clock.
 *
 * Only article text is ever sent — never emails, comments or reader data.
 */

export type TranslateItem = { id: string; text: string };

export class TranslateError extends Error {}

export const DEFAULT_MODEL = "deepseek-v4-pro";
const ENDPOINT = "https://api.deepseek.com/chat/completions";
/** Characters of segment text per request, so one answer fits in max_tokens. */
export const BATCH_CHARS = 8000;
const REQUEST_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = [
  "You translate Vietnamese lesson text about semiconductors into English for high-school students.",
  "The input is JSON: {\"segments\": [{\"id\": string, \"text\": string}]}.",
  "Reply with JSON only, in the form {\"translations\": [{\"id\": string, \"text\": string}]}, one entry per input segment, same ids.",
  "Each text may contain placeholder tags: <b>…</b>, <i>…</i>, <u>…</u>, <s>…</s>, <code>…</code>, <mark>…</mark>, <a1>…</a1> (links, numbered), <m1/> (formulas, numbered) and <br/>.",
  "Keep every tag exactly once and in the same order; translate only the words between them. Never translate the text inside <code>…</code>.",
  "Keep the entities &amp; &lt; &gt; as they are. Do not add, drop or explain anything.",
  "Use this glossary: " + GLOSSARY.map(([vi, en]) => `${vi} = ${en}`).join("; ") + ".",
  "Example input: {\"segments\": [{\"id\": \"s1\", \"text\": \"<b>Bán dẫn</b> có vùng cấm <m1/>.\"}]}",
  "Example output: {\"translations\": [{\"id\": \"s1\", \"text\": \"<b>Semiconductors</b> have a band gap <m1/>.\"}]}",
].join("\n");

/** Splits segments into requests of at most `limit` characters, keeping order. */
export function batchSegments(items: TranslateItem[], limit = BATCH_CHARS): TranslateItem[][] {
  const batches: TranslateItem[][] = [];
  let current: TranslateItem[] = [];
  let size = 0;
  for (const item of items) {
    if (current.length > 0 && size + item.text.length > limit) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += item.text.length;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/** Output room for one batch: English plus JSON framing rarely exceeds the input. */
export function maxTokensFor(batch: TranslateItem[]): number {
  const chars = batch.reduce((sum, item) => sum + item.text.length, 0);
  return Math.min(8192, 1024 + chars);
}

function statusMessage(status: number): string {
  if (status === 401) return "Khoá DeepSeek không hợp lệ. Kiểm tra DEEPSEEK_API_KEY.";
  if (status === 402) return "Tài khoản DeepSeek đã hết số dư.";
  if (status === 429) return "DeepSeek đang quá tải. Thử lại sau ít phút.";
  return "DeepSeek không phản hồi được lúc này. Thử lại sau.";
}

function parseTranslations(content: string): TranslateItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new TranslateError("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
  }
  const list = (parsed as { translations?: unknown } | null)?.translations;
  if (!Array.isArray(list)) {
    throw new TranslateError("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
  }
  return list.flatMap((entry: unknown) => {
    const { id, text } = (entry ?? {}) as { id?: unknown; text?: unknown };
    return typeof id === "string" && typeof text === "string" ? [{ id, text }] : [];
  });
}

type Options = {
  apiKey: string | undefined;
  model?: string;
  fetchImpl?: typeof fetch;
  /** Epoch ms after which no new batch is started; later segments stay Vietnamese. */
  deadline?: number;
  now?: () => number;
};

async function requestBatch(
  batch: TranslateItem[],
  { apiKey, model, fetchImpl, timeoutMs }: { apiKey: string; model: string; fetchImpl: typeof fetch; timeoutMs: number }
): Promise<TranslateItem[]> {
  // JSON mode sometimes answers with empty content; one retry is enough.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ segments: batch }) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: maxTokensFor(batch),
          stream: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new TranslateError("Không kết nối được DeepSeek hoặc quá thời gian chờ. Thử lại.");
    }

    if (!response.ok) throw new TranslateError(statusMessage(response.status));

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new TranslateError("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
    }
    const content = (body as { choices?: { message?: { content?: unknown } }[] } | null)
      ?.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return parseTranslations(content);
  }
  throw new TranslateError("DeepSeek trả về bản dịch rỗng. Thử lại.");
}

/**
 * Translates segments batch by batch, in order. Returns every translation
 * received; segments of batches skipped because of `deadline` are simply
 * absent, and the caller keeps them in Vietnamese.
 */
export async function translateSegments(
  items: TranslateItem[],
  { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch, deadline = Infinity, now = Date.now }: Options
): Promise<TranslateItem[]> {
  if (!apiKey) throw new TranslateError("Chưa cấu hình DEEPSEEK_API_KEY.");

  const results: TranslateItem[] = [];
  for (const batch of batchSegments(items)) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    const timeoutMs = Math.min(REQUEST_TIMEOUT_MS, remaining);
    results.push(...(await requestBatch(batch, { apiKey, model, fetchImpl, timeoutMs })));
  }
  return results;
}

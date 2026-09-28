import type { Locale } from "@/i18n/routing";
import type { MessageKind } from "@/lib/contact-message";

/**
 * Browser side of /api/messages, shared by the contact form and the
 * "report a mistake" form so both send and read the result the same way.
 *
 * Pure apart from the injected `fetch`, so every outcome — including a
 * network failure — is testable without a browser.
 */

/** Must match the CHECK constraints on public.messages. */
export const MESSAGE_LIMITS = { name: 80, email: 254, body: 4000 } as const;

/** Shape only, same test as the server's; see `mailtoHref` for why that is enough. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MessageFields = {
  kind: MessageKind;
  name: string;
  email: string;
  body: string;
  /** Honeypot: hidden from people, forwarded as-is so the server decides. */
  website: string;
  postId: string | null;
};

export type MessagePayload = {
  kind: MessageKind;
  name: string;
  email: string;
  body: string;
  website: string;
  postId: string | null;
  locale: Locale;
};

/** Keys under `contact.errors` in the message files. */
export type MessageErrorKey =
  | "nameLength"
  | "bodyLength"
  | "emailInvalid"
  | "postNotFound"
  | "rateLimited"
  | "network"
  | "generic";

export type SendOutcome = { ok: true } | { ok: false; error: MessageErrorKey };

export function buildMessagePayload(fields: MessageFields, locale: Locale): MessagePayload {
  return {
    kind: fields.kind,
    name: fields.name.trim(),
    email: fields.email.trim(),
    body: fields.body.trim(),
    website: fields.website,
    postId: fields.postId,
    locale,
  };
}

/**
 * Checks what the browser can check before spending a request (and one of the
 * three messages an hour the rate limit allows). The server repeats every
 * check; this only saves a round trip.
 */
export function checkMessagePayload(payload: MessagePayload): MessageErrorKey | null {
  if (!payload.name || payload.name.length > MESSAGE_LIMITS.name) return "nameLength";
  if (!payload.body || payload.body.length > MESSAGE_LIMITS.body) return "bodyLength";
  if (
    payload.email &&
    (payload.email.length > MESSAGE_LIMITS.email || !EMAIL_PATTERN.test(payload.email))
  ) {
    return "emailInvalid";
  }
  return null;
}

const ERROR_BY_CODE: Record<string, MessageErrorKey> = {
  name_length: "nameLength",
  body_length: "bodyLength",
  email_invalid: "emailInvalid",
  post_invalid: "postNotFound",
  post_not_found: "postNotFound",
  rate_limited: "rateLimited",
  // No dedicated copy — a body over the size limit is as unrecoverable from
  // the sender's point of view as any other server-side rejection.
  payload_too_large: "generic",
};

/** Maps the route's `{ error }` code to a message key; unknown codes read as generic. */
export function messageErrorKey(code: unknown): MessageErrorKey {
  return typeof code === "string" && Object.hasOwn(ERROR_BY_CODE, code)
    ? ERROR_BY_CODE[code]
    : "generic";
}

type FetchLike = (
  input: string,
  init: { method: "POST"; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export async function sendMessage(payload: MessagePayload, fetchImpl: FetchLike): Promise<SendOutcome> {
  const invalid = checkMessagePayload(payload);
  if (invalid) return { ok: false, error: invalid };

  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await fetchImpl("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: "network" };
  }

  if (response.ok) return { ok: true };

  // A proxy error page is HTML, not JSON; that is still a failed send.
  const result: unknown = await response.json().catch(() => null);
  const code = typeof result === "object" && result !== null && "error" in result ? result.error : null;
  return { ok: false, error: messageErrorKey(code) };
}

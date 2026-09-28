import { routing, type Locale } from "@/i18n/routing";
import { isUuid } from "@/lib/shared-fields";

/**
 * Validation for /api/messages, kept pure so every rejection can be tested
 * without a request. Anything that is not the expected type is refused with a
 * code rather than coerced — `String(["x"])` would otherwise sail through.
 */

export const MESSAGE_KINDS = ["contact", "feedback", "content_error"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export type MessageInput = {
  kind: MessageKind;
  name: string;
  email: string | null;
  body: string;
  postId: string | null;
  locale: Locale;
};

type Result =
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; value: MessageInput }
  | { ok: false; error: string };

// Must match the CHECK constraints on public.messages.
const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_BODY = 4000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Postgres text columns reject \u0000 outright (a raw 500 from the insert,
  // after the rate limit has already been spent), so it is refused here as
  // the same "field is wrong" outcome as any other malformed input.
  if (value.includes("\u0000")) return null;
  return value.trim();
}

/**
 * Builds a `mailto:` href for a reader-supplied address.
 *
 * `EMAIL` above only checks shape, not content — `a@b.com?bcc=x&subject=y`
 * passes it, and an unescaped href would let that querystring inject mailto
 * headers into the staff member's mail client. Percent-encoding the whole
 * addr-spec (RFC 6068) keeps it inert while still resolving to the same
 * address.
 */
export function mailtoHref(email: string): string {
  return `mailto:${encodeURIComponent(email)}`;
}

export function parseMessagePayload(payload: unknown): Result {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "invalid_payload" };
  }
  const p = payload as Record<string, unknown>;

  // A real reader never fills a field they cannot see.
  if (typeof p.website === "string" && p.website.trim() !== "") {
    return { ok: true, honeypot: true };
  }

  const kind = text(p.kind);
  if (!kind || !(MESSAGE_KINDS as readonly string[]).includes(kind)) {
    return { ok: false, error: "kind_invalid" };
  }

  const name = text(p.name);
  if (!name || name.length > MAX_NAME) return { ok: false, error: "name_length" };

  const body = text(p.body);
  if (!body || body.length > MAX_BODY) return { ok: false, error: "body_length" };

  const email = p.email === undefined || p.email === null ? "" : text(p.email);
  if (email === null || (email && (email.length > MAX_EMAIL || !EMAIL.test(email)))) {
    return { ok: false, error: "email_invalid" };
  }

  const locale = text(p.locale);
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    return { ok: false, error: "locale_invalid" };
  }

  const postId = p.postId === undefined || p.postId === null ? null : text(p.postId);
  if (postId !== null && !isUuid(postId)) return { ok: false, error: "post_invalid" };

  return {
    ok: true,
    honeypot: false,
    value: {
      kind: kind as MessageKind,
      name,
      email: email || null,
      body,
      postId,
      locale: locale as Locale,
    },
  };
}

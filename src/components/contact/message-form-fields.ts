import type { MessageErrorKey } from "@/lib/contact-client";

export type MessageFormField = "name" | "email" | "body";

/**
 * Which form field a client-side validation error points at, so MessageForm
 * can set aria-invalid and move focus there. contact-client's SendOutcome
 * only carries the error key, not the field, so the mapping lives here.
 *
 * The server-only errors (postNotFound, rateLimited, network, generic) don't
 * name a field — there is nothing on the form to blame — so they map to
 * null and the aria-live message stays the only feedback.
 */
const FIELD_BY_ERROR: Partial<Record<MessageErrorKey, MessageFormField>> = {
  nameLength: "name",
  emailInvalid: "email",
  bodyLength: "body",
};

export function fieldForError(error: MessageErrorKey): MessageFormField | null {
  return FIELD_BY_ERROR[error] ?? null;
}

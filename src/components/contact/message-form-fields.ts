import { EMAIL_PATTERN, MESSAGE_LIMITS, type MessageErrorKey } from "@/lib/contact-client";

export type MessageFormField = "name" | "email" | "body";

/** Every field that failed, so the form can mark them all and list them at once. */
export type MessageFieldErrors = Partial<Record<MessageFormField, MessageErrorKey>>;

/**
 * Checks the whole form in one pass (the server repeats every check). Unlike
 * `checkMessagePayload`, which stops at the first problem, this returns all of
 * them so the reader fixes the form in one go.
 */
export function validateMessageFields(fields: {
  name: string;
  email: string;
  body: string;
}): MessageFieldErrors {
  const name = fields.name.trim();
  const email = fields.email.trim();
  const body = fields.body.trim();
  const errors: MessageFieldErrors = {};

  if (!name || name.length > MESSAGE_LIMITS.name) errors.name = "nameLength";
  if (!body || body.length > MESSAGE_LIMITS.body) errors.body = "bodyLength";
  if (email && (email.length > MESSAGE_LIMITS.email || !EMAIL_PATTERN.test(email))) {
    errors.email = "emailInvalid";
  }
  return errors;
}

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

export type CommentField = "name" | "email" | "body";

export type CommentFieldError = "nameRequired" | "emailInvalid" | "bodyRequired" | "bodyTooLong";

export const MAX_COMMENT_LENGTH = 2000;

/** The client mirror of the route's own check, so the reader hears it here first. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Every problem with a comment at once, so the form can mark all fields in one go. */
export function validateComment(input: {
  name: string;
  email: string;
  body: string;
}): Partial<Record<CommentField, CommentFieldError>> {
  const name = input.name.trim();
  const email = input.email.trim();
  const body = input.body.trim();
  const errors: Partial<Record<CommentField, CommentFieldError>> = {};

  if (!name) errors.name = "nameRequired";
  if (email && !EMAIL_RE.test(email)) errors.email = "emailInvalid";
  if (!body) errors.body = "bodyRequired";
  else if (body.length > MAX_COMMENT_LENGTH) errors.body = "bodyTooLong";

  return errors;
}

const FIELD_ORDER: CommentField[] = ["name", "email", "body"];

/** The field to focus: the first invalid one in reading order. */
export function firstInvalidField(
  errors: Partial<Record<CommentField, unknown>>
): CommentField | null {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/** The letter in the avatar: the first character, whole even when it is an emoji. */
export function commentInitial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase() : "?";
}

/**
 * Ids in `current` that were not in the previous render, in order. `previous`
 * is `null` before the first render, when nothing should animate; an empty set
 * means "rendered, but no comments", so a first comment arriving later is new.
 */
export function freshCommentIds(
  previous: ReadonlySet<string> | null,
  current: string[]
): string[] {
  if (!previous) return [];
  return current.filter((id) => !previous.has(id));
}

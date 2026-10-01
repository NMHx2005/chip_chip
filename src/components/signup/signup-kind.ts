import type { MessageKind } from "@/lib/contact-message";

/**
 * The sign-up types offered on /dang-ky and embedded on the About page. The
 * value is already the wire `kind`, but the list and the mapping live here so
 * the form and the API cannot drift apart (a test holds it to MESSAGE_KINDS).
 */
export const SIGNUP_TYPES = ["volunteer", "survey", "webinar", "competition"] as const;
export type SignupType = (typeof SIGNUP_TYPES)[number];

export function signupKindToMessageKind(type: SignupType): MessageKind {
  return type;
}

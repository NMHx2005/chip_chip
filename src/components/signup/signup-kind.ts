import type { StaticPathname } from "@/i18n/routing";
import type { MessageKind } from "@/lib/contact-message";

/**
 * The sign-up types, one page each under /dang-ky. The value is already the
 * wire `kind`, but the list, the mapping and the routes live here so the form,
 * the pages and the API cannot drift apart (tests hold them together).
 */
export const SIGNUP_TYPES = ["volunteer", "survey", "webinar", "competition"] as const;
export type SignupType = (typeof SIGNUP_TYPES)[number];

export function signupKindToMessageKind(type: SignupType): MessageKind {
  return type;
}

/** The page each type signs up on (declared in src/i18n/routing.ts). */
export const SIGNUP_TYPE_PATHS: Record<SignupType, StaticPathname> = {
  volunteer: "/dang-ky/tinh-nguyen",
  survey: "/dang-ky/khao-sat",
  webinar: "/dang-ky/webinar",
  competition: "/dang-ky/cuoc-thi",
};

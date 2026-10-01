import { describe, expect, it } from "vitest";
import {
  SIGNUP_TYPES,
  SIGNUP_TYPE_PATHS,
  signupKindToMessageKind,
} from "@/components/signup/signup-kind";
import { routing } from "@/i18n/routing";
import { MESSAGE_KINDS } from "@/lib/contact-message";

describe("sign-up kinds", () => {
  it("maps every sign-up type to a kind the messages API accepts", () => {
    for (const type of SIGNUP_TYPES) {
      expect(MESSAGE_KINDS).toContain(signupKindToMessageKind(type));
    }
  });

  it("offers the four types once each", () => {
    expect(SIGNUP_TYPES).toHaveLength(4);
    expect(new Set(SIGNUP_TYPES).size).toBe(4);
  });

  it("points every type at its own route, at the right URLs", () => {
    const expected = {
      volunteer: { vi: "/dang-ky/tinh-nguyen", en: "/sign-up/volunteer" },
      survey: { vi: "/dang-ky/khao-sat", en: "/sign-up/survey" },
      webinar: { vi: "/dang-ky/webinar", en: "/sign-up/webinar" },
      competition: { vi: "/dang-ky/cuoc-thi", en: "/sign-up/competition" },
    } as const;

    for (const type of SIGNUP_TYPES) {
      expect(routing.pathnames[SIGNUP_TYPE_PATHS[type]]).toEqual(expected[type]);
    }
  });
});

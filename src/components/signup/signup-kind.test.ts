import { describe, expect, it } from "vitest";
import { SIGNUP_TYPES, signupKindToMessageKind } from "@/components/signup/signup-kind";
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
});

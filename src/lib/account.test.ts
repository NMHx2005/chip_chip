import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validatePasswordChange } from "@/lib/account";

const base = { password: "matkhau-moi-2026", confirm: "matkhau-moi-2026" };

describe("validatePasswordChange", () => {
  it("accepts a matching pair", () => {
    expect(validatePasswordChange(base)).toBeNull();
  });

  it("asks for the current password only when changing one while signed in", () => {
    expect(validatePasswordChange(base)).toBeNull();
    expect(validatePasswordChange({ ...base, requireCurrent: true })).toBe("current_required");
    expect(
      validatePasswordChange({ ...base, requireCurrent: true, current: "   " })
    ).toBe("current_required");
  });

  it("refuses a short password", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validatePasswordChange({ password: short, confirm: short })).toBe("password_short");
  });

  it("refuses the password the account already has", () => {
    expect(
      validatePasswordChange({ ...base, requireCurrent: true, current: base.password })
    ).toBe("password_unchanged");
  });

  it("refuses a mismatched confirmation", () => {
    expect(validatePasswordChange({ password: "matkhau-moi-2026", confirm: "khac" })).toBe(
      "confirm_mismatch"
    );
  });

  it("reports the missing current password before anything else", () => {
    // The most actionable problem first: without the current password, the
    // other checks cannot even be attempted.
    expect(
      validatePasswordChange({
        password: "x",
        confirm: "y",
        requireCurrent: true,
      })
    ).toBe("current_required");
  });
});

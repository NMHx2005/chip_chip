import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  RESET_PASSWORD_PATH,
  safeRedirectTarget,
  validatePasswordChange,
} from "@/lib/account";

const ORIGIN = "https://projectchipchip.org";

describe("safeRedirectTarget", () => {
  it("follows a same-origin path", () => {
    expect(safeRedirectTarget("/admin/doi-mat-khau", ORIGIN).href).toBe(
      `${ORIGIN}/admin/doi-mat-khau`
    );
  });

  it("falls back to the reset page when nothing is asked for", () => {
    expect(safeRedirectTarget(null, ORIGIN).href).toBe(`${ORIGIN}${RESET_PASSWORD_PATH}`);
    expect(safeRedirectTarget("", ORIGIN).href).toBe(`${ORIGIN}${RESET_PASSWORD_PATH}`);
  });

  it("refuses to leave the site", () => {
    // The parameter travels through an email, so it is not trusted.
    for (const hostile of [
      "https://evil.example",
      "//evil.example",
      "\\\\evil.example",
      "/\\evil.example",
      "https://projectchipchip.org.evil.example",
    ]) {
      expect(safeRedirectTarget(hostile, ORIGIN).origin).toBe(ORIGIN);
      expect(safeRedirectTarget(hostile, ORIGIN).href).toBe(`${ORIGIN}${RESET_PASSWORD_PATH}`);
    }
  });
});

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

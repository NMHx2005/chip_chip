import { describe, expect, it } from "vitest";
import { TEMP_PASSWORD_LENGTH, tempPassword } from "@/lib/staff";

describe("tempPassword", () => {
  it("is long enough to be worth changing", () => {
    expect(tempPassword()).toHaveLength(TEMP_PASSWORD_LENGTH);
    expect(TEMP_PASSWORD_LENGTH).toBeGreaterThanOrEqual(12);
  });

  it("honours a custom length", () => {
    expect(tempPassword(24)).toHaveLength(24);
  });

  it("uses only the unambiguous alphabet", () => {
    // The point of the alphabet: nothing a reader could confuse when copying
    // the password by hand. 0/O, 1/l/I are deliberately absent.
    const allowed = /^[A-HJ-NP-Za-km-z2-9!@#%*]+$/;
    for (let i = 0; i < 20; i += 1) {
      expect(tempPassword()).toMatch(allowed);
    }
  });

  it("does not repeat itself", () => {
    const seen = new Set(Array.from({ length: 20 }, () => tempPassword()));
    expect(seen.size).toBe(20);
  });
});

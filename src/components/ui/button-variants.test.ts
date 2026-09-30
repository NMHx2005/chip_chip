import { describe, expect, it } from "vitest";
import { FOCUS_RING } from "@/components/ui/button-variants";
import { contrastRatio } from "@/lib/contrast";

// WCAG 1.4.11 asks for 3:1 between a focus indicator and what it sits on.
describe("Button focus rings", () => {
  for (const [variant, ring] of Object.entries(FOCUS_RING)) {
    it(`is visible against the ${variant} surface`, () => {
      expect(contrastRatio(ring.hex, ring.surface), variant).toBeGreaterThanOrEqual(3);
    });
  }

  it("uses a light ring on the dark panel", () => {
    expect(FOCUS_RING.onDark.class).toContain("outline-white");
  });
});

import { describe, expect, it } from "vitest";
import { HINT_COLORS } from "@/components/search/search-field-variants";
import { contrastRatio } from "@/lib/contrast";

// The hint sits on the page (light) and inside the dark mobile drawer.
describe("SearchField hint colours", () => {
  for (const [variant, hint] of Object.entries(HINT_COLORS)) {
    it(`is readable on the ${variant} surface`, () => {
      expect(contrastRatio(hint.hex, hint.surface)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

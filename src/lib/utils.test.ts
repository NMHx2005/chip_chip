import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

// tailwind-merge 3 is built for Tailwind 4. Without configuration it reads our
// custom type tokens (text-h1, text-h2) as colours and `outline` as a width, so
// it silently drops classes when a component passes them through cn().
describe("cn keeps the design tokens", () => {
  it("does not treat the custom font-size tokens as colours", () => {
    expect(cn("text-h1 text-text")).toBe("text-h1 text-text");
    expect(cn("text-h1 md:text-h1-lg text-text")).toBe("text-h1 md:text-h1-lg text-text");
    expect(cn("text-h2 md:text-h2-lg text-text")).toBe("text-h2 md:text-h2-lg text-text");
  });

  it("still lets a later font-size replace an earlier one", () => {
    expect(cn("text-h1 text-h2")).toBe("text-h2");
    expect(cn("text-sm text-h1")).toBe("text-h1");
  });

  it("keeps the outline style next to an outline width", () => {
    expect(cn("focus-visible:outline focus-visible:outline-2")).toBe(
      "focus-visible:outline focus-visible:outline-2"
    );
  });
});

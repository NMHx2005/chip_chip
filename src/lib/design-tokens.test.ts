import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";
import { contrastRatio } from "@/lib/contrast";
import { EASE_STANDARD } from "@/components/motion/tokens";

const colors = config.theme!.extend!.colors as Record<string, string>;

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("colour tokens meet their contrast targets", () => {
  it("keeps the field border readable on white and on the grey page", () => {
    expect(contrastRatio(colors.field, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.field, colors.bg)).toBeGreaterThanOrEqual(3);
  });

  it("keeps white text on both primary button states above 7:1", () => {
    expect(contrastRatio("#FFFFFF", colors.primary)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio("#FFFFFF", colors["primary-hover"])).toBeGreaterThanOrEqual(7);
  });

  it("keeps white text on the busy button above 4.5:1", () => {
    expect(contrastRatio("#FFFFFF", colors.disabled)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps error text readable on its soft background and on white", () => {
    expect(contrastRatio(colors.err, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors["err-ink"], colors["err-soft"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps accent text readable on the success background", () => {
    expect(contrastRatio(colors.accent, colors["ok-soft"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("motion tokens stay in sync with Tailwind", () => {
  it("uses the same easing curve in CSS and in framer-motion", () => {
    const easing = config.theme!.extend!.transitionTimingFunction as Record<string, string>;
    expect(easing.standard).toBe(`cubic-bezier(${EASE_STANDARD.join(", ")})`);
  });
});

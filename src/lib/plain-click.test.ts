import { describe, expect, it } from "vitest";
import { classifyCardClick, EXPAND_MS, isPlainLeftClick } from "@/lib/plain-click";

const plain = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
};

describe("isPlainLeftClick", () => {
  it("takes over an unmodified primary click", () => {
    expect(isPlainLeftClick(plain)).toBe(true);
  });

  it.each([
    ["Cmd-click", { metaKey: true }],
    ["Ctrl-click", { ctrlKey: true }],
    ["Shift-click", { shiftKey: true }],
    ["Alt-click", { altKey: true }],
    ["middle click", { button: 1 }],
    ["right click", { button: 2 }],
    ["an already handled click", { defaultPrevented: true }],
  ])("leaves %s to the browser", (_, change) => {
    expect(isPlainLeftClick({ ...plain, ...change })).toBe(false);
  });
});

describe("EXPAND_MS", () => {
  it("stays inside the 350–450 ms window", () => {
    expect(EXPAND_MS).toBeGreaterThanOrEqual(350);
    expect(EXPAND_MS).toBeLessThanOrEqual(450);
  });
});

describe("classifyCardClick", () => {
  it("expands on a plain click with no animation already running", () => {
    expect(
      classifyCardClick(plain, { prefersReducedMotion: false, alreadyExpanding: false })
    ).toBe("expand");
  });

  it("ignores a non-plain click (left to the browser) when nothing is expanding", () => {
    expect(
      classifyCardClick(
        { ...plain, metaKey: true },
        { prefersReducedMotion: false, alreadyExpanding: false }
      )
    ).toBe("ignore");
  });

  it("ignores a plain click when the reader prefers reduced motion", () => {
    expect(
      classifyCardClick(plain, { prefersReducedMotion: true, alreadyExpanding: false })
    ).toBe("ignore");
  });

  // Regression: a repeat activation while the panel is still growing used to
  // fall through to "ignore" without calling preventDefault, so next/link
  // navigated immediately and the pending timer pushed the same href again a
  // moment later. It must be swallowed instead.
  it("swallows a repeat activation while the panel is already growing", () => {
    expect(
      classifyCardClick(plain, { prefersReducedMotion: false, alreadyExpanding: true })
    ).toBe("swallow");
  });

  it("swallows a repeat activation even for a non-plain click", () => {
    expect(
      classifyCardClick(
        { ...plain, metaKey: true },
        { prefersReducedMotion: true, alreadyExpanding: true }
      )
    ).toBe("swallow");
  });
});

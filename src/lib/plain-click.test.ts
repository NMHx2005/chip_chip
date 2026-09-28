import { describe, expect, it } from "vitest";
import { EXPAND_MS, isPlainLeftClick } from "@/lib/plain-click";

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

import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASE_SCROLL_REVEAL,
  EASE_STANDARD,
  REVEAL,
  STAGGER,
  VIEWPORT_ONCE,
} from "@/components/motion/tokens";

describe("motion tokens", () => {
  it("giữ đúng easing chữ ký của bản gốc", () => {
    expect(EASE_STANDARD).toEqual([0.25, 0.1, 0.25, 1]);
    expect(EASE_SCROLL_REVEAL).toEqual([0.16, 1, 0.3, 1]);
  });

  it("giữ mọi thời lượng xuất hiện trong dải 0.5–0.7s", () => {
    const entrance = [DURATION.base, DURATION.slow, DURATION.reveal];
    for (const d of entrance) {
      expect(d).toBeGreaterThanOrEqual(0.5);
      expect(d).toBeLessThanOrEqual(0.7);
    }
  });

  it("giữ nhịp stagger của bản gốc", () => {
    expect(STAGGER.step).toBe(0.12);
    expect(STAGGER.delay).toBe(0.1);
  });

  it("kích hoạt sớm 100px và chỉ chạy một lần", () => {
    expect(VIEWPORT_ONCE).toEqual({ once: true, margin: "-100px" });
  });

  it("giữ thông số dựng đứng 3D", () => {
    expect(REVEAL.rotateXDeg).toBe(55);
    expect(REVEAL.scale).toBe(0.72);
    expect(REVEAL.perspectivePx).toBe(1600);
    expect(REVEAL.offset).toEqual(["start end", "center 65%"]);
  });
});

import { describe, expect, it } from "vitest";
import { EASE_STANDARD, STAGGER } from "@/components/motion/tokens";
import {
  fadeIn,
  fadeUp,
  fadeUpScale,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  staggerItemScale,
} from "@/components/motion/variants";

/** Reads the transition off a variant's `visible` state. */
const transitionOf = (v: Record<string, unknown>) =>
  (v.visible as { transition: { duration: number; ease: unknown } }).transition;

describe("variants", () => {
  it("mọi variant xuất hiện dùng chung một easing", () => {
    for (const v of [fadeUp, fadeIn, fadeUpScale, slideInLeft, slideInRight]) {
      expect(transitionOf(v).ease).toEqual(EASE_STANDARD);
    }
  });

  it("mọi variant xuất hiện nằm trong dải thời lượng cho phép", () => {
    for (const v of [fadeUp, fadeIn, fadeUpScale, slideInLeft, slideInRight]) {
      expect(transitionOf(v).duration).toBeGreaterThanOrEqual(0.5);
      expect(transitionOf(v).duration).toBeLessThanOrEqual(0.7);
    }
  });

  it("fadeUp trượt lên 24px", () => {
    expect(fadeUp.hidden).toMatchObject({ opacity: 0, y: 24 });
    expect(fadeUp.visible).toMatchObject({ opacity: 1, y: 0 });
  });

  it("fadeUpScale ẩn với opacity 0, trượt 32px và co còn 96%", () => {
    expect(fadeUpScale.hidden).toEqual({ opacity: 0, y: 32, scale: 0.96 });
  });

  it("slideInLeft và slideInRight đối xứng", () => {
    expect((slideInLeft.hidden as { x: number }).x).toBe(-32);
    expect((slideInRight.hidden as { x: number }).x).toBe(32);
  });

  it("staggerContainer không tự animate, chỉ điều phối con", () => {
    expect(staggerContainer.hidden).toEqual({});
    expect(
      (staggerContainer.visible as { transition: Record<string, number> })
        .transition
    ).toMatchObject({ staggerChildren: 0.12, delayChildren: 0.1 });
  });

  it("staggerContainerFast dùng nhịp nhanh hơn staggerContainer", () => {
    expect(staggerContainerFast.hidden).toEqual({});
    expect(
      (staggerContainerFast.visible as { transition: Record<string, number> })
        .transition
    ).toMatchObject({
      staggerChildren: STAGGER.fastStep,
      delayChildren: STAGGER.fastDelay,
    });
  });

  it("staggerContainerSlow dùng nhịp chậm hơn staggerContainer", () => {
    expect(staggerContainerSlow.hidden).toEqual({});
    expect(
      (staggerContainerSlow.visible as { transition: Record<string, number> })
        .transition
    ).toMatchObject({
      staggerChildren: STAGGER.slowStep,
      delayChildren: STAGGER.slowDelay,
    });
  });

  it("staggerItem trượt ngắn hơn fadeUp để nhịp dãy không bị lê thê", () => {
    expect((staggerItem.hidden as { y: number }).y).toBeLessThan(
      (fadeUp.hidden as { y: number }).y
    );
  });

  it("staggerItemScale ẩn với opacity 0, trượt 24px và co còn 95%", () => {
    expect(staggerItemScale.hidden).toEqual({ opacity: 0, y: 24, scale: 0.95 });
  });
});

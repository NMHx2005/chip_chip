# Giai đoạn 1 — Thư viện chuyển động và bộ khung trang

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng `src/components/motion/` chứa mọi nguyên thuỷ chuyển động port từ Strike Robot, cộng bộ khung trang hai tầng, và một trang trưng bày nội bộ để đối chiếu từng hiệu ứng với bản gốc.

**Architecture:** Một tệp `tokens.ts` giữ mọi hằng số; mọi module khác đọc từ đó nên toàn site chỉ có một easing và một dải thời lượng. Logic thuần được tách khỏi component để kiểm thử được bằng Vitest; phần hình ảnh kiểm chứng bằng trình duyệt trên trang trưng bày. Kết thúc giai đoạn, giao diện công khai chưa đổi.

**Tech Stack:** Next.js 14.2 App Router · TypeScript · Tailwind 3.4 · framer-motion 12 · lenis 1.3 · Vitest 2

**Spec:** `docs/superpowers/specs/2026-09-13-redesign-chuyen-dong-design.md`

## Global Constraints

- Easing chuẩn cho mọi hiệu ứng xuất hiện: `[0.25, 0.1, 0.25, 1]`. Không component nào được tự định nghĩa easing khác trừ khi spec ghi rõ.
- Thời lượng hiệu ứng xuất hiện nằm trong dải `0.5s–0.7s`, mặc định `0.6s`.
- Stagger: `staggerChildren: 0.12`, `delayChildren: 0.1`.
- Mốc kích hoạt khi cuộn: `viewport={{ once: true, margin: "-100px" }}`.
- Mọi component có chuyển động phải kiểm tra `useReducedMotion()` và có đường thoát tĩnh.
- Mọi hiệu ứng hover phải có đường thay thế bằng chạm trên thiết bị cảm ứng.
- Comment trong code viết bằng tiếng Anh. Chuỗi hiển thị cho người dùng đi qua `next-intl`.
- Không sửa migration đã áp, không đổi RLS, không đụng `/api/comments`.
- Không cài `vanilla-tilt`, không cài thư viện băng chuyền.
- Sau mỗi task: `npx tsc --noEmit` và `npx next lint --max-warnings=0` phải sạch.

## Ghi chú về kiểm thử

framer-motion không chạy animation trong jsdom, nên khẳng định "phần tử đã mờ dần" trong unit test là vô nghĩa. Plan này vì vậy:

- **Kiểm thử bằng Vitest** phần logic thuần: giá trị token, hình dạng variants, hàm băm tất định, máy trạng thái chạm-giữ, phép ánh xạ vị trí cuộn. Các logic này được **tách khỏi component** — đó cũng là thiết kế đúng, không phải chiều theo test.
- **Kiểm chứng bằng trình duyệt thật** phần hình ảnh, qua trang trưng bày ở Task 12, ở ba bề rộng 390 / 768 / 1440.

Không thêm jsdom hay testing-library trong giai đoạn này.

## Cấu trúc tệp

| Tệp | Trách nhiệm |
|---|---|
| `src/components/motion/tokens.ts` | Hằng số chuyển động. Nguồn sự thật duy nhất. |
| `src/components/motion/variants.ts` | Variants framer-motion dựng từ tokens |
| `src/components/motion/AnimatedSection.tsx` | Bọc section, hiện khi cuộn tới |
| `src/components/motion/ScrollReveal3D.tsx` | Nghiêng 3D dựng đứng theo cuộn |
| `src/components/motion/StickyBackdrop.tsx` | Nền dán cố định `100dvh` |
| `src/components/motion/MainSection.tsx` | Bọc nửa dưới trang, gradient riêng |
| `src/components/motion/letterDance.ts` | Logic thuần của hiệu ứng chữ nhảy |
| `src/components/motion/AnimatedButtonLabel.tsx` | Component dùng `letterDance.ts` |
| `src/components/motion/fillProgress.ts` | Phép ánh xạ vị trí cuộn sang tiến độ 0–1 |
| `src/components/motion/SceneFillOverlay.tsx` | Lớp phủ dâng, dùng `fillProgress.ts` |
| `src/components/motion/TiltCard.tsx` | Nghiêng 3D khi hover bằng CSS |
| `src/components/motion/holdToReveal.ts` | Máy trạng thái chạm-giữ, thuần |
| `src/components/motion/useHoldToReveal.ts` | Hook React bọc máy trạng thái |
| `src/components/motion/useSharedScrollProgress.ts` | Một mốc cuộn dùng chung nhiều phần tử |
| `src/components/motion/DriftTextPath.tsx` | Chữ trôi dọc cung SVG |
| `src/components/motion/index.ts` | Điểm xuất khẩu gộp |
| `src/app/motion-gallery/page.tsx` | Trang trưng bày nội bộ |

---

### Task 1: Token chuyển động

**Files:**
- Create: `src/components/motion/tokens.ts`
- Test: `src/components/motion/tokens.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `EASE_STANDARD: readonly [number, number, number, number]`, `EASE_SCROLL_REVEAL`, `DURATION: { fast: 0.25, base: 0.6, slow: 0.7, reveal: 0.5 }`, `STAGGER: { step: 0.12, delay: 0.1, fastStep: 0.07, fastDelay: 0.05, slowStep: 0.18, slowDelay: 0.15 }`, `VIEWPORT_ONCE: { once: true, margin: "-100px" }`, `REVEAL: { rotateXDeg: 55, scale: 0.72, perspectivePx: 1600, offset: ["start end", "center 65%"] }`, `STAR_SPEED: { idle: "5s", hover: "2s" }`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/components/motion/tokens.test.ts
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
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Chạy: `npx vitest run src/components/motion/tokens.test.ts`
Kỳ vọng: FAIL — không phân giải được `@/components/motion/tokens`

- [ ] **Step 3: Viết cài đặt tối thiểu**

```ts
// src/components/motion/tokens.ts
/**
 * Motion constants for the whole site.
 *
 * Every animated component reads from here. The point is not tidiness: a site
 * where each component picks its own easing reads as a collection of parts
 * rather than one design, and that was the main complaint about the previous
 * build. Values are copied from Strike_Robot_LandingPage_Desing verbatim.
 */

/** Used by every entrance animation. The signature easing of the design. */
export const EASE_STANDARD = [0.25, 0.1, 0.25, 1] as const;

/**
 * Declared by the original for the 3D scroll reveal but never actually applied
 * there — the transform runs linearly against scroll progress. Kept for parity
 * and for anyone who later wants a non-linear reveal.
 */
export const EASE_SCROLL_REVEAL = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  /** Returning to rest — deliberately quicker than leaving it. */
  fast: 0.25,
  base: 0.6,
  slow: 0.7,
  reveal: 0.5,
} as const;

export const STAGGER = {
  step: 0.12,
  delay: 0.1,
  fastStep: 0.07,
  fastDelay: 0.05,
  slowStep: 0.18,
  slowDelay: 0.15,
} as const;

/**
 * Fires 100px before the element truly enters the viewport, so the animation
 * is already underway by the time the reader looks at it.
 */
export const VIEWPORT_ONCE = { once: true, margin: "-100px" } as const;

export const REVEAL = {
  rotateXDeg: 55,
  scale: 0.72,
  perspectivePx: 1600,
  /** Starts when the top of the target meets the viewport bottom; ends when
   *  its centre reaches 65% down the viewport. */
  offset: ["start end", "center 65%"],
} as const;

export const STAR_SPEED = { idle: "5s", hover: "2s" } as const;
```

- [ ] **Step 4: Chạy test để chắc chắn nó đạt**

Chạy: `npx vitest run src/components/motion/tokens.test.ts`
Kỳ vọng: PASS, 5 test

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/tokens.ts src/components/motion/tokens.test.ts
git commit -m "feat(motion): token chuyển động dùng chung toàn site"
```

---

### Task 2: Variants framer-motion

**Files:**
- Create: `src/components/motion/variants.ts`
- Test: `src/components/motion/variants.test.ts`

**Interfaces:**
- Consumes: `EASE_STANDARD`, `DURATION`, `STAGGER` từ `tokens.ts`
- Produces: `fadeUp`, `fadeIn`, `fadeUpScale`, `slideInLeft`, `slideInRight`, `staggerContainer`, `staggerContainerFast`, `staggerContainerSlow`, `staggerItem`, `staggerItemScale` — tất cả kiểu `Variants` của framer-motion, dùng với `initial="hidden"` và `whileInView="visible"`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/components/motion/variants.test.ts
import { describe, expect, it } from "vitest";
import { EASE_STANDARD } from "@/components/motion/tokens";
import {
  fadeIn,
  fadeUp,
  fadeUpScale,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
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

  it("staggerItem trượt ngắn hơn fadeUp để nhịp dãy không bị lê thê", () => {
    expect((staggerItem.hidden as { y: number }).y).toBeLessThan(
      (fadeUp.hidden as { y: number }).y
    );
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Chạy: `npx vitest run src/components/motion/variants.test.ts`
Kỳ vọng: FAIL — không phân giải được `@/components/motion/variants`

- [ ] **Step 3: Viết cài đặt tối thiểu**

```ts
// src/components/motion/variants.ts
import type { Variants } from "framer-motion";
import { DURATION, EASE_STANDARD, STAGGER } from "@/components/motion/tokens";

/**
 * Entrance variants, ported from Strike_Robot_LandingPage_Desing.
 *
 * Use as `initial="hidden"` + `whileInView="visible"` with `VIEWPORT_ONCE`.
 * A parent carrying a stagger container propagates the state to children
 * automatically — children only need their own `variants`.
 */

const entrance = (duration: number) => ({
  duration,
  ease: EASE_STANDARD,
});

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: entrance(DURATION.base) },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: entrance(DURATION.reveal) },
};

export const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: entrance(0.65) },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: entrance(DURATION.base) },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: entrance(DURATION.base) },
};

const container = (staggerChildren: number, delayChildren: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

export const staggerContainer = container(STAGGER.step, STAGGER.delay);
export const staggerContainerFast = container(
  STAGGER.fastStep,
  STAGGER.fastDelay
);
export const staggerContainerSlow = container(
  STAGGER.slowStep,
  STAGGER.slowDelay
);

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: entrance(0.55) },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: entrance(DURATION.base) },
};
```

- [ ] **Step 4: Chạy test để chắc chắn nó đạt**

Chạy: `npx vitest run src/components/motion/variants.test.ts`
Kỳ vọng: PASS, 6 test

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/variants.ts src/components/motion/variants.test.ts
git commit -m "feat(motion): variants xuất hiện dựng từ token chung"
```

---

### Task 3: AnimatedSection

**Files:**
- Create: `src/components/motion/AnimatedSection.tsx`

**Interfaces:**
- Consumes: `DURATION`, `EASE_STANDARD`, `VIEWPORT_ONCE` từ `tokens.ts`; `cn` từ `@/lib/utils`
- Produces: `AnimatedSection({ children, className?, id?, delay? }): JSX.Element` — render `<motion.section>`

Không có test Vitest: component này chỉ là lớp bọc mỏng quanh `motion.section`, và framer-motion không chạy animation trong jsdom nên test sẽ không khẳng định được gì thật. Kiểm chứng ở Task 12 trong trình duyệt.

- [ ] **Step 1: Viết component**

```tsx
// src/components/motion/AnimatedSection.tsx
"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  DURATION,
  EASE_STANDARD,
  VIEWPORT_ONCE,
} from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * Section wrapper that fades and lifts into place the first time it is
 * scrolled to.
 *
 * `once: true` matters: a section that re-animates every time it scrolls back
 * into view reads as a gimmick rather than as polish.
 */
export function AnimatedSection({
  children,
  className,
  id,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Seconds to wait before starting — for staggering sibling sections. */
  delay?: number;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: DURATION.slow, ease: EASE_STANDARD, delay }}
      className={cn("relative", className)}
    >
      {children}
    </motion.section>
  );
}
```

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch cả hai

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/AnimatedSection.tsx
git commit -m "feat(motion): AnimatedSection hiện dần khi cuộn tới"
```

---

### Task 4: ScrollReveal3D

**Files:**
- Create: `src/components/motion/ScrollReveal3D.tsx`

**Interfaces:**
- Consumes: `REVEAL` từ `tokens.ts`; `cn` từ `@/lib/utils`
- Produces: `ScrollReveal3D({ children, className?, targetRef? }): JSX.Element`. Nhận `targetRef` để chia sẻ mốc cuộn với Task 9.

Đổi tên từ `ScrollVideoReveal` của bản gốc vì hiệu ứng không riêng cho video.

- [ ] **Step 1: Viết component**

```tsx
// src/components/motion/ScrollReveal3D.tsx
"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { REVEAL } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * Tilts its content up as the reader scrolls to it: lying back at 55° and
 * scaled to 72%, standing upright at full size by the time it is on screen.
 *
 * `transformOrigin: 50% 100%` is what sells it — the element hinges on its own
 * bottom edge like a lid opening, rather than spinning about its centre.
 *
 * The transform maps linearly onto scroll progress with no easing, matching
 * the original. Easing here would fight the reader's own scroll speed.
 */
export function ScrollReveal3D({
  children,
  className,
  targetRef,
}: {
  children: ReactNode;
  className?: string;
  /** Share a scroll timeline with other elements; omit to measure itself. */
  targetRef?: RefObject<HTMLDivElement | null>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const internalRef = useRef<HTMLDivElement | null>(null);
  const containerRef = targetRef ?? internalRef;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: REVEAL.offset as unknown as ["start end", "center 65%"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [REVEAL.rotateXDeg, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [REVEAL.scale, 1]);

  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={cn("w-full", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ perspective: `${REVEAL.perspectivePx}px` }}
    >
      <motion.div
        style={{
          rotateX,
          scale,
          transformOrigin: "50% 100%",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/ScrollReveal3D.tsx
git commit -m "feat(motion): ScrollReveal3D dựng đứng theo vị trí cuộn"
```

---

### Task 5: Mốc cuộn dùng chung

**Files:**
- Create: `src/components/motion/useSharedScrollProgress.ts`

**Interfaces:**
- Consumes: `REVEAL.offset` từ `tokens.ts`
- Produces: `useSharedScrollProgress(): { targetRef: RefObject<HTMLDivElement | null>, scrollYProgress: MotionValue<number> }`

Đây là chi tiết dễ bỏ sót nhất của bản gốc: tiêu đề hero co mờ theo **mốc cuộn của khối video**, không phải của chính nó. Nhờ vậy hai chuyển động khớp nhịp.

- [ ] **Step 1: Viết hook**

```ts
// src/components/motion/useSharedScrollProgress.ts
"use client";

import { useRef } from "react";
import { useScroll, type MotionValue } from "framer-motion";
import { REVEAL } from "@/components/motion/tokens";

/**
 * One scroll timeline that several elements can read.
 *
 * The hero title shrinks and fades against the *video's* position, not its
 * own. Measuring each separately would let them drift apart, and the drift is
 * exactly what makes a page feel assembled rather than composed.
 *
 * Attach `targetRef` to the element that owns the timeline, then feed
 * `scrollYProgress` into `useTransform` wherever it is needed.
 */
export function useSharedScrollProgress(): {
  targetRef: React.RefObject<HTMLDivElement | null>;
  scrollYProgress: MotionValue<number>;
} {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: REVEAL.offset as unknown as ["start end", "center 65%"],
  });

  return { targetRef, scrollYProgress };
}
```

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/useSharedScrollProgress.ts
git commit -m "feat(motion): mốc cuộn dùng chung cho tiêu đề và video"
```

---

### Task 6: Logic chữ nhảy

**Files:**
- Create: `src/components/motion/letterDance.ts`
- Test: `src/components/motion/letterDance.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `pseudoRand(seed: number): number`, `type LetterMeta = { y: number; scale: number; rotate: number; opacity: number; delay: number }`, `buildLetterMeta(text: string): LetterMeta[]`

Tách khỏi component vì đây là phần duy nhất kiểm thử được, và tính tất định của nó là điều đáng bảo vệ: cùng một nhãn phải nhảy giống hệt nhau mỗi lần hover.

- [ ] **Step 1: Viết test thất bại**

```ts
// src/components/motion/letterDance.test.ts
import { describe, expect, it } from "vitest";
import { buildLetterMeta, pseudoRand } from "@/components/motion/letterDance";

describe("pseudoRand", () => {
  it("luôn trả về cùng giá trị cho cùng hạt giống", () => {
    expect(pseudoRand(7)).toBe(pseudoRand(7));
  });

  it("nằm trong khoảng [0, 1)", () => {
    for (let i = 0; i < 100; i += 1) {
      const v = pseudoRand(i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("cho giá trị khác nhau với hạt giống khác nhau", () => {
    expect(pseudoRand(1)).not.toBe(pseudoRand(2));
  });
});

describe("buildLetterMeta", () => {
  it("trả về đúng một mục cho mỗi ký tự", () => {
    expect(buildLetterMeta("Tham gia")).toHaveLength(8);
  });

  it("để dấu cách đứng yên", () => {
    const meta = buildLetterMeta("a b");
    expect(meta[1]).toEqual({ y: 0, scale: 1, rotate: 0, opacity: 1, delay: 0 });
  });

  it("giữ mọi thông số trong biên đã định", () => {
    for (const m of buildLetterMeta("Tìm hiểu ngay")) {
      expect(m.y).toBeGreaterThanOrEqual(-4);
      expect(m.y).toBeLessThanOrEqual(0);
      expect(m.scale).toBeGreaterThanOrEqual(1);
      expect(m.scale).toBeLessThanOrEqual(1.45);
      expect(Math.abs(m.rotate)).toBeLessThanOrEqual(12);
      expect(m.opacity).toBeGreaterThanOrEqual(0.7);
      expect(m.opacity).toBeLessThanOrEqual(1);
      expect(m.delay).toBeGreaterThanOrEqual(0);
      expect(m.delay).toBeLessThanOrEqual(0.08);
    }
  });

  it("cho kết quả giống hệt nhau giữa các lần gọi", () => {
    expect(buildLetterMeta("Chíp Chíp")).toEqual(buildLetterMeta("Chíp Chíp"));
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Chạy: `npx vitest run src/components/motion/letterDance.test.ts`
Kỳ vọng: FAIL — không phân giải được `@/components/motion/letterDance`

- [ ] **Step 3: Viết cài đặt tối thiểu**

```ts
// src/components/motion/letterDance.ts
/**
 * Per-letter motion for the button hover effect.
 *
 * The jitter is hashed from each letter's index rather than drawn at random,
 * so a given label dances identically every time it is hovered. Random values
 * would make the button feel unreliable instead of alive.
 */

export type LetterMeta = {
  /** Vertical lift in px, negative is up. */
  y: number;
  scale: number;
  /** Degrees, signed. */
  rotate: number;
  opacity: number;
  /** Seconds of phase offset, so letters do not move in lockstep. */
  delay: number;
};

/** Deterministic hash in [0, 1). The classic sine-fract trick from GLSL. */
export function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function buildLetterMeta(text: string): LetterMeta[] {
  return text.split("").map((char, i) => {
    if (char === " ") {
      return { y: 0, scale: 1, rotate: 0, opacity: 1, delay: 0 };
    }
    return {
      y: -(1 + pseudoRand(i + 1) * 3),
      scale: 1.2 + pseudoRand(i + 53) * 0.25,
      rotate: (pseudoRand(i + 11) - 0.5) * 24,
      opacity: 0.7 + pseudoRand(i + 23) * 0.22,
      delay: pseudoRand(i + 37) * 0.08,
    };
  });
}
```

- [ ] **Step 4: Chạy test để chắc chắn nó đạt**

Chạy: `npx vitest run src/components/motion/letterDance.test.ts`
Kỳ vọng: PASS, 8 test

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/letterDance.ts src/components/motion/letterDance.test.ts
git commit -m "feat(motion): logic chữ nhảy tất định theo vị trí ký tự"
```

---

### Task 7: AnimatedButtonLabel

**Files:**
- Create: `src/components/motion/AnimatedButtonLabel.tsx`

**Interfaces:**
- Consumes: `buildLetterMeta`, `LetterMeta` từ `letterDance.ts`; `DURATION`, `EASE_STANDARD` từ `tokens.ts`; `cn`
- Produces: `AnimatedButtonLabel({ children, className?, active?, weightRange? }): JSX.Element`. `children` phải là `string`.

- [ ] **Step 1: Viết component**

```tsx
// src/components/motion/AnimatedButtonLabel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DURATION, EASE_STANDARD } from "@/components/motion/tokens";
import { buildLetterMeta, type LetterMeta } from "@/components/motion/letterDance";
import { cn } from "@/lib/utils";

const buildVariants = (restWeight: number, hoverWeight: number): Variants => ({
  rest: {
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    fontWeight: restWeight,
    transition: { duration: DURATION.fast, ease: EASE_STANDARD },
  },
  active: (meta: LetterMeta) => ({
    y: [0, meta.y, 0],
    scale: [1, meta.scale, 1],
    rotate: [0, meta.rotate, 0],
    opacity: [1, meta.opacity, 1],
    fontWeight: [restWeight, hoverWeight, restWeight],
    transition: {
      delay: meta.delay,
      duration: 0.55,
      ease: EASE_STANDARD,
      // Peak at 45% rather than halfway: the letter snaps up and settles back
      // slowly, which reads as spring rather than as a bounce.
      times: [0, 0.45, 1],
    },
  }),
});

/**
 * Button label whose letters lift, tilt and thicken on hover.
 *
 * A hidden copy at the heaviest weight reserves the widest layout the label
 * can ever occupy, so the button does not resize mid-animation. The visible
 * letters are `aria-hidden` and a plain `sr-only` copy carries the text, so
 * assistive tech reads one word rather than a string of separate letters.
 *
 * Disabled on coarse pointers: without hover there is nothing to trigger it,
 * and the per-letter spans would only cost layout work.
 */
export function AnimatedButtonLabel({
  children,
  className,
  active = false,
  weightRange = [500, 700],
}: {
  children: string;
  className?: string;
  /** Drive from the parent's hover state. */
  active?: boolean;
  /** `[rest, hover]` font weights. Use `[400, 700]` on outline buttons. */
  weightRange?: [number, number];
}) {
  const prefersReducedMotion = useReducedMotion();
  const letters = useMemo(() => children.split(""), [children]);
  const letterMeta = useMemo(() => buildLetterMeta(children), [children]);
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    setCanAnimate(
      prefersReducedMotion !== true &&
        window.matchMedia("(pointer: fine)").matches
    );
  }, [prefersReducedMotion]);

  const [restWeight, hoverWeight] = weightRange;
  const variants = useMemo(
    () => buildVariants(restWeight, hoverWeight),
    [restWeight, hoverWeight]
  );
  const shouldAnimate = canAnimate && active;

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <span
        className="invisible whitespace-pre"
        aria-hidden="true"
        style={{ fontWeight: hoverWeight }}
      >
        {children}
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center whitespace-pre"
        aria-hidden="true"
      >
        {letters.map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            custom={letterMeta[i]}
            initial={false}
            animate={shouldAnimate ? "active" : "rest"}
            variants={canAnimate ? variants : undefined}
            style={{
              willChange: shouldAnimate ? "transform, font-weight, opacity" : undefined,
              fontWeight: canAnimate ? undefined : restWeight,
              transformOrigin: "50% 60%",
            }}
          >
            {char}
          </motion.span>
        ))}
      </span>
      <span className="sr-only">{children}</span>
    </span>
  );
}
```

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/AnimatedButtonLabel.tsx
git commit -m "feat(motion): nhãn nút có chữ nhảy khi hover"
```

---

### Task 8: Phép ánh xạ tiến độ lớp phủ

**Files:**
- Create: `src/components/motion/fillProgress.ts`
- Test: `src/components/motion/fillProgress.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `FILL = { startVh: 1.0, endVh: 0.3, maxRadius: 150 }`, `fillProgress(rectTop: number, viewportHeight: number): number` trả về giá trị đã kẹp trong `[0, 1]`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/components/motion/fillProgress.test.ts
import { describe, expect, it } from "vitest";
import { fillProgress } from "@/components/motion/fillProgress";

const VH = 1000;

describe("fillProgress", () => {
  it("bằng 0 khi mục tiêu còn ở dưới đáy khung nhìn", () => {
    expect(fillProgress(VH, VH)).toBe(0);
    expect(fillProgress(VH * 2, VH)).toBe(0);
  });

  it("bằng 1 khi mục tiêu đã lên tới 30% chiều cao khung nhìn", () => {
    expect(fillProgress(VH * 0.3, VH)).toBe(1);
  });

  it("tiếp tục kẹp ở 1 khi mục tiêu cuộn lên cao hơn nữa", () => {
    expect(fillProgress(0, VH)).toBe(1);
    expect(fillProgress(-500, VH)).toBe(1);
  });

  it("đi qua 0.5 ở đúng giữa quãng", () => {
    expect(fillProgress(VH * 0.65, VH)).toBeCloseTo(0.5, 5);
  });

  it("tăng đơn điệu khi mục tiêu đi lên", () => {
    const seq = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3].map((f) =>
      fillProgress(VH * f, VH)
    );
    for (let i = 1; i < seq.length; i += 1) {
      expect(seq[i]).toBeGreaterThan(seq[i - 1]);
    }
  });

  it("trả 0 thay vì chia cho 0 khi khung nhìn cao 0", () => {
    expect(fillProgress(0, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Chạy: `npx vitest run src/components/motion/fillProgress.test.ts`
Kỳ vọng: FAIL — không phân giải được `@/components/motion/fillProgress`

- [ ] **Step 3: Viết cài đặt tối thiểu**

```ts
// src/components/motion/fillProgress.ts
/**
 * Maps a target section's position onto the 0–1 progress of the scene-fill
 * overlay.
 *
 * Extracted from the component so the arithmetic can be tested without a DOM.
 * Getting the direction wrong here inverts the whole effect, and that is not
 * obvious from reading the component.
 */

export const FILL = {
  /** Progress 0: the target's top is level with the viewport bottom. */
  startVh: 1.0,
  /** Progress 1: the target's top has risen to 30% down the viewport. */
  endVh: 0.3,
  /** Final clip radius as a percentage — 150% covers any aspect ratio. */
  maxRadius: 150,
} as const;

export function fillProgress(rectTop: number, viewportHeight: number): number {
  const start = FILL.startVh * viewportHeight;
  const end = FILL.endVh * viewportHeight;
  const range = start - end;
  if (range <= 0) return 0;
  const raw = (start - rectTop) / range;
  return Math.max(0, Math.min(1, raw));
}
```

- [ ] **Step 4: Chạy test để chắc chắn nó đạt**

Chạy: `npx vitest run src/components/motion/fillProgress.test.ts`
Kỳ vọng: PASS, 6 test

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/fillProgress.ts src/components/motion/fillProgress.test.ts
git commit -m "feat(motion): phép ánh xạ tiến độ lớp phủ chuyển cảnh"
```

---

### Task 9: SceneFillOverlay

**Files:**
- Create: `src/components/motion/SceneFillOverlay.tsx`

**Interfaces:**
- Consumes: `FILL`, `fillProgress` từ `fillProgress.ts`
- Produces: `SceneFillOverlay({ targetId, className? }): JSX.Element | null`

Khác bản gốc ở một điểm: nhận `targetId` qua prop thay vì gán cứng `"how-it-works"`.

- [ ] **Step 1: Viết component**

```tsx
// src/components/motion/SceneFillOverlay.tsx
"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { FILL, fillProgress } from "@/components/motion/fillProgress";
import { cn } from "@/lib/utils";

/**
 * A white sheet that rises from the bottom-centre of the viewport as the
 * reader approaches a given section, swallowing whatever sits behind it.
 *
 * This is the scene change between the upper half of the page (which floats
 * over a sticky backdrop) and the lower half. It sits above the hero layer but
 * below `MainSection`, so the incoming section stays legible on top of it.
 *
 * Scroll position is read through a rAF-throttled listener rather than
 * `useScroll`, because the measurement is against another element's rect.
 */
export function SceneFillOverlay({
  targetId,
  className,
}: {
  /** `id` of the section whose approach drives the fill. */
  targetId: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, {
    stiffness: 220,
    damping: 32,
    mass: 0.6,
  });
  const radius = useTransform(smooth, [0, 1], [0, FILL.maxRadius]);
  const clipPath = useMotionTemplate`circle(${radius}% at 50% 100%)`;

  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId = 0;

    const update = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      progress.set(
        fillProgress(el.getBoundingClientRect().top, window.innerHeight)
      );
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        update();
        rafId = 0;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [progress, prefersReducedMotion, targetId]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[15] bg-bg", className)}
      style={{ clipPath, willChange: "clip-path" }}
    />
  );
}
```

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/SceneFillOverlay.tsx
git commit -m "feat(motion): lớp phủ chuyển cảnh dâng theo section mục tiêu"
```

---

### Task 10: Máy trạng thái chạm-giữ

**Files:**
- Create: `src/components/motion/holdToReveal.ts`
- Test: `src/components/motion/holdToReveal.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `HOLD = { holdMs: 280, moveThresholdPx: 8, hideAfterHoldMs: 1000, hideAfterTapMs: 2500 }`, `type HoldState = { revealed: boolean; pointerDown: boolean; holding: boolean; moved: boolean; startX: number; startY: number }`, `initialHoldState: HoldState`, `type HoldEvent = { type: "down"; x: number; y: number } | { type: "move"; x: number; y: number } | { type: "up" } | { type: "holdTimer" } | { type: "hide" }`, `holdReducer(state: HoldState, event: HoldEvent): { state: HoldState; hideAfterMs: number | null; startHoldTimer: boolean }`

Tách thành reducer thuần vì đây là phần dễ sai nhất: phân biệt "giữ" với "vuốt để cuộn" trên cùng một cử chỉ chạm.

- [ ] **Step 1: Viết test thất bại**

```ts
// src/components/motion/holdToReveal.test.ts
import { describe, expect, it } from "vitest";
import {
  HOLD,
  holdReducer,
  initialHoldState,
  type HoldState,
} from "@/components/motion/holdToReveal";

const down = (x = 0, y = 0) => ({ type: "down", x, y }) as const;

describe("holdReducer", () => {
  it("hiện nội dung ngay khi chạm xuống", () => {
    const { state, startHoldTimer } = holdReducer(initialHoldState, down());
    expect(state.revealed).toBe(true);
    expect(state.pointerDown).toBe(true);
    expect(startHoldTimer).toBe(true);
  });

  it("chỉ tính là giữ khi hết bộ đếm mà chưa di chuyển", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const b = holdReducer(a, { type: "holdTimer" }).state;
    expect(b.holding).toBe(true);
  });

  it("không tính là giữ nếu đã vuốt trước khi hết bộ đếm", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const b = holdReducer(a, { type: "move", x: 20, y: 0 }).state;
    const c = holdReducer(b, { type: "holdTimer" }).state;
    expect(c.holding).toBe(false);
  });

  it("coi dịch chuyển quá ngưỡng là vuốt để cuộn", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const { state, hideAfterMs } = holdReducer(a, {
      type: "move",
      x: HOLD.moveThresholdPx + 1,
      y: 0,
    });
    expect(state.moved).toBe(true);
    expect(state.holding).toBe(false);
    expect(hideAfterMs).toBe(HOLD.hideAfterTapMs);
  });

  it("bỏ qua dịch chuyển nhỏ hơn ngưỡng", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const { state } = holdReducer(a, { type: "move", x: 5, y: 5 });
    expect(state.moved).toBe(false);
  });

  it("nhả sau khi giữ thì ẩn nhanh", () => {
    let s: HoldState = holdReducer(initialHoldState, down()).state;
    s = holdReducer(s, { type: "holdTimer" }).state;
    expect(holdReducer(s, { type: "up" }).hideAfterMs).toBe(HOLD.hideAfterHoldMs);
  });

  it("chạm nhanh rồi nhả thì để lâu hơn cho người đọc kịp nhìn", () => {
    const s = holdReducer(initialHoldState, down()).state;
    expect(holdReducer(s, { type: "up" }).hideAfterMs).toBe(HOLD.hideAfterTapMs);
  });

  it("di chuột khi không nhấn thì hẹn ẩn", () => {
    const { hideAfterMs } = holdReducer(initialHoldState, {
      type: "move",
      x: 0,
      y: 0,
    });
    expect(hideAfterMs).toBe(HOLD.hideAfterTapMs);
  });

  it("sự kiện hide tắt hiển thị và đặt lại mọi cờ", () => {
    const s = holdReducer(initialHoldState, down()).state;
    const { state } = holdReducer(s, { type: "hide" });
    expect(state).toEqual(initialHoldState);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó thất bại**

Chạy: `npx vitest run src/components/motion/holdToReveal.test.ts`
Kỳ vọng: FAIL — không phân giải được `@/components/motion/holdToReveal`

- [ ] **Step 3: Viết cài đặt tối thiểu**

```ts
// src/components/motion/holdToReveal.ts
/**
 * Touch replacement for hover.
 *
 * The hard part is telling a deliberate press apart from a finger that is on
 * its way to scrolling the page. Both start as a pointerdown on the card. The
 * rule: hold still past `holdMs` and it counts as a press; move more than
 * `moveThresholdPx` first and it is a scroll, so the reveal fades out on its
 * own instead of sticking.
 *
 * A pure reducer so the timing rules can be tested without a browser.
 */

export const HOLD = {
  holdMs: 280,
  moveThresholdPx: 8,
  /** After a deliberate press, the reader has seen it — hide sooner. */
  hideAfterHoldMs: 1000,
  /** After a glancing tap, leave it up long enough to read. */
  hideAfterTapMs: 2500,
} as const;

export type HoldState = {
  revealed: boolean;
  pointerDown: boolean;
  holding: boolean;
  moved: boolean;
  startX: number;
  startY: number;
};

export const initialHoldState: HoldState = {
  revealed: false,
  pointerDown: false,
  holding: false,
  moved: false,
  startX: 0,
  startY: 0,
};

export type HoldEvent =
  | { type: "down"; x: number; y: number }
  | { type: "move"; x: number; y: number }
  | { type: "up" }
  | { type: "holdTimer" }
  | { type: "hide" };

export type HoldResult = {
  state: HoldState;
  /** Schedule a hide this many ms from now, or null to leave timers alone. */
  hideAfterMs: number | null;
  /** Start the `holdMs` timer that decides press-vs-scroll. */
  startHoldTimer: boolean;
};

export function holdReducer(state: HoldState, event: HoldEvent): HoldResult {
  switch (event.type) {
    case "down":
      return {
        state: {
          revealed: true,
          pointerDown: true,
          holding: false,
          moved: false,
          startX: event.x,
          startY: event.y,
        },
        hideAfterMs: null,
        startHoldTimer: true,
      };

    case "move": {
      if (!state.pointerDown) {
        return {
          state: { ...state, revealed: true },
          hideAfterMs: HOLD.hideAfterTapMs,
          startHoldTimer: false,
        };
      }
      const moved =
        Math.hypot(event.x - state.startX, event.y - state.startY) >
        HOLD.moveThresholdPx;
      if (!moved) {
        return { state, hideAfterMs: null, startHoldTimer: false };
      }
      return {
        state: { ...state, moved: true, holding: false },
        hideAfterMs: HOLD.hideAfterTapMs,
        startHoldTimer: false,
      };
    }

    case "holdTimer":
      if (!state.pointerDown || state.moved) {
        return { state, hideAfterMs: null, startHoldTimer: false };
      }
      return {
        state: { ...state, holding: true },
        hideAfterMs: null,
        startHoldTimer: false,
      };

    case "up":
      return {
        state: { ...state, pointerDown: false, holding: false, moved: false },
        hideAfterMs:
          state.holding && !state.moved
            ? HOLD.hideAfterHoldMs
            : HOLD.hideAfterTapMs,
        startHoldTimer: false,
      };

    case "hide":
      return { state: initialHoldState, hideAfterMs: null, startHoldTimer: false };
  }
}
```

- [ ] **Step 4: Chạy test để chắc chắn nó đạt**

Chạy: `npx vitest run src/components/motion/holdToReveal.test.ts`
Kỳ vọng: PASS, 9 test

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/holdToReveal.ts src/components/motion/holdToReveal.test.ts
git commit -m "feat(motion): máy trạng thái chạm-giữ thay hover trên mobile"
```

---

### Task 11: Hook useHoldToReveal và TiltCard

**Files:**
- Create: `src/components/motion/useHoldToReveal.ts`
- Create: `src/components/motion/TiltCard.tsx`

**Interfaces:**
- Consumes: `holdReducer`, `initialHoldState`, `HOLD` từ `holdToReveal.ts`
- Produces:
  - `useHoldToReveal(): { revealed: boolean; isCoarsePointer: boolean; handlers: { onPointerDown; onPointerMove; onPointerUp; onPointerCancel } }`
  - `TiltCard({ children, side, className, ...handlers }): JSX.Element` với `side: "left" | "right"`

- [ ] **Step 1: Viết hook**

```ts
// src/components/motion/useHoldToReveal.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  holdReducer,
  initialHoldState,
  type HoldState,
} from "@/components/motion/holdToReveal";

/**
 * Wires `holdReducer` to real pointer events.
 *
 * Only active on coarse pointers. On a mouse the card already has `:hover`,
 * and running both would fight each other.
 */
export function useHoldToReveal() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const stateRef = useRef<HoldState>(initialHoldState);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setIsCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    hideTimer.current = null;
    holdTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (isCoarsePointer) return;
    clearTimers();
    stateRef.current = initialHoldState;
    setRevealed(false);
  }, [isCoarsePointer, clearTimers]);

  const dispatch = useCallback(
    (event: Parameters<typeof holdReducer>[1]) => {
      if (!isCoarsePointer) return;

      const result = holdReducer(stateRef.current, event);
      stateRef.current = result.state;
      setRevealed(result.state.revealed);

      if (result.startHoldTimer) {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        holdTimer.current = setTimeout(() => {
          const next = holdReducer(stateRef.current, { type: "holdTimer" });
          stateRef.current = next.state;
          holdTimer.current = null;
        }, 280);
      }

      if (result.hideAfterMs !== null) {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
          const next = holdReducer(stateRef.current, { type: "hide" });
          stateRef.current = next.state;
          setRevealed(false);
          hideTimer.current = null;
        }, result.hideAfterMs);
      }
    },
    [isCoarsePointer]
  );

  return {
    revealed,
    isCoarsePointer,
    handlers: {
      onPointerDown: (e: React.PointerEvent) =>
        dispatch({ type: "down", x: e.clientX, y: e.clientY }),
      onPointerMove: (e: React.PointerEvent) =>
        dispatch({ type: "move", x: e.clientX, y: e.clientY }),
      onPointerUp: () => dispatch({ type: "up" }),
      onPointerCancel: () => dispatch({ type: "hide" }),
    },
  };
}
```

- [ ] **Step 2: Viết TiltCard**

```tsx
// src/components/motion/TiltCard.tsx
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card that tilts away from the centre of the row on hover.
 *
 * Plain CSS, not a tilt library: the angles are fixed per side rather than
 * tracking the cursor, so there is no pointer maths and nothing to clean up.
 * The original project shipped a `vanilla-tilt` hook that nothing imported —
 * this is what it actually used.
 *
 * Tilt only from `md` up. On a phone the card fills the width and tilting it
 * would just clip the corners.
 */
export function TiltCard({
  children,
  side,
  className,
  ...rest
}: {
  children: ReactNode;
  /** Which way to lean — mirror the pair so they splay outwards. */
  side: "left" | "right";
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <article
      {...rest}
      className={cn(
        "[perspective:1400px] transition-transform duration-300",
        "ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        side === "left"
          ? "md:hover:[transform:rotateX(2deg)_rotateY(-5deg)_rotateZ(-1deg)]"
          : "md:hover:[transform:rotateX(2deg)_rotateY(5deg)_rotateZ(1deg)]",
        className
      )}
    >
      {children}
    </article>
  );
}
```

- [ ] **Step 3: Kiểm tra kiểu, lint và test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch cả ba

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/useHoldToReveal.ts src/components/motion/TiltCard.tsx
git commit -m "feat(motion): hook chạm-giữ và thẻ nghiêng 3D khi hover"
```

---

### Task 12: Bộ khung trang hai tầng

**Files:**
- Create: `src/components/motion/StickyBackdrop.tsx`
- Create: `src/components/motion/MainSection.tsx`

**Interfaces:**
- Consumes: `cn`
- Produces:
  - `StickyBackdrop({ src, mobileSrc?, className? }): JSX.Element`
  - `MainSection({ children, transparent?, className? }): JSX.Element`

- [ ] **Step 1: Viết StickyBackdrop**

```tsx
// src/components/motion/StickyBackdrop.tsx
import { cn } from "@/lib/utils";

/**
 * Full-viewport backdrop that stays put while the content above it scrolls by.
 *
 * Pair it with `-mt-[100dvh]` on the sibling that follows, so the content
 * overlaps the backdrop instead of starting below it. That overlap is what
 * gives the top of the page depth; without it the backdrop is just a banner.
 *
 * A `<picture>` rather than `next/image`: this is a decorative full-bleed
 * layer where the mobile file is a different crop, not a resize, and `fill`
 * would fetch the desktop asset on phones.
 */
export function StickyBackdrop({
  src,
  mobileSrc,
  className,
}: {
  src: string;
  /** Lighter crop for phones. Falls back to `src`. */
  mobileSrc?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none sticky top-0 -z-10 h-[100dvh] w-full",
        className
      )}
    >
      <picture className="absolute inset-0 block size-full">
        <source media="(min-width: 768px)" srcSet={src} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileSrc ?? src}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="size-full object-cover object-center"
        />
      </picture>
    </div>
  );
}
```

- [ ] **Step 2: Viết MainSection**

```tsx
// src/components/motion/MainSection.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps the lower half of a page, covering the sticky backdrop above it.
 *
 * Deliberately carries no scroll-driven motion: translating a container that
 * holds several full sections costs a layer repaint per frame, and the effect
 * is not worth it.
 */
export function MainSection({
  children,
  transparent = false,
  className,
}: {
  children: ReactNode;
  /** Skip the gradient when a page-level backdrop should show through. */
  transparent?: boolean;
  className?: string;
}) {
  if (transparent) {
    return (
      <main className={cn("relative z-20 overflow-hidden", className)}>
        {children}
      </main>
    );
  }

  return (
    <main
      className={cn("relative z-20 overflow-hidden bg-bg", className)}
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(246,245,250,0) 0%, rgb(238,236,246) 30.9%, rgb(233,231,243) 45.7%, rgb(255,255,255) 100%)",
      }}
    >
      {children}
    </main>
  );
}
```

- [ ] **Step 3: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/StickyBackdrop.tsx src/components/motion/MainSection.tsx
git commit -m "feat(motion): bộ khung hai tầng nền dán và nửa dưới trang"
```

---

### Task 13: DriftTextPath

**Files:**
- Create: `src/components/motion/DriftTextPath.tsx`

**Interfaces:**
- Consumes: `cn`
- Produces: `DriftTextPath({ text, className?, speed?, arcHeight? }): JSX.Element`

- [ ] **Step 1: Viết component**

```tsx
// src/components/motion/DriftTextPath.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VIEW_W = 1200;

/**
 * Text drifting sideways along a shallow arc.
 *
 * The animation runs on its own rAF loop rather than as a CSS keyframe because
 * it has to stop when the band leaves the viewport — a marquee ticking away
 * off-screen burns battery on the phones this site is built for.
 *
 * Hidden below `md`: the arc needs width to read as a curve rather than as a
 * crooked line.
 */
export function DriftTextPath({
  text,
  className,
  speed = 10,
  arcHeight = 60,
}: {
  text: string;
  className?: string;
  /** Pixels per second, negative drifts right. */
  speed?: number;
  /** How far the middle of the arc dips, in viewBox units. */
  arcHeight?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let last = 0;
    let running = false;

    const tick = (now: number) => {
      if (last) {
        offsetRef.current =
          (offsetRef.current - (speed * (now - last)) / 1000 + VIEW_W) % VIEW_W;
        setOffset(offsetRef.current);
      }
      last = now;
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          last = 0;
          rafId = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(host);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [speed]);

  const pathId = `drift-${text.length}-${arcHeight}`;

  return (
    <div ref={hostRef} className={cn("hidden w-full md:block", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${arcHeight * 2}`}
        className="w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <path
            id={pathId}
            d={`M 0 ${arcHeight} Q ${VIEW_W / 2} ${arcHeight * 2} ${VIEW_W} ${arcHeight}`}
            fill="none"
          />
        </defs>
        <text className="fill-current">
          <textPath href={`#${pathId}`} startOffset={-offset}>
            {`${text}  `.repeat(6)}
          </textPath>
        </text>
      </svg>
      <span className="sr-only">{text}</span>
    </div>
  );
}
```

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/DriftTextPath.tsx
git commit -m "feat(motion): chữ trôi dọc cung SVG, dừng khi ngoài khung nhìn"
```

---

### Task 14: Viền ánh kim cho GlassPill và điểm xuất khẩu gộp

**Files:**
- Modify: `src/components/ui/GlassPill.tsx`
- Create: `src/components/motion/index.ts`

**Interfaces:**
- Consumes: mọi module đã tạo
- Produces: `index.ts` xuất lại toàn bộ; `GlassPill` giữ nguyên chữ ký `({ children, className?, innerClassName?, radius? })`

- [ ] **Step 1: Thay gradient viền của GlassPill**

Sửa hằng `METALLIC_BORDER_BG` trong `src/components/ui/GlassPill.tsx` thành dải ánh kim nhiều chặng của bản gốc, đổi sang tông tím-xanh của dự án:

```ts
/**
 * Iridescent border. The many stops are the point: a two-stop gradient reads
 * as a flat outline, while the uneven steps catch the eye like brushed metal.
 */
const METALLIC_BORDER_BG =
  "linear-gradient(180deg, #D9D9D9 0deg, #D9D9D9 65deg, #F2F2F2 150deg, #DFD0EA 176deg, #D9D9D9 204deg, #D9D9D9 255deg, #C9BCEA 285deg, #ECECEC 319deg, #D9D9D9 360deg)";
```

- [ ] **Step 2: Viết điểm xuất khẩu gộp**

```ts
// src/components/motion/index.ts
/**
 * Single import surface for the motion system.
 *
 * Consumers should reach for `@/components/motion` rather than individual
 * files, so a later reshuffle inside this folder does not ripple outwards.
 */
export * from "@/components/motion/tokens";
export * from "@/components/motion/variants";
export * from "@/components/motion/letterDance";
export * from "@/components/motion/fillProgress";
export * from "@/components/motion/holdToReveal";

export { AnimatedSection } from "@/components/motion/AnimatedSection";
export { AnimatedButtonLabel } from "@/components/motion/AnimatedButtonLabel";
export { ScrollReveal3D } from "@/components/motion/ScrollReveal3D";
export { SceneFillOverlay } from "@/components/motion/SceneFillOverlay";
export { StickyBackdrop } from "@/components/motion/StickyBackdrop";
export { MainSection } from "@/components/motion/MainSection";
export { TiltCard } from "@/components/motion/TiltCard";
export { DriftTextPath } from "@/components/motion/DriftTextPath";
export { useHoldToReveal } from "@/components/motion/useHoldToReveal";
export { useSharedScrollProgress } from "@/components/motion/useSharedScrollProgress";
```

- [ ] **Step 3: Kiểm tra kiểu, lint, test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch, 49 test đạt (15 cũ + 34 mới)

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/GlassPill.tsx src/components/motion/index.ts
git commit -m "feat(motion): viền ánh kim cho GlassPill và điểm xuất khẩu gộp"
```

---

### Task 15: Đồng bộ component sẵn có về token chung

**Files:**
- Modify: `src/components/ui/PillButton.tsx:20,46`
- Modify: `src/components/ui/StarBorder.tsx`
- Modify: `src/components/ui/CircularText.tsx`
- Modify: `src/components/ui/SmoothScroll.tsx`

**Interfaces:**
- Consumes: `EASE_STANDARD`, `DURATION`, `STAR_SPEED` từ `@/components/motion`
- Produces: không đổi chữ ký công khai của component nào

Bốn component này có từ trước và mỗi cái tự khai hằng số riêng. `PillButton`
khai `tapEase = [0.25, 0.1, 0.25, 1]` — trùng hệt `EASE_STANDARD`. Trùng lặp
kiểu này là cách chữ ký chuyển động trôi dạt: sửa token mà component cũ không
đổi theo.

- [ ] **Step 1: PillButton đọc token thay vì tự khai**

Trong `src/components/ui/PillButton.tsx`, xoá dòng 20 (`const tapEase = ...`),
xoá hai hằng `STAR_SPEED`/`STAR_SPEED_HOVER` nếu có, và thêm import:

```ts
import { DURATION, EASE_STANDARD, STAR_SPEED } from "@/components/motion";
```

Sửa transition của cử chỉ chạm:

```ts
    transition: { duration: 0.2, ease: EASE_STANDARD },
```

Và thay mọi chỗ dùng `STAR_SPEED`/`STAR_SPEED_HOVER` cũ bằng
`STAR_SPEED.idle` / `STAR_SPEED.hover`.

- [ ] **Step 2: StarBorder nhận tốc độ mặc định từ token**

Trong `src/components/ui/StarBorder.tsx`, đổi giá trị mặc định của prop `speed`:

```ts
import { STAR_SPEED } from "@/components/motion";

export function StarBorderLayer({
  color = "white",
  speed = STAR_SPEED.idle,
}: {
  color?: string;
  speed?: string;
}) {
```

- [ ] **Step 3: CircularText và SmoothScroll**

`CircularText` giữ nguyên `durationSeconds` — đây là chuyển động lặp vô hạn,
theo spec dùng `linear` chứ không dùng easing chuẩn, nên không có gì để đồng bộ.
Chỉ thêm comment một dòng nói rõ vì sao nó không đọc `EASE_STANDARD`:

```ts
// Loops forever, so it runs linear rather than on the entrance easing —
// an eased spin visibly stutters at the seam.
```

`SmoothScroll` giữ nguyên cấu hình Lenis (`duration: 0.9`, `easeOutCubic`) —
đây là easing của đà cuộn, không phải của phần tử. Thêm comment tương tự.

- [ ] **Step 4: Xác nhận không còn easing trùng lặp**

Chạy:
```bash
grep -rn "0.25, 0.1, 0.25, 1" src/components src/app --include='*.tsx' --include='*.ts' | grep -v "components/motion/tokens.ts"
```
Kỳ vọng: không có kết quả nào ngoài `tokens.ts`. Mọi easing khác phải đi qua token.

- [ ] **Step 5: Kiểm tra kiểu, lint, test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch cả ba

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/PillButton.tsx src/components/ui/StarBorder.tsx src/components/ui/CircularText.tsx src/components/ui/SmoothScroll.tsx
git commit -m "refactor(motion): component sẵn có đọc token chung thay vì tự khai"
```

---

### Task 16: Bỏ layoutId khỏi Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx:100-111` (khối `motion.span` mang `layoutId="nav-active-pill"` ở dòng 101-102)

Strike Robot không có pill trượt ngang; pill của họ hiện và ẩn tại chỗ. Bản hiện tại tự thêm `layoutId`, làm navbar lệch khỏi ngôn ngữ chuyển động của phần còn lại.

- [ ] **Step 1: Thay pill trượt bằng pill hiện tại chỗ**

Thay khối `motion.span` có `layoutId="nav-active-pill"` bằng:

```tsx
<AnimatePresence>
  {active && (
    <motion.span
      className="absolute inset-0 rounded-full bg-brand-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: "easeOut",
      }}
      aria-hidden="true"
    />
  )}
</AnimatePresence>
```

`AnimatePresence` đã được import sẵn ở đầu tệp.

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "refactor(nav): pill hiện tại chỗ thay vì trượt ngang"
```

---

### Task 17: Trang trưng bày và kiểm chứng bằng trình duyệt

**Files:**
- Create: `src/app/motion-gallery/page.tsx`
- Modify: `src/app/robots.ts`

Trang này nằm ngoài `[locale]` nên không cần dịch, và bị chặn khỏi công cụ tìm kiếm. Đây là nơi đối chiếu từng hiệu ứng cạnh bản Strike Robot.

- [ ] **Step 1: Viết trang trưng bày**

```tsx
// src/app/motion-gallery/page.tsx
"use client";

import { useState } from "react";
import { motion, useTransform } from "framer-motion";
import {
  AnimatedButtonLabel,
  AnimatedSection,
  DriftTextPath,
  MainSection,
  SceneFillOverlay,
  ScrollReveal3D,
  StickyBackdrop,
  TiltCard,
  VIEWPORT_ONCE,
  fadeUp,
  staggerContainer,
  staggerItem,
  useHoldToReveal,
  useSharedScrollProgress,
} from "@/components/motion";

/**
 * Internal showcase for the motion system. Not linked from anywhere and
 * excluded from robots.txt — its only job is to let a human compare each
 * effect against the reference build at three widths.
 */
export default function MotionGallery() {
  const [hovered, setHovered] = useState(false);
  const { targetRef, scrollYProgress } = useSharedScrollProgress();
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const hold = useHoldToReveal();

  return (
    <>
      <SceneFillOverlay targetId="lower-half" />

      <div className="relative">
        <StickyBackdrop src="/motion-gallery-backdrop.svg" />
        <div className="relative z-10 -mt-[100dvh]">
          <section className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6">
            <motion.div
              style={{ opacity: titleOpacity, scale: titleScale }}
              className="text-center"
            >
              <h1 className="text-4xl font-extrabold">Mốc cuộn dùng chung</h1>
              <p className="mt-3 text-text-muted">
                Tiêu đề này mờ và co theo vị trí của khối video bên dưới.
              </p>
            </motion.div>

            <div ref={targetRef} className="w-full max-w-3xl">
              <ScrollReveal3D targetRef={targetRef}>
                <div className="aspect-video w-full rounded-2xl bg-brand-gradient" />
              </ScrollReveal3D>
            </div>
          </section>
        </div>
      </div>

      <MainSection>
        <div id="lower-half" className="mx-auto max-w-content px-6 py-24">
          <AnimatedSection className="mb-24">
            <h2 className="text-2xl font-bold">AnimatedSection</h2>
            <p className="mt-2 text-text-muted">Khối này mờ và trượt lên khi cuộn tới.</p>
          </AnimatedSection>

          <section className="mb-24">
            <h2 className="mb-6 text-2xl font-bold">Stagger</h2>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="grid gap-3 sm:grid-cols-3"
            >
              {["Một", "Hai", "Ba", "Bốn", "Năm", "Sáu"].map((label) => (
                <motion.li
                  key={label}
                  variants={staggerItem}
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  {label}
                </motion.li>
              ))}
            </motion.ul>
          </section>

          <section className="mb-24">
            <h2 className="mb-6 text-2xl font-bold">Chữ nhảy khi hover</h2>
            <button
              type="button"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="rounded-3xl bg-brand-500 px-7 py-4 text-white"
            >
              <AnimatedButtonLabel active={hovered}>
                Tham gia cùng chúng tôi
              </AnimatedButtonLabel>
            </button>
          </section>

          <section className="mb-24">
            <h2 className="mb-6 text-2xl font-bold">
              Thẻ nghiêng, và chạm-giữ trên mobile
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {(["left", "right"] as const).map((side) => (
                <TiltCard
                  key={side}
                  side={side}
                  {...hold.handlers}
                  className="group rounded-2xl border border-border bg-surface p-8"
                >
                  <div className="aspect-video rounded-xl bg-surface-muted" />
                  <p
                    className={`mt-4 text-sm transition-opacity duration-300 ${
                      hold.revealed ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                    }`}
                  >
                    Lớp phủ mô tả: hover trên desktop, chạm-giữ trên điện thoại.
                  </p>
                </TiltCard>
              ))}
            </div>
          </section>

          <section className="mb-24">
            <h2 className="mb-6 text-2xl font-bold">Chữ trôi dọc cung</h2>
            <DriftTextPath
              text="PROJECT CHÍP CHÍP · HỌC BÁN DẪN MIỄN PHÍ ·"
              className="text-brand-500"
            />
          </section>

          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
            className="pb-24"
          >
            <h2 className="text-2xl font-bold">fadeUp</h2>
          </motion.section>
        </div>
      </MainSection>
    </>
  );
}
```

- [ ] **Step 2: Tạo ảnh nền giữ chỗ cho trang trưng bày**

```bash
cat > public/motion-gallery-backdrop.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#9B66F5"/>
      <stop offset="42%" stop-color="#7B2FBE"/>
      <stop offset="100%" stop-color="#2B2FA8"/>
    </linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#g)"/>
</svg>
SVG
```

- [ ] **Step 3: Chặn trang trưng bày khỏi công cụ tìm kiếm**

Trong `src/app/robots.ts`, thêm `"/motion-gallery"` vào mảng `disallow`:

```ts
disallow: ["/admin", "/api", "/motion-gallery"],
```

- [ ] **Step 4: Kiểm tra kiểu, lint, test, build**

Chạy:
```bash
npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run && NODE_ENV=production npx next build
```
Kỳ vọng: sạch cả bốn

- [ ] **Step 5: Kiểm chứng bằng trình duyệt thật**

Khởi động: `npx supabase start && npx next start -p 3000`

Mở `http://localhost:3000/motion-gallery` và kiểm ở **390px (giả lập thiết bị, dpr 3, touch)**, **768px**, **1440px**:

1. Nền dán đứng yên trong khi tiêu đề và khối gradient cuộn đè lên.
2. Tiêu đề mờ và co **đúng nhịp** khối gradient dựng đứng — hai chuyển động không lệch nhau.
3. Khối gradient nghiêng ngửa khi vừa vào từ đáy, đứng thẳng khi lên tới giữa màn hình, bản lề ở **cạnh dưới** chứ không phải tâm.
4. Lớp trắng dâng từ giữa-đáy khi tới `#lower-half`.
5. Dãy sáu ô hiện lần lượt, không cùng lúc.
6. Hover nút: từng chữ nhảy, lệch pha, nút **không đổi kích thước**.
7. Ở 390px: chạm giữ vào thẻ thì lớp mô tả hiện; vuốt để cuộn thì nó tự mờ đi chứ không dính lại.
8. Chữ cong trôi ngang; cuộn ra xa rồi quay lại, nó vẫn chạy.
9. `document.documentElement.scrollWidth === window.innerWidth` ở cả ba bề rộng.
10. Console 0 lỗi. Kiểm bằng cách bắn một `console.error` mồi trước, để chắc công cụ thật sự bắt được log.
11. Bật "giảm chuyển động" trong hệ điều hành, tải lại: mọi thứ đứng yên, không có lớp phủ trắng, trang vẫn đọc được.

- [ ] **Step 6: Dọn và commit**

```bash
pkill -f "next start -p 3000"; npx supabase stop; rm -rf .next
git add src/app/motion-gallery/page.tsx public/motion-gallery-backdrop.svg src/app/robots.ts
git commit -m "feat(motion): trang trưng bày nội bộ để đối chiếu hiệu ứng"
```

---

## Hoàn thành Giai đoạn 1

- [ ] Toàn bộ 17 task đã commit
- [ ] `npx vitest run` đạt 49 test (15 cũ + 34 mới)
- [ ] `npx tsc --noEmit`, `npx next lint --max-warnings=0`, `NODE_ENV=production npx next build` đều sạch
- [ ] `./scripts/verify-security.sh` vẫn 9/9 — giai đoạn này không đụng bảo mật nhưng phải chứng minh không làm hỏng
- [ ] Trang trưng bày đã kiểm chứng bằng trình duyệt ở 390 / 768 / 1440, gồm cả trường hợp giảm chuyển động
- [ ] Giao diện công khai **chưa đổi** — xác nhận bằng cách mở `/vi` và `/en` đối chiếu với trước

Sang Giai đoạn 2: dựng lại trang chủ PAGE 1–5 trên bộ nguyên thuỷ này.

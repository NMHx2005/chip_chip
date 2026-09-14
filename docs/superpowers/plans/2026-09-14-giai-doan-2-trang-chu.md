# Giai đoạn 2 — Dựng lại trang chủ trên hệ chuyển động

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa PAGE 1–5 của tài liệu lên trang chủ, dựng trên thư viện `src/components/motion/` đã có, để trải nghiệm cuộn giống bản Strike Robot.

**Architecture:** Trang chủ chia hai tầng — nửa trên đè lên nền dán qua `-mt-[100dvh]`, nửa dưới bọc trong `MainSection`. `Hero` và `VideoReveal` gộp làm một vì mốc cuộn phải dùng chung. Mọi hiệu ứng đọc token từ `@/components/motion`, không component nào tự khai hằng số.

**Tech Stack:** Next.js 14.2 App Router · TypeScript · Tailwind 3.4 · framer-motion 12 · next-intl 4

**Spec:** `docs/superpowers/specs/2026-09-13-redesign-chuyen-dong-design.md` (mục 6)

## Global Constraints

- Chuẩn nghiệm thu là **giống bản Strike Robot**. Khi phân vân, mở mã nguồn Strike ra đối chiếu chứ không tự chế.
- Mọi easing, thời lượng, stagger lấy từ `@/components/motion`. Không khai lại hằng số trong section.
- Mọi chuỗi hiển thị đi qua `next-intl`. Kết thúc giai đoạn, `vi.json` và `en.json` phải bằng số khoá.
- Mọi component có chuyển động kiểm tra `useReducedMotion()` và có đường thoát tĩnh.
- Mọi hiệu ứng hover có đường thay thế bằng chạm.
- Không tràn ngang ở 390px, 768px, 1440px.
- Không sửa migration đã áp, không đổi RLS, không đụng `/api/comments`.
- Sau mỗi task: `npx tsc --noEmit` và `npx next lint --max-warnings=0` phải sạch.

## Đối chiếu với bản gốc

Bảng này là nguồn tra cứu khi làm từng task. Mọi con số đã kiểm chứng bằng cách đọc mã Strike.

| Hiệu ứng | Thông số | Nguồn |
|---|---|---|
| Tiêu đề vào trang | `staggerContainer` chạy ngay khi mount, **không** đợi cuộn | `Hero.tsx:82-141` |
| Tiêu đề lùi khi cuộn | `opacity [0,0.5,1]→[1,0.7,0]`, `scale [0,1]→[1,0.92]` | `Hero.tsx:68-73` |
| Mốc cuộn | Đo theo **ref của video**, không phải của tiêu đề | `Hero.tsx:63-64` |
| Video dựng đứng | `rotateX 55→0`, `scale 0.72→1`, gốc `50% 100%`, perspective 1600 | `scrollVideoReveal.ts` |
| Thẻ xem trước | Hiện khi hover video, tự ẩn sau 2500ms từ lúc rời chuột | `useVideoHoverCard.ts` |
| Thẻ nghiêng | `rotateX(2deg) rotateY(∓5deg) rotateZ(∓1deg)`, 300ms | `Pricing.tsx:196-198` |
| Nút CTA | Viền sao `5s`, hover `2s`; `whileTap scale 0.97` | `PillButton.tsx` |

## Cấu trúc tệp

| Tệp | Trách nhiệm |
|---|---|
| `public/video/*.mp4` | Bảy video giữ chỗ mượn từ Strike |
| `src/lib/constants.ts` | Thêm `HOME_VIDEO`, `CAROUSEL_VIDEOS`, `HERO_BACKDROP` |
| `src/components/sections/Hero.tsx` | PAGE 1 + PAGE 2 gộp: tiêu đề, nút, video dựng đứng |
| `src/components/sections/VideoReveal.tsx` | Xoá — nội dung chuyển vào `Hero.tsx` |
| `src/components/sections/SimpleStart.tsx` | PAGE 3 phần mở đầu |
| `src/components/sections/LessonTopics.tsx` | PAGE 3: đổi bấm-để-mở thành di-chuột-để-mở |
| `src/components/sections/CountryBands.tsx` | PAGE 3: thêm logo công ty |
| `src/components/sections/VideoCarousel.tsx` | PAGE 4, tạo mới |
| `src/components/sections/LatestPosts.tsx` | PAGE 5: thẻ nghiêng + lớp phủ chuyển cảnh |
| `src/components/sections/JoinCta.tsx` | Nhãn nút chữ nhảy |
| `src/components/sections/MotionGrid.tsx` | Lưới thẻ có stagger và nghiêng, tạo mới |
| `src/app/[locale]/page.tsx` | Bộ khung hai tầng |

### Hoãn sang sau vì chưa có tài nguyên

Spec mục 6 PAGE 5 còn hai thứ **không làm trong giai đoạn này**, vì thiếu tệp
chứ không phải vì bỏ sót:

- Ảnh bo mạch làm nền khối bài viết — cần bản độ phân giải cao, ảnh trong tài
  liệu quá nhỏ để làm nền toàn khối.
- Clip TSMC cắt từ giây 15 (đoạn eo biển Đài Loan).

Khi có tệp, cả hai chỉ là thêm hằng số vào `constants.ts` và một khối JSX —
không phải dựng lại gì.

---

### Task 1: Video giữ chỗ và hằng số

**Files:**
- Create: `public/video/` (7 tệp mp4)
- Modify: `src/lib/constants.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: `HOME_VIDEO: string`, `CAROUSEL_VIDEOS: { id: string; src: string; topicKey: string }[]`, `HERO_BACKDROP: string`

Đây là video của dự án Strike, mượn để xem hiệu ứng. **Phải thay trước khi lên production** — không phải vấn đề bản quyền vì cùng chủ, mà vì nội dung không liên quan tới bán dẫn.

- [ ] **Step 1: Chép và đổi tên bảy video**

Tên gốc có dấu cách, hỏng khi làm URL, nên đổi sang kebab-case:

```bash
mkdir -p public/video
S="/Users/nmh/work/Mac/NMHx/CodeThue/Strike_Robot_LandingPage_Desing/public/Video"
cp "$S/SR Platform feature/Spatial Layout Generation1_30fps.mp4" public/video/intro-placeholder.mp4
cp "$S/Blog-Articles.mp4"                                        public/video/clip-1.mp4
cp "$S/Comp 3.mp4"                                               public/video/clip-2.mp4
cp "$S/Comp 1.mp4"                                               public/video/clip-3.mp4
cp "$S/Community Creation.mp4"                                   public/video/clip-4.mp4
cp "$S/SR Platform feature/Edit In Realtime_30fps.mp4"           public/video/clip-5.mp4
cp "$S/SR Platform feature/Asset Creation_30fps.mp4"             public/video/clip-6.mp4
du -ch public/video/*.mp4 | tail -1
```
Kỳ vọng: tổng khoảng 14MB.

- [ ] **Step 2: Khai hằng số**

Thay dòng `export const INTRO_VIDEO_SRC = "";` trong `src/lib/constants.ts` bằng:

```ts
/**
 * Homepage intro clip — the one that stands up as the reader scrolls to it.
 *
 * PLACEHOLDER borrowed from the Strike Robot project so the motion can be
 * reviewed. Replace with the 30s cut of "The Closest Thing We Have to Alien
 * Technology", ending where the narration reaches "the smaller the transistor,
 * the faster the computation". Self-hosted mp4 rather than a YouTube embed: an
 * iframe cannot be muted-autoplayed reliably and cannot be rotated in 3D.
 */
export const HOME_VIDEO = "/video/intro-placeholder.mp4";

/** Credit line under the intro clip. Empty until a real clip is in place. */
export const HOME_VIDEO_CREDIT: { label: string; href: string } | null = null;

/**
 * Six clips for the homepage carousel. PLACEHOLDERS, same caveat as above.
 * `topicKey` indexes `home.videos.topics` in the message files.
 */
export const CAROUSEL_VIDEOS = [
  { id: "c1", src: "/video/clip-1.mp4", topicKey: "basics" },
  { id: "c2", src: "/video/clip-2.mp4", topicKey: "transistor" },
  { id: "c3", src: "/video/clip-3.mp4", topicKey: "fabrication" },
  { id: "c4", src: "/video/clip-4.mp4", topicKey: "industry" },
  { id: "c5", src: "/video/clip-5.mp4", topicKey: "careers" },
  { id: "c6", src: "/video/clip-6.mp4", topicKey: "history" },
] as const;

/** Sticky backdrop behind the upper half of the homepage. */
export const HERO_BACKDROP = "/motion-gallery-backdrop.svg";
```

- [ ] **Step 3: Ghi rõ trong README**

Thêm vào mục "Việc còn lại → Đang chờ dữ liệu":

```markdown
- `public/video/*.mp4` là video giữ chỗ mượn từ dự án Strike Robot để xem
  hiệu ứng. Nội dung không liên quan bán dẫn — phải thay hết trước khi lên
  production. Điểm thay: `HOME_VIDEO` và `CAROUSEL_VIDEOS` trong
  `src/lib/constants.ts`.
```

- [ ] **Step 4: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch. `INTRO_VIDEO_SRC` không còn nơi nào tham chiếu sau Task 3.

- [ ] **Step 5: Commit**

```bash
git add public/video src/lib/constants.ts README.md
git commit -m "chore(assets): video giữ chỗ mượn từ Strike để xem hiệu ứng"
```

---

### Task 2: Bộ khung hai tầng cho trang chủ

**Files:**
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `StickyBackdrop`, `MainSection`, `SceneFillOverlay` từ `@/components/motion`; `HERO_BACKDROP` từ constants
- Produces: bố cục hai tầng mà các task sau đổ nội dung vào

Nửa trên đè lên nền dán; nửa dưới che nền đó đi. Không có lớp đè này thì nền chỉ là một cái băng-rôn, và trang mất chiều sâu.

- [ ] **Step 1: Sửa phần return của trang chủ**

Thay khối JSX trả về bằng:

```tsx
  return (
    <>
      <SceneFillOverlay targetId="latest-posts" />

      <div className="relative">
        <StickyBackdrop src={HERO_BACKDROP} />
        <div className="relative z-10 -mt-[100dvh]">
          <Hero />
        </div>
      </div>

      <MainSection>
        <SimpleStart />
        <LessonTopics counts={topicCounts} />
        <CountryBands />
        <VideoCarousel />
        <LatestPosts posts={posts} />
        <JoinCta />
      </MainSection>
    </>
  );
```

Cập nhật import: bỏ `VideoReveal`, thêm `VideoCarousel`, thêm ba thứ từ `@/components/motion` và `HERO_BACKDROP` từ `@/lib/constants`.

- [ ] **Step 2: Tạm thời stub VideoCarousel để trang build được**

```tsx
// src/components/sections/VideoCarousel.tsx
export function VideoCarousel() {
  return null;
}
```

Task 9 sẽ thay bằng bản thật.

- [ ] **Step 3: Kiểm tra kiểu, lint, build**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && NODE_ENV=production npx next build`
Kỳ vọng: sạch cả ba

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/page.tsx" src/components/sections/VideoCarousel.tsx
git commit -m "feat(home): bộ khung hai tầng nền dán và nửa dưới trang"
```

---

### Task 3: Hero — PAGE 1 và PAGE 2 gộp làm một

**Files:**
- Modify: `src/components/sections/Hero.tsx`
- Delete: `src/components/sections/VideoReveal.tsx`

**Interfaces:**
- Consumes: `useSharedScrollProgress`, `ScrollReveal3D`, `AnimatedButtonLabel`, `staggerContainer`, `staggerItem` từ `@/components/motion`; `AutoplayVideo`; `HOME_VIDEO`, `HOME_VIDEO_CREDIT`
- Produces: `Hero()` — không nhận prop

**Vì sao gộp:** mốc cuộn phải đo theo ref của **video**, và tiêu đề đọc chính mốc đó. Hai component riêng thì ref không đi qua được, mà truyền ref xuyên component chỉ để chia mốc cuộn là cách làm rối. Strike cũng để chung một section.

- [ ] **Step 1: Viết lại Hero**

```tsx
// src/components/sections/Hero.tsx
"use client";

import { useState } from "react";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  AnimatedButtonLabel,
  ScrollReveal3D,
  VIEWPORT_ONCE,
  staggerContainer,
  staggerItem,
  useSharedScrollProgress,
} from "@/components/motion";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { PillButton } from "@/components/ui/PillButton";
import { Link } from "@/i18n/navigation";
import { HOME_VIDEO, HOME_VIDEO_CREDIT } from "@/lib/constants";

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[13px] font-medium text-accent">
      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
        <path
          d="M6 0c.4 3.1 2.9 5.6 6 6-3.1.4-5.6 2.9-6 6-.4-3.1-2.9-5.6-6-6 3.1-.4 5.6-2.9 6-6Z"
          fill="currentColor"
        />
      </svg>
      {label}
    </span>
  );
}

/**
 * Homepage opening: headline, calls to action, and the intro clip that stands
 * upright as the reader scrolls to it.
 *
 * The headline and the clip share one scroll timeline — the title recedes on
 * the clip's progress, not its own. Measuring them separately lets the two
 * drift apart, and the drift is what makes a page feel assembled rather than
 * composed.
 *
 * Entrance runs on mount rather than on `whileInView`: this block is already
 * on screen when the page loads, so waiting for a scroll would leave it blank.
 */
export function Hero() {
  const t = useTranslations("home.hero");
  const prefersReducedMotion = useReducedMotion();
  const [ctaHovered, setCtaHovered] = useState(false);
  const { targetRef, scrollYProgress } = useSharedScrollProgress();

  const titleOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const recede = prefersReducedMotion
    ? undefined
    : { opacity: titleOpacity, scale: titleScale };

  return (
    <section className="px-5 pb-4 pt-14 md:px-8 md:pt-20">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={recede}
        className="mx-auto flex w-full max-w-content flex-col items-center text-center"
      >
        <motion.div
          variants={staggerItem}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <Badge label={t("badge1")} />
          <Badge label={t("badge2")} />
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="mt-6 max-w-4xl text-balance text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-text sm:text-[44px] md:text-[56px] lg:text-[64px]"
        >
          {t("headlinePart1")}{" "}
          <span className="text-gradient-brand">{t("headlinePart2")}</span>
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-text-muted md:text-lg"
        >
          {t("description")}
        </motion.p>

        <motion.div
          variants={staggerItem}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <span
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
          >
            <PillButton href="/bai-hoc" size="lg" className="px-6">
              <AnimatedButtonLabel active={ctaHovered}>
                {t("ctaPrimary")}
              </AnimatedButtonLabel>
            </PillButton>
          </span>
          <PillButton href="/gioi-thieu" variant="outline" size="lg">
            {t("ctaSecondary")}
          </PillButton>
        </motion.div>
      </motion.div>

      <div ref={targetRef} className="mx-auto mt-14 w-full max-w-content">
        <ScrollReveal3D targetRef={targetRef}>
          <figure className="m-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-primary shadow-card md:rounded-3xl">
              <AutoplayVideo
                src={HOME_VIDEO}
                ariaLabel={t("videoAriaLabel")}
                loadOnScroll
                mobileTapFullscreen
              />
            </div>

            <figcaption className="mx-auto mt-4 max-w-2xl text-center text-sm text-text-muted">
              {t("videoCaption")}
              {HOME_VIDEO_CREDIT && (
                <>
                  {" · "}
                  <Link
                    href={HOME_VIDEO_CREDIT.href}
                    className="underline underline-offset-4 hover:text-brand-600"
                  >
                    {HOME_VIDEO_CREDIT.label}
                  </Link>
                </>
              )}
            </figcaption>
          </figure>
        </ScrollReveal3D>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Xoá VideoReveal**

```bash
git rm src/components/sections/VideoReveal.tsx
```

- [ ] **Step 3: Kiểm tra kiểu, lint, build**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && NODE_ENV=production npx next build`
Kỳ vọng: sạch. Nếu `targetRef` báo lệch kiểu, xem cách đã dùng ở `src/app/motion-gallery/page.tsx` — ở đó ép kiểu hẹp đúng chỗ và có ghi lý do.

- [ ] **Step 4: Kiểm chứng nhanh bằng trình duyệt**

Khởi động `npx next start -p 3000`, mở `/vi`, cuộn chậm và xác nhận:
- Tiêu đề hiện lần lượt ngay khi tải, không đợi cuộn
- Video nghiêng ngửa khi vào từ đáy, dựng thẳng khi lên giữa màn hình
- Bản lề ở **cạnh dưới** video, không phải tâm
- Tiêu đề mờ và co **cùng nhịp** video dựng

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Hero.tsx
git commit -m "feat(home): PAGE 1-2 dùng chung mốc cuộn, video dựng đứng"
```

---

### Task 4: Thẻ xem trước khi hover video

**Files:**
- Create: `src/components/motion/useVideoHoverCard.ts`
- Create: `src/components/motion/VideoHoverCard.tsx`
- Modify: `src/components/motion/index.ts`
- Modify: `src/components/sections/Hero.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `useVideoHoverCard(hideDelayMs?: number): { isDesktop: boolean; cardVisible: boolean; onVideoEnter: () => void; onVideoLeave: () => void }`; `VideoHoverCard({ label, sublabel }): JSX.Element`

Hai thứ này có trong Hero của Strike nhưng chưa từng được port sang. Chúng bị
xoá ở phiên vá bảo mật vì lúc đó thật sự không nơi nào dùng, và Giai đoạn 1
không mang lại. Đây là khoảng trống thật so với chuẩn "giống Strike".

- [ ] **Step 1: Viết hook**

```ts
// src/components/motion/useVideoHoverCard.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shows a preview card while the pointer is over the video, and keeps it up
 * for a beat after the pointer leaves.
 *
 * The delay on the way out is the whole point: the card appears next to the
 * video, so a reader moving towards it would otherwise dismiss it by leaving
 * the video they were hovering.
 *
 * Desktop only. On a touch screen there is no hover to open it with, and the
 * tap already plays the video.
 */
export function useVideoHoverCard(hideDelayMs = 2500) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  useEffect(() => {
    if (isDesktop) return;
    clearHideTimer();
    setCardVisible(false);
  }, [isDesktop, clearHideTimer]);

  const onVideoEnter = useCallback(() => {
    if (!isDesktop) return;
    clearHideTimer();
    setCardVisible(true);
  }, [isDesktop, clearHideTimer]);

  const onVideoLeave = useCallback(() => {
    if (!isDesktop) return;
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setCardVisible(false);
      hideTimer.current = null;
    }, hideDelayMs);
  }, [isDesktop, clearHideTimer, hideDelayMs]);

  return { isDesktop, cardVisible, onVideoEnter, onVideoLeave };
}
```

- [ ] **Step 2: Viết thẻ**

```tsx
// src/components/motion/VideoHoverCard.tsx
"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { DURATION, EASE_STANDARD } from "@/components/motion/tokens";

/**
 * Frosted preview card that slides in beside the hero video.
 *
 * The border is an SVG stroke with a short dash travelling around it, rather
 * than a CSS border: `pathLength={100}` normalises the perimeter so one full
 * lap is always 100 units of dashoffset, whatever the card's size. Hovering
 * the card doubles the speed via `.hero-video-card:hover` in globals.css.
 */
export function VideoHoverCard({
  label,
  sublabel,
}: {
  label: string;
  sublabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: DURATION.reveal, ease: EASE_STANDARD }}
      style={{ perspective: 1400 }}
      className="hero-video-card pointer-events-none absolute bottom-5 right-5 z-10 w-[260px]"
    >
      <div className="relative rounded-2xl bg-black/45 p-5 backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[transform:rotateX(2deg)_rotateY(-5deg)_rotateZ(-1deg)]">
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox="0 0 260 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect
            x="1"
            y="1"
            width="258"
            height="118"
            rx="15"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.5"
            pathLength={100}
            strokeDasharray="14 86"
            className="hero-card-border-run"
          />
        </svg>

        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/75">{sublabel}</p>
        <ArrowUpRight
          className="mt-3 size-4 text-white/80"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Xác nhận CSS đã có sẵn**

```bash
grep -n "hero-card-border-run\|hero-video-card" src/app/globals.css
```
Kỳ vọng: đã có từ Giai đoạn 1 (`.hero-card-border-run` 3.5s, hover 2s). Nếu thiếu thì thêm:

```css
.hero-card-border-run {
  animation: heroCardBorderRun 3.5s linear infinite;
}
.hero-video-card:hover .hero-card-border-run {
  animation-duration: 2s;
}
@keyframes heroCardBorderRun {
  to {
    stroke-dashoffset: -100;
  }
}
```

- [ ] **Step 4: Xuất khẩu**

Thêm vào `src/components/motion/index.ts`:

```ts
export { VideoHoverCard } from "@/components/motion/VideoHoverCard";
export { useVideoHoverCard } from "@/components/motion/useVideoHoverCard";
```

- [ ] **Step 5: Nối vào Hero**

Trong `Hero.tsx`, thêm `const { cardVisible, onVideoEnter, onVideoLeave } = useVideoHoverCard();`,
gắn `onMouseEnter={onVideoEnter} onMouseLeave={onVideoLeave}` lên khối bọc video,
và trong khối đó thêm:

```tsx
<AnimatePresence>
  {cardVisible && (
    <VideoHoverCard
      key="hero-video-card"
      label={t("hoverCardLabel")}
      sublabel={t("hoverCardSublabel")}
    />
  )}
</AnimatePresence>
```

Thêm hai khoá `home.hero.hoverCardLabel` và `home.hero.hoverCardSublabel` vào
cả `vi.json` lẫn `en.json` — tiếng Việt "Xem toàn bộ video" / "Bấm để mở trên
kênh của dự án", tiếng Anh "Watch the full video" / "Opens on the project's
channel".

- [ ] **Step 6: Kiểm tra kiểu, lint, build**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && NODE_ENV=production npx next build`
Kỳ vọng: sạch cả ba

- [ ] **Step 7: Kiểm chứng bằng trình duyệt**

- Hover vào video: thẻ trượt lên hiện ra ở góc dưới phải
- Rời chuột: thẻ còn nán lại khoảng 2,5 giây rồi mới tan
- Viền thẻ có vệt sáng chạy vòng; hover lên thẻ thì chạy nhanh gấp đôi
- Ở 390px: không có thẻ nào hiện, chạm vẫn phát video như thường

- [ ] **Step 8: Commit**

```bash
git add src/components/motion/useVideoHoverCard.ts src/components/motion/VideoHoverCard.tsx src/components/motion/index.ts src/components/sections/Hero.tsx src/messages/vi.json src/messages/en.json
git commit -m "feat(motion): thẻ xem trước khi hover video, port nốt từ Strike"
```

---

### Task 5: SimpleStart — phần mở đầu PAGE 3

**Files:**
- Modify: `src/components/sections/SimpleStart.tsx`

**Interfaces:**
- Consumes: `AnimatedSection`, `staggerContainer`, `staggerItem`, `VIEWPORT_ONCE` từ `@/components/motion`
- Produces: `SimpleStart()` — không nhận prop

- [ ] **Step 1: Bọc bằng AnimatedSection và cho tiêu đề vào stagger**

Giữ nguyên nội dung chữ, chỉ đổi khung ngoài. Đổi `<section>` thành `<AnimatedSection>`, và bọc tiêu đề với phụ đề trong:

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={VIEWPORT_ONCE}
>
  <motion.h2 variants={staggerItem}>…</motion.h2>
  <motion.p variants={staggerItem}>…</motion.p>
</motion.div>
```

Thêm `"use client"` ở đầu tệp vì dùng `motion`.

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/SimpleStart.tsx
git commit -m "feat(home): phần mở đầu PAGE 3 hiện theo nhịp stagger"
```

---

### Task 6: LessonTopics — đổi bấm-để-mở thành di-chuột-để-mở

**Files:**
- Modify: `src/components/sections/LessonTopics.tsx:172-300`

**Interfaces:**
- Consumes: `useHoldToReveal` từ `@/components/motion`
- Produces: `LessonTopics({ counts })` — chữ ký không đổi

Tài liệu ghi rõ *"lúc di chuột vào thì nó mới hiện lên"*. Bản hiện tại phải bấm. Giữ nguyên toàn bộ cơ chế đang chạy tốt — thanh chỉ báo bám spring và vòng đo lại mỗi khung hình trong 520ms — chỉ đổi cái kích hoạt.

- [ ] **Step 1: Thêm mở bằng di chuột, có trễ chống nhấp nháy**

Trong component `LessonTopics`, thêm cạnh `activeId`:

```tsx
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 120ms of patience: without it, dragging the cursor diagonally across the
  // list flips through every row on the way to the one the reader wants.
  const openOnHover = useCallback((id: TopicId) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setActiveId(id), 120);
  }, []);

  const cancelHover = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);

  useEffect(() => cancelHover, [cancelHover]);
```

- [ ] **Step 2: Nối vào từng hàng**

Trên phần tử `button` của mỗi `FeatureItem`, thêm cạnh `onClick` đang có:

```tsx
  onMouseEnter={() => openOnHover(topic)}
  onMouseLeave={cancelHover}
  onFocus={() => setActiveId(topic)}
```

Giữ nguyên `onClick` — đó là đường cho thiết bị cảm ứng và cho bàn phím. `onFocus` mở ngay không trễ, vì chuyển tiêu điểm bằng bàn phím là hành động có chủ ý.

- [ ] **Step 3: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 4: Kiểm chứng bằng trình duyệt**

Mở `/vi`, tới khối bốn chủ đề:
- Rê chuột qua từng hàng: hàng dưới con trỏ mở ra, thanh chỉ báo trượt theo
- Kéo chéo nhanh qua cả bốn hàng: **không** nhấp nháy mở từng cái
- Bấm Tab: tiêu điểm chạy qua từng hàng và mở ngay
- Giả lập 390px cảm ứng: chạm mở được, không kẹt

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/LessonTopics.tsx
git commit -m "feat(home): chủ đề mở khi di chuột, giữ đường chạm và bàn phím"
```

---

### Task 7: CountryBands — logo công ty

**Files:**
- Modify: `src/components/sections/CountryBands.tsx`
- Modify: `src/lib/constants.ts`

**Interfaces:**
- Produces: `COUNTRY_BANDS` mỗi công ty đổi từ `string` sang `{ name: string; logo: string | null }`

Chưa có tệp logo. Task này dựng chỗ chứa và hiển thị tên khi chưa có logo, để lúc bạn gửi logo thì chỉ cần thả tệp vào.

- [ ] **Step 1: Đổi kiểu dữ liệu công ty**

Trong `src/lib/constants.ts`, đổi mảng `companies` của từng nước:

```ts
/**
 * Company logos live in `public/logos/`. `logo: null` renders the name as
 * text, so the band stays correct before the files arrive.
 */
    companies: [
      { name: "NVIDIA", logo: null },
      { name: "Broadcom", logo: null },
      { name: "AMD", logo: null },
      { name: "Micron", logo: null },
      { name: "Qualcomm", logo: null },
      { name: "Intel", logo: null },
    ],
```

Làm tương tự cho Đài Loan (TSMC), Hàn Quốc (Samsung, SK hynix), Hà Lan (ASML).

- [ ] **Step 2: Hiện logo khi có, hiện tên khi chưa**

Trong `CountryBands.tsx`, thay vòng lặp `band.companies.map((company) => ...)`:

```tsx
{band.companies.map((company) => (
  <span
    key={company.name}
    className="inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1 text-xs font-medium text-text-nav"
  >
    {company.logo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={company.logo}
        alt={company.name}
        loading="lazy"
        className="h-3.5 w-auto"
      />
    ) : (
      company.name
    )}
  </span>
))}
```

- [ ] **Step 3: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/CountryBands.tsx src/lib/constants.ts
git commit -m "feat(home): chỗ chứa logo công ty, hiện tên khi chưa có tệp"
```

---

### Task 8: Thông điệp cho băng chuyền video

**Files:**
- Modify: `src/messages/vi.json`
- Modify: `src/messages/en.json`

**Interfaces:**
- Produces: nhánh `home.videos` với `title`, `subtitle`, `cta`, `prev`, `next`, `topics.{basics,transistor,fabrication,industry,careers,history}`

Tách thành task riêng để Task 8 chỉ lo dựng giao diện.

- [ ] **Step 1: Thêm khoá vào cả hai tệp**

Chạy:

```bash
node -e '
const fs = require("fs");
const add = (file, v) => {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  j.home.videos = v;
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
};
add("src/messages/vi.json", {
  title: "Vẫn chưa đủ hấp dẫn sao? Thử học qua video nhé!",
  subtitle: "Các video được tác giả tuyển chọn kĩ lưỡng, phù hợp hoặc do chính tác giả thực hiện dịch, sản xuất với sự tâm huyết và trách nhiệm.",
  cta: "Khám phá thêm",
  prev: "Video trước",
  next: "Video tiếp theo",
  topics: {
    basics: "Kiến thức nền",
    transistor: "Transistor",
    fabrication: "Sản xuất chip",
    industry: "Ngành công nghiệp",
    careers: "Nghề nghiệp",
    history: "Lịch sử",
  },
});
add("src/messages/en.json", {
  title: "Still not convinced? Try learning from video.",
  subtitle: "Every clip is either chosen with care or translated and produced by us.",
  cta: "See more",
  prev: "Previous video",
  next: "Next video",
  topics: {
    basics: "Fundamentals",
    transistor: "Transistors",
    fabrication: "Fabrication",
    industry: "The industry",
    careers: "Careers",
    history: "History",
  },
});
console.log("added");
'
```

- [ ] **Step 2: Xác nhận hai tệp cân nhau**

```bash
node -e '
const vi=require("./src/messages/vi.json"), en=require("./src/messages/en.json");
const flat=(o,p="")=>Object.entries(o).flatMap(([k,v])=>typeof v==="object"&&v?flat(v,p+k+"."):[[p+k,v]]);
const V=flat(vi).map(x=>x[0]), E=flat(en).map(x=>x[0]);
const only=(a,b)=>a.filter(k=>!b.includes(k));
console.log("vi",V.length,"en",E.length,"| chỉ vi:",only(V,E),"| chỉ en:",only(E,V));
'
```
Kỳ vọng: hai số bằng nhau, hai mảng rỗng

- [ ] **Step 3: Commit**

```bash
git add src/messages/vi.json src/messages/en.json
git commit -m "feat(i18n): chuỗi cho khối băng chuyền video trang chủ"
```

---

### Task 9: VideoCarousel — PAGE 4

**Files:**
- Modify: `src/components/sections/VideoCarousel.tsx` (thay stub ở Task 2)

**Interfaces:**
- Consumes: `AnimatedSection`, `staggerContainer`, `staggerItem`, `VIEWPORT_ONCE`, `EASE_STANDARD`, `DURATION` từ `@/components/motion`; `AutoplayVideo`; `CAROUSEL_VIDEOS`
- Produces: `VideoCarousel()` — không nhận prop

Tự viết chứ không dùng thư viện. Embla ở Strike chỉ để vuốt ngang trên mobile và tắt ở desktop — nó không giải bài toán "ô giữa nổi bật, hai bên thu nhỏ mờ".

- [ ] **Step 1: Viết component**

```tsx
// src/components/sections/VideoCarousel.tsx
"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatedSection,
  DURATION,
  EASE_STANDARD,
  VIEWPORT_ONCE,
  staggerContainer,
  staggerItem,
} from "@/components/motion";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { Link } from "@/i18n/navigation";
import { CAROUSEL_VIDEOS } from "@/lib/constants";

const COUNT = CAROUSEL_VIDEOS.length;

/**
 * Six clips with the current one centred and its neighbours peeled back.
 *
 * Written by hand rather than with a carousel library: the requirement is a
 * focused centre with shrunken, dimmed siblings, and every library here either
 * ships a full-width slider or turns itself off above a breakpoint.
 *
 * Position is computed from the offset to the active index rather than by
 * translating a track, so the same maths drives layout and the swipe.
 */
export function VideoCarousel() {
  const t = useTranslations("home.videos");
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const step = useCallback((delta: number) => {
    setActive((current) => (current + delta + COUNT) % COUNT);
  }, []);

  /** Shortest signed distance on a ring, so 5 → 0 counts as +1 not -5. */
  const offsetOf = (index: number) => {
    const raw = index - active;
    if (raw > COUNT / 2) return raw - COUNT;
    if (raw < -COUNT / 2) return raw + COUNT;
    return raw;
  };

  return (
    <AnimatedSection id="home-videos" className="cv-auto px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-content">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            variants={staggerItem}
            className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-text md:text-[36px]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mt-4 text-pretty text-sm leading-relaxed text-text-muted md:text-base"
          >
            {t("subtitle")}
          </motion.p>
        </motion.div>

        <div
          className="relative mt-14 h-[240px] md:h-[420px]"
          role="group"
          aria-roledescription="carousel"
          aria-label={t("title")}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
          tabIndex={0}
        >
          {CAROUSEL_VIDEOS.map((clip, index) => {
            const offset = offsetOf(index);
            const isActive = offset === 0;
            // Anything beyond an immediate neighbour is parked off-stage.
            const hidden = Math.abs(offset) > 1;

            return (
              <motion.button
                key={clip.id}
                type="button"
                aria-label={clip.id}
                aria-current={isActive ? "true" : undefined}
                onClick={() => (isActive ? undefined : setActive(index))}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) step(1);
                  if (info.offset.x > 60) step(-1);
                }}
                className="absolute left-1/2 top-0 w-[78%] max-w-3xl cursor-pointer md:w-[62%]"
                animate={{
                  x: `calc(-50% + ${offset * 58}%)`,
                  scale: isActive ? 1 : 0.85,
                  opacity: hidden ? 0 : isActive ? 1 : 0.55,
                  zIndex: isActive ? 2 : 1,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: DURATION.base, ease: EASE_STANDARD }
                }
                style={{ pointerEvents: hidden ? "none" : "auto" }}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-primary shadow-card">
                  <AutoplayVideo
                    src={clip.src}
                    ariaLabel={t(`topics.${clip.topicKey}`)}
                    eager={isActive}
                    playMode={isActive ? "auto" : "press"}
                  />
                </div>
                <span className="mt-3 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-nav">
                  {t(`topics.${clip.topicKey}`)}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("prev")}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("next")}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronRight className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/bai-hoc"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            {t("cta")}
            <ArrowRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
```

- [ ] **Step 2: Kiểm tra kiểu, lint, build**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && NODE_ENV=production npx next build`
Kỳ vọng: sạch cả ba

- [ ] **Step 3: Kiểm chứng bằng trình duyệt**

Mở `/vi`, cuộn tới khối video:
- Ô giữa to và rõ, hai ô cạnh nhỏ hơn và mờ hơn
- Bấm ô cạnh: nó trượt vào giữa
- Bấm nút mũi tên: chuyển đúng một bước, vòng qua đầu cuối không nhảy ngược cả vòng
- Bấm vào khối rồi dùng phím ← →: chuyển được
- Ở 390px: vuốt ngang ô giữa chuyển được video
- Chỉ ô giữa tự phát; các ô khác đứng yên

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/VideoCarousel.tsx
git commit -m "feat(home): PAGE 4 băng chuyền sáu video, tự viết không dùng thư viện"
```

---

### Task 10: LatestPosts — PAGE 5

**Files:**
- Create: `src/components/sections/MotionGrid.tsx`
- Modify: `src/components/sections/LatestPosts.tsx`

**Interfaces:**
- Consumes: `AnimatedSection`, `TiltCard`, `staggerContainer`, `staggerItem`, `VIEWPORT_ONCE` từ `@/components/motion`
- Produces: `MotionGrid({ children, className? })`; `LatestPosts({ posts })` — chữ ký không đổi

`PostCard` là server component `async`, nên **không** thêm `"use client"` vào
`LatestPosts`. Một client component không render được server component async là
con của nó. Thay vào đó tách phần chuyển động thành một client component chỉ
nhận `children` — `LatestPosts` vẫn là server component và truyền các
`PostCard` đã dựng sẵn xuống.

- [ ] **Step 1: Viết MotionGrid**

```tsx
// src/components/sections/MotionGrid.tsx
"use client";

import { Children, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  TiltCard,
  VIEWPORT_ONCE,
  staggerContainer,
  staggerItem,
} from "@/components/motion";
import { cn } from "@/lib/utils";

/**
 * Staggers a grid of cards into view and tilts each on hover.
 *
 * Takes `children` rather than data so the cards themselves stay server
 * components — a client component cannot render an async server child, and
 * `PostCard` is async.
 */
export function MotionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Children.map(children, (child, index) => (
        <motion.div variants={staggerItem}>
          <TiltCard side={index % 2 === 0 ? "left" : "right"} className="h-full">
            {child}
          </TiltCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 2: Nối vào LatestPosts**

Trong `src/components/sections/LatestPosts.tsx`: đổi `<section>` ngoài cùng
thành `<AnimatedSection id="latest-posts">` — `id` này bắt buộc vì
`SceneFillOverlay` ở Task 2 trỏ vào nó — rồi thay lưới thẻ hiện có bằng:

```tsx
<MotionGrid>
  {posts.map((post) => (
    <PostCard key={post.id} post={post} />
  ))}
</MotionGrid>
```

`AnimatedSection` là client component nhưng chỉ bọc `children`, nên `PostCard`
bên trong vẫn chạy trên máy chủ.

- [ ] **Step 3: Kiểm tra kiểu, lint, build**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && NODE_ENV=production npx next build`
Kỳ vọng: sạch cả ba

- [ ] **Step 4: Kiểm chứng bằng trình duyệt**

- Cuộn tới khối bài viết: lớp trắng dâng từ giữa-đáy màn hình, nuốt nền phía trên
- Thẻ hiện lần lượt, không cùng lúc
- Hover thẻ: nghiêng nhẹ, thẻ trái và phải nghiêng ngược chiều nhau
- Bật "giảm chuyển động": không có lớp phủ, không nghiêng, vẫn đọc được

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/LatestPosts.tsx src/components/sections/MotionGrid.tsx
git commit -m "feat(home): PAGE 5 thẻ nghiêng và lớp phủ chuyển cảnh"
```

---

### Task 11: JoinCta — nhãn nút chữ nhảy

**Files:**
- Modify: `src/components/sections/JoinCta.tsx`

**Interfaces:**
- Consumes: `AnimatedButtonLabel` từ `@/components/motion`

- [ ] **Step 1: Nối AnimatedButtonLabel vào nút mở biểu mẫu**

Thêm `"use client"`, thêm state `hovered`, và bọc nhãn của thẻ `<a>` khi `JOIN_FORM_URL` có giá trị:

```tsx
<AnimatedButtonLabel active={hovered}>{t("formCta")}</AnimatedButtonLabel>
```

Nhánh chờ biểu mẫu giữ nguyên — nó là chữ thường, không phải nút.

- [ ] **Step 2: Kiểm tra kiểu và lint**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0`
Kỳ vọng: sạch

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/JoinCta.tsx
git commit -m "feat(home): nhãn nút CTA có chữ nhảy khi hover"
```

---

### Task 12: Nghiệm thu trang chủ

**Files:** không sửa tệp nào

- [ ] **Step 1: Chạy đủ cổng kiểm**

```bash
npx tsc --noEmit
npx next lint --max-warnings=0
npx vitest run
NODE_ENV=production npx next build
npx supabase start && ./scripts/verify-security.sh
```
Kỳ vọng: sạch hết, `verify-security.sh` 9/9

- [ ] **Step 2: Cân bảng dịch**

```bash
node -e '
const vi=require("./src/messages/vi.json"), en=require("./src/messages/en.json");
const flat=(o,p="")=>Object.entries(o).flatMap(([k,v])=>typeof v==="object"&&v?flat(v,p+k+"."):[[p+k,v]]);
const V=flat(vi), E=flat(en);
const only=(a,b)=>a.map(x=>x[0]).filter(k=>!b.map(y=>y[0]).includes(k));
console.log("vi",V.length,"en",E.length,"| lệch:",only(V,E).concat(only(E,V)));
'
```
Kỳ vọng: hai số bằng nhau, mảng lệch rỗng

- [ ] **Step 3: Không chuỗi tiếng Việt nào lọt vào bản tiếng Anh**

```bash
curl -s http://localhost:3000/en | grep -oE "Đang tải|Bài viết chưa|Vẫn chưa đủ|Khám phá thêm" || echo "sạch"
```
Kỳ vọng: `sạch`

- [ ] **Step 4: Kiểm chứng ba bề rộng bằng trình duyệt thật**

Dùng giả lập thiết bị của DevTools (resize cửa sổ không xuống dưới 500px trên macOS). Ở **390×844 dpr 3 touch**, **768×1024**, **1440×900**, trên cả `/vi` và `/en`:

1. `document.documentElement.scrollWidth === window.innerWidth`
2. Nền dán đứng yên, nội dung cuộn đè lên
3. Tiêu đề lùi đúng nhịp video dựng
4. Video bản lề ở cạnh dưới
5. Bốn chủ đề mở khi di chuột (desktop) / chạm (mobile), không nhấp nháy khi kéo chéo
6. Băng chuyền: ô giữa nổi, bấm ô cạnh và nút mũi tên đều chạy, vuốt được ở 390px
7. Lớp trắng dâng khi tới khối bài viết
8. Thẻ nghiêng khi hover, ngược chiều nhau
9. Nút CTA: chữ nhảy, nút không đổi kích thước
10. Console 0 lỗi — bắn một `console.error` mồi trước để chắc công cụ thật sự bắt được log
11. Bật "giảm chuyển động" rồi tải lại: mọi thứ đứng yên, không lớp phủ, trang vẫn đọc được

- [ ] **Step 5: So cạnh bản gốc**

Mở Strike Robot song song, đối chiếu ba điểm: nhịp tiêu đề vào trang, góc và tốc độ video dựng, cảm giác nghiêng thẻ. Khác chỗ nào thì ghi lại và sửa trước khi đóng giai đoạn.

- [ ] **Step 6: Dọn môi trường**

```bash
pkill -f "next start -p 3000"; npx supabase stop; rm -rf .next
```

---

## Hoàn thành Giai đoạn 2

- [ ] Đủ 12 task đã commit
- [ ] `tsc`, `lint`, `vitest`, `next build`, `verify-security.sh` đều sạch
- [ ] Bảng dịch cân, không tiếng Việt lọt bản tiếng Anh
- [ ] Đã kiểm chứng ba bề rộng trên cả hai ngôn ngữ, gồm trường hợp giảm chuyển động
- [ ] Đã so cạnh bản Strike và chấp nhận được

Sang Giai đoạn 3: trang Bài học và trang Video.

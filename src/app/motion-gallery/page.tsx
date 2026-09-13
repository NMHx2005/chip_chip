// src/app/motion-gallery/page.tsx
"use client";

import { useState, type RefObject } from "react";
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

// Own hook instance per card: `useHoldToReveal` holds a single hold/reveal
// state, so sharing one instance across both cards would let a press on one
// reveal the other's overlay too.
function GalleryTiltCard({ side }: { side: "left" | "right" }) {
  const hold = useHoldToReveal();

  return (
    <TiltCard
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
  );
}

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

  return (
    <>
      <SceneFillOverlay targetId="lower-half" />

      <div
        // `isolate` gives this wrapper its own stacking context, so the
        // StickyBackdrop's -z-10 layer stacks behind the hero content but
        // stays inside this wrapper instead of falling behind the opaque
        // page background painted on `body` — without it the gradient
        // never paints.
        className="relative isolate"
      >
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
          </section>

          <section
            // The video block lives in its own full-height section below the
            // fold, not alongside the title: the shared scroll timeline reads
            // this element's own position, so it must start off-screen for
            // the timeline to begin at 0 rather than already at rest.
            className="flex min-h-[100dvh] flex-col items-center justify-center px-6 pb-24"
          >
            <div
              // React's ref attribute requires RefObject<HTMLDivElement> exactly,
              // but targetRef is legitimately nullable (holds null before mount).
              ref={targetRef as RefObject<HTMLDivElement>}
              className="w-full max-w-3xl"
            >
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
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
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
                <GalleryTiltCard key={side} side={side} />
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

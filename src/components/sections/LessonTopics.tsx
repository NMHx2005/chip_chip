"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { EASE_STANDARD } from "@/components/motion";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Link } from "@/i18n/navigation";
import { TOPIC_IDS, TOPIC_TONE, type TopicId } from "@/lib/constants";

const INDICATOR_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};

const INDICATOR_HEIGHT = 44;
const ROW_CENTER_FROM_TOP = 34;

function TopicRow({
  topic,
  index,
  isActive,
  showDivider,
  count,
  onSelect,
  onHoverStart,
  onHoverEnd,
  prefersReducedMotion,
  buttonRef,
}: {
  topic: TopicId;
  index: number;
  isActive: boolean;
  showDivider: boolean;
  count: number;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  prefersReducedMotion: boolean | null;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const t = useTranslations("topics");
  const tSection = useTranslations("home.topics");
  const tone = TOPIC_TONE[topic];

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onSelect}
      aria-expanded={isActive}
      className="relative w-full cursor-pointer px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-6"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border"
        initial={false}
        animate={{ opacity: showDivider ? 1 : 0 }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: EASE_STANDARD }
        }
      />

      {/* Active surface, tinted with the topic colour */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl border border-black/[0.06]"
        style={{ background: tone.soft, willChange: "opacity" }}
        initial={false}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: EASE_STANDARD }
        }
      />

      <div className="relative flex items-center gap-4 py-5 sm:gap-5">
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full transition-transform duration-300"
          style={{
            background: tone.bg,
            transform: isActive ? "scale(1.35)" : "scale(1)",
          }}
        />

        <motion.span
          className="flex-1 text-text"
          initial={false}
          animate={{
            fontSize: isActive ? "21px" : "19px",
            fontWeight: isActive ? 600 : 500,
            opacity: isActive ? 1 : 0.85,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: EASE_STANDARD }
          }
          style={{ lineHeight: 1.25, willChange: "font-size, font-weight" }}
        >
          {t(`${topic}.title`)}
        </motion.span>

        <motion.span
          aria-hidden
          className="shrink-0"
          initial={false}
          animate={{ rotate: isActive ? 90 : 0, opacity: isActive ? 1 : 0.35 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: EASE_STANDARD }
          }
        >
          <ArrowRight className="size-4 text-text" strokeWidth={2} />
        </motion.span>
      </div>

      <motion.div
        className="relative overflow-hidden"
        initial={false}
        animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                height: { duration: 0.45, ease: EASE_STANDARD },
                opacity: { duration: isActive ? 0.4 : 0.18, ease: "easeOut" },
              }
        }
        aria-hidden={!isActive}
      >
        <div className="pb-6 pl-7 pr-1 sm:pl-8">
          <p className="max-w-md text-[15px] leading-relaxed text-text-muted">
            {t(`${topic}.description`)}
          </p>

          {count === 0 && (
            <p className="mt-3 text-sm text-text-muted">{tSection("empty")}</p>
          )}

          <Link
            href={{
              pathname: "/bai-hoc/[topic]",
              params: { topic },
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
            tabIndex={isActive ? 0 : -1}
          >
            {count > 0
              ? tSection("articleCount", { count })
              : tSection("readMore")}
            <ArrowRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>
      </motion.div>

      {index === TOPIC_IDS.length - 1 && !isActive && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border" />
      )}
    </button>
  );
}

export function LessonTopics({
  counts = {},
}: {
  counts?: Record<string, number>;
}) {
  const t = useTranslations("home.topics");
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<TopicId>(TOPIC_IDS[0]);
  const [indicator, setIndicator] = useState({ top: 0, ready: false });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 120ms of patience: without it, dragging the cursor diagonally across the
  // list flips through every row on the way to the one the reader wants.
  const openOnHover = useCallback((id: TopicId) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setActiveId(id), 120);
  }, []);

  // Only cancels the pending open — the row already open stays open, since
  // the cursor leaving the list doesn't mean the reader is done with it.
  const cancelHover = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);

  useEffect(() => cancelHover, [cancelHover]);

  const updateIndicator = useCallback((id: string) => {
    const wrapperEl = wrapperRef.current;
    const itemEl = itemRefs.current.get(id);
    if (!wrapperEl || !itemEl) return;

    const wrapperRect = wrapperEl.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    const centerY = itemRect.top - wrapperRect.top + ROW_CENTER_FROM_TOP;
    const top = centerY - INDICATOR_HEIGHT / 2;

    setIndicator((prev) =>
      prev.top === top && prev.ready ? prev : { top, ready: true }
    );
  }, []);

  // Re-measure every frame through the expand/collapse animation: rows below the
  // active one shift while the previous row collapses, so a single measurement
  // would lock onto the wrong position (most visible on the last row).
  useEffect(() => {
    const start = performance.now();
    let rafId = requestAnimationFrame(function tick() {
      updateIndicator(activeId);
      if (performance.now() - start < 520) {
        rafId = requestAnimationFrame(tick);
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeId, updateIndicator]);

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return;

    let rafId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateIndicator(activeIdRef.current);
      });
    });
    ro.observe(wrapperEl);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [updateIndicator]);

  const setItemRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    },
    []
  );

  return (
    <section
      id="topics"
      aria-label={t("headline")}
      className="px-5 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <SectionHeading
          namespace="home.topics"
          titleKey="headline"
          descriptionKey="description"
        />

        <div
          ref={wrapperRef}
          className="relative mx-auto mt-10 max-w-3xl md:mt-14"
        >
          {/* Continuous rail + the travelling indicator */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-3 bottom-3 hidden w-px bg-border md:block"
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute hidden w-[3px] rounded-full bg-primary md:block"
            style={{ left: -1, height: INDICATOR_HEIGHT }}
            initial={false}
            animate={{
              top: indicator.top,
              opacity: indicator.ready ? 1 : 0,
            }}
            transition={{
              top: indicator.ready
                ? INDICATOR_SPRING
                : { duration: 0, delay: 0 },
              opacity: {
                duration: prefersReducedMotion ? 0 : 0.35,
                delay: indicator.ready ? 0.15 : 0,
              },
            }}
          />

          <div className="md:pl-8">
            {TOPIC_IDS.map((topic, index) => (
              <TopicRow
                key={topic}
                topic={topic}
                index={index}
                isActive={topic === activeId}
                count={counts[topic] ?? 0}
                // Hide the rules touching the active row so its tinted card
                // reads as one unbroken block.
                showDivider={
                  index > 0 &&
                  index !== TOPIC_IDS.indexOf(activeId) &&
                  index !== TOPIC_IDS.indexOf(activeId) + 1
                }
                onSelect={() => setActiveId(topic)}
                onHoverStart={() => openOnHover(topic)}
                onHoverEnd={cancelHover}
                prefersReducedMotion={prefersReducedMotion}
                buttonRef={setItemRef(topic)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

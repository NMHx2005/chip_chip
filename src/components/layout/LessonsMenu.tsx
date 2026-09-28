"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { DURATION, EASE_STANDARD } from "@/components/motion";
import { Link, usePathname } from "@/i18n/navigation";
import { LESSON_SUBNAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * "Lessons" in the desktop bar: a disclosure button that opens Theory and
 * Video.
 *
 * A disclosure (button + list of links), not an ARIA `menu`: the entries are
 * ordinary links, reached with Tab. It opens on click or Enter/Space, on hover
 * with a mouse (the pointerType check keeps a tap from opening it on
 * pointerenter and then toggling it shut on click), and closes on Escape —
 * returning focus to the button — on a click outside, or when focus leaves it.
 */
export function LessonsMenu({ active }: { active: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Set while hover opened the menu, so the click that naturally follows a
  // hover (mouseenter then mousedown on the same button) does not toggle it
  // shut again — that click only clears the flag. Keyboard/touch opens leave
  // this false, so they still toggle normally.
  const openedByHoverRef = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Back/Forward can change the route without the menu ever receiving a
  // click, blur or outside pointerdown — close it so it doesn't linger.
  useEffect(() => {
    setOpen(false);
    openedByHoverRef.current = false;
  }, [pathname]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          openedByHoverRef.current = true;
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          openedByHoverRef.current = false;
          setOpen(false);
        }
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          // The click that follows a hover-open just claims the menu for
          // click/keyboard control from here on; it must not toggle it shut.
          if (openedByHoverRef.current) {
            openedByHoverRef.current = false;
            return;
          }
          setOpen((value) => !value);
        }}
        className={cn(
          "relative flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors",
          active ? "bg-primary text-white" : "text-text-nav hover:bg-surface-muted hover:text-accent"
        )}
      >
        {t("lessons")}
        <ChevronDown
          aria-hidden
          strokeWidth={2.2}
          className={cn("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          // The top padding bridges the gap to the bar, so the pointer can
          // travel down to the list without leaving the hover area.
          <motion.div
            className="absolute left-0 top-full z-10 pt-2"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATION.fast, ease: EASE_STANDARD }}
          >
            <ul
              id={listId}
              className="min-w-[180px] rounded-2xl border border-border bg-surface p-1.5 shadow-float"
            >
              {LESSON_SUBNAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-text-nav transition-colors hover:bg-surface-muted hover:text-accent focus-visible:bg-surface-muted"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
 *
 * Stacked with `z-0`, never a negative z-index: `html` and `body` both set an
 * explicit opaque background in globals.css, and neither is a positioned
 * element, so body's own background paints as an ordinary in-flow box of the
 * root stacking context (CSS2.1 Appendix E, step 3) — one step AFTER any
 * negative z-index descendant anywhere in the page (step 2), no matter how
 * deep it is nested. A negative z-index here would render behind that body
 * background and never be visible. `z-0` instead puts this layer in the
 * positive/zero bucket (step 6), which paints after body's background,
 * while still sitting below the `z-10` content that overlaps it.
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
        "pointer-events-none sticky top-0 z-0 h-[100dvh] w-full",
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

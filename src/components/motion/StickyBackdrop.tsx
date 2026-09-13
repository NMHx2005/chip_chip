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

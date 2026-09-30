import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one disclosure pattern for the site (FAQ, report-a-mistake, mobile
 * filters, mobile table of contents). Built on native `<details>`, so it works
 * without JavaScript. Opening is instant by design: a closed `<details>` hides
 * its content and CSS cannot animate the height. The plus turns 45 degrees and
 * fills in, which is the only motion.
 *
 * Wrap several in a `divide-y` container, or a bordered box, to make a list.
 */
export function Disclosure({
  summary,
  size = "md",
  defaultOpen = false,
  className,
  children,
}: {
  summary: ReactNode;
  /** `sm` is a shorter row with 14px text, for narrow spots. */
  size?: "md" | "sm";
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className={cn("group bg-surface", className)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-4 py-3 pl-5 pr-4 font-semibold leading-[1.4] text-text transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none [&::-webkit-details-marker]:hidden",
          size === "md" ? "min-h-[60px] text-base" : "min-h-[52px] text-sm"
        )}
      >
        <span className="min-w-0 flex-1 text-pretty">{summary}</span>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-text transition-[transform,background-color,color,border-color] duration-fast ease-standard group-hover:border-black/20 group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-white motion-reduce:transition-none"
        >
          <Plus className="size-4" strokeWidth={2} />
        </span>
      </summary>
      <div
        className={cn(
          "px-5 pb-5 pr-[68px] leading-[1.65] text-text-muted motion-safe:animate-notice-in",
          size === "md" ? "text-base" : "text-sm"
        )}
      >
        {children}
      </div>
    </details>
  );
}

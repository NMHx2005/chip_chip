import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/components/listing/FilterPills";
import { DifficultyBars } from "@/components/ui/DifficultyMark";
import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SegmentOption = {
  key: string;
  label: string;
  href: ListingHref;
  active: boolean;
  /** When set, the option shows its three difficulty bars before the label. */
  difficulty?: Difficulty;
};

/**
 * One choice out of a few, as a pill-shaped group of links. Links, not buttons:
 * every choice is a URL, so a filtered view can be shared and works without
 * JavaScript. `scroll={false}` keeps the page where it is when a filter changes.
 * Below `sm` the options fall into a two-column grid so they never scroll.
 */
export function SegmentedFilter({
  label,
  options,
  className,
}: {
  label: string;
  options: SegmentOption[];
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "grid grid-cols-2 gap-0.5 rounded-[20px] border border-border bg-surface p-1 sm:inline-flex sm:items-center sm:rounded-full",
        className
      )}
    >
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          scroll={false}
          aria-current={option.active ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 text-sm font-medium transition-colors duration-fast ease-standard motion-reduce:transition-none sm:rounded-full",
            option.active
              ? "bg-primary text-white"
              : "text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
          )}
        >
          {option.difficulty && <DifficultyBars difficulty={option.difficulty} />}
          {option.label}
        </Link>
      ))}
    </div>
  );
}

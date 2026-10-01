import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/lib/types";
import { TopicDisc } from "@/components/lessons/TopicNav";
import { DifficultyBars } from "@/components/ui/DifficultyMark";
import type { TopicId } from "@/lib/constants";
import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SegmentOption = {
  key: string;
  label: string;
  href: ListingHref;
  active: boolean;
  /** When set, the option shows its three difficulty bars before the label. */
  difficulty?: Difficulty;
  /** When set, the option shows that topic's number disc before the label. */
  topic?: TopicId;
};

/**
 * One choice out of a few, as a pill-shaped group of links. Links, not buttons:
 * every choice is a URL, so a filtered view can be shared and works without
 * JavaScript. `scroll={false}` keeps the page where it is when a filter changes.
 * Below `sm` the options fall into a two-column grid (three with `columns={3}`)
 * so they never scroll.
 */
export function SegmentedFilter({
  label,
  options,
  columns = 2,
  className,
}: {
  label: string;
  options: SegmentOption[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        columns === 3 ? "grid grid-cols-[repeat(3,minmax(0,1fr))]" : "grid grid-cols-2",
        "gap-0.5 rounded-[20px] border border-border bg-surface p-1 sm:inline-flex sm:items-center sm:rounded-full",
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
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors duration-fast ease-standard motion-reduce:transition-none sm:rounded-full sm:whitespace-nowrap sm:px-4",
            // Three equal columns on a phone are narrow: let a label wrap instead of overflowing.
            columns === 3 ? "px-2 text-center text-[13px] leading-[1.25] sm:text-sm sm:leading-normal" : "whitespace-nowrap px-4",
            option.active
              ? "bg-primary text-white"
              : "text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
          )}
        >
          {option.difficulty && <DifficultyBars difficulty={option.difficulty} />}
          {option.topic && <TopicDisc topic={option.topic} active={option.active} />}
          {option.label}
        </Link>
      ))}
    </div>
  );
}

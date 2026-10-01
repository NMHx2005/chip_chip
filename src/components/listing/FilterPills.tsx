import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ListingHref = ComponentProps<typeof Link>["href"];

export type FilterOption = {
  key: string;
  label: string;
  href: ListingHref;
  active: boolean;
};

/**
 * One row of filter links. Plain links rather than buttons: every filter is a
 * URL, so a filtered view can be shared, bookmarked and used without
 * JavaScript.
 */
export function FilterPills({ label, options }: { label: string; options: FilterOption[] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </span>
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {options.map((option) => (
          <li key={option.key}>
            <Link
              href={option.href}
              scroll={false}
              aria-current={option.active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                option.active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-nav [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:text-accent"
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

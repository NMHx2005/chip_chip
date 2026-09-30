import type { ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

/**
 * The filters behind a disclosure, for phones (below `lg`). A native `details`:
 * it works without JavaScript and keyboards and screen readers get its state for
 * free. The summary is 52px tall and carries a count badge when filters are on;
 * the chevron turns over while it opens.
 */
export function FilterDisclosure({
  summary,
  count,
  defaultOpen,
  children,
}: {
  summary: string;
  count: number;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border bg-surface lg:hidden">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2.5 px-4 text-sm font-bold text-text [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal aria-hidden className="size-[18px] text-text-nav" strokeWidth={2} />
        <span>{summary}</span>
        {count > 0 && (
          <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold tabular-nums text-white">
            {count}
          </span>
        )}
        <ChevronDown
          aria-hidden
          className="ml-auto size-4 shrink-0 transition-transform duration-fast ease-standard group-open:rotate-180 motion-reduce:transition-none"
          strokeWidth={2.2}
        />
      </summary>
      <div className="flex flex-col gap-5 border-t border-border p-4">{children}</div>
    </details>
  );
}

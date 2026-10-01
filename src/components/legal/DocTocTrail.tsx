import { cn } from "@/lib/utils";

/**
 * The contents on phones: a sideways row of anchor chips (the `TocRail` is
 * desktop-only). The label is drawn for sighted readers but hidden from the
 * nav's own `aria-label`.
 */
export function DocTocTrail({
  label,
  entries,
  className,
}: {
  label: string;
  entries: { id: string; text: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("lg:hidden", className)}>
      <p aria-hidden className="mb-2 text-sm font-bold text-text">
        {label}
      </p>
      <ul className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]">
        {entries.map((entry) => (
          <li key={entry.id} className="shrink-0 snap-center">
            <a
              href={`#${entry.id}`}
              className="flex min-h-11 items-center whitespace-nowrap rounded-full border border-border bg-surface px-4 text-sm font-medium text-text-nav transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:border-black/25"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

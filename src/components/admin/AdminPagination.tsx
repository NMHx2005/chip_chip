import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow } from "@/lib/listing-params";
import { cn } from "@/lib/utils";

const ITEM =
  "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors";
const IDLE = "border-border bg-surface text-text-nav hover:border-black/20";

/**
 * Numbered pagination for the admin lists.
 *
 * The public `Pagination` is close in spirit but is localized through
 * next-intl; the admin is deliberately Vietnamese-only, so this is its own
 * small component. Links are real URLs, so a page can be bookmarked.
 */
export function AdminPagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1 && page <= totalPages;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Phân trang" className="mt-6 flex flex-wrap items-center gap-2">
      {hasPrevious ? (
        <Link href={hrefFor(page - 1)} rel="prev" aria-label="Trang trước" className={cn(ITEM, IDLE)}>
          <ChevronLeft aria-hidden className="size-4" strokeWidth={2.2} />
        </Link>
      ) : (
        <span aria-hidden className={cn(ITEM, IDLE, "opacity-40")}>
          <ChevronLeft className="size-4" strokeWidth={2.2} />
        </span>
      )}

      {pageWindow(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-sm text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-label={`Trang ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(ITEM, item === page ? "border-primary bg-primary text-white" : IDLE)}
          >
            {item}
          </Link>
        )
      )}

      {hasNext ? (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Trang sau" className={cn(ITEM, IDLE)}>
          <ChevronRight aria-hidden className="size-4" strokeWidth={2.2} />
        </Link>
      ) : (
        <span aria-hidden className={cn(ITEM, IDLE, "opacity-40")}>
          <ChevronRight className="size-4" strokeWidth={2.2} />
        </span>
      )}

      <span className="ml-1 text-[13px] tabular-nums text-text-muted">
        Trang {page} / {totalPages}
      </span>
    </nav>
  );
}

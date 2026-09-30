import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/components/listing/FilterPills";
import { pageWindow } from "@/lib/listing-params";
import { cn } from "@/lib/utils";

const ITEM =
  "flex size-11 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-colors duration-fast ease-standard motion-reduce:transition-none";
const IDLE = "border-border bg-surface text-text-nav [@media(hover:hover)]:hover:border-black/20";

/**
 * Numbered pagination shared by every list. Each item is a 44px real link, so
 * pages are shareable and work without JavaScript. The previous and next arrows
 * stay on screen at the ends, dimmed and inert, so the bar does not jump; a line
 * underneath says where the reader is ("Trang 2 trong 4").
 */
export async function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => ListingHref;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations("pagination");
  const hasPrevious = page > 1 && page <= totalPages;
  const hasNext = page < totalPages;

  return (
    <nav aria-label={t("label")} className="mt-10 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {hasPrevious ? (
          <Link
            href={hrefFor(page - 1)}
            rel="prev"
            aria-label={t("previous")}
            className={cn(ITEM, IDLE)}
          >
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
              aria-label={t("page", { page: item })}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                ITEM,
                item === page ? "border-primary bg-primary text-white" : IDLE
              )}
            >
              {item}
            </Link>
          )
        )}

        {hasNext ? (
          <Link
            href={hrefFor(page + 1)}
            rel="next"
            aria-label={t("next")}
            className={cn(ITEM, IDLE)}
          >
            <ChevronRight aria-hidden className="size-4" strokeWidth={2.2} />
          </Link>
        ) : (
          <span aria-hidden className={cn(ITEM, IDLE, "opacity-40")}>
            <ChevronRight className="size-4" strokeWidth={2.2} />
          </span>
        )}
      </div>

      <p aria-live="polite" className="text-[13px] tabular-nums text-text-muted">
        {t("summary", { page, total: totalPages })}
      </p>
    </nav>
  );
}

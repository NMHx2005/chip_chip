import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/components/listing/FilterPills";
import { pageWindow } from "@/lib/listing-params";
import { cn } from "@/lib/utils";

const ITEM =
  "flex size-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors";

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

  return (
    <nav aria-label={t("label")} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && page <= totalPages && (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          aria-label={t("previous")}
          className={cn(ITEM, "border-border text-text-nav hover:border-black/20")}
        >
          <ChevronLeft className="size-4" strokeWidth={2.2} />
        </Link>
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
              item === page
                ? "border-primary bg-primary text-white"
                : "border-border text-text-nav hover:border-black/20"
            )}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          aria-label={t("next")}
          className={cn(ITEM, "border-border text-text-nav hover:border-black/20")}
        >
          <ChevronRight className="size-4" strokeWidth={2.2} />
        </Link>
      )}
    </nav>
  );
}

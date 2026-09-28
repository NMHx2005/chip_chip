import { getTranslations } from "next-intl/server";
import { X } from "lucide-react";
import { FilterPills, type ListingHref } from "@/components/listing/FilterPills";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS } from "@/lib/constants";
import {
  DEFAULT_LISTING,
  VIDEO_PLATFORMS,
  VIDEO_SORTS,
  listingQuery,
  type ListingParams,
} from "@/lib/listing-params";
import { DIFFICULTIES } from "@/lib/types";
import { PLATFORM_LABEL } from "@/lib/video";

function videosHref(query: Record<string, string>): ListingHref {
  return { pathname: "/video", query };
}

/**
 * The filter bar of the video listing. Everything is a link or a GET form,
 * so it works without JavaScript and every state has a shareable URL.
 */
export async function VideoFilters({ locale, current }: { locale: Locale; current: ListingParams }) {
  const [t, tTopics, tDifficulty] = await Promise.all([
    getTranslations("videos"),
    getTranslations("topics"),
    getTranslations("difficulty"),
  ]);

  const option = <K extends "platform" | "source" | "topic" | "difficulty">(
    key: K,
    value: ListingParams[K],
    label: string
  ) => ({
    key: value ?? "all",
    label,
    href: videosHref(listingQuery(current, { [key]: value })),
    active: current[key] === value,
  });

  const isFiltered =
    current.platform !== null ||
    current.source !== null ||
    current.topic !== null ||
    current.difficulty !== null ||
    current.sort !== DEFAULT_LISTING.sort;

  // The sort form re-submits every other filter as hidden fields; the page
  // starts over at 1, like any other change.
  const kept = listingQuery({ ...current, sort: DEFAULT_LISTING.sort });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 className="sr-only">{t("filtersLabel")}</h2>

      <FilterPills
        label={t("platform")}
        options={[
          option("platform", null, t("all")),
          ...VIDEO_PLATFORMS.map((p) => option("platform", p, PLATFORM_LABEL[p])),
        ]}
      />
      <FilterPills
        label={t("source")}
        options={[
          option("source", null, t("all")),
          option("source", "own", t("sourceOwn")),
          option("source", "curated", t("sourceCurated")),
        ]}
      />
      <FilterPills
        label={t("topic")}
        options={[
          option("topic", null, t("all")),
          ...TOPIC_IDS.map((id) => option("topic", id, tTopics(`${id}.title`))),
        ]}
      />
      <FilterPills
        label={tDifficulty("label")}
        options={[
          option("difficulty", null, t("all")),
          ...DIFFICULTIES.map((level) => option("difficulty", level, tDifficulty(level))),
        ]}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        <form method="get" action={getPathname({ href: "/video", locale })} className="flex flex-wrap items-end gap-2">
          {Object.entries(kept).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{t("sort")}</span>
            <select
              name="sort"
              defaultValue={current.sort}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              {VIDEO_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t(`sortOptions.${sort}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            {t("applySort")}
          </button>
        </form>

        {isFiltered && (
          <Link
            href="/video"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-accent transition-colors hover:text-black"
          >
            <X className="size-4" strokeWidth={2.2} />
            {t("clearFilters")}
          </Link>
        )}
      </div>
    </div>
  );
}

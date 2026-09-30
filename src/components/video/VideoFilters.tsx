import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { X } from "lucide-react";
import type { ListingHref } from "@/components/listing/FilterPills";
import { SegmentedFilter, type SegmentOption } from "@/components/lessons/SegmentedFilter";
import { TopicTrail } from "@/components/lessons/TopicTrail";
import { FilterDisclosure } from "@/components/video/FilterDisclosure";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { TOPIC_IDS } from "@/lib/constants";
import { VIDEO_PLATFORMS, VIDEO_SORTS, listingQuery, type ListingParams } from "@/lib/listing-params";
import { DIFFICULTIES } from "@/lib/types";
import { activeFilterCount, activeScope, isFiltered } from "@/lib/video-listing";
import { PLATFORM_LABEL } from "@/lib/video";

function videosHref(query: Record<string, string>): ListingHref {
  return { pathname: "/video", query };
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-muted">{children}</span>
  );
}

/**
 * The filter area of the video listing: on `lg` and up a white panel of
 * segmented filters plus a sort row; below that a disclosure with the same
 * groups (a closed `details` cannot be forced open by CSS, so the two are
 * separate copies). Everything is a link, so it works without JavaScript and
 * every state has a shareable URL. The result line sits outside both, and is
 * the only live region.
 */
export async function VideoFilters({
  current,
  shown,
  total,
}: {
  current: ListingParams;
  /** Videos on this page. */
  shown: number;
  /** Videos that match the filters, across all pages. */
  total: number;
}) {
  const [t, tTopics, tDifficulty] = await Promise.all([
    getTranslations("videos"),
    getTranslations("topics"),
    getTranslations("difficulty"),
  ]);

  const option = <K extends "platform" | "source" | "topic" | "difficulty" | "sort">(
    key: K,
    value: ListingParams[K],
    label: string,
    extra: Partial<SegmentOption> = {}
  ): SegmentOption => ({
    key: String(value ?? "all"),
    label,
    href: videosHref(listingQuery(current, { [key]: value })),
    active: current[key] === value,
    ...extra,
  });

  const platform = [
    option("platform", null, t("all")),
    ...VIDEO_PLATFORMS.map((p) => option("platform", p, PLATFORM_LABEL[p])),
  ];
  const source = [
    option("source", null, t("all")),
    option("source", "own", t("sourceOwn")),
    option("source", "curated", t("sourceCurated")),
  ];
  const topic = [
    option("topic", null, t("all")),
    ...TOPIC_IDS.map((id) => option("topic", id, tTopics(`${id}.title`), { topic: id })),
  ];
  const difficulty = [
    option("difficulty", null, t("all")),
    ...DIFFICULTIES.map((level) => option("difficulty", level, tDifficulty(level), { difficulty: level })),
  ];
  const sort = VIDEO_SORTS.map((value) => option("sort", value, t(`sortOptions.${value}`)));
  const topicEntries = topic.map((entry, index) => ({
    key: entry.key,
    label: entry.label,
    href: entry.href,
    active: entry.active,
    topic: index === 0 ? null : TOPIC_IDS[index - 1],
  }));

  const count = activeFilterCount(current);
  const filtered = isFiltered(current);
  const scope = activeScope(current, {
    platform: (value) => PLATFORM_LABEL[value],
    source: (value) => (value === "own" ? t("sourceOwn") : t("sourceCurated")),
    topic: (value) => tTopics(`${value}.title`),
    difficulty: (value) => tDifficulty(value),
  });
  const resultText = [total === 0 ? t("resultNone") : t("result", { shown, total }), ...scope].join(" · ");
  // Only the sort differs from the default: there is no filter count to show.
  const clearLabel = count > 0 ? t("clearFiltersCount", { count }) : t("clearFilters");

  return (
    <div>
      <h2 className="sr-only">{t("filtersLabel")}</h2>

      <div className="hidden flex-col gap-5 rounded-3xl border border-border bg-surface p-6 lg:flex">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex flex-col gap-2">
            <GroupLabel>{t("platform")}</GroupLabel>
            <SegmentedFilter label={t("platform")} options={platform} />
          </div>
          <div className="flex flex-col gap-2">
            <GroupLabel>{t("source")}</GroupLabel>
            <SegmentedFilter label={t("source")} options={source} />
          </div>
          <div className="flex flex-col gap-2">
            <GroupLabel>{tDifficulty("label")}</GroupLabel>
            <SegmentedFilter label={tDifficulty("label")} options={difficulty} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <GroupLabel>{t("topic")}</GroupLabel>
          <SegmentedFilter label={t("topic")} options={topic} />
        </div>
      </div>

      <FilterDisclosure summary={t("filtersSummary")} count={count} defaultOpen={count > 0}>
        <div className="flex flex-col gap-2">
          <GroupLabel>{t("platform")}</GroupLabel>
          <SegmentedFilter label={t("platform")} options={platform} columns={3} />
        </div>
        <div className="flex flex-col gap-2">
          <GroupLabel>{t("source")}</GroupLabel>
          <SegmentedFilter label={t("source")} options={source} columns={3} />
        </div>
        <div className="flex flex-col gap-2">
          <GroupLabel>{t("topic")}</GroupLabel>
          <TopicTrail label={t("topic")} entries={topicEntries} className="-mb-1" />
        </div>
        <div className="flex flex-col gap-2">
          <GroupLabel>{tDifficulty("label")}</GroupLabel>
          <SegmentedFilter label={tDifficulty("label")} options={difficulty} />
        </div>
        <div className="flex flex-col gap-2">
          <GroupLabel>{t("sort")}</GroupLabel>
          <SegmentedFilter label={t("sort")} options={sort} />
        </div>
        {filtered && (
          <Button href="/video" variant="secondary" scroll={false}>
            {clearLabel}
          </Button>
        )}
      </FilterDisclosure>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="hidden items-center gap-3 lg:flex">
          <GroupLabel>{t("sort")}</GroupLabel>
          <SegmentedFilter label={t("sort")} options={sort} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:justify-end">
          <p role="status" aria-live="polite" className="text-sm tabular-nums text-text-muted">
            {resultText}
          </p>
          {filtered && (
            <Link
              href="/video"
              scroll={false}
              className="hidden min-h-11 items-center gap-1.5 text-sm font-semibold text-accent underline underline-offset-[3px] [@media(hover:hover)]:hover:text-black lg:inline-flex"
            >
              <X aria-hidden className="size-4" strokeWidth={2.2} />
              {clearLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import type { ListingHref } from "@/components/listing/FilterPills";
import { TOPIC_IDS } from "@/lib/constants";
import {
  DEFAULT_LISTING,
  VIDEO_PLATFORMS,
  type ListingParams,
} from "@/lib/listing-params";

/** Filters the reader has switched on; sort and page are not filters. */
export function activeFilterCount(current: ListingParams): number {
  return [current.platform, current.source, current.topic, current.difficulty].filter(
    (value) => value !== null
  ).length;
}

/** True when the view differs from the plain listing, so "clear" has something to clear. */
export function isFiltered(current: ListingParams): boolean {
  return activeFilterCount(current) > 0 || current.sort !== DEFAULT_LISTING.sort;
}

/** Names of the active filters, in the order the panel shows them. */
export function activeScope(
  current: ListingParams,
  label: {
    platform: (value: NonNullable<ListingParams["platform"]>) => string;
    source: (value: NonNullable<ListingParams["source"]>) => string;
    topic: (value: NonNullable<ListingParams["topic"]>) => string;
    difficulty: (value: NonNullable<ListingParams["difficulty"]>) => string;
  }
): string[] {
  const scope: string[] = [];
  if (current.platform) scope.push(label.platform(current.platform));
  if (current.source) scope.push(label.source(current.source));
  if (current.topic) scope.push(label.topic(current.topic));
  if (current.difficulty) scope.push(label.difficulty(current.difficulty));
  return scope;
}

export type VideoHeroStatKey = "videos" | "platforms" | "topics";

/** The three cells of the hero card; the total is the real, unfiltered one. */
export function videoHeroStats(input: { total: number }): { key: VideoHeroStatKey; value: number }[] {
  return [
    { key: "videos", value: input.total },
    { key: "platforms", value: VIDEO_PLATFORMS.length },
    { key: "topics", value: TOPIC_IDS.length },
  ];
}

/** Send a page change to the top of the list instead of leaving the reader mid-page. */
export function withHash(href: ListingHref, hash: string): ListingHref {
  return typeof href === "string" ? href : ({ ...href, hash } as ListingHref);
}

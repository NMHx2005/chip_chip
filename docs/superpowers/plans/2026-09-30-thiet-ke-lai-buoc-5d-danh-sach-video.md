# Step 5d — Video listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Redesign `/video` to match `boards/Video-Index-*`, `Video-Filtered-*`, `Video-Empty-*`, `Video-Spec`, reusing the lessons-listing components from step 4.

**Architecture:** Same shape as `LessonsListing`: `PageHero` with a 3-cell stats card and the banner image, a white filter panel (desktop) / a chevron disclosure (phones) made of `SegmentedFilter`s, a sort bar with a live result line, a `CardReveal` grid with `id="danh-sach"`, shared `Pagination`. `VideoCard` is rebuilt on the `PostCard` look. Everything stays links (server-rendered, shareable URLs). One new count query, `countVideos`.

**Tech Stack:** Next.js 14, next-intl, Tailwind, Vitest.

**Spec:** `docs/thiet-ke-giao-dien/boards/Video-Spec.dc.html`, `Video-Index-VI-1280`, `Video-Index-EN-390-Closed/Open`, `Video-Filtered-*`, `Video-Empty-*`, `HANDOFF.md`.

## Decisions (maintainer, 2026-09-30)
- D1: add `countVideos(locale)` (unfiltered count). Hero "Videos" shows the real total; when it is 0 the filter panel and sort bar are hidden and the "no videos yet" EmptyState shows.
- D2: filtered-empty shows only "Clear all filters" (+ "Read lessons"); no relaxed-filter suggestion counts, no extra queries.
- D3: no V6 (no `useTransition`, no dimming, no client wrapper); all controls are plain links with `scroll={false}`.
- D4: sort becomes a 4-option `SegmentedFilter` of links (applies at once, resets to page 1); the native select and "Apply" button are removed. Phones: chevron `details` with a count badge.
- D5 (defaults, not asked): no duration badge (no such field); TikTok without a thumbnail gets the topic-tone plate + number watermark; the desktop panel and the phone disclosure stay two separate copies (a closed `details` cannot be forced open); the Platforms stat is `VIDEO_PLATFORMS.length`, Topics is `TOPIC_IDS.length`; the result line names every active filter.

## Global Constraints
- Every string through `src/messages/{vi,en}.json`, same key set; vi first (RED), then en.
- No `${}`-built Tailwind classes; hover as `[@media(hover:hover)]:hover:...`; durations `fast/card/panel/base`.
- Motion via `hero-in`, `CardReveal`, CSS transitions only; reduced motion respected.
- Tap targets ≥ 44px (disclosure summary 52px); focus ring from the global `:focus-visible`.
- No `scroll-margin` on anchors that already sit under `html { scroll-padding-top: 6rem }` (it doubles).
- Verify layout in the browser with geometry. No videos locally (no Supabase): verify with a temporary gallery page, then delete it and its `.next/types` file.

## Review Focus
- `?page=abc`, `?platform=bogus`, `?sort=bogus`: parsed to defaults; `?page=999` still 404.
- Filter combination with 0 results vs a site with 0 videos: different screens (filtered-empty keeps the panel; empty hides it).
- Active option is marked (`aria-current`) in every group, in both the desktop panel and the phone disclosure; the phone disclosure opens by default when a filter is active.
- Result line under 1, 12 and 34 videos and with 0–4 active filters; long channel names in the card don't overflow at 390px.
- Lesson page "related videos" still renders (uses `VideoCard compact`).
- `VideoCard` for a video with no `ref`/thumbnail/topic/difficulty/date: no empty gaps.

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json` (`videos.*`).
- [ ] vi first (RED on `keys-parity.test.ts`): add `stats.videos` ("Video"), `stats.platforms` ("Nền tảng"), `stats.topics` ("Chủ đề"), `filtersSummary` ("Bộ lọc và sắp xếp"), `result` ("Hiển thị {shown} trong {total} video"), `resultNone` ("Không tìm thấy video nào"), `clearFiltersCount` ("Xoá bộ lọc ({count})"), `listHeading` ("Danh sách video"), `emptyTitle` ("Chưa có video nào"), `emptyBody` ("Những video đầu tiên đang được thực hiện. Bạn quay lại sau nhé, hoặc đọc bài học và blog trong lúc chờ."), `emptyFilteredTitle` ("Không có video nào khớp bộ lọc này"), `emptyFilteredBody` ("Thử nới lỏng một bộ lọc, hoặc xoá hết để xem toàn bộ video."), `clearAll` ("Xoá hết bộ lọc"), `readLessons` ("Đọc bài học"), `readBlog` ("Đọc blog"). Existing `all`, `platform`, `source`, `topic`, `sort`, `sortOptions.*`, `sourceOwn/Curated/CuratedBy`, `filtersLabel` stay.
- [ ] en (GREEN): "Videos", "Platforms", "Topics", "Filters and sort", "Showing {shown} of {total} videos", "No videos found", "Clear filters ({count})", "Video list", "No videos yet", "The first videos are being made. Come back soon, or read the lessons and the blog in the meantime.", "No videos match these filters", "Try loosening one filter, or clear them all to see every video.", "Clear all filters", "Read lessons", "Read the blog".
- [ ] Commit `feat(i18n): strings for the redesigned video listing`.

### Task 2: Pure helpers (TDD)
**Files:** create `src/lib/video-listing.ts`, `src/lib/video-listing.test.ts`.
- [ ] RED then GREEN:
  - `activeFilterCount(current: ListingParams): number` — counts non-null `platform`, `source`, `topic`, `difficulty` (sort and page do not count).
  - `isFiltered(current)` — count > 0 or `sort !== DEFAULT_LISTING.sort`.
  - `activeScope(current, label: { platform(p): string; source(s): string; topic(t): string; difficulty(d): string }): string[]` — labels of active filters in the order platform, source, topic, difficulty.
  - `videoHeroStats({ total }): { key: "videos"|"platforms"|"topics"; value: number }[]` — `[total, VIDEO_PLATFORMS.length, TOPIC_IDS.length]`.
  - `withHash(href: ListingHref, hash: string): ListingHref` — for object hrefs sets `hash`, string hrefs unchanged (extracted from `LessonsListing.toGrid`).
- [ ] Commit `feat(video): pure helpers for the video listing`.

### Task 3: countVideos
**Files:** `src/lib/queries/posts.ts`.
- [ ] `countVideos(locale): Promise<number>` — head count (`select("id", { count: "exact", head: true })`) of `status=published, locale, kind=video`; `requireSupabase` guard returns 0; log and return 0 on error.
- [ ] Commit `feat(queries): count all published videos`.

### Task 4: PageHero scrim for the image backdrop
**Files:** `src/components/sections/PageHero.tsx`.
- [ ] `backdropImage` branch: replace the bottom-only gradient with the board's scrim — `bg-[linear-gradient(90deg,rgba(229,229,229,.92)_0%,rgba(229,229,229,.86)_55%,rgba(229,229,229,0)_100%)]` from `md`, flat `bg-[rgba(229,229,229,.8)]` below; keep a bottom fade to `bg`. Only `/video` passes `backdropImage`, so nothing else changes. Check `/video` at both widths.
- [ ] Commit `feat(pages): left-to-right scrim for the image backdrop`.

### Task 5: Filter building blocks
**Files:** `src/components/lessons/SegmentedFilter.tsx`, `src/components/lessons/TopicNav.tsx` (`TopicNavEntry.count` optional), `TopicTrail.tsx` (hide the count when absent), create `src/components/video/FilterDisclosure.tsx`.
- [ ] `SegmentedFilter`: optional `topic?: TopicId | null` on an option (renders `TopicDisc`), optional `columns?: 2 | 3` for the phone grid (`grid-cols-3` written out in full).
- [ ] `FilterDisclosure({ summary, count, defaultOpen, children })`: `details` with a 52px summary — `SlidersHorizontal` icon, text, black count badge only when `count > 0`, chevron rotating 180° over `duration-fast` (`group-open:rotate-180`, no rotation under reduced motion) — `lg:hidden`.
- [ ] Commit `feat(listing): topic discs, three-column segments and a filter disclosure`.

### Task 6: VideoCard
**Files:** `src/components/video/VideoCard.tsx`; `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx` only if its `VideoCard compact` call needs a prop change.
- [ ] Rebuild on the `PostCard` look: 16:9 cover (radius 12) with a platform badge top-left (`bg-black/85`, 12px), a 48px play disc with a 2px white ring centred, hover image scale 1.03 (`[@media(hover:hover)]:group-hover:scale-[1.03]`, off under reduced motion); topic chip (`TopicChip`) → title (18px, `line-clamp-3`, `sm:min-h-[47px]`) → source line (icon: `Cpu` own / `Bookmark` curated, one line, ellipsis) → footer (`DifficultyMark`, "· date", 32px arrow disc); no thumbnail → topic-tone plate + number watermark (as `PostCard`), neutral plate without topic.
- [ ] `compact` (related videos and phones under 640px): 132px cover with a 32px disc, title and topic chip to the right, source line and footer under it.
- [ ] Hover/press classes written out in full (no `${}`), `transition-[border-color,box-shadow,transform]`.
- [ ] Commit `feat(video): redesigned video card`.

### Task 7: VideoFilters and result bar
**Files:** rewrite `src/components/video/VideoFilters.tsx`.
- [ ] Desktop (`hidden lg:flex`) panel `rounded-3xl border bg-surface p-6`: row 1 Platform, Source, Difficulty as labelled `SegmentedFilter`s (wrap), row 2 Topic with discs; below it the bar: Sort as a 4-option `SegmentedFilter` (links to `listingQuery(current, { sort })`, page reset), the `role="status" aria-live="polite"` result line (`t("result", …)` or `t("resultNone")` followed by ` · ` and `activeScope`), and, when `isFiltered`, the 44px "Clear filters (n)" link with an X icon.
- [ ] Phones (`lg:hidden`) `FilterDisclosure` (open when `activeFilterCount > 0`): Platform (`columns=3`), Source (`columns=3`), Topic (`TopicTrail` without counts), Difficulty (2×2), Sort (2×2), secondary `Button` "Clear filters (n)"; the result line stays outside the disclosure.
- [ ] `h2.sr-only` "Filter videos". Remove the select form and the `getPathname` import.
- [ ] Commit `feat(video): segmented filters, sort links and a result line`.

### Task 8: Assemble the page
**Files:** `src/app/[locale]/video/page.tsx`, `src/components/lessons/LessonsListing.tsx` (import `withHash`, drop its private `toGrid`).
- [ ] `PageHero` with `stats={videoHeroStats({ total: allVideos })…}` (labels `t("stats.*")`), `backdropImage={VIDEO_BANNER}`; `countVideos` fetched with `listVideos` in `Promise.all`.
- [ ] `allVideos === 0`: no filters, `EmptyState` (`emptyTitle`, `emptyBody`, actions "Read lessons" primary + arrow → `/bai-hoc`, "Read the blog" secondary → `/blog`). Otherwise filters, then `div#danh-sach` (no `scroll-mt`, see constraints) with `h2.sr-only` `listHeading`; the grid `sm:grid-cols-2 lg:grid-cols-3` of `CardReveal` + `VideoCard`; filtered-empty `EmptyState` (`emptyFilteredTitle`/`Body`, "Clear all filters" primary → `/video`, "Read lessons" secondary); past-last-page keeps `notFound()`; `Pagination` `hrefFor={(page) => withHash({ pathname: "/video", query: listingQuery(current, { page }) }, "danh-sach")}`.
- [ ] Browser check with a temporary gallery page for the parts that need data (cards, filters with active state, result line, filtered-empty) and the real `/vi/video` + `/en/video` for the empty state, at 1280 and 390: hero stats card 3 cells, scrim, panel geometry, disclosure closed/open, 44px targets, no horizontal scroll; `?page=999` 404, `?page=abc` 200, `?platform=bogus` 200. Delete the temporary page and its `.next/types` file.
- [ ] Commit `feat(video): redesigned video listing`.

### Task 9: Gate, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`; `npm run build` unverifiable in the sandbox (say so).
- [ ] `docs/BAN-GIAO.md`: step 5d paragraph, the new test count, unused keys (`applySort`, `filtersToggle`, `filtersToggleActive`, `empty`, `emptyFiltered`, `clearFilters`).
- [ ] One Opus review of the whole branch; fix Critical/Important with TDD; defer minors in the ledger.

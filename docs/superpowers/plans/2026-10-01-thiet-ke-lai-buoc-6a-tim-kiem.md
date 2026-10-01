# Step 6a — Search page + navbar popover Implementation Plan

**Goal:** Redesign the search results page (`/tim-kiem`), its initial and no-results states, and the navbar search popover / mobile field, to match `boards/Search-Results-*`, `Search-Initial-*`, `Search-NoResults-*`, `Search-Popover-VI-1280`, `Search-Menu-EN-390`, and reusing the shared components from steps 1–5.

**Branch:** `feat/thiet-ke-lai-buoc-6a-tim-kiem` (off `main`).

**Spec:** `docs/thiet-ke-giao-dien/boards/` (above) + `Global-Shared.dc.html` + `HANDOFF.md`.

## Scope (decided with the maintainer, 2026-10-01)
- **In:** results page, initial (no query) state, no-results state, navbar popover, mobile-menu field, the "SearchField" pill, matched-word highlighting, the small new components.
- **Out (later steps):** the search **error** state (`Search-Error-*`) — it needs `searchPosts` to return a success/error status and the step-7 error frame, so it goes with the 404/error-pages step (7). Contact → 6b, About → 6c, Contribute + Privacy → 6d.
- **Fixed by the board / HANDOFF:** no type-ahead (the form stays a JS-free `GET`); no pagination (max 10 shown per group); one input-border token `field` (#767676, already added in step 1); success notices use accent, red only for errors.

## Data semantics to reuse (do not change)
`search_posts` (migration `20260928000200_search.sql`) lowercases + unaccents the query, splits on non-alphanumerics into tokens, keeps all tokens (drops 1-char tokens unless the query is a single token), and ANDs each as a **word-prefix** match against `title` / `excerpt` / `plain_text`. Highlighting must mirror exactly this so a row never shows a highlight where the query did not match.

## Global constraints
- Every string through `src/messages/{vi,en}.json`, identical key sets (vi first, RED on `keys-parity.test.ts`, then en).
- No `${}`-built Tailwind classes; hover scoped with `[@media(hover:hover)]:hover:`; durations from tokens (`fast/card/panel/base`, `ease-standard`).
- Reduced motion: every transition has a `motion-reduce` / `prefers-reduced-motion` branch (the boards use the global 0.01ms rule; the code uses `motion-reduce:` variants — match the existing pages).
- Tap targets ≥ 44px; verify layout in the browser, not from bounding boxes.
- Server components by default; only the popover is client.
- No `scroll-margin` on anchors (`html scroll-padding-top` already clears the navbar).

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json` (`search.*`).
- [ ] vi first (RED): add `searchIn` ("Tìm trong Chíp Chíp"), `searchHint` ("Có dấu hay không dấu đều được."), `initialTitle` ("Bắt đầu bằng một từ khoá"), `initialBody` (“…Gõ có dấu hay không dấu đều được: “ban dan” vẫn tìm ra “bán dẫn”.”), `trySearching` ("Thử tìm"), `suggestions` (array: `["bán dẫn","transistor","diode","quang khắc","định luật Moore"]`), `browseTopics` ("Hoặc duyệt theo chủ đề"), `noResultsTitle` ("Không tìm thấy"), `noResultsBody`, `tryKeywords` ("Thử một từ khoá khác"), `clearKeyword` ("Xoá từ khoá"), `browseLessons` ("Xem bài học"), `resultLine` ("Hiển thị {shown} trong {total} kết quả cho “{query}”"). Change `label` to "Từ khoá".
- [ ] en (GREEN): the mirror strings; `resultLine` pluralised like the existing `resultCount`.
- [ ] Commit `feat(i18n): strings for the redesigned search`.
- **Note:** `suggestions` is a JSON array — confirm `keys-parity.test.ts` still passes; if it trips, switch to `suggestions.1`…`suggestions.5` keys.

### Task 2: Highlight helper (TDD)
**Files:** create `src/lib/search-highlight.ts` + `search-highlight.test.ts`.
- [ ] RED then GREEN: `searchTokens(query): string[]` — lower + unaccent, split on `[^a-z0-9]+`, drop empties, keep 1-char tokens only when it is the sole token.
- [ ] `foldWithMap(text): { folded: string; starts: number[] }` — iterate the ORIGINAL string by code points; fold each (NFD, strip combining marks, đ→d, lower); `starts[i]` = original index of the code point that produced folded char `i` (combining marks add no folded char, so a range end maps to the next base char — the whole cluster stays inside the match).
- [ ] `highlightRanges(text, tokens): [start, end][]` — at each word start in `folded` (index 0 or previous folded char not `[a-z0-9]`), match any token as a prefix; map back to original indices; merge overlaps; sorted.
- [ ] Tests: `"ban dan"` highlights `"bán dẫn"`; `"transis"` highlights the `"transis"` prefix of `"transistor"`; case-insensitive; no match → `[]`; overlapping tokens merged; NCT/decomposed Vietnamese (`"ế"` as `e`+U+0302+U+0301`) maps to the whole cluster; a 1-char sole token is kept.
- [ ] Commit `feat(search): accent-insensitive match ranges for highlighting`.

### Task 3: Search primitives
**Files:** `src/components/search/SearchForm.tsx` (rewrite), create `Mark.tsx`, `KindLabel.tsx`, `QueryQuote.tsx`, `SearchResultRow.tsx`, `SearchEmptyState.tsx`, `TopicBrowseChip.tsx`.
- [ ] `SearchForm` → the board's `.sbar` pill: a `form role=search` with an optional **visible** label (`.lab`, 12px/700 uppercase `text-text-muted`) associated by a new required `inputId`, a `div` pill `h-[52px] rounded-full border border-field bg-surface pl-5 pr-1 gap-2` containing the input (`h-11 flex-1 bg-transparent text-base`, `placeholder:text-[#6B6B6B]`, `[&::-webkit-search-cancel-button]:hidden`) and the submit `h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white` (+ `Search` icon); `:hover` border `field-hover`, `:focus-within` border `primary` + `outline-2 outline-accent outline-offset-2`; `dark` variant per `.sbar.dk` (bg `white/10`, border `white/50`, focus `white`, submit `bg-white text-primary`); optional `hint` line under it (13px `text-text-muted`, `mt-2.5`). Keep it hook-free so it renders on the server and inside the client navbar.
- [ ] `Mark`: server component `<Mark text={...} query={...} />` → splits `text` on `highlightRanges` and wraps matches in `<mark className="rounded-[3px] bg-[#FEF6D9] px-0.5 font-semibold text-inherit">`.
- [ ] `KindLabel`: `<KindLabel kind={...} label={...} />` → `.kd` icon (Book / PlayCircle / FileText, `aria-hidden`) + uppercase 12px/700 label.
- [ ] `QueryQuote`: the `.qq` box (`rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold leading-[1.5] [overflow-wrap:anywhere] line-clamp-4`).
- [ ] `SearchResultRow`: the `.row` card — one `<Link>` (`flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5`, hover border+shadow, `active:scale-[0.98]`, focus ring) containing the `.meta` line (`KindLabel`, optional `TopicChip`, optional `DifficultyMark`, `<time>` right-aligned via `ml-auto`), `h3` 18px/700 `line-clamp-3` with `<Mark>`, optional `p` 14px `text-text-muted line-clamp-2` with `<Mark>`.
- [ ] `SearchEmptyState`: the dashed frame (`rounded-3xl border-[1.5px] border-dashed border-[#A8A8A8] bg-white/50 px-8 py-14`), a decorative chip SVG, `h2` 26px/800, body, then either the **initial** extras (Try-searching pills + divider + browse-by-topic chips) or the **no-results** extras (`QueryQuote`, suggestion pills, "Clear keyword" link + "Browse all lessons" `Button`).
- [ ] `TopicBrowseChip`: `<Link>` pill (`min-h-11 rounded-full border border-border bg-surface pl-2 pr-3.5` + 28px number disc `TopicChip`-tone + label + optional count pill `bg-surface-muted px-[7px] py-[2px] text-xs`).
- [ ] Commit `feat(search): result row, kind label, highlight and empty states`.

### Task 4: Navbar popover + mobile field
**Files:** `src/components/search/SearchBox.tsx`, `src/components/layout/Navbar.tsx`.
- [ ] Panel per `.pop`: keep `absolute right-0 top-[calc(100%+8px)] z-10 w-[380px] max-w-[calc(100vw-2.5rem)]`, change padding to `p-4`, radius `rounded-2xl`, `shadow-float`; render `SearchForm` with `labelVisible` (`searchIn`), `hint` (`searchHint`) and an `inputId` from `useId()`. Keep Escape / outside-click / blur close-and-refocus.
- [ ] Mobile: `Navbar`'s drawer `SearchForm` gains the visible label (`searchIn`) and `hint`; keep `variant="dark"`.
- [ ] Commit `feat(search): navbar popover and mobile field`.

### Task 5: Search page
**Files:** `src/app/[locale]/tim-kiem/page.tsx`.
- [ ] Hero: `PageHero` with `eyebrow`, `title` = `resultsFor` when a query else `title`, `description` only when no query, and `stats` = three cells (lessons/videos/blog counts) when a query is present.
- [ ] Body section `mx-auto w-full max-w-content`; the form in a `max-w-[720px]` wrapper.
- [ ] When a query: result line `p role="status" aria-live="polite"` (`resultLine`, `tabular-nums`) where `total = Σ group.posts.length` (capped form when any group hit `FETCH_LIMIT`) and `shown = Σ min(10, …)`; then the groups (Bài học → Video → Blog) — each `section aria-labelledby` with the 40px icon tile, `h2` 26px/800, per-group count (`resultCount` / `resultCountCapped`), the `showingFirst` note when `length > 10`, and a `grid gap-4 sm:grid-cols-2` of `SearchResultRow` (first 10).
- [ ] No query: `SearchEmptyState` initial variant; `countLessonsByTopic(locale)` feeds the browse chips (render a chip per topic; show the count only when > 0).
- [ ] Query but nothing found: `SearchEmptyState` no-results variant.
- [ ] Keep `dynamic = "force-dynamic"`, the `robots: { index: false, follow: true }` metadata, `FETCH_LIMIT=50`, `SHOWN=10`, the `postHref(post) !== null` filter, and one `searchPosts` call per group.
- [ ] Commit `feat(search): redesigned search page`.

### Task 6: Gate, browser check, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`.
- [ ] Browser check via a temporary `/ui-gallery/search` page (no Supabase locally), at 1280 and 390 (vi): results with a sample query (2-col → 1-col, row anatomy, `<mark>` colours, result line, group tiles/counts/note), initial state (pills, browse chips with counts, chip figure), no-results (query box, buttons), popover (380px, visible label + hint, focus, Escape/outside close, caret in field), mobile field; assert no horizontal scroll and all targets ≥ 44px; check a long title/query clamps. Then delete the temp page and its `.next/types` + `.next/server|static/.../search` artifacts.
- [ ] `docs/BAN-GIAO.md`: step 6a paragraph, new test count, "step 6a done; next 6b Contact, 6c About, 6d Contribute+Privacy, then 7 error pages (incl. the search error state)".
- [ ] One review of the branch; fix Critical/Important with TDD; defer minors in the ledger `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-6a-tim-kiem/progress.md`.
- [ ] Merge to `main` locally (fast-forward), delete the branch. Do not push.

## Review Focus
- Highlight never marks text the DB did not match (compare a row whose match is only in `plain_text` — the title/excerpt must stay unmarked).
- Vietnamese diacritics: `ban dan` marks `bán dẫn`; the marked span covers the full cluster (no stray combining mark outside `<mark>`).
- Empty query, single-char query, 1-char sole token, very long query (100 chars), query with punctuation/emoji.
- Result line pluralisation and the `N+` capped form; per-group note only when > 10.
- Popover: focus in the field on open; Escape returns focus to the button; outside click closes; works on the search page too.
- 390px: rows single-column, meta wraps without overflow, buttons full width where the board stacks them.

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```
Browser: temp `/ui-gallery/search` at 1280 and 390, plus the real popover through the navbar; then delete the temp route and merge.

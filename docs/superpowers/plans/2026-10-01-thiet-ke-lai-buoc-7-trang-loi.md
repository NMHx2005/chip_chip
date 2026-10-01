# Step 7 — 404 and error pages Implementation Plan

**Goal:** Redesign the global 404, the three article-404 variants, the public runtime error page, and add the search error state deferred from step 6a, to match `boards/Error-*` and `Error-Spec.dc.html`.

**Branch:** `feat/thiet-ke-lai-buoc-7-trang-loi` (off `main`).

## Scope
- **In:** `src/app/[locale]/not-found.tsx` (global 404), the three detail `not-found.tsx` files, `src/app/[locale]/error.tsx` (runtime), and the search page's error state (`searchPosts` gains a status).
- **Out:** the admin error boundary (`src/app/admin/(dashboard)/error.tsx` stays plain Vietnamese on purpose), the animated star border (dropped by the board), and the Next 14 "generic shell before hydration" limitation — it stays a documented limit (only a Next upgrade fixes it).

## Decisions (maintainer, 2026-10-01)
- **D1:** the global 404 **keeps its search box** — reuses `SearchForm` (52px pill, hidden label), which already GETs to `/tim-kiem?q=`.
- **D2:** the runtime page **shows `error.digest` in every environment**, select-all, no copy button.
- **D3:** the report link just opens `/lien-he`; the digest is **not** prefilled into the Contact form.
- **D4:** the design's `ErrorState` is realised by **extending `EmptyState`** (eyebrow, heading level, chip variant, an `after` slot) instead of a parallel frame — same dashed box, same fadeUp, same action row.
- **D5:** the article-404 variants do **not** highlight a nav item (the shared shell does not know the context); accepted.
- **D6:** no star border, no spinner or progress bar (the board's DROP list); the ER7 "retry still failed" line appears after the first failed retry (the board assumes it).

## Global constraints
- Every string through `src/messages/{vi,en}.json`, identical key sets (vi first, RED on `keys-parity.test.ts`, then en).
- No `${}`-built Tailwind classes; hover scoped `[@media(hover:hover)]:hover:`; durations from tokens; reduced-motion branches.
- Tap targets ≥ 44px (inline text links exempt). No `scroll-margin` on anchors.
- Server components by default; `EmptyState`, `SearchForm`'s callers and the error boundary are the client pieces.

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json`.
- [ ] vi first (RED): a new top-level **`errors`** namespace — `eyebrow404`, `eyebrowRuntime`, `titleGlobal`, `titleLesson`, `titlePost`, `titleVideo`, `titleRuntime`, `descGlobal`, `descLesson`, `descPost`, `descVideo`, `descRuntime`, `home`, `lessons`, `search`, `goTo`, `retry`, `retrying`, `retryStatus`, `retryFailed`, `digestLabel`, `reportHint`, `reportLink`. Plus, in `search.*`: `resultFailed` ("Không lấy được kết quả cho “{query}”"), `errorTitle`, `errorBody`, `retry`.
- [ ] en (GREEN): the mirror strings.
- [ ] Remove the keys this step orphans: `common.notFoundTitle`, `common.notFoundDescription`, `common.error`, `common.errorDescription`, `common.retry`, and the three detail `notFound` stubs (`lessons.notFound`, `videos.notFound`, `forum.notFound`) — keep `lessons.backToLessons`, `videos.backToVideos`, `forum.backToForum` for the article-404 back buttons.
- [ ] Commit `feat(i18n): strings for the redesigned error pages`.

### Task 2: Shared pieces
**Files:** `src/components/ui/ChipArt.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/search/SearchForm.tsx`.
- [ ] `ChipArt` gains `variant?: "empty" | "notFound" | "error"` (default `empty`): the same dashed chip, with `404` (one broken leg) or `!` drawn inside for the other two.
- [ ] `EmptyState` gains `eyebrow?: string` (the accent label chip above the title), `headingLevel?: "h1" | "h2"` (default `h2`), `chip?: "empty" | "notFound" | "error"` (default `empty`), and `after?: ReactNode` (rendered below the actions). Keep the existing props and call sites working.
- [ ] `SearchForm` gains `labelHidden?: boolean` (default `false`): renders the label `sr-only`, for the 404 panel where the placeholder carries the meaning.
- [ ] Commit `feat(errors): chip variants, empty-state slots and a hidden search label`.

### Task 3: Article 404s
**Files:** create `src/components/errors/ArticleNotFound.tsx`; `src/app/[locale]/{blog/[slug],video/[slug],bai-hoc/[topic]/[slug]}/not-found.tsx`.
- [ ] `ArticleNotFound({ section })`: `EmptyState eyebrow={errors.eyebrow404} headingLevel="h1" chip="notFound" tone="error"` with the per-section title/description, and two actions — the primary back button (`lessons.backToLessons` / `forum.backToForum` / `videos.backToVideos` → the listing) and a secondary "search" `Button` to `/tim-kiem`.
- [ ] The three `not-found.tsx` files become thin wrappers passing their `section`.
- [ ] Commit `feat(errors): one article not-found across lessons, blog and video`.

### Task 4: Global 404
**Files:** `src/app/[locale]/not-found.tsx`.
- [ ] `EmptyState eyebrow={errors.eyebrow404} headingLevel="h1" chip="notFound" tone="error"`, `title`/`description` from `errors.titleGlobal`/`descGlobal`, `className="min-h-[520px]"`, inside a `px-5 py-14 md:px-8 md:py-24` wrapper.
- [ ] `children`: the `SearchForm` (action = the localized `/tim-kiem`, `labelHidden`, placeholder `errors.search`).
- [ ] `actions`: primary `Button` home + secondary `Button` to `/bai-hoc`.
- [ ] `after`: the "Hoặc đi tới" label + three `SuggestionPill`-style links (Blog `/blog`, Video `/video`, Giới thiệu `/gioi-thieu`), then the hint line (`errors.reportHint` + a link `errors.reportLink` to `/lien-he`).
- [ ] Commit `feat(errors): redesigned global 404`.

### Task 5: Runtime error page
**Files:** `src/app/[locale]/error.tsx`.
- [ ] `"use client"`: `EmptyState eyebrow={errors.eyebrowRuntime} headingLevel="h1" chip="error" tone="error"`, `title`/`description` from `errors.titleRuntime`/`descRuntime`, `className="min-h-[520px]"`; keep the `console.error` log.
- [ ] `actions`: a retry `<button>` and a secondary home `Button`. `useTransition` drives the busy state (label `errors.retrying`, `aria-busy`, `disabled`, no spinner) plus a `role="status"` line (`errors.retryStatus`); after the first retry that does not clear the error, a `role="alert"` line (`errors.retryFailed`) appears.
- [ ] `after`: the digest block when `error.digest` is set (`errors.digestLabel` + `<code className="select-all ...">`), then the hint line (`errors.reportHint` + link to `/lien-he`).
- [ ] Commit `feat(errors): redesigned runtime error page`.

### Task 6: Search error state
**Files:** `src/lib/queries/posts.ts`, `src/app/[locale]/tim-kiem/page.tsx`, `src/components/search/SearchStates.tsx`.
- [ ] `searchPosts` returns `{ posts, failed }` (`failed: true` when the RPC errors) instead of a bare array; keep the blank-query and no-Supabase cases `failed: false`.
- [ ] The search page treats a query as failed when **any** group failed, and then renders a new `SearchErrorState` (in `SearchStates.tsx`) instead of groups: `EmptyState tone="error" chip="error"` with `search.errorTitle`/`errorBody` and two actions (`search.retry` → the same `?q=` URL, `search.browseLessons`). The result line becomes the `search.resultFailed` `role="status"` line, and the hero keeps the query.
- [ ] Commit `feat(search): a real error state when the query fails`.

### Task 7: Gate, browser check, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`.
- [ ] Browser check (no Supabase): the real `/vi/khong-ton-tai` (global 404) and `/vi/blog/khong-ton-tai`, `/vi/video/khong-ton-tai`, `/vi/bai-hoc/dinh-nghia/khong-ton-tai` at 1280 and 390 — panel, eyebrow, h1 46/34, description, search box GETs to `/vi/tim-kiem?q=`, the two 44px buttons, the three pills, the hint link, no horizontal scroll; the search error state through a temporary `/ui-gallery` harness (it cannot be triggered without a broken RPC); the runtime page's structure via a temporary harness that renders the boundary's presentational output (a real thrown error is out of reach here).
- [ ] `docs/BAN-GIAO.md`: step 7 paragraph, new test count, "the interface redesign is complete"; keep the Next 14 404-shell limit note.
- [ ] One review of the branch; fix Critical/Important (TDD where pure, browser otherwise); defer minors in `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-7-trang-loi/progress.md`.
- [ ] Merge to `main` locally (fast-forward), delete the branch. Do not push.

## Review Focus
- The global 404 works without JavaScript: the search form is a plain GET and the buttons are links.
- `error.digest` may be absent (`undefined`): the digest block must not render then.
- The retry: `aria-busy`, disabled, label swap, the status line, and the ER7 line — and the component unmounting when the retry succeeds (no stale line).
- One `h1` per page: the empty state's heading level is `h1` on the error pages, `h2` everywhere else (`EmptyState`'s default).
- 390px: the panel stacks, the search pill and the buttons are full width, the pills wrap.
- Reduced motion: the panel appears at once.
- The article 404s still return 404 and keep the chrome (known shell limit documented).

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```
Browser: the real 404 URLs and the temporary harnesses; then merge.

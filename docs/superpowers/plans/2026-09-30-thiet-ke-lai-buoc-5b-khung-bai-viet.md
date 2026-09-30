# Step 5b — Article shell (Blog post + Lesson detail) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Give the blog post page and the lesson detail page one shared `ArticleShell` that matches `boards/Blog-Post-VI-1280`, `Blog-Post-EN-390`, `Blog-Post-Stress-EN-1280`.

**Architecture:** A server `ArticleShell` owns the 768 + 272 grid (single column below 1024px), the back button, h1, meta row, cover, body, report block and a comments slot. A small client `ArticleHeader` plays the BL8 rise-in. The table of contents becomes a sticky rail (desktop, active row via IntersectionObserver, logic in a pure tested helper) and a closed `details` (mobile). Comments internals are step 5c; Video detail is step 5e.

**Tech Stack:** Next.js 14, next-intl, Tailwind, framer-motion, Vitest.

**Spec:** `docs/thiet-ke-giao-dien/boards/Blog-Spec.dc.html`, `Blog-Post-*.dc.html`, `HANDOFF.md` (lesson detail reuses the blog ArticleShell).

## Decisions (maintainer, 2026-09-30)
- D1: keep the right column reserved (empty) at ≥1024px when a post has no TOC, so the article never shifts between posts.
- D2: mobile TOC `details` starts **closed** (board draws it open; deliberate deviation, long posts must not push the body down).
- D3: scope = Blog post + Lesson detail. Copy follows the board: EN "Posted" (was "Published"), TOC title "Nội dung bài viết" / "In this article", LangPill "Đọc bản tiếng Anh" / "Read in Vietnamese".
- D4: not in the design, so not built: reading progress, share, author block, related posts on Blog, prev/next, breadcrumbs. Lesson keeps its related-videos block after the report block.
- D5: out of scope: BL7 panel hold across navigation, Field/FormNotice restyle inside ReportMistake, comments (5c), Video detail (5e).

## Global Constraints
- Every string through `src/messages/{vi,en}.json`, same key set (`keys-parity.test.ts`); add vi first (RED) then en.
- No `${}`-built Tailwind classes; hover variants as `[@media(hover:hover)]:hover:...`; durations only `fast/card/panel/base`.
- Motion: `EASE_STANDARD`, respect `prefers-reduced-motion` (content must be visible with no JS and under reduced motion).
- Tap targets ≥ 44px (TOC rows 48, report summary 52). Focus ring 2px `#314344` offset 2 (global `:focus-visible`).
- Verify layout in the browser with geometry/hit-tests, not bounding boxes alone. Real posts are unavailable locally (no Supabase data): verify with a temporary gallery sample, then remove it.

## Review Focus
- Post with 0 or 1 headings: no rail, no details, right column still reserved (D1).
- No cover, no update date, no translation, 5-line title (stress board): no overflow at 390, no empty gaps.
- `location.hash` on load / clicking a TOC row: heading not hidden under the fixed navbar (scroll-margin 96 desktop, 84 mobile; drop the duplicate `html` scroll-padding only if verified).
- Active-row logic when scrolled past the last heading, above the first heading, and with headings taller than the viewport.
- Reduced motion: header visible immediately; TOC row change instant.

---

### Task 1: Strings
**Files:** `src/messages/vi.json`, `src/messages/en.json`.
- [ ] vi first: add `forum.readOtherLanguage` ("Đọc bản tiếng {language}") — or two keys `readInEnglish`/`readInVietnamese` with the board copy; change `forum.tableOfContents` to "Nội dung bài viết"; run `npx vitest run src/lib/keys-parity.test.ts` → RED.
- [ ] en: same keys ("Read in Vietnamese", "Read in English", "In this article"); change `forum.publishedOn` to "Posted {date}". GREEN.
- [ ] Commit `feat(i18n): strings for the redesigned article shell`.

### Task 2: Prose typography
**Files:** `src/app/globals.css` (`.chip-prose`).
- [ ] h2 → 1.625rem / 800 / lh 1.25 / `scroll-margin-top: 6rem`; h3 gets `scroll-margin-top: 6rem`; below 768px: body 16px / 1.7, h2 22px, h3 18px, `scroll-margin-top: 5.25rem`, math 1.15em. Leave everything else.
- [ ] Extend `src/lib/reduced-motion-css.test.ts`-style guard only if a css guard test already covers `.chip-prose`; otherwise none (pure CSS). Verify in browser on a gallery sample. Commit `feat(prose): article heading sizes and mobile step-down`.

### Task 3: Table of contents
**Files:** create `src/lib/toc.ts` + `src/lib/toc.test.ts`; rewrite `src/components/forum/ArticleToc.tsx`; create `src/components/forum/TocRail.tsx` (client).
- [ ] RED: `pickActiveHeading(tops: {id:string; top:number}[], offset: number): string | null` — the last heading whose `top <= offset`; before the first heading returns the first id; empty list returns null. Tests: empty, above first, between, past last, unsorted input.
- [ ] GREEN: implement; `TocRail` (client) measures headings on scroll (rAF-throttled) with `pickActiveHeading(…, 120)`; sets `aria-current="location"` on the active row; row = `min-h-12 rounded-xl px-3 text-sm font-medium`, active `bg-primary text-white`, hover only under `[@media(hover:hover)]`, h3 rows `pl-7 text-[13px]`, `transition-colors duration-fast ease-standard motion-reduce:transition-none`.
- [ ] `ArticleToc` (server) extracts headings (≥ 2, else renders only the reserved empty column via the shell) and renders: desktop `aside` `hidden lg:block sticky top-24 pt-16` with label above a white 16px-radius bordered `nav`; mobile `details` (closed) "In this article" with a list icon, 48px rows, `lg:hidden`.
- [ ] Commit `feat(article): sticky contents rail and a closed details on phones`.

### Task 4: LangPill and meta row
**Files:** create `src/components/forum/LangPill.tsx`; edit `UpdatedAt.tsx`.
- [ ] `LangPill({ href, locale })`: 44px link, `hreflang`, Languages icon, 999px radius, 1px border, white bg, 13px/600, label from messages (no hard-coded text).
- [ ] `UpdatedAt` styled as the meta row (14px, `text-text-nav`); keep the 24h rule.
- [ ] Commit `feat(article): language pill and meta row`.

### Task 5: ArticleShell + ArticleHeader
**Files:** create `src/components/forum/ArticleShell.tsx`, `ArticleHeader.tsx` (client).
- [ ] `ArticleShell({ back: {href,label}, title, meta, cover, headerExtra?, content, locale, postId, footer? /* related videos */, children /* comments */ })`: grid `lg:grid-cols-[768px_272px] lg:gap-12 justify-center`, padding `px-5 pb-14 pt-6 md:px-8 lg:pb-24 lg:pt-10`, article column `min-w-0`; back = secondary button-style link (min-h-11, ArrowLeft); h1 `text-balance [overflow-wrap:anywhere] text-[34px] lg:text-[46px] font-extrabold leading-[1.1] tracking-[-0.03em]`; cover `aspect-video rounded-2xl` (`sizes` 768px); order on phones: back, h1, meta, cover, TOC details, body; `ReportMistake` (mt-10 / lg:mt-12); comments slot with a `mt-16` gap.
- [ ] `ArticleHeader` wraps back+h1+meta in one `motion.div` (opacity 0/y 20 → rest, 0.55s `EASE_STANDARD`, delay 0.1s, `useReducedMotion` → `initial={false}`); content is server-rendered visible.
- [ ] Commit `feat(article): shared ArticleShell`.

### Task 6: Blog post page
**Files:** `src/app/[locale]/blog/[slug]/page.tsx`.
- [ ] Replace the markup with `ArticleShell`; keep `generateMetadata`, comments query and `CommentSection` (passed as children, unchanged). LangPill from `alternates`.
- [ ] Browser check (temporary gallery sample or a seeded post if available) at 1280 and 390 in vi and en: grid columns 768/272, rail sticky, active row changes on scroll, row hit-test 48px, hash navigation clear of the navbar, mobile details closed and opens, no horizontal scroll; stress case (5-line title, no cover, no TOC). Commit `feat(blog): redesigned article page`.

### Task 7: Lesson detail
**Files:** `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx`.
- [ ] Same swap: back link "Về chủ đề {topic}", topic chip through `headerExtra`, related videos through `footer`. Commit `feat(lessons): lesson detail on the shared article shell`.

### Task 8: Report block
**Files:** `src/components/contact/ReportMistake.tsx`.
- [ ] Summary `min-h-[52px]`; spacing supplied by the shell. Commit `feat(contact): 52px report-a-mistake summary`.

### Task 9: Gate, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`; `npm run build` unverifiable in the sandbox (say so).
- [ ] `docs/BAN-GIAO.md`: add step 5b paragraph and the new test count.
- [ ] Review with one Opus subagent on the whole branch; fix Critical/Important with TDD; defer minors in the ledger.

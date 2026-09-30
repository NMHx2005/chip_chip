# Step 5e — Video detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Redesign `/video/[slug]` to match `boards/Video-Detail-VI-1280`, `Video-Detail-EN-390-Long`, `Video-Detail-EN-390-NoLesson` and V11–V13 of `Video-Spec`.

**Architecture:** One left-aligned column (player 896px, text 768px), no hero, no TOC rail, so `ArticleShell` is not reused. The page keeps its own layout and gains: a large click-to-play facade (a modifier of the existing `videoFacadeHtml`, so in-article embeds are untouched), a privacy note, `TopicChip`/`DifficultyMark`/source chip, a 46/34px title, pill actions, and a `RelatedLessonCard`. Report block and comments are the 5b/5c components.

**Tech Stack:** Next.js 14, next-intl, Tailwind, Vitest.

**Spec:** `docs/thiet-ke-giao-dien/boards/Video-Spec.dc.html`, `Video-Detail-*`, `HANDOFF.md`.

## Decisions (maintainer, 2026-09-30)
- D1: extend `getLessonByTranslation` with `excerpt`, `difficulty`, `publishedAt` (more columns in the same select; no migration) to draw the related-lesson card.
- D2: the new player look (radius 24, 68px disc with a 3px white ring, focus ring, iframe fade) applies to the video detail page only, through a `video-embed-lg` modifier; embeds in articles and elsewhere keep today's look.
- D3: "Watch on TikTok" keeps opening the embed page (no username is stored to build a watch URL). Record it as a known limit in `BAN-GIAO.md`.
- D4: the back link is the text link of the board (44px, no border); Blog and Lesson keep their bordered button.
- D5 (defaults): no "Updated" line; if the video has no valid `ref`, omit the player, the privacy note and "Watch on" and keep the rest; empty body shows a small dashed box ("Video này chưa có phần mô tả."); the 404 page is step 7.

## Global Constraints
- Every string through `src/messages/{vi,en}.json`, same key set; vi first (RED), then en.
- No `${}`-built Tailwind classes; hover as `[@media(hover:hover)]:hover:...`; durations `fast/card/panel/base`.
- No `scroll-margin` on anchors (html `scroll-padding-top` already clears the navbar).
- Reduced motion: no scale on the play disc, no iframe fade (it appears at once); the page itself has no reveal.
- Tap targets ≥ 44px. Verify in the browser with geometry. No videos locally (no Supabase): verify with a temporary gallery page, then delete it and its `.next/types` file.

## Review Focus
- `post` with no `ref`, no lesson, no topic/difficulty/source/date, empty body, long channel name, 5-line title: no empty gaps, no overflow at 390px.
- Click-to-play: plain click loads the iframe and moves focus; Ctrl/Cmd/middle click and no-JS follow the link; the `role=status` text "Đang tải video" is announced once; the iframe never stays at opacity 0 (even under reduced motion).
- `videoFacadeHtml` without `large` produces exactly today's markup (article embeds, homepage).
- The related-lesson section and the primary button both disappear when the lesson is missing or lost its topic.
- TikTok: 9:16 frame centred, dark, no thumbnail; "Watch on TikTok" keeps working as today.

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json` (`videos.*`).
- [ ] vi first (RED on `keys-parity.test.ts`): `loadsAfterPlay` ("Video chỉ được tải từ {platform} sau khi bạn bấm phát."), `playAria` ("Phát video: {title} ({platform})"), `loadingPlayer` ("Đang tải video"), `opensInNewTab` ("(mở trong tab mới)"), `relatedLessonHeading` ("Bài học liên quan"), `noDescription` ("Video này chưa có phần mô tả."). Change `backToVideos` to "Về trang Video" if different.
- [ ] en (GREEN): "The video only loads from {platform} after you press play.", "Play video: {title} ({platform})", "Loading video", "(opens in a new tab)", "Related lesson", "This video has no description yet." `backToVideos` "Back to Videos".
- [ ] Commit `feat(i18n): strings for the redesigned video detail`.

### Task 2: Related lesson data (TDD)
**Files:** `src/lib/queries/posts.ts`, create `src/lib/related-lesson.ts` + `src/lib/related-lesson.test.ts`.
- [ ] RED then GREEN: `toRelatedLesson(row: Record<string, unknown> | null): RelatedLesson | null` where `RelatedLesson = { slug; topic: TopicId; title; excerpt: string | null; difficulty: Difficulty | null; publishedAt: string | null }`. Tests: null row → null; unknown/missing topic → null; valid row maps all fields; empty or non-string excerpt → null; unknown difficulty → null.
- [ ] `getLessonByTranslation` selects `slug, topic, title, excerpt, difficulty, published_at` and returns `toRelatedLesson(data)`; signature otherwise unchanged (the lesson and video pages keep compiling).
- [ ] Commit `feat(queries): related lesson carries excerpt, difficulty and date`.

### Task 3: Large facade (TDD for the markup)
**Files:** `src/lib/tiptap/video-embed.ts`, `video-embed.test.ts`, `src/app/globals.css`, `src/components/forum/VideoFacades.tsx`.
- [ ] RED then GREEN in `video-embed.test.ts`: `videoFacadeHtml(ref, locale)` output is unchanged; `videoFacadeHtml(ref, locale, { large: true })` adds the class `video-embed-lg` to the `figure` and nothing else changes.
- [ ] CSS (after the existing `.video-embed` rules, all under `.chip-prose .video-embed-lg`): radius 24px; disc `border: 3px solid #fff`, hover/focus `background:#000` and `scale(1.06)` over `250ms` with `cubic-bezier(.25,.1,.25,1)` (no scale under `prefers-reduced-motion: reduce`); label `left/bottom: 16px`; `.video-facade:focus-visible` outline `2px solid #314344` offset 2px; `.video-frame` `opacity:0` + `transition: opacity 250ms` and `.video-frame.is-loaded{opacity:1}` (reduced motion: `opacity:1`, no transition).
- [ ] `VideoFacades`: on `load` add `is-loaded` to the new iframe; set a persistent `sr-only` `role="status"` region to `t("loadingPlayer")` when the iframe is created (`videos` namespace), cleared on load; in-article behaviour otherwise unchanged.
- [ ] Commit `feat(video): large click-to-play facade for the video detail page`.

### Task 4: RelatedLessonCard
**Files:** create `src/components/video/RelatedLessonCard.tsx`.
- [ ] Server component for the compact card: 96px 16:9 cover in the topic tone with the topic number watermark, `TopicChip`, `h3` 16px/700, 2-line excerpt (`line-clamp-2`), footer with `border-t border-hairline`, `DifficultyMark`, dotted date, 32px arrow disc; whole card one link (`/bai-hoc/[topic]/[slug]`), same hover/press classes as `PostCard` written out in full.
- [ ] Commit `feat(video): related lesson card`.

### Task 5: Page
**Files:** `src/app/[locale]/video/[slug]/page.tsx`, `src/components/ui/Button.tsx` (export a class helper for external links), `src/components/forum/ArticleBody.tsx` (optional `emptyText`).
- [ ] Layout `px-5 pb-12 pt-4 lg:px-8 lg:pb-20 lg:pt-10`, column `max-w-[896px]`; back link 44px, 14px/600, `text-accent` → black on hover, `ArrowLeft`; player `mt-1 lg:mt-3` with `videoFacadeHtml(ref, locale, { eager: true, large: true })` and `VideoFacades`; privacy note under it (lock icon 14px, 13px `text-nav`, `t("loadsAfterPlay", { platform })`).
- [ ] Header `mt-6 lg:mt-8`, text `max-w-3xl`: chip row (source chip with `Cpu`/`Bookmark`, `DifficultyMark`, `TopicChip`), `h1` 34px / `lg:46px`/1.1/800/-0.03em `[overflow-wrap:anywhere] text-balance`, date row ("Đăng ngày …", `forum.publishedOn`) with the language button on the right from `lg` (`lg:ml-auto`, stacked on phones): a 44px secondary pill with `Languages` icon, `hrefLang`, label `videos.switchTo.*`; action row: primary "Xem bài học liên quan" (`BookOpen`, arrow) only with a lesson, secondary "Xem trên {platform}" external (`target="_blank"`, `rel="noopener noreferrer"`, `ExternalLink`, `sr-only` `opensInNewTab`); full-width column on phones.
- [ ] Body: `mt-8 lg:mt-10 max-w-3xl`; empty body → small dashed box with `noDescription` (use `articleToPlainText(post.content)` or the `ArticleBody` `emptyText` prop). Related lesson: `section aria-labelledby` with `h2` 26px/800 `relatedLessonHeading` and one `RelatedLessonCard`, only when the lesson exists. Report (`mt-8 lg:mt-12`) and `CommentSection` unchanged.
- [ ] Commit `feat(video): redesigned video detail page`.
- [ ] Browser check with a temporary gallery page at 1280 and 390 (vi and en): back link 44px, player 16:9 radius 24 (TikTok 9:16, 340px, centred), disc/badge geometry, privacy note, chips, h1 46/34, date+lang row, action buttons, lesson card, empty-body box, no horizontal scroll; click the facade (iframe appears with `is-loaded`, focus on it, status text), Ctrl-click does not; a sample without lesson/ref. Delete the page and its `.next/types` file.

### Task 6: Gate, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`; `npm run build` unverifiable in the sandbox (say so).
- [ ] `docs/BAN-GIAO.md`: step 5e paragraph, new test count, the TikTok watch-URL limit, and "step 5 done" (next: step 6 search/popover and Contact/About/Contribute/Privacy, step 7 404 and error pages).
- [ ] One Opus review of the whole branch; fix Critical/Important with TDD; defer minors in the ledger.

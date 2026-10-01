# Step 6c — About page Implementation Plan

**Goal:** Redesign `/gioi-thieu` to match `boards/About-*` (Filled, Placeholder, States, Faq) and `About-Spec.dc.html`, reusing the shared components from steps 1–6b.

**Branch:** `feat/thiet-ke-lai-buoc-6c-gioi-thieu` (off `main`).

## Scope
- **In:** the About page hero, the author block, the commitments cards, the FAQ, the contributors list, and the closing CTA.
- **Out:** Contribute + Privacy (6d), error pages (7). No query/API/open decision changes: the copy placeholders in `about.author.*` and the empty `CONTRIBUTORS` stay as they are (README tracks replacing them before launch).

## Decisions
- **D1:** the hero becomes `PageHero` (drops the hand-rolled hero and its `.rise-in`), with the banner passed as its `children` media slot — the same hero every other redesigned page uses.
- **D2:** the FAQ uses the shared **`Disclosure`** (`size="md"`, the `+` disc) instead of the page's own `<details>`; the board's "do not replace `<details>`" is satisfied (Disclosure *is* native `<details>`), and this is the migration the 6b review asked for.
- **D3:** the author keeps neutral initials while `AUTHOR.photo` is null (no stock face); the contributors section stays hidden while `CONTRIBUTORS` is empty.
- **D4:** the hero banner keeps `ABOUT_BANNER` with no credit pill (no credit data exists); the CTA keeps no decorative chip figure (the board marks it optional).
- **D5:** new copy: the FAQ-side hint (`about.faq.moreHint`, `about.faq.moreLink`) — the board draws it.

## Global constraints
- Every string through `src/messages/{vi,en}.json`, identical key sets (vi first, RED on `keys-parity.test.ts`, then en).
- No `${}`-built Tailwind classes; hover scoped `[@media(hover:hover)]:hover:`; durations from tokens; reduced-motion branches.
- Tap targets ≥ 44px. No `scroll-margin` on anchors.
- Server components by default (`CardReveal` is the only client piece, as in the listings).

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json` (`about.faq.*`).
- [ ] vi first (RED): `faq.moreHint` ("Chưa thấy câu trả lời?"), `faq.moreLink` ("Viết cho tác giả").
- [ ] en (GREEN): "Not seeing your question?", "Write to the author".
- [ ] Commit `feat(i18n): strings for the redesigned about page`.

### Task 2: Shared pieces
**Files:** create `src/components/ui/Avatar.tsx`, `src/components/ui/InfoCard.tsx`, `src/components/sections/about/MediaSlot.tsx`; `src/components/ui/button-variants.ts`.
- [ ] `Avatar` (`photo`, `alt`, `name`, `size: "sm" | "lg"`): `sm` = `size-11` (contributors), `lg` = `size-28 md:size-44` (author); a `next/image` when `photo`, else `initials(name)` on `surface-muted`. The size map also picks the initials text size.
- [ ] `InfoCard` (`icon: LucideIcon`, `title`, `children`): white card, radius 16, padding 16; row on phones, column from `sm`; a 40px round icon tile `bg-surface-muted` with a 20px accent icon; `h3` 16px/700; body 14px `text-text-muted`.
- [ ] `MediaSlot` (`src`, `alt`, `sizes`, optional `credit`): the 3:2 slot (radius 24, `surface-muted`) with the image; a credit pill bottom-left only when `credit` is given.
- [ ] `button-variants.ts`: add an `onDarkOutline` variant (`border-white/50 text-white hover:bg-white/10`), focus ring white on `#0D0D0D` (the existing contrast test covers it automatically).
- [ ] Commit `feat(about): avatar, info card and media slot`.

### Task 3: Author, commitments, contributors
**Files:** `src/components/sections/about/{AuthorSection,Commitments,Contributors}.tsx`.
- [ ] `AuthorSection`: the card (radius 24, padding 48/24) with the `lg` `Avatar`, the `label`/`name`/`role` stack, the two story paragraphs and the "why" heading; long names wrap (`[overflow-wrap:anywhere]`).
- [ ] `Commitments`: the four `InfoCard`s in a `sm:grid-cols-2 lg:grid-cols-4` grid, each revealed with `CardReveal` (the board's 0.05 + col×0.07 stagger); the privacy link below.
- [ ] `Contributors`: `null` while empty; otherwise the four-column grid of cards (`Avatar` `sm` + name + role, `line-clamp-2`/`3`), revealed with `CardReveal`.
- [ ] Commit `feat(about): redesigned author, commitments and contributors`.

### Task 4: FAQ
**Files:** `src/components/sections/about/Faq.tsx`.
- [ ] The `lg:grid-cols-[1fr_2fr]` layout: left the `h2` + the hint (`faq.moreHint` + a `Link` to `/lien-he` with `faq.moreLink`, `max-w-[300px]`, stacked on phones); right the six questions as shared `Disclosure`s inside a `divide-y divide-border border-y border-border` list.
- [ ] Commit `feat(about): redesigned faq`.

### Task 5: Hero + CTA
**Files:** `src/app/[locale]/gioi-thieu/page.tsx`, `src/components/sections/about/ContributeCta.tsx`.
- [ ] Page: `PageHero` (eyebrow, `hero.headline`, `hero.description`) with the `MediaSlot` (ABOUT_BANNER) as its child; then the five sections in order.
- [ ] `ContributeCta`: the dark panel (radius 24, padding 64/24, `bg-primary`) with the headline + description and two `Button`s — `variant="onDark"` (to `/dong-gop`) and `variant="onDarkOutline"` (to `/lien-he`), stacked on phones.
- [ ] Commit `feat(about): redesigned hero and closing call to action`.

### Task 6: Gate, browser check, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`.
- [ ] Browser check (no Supabase needed): the real `/vi/gioi-thieu` at 1280 and 390 — hero text + banner slot, author card (initials avatar), four commitment cards, the FAQ disclosure rows (≥60px, open/close by keyboard, find-in-page), the contributors section absent while empty, the CTA panel and its two 44px buttons, no horizontal scroll, all targets ≥ 44px, and a long-name sample via a temporary gallery if the real copy is short.
- [ ] `docs/BAN-GIAO.md`: step 6c paragraph, new test count, "next 6d Contribute+Privacy, then 7"; fix the 6b sentence that claimed "one disclosure pattern site-wide" (the FAQ now uses `Disclosure`; `FilterDisclosure` remains the video filter panel).
- [ ] One review of the branch; fix Critical/Important with TDD (or browser check where there is no DOM test harness); defer minors in `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-6c-gioi-thieu/progress.md`.
- [ ] Merge to `main` locally (fast-forward), delete the branch. Do not push.

## Review Focus
- 390px: hero stacks (text then banner), the author card's avatar 112px, the commitment cards become rows, the FAQ hint moves below the list, the CTA buttons stack full width.
- The FAQ: native `<details>` keeps find-in-page, keyboard and screen-reader behaviour; the row is ≥60px and the whole row is clickable.
- Contributors empty → no section and no extra gap; with people → the grid does not stretch a lone last row.
- Long author name / role / contributor name / question: wraps or clamps without overflow.
- Reduced motion: `CardReveal` shows the cards at once.
- No `.rise-in` remains on the page; durations come from tokens.

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```
Browser: the real `/vi/gioi-thieu` at 1280 and 390; then merge.

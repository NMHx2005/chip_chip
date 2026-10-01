# Step 6d — Contribute + Privacy Implementation Plan

**Goal:** Redesign `/dong-gop` and `/chinh-sach-bao-mat` to match `boards/Contribute-*`, `Contribute-Spec-VI-1280.dc.html`, `Privacy-*`, reusing the shared components from steps 1–6c.

**Branch:** `feat/thiet-ke-lai-buoc-6d-dong-gop-bao-mat` (off `main`).

## Scope
- **In:** the Contribute page (hero, the four way cards, the closing note) and the Privacy page (hero, contents rail, the document panel and its numbered sections, the closing CTA).
- **Out:** error pages (7), and the Contribute ideas that need a new API or Contact form field: a `?type=` prefill on `/lien-he` (each card keeps linking to `/lien-he`), and a live reply-time value.

## Decisions (maintainer, 2026-10-01)
- **D1:** Contribute's hero carries **no** stat card ("4 · 1 · 0"); it is text-only like Privacy (the spec's own open question: "0 fees" reads as a hard promise).
- **D2:** the Privacy contents rail **reuses `TocRail`** as-is (sticky, 48px rows, dark row being read, `aria-current="location"`, scroll-follow) — no section numbers in the rail; a small chip trail serves phones.
- **D3:** the Contribute note links to the About **page** (`/gioi-thieu`), not to the contributors anchor, which is hidden while `CONTRIBUTORS` is empty.
- **D4:** Privacy copy and `PRIVACY_UPDATED` do not change (they describe the code as of 2026-09-28); only the layout changes.

## Global constraints
- Every string through `src/messages/{vi,en}.json`, identical key sets (vi first, RED on `keys-parity.test.ts`, then en).
- No `${}`-built Tailwind classes; hover scoped `[@media(hover:hover)]:hover:`; durations from tokens; reduced-motion branches.
- Tap targets ≥ 44px (inline text links exempt). No `scroll-margin` on anchors (`html scroll-padding-top` already clears the navbar; `TocRail` relies on it).
- Server components by default (`TocRail`, `CardReveal` are the client pieces).

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json` (`privacy.tocHead`).
- [ ] vi first (RED): `tocHead` ("Trên trang này").
- [ ] en (GREEN): "On this page".
- [ ] Commit `feat(i18n): strings for the redesigned contribute and privacy pages`.

### Task 2: Privacy
**Files:** create `src/components/legal/DocTocTrail.tsx`; `src/app/[locale]/chinh-sach-bao-mat/page.tsx`.
- [ ] `DocTocTrail`: the phone contents — `nav` `aria-label` = `tocHead`, a horizontal `overflow-x-auto` chip row (`min-h-11`, `rounded-full border border-border bg-surface`, `lg:hidden`), one anchor chip per section (`href="#privacy-<id>"`), no current chip.
- [ ] Page: `PageHero` unchanged; then a `flex gap-10` body — `TocRail` (label `tocHead`, entries `{ id: "privacy-<id>", text, level: 2 }`) hidden below `lg`, plus the mobile `DocTocTrail`.
- [ ] Document panel: white, 1px border, radius 24, `p-8 lg:px-14 lg:py-12`; inside a `max-w-[768px]` column: the updated line (`<time>` + calendar icon, `border-b border-hairline pb-7`), then each section numbered — a 32px number disc (index+1) beside the `h2` 26px/800 with `tabindex="-1"` (`id="privacy-<id>"`, `scroll-mt-0`), a dot-marked list, and the closing CTA row (`border-t border-hairline pt-8`, a primary `Button` to `/lien-he`).
- [ ] On phones: no panel frame (`px-5 py-8`), the number disc 28px, `h2` 22px.
- [ ] Commit `feat(privacy): redesigned document layout with a contents rail`.

### Task 3: Contribute
**Files:** create `src/components/contribute/WayCard.tsx`; `src/app/[locale]/dong-gop/page.tsx`.
- [ ] `WayCard`: a card (white, radius 16, `p-4`) with a tone plate (`TOPIC_TONE[TOPIC_IDS[index]].soft`, 112px, radius 12) holding a 48px white icon tile and a faint 136px icon watermark bottom-right; then `h3` 18px/700, the body 14px; a footer (`mt-auto border-t border-hairline pt-3`) with a `Button variant="secondary"` (44px) labelled `contribute.cta` and `aria-label` "`cta`: `<title>`", linking to `/lien-he`.
- [ ] Phones: the plate becomes a 64px square on the left (row layout); the watermark is hidden.
- [ ] Page: `PageHero` (text only, D1) then the four cards in a `grid gap-4 sm:grid-cols-2` (a lone last card spans the row), each revealed with `CardReveal`; then the note panel — `rounded-3xl border border-border bg-white/50 p-5 md:p-7` with a 44px icon tile and one paragraph whose link goes to `/gioi-thieu` (D3).
- [ ] Commit `feat(contribute): redesigned way cards and note`.

### Task 4: Gate, browser check, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`.
- [ ] Browser check (no Supabase): the real `/vi/dong-gop` and `/vi/chinh-sach-bao-mat` at 1280 and 390 — way cards (plate/icon/title/body/44px button, two columns → one), the note panel, the contents rail visible from `lg` and the chip trail on phones, the numbered document sections, the updated line, the closing CTA, no horizontal scroll, all targets ≥ 44px; check the rail's active row moves on scroll (`aria-current="location"`) and that an anchor jumps with the heading clear of the navbar.
- [ ] `docs/BAN-GIAO.md`: step 6d paragraph, new test count, "step 6 done; next step 7 (404 + error pages, incl. the search error state)".
- [ ] One review of the branch; fix Critical/Important (TDD where pure, browser otherwise); defer minors in `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-6d-dong-gop-bao-mat/progress.md`.
- [ ] Merge to `main` locally (fast-forward), delete the branch. Do not push.

## Review Focus
- 390px: way cards stack as rows with a 64px plate, the note panel stacks, the chip trail scrolls sideways without a page overflow, the doc panel has no frame and 22px headings.
- The contents rail: the row being read is dark and carries `aria-current="location"`; the first row is current on load; a rail link scrolls so the heading clears the fixed navbar.
- Long words: a long section title or the storage key in the copy wrap inside the doc column.
- Way cards: an empty body still keeps the footer button aligned; a lone odd card spans the full row.
- Reduced motion: `CardReveal` shows the cards at once; the rail switches instantly.

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```
Browser: the real `/vi/dong-gop` and `/vi/chinh-sach-bao-mat` at 1280 and 390; then merge.

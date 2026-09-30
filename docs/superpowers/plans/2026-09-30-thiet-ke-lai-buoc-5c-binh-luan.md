# Step 5c — Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Redesign the comment section (`boards/Blog-Comments-States`, comment parts of `Blog-Spec`, `Blog-Post-*`) using the shared `Field`, `FormNotice` and `Button` from step 1.

**Architecture:** Split the 417-line `CommentSection.tsx` into `src/components/forum/comments/` (`CommentForm`, `CommentItem`, `CommentEmpty`, `CommentReveal` helpers) with the pure logic (validation, initials, "which comments are new") in `src/lib/comment-form.ts` under test. `CommentSection` keeps its public props and `ROOT_PAGE_SIZE`/`MAX_ROOT_COMMENTS` exports, so the blog and video pages need no change. Comments keep posting through `POST /api/comments` (`fetch` + `router.refresh()`); no server action, no route, query or migration change.

**Tech Stack:** Next.js 14, next-intl, Tailwind, Vitest.

**Spec:** `docs/thiet-ke-giao-dien/boards/Blog-Comments-States.dc.html`, `Blog-Spec.dc.html`, `Components.dc.html`, `Motion.dc.html` (BL12–BL19).

## Decisions (maintainer, 2026-09-30)
- D1: clicking Reply scrolls to the form (instant under reduced motion) and focuses the message field with `preventScroll` (BL17).
- D2: a failed submit shows every invalid field's error at once and focuses the first invalid one (board C1).
- D3: no character counter; keep `maxLength={2000}` on the textarea. The "too long" error is still validated (paste/trim edge).
- D4: keep the REST route; the Video detail page gets the redesign for free (it already renders `CommentSection`).
- D5: no new query or migration. Count `h2` shows all comments; the "Đang hiện x/y" line counts root comments (as today).

## Global Constraints
- Every string through `src/messages/{vi,en}.json`, same key set; add vi first (RED), then en.
- No `${}`-built Tailwind classes; hover as `[@media(hover:hover)]:hover:...`; durations `fast/card/panel/base` only.
- Motion respects `prefers-reduced-motion` (`motion-safe:` variants; content visible without JS).
- Tap targets ≥ 44px; focus ring 2px `#314344` offset 2; errors never rely on colour alone.
- Real comments unavailable locally (no Supabase): verify with a temporary ui-gallery page, then delete it and its `.next/types` file.

## Review Focus
- Submit with all three fields empty, email only invalid, body 2001 chars (paste): every offending field marked (`aria-invalid`, `aria-describedby` hint then error), focus on the first invalid.
- 429 and generic failures: `FormNotice` error `role=alert`, field values kept; success: notice `role=status`, form reset, reply mode cleared, notice not lost when the title changes back.
- Reply from a comment far above the form: scrolls and focuses; reduced motion jumps; Cancel returns the title.
- Very long names/bodies with no spaces at 390px: no horizontal overflow (`overflow-wrap:anywhere`).
- Zero comments, one comment ("1 comment"), replies one level deep, "show more" at the cap (`MAX_ROOT_COMMENTS`): count line and button.
- Honeypot present in every form instance, hidden from people and assistive tech, with a real label.

---

### Task 1: Strings
**Files:** `src/messages/vi.json`, `src/messages/en.json` (`comments.*`).
- [ ] vi first (RED on `keys-parity.test.ts`): add `honeypotLabel` ("Trang web"), `replyTo` ("Trả lời {name}"), `emailOptional` ("(không bắt buộc)"); `emailHint` stays the full sentence (remove the "(…)" wrapping in code, not in the string); add `errors.nameRequired` etc. already exist.
- [ ] en (GREEN): `honeypotLabel` "Website", `replyTo` "Reply to {name}", `emailOptional` "(optional)", `bodyLabel` "Message", `submitting` "Sending...", `count` ICU plural "{count, plural, one {# comment} other {# comments}}", `errors.rateLimited` "You are commenting too fast. Please try again in a few minutes.", `errors.generic` "We could not send your comment. Please try again.", `errors.emailHint` unchanged. vi `count` stays "{count} bình luận".
- [ ] Commit `feat(i18n): strings for the redesigned comments`.

### Task 2: Pure helpers (TDD)
**Files:** create `src/lib/comment-form.ts`, `src/lib/comment-form.test.ts`.
- [ ] RED tests then GREEN:
  - `validateComment({name,email,body}) → Partial<Record<"name"|"email"|"body", "nameRequired"|"emailInvalid"|"bodyRequired"|"bodyTooLong">>`: trims; empty name → nameRequired; non-empty malformed email → emailInvalid, empty email OK; empty body → bodyRequired; body > 2000 → bodyTooLong; all three can be present at once.
  - `firstInvalidField(errors) → "name"|"email"|"body"|null` in visual order.
  - `commentInitial(name) → string`: first grapheme upper-cased (`"  ánh"` → `"Á"`, emoji, empty → `"?"`).
  - `freshCommentIds(previous: ReadonlySet<string>, current: string[]) → string[]`: ids in `current` not in `previous`, in order; empty `previous` (first render) → `[]` so the initial list does not animate.
- [ ] Commit `feat(comments): pure helpers for validation, initials and new items`.

### Task 3: CommentForm
**Files:** create `src/components/forum/comments/CommentForm.tsx` (moved and rewritten from `CommentSection.tsx`).
- [ ] Panel `rounded-3xl border border-border bg-surface p-5 md:p-7`; `h3` 18px/700 ("Để lại bình luận" / "Đang trả lời {name}"); Name + Email in `sm:grid-cols-2 gap-4`, Message below (`gap-4`), all via `Field` + `Input`/`Textarea` (`rows={5}`, `className="min-h-[132px]"`), visible labels, Email with `optionalNote={t("emailOptional")}` and `hint={t("emailHint")}`, `required`/`aria-required` on name and body, `maxLength` 80/2000, `autoComplete` name/email.
- [ ] `submit`: `validateComment` → set all field errors → focus `firstInvalidField`; clearing a field's error on change. API errors mapped as today (`ERROR_FIELDS`/`ERROR_KEYS`), unmapped → generic notice.
- [ ] Notices via `FormNotice` (`success`, `error`), 16px above the buttons, no focus steal. `Button` `busy={submitting}` with "Sending…" label swap, full width on phones (`flex-1 sm:flex-none`); Cancel = 44px underlined text button.
- [ ] Honeypot: real `<label htmlFor>` + `id`, `t("honeypotLabel")`, off-screen, `aria-hidden`, `tabIndex={-1}`.
- [ ] Reply mode: `formRef.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })` (form `scroll-mt-24`) then `bodyRef.focus({ preventScroll: true })` when `replyTo` becomes non-null (`useEffect`).
- [ ] Typecheck + lint. Commit `feat(comments): redesigned comment form`.

### Task 4: CommentItem
**Files:** create `src/components/forum/comments/CommentItem.tsx`, add the `comment-in` keyframe/animation to `tailwind.config.ts`.
- [ ] 36px avatar circle (`bg-surface-muted` border, `commentInitial`, `aria-hidden`); header: name 14px/600 `[overflow-wrap:anywhere]`, author badge (11px/700 uppercase, `bg-surface-muted` border, accent, pill), `<time>` 12px `text-nav` with `dateStyle: "medium", timeStyle: "short"`; body 15px/1.6 `text-text-nav` `whitespace-pre-wrap [overflow-wrap:anywhere]`.
- [ ] Reply button: 44px min height, 13px/600, `aria-label={t("replyTo", { name })}`, roots only. Replies: `ml-2 pl-3 sm:ml-6 sm:pl-4 border-l-2 border-border`.
- [ ] `fresh` prop adds `motion-safe:animate-comment-in` with `--d` delay `0.05 + i × 0.07` s (BL16 single new comment, BL18 batch); keyframe opacity 0/translateY(20px) → rest, 0.55s `ease-standard`, `both`.
- [ ] Commit `feat(comments): redesigned comment item`.

### Task 5: Empty state and show more
**Files:** create `CommentEmpty.tsx`; show-more block stays in the section.
- [ ] `CommentEmpty`: `role="status"`, dashed 1.5px `#A8A8A8` 16px-radius box, `bg-white/50`, 44px icon circle + one line ("Chưa có bình luận nào. Hãy là người đầu tiên!"), fade-in 0.25s (`motion-safe:animate-notice-in`).
- [ ] Show more: centred column gap 12px, `mt-8`; count line `role="status" aria-live="polite"` 14px `tabular-nums`; `Button variant="secondary"` as link with chevron (`?comments=n`, `scroll={false}`), hidden at the cap.
- [ ] Commit `feat(comments): empty state and show-more block`.

### Task 6: Assemble
**Files:** rewrite `src/components/forum/CommentSection.tsx`.
- [ ] `section#comments aria-labelledby="comments-h"`, `mt-12 lg:mt-16 border-t border-border pt-8 lg:pt-10`; heading `h2#comments-h` 22px (26px `lg`) 800 with a 20/22px `MessageSquare` icon; form above the list (28px gap when empty, 40px with a list); nested `ul` for replies; track rendered ids in a ref and mark `freshCommentIds` items after a refresh; keep exports `ROOT_PAGE_SIZE`, `MAX_ROOT_COMMENTS` and the props unchanged.
- [ ] Verify blog and video pages typecheck untouched. Commit `feat(comments): redesigned comment section`.
- [ ] Browser check with a temporary gallery page at 1280 and 390 (vi and en): panel, two-column fields (stack at 390), all-errors submit + focus, 429/generic notices (simulate by stubbing `fetch` in the page), success + reset, reply scroll/focus, thread indent, badge, empty state, show-more, no horizontal scroll with a 200-char unbroken name. Delete the page and its `.next/types` file afterwards.

### Task 7: Gate, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`; `npm run build` unverifiable in the sandbox (say so).
- [ ] `docs/BAN-GIAO.md`: step 5c paragraph and the new test count.
- [ ] One Opus review of the whole branch; fix Critical/Important with TDD; defer minors in the ledger.

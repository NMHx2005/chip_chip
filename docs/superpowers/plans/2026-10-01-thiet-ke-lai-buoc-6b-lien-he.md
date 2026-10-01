# Step 6b — Contact page + "Report a mistake" Implementation Plan

**Goal:** Redesign `/lien-he` and the article "Báo lỗi bài này" form to match `boards/Contact-*`, `Contact-States-*`, `Contact-FormSpecimen-*`, `Contact-ReportMistake-*`, reusing the step-1 form primitives.

**Branch:** `feat/thiet-ke-lai-buoc-6b-lien-he` (off `main`).

**Spec:** `docs/thiet-ke-giao-dien/boards/Contact-VI-1280.dc.html`, `Contact-EN-1280`, `Contact-VI-390`, `Contact-EN-390`, `Contact-States-VI-1280`, `Contact-ReportMistake-VI-1280`, `Contact-ReportMistake-EN-390`, `Contact-Spec-VI-1280`, `Global-Shared.dc.html`, `HANDOFF.md`.

## Scope
- **In:** the Contact page (hero + two-column body + aside cards), the shared `MessageForm` (contact variant), the "report a mistake" disclosure and its form, and the new `InfoBlock` card. This one form serves `/api/messages`; the route and columns do not change.
- **Out (later):** About (6c), Contribute + Privacy (6d); error pages (7). No API change.

## Decisions (maintainer, 2026-10-01 / earlier)
- **D1:** "Báo lỗi bài này" uses the shared **`Disclosure`** (`size="sm"`, the `+` disc) wrapped in a bordered card — one disclosure pattern for the site; the board's 52px/chevron row is not kept.
- **D2:** Success notice stays **accent + tick** (`FormNotice` success), per the step-1 decision; the board's green box is not adopted. Red is errors only.
- **D3:** Input border stays the `field` token (`#767676`).
- **D4:** Validation runs on submit, then clears per field as the reader edits (current behaviour). The submit shows **every** field error at once (a pure validator, no API change); server-only errors (rate limit, network, generic, post gone) stay a single notice.
- **D5:** The reply-time block keeps its current placeholder copy (README tracks the real value); email and social blocks hide while their constant is empty.

## Global constraints
- Every string through `src/messages/{vi,en}.json`, identical key sets (vi first, RED on `keys-parity.test.ts`, then en).
- No `${}`-built Tailwind classes; hover scoped `[@media(hover:hover)]:hover:`; durations from tokens; reduced-motion branches.
- Tap targets ≥ 44px. No `scroll-margin` on anchors.
- Reuse step-1 primitives: `Field`/`Input`/`Textarea`, `FormNotice`, `RadioSegment`, `Button`, `Disclosure`, `PageHero`. Do not build a parallel form system (Global-Shared: "FormField"/"FormStatus" = the existing `Field`/`FormNotice`).

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json` (`contact.*`).
- [ ] vi first (RED): `form.kindHint.contact|feedback` (one line per kind), `form.errorSummary` ("Cần sửa {count} chỗ trước khi gửi"), `form.sending` ("Đang gửi tin nhắn của bạn…"), `form.sentBody` ("Tin nhắn đã tới tác giả. Bạn có thể gửi thêm tin khác nếu cần."), `form.kept` ("Nội dung bạn viết vẫn còn nguyên trong các ô bên trên."), `errors.rateLimitedTitle` ("Đã đạt giới hạn gửi tin"), `errors.networkTitle` ("Mất kết nối"), `errors.genericTitle` ("Chưa gửi được"), `aside.beforeSendTitle` ("Trước khi gửi"), `aside.limitHint` ("Giới hạn tính chung cả liên hệ, góp ý và báo lỗi bài."), `report.sentBody`, `report.kept`. Keep the existing keys (`form.sent` becomes the success title; `form.bodyHint` etc.).
- [ ] en (GREEN): the mirror strings.
- [ ] Commit `feat(i18n): strings for the redesigned contact page`.

### Task 2: All-field validation (TDD)
**Files:** `src/components/contact/message-form-fields.ts` (+ its test).
- [ ] RED then GREEN: `validateMessageFields(fields: { name: string; email: string; body: string }): Partial<Record<MessageFormField, MessageErrorKey>>` — reuses `MESSAGE_LIMITS` + `EMAIL_PATTERN` from `@/lib/contact-client`, trimmed, returns **every** failing field at once (`name`/`email`/`body` → `nameLength`/`emailInvalid`/`bodyLength`). Tests: empty name and body → both keys; bad email → email key; all valid → `{}`; over-limit name/body → keys; blank email is allowed.
- [ ] Keep `fieldForError` (server errors → the field to mark, or null).
- [ ] Commit `feat(contact): validate every field at once`.

### Task 3: InfoBlock + RadioSegment hint
**Files:** create `src/components/contact/InfoBlock.tsx`; `src/components/ui/form/RadioSegment.tsx`.
- [ ] `InfoBlock`: white card (`rounded-2xl border border-border bg-surface p-5`), a 40px round icon tile + an `h2` 14px/700, then children (`flex flex-col gap-2.5`); optional `rows` separator `border-t border-hairline`.
- [ ] `RadioSegment`: optional `hint?: string` rendered under the control and wired via `aria-describedby` on the `fieldset`.
- [ ] Commit `feat(contact): info card and a radio-group hint`.

### Task 4: MessageForm
**Files:** `src/components/contact/MessageForm.tsx`.
- [ ] Contact variant: `RadioSegment` (controlled `kind`, 2-col grid under `sm`) with the per-kind hint; `Field`+`Input` name (required), `Field`+`Input` email (optional note + hint), `Field`+`Textarea` body (hint with the limit); honeypot; a persistent `aria-live` region.
- [ ] Submit: `validateMessageFields` first — on failure set every field error, show `FormNotice tone="error"` titled `form.errorSummary`, listing one anchor link per errored field (jumping to and focusing it), focus the first; on success call `sendMessage`.
- [ ] States: sending → `FormNotice tone="note"` `form.sending`, fields `readOnly` + `aria-busy` on the form, `Button busy` (`form.submitting`, keeps focus); sent → `FormNotice tone="success"` title `form.sent` + body `form.sentBody`, form cleared and kept; server error → `FormNotice tone="error"` with the `errors.*Title` and the message, plus `form.kept` when fields survive.
- [ ] Report variant: same form, no kind selector, body label `report.bodyLabel`, submit `report.submit`, sent `report.sent` + `report.sentBody`; send `content_error` with the article id.
- [ ] Commit `feat(contact): redesigned message form`.

### Task 5: ReportMistake + Contact page
**Files:** `src/components/contact/ReportMistake.tsx`, `src/app/[locale]/lien-he/page.tsx`.
- [ ] `ReportMistake`: wrap the form in the shared `Disclosure` (D1) inside a bordered card; summary = `Flag` icon + `report.toggle`; panel = `report.intro` + `MessageForm variant="report"` + the limit reminder line.
- [ ] Contact page: `PageHero` (eyebrow, title, description — full width) then a body section `mx-auto w-full max-w-content grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16`: the form in a `rounded-3xl border border-border bg-surface p-6 md:p-8` card; the aside = `InfoBlock`s — email (mono `mailto`, hidden when empty), social (hidden when empty), "Khi nào có phản hồi" (clock icon; `responseBody` + `limitNote`), "Trước khi gửi" (info icon; the `3` badge + `limitHint`, then the shield + `privacyNote` + `privacyLink`).
- [ ] Commit `feat(contact): redesigned contact page and report-a-mistake`.

### Task 6: Gate, browser check, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`.
- [ ] Browser check via a temporary `/ui-gallery/contact` page (no Supabase): the contact form and the report disclosure at 1280 and 390 — card/grid layout, every field's label/hint, empty submit → aggregated notice + per-field errors + first field focused, the kind hint swaps with the selection, the report `Disclosure` opens/closes, all targets ≥ 44px, no horizontal scroll. Sending/sent need the API (covered by the client unit tests), so check the error notice by submitting with the API unreachable. Delete the temp page and its `.next` artifacts.
- [ ] `docs/BAN-GIAO.md`: step 6b paragraph (mention D1/D2/D4), new test count, "next 6c About, 6d Contribute+Privacy, then 7".
- [ ] One review of the branch; fix Critical/Important with TDD; defer minors in `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-6b-lien-he/progress.md`.
- [ ] Merge to `main` locally (fast-forward), delete the branch. Do not push.

## Review Focus
- Submit empty: every error shown at once, each field marked and linked, focus on the first invalid; editing a field clears only that one.
- Rate limit / network / generic: the right title + the "content kept" line; the form is not cleared.
- Sending: fields read-only, `aria-busy`, the button stays focused and says "Đang gửi…"; no spinner.
- Report variant: no kind selector; `content_error` + the article id; sent copy differs.
- 390px: the form stacks, the kind control is a 2-col grid, inputs are 16px (no iOS zoom), the aside cards stack.
- Webhook/API unchanged: `POST /api/messages` still receives the same payload shape.

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```
Browser: temp `/ui-gallery/contact` at 1280 and 390; then delete it and merge.

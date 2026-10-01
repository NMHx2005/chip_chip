# Step 8 — Sign-up page, About additions, press page Implementation Plan

**Goal:** Add what the project plan file (`~/Downloads/PROJECT CHÍP CHÍP KẾ HOẠCH HOẠT ĐỘNG.md`) asks for beyond the finished redesign: a shared sign-up form (volunteer / survey / webinar / competition), the About copy and team section, the About form, and a press page.

**Branch:** `feat/thiet-ke-lai-buoc-8-dang-ky-doi-ngu-bao-chi` (off `main`).

## Scope and decisions (maintainer, 2026-10-01)
- **D1 — personal project:** one shared **`/dang-ky`** page with a type selector (Tình nguyện viên / Khảo sát / Webinar / Cuộc thi) that sends through the **existing `messages` pipeline** — no new table. The four types become four new `message_kind` enum values so the inbox can label them.
- **D2 — team:** the About page keeps the author block and turns the contributors list into a compact **team** section that can take photos later; no invented departments.
- **D3 — About copy:** the hero becomes "Khai phá những vùng đất mới" / "Hơn cả một dự án… Bắt đầu từ số 0, kết thúc là thành công", and the closing CTA gets the plan's line.
- **D4 — About form:** the sign-up form is embedded on the About page (same component as `/dang-ky`).
- **D5 — press:** a small `/bao-chi` page (boilerplate, how to credit, contact, room for future mentions) — no fake press list.
- **Out:** the org chart/departments, certificates, and a separate "landing page" (the homepage plus `/dang-ky` cover it).

## Deploy note (must reach the maintainer)
The migration adds enum values, so it must run **before** the code is deployed (the README's order already says migrate first); `./scripts/verify-security.sh` must stay green locally. `BAN-GIAO.md` gets the note.

## Global constraints
- Strings in `src/messages/{vi,en}.json`, identical key sets (vi first, RED on `keys-parity.test.ts`, then en); routes localized in `src/i18n/routing.ts`; sitemap entries in `src/lib/sitemap-entries.ts`.
- Reuse the step-6b form machinery: `Field`/`Input`/`Textarea`, `RadioSegment`, `FormNotice`, `Button`, `validateMessageFields`, `sendMessage`, and the honeypot/rate-limit route (no new API).
- Server components by default; only the form is client. No `${}`-built classes, hover scoped, durations from tokens, reduced motion, targets ≥ 44px.

---

### Task 1: Strings
**Files:** `src/messages/{vi,en}.json`.
- [ ] vi first (RED), then en: a **`signup`** namespace (`title`, `eyebrow`, `description`, `typeLegend`, `types.{volunteer,survey,webinar,competition}`, `bodyLabel`, `bodyHint`, `note`, `submit`, `sending`, `sent`, `sentBody`) and a **`press`** namespace (`title`, `eyebrow`, `description`, `aboutTitle`, `aboutBody`, `creditTitle`, `creditBody`, `contactTitle`, `contactBody`, `contactLink`, `mentionsNote`); `about.hero.headline`/`description` changed per D3; `about.cta.headline` changed; `about.team.headline`/`description` (the team section) and `about.signup.headline`/`lead` (the embedded form); `footer.links.signup`.
- [ ] Reuse `contact.errors.*` and `contact.form.*` where the copy is the same instead of duplicating.
- [ ] Commit `feat(i18n): strings for sign-up, the team section and press`.

### Task 2: Migration + kinds
**Files:** create `supabase/migrations/20261001000000_signup_kinds.sql`; `src/lib/contact-message.ts`; `src/app/admin/(dashboard)/tin-nhan/page.tsx`.
- [ ] Migration: `alter type public.message_kind add value if not exists 'volunteer'` (and `survey`, `webinar`, `competition`) — four statements, values only added (never used in the same migration, so the enum stays transaction-safe).
- [ ] `MESSAGE_KINDS` gains the four; `parseMessagePayload` accepts them (no other change).
- [ ] The admin inbox labels the new kinds and its `Row["kind"]` union is extended.
- [ ] Commit `feat(messages): sign-up kinds`.

### Task 3: Sign-up form
**Files:** create `src/components/signup/signup-kind.ts` (+ `.test.ts`); `src/components/signup/SignupForm.tsx`.
- [ ] TDD `signupKindToMessageKind(type: SignupType): MessageKind` (the four types map 1:1) and the ordered `SIGNUP_TYPES` list — so the form's type list and the wire values cannot drift.
- [ ] `SignupForm` (client): a `RadioSegment` type selector, name (required), email (optional + hint), body (`signup.bodyLabel`), honeypot, the aggregated all-at-once validation and the sending/sent/error `FormNotice`s — the same shape as `MessageForm`, sending `signupKindToMessageKind(type)` through `sendMessage`.
- [ ] Commit `feat(signup): the shared sign-up form`.

### Task 4: `/dang-ky`
**Files:** create `src/app/[locale]/dang-ky/page.tsx`.
- [ ] `PageHero` + a card holding `SignupForm` + a short note; `generateMetadata` with `localeAlternates`.
- [ ] Commit `feat(signup): the sign-up page`.

### Task 5: About additions
**Files:** `src/app/[locale]/gioi-thieu/page.tsx`, `src/components/sections/about/{Contributors,ContributeCta}.tsx`, `src/lib/constants.ts`.
- [ ] Hero copy per D3; the closing CTA line per D3.
- [ ] `CONTRIBUTORS` gains an optional `photo: string | null`; `Contributors` becomes the team section (`about.team.*`), each card using `Avatar` (photo or initials) — still hidden while empty.
- [ ] A "Đăng ký tham gia" section on the page embedding `SignupForm` (`about.signup.*`), linking to `/dang-ky`.
- [ ] Commit `feat(about): team section, the plan's copy and the sign-up form`.

### Task 6: `/bao-chi`
**Files:** create `src/app/[locale]/bao-chi/page.tsx`.
- [ ] `PageHero` + three sections (about the project, how to credit / usage, press contact → `/lien-he`) and a note that press mentions will be listed later; `generateMetadata`.
- [ ] Commit `feat(press): the press page`.

### Task 7: Wiring
**Files:** `src/i18n/routing.ts`, `src/lib/sitemap-entries.ts`, `src/lib/constants.ts` (`FOOTER_LINKS`).
- [ ] Routing: `/dang-ky` (vi `/dang-ky`, en `/sign-up`), `/bao-chi` (vi `/bao-chi`, en `/press`).
- [ ] Sitemap: both added to `STATIC_ROUTES`.
- [ ] Footer: a `signup` link (label `footer.links.signup`), keeping `footer-links.test.ts` green.
- [ ] Commit `feat(routing): sign-up and press routes in the sitemap and footer`.

### Task 8: Gate, browser check, docs, review
- [ ] typecheck, lint, `npm test -- --maxWorkers=3`; `./scripts/verify-security.sh` is not run (needs a local Supabase), say so.
- [ ] Browser check (no Supabase): `/vi/dang-ky` and `/vi/bao-chi` at 1280 and 390 (hero, form fields, the type selector swapping the hint, empty submit → the aggregated notice + focus, targets ≥ 44px, no horizontal scroll), the About page (new copy, team section hidden while empty, the embedded form), and the admin label mapping by unit test.
- [ ] `docs/BAN-GIAO.md`: step 8 paragraph (incl. the migration-before-deploy note), the new test count, the routes and their placeholders.
- [ ] One review of the branch; fix Critical/Important (TDD where pure, browser otherwise); defer minors in `.superpowers/sdd/2026-10-01-thiet-ke-lai-buoc-8-.../progress.md`.
- [ ] Merge to `main` locally (fast-forward), delete the branch. Do not push.

## Review Focus
- The four types round-trip: the form's `kind` reaches `/api/messages` and the enum accepts it (a `kind_invalid` 400 would be the failure).
- Empty submit → every field error at once, focus on the first; editing clears one.
- The About team section with zero contributors leaves no gap; with people it shows photos or initials.
- 390px: the form and the type selector stack; the press page reads as a document.
- No new API, no new table; the honeypot and rate limit still apply.
- The old messages copy still works (contact/feedback/content_error unchanged).

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```
Browser: `/vi/dang-ky`, `/vi/bao-chi`, `/vi/gioi-thieu` at 1280 and 390; then merge.

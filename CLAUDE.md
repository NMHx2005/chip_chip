# Project Chíp Chíp

Non-profit, bilingual (vi/en) semiconductor-learning site for high-school students. One maintainer. Status and handover: `docs/BAN-GIAO.md`; roadmap and specs: `docs/superpowers/specs/`.

## Stack

Next.js 14 App Router · TypeScript strict · Tailwind · next-intl · Supabase (Postgres + Auth + RLS) · Tiptap · KaTeX · Vitest.

## Commands

```bash
npm run dev          # dev server (don't run `next build` at the same time: shared .next)
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # vitest run
npm run build
./scripts/verify-security.sh   # DB security checks against the local Supabase
```

## Conventions

- Reply to the maintainer in Vietnamese; code, comments and commits in English (Conventional Commits, no attribution lines).
- Every user-facing string goes through `messages/{vi,en}.json`; both files must keep the same key set.
- Routes are localized in `src/i18n/routing.ts`; use `postHref()` for post links.
- `posts` holds lessons, blog (`forum`) and videos (`kind`). VI and EN are two rows sharing `translation_id`; `publish_translation()` enforces both languages. Don't bypass it.
- Never edit an applied migration; add a new file in `supabase/migrations/`.
- Article HTML: Tiptap JSON → `generateHTML` → `sanitizeArticleHtml` → KaTeX/video rendering. `src/lib/tiptap/extensions.ts` is the single schema for editor and renderer; a new node must also be allowed in `sanitize.ts`.
- Server Actions return values, they don't redirect. Keep server-only secrets (service role, DeepSeek key) out of client bundles.
- Motion uses tokens from `components/motion/tokens.ts` and must respect `prefers-reduced-motion`.
- Before saying done: typecheck, lint and tests pass.

## Gotchas

- A closed `<details>` hides its content; CSS can't force it open.
- `useSearchParams` needs a Suspense boundary.
- Verify layout in the browser with `checkVisibility()` or screenshots, not bounding boxes.
- 404s on detail routes return the right status but Next 14 serves a generic shell.

## Never without an explicit OK

Push, `supabase db push`, run destructive SQL, delete files in bulk, or touch production data.

# Step 9 — Split the sign-up into four pages, and finish the deferred polish

**Goal:** split the shared sign-up page into one page per type, and clear the small items the earlier reviews deferred.

**Branch:** `feat/thiet-ke-lai-buoc-9-tach-dang-ky` (off `main`).

## Decisions (maintainer, 2026-10-01)
- **D1:** each sign-up type gets its **own page** with its own localised URL, title and description; `/dang-ky` becomes an intro that links to the four.
- **D2:** the form takes its type from the route (no selector); the About page links to the four pages instead of embedding a form.

## Scope
- **In:** four type pages + the intro page, the form/page split, and the deferred polish (public hover scoping, the page-level error live-region role, the shared kind→icon map, distinct `role="search"` names, the honeypot label key, the README/`CONTRIBUTORS` doc).
- **Out:** the content the maintainer still has to write (lesson copy, real URLs, photos), and the admin surfaces (deliberately outside several public-site conventions).

## Tasks (done)
1. **Routes and strings.** `routing.ts` gains `/dang-ky/{tinh-nguyen,khao-sat,webinar,cuoc-thi}` (en `/sign-up/{volunteer,survey,webinar,competition}`); `signup.chooseHeading`/`openLink`/`back` replace `typeLegend`; `contact.form.honeypotLabel` added; `about.join.link` dropped.
2. **`signup-kind.ts`.** `SIGNUP_TYPE_PATHS` maps each type to its route, held to `routing.pathnames` by a test.
3. **Form and pages.** `SignupForm` takes a fixed `type`; a shared `SignupTypePage` renders the hero + form + a back link; four thin `page.tsx` files carry the metadata; `/dang-ky` lists the four with icons and `CardReveal`.
4. **About.** The join block links to the four pages (the form lives on its own page now).
5. **Polish.** Public hover scoping; `EmptyState` gains a `role` override and the whole-page errors announce as `status`; `KIND_ICON` shared; both search forms named; the honeypot label from the catalogue; the sitemap lists the four type pages and its test pins them.

## Review focus
- The four pages resolve in both locales; the intro links to them; the form posts the right `kind`.
- The 404 renders and announces as before; the search error still interrupts.
- A tap leaves no stuck hover on the public pages.

## Verification
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3
```

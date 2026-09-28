import { getTranslations } from "next-intl/server";

/**
 * Shared skeleton for the blog, lesson and video detail pages' `loading.tsx`.
 * Mirrors their shape (back link, title, cover, body) so the layout does not
 * jump once the real article replaces it — for the expanding-card open
 * transition and for a slow first load alike.
 */
export async function ArticleSkeleton() {
  const t = await getTranslations("common");

  return (
    <article className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl" role="status" aria-live="polite">
        <span className="sr-only">{t("loading")}</span>

        <div aria-hidden className="h-4 w-28 animate-pulse rounded-full bg-surface-muted" />

        <div aria-hidden className="mt-8 h-9 w-3/4 animate-pulse rounded-lg bg-surface-muted" />
        <div aria-hidden className="mt-3 h-9 w-1/2 animate-pulse rounded-lg bg-surface-muted" />

        <div
          aria-hidden
          className="mt-8 aspect-video w-full animate-pulse rounded-2xl bg-surface-muted"
        />

        <div aria-hidden className="mt-10 flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded-full bg-surface-muted" />
          ))}
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-muted" />
        </div>
      </div>
    </article>
  );
}

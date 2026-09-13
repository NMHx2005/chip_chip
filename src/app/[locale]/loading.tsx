import { getTranslations } from "next-intl/server";

/**
 * Route-level loading state.
 *
 * Shown while a server component streams — mostly felt on slow mobile
 * connections, which is the audience this site is built for. The block sizes
 * roughly match the real layout so the page does not jump when it swaps in.
 */
export default async function Loading() {
  const t = await getTranslations("common");

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-5 py-16 md:px-8 md:py-20"
    >
      <div className="mx-auto w-full max-w-content">
        <span className="sr-only">{t("loading")}</span>

        <div className="flex flex-col gap-4">
          <div className="h-5 w-32 animate-pulse rounded-full bg-surface-muted" />
          <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-surface-muted" />
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-surface-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-surface-muted" />
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-surface-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

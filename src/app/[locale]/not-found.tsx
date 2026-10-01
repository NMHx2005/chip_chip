import { getLocale, getTranslations } from "next-intl/server";
import { SearchForm } from "@/components/search/SearchForm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

// Hover scoped to a real pointer; Tailwind reads the class as plain text.
const PILL =
  "inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-text-nav transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:border-black/25";

/**
 * The 404 for any URL under a locale that no route matched (see the `[...rest]`
 * catch-all). It renders inside the [locale] layout, so it keeps the navbar,
 * footer and correct `lang`.
 */
export default async function NotFound() {
  const [t, tNav, tSearch, locale] = await Promise.all([
    getTranslations("errors"),
    getTranslations("nav"),
    getTranslations("search"),
    getLocale(),
  ]);

  return (
    <section className="px-5 py-14 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-content">
        <EmptyState
          eyebrow={t("eyebrow404")}
          headingLevel="h1"
          chip="notFound"
          tone="error"
          role="status"
          title={t("titleGlobal")}
          description={t("descGlobal")}
          className="min-h-0 gap-5 sm:min-h-[520px]"
          actions={
            <>
              <Button href="/">{t("home")}</Button>
              <Button href="/bai-hoc" variant="secondary">
                {t("lessons")}
              </Button>
            </>
          }
          after={
            <div className="mt-2 flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                  {t("goTo")}
                </span>
                <Link href="/blog" className={PILL}>
                  {tNav("forum")}
                </Link>
                <Link href="/video" className={PILL}>
                  {tNav("lessonsVideo")}
                </Link>
                <Link href="/gioi-thieu" className={PILL}>
                  {tNav("about")}
                </Link>
              </div>
              <p className="text-sm leading-relaxed text-text-muted">
                {t("reportHint")}{" "}
                <Link
                  href="/lien-he"
                  className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-black"
                >
                  {t("reportLink")}
                </Link>
              </p>
            </div>
          }
        >
          <div className="w-full max-w-[480px]">
            <SearchForm
              action={getPathname({ href: "/tim-kiem", locale: locale as Locale })}
              label={t("search")}
              formLabel={tSearch("title")}
              placeholder={t("search")}
              submitLabel={tSearch("submit")}
              inputId="error-search"
              labelHidden
            />
          </div>
        </EmptyState>
      </div>
    </section>
  );
}

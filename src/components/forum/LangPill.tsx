import { getTranslations } from "next-intl/server";
import { Languages } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";
import type { Locale } from "@/i18n/routing";

/**
 * Link to the same article in the other language. The caller renders it only
 * when that translation exists. `hreflang` tells crawlers and screen readers
 * the language of the target.
 */
export async function LangPill({
  href,
  locale,
}: {
  href: ComponentProps<typeof Link>["href"];
  locale: Locale;
}) {
  const t = await getTranslations("forum");

  return (
    <Link
      href={href}
      locale={locale}
      hrefLang={locale}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[13px] font-semibold text-accent transition-colors duration-fast ease-standard motion-reduce:transition-none [@media(hover:hover)]:hover:border-black/25"
    >
      <Languages aria-hidden className="size-4" strokeWidth={2} />
      {locale === "en" ? t("readInEnglish") : t("readInVietnamese")}
    </Link>
  );
}

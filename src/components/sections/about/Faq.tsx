import { getTranslations } from "next-intl/server";
import { Disclosure } from "@/components/ui/Disclosure";
import { Link } from "@/i18n/navigation";

const QUESTIONS = ["free", "author", "mistake", "classroom", "ads", "english"] as const;

/**
 * The shared `Disclosure` list: native `<details>`, closed by default, so it
 * works with keyboard, screen readers and find-in-page as is.
 *
 * On phones the hint sits under the list (source order); from `lg` the grid
 * moves it under the heading in the left column, 12px below it, with the list
 * beside it.
 */
export async function Faq() {
  const t = await getTranslations("about.faq");

  return (
    <section aria-labelledby="about-faq" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-content gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-3">
        <h2
          id="about-faq"
          className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px] lg:col-start-1 lg:row-start-1"
        >
          {t("headline")}
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="divide-y divide-border">
            {QUESTIONS.map((id) => (
              <Disclosure key={id} size="md" summary={t(`items.${id}.question`)}>
                {t(`items.${id}.answer`)}
              </Disclosure>
            ))}
          </div>
        </div>

        <p className="max-w-[300px] text-sm leading-relaxed text-text-muted lg:col-start-1 lg:row-start-2 lg:self-start">
          {t("moreHint")}{" "}
          <Link
            href="/lien-he"
            className="font-semibold text-accent underline underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-black"
          >
            {t("moreLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}

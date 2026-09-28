import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

const QUESTIONS = ["free", "author", "mistake", "classroom", "ads", "english"] as const;

/**
 * Native `<details>` accordion: no JavaScript, closed by default, works with
 * keyboard and screen readers as is. One markup for every breakpoint — nothing
 * here must stay open on desktop, so there is no need for the DA3 two-copy
 * trick (CSS cannot reveal a closed `<details>`).
 */
export async function Faq() {
  const t = await getTranslations("about.faq");

  return (
    <section aria-labelledby="about-faq" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-content gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <h2
          id="about-faq"
          className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
        >
          {t("headline")}
        </h2>

        <div className="divide-y divide-border border-y border-border">
          {QUESTIONS.map((id) => (
            <details key={id} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-text transition-colors hover:text-accent md:text-base [&::-webkit-details-marker]:hidden">
                {t(`items.${id}.question`)}
                <Plus
                  className="size-5 shrink-0 text-text-muted transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                  strokeWidth={2}
                  aria-hidden
                />
              </summary>
              <p className="pb-5 pr-9 text-pretty text-[15px] leading-relaxed text-text-muted">
                {t(`items.${id}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

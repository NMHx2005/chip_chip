import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** Closing block of the About page; replaces the old Google Form sign-up. */
export async function ContributeCta() {
  const t = await getTranslations("about.cta");

  return (
    <section aria-labelledby="about-cta" className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content rounded-3xl bg-primary px-6 py-12 md:px-14 md:py-16">
        <h2
          id="about-cta"
          className="max-w-2xl text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-white md:text-[34px]"
        >
          {t("headline")}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 md:text-base">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dong-gop"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-accent transition-colors hover:bg-white/90"
          >
            {t("contribute")}
            <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
          </Link>
          <Link
            href="/lien-he"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t("contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}

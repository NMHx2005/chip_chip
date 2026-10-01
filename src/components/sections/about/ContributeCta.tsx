import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

/** Closing block of the About page; replaces the old Google Form sign-up. */
export async function ContributeCta() {
  const t = await getTranslations("about.cta");

  return (
    <section aria-labelledby="about-cta" className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content rounded-3xl bg-primary p-6 md:p-16">
        <h2
          id="about-cta"
          className="max-w-2xl text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-white md:text-[34px]"
        >
          {t("headline")}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/85">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/dong-gop" variant="onDark" arrow className="w-full sm:w-auto">
            {t("contribute")}
          </Button>
          <Button href="/lien-he" variant="onDarkOutline" className="w-full sm:w-auto">
            {t("contact")}
          </Button>
        </div>
      </div>
    </section>
  );
}

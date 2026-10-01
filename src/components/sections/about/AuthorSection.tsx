import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/Avatar";
import { AUTHOR } from "@/lib/constants";

/** Who makes Chíp Chíp and why. Copy is placeholder until DA5 — see README. */
export async function AuthorSection() {
  const t = await getTranslations("about.author");
  const name = t("name");

  return (
    <section aria-labelledby="about-author" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-content gap-8 rounded-3xl border border-border bg-surface p-6 md:grid-cols-[176px_1fr] md:gap-12 md:p-12">
        <Avatar photo={AUTHOR.photo} alt={t("photoAlt")} name={name} size="lg" />

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            {t("label")}
          </p>
          <h2
            id="about-author"
            className="mt-2 text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text [overflow-wrap:anywhere] md:text-[34px]"
          >
            {name}
          </h2>
          <p className="mt-2 text-sm text-text-muted">{t("role")}</p>

          <div className="mt-6 flex flex-col gap-4 text-pretty text-base leading-relaxed text-text-nav">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
          </div>

          <h3 className="mt-8 text-lg font-bold tracking-[-0.01em] text-text">{t("whyTitle")}</h3>
          <p className="mt-3 text-pretty text-base leading-relaxed text-text-nav">{t("why")}</p>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AUTHOR } from "@/lib/constants";
import { initials } from "@/lib/initials";

/** Who makes Chíp Chíp and why. Copy is placeholder until DA5 — see README. */
export async function AuthorSection() {
  const t = await getTranslations("about.author");
  const name = t("name");

  return (
    <section aria-labelledby="about-author" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-content gap-8 rounded-3xl border border-border bg-surface px-6 py-10 md:grid-cols-[200px_1fr] md:gap-12 md:px-12 md:py-14">
        <div className="relative size-32 overflow-hidden rounded-full bg-surface-muted md:size-44">
          {AUTHOR.photo ? (
            <Image src={AUTHOR.photo} alt={t("photoAlt")} fill sizes="176px" className="object-cover" />
          ) : (
            // Neutral initials rather than a stock face: a placeholder that
            // looks like a real photo would claim more than we know.
            <span
              aria-hidden
              className="flex size-full items-center justify-center text-4xl font-extrabold tracking-[-0.02em] text-text-nav md:text-5xl"
            >
              {initials(name)}
            </span>
          )}
        </div>

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{t("label")}</p>
          <h2
            id="about-author"
            className="mt-2 text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
          >
            {name}
          </h2>
          <p className="mt-2 text-sm text-text-muted">{t("role")}</p>

          <div className="mt-6 flex flex-col gap-4 text-pretty text-[15px] leading-relaxed text-text-nav md:text-base">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
          </div>

          <h3 className="mt-8 text-lg font-bold tracking-[-0.01em] text-text">{t("whyTitle")}</h3>
          <p className="mt-3 text-pretty text-[15px] leading-relaxed text-text-nav md:text-base">{t("why")}</p>
        </div>
      </div>
    </section>
  );
}

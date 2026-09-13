import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { TEAM_UNITS } from "@/lib/constants";

/**
 * Organisational structure.
 *
 * Deliberately shows the eight units rather than individual people: the roster
 * is not finalised, and inventing member profiles would be worse than showing
 * none. Member cards can slot in below once names and photos exist.
 */
export async function TeamStructure() {
  const t = await getTranslations("about.team");

  return (
    <section
      id="team"
      aria-label={t("headline")}
      className="cv-auto px-5 py-14 md:px-8 md:py-20"
    >
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h2 className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]">
            {t("headline")}
          </h2>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
            {t("description")}
          </p>
        </header>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM_UNITS.map((unit) => (
            <li
              key={unit.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                <Users className="size-3" strokeWidth={2.5} aria-hidden />
                {t("headcountLabel", { count: unit.headcount })}
              </span>

              <h3 className="text-balance text-[15px] font-bold leading-snug tracking-[-0.01em] text-text">
                {t(`units.${unit.id}.name`)}
              </h3>

              <p className="text-[13px] leading-relaxed text-text-muted">
                {t(`units.${unit.id}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

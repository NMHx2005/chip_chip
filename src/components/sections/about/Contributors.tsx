import { getTranslations } from "next-intl/server";
import { CONTRIBUTORS } from "@/lib/constants";

/** Hidden until someone has actually helped — an empty "thank you" list reads worse than none. */
export async function Contributors() {
  if (CONTRIBUTORS.length === 0) return null;
  const t = await getTranslations("about.contributors");

  return (
    <section aria-labelledby="about-contributors" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-content">
        <h2
          id="about-contributors"
          className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
        >
          {t("headline")}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
          {t("description")}
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONTRIBUTORS.map((person) => (
            <li key={person.name} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[15px] font-bold text-text">{person.name}</p>
              <p className="mt-1 text-[13px] text-text-muted">{person.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

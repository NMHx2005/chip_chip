import { getTranslations } from "next-intl/server";
import { CardReveal } from "@/components/motion";
import { Avatar } from "@/components/ui/Avatar";
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
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-text-muted">
          {t("description")}
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONTRIBUTORS.map((person, index) => (
            <li key={person.name} className="flex">
              <CardReveal index={index} columns={4} className="flex w-full">
                <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
                  <Avatar photo={null} alt="" name={person.name} />
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-text">
                      {person.name}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-text-muted">
                      {person.role}
                    </p>
                  </div>
                </div>
              </CardReveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { ECOSYSTEM_GROUPS } from "@/lib/constants";

type GroupId = (typeof ECOSYSTEM_GROUPS)[number]["id"];

// Equipment and OSAT span the full width; the three middle roles sit side by
// side, with IDM (design + manufacturing) outlined because it belongs to both
// of its neighbours.
const AREA: Record<GroupId, string> = {
  equipment: "md:col-span-3",
  foundries: "md:col-span-1",
  idm: "md:col-span-1 md:border-2 md:border-text/30",
  fabless: "md:col-span-1",
  osat: "md:col-span-3",
};

export async function EcosystemDiagram() {
  const t = await getTranslations("home.ecosystem");

  return (
    <section
      id="ecosystem"
      aria-label={t("headline")}
      className="px-5 pt-16 md:px-8 md:pt-24"
    >
      <div className="mx-auto w-full max-w-content">
        <SectionHeading
          namespace="home.ecosystem"
          titleKey="headline"
          descriptionKey="description"
        />

        <div className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3">
          {ECOSYSTEM_GROUPS.map((group) => (
            <div
              key={group.id}
              className={`rounded-2xl border border-black/[0.08] bg-white/70 p-5 ${AREA[group.id]}`}
            >
              <h3 className="text-lg font-extrabold tracking-[-0.01em] text-text">
                {t(`groups.${group.id}`)}
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                {t(`groupHints.${group.id}`)}
              </p>
              <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex h-8 items-center text-sm font-semibold text-text/80"
                  >
                    {item.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logo}
                        alt={item.name}
                        loading="lazy"
                        className="h-6 w-auto max-w-[7rem] object-contain"
                      />
                    ) : (
                      item.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-text-muted">
          {t("note")}
        </p>
      </div>
    </section>
  );
}

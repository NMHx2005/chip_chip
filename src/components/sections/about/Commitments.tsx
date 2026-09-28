import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, Ban, HandCoins, ShieldCheck, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

const ITEMS: { id: "free" | "noAds" | "noFees" | "noDataSale"; icon: LucideIcon }[] = [
  { id: "free", icon: BadgeCheck },
  { id: "noAds", icon: Ban },
  { id: "noFees", icon: HandCoins },
  { id: "noDataSale", icon: ShieldCheck },
];

export async function Commitments() {
  const t = await getTranslations("about.commitments");

  return (
    <section aria-labelledby="about-commitments" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h2
            id="about-commitments"
            className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
          >
            {t("headline")}
          </h2>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
            {t("description")}
          </p>
        </header>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ id, icon: Icon }) => (
            <li key={id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
              <Icon className="size-5 text-accent" strokeWidth={2} aria-hidden />
              <h3 className="text-[15px] font-bold leading-snug text-text">{t(`items.${id}.title`)}</h3>
              <p className="text-[13px] leading-relaxed text-text-muted">{t(`items.${id}.body`)}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/chinh-sach-bao-mat"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
        >
          {t("privacyLink")}
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

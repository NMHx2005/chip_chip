import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, Ban, HandCoins, ShieldCheck, type LucideIcon } from "lucide-react";
import { CardReveal } from "@/components/motion";
import { InfoCard } from "@/components/ui/InfoCard";
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
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
            {t("description")}
          </p>
        </header>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ id, icon }, index) => (
            <li key={id} className="flex">
              <CardReveal index={index} columns={4} className="flex w-full">
                <InfoCard icon={icon} title={t(`items.${id}.title`)}>
                  {t(`items.${id}.body`)}
                </InfoCard>
              </CardReveal>
            </li>
          ))}
        </ul>

        <Link
          href="/chinh-sach-bao-mat"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent underline underline-offset-4 transition-colors [@media(hover:hover)]:hover:text-black"
        >
          {t("privacyLink")}
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

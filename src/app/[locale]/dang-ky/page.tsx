import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  ClipboardList,
  HeartHandshake,
  Presentation,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { CardReveal } from "@/components/motion";
import { PageHero } from "@/components/sections/PageHero";
import { SIGNUP_TYPES, SIGNUP_TYPE_PATHS, type SignupType } from "@/components/signup/signup-kind";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

const ICON: Record<SignupType, LucideIcon> = {
  volunteer: HeartHandshake,
  survey: ClipboardList,
  webinar: Presentation,
  competition: Trophy,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signup" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/dang-ky", locale as Locale),
  };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("signup");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-content">
          <h2 className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]">
            {t("chooseHeading")}
          </h2>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {SIGNUP_TYPES.map((type, index) => {
              const Icon = ICON[type];
              return (
                <li key={type} className="flex">
                  <CardReveal index={index} columns={2} className="flex w-full">
                    <Link
                      href={SIGNUP_TYPE_PATHS[type]}
                      className="group flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-[border-color,box-shadow,transform] duration-card ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
                    >
                      <span
                        aria-hidden
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-accent"
                      >
                        <Icon className="size-5" strokeWidth={2} />
                      </span>
                      <h3 className="text-lg font-bold tracking-[-0.01em] text-text">
                        {t(`types.${type}`)}
                      </h3>
                      <p className="text-sm leading-relaxed text-text-muted">
                        {t(`typeHint.${type}`)}
                      </p>
                      <span
                        aria-hidden
                        className="mt-auto grid size-8 place-items-center rounded-full bg-surface-muted text-text transition-colors duration-card ease-standard [@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-white"
                      >
                        <ArrowRight className="size-4" strokeWidth={2} />
                      </span>
                    </Link>
                  </CardReveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Info, Mail, Share2, ShieldCheck } from "lucide-react";
import { InfoBlock } from "@/components/contact/InfoBlock";
import { MessageForm } from "@/components/contact/MessageForm";
import { PageHero } from "@/components/sections/PageHero";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/lien-he", locale as Locale),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([getTranslations("contact"), getTranslations("nav")]);
  // A blank href means the account does not exist yet — same rule as SocialLinks.
  const socials = SOCIAL_LINKS.filter((link) => link.href.length > 0);

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto grid w-full max-w-content gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
            <MessageForm variant="contact" />
          </div>

          <aside className="flex flex-col gap-4">
            {CONTACT_EMAIL && (
              <InfoBlock icon={Mail} title={t("aside.emailTitle")}>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex min-h-11 items-center font-mono text-sm text-text-nav underline underline-offset-4 transition-colors [@media(hover:hover)]:hover:text-accent"
                >
                  {CONTACT_EMAIL}
                </a>
              </InfoBlock>
            )}

            {socials.length > 0 && (
              <InfoBlock icon={Share2} title={t("aside.socialTitle")}>
                <ul className="flex flex-wrap gap-x-6">
                  {socials.map((link) => (
                    <li key={link.key}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center text-sm text-text-nav underline underline-offset-4 transition-colors [@media(hover:hover)]:hover:text-accent"
                      >
                        {tNav(link.key)}
                      </a>
                    </li>
                  ))}
                </ul>
              </InfoBlock>
            )}

            <InfoBlock icon={Clock} title={t("aside.responseTitle")}>
              <p className="text-sm leading-relaxed text-text-muted">{t("aside.responseBody")}</p>
            </InfoBlock>

            <InfoBlock icon={Info} title={t("aside.beforeSendTitle")}>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-bold text-text"
                >
                  3
                </span>
                <div>
                  <p className="text-sm leading-relaxed text-text-muted">{t("aside.limitNote")}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                    {t("aside.limitHint")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-hairline pt-3">
                <ShieldCheck aria-hidden className="size-5 shrink-0 text-accent" strokeWidth={2} />
                <div>
                  <p className="text-sm leading-relaxed text-text-muted">{t("aside.privacyNote")}</p>
                  <Link
                    href="/chinh-sach-bao-mat"
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4 transition-colors [@media(hover:hover)]:hover:text-black"
                  >
                    {t("aside.privacyLink")}
                  </Link>
                </div>
              </div>
            </InfoBlock>
          </aside>
        </div>
      </section>
    </>
  );
}

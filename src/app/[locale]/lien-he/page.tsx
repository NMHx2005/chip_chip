import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageForm } from "@/components/contact/MessageForm";
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
    <section className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto grid w-full max-w-content gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div>
          <header className="max-w-2xl">
            <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
              {t("title")}
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
              {t("description")}
            </p>
          </header>

          <div className="mt-10 rounded-3xl border border-border bg-surface p-6 md:p-8">
            <MessageForm variant="contact" />
          </div>
        </div>

        <aside className="flex flex-col gap-8 lg:pt-24">
          {CONTACT_EMAIL && (
            <div>
              <h2 className="text-sm font-semibold text-text">{t("aside.emailTitle")}</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-1 inline-flex min-h-11 items-center font-mono text-sm text-text-nav underline underline-offset-4 transition-colors hover:text-accent"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          )}

          {socials.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text">{t("aside.socialTitle")}</h2>
              <ul className="mt-1 flex flex-wrap gap-x-6">
                {socials.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-sm text-text-nav underline underline-offset-4 transition-colors hover:text-accent"
                    >
                      {tNav(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-text">{t("aside.responseTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("aside.responseBody")}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("aside.limitNote")}</p>
          </div>

          <div>
            <p className="text-sm leading-relaxed text-text-muted">{t("aside.privacyNote")}</p>
            <Link
              href="/chinh-sach-bao-mat"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4 transition-colors hover:text-black"
            >
              {t("aside.privacyLink")}
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

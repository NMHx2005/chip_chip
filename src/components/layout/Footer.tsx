import { useTranslations } from "next-intl";
import { Logo } from "@/components/layout/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL, NAV_ITEMS } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tMeta = useTranslations("meta");

  return (
    <footer className="cv-auto border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-content px-5 py-14 md:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Logo className="text-[22px]" />
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              {t("tagline")}
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t("explore")}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="text-sm text-text-nav transition-colors hover:text-accent"
                    >
                      {tNav(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t("connect")}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <Link
                    href="/gioi-thieu"
                    className="text-sm text-text-nav transition-colors hover:text-accent"
                  >
                    {tNav("join")}
                  </Link>
                </li>

                {CONTACT_EMAIL && (
                  <li>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-mono text-sm text-text-nav transition-colors hover:text-accent"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs text-text-muted">
            {t("copyright", { siteName: tMeta("siteName") })}
          </p>
        </div>
      </div>
    </footer>
  );
}

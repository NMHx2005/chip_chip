import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DocumentLang } from "@/components/layout/DocumentLang";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [t, messages, settings] = await Promise.all([
    getTranslations("nav"),
    getMessages(),
    // One read for the whole chrome: the navbar and the footer both show the
    // social icons, and both live below the client boundary.
    getSiteSettings(),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DocumentLang locale={locale} />

      <SmoothScroll>
        <a
          href="#main"
          className="sr-only rounded-full bg-primary px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000]"
        >
          {t("skipToContent")}
        </a>

        <Navbar socialLinks={settings.socialLinks} />

        <main id="main">{children}</main>

        <Footer socialLinks={settings.socialLinks} />
      </SmoothScroll>
    </NextIntlClientProvider>
  );
}

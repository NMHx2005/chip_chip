import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("siteName"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("description"),
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("siteName"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("siteName"),
      description: t("description"),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-[100dvh] bg-bg font-body text-text antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LessonsListing } from "@/components/lessons/LessonsListing";
import { permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { firstParam, type SearchParams } from "@/lib/listing-params";
import { localeAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lessons" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/bai-hoc", locale as Locale),
  };
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The old "Video" tab of this page is now a page of its own. A 301 in
  // next.config.mjs cannot match on the query string, so shared links to
  // `?tab=video` are moved on here instead.
  if (firstParam(searchParams.tab) === "video") {
    permanentRedirect({ href: "/video", locale: locale as Locale });
  }

  return <LessonsListing locale={locale as Locale} topic={null} searchParams={searchParams} />;
}

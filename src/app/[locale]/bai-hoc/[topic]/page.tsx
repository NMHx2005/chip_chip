import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LessonsListing } from "@/components/lessons/LessonsListing";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS } from "@/lib/constants";
import type { SearchParams } from "@/lib/listing-params";
import { localeAlternates } from "@/lib/seo";

type Params = Promise<{ locale: string; topic: string }>;

export const revalidate = 3600;

export function generateStaticParams() {
  return TOPIC_IDS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, topic } = await params;
  const topicId = TOPIC_IDS.find((id) => id === topic);
  if (!topicId) return {};

  const t = await getTranslations({ locale, namespace: "topics" });
  return {
    title: t(`${topicId}.title`),
    description: t(`${topicId}.description`),
    // Each topic page is its own canonical URL, never `/bai-hoc`.
    alternates: localeAlternates(
      { pathname: "/bai-hoc/[topic]", params: { topic: topicId } },
      locale as Locale
    ),
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, topic } = await params;
  setRequestLocale(locale);

  const topicId = TOPIC_IDS.find((id) => id === topic);
  if (!topicId) notFound();

  return <LessonsListing locale={locale as Locale} topic={topicId} searchParams={searchParams} />;
}

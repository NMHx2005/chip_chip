import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CountryBands } from "@/components/sections/CountryBands";
import { Hero } from "@/components/sections/Hero";
import { JoinCta } from "@/components/sections/JoinCta";
import { LatestPosts } from "@/components/sections/LatestPosts";
import { LessonTopics } from "@/components/sections/LessonTopics";
import { SimpleStart } from "@/components/sections/SimpleStart";
import { VideoReveal } from "@/components/sections/VideoReveal";
import { countLessonsByTopic, getLatestPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

// Rebuilt on demand when staff publish; the hourly fallback covers edits made
// directly in the database.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: { absolute: t("siteName") },
    description: t("description"),
    alternates: localeAlternates("/", locale as Locale),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [posts, topicCounts] = await Promise.all([
    getLatestPosts(locale as Locale, 3),
    countLessonsByTopic(locale as Locale),
  ]);

  return (
    <>
      <Hero />
      <VideoReveal />
      <SimpleStart />
      <LessonTopics counts={topicCounts} />
      <CountryBands />
      <LatestPosts posts={posts} />
      <JoinCta />
    </>
  );
}

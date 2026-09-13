import { getTranslations } from "next-intl/server";
import { getPostBySlug } from "@/lib/queries/posts";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/render";
import type { Locale } from "@/i18n/routing";

export const alt = "";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function ForumPostOpenGraphImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const [post, t] = await Promise.all([
    getPostBySlug(params.locale as Locale, params.slug, "forum"),
    getTranslations({ locale: params.locale, namespace: "forum" }),
  ]);

  return renderOgCard({
    eyebrow: t("title"),
    title: post?.title ?? t("notFound"),
  });
}

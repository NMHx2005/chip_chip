import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/render";

export const alt = "";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function LessonsOpenGraphImage({ params }: { params: { locale: string } }) {
  const [tMeta, t] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "meta" }),
    getTranslations({ locale: params.locale, namespace: "lessons" }),
  ]);

  return renderOgCard({ eyebrow: tMeta("siteName"), title: t("title") });
}

import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/render";

export const alt = "Project Chíp Chíp";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

/**
 * Default share card, per locale.
 *
 * Lives under `[locale]` rather than at the app root so `/en` gets an English
 * card — a root-level route cannot see the active locale and would always
 * render the default one.
 */
export default async function SiteOpenGraphImage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "meta" });

  return renderOgCard({
    eyebrow: t("tagline"),
    title: t("siteName"),
  });
}

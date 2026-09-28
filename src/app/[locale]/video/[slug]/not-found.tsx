import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** Rendered when a video slug does not resolve to a published video. */
export default async function VideoNotFound() {
  const t = await getTranslations("videos");

  return (
    <section className="px-5 py-24 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">404</p>
        <h1 className="mt-4 text-balance text-[26px] font-extrabold tracking-[-0.02em] text-text md:text-[34px]">
          {t("notFound")}
        </h1>

        <Link
          href="/video"
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToVideos")}
        </Link>
      </div>
    </section>
  );
}

import { useTranslations } from "next-intl";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { INTRO_VIDEO_SRC } from "@/lib/constants";

export function VideoReveal() {
  const t = useTranslations("home.hero");

  return (
    <section className="px-5 pb-4 md:px-8">
      <div className="mx-auto w-full max-w-content">
        <figure className="m-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-primary shadow-card md:rounded-3xl">
            {INTRO_VIDEO_SRC ? (
              <AutoplayVideo
                src={INTRO_VIDEO_SRC}
                ariaLabel={t("videoAriaLabel")}
                objectPosition="center"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-brand-gradient px-6 text-center">
                <svg
                  viewBox="0 0 24 24"
                  className="size-12 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" />
                </svg>
                <p className="max-w-sm text-sm text-white/80">
                  {t("videoCaption")}
                </p>
              </div>
            )}
          </div>

          <figcaption className="mx-auto mt-4 max-w-2xl text-center text-sm text-text-muted">
            {t("videoCaption")}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

import { ArrowUpRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { CircularText } from "@/components/ui/CircularText";
import { CONTACT_EMAIL, JOIN_FORM_URL } from "@/lib/constants";

export function JoinCta() {
  const t = useTranslations("home.join");

  return (
    <section
      id="join"
      aria-label={t("headline")}
      className="cv-auto px-5 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center md:px-16 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.5), transparent 55%), radial-gradient(circle at 85% 100%, rgba(255,255,255,0.35), transparent 50%)",
            }}
          />

          {/* Rotating badge — decorative, hidden from assistive tech and from
              anything narrower than a desktop. At tablet width the card is not
              wide enough and the ring cuts straight through the headline. */}
          <CircularText
            text={t("badge")}
            diameter={190}
            fontSize={13}
            letterSpacing={0.16}
            durationSeconds={26}
            className="absolute -right-6 -top-6 hidden text-white/45 lg:block"
          />

          <div className="relative flex flex-col items-center">
            <h2 className="max-w-2xl text-balance text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[34px] md:text-[42px]">
              {t("headline")}
            </h2>

            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 md:text-base">
              {t("description")}
            </p>

            {/* Until the form exists there is nothing to click. A disabled pill
                still reads as a button and invites a tap that does nothing, so
                the pending state is plain text instead. */}
            {JOIN_FORM_URL ? (
              <>
                <div className="mt-9">
                  <a
                    href={JOIN_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[52px] items-center gap-2 rounded-3xl bg-white px-6 text-base font-semibold text-accent transition-transform duration-200 hover:scale-[1.02]"
                  >
                    {t("formCta")}
                    <ArrowUpRight className="size-[18px]" strokeWidth={2.2} />
                  </a>
                </div>
                <p className="mt-4 text-xs text-white/85">{t("formNote")}</p>
              </>
            ) : (
              <p className="mt-9 inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/40 px-5 py-3 text-sm text-white/90">
                <Clock className="size-4 shrink-0" strokeWidth={2} />
                {t("formPending")}
              </p>
            )}

            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 font-mono text-xs text-white/75 underline underline-offset-4 transition-colors hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

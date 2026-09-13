import { useTranslations } from "next-intl";
import { PillButton } from "@/components/ui/PillButton";

function Badge({ label, tone }: { label: string; tone: "blue" | "purple" }) {
  const styles =
    tone === "blue"
      ? "border-brand-blue-200 bg-brand-blue-50 text-brand-blue-600"
      : "border-border bg-surface-muted text-accent";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${styles}`}
    >
      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
        <path
          d="M6 0c.4 3.1 2.9 5.6 6 6-3.1.4-5.6 2.9-6 6-.4-3.1-2.9-5.6-6-6 3.1-.4 5.6-2.9 6-6Z"
          fill="currentColor"
        />
      </svg>
      {label}
    </span>
  );
}

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
      {/* Soft brand wash behind the headline — no imagery, per the brief. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[860px] max-w-[140vw] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(155,102,245,0.22), rgba(43,47,168,0.08) 60%, transparent)",
        }}
      />

      <div className="mx-auto flex w-full max-w-content flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge label={t("badge1")} tone="blue" />
          <Badge label={t("badge2")} tone="purple" />
        </div>

        <h1 className="mt-6 max-w-4xl text-balance text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-text sm:text-[44px] md:text-[56px] lg:text-[64px]">
          {t("headlinePart1")}{" "}
          <span className="text-gradient-brand">{t("headlinePart2")}</span>
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-text-muted md:text-lg">
          {t("description")}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <PillButton href="/bai-hoc" size="lg" className="px-6">
            {t("ctaPrimary")}
          </PillButton>
          <PillButton href="/gioi-thieu" variant="outline" size="lg">
            {t("ctaSecondary")}
          </PillButton>
        </div>
      </div>
    </section>
  );
}

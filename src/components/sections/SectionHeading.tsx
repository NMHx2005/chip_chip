import { useTranslations } from "next-intl";

export function SectionHeading({
  titleKey,
  descriptionKey,
  namespace = "home",
  align = "left",
  className,
}: {
  titleKey: string;
  descriptionKey: string;
  namespace?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const t = useTranslations(namespace);

  return (
    <div
      className={[
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        className ?? "",
      ].join(" ")}
    >
      <h2 className="max-w-3xl text-balance text-[26px] font-extrabold leading-[1.18] tracking-[-0.02em] text-text sm:text-[32px] md:text-[38px]">
        {t(titleKey)}
      </h2>
      <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
        {t(descriptionKey)}
      </p>
    </div>
  );
}

import { useTranslations } from "next-intl";
import { Logo } from "@/components/layout/Logo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { Link } from "@/i18n/navigation";

/**
 * Single-row footer: wordmark left, copyright in the middle, social icons
 * right — one row from `md` up, stacked on phones.
 *
 * The two link columns this used to carry ("Khám phá" / "Kết nối") are gone on
 * purpose. The full navigation now sits inside the join block directly above
 * this one (JoinCta.tsx), which is the last thing a reader passes on the page.
 *
 * `relative z-20` is load-bearing, not decoration. The homepage paints a
 * full-viewport `SceneFillOverlay` at `z-[15]` that grows to `circle(150%)` as
 * the reader passes the last section — and this footer sits outside
 * `MainSection`, which is what normally lifts the lower half above that
 * overlay. Without its own stacking level the footer is painted underneath and
 * simply does not appear, which is exactly how it was reported: "there is no
 * footer". Keep it level with `MainSection` (`z-20`), not below it.
 */
export function Footer() {
  const t = useTranslations("footer");
  const tMeta = useTranslations("meta");

  return (
    <footer className="cv-auto relative z-20 border-t border-border bg-surface">
      {/*
        `1fr auto 1fr` rather than a flex row with `justify-between`: the middle
        column is centred against the page, so the copyright stays in the middle
        whether or not the social icons exist. `SocialLinks` renders nothing
        until the real accounts are filled in, and with flex that empty right
        side dragged the copyright off-centre.

        Below `md` the grid collapses to one column and the wrapper stays a row,
        which is what puts the icons opposite the wordmark on a phone.
      */}
      <div className="mx-auto grid w-full max-w-content gap-6 px-5 py-12 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8 md:px-8">
        <div className="flex items-center justify-between md:contents">
          <Link
            href="/"
            className="shrink-0 md:col-start-1 md:row-start-1 md:justify-self-start"
            aria-label={tMeta("siteName")}
          >
            <Logo className="text-[19px] md:text-[22px]" />
          </Link>

          <SocialLinks className="md:col-start-3 md:row-start-1 md:justify-self-end" />
        </div>

        <p className="max-w-xs text-center text-xs leading-relaxed text-text-muted md:col-start-2 md:row-start-1 md:max-w-md md:text-sm">
          {t("copyright", { siteName: tMeta("siteName") })}
        </p>
      </div>
    </footer>
  );
}

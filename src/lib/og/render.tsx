import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFonts } from "@/lib/og/fonts";

/**
 * Shared Open Graph card.
 *
 * Satori (behind ImageResponse) supports only a subset of CSS and requires an
 * explicit `display: flex` on any element with more than one child — the
 * inline styles below are constrained by that, not by the site's Tailwind
 * setup, so they deliberately do not use classes.
 */
export function renderOgCard({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const fonts = loadOgFonts();
  const displayTitle =
    title.length > 110 ? `${title.slice(0, 110).trimEnd()}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 76px",
          background:
            "linear-gradient(131deg, rgb(51, 51, 51) 0.79%, rgb(13, 13, 13) 35.22%, rgb(38, 38, 38) 99.16%)",
          fontFamily: "Be Vietnam Pro",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 3,
              background: "rgba(255,255,255,0.5)",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: displayTitle.length > 60 ? 62 : 78,
            fontWeight: 700,
            lineHeight: 1.16,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          {displayTitle}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 26,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <div style={{ display: "flex" }}>{SITE_HOST}</div>
          <div style={{ display: "flex", fontWeight: 700 }}>CHÍP CHÍP</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
      // `next/og`'s default is `public, immutable, max-age=31536000`, but the
      // card is generated from the article title, so an edited title must be
      // able to invalidate the cached image instead of being stuck forever.
      headers: { "cache-control": "public, max-age=3600, must-revalidate" },
    }
  );
}

export { OG_CONTENT_TYPE, OG_SIZE };

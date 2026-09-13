import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fonts for Open Graph images.
 *
 * Satori (behind next/og) cannot consume WOFF2, so the TTFs are committed
 * under `src/assets/fonts` and read from disk. `outputFileTracingIncludes` in
 * next.config.mjs keeps them in the deployment bundle — without that they are
 * present in dev but missing on Vercel.
 *
 * Be Vietnam Pro is used because the titles are Vietnamese and a Latin-only
 * face would render the diacritics as missing glyphs.
 */
const FONT_DIR = join(process.cwd(), "src", "assets", "fonts");

let cached: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null =
  null;

export function loadOgFonts() {
  if (cached) return cached;

  cached = [
    {
      name: "Be Vietnam Pro",
      data: readFileSync(join(FONT_DIR, "BeVietnamPro-Regular.ttf")),
      weight: 400,
      style: "normal",
    },
    {
      name: "Be Vietnam Pro",
      data: readFileSync(join(FONT_DIR, "BeVietnamPro-Bold.ttf")),
      weight: 700,
      style: "normal",
    },
  ];

  return cached;
}

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

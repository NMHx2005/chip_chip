import type { StaticPathname } from "@/i18n/routing";
import { COUNTRY_CLIPS } from "@/lib/country-clips";

// Hrefs use the internal (default-locale) pathname keys defined in
// `i18n/routing.ts`; next-intl resolves the localized URL for each locale.

export const NAV_ITEMS: {
  key: "home" | "lessons" | "forum" | "about";
  href: StaticPathname;
}[] = [
  { key: "home", href: "/" },
  { key: "lessons", href: "/bai-hoc" },
  { key: "forum", href: "/blog" },
  { key: "about", href: "/gioi-thieu" },
];

/** The trust pages linked from every footer. */
export const FOOTER_LINKS: {
  key: "contact" | "contribute" | "privacy";
  href: StaticPathname;
}[] = [
  { key: "contact", href: "/lien-he" },
  { key: "contribute", href: "/dong-gop" },
  { key: "privacy", href: "/chinh-sach-bao-mat" },
];

/** The two entries under "Lessons" in the navbar. */
export const LESSON_SUBNAV: {
  key: "lessonsTheory" | "lessonsVideo";
  href: StaticPathname;
}[] = [
  { key: "lessonsTheory", href: "/bai-hoc" },
  { key: "lessonsVideo", href: "/video" },
];

export const TOPIC_IDS = [
  "dinh-nghia",
  "nguyen-ly",
  "ung-dung",
  "lich-su",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

/**
 * Neutral grayscale, not saturated pastel: the four topics are told apart by
 * shade (darkest to lightest), never by hue. `text` on `soft` is checked at
 * >= 4.5:1 (WCAG AA) for every entry — see the Task 1 report for the numbers.
 */
export const TOPIC_TONE: Record<
  TopicId,
  { bg: string; soft: string; text: string }
> = {
  "dinh-nghia": { bg: "#4A4A4A", soft: "#E6E6E6", text: "#262626" },
  "nguyen-ly": { bg: "#6B6B6B", soft: "#EAEAEA", text: "#262626" },
  "ung-dung": { bg: "#8C8C8C", soft: "#EEEEEE", text: "#262626" },
  "lich-su": { bg: "#AEAEAE", soft: "#F2F2F2", text: "#262626" },
};

/**
 * Preview clip shown beside the topic accordion on the homepage, one per
 * topic, swapped as the reader opens a different row.
 *
 * PLACEHOLDERS, same caveat as HOME_VIDEO: these are clips borrowed from the
 * Strike Robot project so the column can be reviewed at all. Replace with four
 * semiconductor clips before launch.
 */
export const TOPIC_VIDEOS: Record<TopicId, string> = {
  "dinh-nghia": "/video/clip-1.mp4",
  "nguyen-ly": "/video/clip-2.mp4",
  "ung-dung": "/video/clip-3.mp4",
  "lich-su": "/video/clip-4.mp4",
};

/** Placeholder until the real Facebook and TikTok pages exist. A blank href
 *  hides the icon entirely, so the site can ship before the pages are made. */
export const SOCIAL_LINKS: {
  key: "facebook" | "tiktok";
  href: string;
}[] = [
  { key: "facebook", href: "" },
  { key: "tiktok", href: "" },
];

/** Public contact address, shown in the homepage join block and on the
 *  Contact page once the mailbox exists. Blank hides it everywhere. */
export const CONTACT_EMAIL = "";

/** Date the privacy page was last checked against the code (YYYY-MM-DD). */
export const PRIVACY_UPDATED = "2026-09-28";

export type CountryId = keyof typeof COUNTRY_CLIPS;
export type CountryCompany = { name: string; logo: string | null; href: string };

// Bands are told apart by shade, never by hue (same rule as TOPIC_TONE above).
// Text sits on `tone` at >= 4.5:1 in every case. `logo: null` renders the name
// as text: Micron's logo is not in the shared drive yet.
export const COUNTRY_BANDS = [
  {
    id: "usa",
    labelKey: "usa",
    tone: "#CDCDCD",
    flag: "/countries/usa-flag.webp",
    map: "/countries/usa-map.svg",
    companies: [
      { name: "NVIDIA", logo: "/logos/nvidia.webp", href: "https://www.nvidia.com" },
      { name: "Broadcom", logo: "/logos/broadcom.webp", href: "https://www.broadcom.com" },
      { name: "AMD", logo: "/logos/amd.png", href: "https://www.amd.com" },
      { name: "Micron", logo: null, href: "https://www.micron.com" },
      { name: "Qualcomm", logo: "/logos/qualcomm.webp", href: "https://www.qualcomm.com" },
      { name: "Intel", logo: "/logos/intel.png", href: "https://www.intel.com" },
    ],
    clip: COUNTRY_CLIPS.usa,
  },
  {
    id: "taiwan",
    labelKey: "taiwan",
    tone: "#D3D3D3",
    flag: "/countries/taiwan-flag.webp",
    map: "/countries/taiwan-map.png",
    companies: [{ name: "TSMC", logo: "/logos/tsmc.webp", href: "https://www.tsmc.com" }],
    clip: COUNTRY_CLIPS.taiwan,
  },
  {
    id: "china",
    labelKey: "china",
    tone: "#DADADA",
    flag: "/countries/china-flag.webp",
    map: "/countries/china-map.webp",
    companies: [{ name: "SMIC", logo: "/logos/smic.webp", href: "https://www.smics.com" }],
    clip: COUNTRY_CLIPS.china,
  },
  {
    id: "south-korea",
    labelKey: "south-korea",
    tone: "#E3E3E3",
    flag: "/countries/south-korea-flag.webp",
    map: "/countries/south-korea-map.svg",
    companies: [
      { name: "Samsung", logo: "/logos/samsung.svg", href: "https://www.samsung.com" },
      { name: "SK hynix", logo: "/logos/sk-hynix.webp", href: "https://www.skhynix.com" },
    ],
    clip: COUNTRY_CLIPS["south-korea"],
  },
  {
    id: "netherlands",
    labelKey: "netherlands",
    tone: "#EEEEEE",
    flag: "/countries/netherlands-flag.webp",
    map: "/countries/netherlands-map.webp",
    companies: [{ name: "ASML", logo: "/logos/asml.webp", href: "https://www.asml.com" }],
    clip: COUNTRY_CLIPS.netherlands,
  },
] as const satisfies readonly {
  id: CountryId;
  labelKey: CountryId;
  tone: string;
  flag: string;
  map: string;
  companies: readonly CountryCompany[];
  clip: (typeof COUNTRY_CLIPS)[CountryId];
}[];

export type CountryBand = (typeof COUNTRY_BANDS)[number];

/**
 * Roles in the chip supply chain, for the Ecosystem diagram. Names without a
 * logo file are drawn as text.
 */
export const ECOSYSTEM_GROUPS = [
  {
    id: "equipment",
    items: [
      { name: "ASML", logo: "/logos/asml.webp" },
      { name: "Applied Materials", logo: null },
      { name: "Lam Research", logo: null },
      { name: "KLA", logo: null },
      { name: "Tokyo Electron", logo: null },
      { name: "Axcelis", logo: null },
      { name: "ChipMOS", logo: null },
    ],
  },
  {
    id: "foundries",
    items: [
      { name: "TSMC", logo: "/logos/tsmc.webp" },
      { name: "GlobalFoundries", logo: "/logos/globalfoundries.webp" },
      { name: "Texas Instruments", logo: "/logos/texas-instruments.webp" },
      { name: "SMIC", logo: "/logos/smic.webp" },
      { name: "UMC", logo: "/logos/umc.webp" },
    ],
  },
  {
    id: "idm",
    items: [
      { name: "Intel", logo: "/logos/intel.png" },
      { name: "Samsung", logo: "/logos/samsung.svg" },
    ],
  },
  {
    id: "fabless",
    items: [
      { name: "NVIDIA", logo: "/logos/nvidia.webp" },
      { name: "Apple", logo: "/logos/apple.png" },
      { name: "Qualcomm", logo: "/logos/qualcomm.webp" },
      { name: "Broadcom", logo: "/logos/broadcom.webp" },
      { name: "AMD", logo: "/logos/amd.png" },
    ],
  },
  {
    id: "osat",
    items: [
      { name: "Amkor", logo: null },
      { name: "ASE", logo: null },
      { name: "SPIL", logo: null },
    ],
  },
] as const;

export const PAGE_SIZE = 9;

/**
 * The author shown on the About page. PLACEHOLDER until DA5: the name and
 * story live in `about.author.*` in the message files; `photo` is a path
 * under `public/` (or null, which draws neutral initials instead).
 */
export const AUTHOR: { photo: string | null } = { photo: null };

/**
 * People credited under "People who helped" on the About page. The section is
 * hidden while this is empty. `role` is shown as written, in both languages.
 */
export const CONTRIBUTORS: { name: string; role: string }[] = [];


/**
 * Homepage intro clip — the one that stands up as the reader scrolls to it.
 *
 * PLACEHOLDER borrowed from the Strike Robot project so the motion can be
 * reviewed. Replace with the 30s cut of "The Closest Thing We Have to Alien
 * Technology", ending where the narration reaches "the smaller the transistor,
 * the faster the computation". Self-hosted mp4 rather than a YouTube embed: an
 * iframe cannot be muted-autoplayed reliably and cannot be rotated in 3D.
 */
export const HOME_VIDEO = "/video/intro-placeholder.mp4";

/** Credit line under the intro clip. Empty until a real clip is in place. */
export const HOME_VIDEO_CREDIT: { label: string; href: string } | null = null;

/**
 * Six clips for the homepage carousel. PLACEHOLDERS, same caveat as above.
 * `topicKey` indexes `home.videos.topics` in the message files.
 */
export const CAROUSEL_VIDEOS = [
  { id: "c1", src: "/video/clip-1.mp4", topicKey: "basics" },
  { id: "c2", src: "/video/clip-2.mp4", topicKey: "transistor" },
  { id: "c3", src: "/video/clip-3.mp4", topicKey: "fabrication" },
  { id: "c4", src: "/video/clip-4.mp4", topicKey: "industry" },
  { id: "c5", src: "/video/clip-5.mp4", topicKey: "careers" },
  { id: "c6", src: "/video/clip-6.mp4", topicKey: "history" },
] as const;

/** Sticky backdrop behind the upper half of the homepage. */
export const HERO_BACKDROP = "/hero-backdrop.svg";

/**
 * Full-bleed backdrop of the homepage join block.
 *
 * PLACEHOLDER: a neutral dark texture generated on purpose rather than a photo,
 * because no real asset exists yet — swapping in the real image is a one-line
 * change here. Kept dark enough that white copy on top stays at 13.97:1, so
 * replacing it with a lighter photograph means re-checking that contrast.
 */
export const CTA_BACKDROP = "/cta-backdrop.png";

/**
 * Image beside the heading on the About page.
 *
 * PLACEHOLDER: a wafer-die grid drawn on purpose, because the mascot artwork
 * does not exist yet. Swap the file for the transparent-background mascot when
 * it arrives — the frame is a plain rounded box, so a transparent PNG drops
 * straight in.
 */
export const ABOUT_BANNER = "/about-banner.png";


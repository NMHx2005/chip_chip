import type { StaticPathname } from "@/i18n/routing";

// Hrefs use the internal (default-locale) pathname keys defined in
// `i18n/routing.ts`; next-intl resolves the localized URL for each locale.

export const NAV_ITEMS: {
  key: "home" | "lessons" | "forum" | "about";
  href: StaticPathname;
}[] = [
  { key: "home", href: "/" },
  { key: "lessons", href: "/bai-hoc" },
  { key: "forum", href: "/dien-dan" },
  { key: "about", href: "/gioi-thieu" },
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

/** Google Form for member sign-up. Swap in the real form URL (the `viewform`
 *  link, not the `edit` link) once it exists. */
export const JOIN_FORM_URL = "";

/** Public contact address, shown in the homepage join block once the mailbox
 *  exists. The footer is a single row and has no place for it. */
export const CONTACT_EMAIL = "";

// Same neutral-grayscale rule as TOPIC_TONE above: the four bands are told
// apart by shade, never by hue (the earlier pastel/hex-per-country look read
// as unprofessional). Text sits on `tone` at >= 4.5:1 in every case.
export const COUNTRY_BANDS = [
  {
    id: "usa",
    labelKey: "usa",
    tone: "#CDCDCD",
    /**
     * Company logos live in `public/logos/`. `logo: null` renders the name as
     * text, so the band stays correct before the files arrive.
     */
    companies: [
      { name: "NVIDIA", logo: null },
      { name: "Broadcom", logo: null },
      { name: "AMD", logo: null },
      { name: "Micron", logo: null },
      { name: "Qualcomm", logo: null },
      { name: "Intel", logo: null },
    ],
  },
  {
    id: "taiwan",
    labelKey: "taiwan",
    tone: "#D8D8D8",
    companies: [{ name: "TSMC", logo: null }],
  },
  {
    id: "netherlands",
    labelKey: "netherlands",
    tone: "#E3E3E3",
    companies: [{ name: "ASML", logo: null }],
  },
  {
    id: "south-korea",
    labelKey: "south-korea",
    tone: "#EEEEEE",
    companies: [
      { name: "Samsung", logo: null },
      { name: "SK hynix", logo: null },
    ],
  },
] as const;

export type CountryBand = (typeof COUNTRY_BANDS)[number];

export const PAGE_SIZE = 9;

/**
 * Organisational units from the project plan.
 *
 * Only the structure lives here — names and descriptions are translated, and
 * individual member profiles are added once the team supplies photos and bios.
 */
export const TEAM_UNITS = [
  { id: "leadership", headcount: "02" },
  { id: "advisor", headcount: "01" },
  { id: "academic", headcount: "03" },
  { id: "technology", headcount: "01" },
  { id: "communications", headcount: "03" },
  { id: "finance", headcount: "02" },
  { id: "people", headcount: "03" },
  { id: "ambassador", headcount: "10–20" },
] as const;

export type TeamUnitId = (typeof TEAM_UNITS)[number]["id"];


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


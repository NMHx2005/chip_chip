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

export const TOPIC_TONE: Record<
  TopicId,
  { bg: string; soft: string; text: string }
> = {
  "dinh-nghia": { bg: "#F7B8C8", soft: "#FDE8EE", text: "#7A1F3D" },
  "nguyen-ly": { bg: "#F7E08C", soft: "#FEF6D9", text: "#6B4E00" },
  "ung-dung": { bg: "#A8E0BE", soft: "#E4F7EC", text: "#14512F" },
  "lich-su": { bg: "#A9D4F5", soft: "#E3F1FC", text: "#134A73" },
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

/** Public contact address, shown in the footer once the mailbox exists. */
export const CONTACT_EMAIL = "";

export const COUNTRY_BANDS = [
  {
    id: "usa",
    labelKey: "usa",
    tone: "#F9CFE0",
    companies: ["NVIDIA", "Broadcom", "AMD", "Micron", "Qualcomm", "Intel"],
  },
  {
    id: "taiwan",
    labelKey: "taiwan",
    tone: "#FBE9A8",
    companies: ["TSMC"],
  },
  {
    id: "netherlands",
    labelKey: "netherlands",
    tone: "#BEE6CC",
    companies: ["ASML"],
  },
  {
    id: "south-korea",
    labelKey: "south-korea",
    tone: "#B9DCF7",
    companies: ["Samsung", "SK hynix"],
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
export const HERO_BACKDROP = "/motion-gallery-backdrop.svg";


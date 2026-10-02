import { CONTACT_EMAIL, PRIVACY_UPDATED, SOCIAL_LINKS } from "@/lib/constants";
import { routing, type Locale } from "@/i18n/routing";

export type SocialKey = "facebook" | "tiktok";

export type SocialLink = { key: SocialKey; href: string };

export type SiteSettings = {
  contactEmail: string;
  socialLinks: SocialLink[];
  /** Per-locale reply note; a missing locale falls back to the message copy. */
  responseTime: Partial<Record<Locale, string>>;
  /** YYYY-MM-DD. */
  privacyUpdated: string;
};

/** What the site shows when a setting is absent or unreadable. */
export const DEFAULT_SETTINGS: SiteSettings = {
  contactEmail: CONTACT_EMAIL,
  socialLinks: SOCIAL_LINKS,
  responseTime: {},
  privacyUpdated: PRIVACY_UPDATED,
};

const SOCIAL_KEYS: readonly SocialKey[] = ["facebook", "tiktok"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS = /^https:\/\//i;

/**
 * Whether a string is a real `YYYY-MM-DD` date.
 *
 * The shape alone is not enough: `2026-13-45` matches the pattern, and the
 * privacy page formats the value with `Intl.DateTimeFormat`, which throws on
 * such a date — turning a stored value into a 500 for every visitor.
 */
export function isValidCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * A social link, if it is safe to render.
 *
 * The rule is enforced again on the way out (not only where it is saved): the
 * value becomes an `<a href>` on public pages, and the table can also be
 * written by hand.
 */
function socialHref(value: unknown, key: SocialKey): string {
  if (!Array.isArray(value)) return "";
  const entry = value.find(
    (item) => item && typeof item === "object" && (item as { key?: unknown }).key === key
  );
  const href = entry ? (entry as { href?: unknown }).href : null;
  if (typeof href !== "string") return "";

  const trimmed = href.trim().slice(0, 300);
  // Anything that is not https — `javascript:`, `data:`, plain http — is
  // dropped rather than rendered.
  return HTTPS.test(trimmed) ? trimmed : "";
}

function responseTime(value: unknown): Partial<Record<Locale, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const out: Partial<Record<Locale, string>> = {};

  for (const locale of routing.locales) {
    const text = source[locale];
    if (typeof text === "string" && text.trim()) out[locale] = text.trim();
  }
  return out;
}

/**
 * Turns stored rows into settings, falling back per key.
 *
 * Pure on purpose: a malformed or missing value must never break a public page,
 * so every field is validated here and the defaults from `constants.ts` fill
 * the gaps — which is also what the site shows before the maintainer has
 * touched the settings screen at all.
 */
export function readSettings(
  rows: readonly { key: string; value: unknown }[] | null
): SiteSettings {
  const stored = new Map((rows ?? []).map((row) => [row.key, row.value]));

  const email = stored.get("contact_email");
  const socials = stored.get("social_links");
  const reply = stored.get("response_time");
  const privacy = stored.get("privacy_updated");

  const storedEmail = typeof email === "string" ? email.trim().slice(0, 254) : null;
  const storedPrivacy = typeof privacy === "string" ? privacy.trim() : "";

  return {
    // A row that exists and is empty means "cleared" — the admin's way of
    // hiding the address — so only a missing row falls back to the default.
    contactEmail: storedEmail ?? DEFAULT_SETTINGS.contactEmail,
    // Always both known keys in the same order, so the icons keep their mapping.
    socialLinks: SOCIAL_KEYS.map((key) => ({ key, href: socialHref(socials, key) })),
    responseTime: responseTime(reply),
    // A page cannot render an empty date, so a blank or unreadable one keeps
    // the code default rather than blanking the privacy page.
    privacyUpdated: isValidCalendarDate(storedPrivacy)
      ? storedPrivacy
      : DEFAULT_SETTINGS.privacyUpdated,
  };
}

// Reading the settings from the database lives in `lib/queries/site-settings.ts`:
// it needs the server client, while everything above is pure and is also used
// by the admin form and by client components.

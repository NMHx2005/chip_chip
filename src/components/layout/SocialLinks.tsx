import { useTranslations } from "next-intl";
import type { SocialLink } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

const ICON_PATHS: Record<"facebook" | "tiktok", React.ReactNode> = {
  facebook: (
    <path d="M17 2h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" />
  ),
  tiktok: (
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.83-2.48V9.77a5.68 5.68 0 1 0 4.92 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
  ),
};

/**
 * The social icons.
 *
 * The links arrive as a prop rather than being read here: this component sits
 * inside the client navbar (and inside the server footer), and the settings
 * come from the database, which only a server component can reach.
 */
export function SocialLinks({
  links,
  className,
  iconClassName,
  variant = "light",
}: {
  links: SocialLink[];
  className?: string;
  iconClassName?: string;
  variant?: "light" | "dark";
}) {
  const t = useTranslations("nav");

  // A blank href means the page does not exist yet — hide the icon rather than
  // linking nowhere.
  const shown = links.filter((link) => link.href.length > 0);

  if (shown.length === 0) return null;

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {shown.map((link) => (
        <li key={link.key}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(link.key)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors",
              variant === "dark"
                ? "text-white/70 [@media(hover:hover)]:hover:bg-white/10 [@media(hover:hover)]:hover:text-white"
                : "text-text-muted [@media(hover:hover)]:hover:bg-surface-muted [@media(hover:hover)]:hover:text-accent"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={cn("size-[18px]", iconClassName)}
              aria-hidden="true"
            >
              {ICON_PATHS[link.key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

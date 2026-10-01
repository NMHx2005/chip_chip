"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The trust-page links in the footer. A client component only because it has
 * to know the current page: that link is marked `aria-current` and set in a
 * heavier weight. Each link is a 44px-tall target.
 */
export function FooterNav({
  label,
  links,
}: {
  label: string;
  links: { key: string; href: StaticPathname; text: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap justify-center gap-x-5">
        {links.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.key}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center text-sm underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-accent [@media(hover:hover)]:hover:underline",
                  current ? "font-semibold text-text" : "font-medium text-text-nav"
                )}
              >
                {link.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

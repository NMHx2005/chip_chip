"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Tổng quan", exact: true },
  { href: "/admin/bai-viet", label: "Bài viết" },
  { href: "/admin/comments", label: "Bình luận" },
  { href: "/admin/tin-nhan", label: "Tin nhắn" },
  { href: "/admin/thu-vien", label: "Thư viện ảnh" },
  { href: "/admin/cai-dat", label: "Cài đặt" },
  // Only admins may hand out access, so only they get the link; the page and
  // the action check it again.
  { href: "/admin/nguoi-dung", label: "Nhân sự", adminOnly: true },
];

/**
 * Counts worth showing on a tab, e.g. waiting messages. A missing or zero entry
 * shows nothing, so the nav stays quiet when there is nothing to do.
 */
export type NavBadges = Record<string, number>;

export function AdminNav({
  badges = {},
  isAdmin = false,
}: {
  badges?: NavBadges;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
      {ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const count = badges[item.href] ?? 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            // The badge is decoration; the count is read as part of the link's
            // name, otherwise a screen reader runs the two together.
            aria-label={count > 0 ? `${item.label}, ${count} mục cần xử lý` : undefined}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors",
              active
                ? "border-border text-accent"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            {item.label}
            {count > 0 && (
              <span
                aria-hidden
                className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white"
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

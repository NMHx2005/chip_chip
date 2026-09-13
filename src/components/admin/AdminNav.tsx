"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Tổng quan", exact: true },
  { href: "/admin/bai-viet", label: "Bài viết" },
  { href: "/admin/comments", label: "Bình luận" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors",
              active
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

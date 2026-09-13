import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/layout/Logo";
import { requireStaff } from "@/lib/auth";
import { signOutAndRedirect } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();

  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-4">
            <Logo className="text-[17px]" compact />
            <span className="hidden rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent sm:inline">
              Quản trị
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/vi"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent sm:inline-flex"
            >
              Xem trang
              <ExternalLink className="size-3.5" strokeWidth={2} />
            </a>

            <span className="hidden text-sm text-text-muted md:inline">
              {staff.displayName}
            </span>

            <form action={signOutAndRedirect}>
              <button
                type="submit"
                className="cursor-pointer rounded-xl border border-border px-3 py-1.5 text-sm text-text-nav transition-colors hover:border-black/20 hover:text-accent"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1400px] px-5">
          <AdminNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-5 py-8">
        {children}
      </main>
    </div>
  );
}

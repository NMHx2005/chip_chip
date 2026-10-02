import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { RECOVERY_COOKIE } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Đặt mật khẩu mới",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where the emailed reset link leads, once /auth/xac-nhan has exchanged the
 * code for a session. Public, because the person clicking the link is by
 * definition signed out (see PUBLIC_ADMIN_PATHS in middleware.ts).
 */
export default async function ResetPasswordPage() {
  // The marker cookie from /auth/xac-nhan, not merely a session: an ordinary
  // session must not be able to set a password without knowing the current one,
  // so the form is only offered to someone who followed the emailed link.
  const fromResetLink =
    isSupabaseConfigured && cookies().get(RECOVERY_COOKIE)?.value === "1";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h1 className="text-xl font-bold tracking-[-0.01em] text-text">Đặt mật khẩu mới</h1>

          {fromResetLink ? (
            <>
              <p className="mt-1.5 text-sm text-text-muted">
                Chọn mật khẩu mới cho tài khoản của bạn.
              </p>
              <div className="mt-6">
                <PasswordForm mode="reset" />
              </div>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-sm text-text-muted">
                Liên kết này đã hết hạn hoặc chưa được mở từ email. Yêu cầu một liên kết mới rồi mở
                ngay trong hộp thư.
              </p>
              <p className="mt-5 text-sm">
                <Link href="/admin/quen-mat-khau" className="font-semibold text-accent underline">
                  Gửi lại liên kết đặt lại
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          <Link href="/admin/dang-nhap" className="underline">
            Về trang đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

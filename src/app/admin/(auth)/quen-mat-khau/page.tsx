import type { Metadata } from "next";
import Link from "next/link";
import { RequestResetForm } from "./RequestResetForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: false },
};

/**
 * Asks for a reset link. Public on purpose: it is the page someone reaches when
 * they cannot sign in (see PUBLIC_ADMIN_PATHS in middleware.ts).
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h1 className="text-xl font-bold tracking-[-0.01em] text-text">Quên mật khẩu</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Nhập email của tài khoản quản trị, chúng tôi gửi liên kết để đặt mật khẩu mới.
          </p>

          <div className="mt-6">
            <RequestResetForm />
          </div>
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

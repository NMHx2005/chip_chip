import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h1 className="text-xl font-bold tracking-[-0.01em] text-text">
            Trang quản trị
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Dành cho ban điều hành Project Chíp Chíp.
          </p>

          {searchParams.error === "not_staff" && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
            >
              Tài khoản đã đăng nhập nhưng chưa được cấp quyền. Liên hệ quản trị
              viên để được kích hoạt.
            </p>
          )}

          <div className="mt-6">
            <LoginForm next={searchParams.next ?? "/admin"} />
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          Quên mật khẩu? Liên hệ quản trị viên để được cấp lại.
        </p>
      </div>
    </div>
  );
}

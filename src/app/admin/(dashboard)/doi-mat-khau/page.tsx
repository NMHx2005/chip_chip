import type { Metadata } from "next";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Đổi mật khẩu",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const staff = await requireStaff();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Đổi mật khẩu</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {staff.email ? `Tài khoản ${staff.email}.` : "Tài khoản đang đăng nhập."} Cần nhập mật
          khẩu hiện tại để đổi.
        </p>
      </div>

      <div className="max-w-md rounded-2xl border border-border bg-surface p-5">
        <PasswordForm mode="change" />
      </div>
    </div>
  );
}

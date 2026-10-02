"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { setNewPassword, type PasswordState } from "@/app/admin/(auth)/mat-khau-actions";
import { MIN_PASSWORD_LENGTH, type PasswordProblem } from "@/lib/account";

type Code = PasswordProblem | "current_wrong" | "update_failed" | "no_session" | "config";

const MESSAGE: Record<Code, string> = {
  current_required: "Nhập mật khẩu hiện tại.",
  password_short: `Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`,
  password_unchanged: "Mật khẩu mới trùng với mật khẩu hiện tại.",
  confirm_mismatch: "Hai lần nhập mật khẩu mới không khớp.",
  current_wrong: "Mật khẩu hiện tại không đúng.",
  update_failed: "Không đổi được mật khẩu. Vui lòng thử lại.",
  no_session: "Phiên đã hết hạn. Mở lại liên kết trong email.",
  config: "Supabase chưa được cấu hình. Xem .env.example.",
};

const initialState: PasswordState = { error: null, ok: false };

const INPUT =
  "h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang lưu…" : label}
    </button>
  );
}

/**
 * Sets a password, in one of two situations.
 *
 * `reset` is the page behind the emailed link: the person has a recovery
 * session and no password they could be asked for. `change` is inside the
 * admin, where the current password is required.
 */
export function PasswordForm({ mode }: { mode: "reset" | "change" }) {
  const router = useRouter();
  const [state, formAction] = useFormState(setNewPassword, initialState);

  // The recovery session lands here from an email; once the password is set
  // there is nothing left to do on this page.
  useEffect(() => {
    if (mode === "reset" && state.ok) {
      router.replace("/admin");
      router.refresh();
    }
  }, [mode, state.ok, router]);

  const message = state.error ? MESSAGE[state.error as Code] ?? MESSAGE.update_failed : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />

      {mode === "change" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Mật khẩu hiện tại</span>
          <input
            type="password"
            name="current"
            required
            autoComplete="current-password"
            className={INPUT}
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Mật khẩu mới</span>
        <input
          type="password"
          name="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={INPUT}
        />
        <span className="text-xs text-text-muted">
          Ít nhất {MIN_PASSWORD_LENGTH} ký tự.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Nhập lại mật khẩu mới</span>
        <input
          type="password"
          name="confirm"
          required
          autoComplete="new-password"
          className={INPUT}
        />
      </label>

      {message && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {message}
        </p>
      )}

      {mode === "change" && state.ok && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-sm text-text-nav"
        >
          Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới.
        </p>
      )}

      <SubmitButton label={mode === "reset" ? "Đặt mật khẩu mới" : "Đổi mật khẩu"} />
    </form>
  );
}

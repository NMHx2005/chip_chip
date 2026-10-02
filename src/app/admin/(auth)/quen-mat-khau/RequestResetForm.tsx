"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset, type ResetRequestState } from "@/app/admin/(auth)/mat-khau-actions";

const initialState: ResetRequestState = { sent: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
    </button>
  );
}

export function RequestResetForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  if (state.sent) {
    return (
      <p
        role="status"
        className="rounded-xl border border-border bg-surface-muted px-3.5 py-3 text-sm text-text-nav"
      >
        Nếu email này có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu. Kiểm tra hộp thư
        (cả thư rác) rồi mở liên kết để đặt mật khẩu mới.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          spellCheck={false}
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

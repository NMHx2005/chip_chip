"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full cursor-pointer rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang đăng nhập…" : "Đăng nhập"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-border"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Mật khẩu</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-border"
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

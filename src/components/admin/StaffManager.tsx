"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, UserPlus } from "lucide-react";
import { createStaffAccount, setStaffAccess, type StaffRole } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { cn } from "@/lib/utils";

export type StaffRow = {
  id: string;
  email: string;
  display_name: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
};

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
};

/**
 * Who may get in: the list plus the form that creates an account.
 *
 * Both write through Server Actions that re-check that the caller is an admin
 * (the database function checks again), so a hidden button is never the only
 * thing standing in the way.
 */
export function StaffManager({
  rows,
  currentUserId,
}: {
  rows: StaffRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = (
    id: string,
    fn: () => Promise<{ ok: boolean; error?: string; unauthorized?: boolean }>,
    done: string
  ) => {
    setError(null);
    setNotice(null);
    setPendingId(id);
    startTransition(async () => {
      const result = readActionResult(await fn());
      setPendingId(null);
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok) {
        setError(result.error ?? "Thao tác thất bại.");
        return;
      }
      setNotice(done);
      router.refresh();
    });
  };

  const change = (row: StaffRow, next: { isActive?: boolean; role?: StaffRole }) => {
    const isActive = next.isActive ?? row.is_active;
    const role = next.role ?? row.role;
    run(row.id, () => setStaffAccess(row.id, isActive, role), "Đã cập nhật quyền.");
  };

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-nav"
        >
          {notice}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const isSelf = row.id === currentUserId;
          const busy = pending && pendingId === row.id;

          return (
            <li
              key={row.id}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between",
                row.is_active ? "bg-surface" : "bg-surface-muted"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text">
                    {row.display_name || "(chưa đặt tên)"}
                  </span>
                  {isSelf && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
                      Bạn
                    </span>
                  )}
                  {!row.is_active && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-800">
                      Chưa kích hoạt
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-text-muted">{row.email}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Tạo ngày {new Date(row.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-text-nav">
                  <span className="sr-only">Vai trò của {row.display_name}</span>
                  <select
                    value={row.role}
                    disabled={busy || isSelf}
                    onChange={(event) => change(row, { role: event.target.value as StaffRole })}
                    className="h-9 cursor-pointer rounded-lg border border-border bg-surface px-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="editor">{ROLE_LABEL.editor}</option>
                    <option value="admin">{ROLE_LABEL.admin}</option>
                  </select>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-text-nav">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    disabled={busy || isSelf}
                    onChange={(event) => change(row, { isActive: event.target.checked })}
                    className="size-4 cursor-pointer accent-[var(--color-primary,#111)] disabled:cursor-not-allowed"
                  />
                  Đang hoạt động
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <NewStaffForm />
    </div>
  );
}

/** The create form, with the temporary password shown exactly once. */
function NewStaffForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<StaffRole>("editor");
  const [isActive, setIsActive] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = readActionResult(
        await createStaffAccount({ email, displayName, role, isActive })
      );
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok || !result.password) {
        setError(result.error ?? "Không tạo được tài khoản.");
        return;
      }
      setCreated({ email: email.trim().toLowerCase(), password: result.password });
      setEmail("");
      setDisplayName("");
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-text">Thêm tài khoản</h2>
      <p className="mt-1 text-sm text-text-muted">
        Tài khoản được tạo kèm mật khẩu tạm — gửi cho người đó và nhắc họ đổi ở mục “Đổi mật khẩu”.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-nav">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ten@example.com"
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal text-text focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-nav">
            Tên hiển thị
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Để trống thì lấy phần trước @"
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal text-text focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-text-nav">
            Vai trò
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="h-9 cursor-pointer rounded-lg border border-border bg-surface px-2 text-sm font-normal text-text"
            >
              <option value="editor">{ROLE_LABEL.editor}</option>
              <option value="admin">{ROLE_LABEL.admin}</option>
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text-nav">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="size-4 cursor-pointer accent-[var(--color-primary,#111)]"
            />
            Kích hoạt ngay
          </label>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <UserPlus className="size-4" strokeWidth={2.2} aria-hidden />
            {pending ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </div>
      </form>

      {created && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm"
        >
          <p className="font-semibold text-text">
            Đã tạo {created.email}
          </p>
          <p className="mt-1 text-text-nav">
            Mật khẩu tạm (chỉ hiện một lần):
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-sm text-text">
              {created.password}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(created.password);
                setCopied(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-nav hover:border-black/20 hover:text-accent"
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
              ) : (
                <Copy className="size-3.5" strokeWidth={2.2} aria-hidden />
              )}
              {copied ? "Đã copy" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

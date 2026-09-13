"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  deleteTranslation,
  publishTranslation,
  unpublishTranslation,
} from "@/app/admin/actions";

type Props = {
  translationId: string;
  status: "draft" | "published";
  /** Both locale rows have a title and body, so publishing may succeed. */
  ready: boolean;
};

export function PostRowActions({ translationId, status, ready }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Thao tác thất bại.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {status === "published" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => unpublishTranslation(translationId))}
            className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-nav transition-colors hover:border-black/20 hover:text-accent disabled:opacity-50"
          >
            Bỏ đăng
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || !ready}
            title={
              ready
                ? undefined
                : "Cần có tiêu đề và nội dung ở cả hai ngôn ngữ trước khi đăng."
            }
            onClick={() => run(() => publishTranslation(translationId))}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              ready && !pending
                ? "cursor-pointer bg-primary text-white hover:bg-black/80"
                : "cursor-not-allowed bg-surface-muted text-text-muted"
            )}
          >
            Đăng
          </button>
        )}

        {confirming ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteTranslation(translationId))}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Xoá thật
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer text-xs text-text-muted underline"
            >
              Huỷ
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-red-300 hover:text-red-600"
          >
            Xoá
          </button>
        )}
      </div>

      {confirming && (
        <p className="text-[11px] text-red-600">
          Xoá cả bản Việt và Anh, không khôi phục được.
        </p>
      )}
      {error && <p className="max-w-[260px] text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

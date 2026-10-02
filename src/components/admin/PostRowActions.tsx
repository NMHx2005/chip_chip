"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  deleteTranslation,
  publishTranslation,
  unpublishTranslation,
} from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { ConfirmDialog } from "@/components/admin/Dialog";

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
  // Unpublishing takes live content down and deleting is irreversible, so both
  // go through a dialog rather than firing on the click.
  const [confirm, setConfirm] = useState<"unpublish" | "delete" | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = readActionResult(await fn());
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
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
            onClick={() => setConfirm("unpublish")}
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

        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirm("delete")}
          className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
        >
          Xoá
        </button>
      </div>

      {error && <p className="max-w-[260px] text-[11px] text-red-600">{error}</p>}

      <ConfirmDialog
        open={confirm === "unpublish"}
        title="Bỏ đăng bài này?"
        description="Bài sẽ ẩn khỏi trang công khai. Bản Việt và Anh vẫn còn, đăng lại được bất cứ lúc nào."
        confirmLabel="Bỏ đăng"
        pending={pending}
        onConfirm={() => {
          setConfirm(null);
          run(() => unpublishTranslation(translationId));
        }}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === "delete"}
        title="Xoá bài này?"
        description="Xoá cả bản Việt và Anh, không khôi phục được."
        confirmLabel="Xoá thật"
        tone="danger"
        pending={pending}
        onConfirm={() => {
          setConfirm(null);
          run(() => deleteTranslation(translationId));
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

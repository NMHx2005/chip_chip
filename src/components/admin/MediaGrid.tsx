"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, ImagePlus, Trash2 } from "lucide-react";
import { deleteMediaObject } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { ConfirmDialog, Dialog } from "@/components/admin/Dialog";
import { UploadError, uploadPostImage } from "@/lib/supabase/upload";
import { formatBytes, type MediaObject } from "@/lib/media";
import { cn } from "@/lib/utils";

const THUMB = "aspect-[4/3] w-full rounded-xl border border-border bg-surface-muted object-cover";

function Thumb({ object, children }: { object: MediaObject; children?: ReactNode }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <Image
        src={object.url}
        alt=""
        width={320}
        height={240}
        sizes="(max-width: 640px) 45vw, 200px"
        className={THUMB}
      />
      <div className="min-w-0">
        <p className="truncate font-mono text-[11px] text-text-muted">{object.name}</p>
        <p className="text-[11px] text-text-muted">
          {object.folder} · {formatBytes(object.size)}
          {object.createdAt
            ? ` · ${new Date(object.createdAt).toLocaleDateString("vi-VN")}`
            : ""}
        </p>
      </div>
      {children}
    </li>
  );
}

/**
 * The library: upload, look, copy a URL, delete.
 *
 * Deleting is refused while an article still points at the image — the check
 * lives in the action, so the grid only has to report it.
 */
export function MediaLibrary({ objects }: { objects: MediaObject[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaObject | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setNotice(null);
    setUploading(true);
    try {
      await uploadPostImage(file);
      setNotice("Đã tải ảnh lên.");
      router.refresh();
    } catch (err) {
      setError(err instanceof UploadError ? err.message : "Không tải được ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  const remove = (object: MediaObject) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = readActionResult(await deleteMediaObject(object.path));
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok) {
        setError(result.error ?? "Không xoá được ảnh.");
        return;
      }
      setNotice("Đã xoá ảnh.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <ImagePlus className="size-4" strokeWidth={2.2} aria-hidden />
          {uploading ? "Đang tải…" : "Tải ảnh lên"}
        </button>
        <span className="text-xs text-text-muted">
          JPEG, PNG, WebP, AVIF hoặc GIF, tối đa 5 MB.
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </div>

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

      {objects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          Chưa có ảnh nào. Tải ảnh lên bằng nút phía trên.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {objects.map((object) => (
            <Thumb key={object.path} object={object}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(object.url);
                    setCopied(object.path);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-nav hover:border-black/20 hover:text-accent"
                >
                  {copied === object.path ? (
                    <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
                  ) : (
                    <Copy className="size-3.5" strokeWidth={2.2} aria-hidden />
                  )}
                  {copied === object.path ? "Đã copy" : "Copy URL"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirming(object)}
                  title="Xoá ảnh"
                  aria-label="Xoá ảnh"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </Thumb>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title="Xoá ảnh này?"
        description="Ảnh biến mất khỏi thư viện và khỏi đường dẫn công khai. Ảnh đang dùng trong bài sẽ không xoá được."
        confirmLabel="Xoá ảnh"
        tone="danger"
        pending={pending}
        onConfirm={() => {
          const object = confirming;
          setConfirming(null);
          if (object) remove(object);
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

/** Picks an image that is already in the library. */
export function MediaPickerDialog({
  open,
  objects,
  onPick,
  onCancel,
}: {
  open: boolean;
  objects: MediaObject[];
  onPick: (object: MediaObject) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      title="Chọn ảnh có sẵn"
      description={
        objects.length === 0
          ? "Thư viện chưa có ảnh nào. Tải ảnh lên ở trang Thư viện ảnh trước."
          : "Bấm một ảnh để dùng nó."
      }
      confirmLabel="Đóng"
      onConfirm={onCancel}
      onCancel={onCancel}
    >
      {objects.length > 0 && (
        <ul className="grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-3">
          {objects.map((object) => (
            <li key={object.path}>
              <button
                type="button"
                onClick={() => onPick(object)}
                className={cn(
                  "w-full cursor-pointer rounded-xl border border-border p-2 text-left transition-colors",
                  "[@media(hover:hover)]:hover:border-accent"
                )}
              >
                <Image
                  src={object.url}
                  alt=""
                  width={200}
                  height={150}
                  sizes="160px"
                  className="aspect-[4/3] w-full rounded-lg bg-surface-muted object-cover"
                />
                <span className="mt-1 block truncate font-mono text-[10px] text-text-muted">
                  {object.folder}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { Check, ImagePlus, TriangleAlert } from "lucide-react";
import { EditorToolbar } from "@/components/admin/EditorToolbar";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { publishTranslation, savePost, unpublishTranslation } from "@/app/admin/actions";
import { UploadError, uploadPostImage } from "@/lib/supabase/upload";
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing";
import { slugify } from "@/lib/post-slug";
import { cn } from "@/lib/utils";
import { applySaveResult, planSave } from "@/components/admin/saveRevision";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";

export type Draft = {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  content: JSONContent;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

export function PostEditor({
  translationId,
  initialDrafts,
  status,
}: {
  translationId: string;
  initialDrafts: Record<Locale, Draft>;
  status: "draft" | "published";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [active, setActive] = useState<Locale>("vi");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [dirty, setDirty] = useState<Record<Locale, boolean>>({
    vi: false,
    en: false,
  });
  const [state, setState] = useState<SaveState>("idle");
  // Driven only by saveAll — never by updateDraft — so typing during a save
  // cannot make the button (or its label) look idle mid-flight.
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // The editor instance is shared across tabs, so callbacks read the active
  // locale from a ref rather than closing over a stale value.
  const activeRef = useRef<Locale>("vi");

  // `saveAll` is an async closure: by the time its `await` resolves, the user
  // may have kept typing and the render closure's `drafts`/`dirty` are stale.
  // These refs are the live source of truth so the save always sends (and
  // reasons about) the latest text instead of what was current at click time.
  const draftsRef = useRef(initialDrafts);
  const revisionRef = useRef<Record<Locale, number>>({ vi: 0, en: 0 });
  const dirtyRef = useRef<Record<Locale, boolean>>({ vi: false, en: false });
  // Re-entrancy guard for saveAll. React 18's startTransition clears its
  // `pending` flag before the transition callback's first `await` resumes,
  // so `pending` cannot be trusted to block a second click while a save is
  // still in flight — this ref is the thing that actually does.
  const savingRef = useRef(false);

  const updateDraft = useCallback(
    (locale: Locale, patch: Partial<Draft>) => {
      const next = {
        ...draftsRef.current,
        [locale]: { ...draftsRef.current[locale], ...patch },
      };
      draftsRef.current = next;
      setDrafts(next);
      revisionRef.current = {
        ...revisionRef.current,
        [locale]: revisionRef.current[locale] + 1,
      };
      dirtyRef.current = { ...dirtyRef.current, [locale]: true };
      setDirty(dirtyRef.current);
      // A save in progress reports its own state via isSaving/state
      // "saving" — typing must not downgrade that back to "idle" mid-flight.
      if (!savingRef.current) {
        setState("idle");
      }
    },
    []
  );

  const editor = useEditor({
    extensions: articleExtensions,
    content: initialDrafts.vi.content ?? EMPTY_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "chip-prose focus:outline-none",
      },
    },
    onUpdate({ editor: instance }) {
      updateDraft(activeRef.current, { content: instance.getJSON() });
    },
  });

  const switchTo = (locale: Locale) => {
    if (locale === active) return;
    activeRef.current = locale;
    setActive(locale);
    // emitUpdate:false stops the tab switch from being recorded as an edit
    // against the locale we are leaving. That alone is not enough, though:
    // @tiptap/core's SetContentOptions has no `addToHistory` flag, so without
    // the explicit setMeta below this transaction still lands in ProseMirror's
    // undo stack. Ctrl+Z would then restore the other locale's content into
    // this tab as an ordinary edit, firing onUpdate and overwriting it on the
    // next save. setMeta("addToHistory", false) is the flag the history
    // plugin itself honours, so the switch is excluded from undo entirely.
    editor
      ?.chain()
      .setMeta("addToHistory", false)
      .setContent(draftsRef.current[locale].content ?? EMPTY_DOC, {
        emitUpdate: false,
      })
      .run();
  };

  const handleCover = async (file: File) => {
    setUploadingCover(true);
    setMessage(null);
    try {
      const url = await uploadPostImage(file);
      updateDraft(active, { coverImageUrl: url });
    } catch (err) {
      setMessage(
        err instanceof UploadError ? err.message : "Không tải được ảnh lên."
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const saveAll = () => {
    // See the comment on savingRef: `pending` cannot gate re-entrancy here.
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setMessage(null);
    setState("saving");

    startTransition(async () => {
      try {
        let savedSomething = false;
        let skippedUnsendable: Locale | null = null;

        for (const locale of routing.locales) {
          // Re-plan for this locale from the live refs on every iteration —
          // never from a value captured before an earlier locale's `await`.
          // A locale that becomes dirty while a sibling's request is in
          // flight must still be picked up when its own turn comes.
          const [entry] = planSave(
            [locale],
            dirtyRef.current,
            draftsRef.current,
            revisionRef.current
          );

          if (!entry) {
            if (dirtyRef.current[locale] && !draftsRef.current[locale].id) {
              // Dirty, but has no database row to save into (see
              // missingLocale in the page) — the banner shown while that
              // tab is active explains why it can never be sent.
              skippedUnsendable = locale;
            }
            continue;
          }

          const { draft, revision: sentRevision } = entry;
          const result = readActionResult(
            await savePost({
              id: draft.id,
              title: draft.title,
              slug:
                draft.slug ||
                slugify(draft.title) ||
                `${locale}-${draft.id.slice(0, 6)}`,
              excerpt: draft.excerpt,
              coverImageUrl: draft.coverImageUrl,
              content: draft.content,
            })
          );

          // Session gone mid-save: the action refused rather than redirecting,
          // so the move to the login screen is ours to make.
          if (!result) return;

          if (sessionExpired(result)) {
            router.replace("/admin/dang-nhap");
            return;
          }

          if (!result.ok) {
            setState("error");
            setMessage(result.error ?? "Không lưu được bài.");
            return;
          }

          savedSomething = true;
          // Only clear dirty if nothing was typed into this locale while the
          // request above was in flight — otherwise the newer text would be
          // marked clean and silently skipped by the next save.
          dirtyRef.current = applySaveResult(
            dirtyRef.current,
            locale,
            sentRevision,
            revisionRef.current[locale]
          );
          setDirty(dirtyRef.current);
        }

        const stillDirty = routing.locales.some(
          (locale) => dirtyRef.current[locale]
        );

        if (savedSomething) {
          // Something reached the server, so the page's cached data is
          // stale either way — but only report full success when nothing
          // is left dirty (a skipped or raced locale keeps the UI honest).
          setState(stillDirty ? "idle" : "saved");
          router.refresh();
        } else if (skippedUnsendable) {
          setState("error");
          setMessage(
            `Không có gì để lưu: bản ${LOCALE_LABELS[skippedUnsendable]} chưa có bản ghi trong cơ sở dữ liệu.`
          );
        } else {
          setState("idle");
        }
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    });
  };

  const runPublish = (fn: typeof publishTranslation) => {
    setPublishError(null);
    setMessage(null);
    startTransition(async () => {
      const result = readActionResult(await fn(translationId));
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok) {
        setPublishError(result.error ?? "Thao tác thất bại.");
        return;
      }
      router.refresh();
    });
  };

  const current = drafts[active];
  const bothComplete = routing.locales.every(
    (locale) =>
      drafts[locale].title.trim().length > 0 &&
      (drafts[locale].content?.content?.length ?? 0) > 0
  );
  // `drafts` is in-memory state the server may never have seen. Publishing
  // must reflect what is actually saved, so it also requires nothing dirty.
  const hasUnsavedChanges = dirty.vi || dirty.en;
  const canPublish = bothComplete && !hasUnsavedChanges;

  return (
    <div className="flex flex-col gap-4">
      {/* Locale tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex gap-1 rounded-xl border border-border bg-surface p-1"
          role="tablist"
        >
          {routing.locales.map((locale) => {
            const complete =
              drafts[locale].title.trim().length > 0 &&
              (drafts[locale].content?.content?.length ?? 0) > 0;

            return (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={active === locale}
                onClick={() => switchTo(locale)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  active === locale
                    ? "bg-primary text-white"
                    : "text-text-nav hover:bg-surface-muted"
                )}
              >
                {LOCALE_LABELS[locale]}
                {complete ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      active === locale ? "bg-white/70" : "bg-amber-500"
                    )}
                  />
                )}
                {dirty[locale] && (
                  <span
                    title="Có thay đổi chưa lưu"
                    className="size-1.5 rounded-full bg-red-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveAll}
            disabled={isSaving || !dirty.vi && !dirty.en}
            className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            {isSaving ? "Đang lưu…" : "Lưu"}
          </button>

          {status === "published" ? (
            <button
              type="button"
              onClick={() => runPublish(unpublishTranslation)}
              disabled={pending}
              className="cursor-pointer rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-nav transition-colors hover:border-black/20 disabled:opacity-50"
            >
              Bỏ đăng
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runPublish(publishTranslation)}
              disabled={pending || !canPublish}
              title={
                !bothComplete
                  ? "Cần tiêu đề và nội dung ở cả hai ngôn ngữ."
                  : hasUnsavedChanges
                    ? "Cần lưu các thay đổi trước khi đăng bài."
                    : undefined
              }
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                canPublish && !pending
                  ? "cursor-pointer bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-surface-muted text-text-muted"
              )}
            >
              Đăng bài
            </button>
          )}
        </div>
      </div>

      {message && (
        <p
          role="alert"
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            state === "error"
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-border bg-surface-muted text-text-muted"
          )}
        >
          {message}
        </p>
      )}

      {publishError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {publishError}
        </p>
      )}

      {!canPublish && status === "draft" && (
        <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-xs text-text-muted">
          {!bothComplete
            ? "Chưa đăng được: mỗi ngôn ngữ cần có tiêu đề và nội dung. Chuyển tab để hoàn thiện bản còn thiếu."
            : "Chưa đăng được: còn thay đổi chưa lưu. Bấm \"Lưu\" trước khi đăng bài."}
        </p>
      )}

      {!current.id && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          Bản {LOCALE_LABELS[active]} chưa có bản ghi trong cơ sở dữ liệu. Bạn
          có thể soạn nội dung nhưng chưa thể lưu bản này — cần tạo lại bài để
          có đủ hai ngôn ngữ.
        </p>
      )}

      {/* Metadata for the active locale */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">
              Tiêu đề ({LOCALE_LABELS[active]})
            </span>
            <input
              value={current.title}
              onChange={(e) => updateDraft(active, { title: e.target.value })}
              className="h-12 rounded-xl border border-border bg-surface px-4 text-lg font-semibold outline-none focus:border-border"
              placeholder={
                active === "vi"
                  ? "Tiêu đề bài viết"
                  : "Article title in English"
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">
              Đường dẫn{" "}
              <span className="font-normal text-text-muted">
                (để trống sẽ tự tạo từ tiêu đề)
              </span>
            </span>
            <input
              value={current.slug}
              onChange={(e) => updateDraft(active, { slug: e.target.value })}
              className="h-11 rounded-xl border border-border bg-surface px-4 font-mono text-sm outline-none focus:border-border"
              placeholder="duong-dan-bai-viet"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">
              Tóm tắt{" "}
              <span className="font-normal text-text-muted">
                (hiện ở danh sách và kết quả tìm kiếm)
              </span>
            </span>
            <textarea
              value={current.excerpt}
              onChange={(e) => updateDraft(active, { excerpt: e.target.value })}
              rows={3}
              maxLength={320}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-border"
              placeholder="Một hai câu giới thiệu ngắn về bài viết."
            />
            <span className="text-right text-[11px] text-text-muted">
              {current.excerpt.length}/320
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Ảnh bìa</span>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-surface-muted transition-colors hover:border-black/20 disabled:opacity-60"
          >
            {current.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
                <ImagePlus className="size-6" strokeWidth={1.8} />
                <span className="text-xs">
                  {uploadingCover ? "Đang tải…" : "Chọn ảnh"}
                </span>
              </span>
            )}
          </button>

          {current.coverImageUrl && (
            <button
              type="button"
              onClick={() => updateDraft(active, { coverImageUrl: null })}
              className="cursor-pointer text-xs text-text-muted underline hover:text-red-600"
            >
              Bỏ ảnh bìa
            </button>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleCover(file);
            }}
          />
        </div>
      </div>

      {/* Body.
          `overflow-clip`, not `overflow-hidden`: both clip the toolbar to the
          rounded corners, but `overflow: hidden` makes this box a scroll
          container, and a `position: sticky` child then sticks to *it* — which
          never scrolls — instead of to the viewport. That silently killed the
          toolbar's stickiness. `overflow: clip` clips without creating a
          scroll container, so the toolbar can stick. */}
      <div className="overflow-clip rounded-2xl border border-border bg-surface">
        <EditorToolbar editor={editor} />
        <div className="px-4 py-5 md:px-8 md:py-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

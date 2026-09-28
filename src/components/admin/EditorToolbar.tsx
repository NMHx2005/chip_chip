"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BookMarked,
  Bold,
  Clapperboard,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Radical,
  Redo2,
  Sigma,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadError, uploadPostImage } from "@/lib/supabase/upload";
import { promptMath } from "@/components/admin/math-prompt";
import { CALLOUT_VARIANTS, calloutVariant, type CalloutVariant } from "@/lib/tiptap/nodes/callout";
import { parseVideoUrl } from "@/lib/video";

const CALLOUT_LABEL: Record<CalloutVariant, string> = {
  note: "Ghi chú",
  tip: "Mẹo",
  warning: "Lưu ý",
  example: "Ví dụ",
};

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-primary text-white"
          : "text-text-nav hover:bg-surface-muted hover:text-accent",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />;
}

/**
 * Where the article's references block starts, if it has one. Read from the
 * document rather than the cursor, so the buttons are right wherever the
 * cursor is — an article gets one references block at most.
 */
function findReferences(editor: Editor): number | null {
  let found: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "references") found = pos;
    return found === null;
  });
  return found;
}

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which button opened the file picker: a bare image or a captioned figure.
  const insertAsRef = useRef<"image" | "figure">("image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editor) return null;

  const referencesPos = findReferences(editor);

  const pickImage = (insertAs: "image" | "figure") => {
    insertAsRef.current = insertAs;
    fileInputRef.current?.click();
  };

  const handleImage = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      if (insertAsRef.current === "figure") {
        editor
          .chain()
          .focus()
          .insertContent({ type: "figure", attrs: { src: url, alt: "", caption: "" } })
          .run();
      } else {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (err) {
      setError(
        err instanceof UploadError ? err.message : "Không tải được ảnh lên."
      );
    } finally {
      setUploading(false);
    }
  };

  const promptLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Địa chỉ liên kết:", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const applyCallout = (value: string) => {
    if (value === "none") {
      editor.chain().focus().lift("callout").run();
      return;
    }
    const variant = calloutVariant(value);
    if (editor.isActive("callout")) {
      editor.chain().focus().updateAttributes("callout", { variant }).run();
    } else {
      editor.chain().focus().wrapIn("callout", { variant }).run();
    }
  };

  const insertReferences = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "references",
        content: [
          {
            type: "orderedList",
            content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
          },
        ],
      })
      .run();
  };

  const promptReviewers = () => {
    const pos = referencesPos;
    if (pos === null) return;
    const current = editor.state.doc.nodeAt(pos)?.attrs.reviewers;
    const value = window.prompt(
      "Được góp ý bởi (để trống để bỏ dòng này):",
      typeof current === "string" ? current : ""
    );
    if (value === null) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeAttribute(pos, "reviewers", value.trim());
        return true;
      })
      .run();
  };

  const promptVideo = () => {
    const url = window.prompt("Dán link YouTube hoặc TikTok:", "https://");
    if (url === null) return;
    const ref = parseVideoUrl(url);
    if (!ref) {
      setError("Không đọc được link video. Dán link YouTube hoặc TikTok.");
      return;
    }
    setError(null);
    editor.chain().focus().insertContent({ type: "video", attrs: ref }).run();
  };

  return (
    /*
      `top-[110px]` is the height of the admin header, not a guess: the header
      is itself `sticky top-0` and holds a 64px logo row plus the nav row
      (app/admin/(dashboard)/layout.tsx). At the previous `top-16` the toolbar
      stuck at 64px — directly *behind* the nav row, since the header sits at
      `z-40` and this at `z-20` — so the tools vanished under the header the
      moment the editor scrolled.
    */
    <div className="sticky top-[110px] z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 md:px-5">
        <ToolButton
          label="Tiêu đề lớn"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="size-[18px]" strokeWidth={2} />
        </ToolButton>
        <ToolButton
          label="Tiêu đề vừa"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-[18px]" strokeWidth={2} />
        </ToolButton>
        <ToolButton
          label="Tiêu đề nhỏ"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-[18px]" strokeWidth={2} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Đậm"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-[18px]" strokeWidth={2.4} />
        </ToolButton>
        <ToolButton
          label="Nghiêng"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-[18px]" strokeWidth={2.4} />
        </ToolButton>
        <ToolButton
          label="Gạch chân"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-[18px]" strokeWidth={2.4} />
        </ToolButton>
        <ToolButton
          label="Gạch ngang"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-[18px]" strokeWidth={2.4} />
        </ToolButton>
        <ToolButton
          label="Đánh dấu"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Danh sách"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Danh sách số"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Trích dẫn"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Khối mã"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Liên kết"
          active={editor.isActive("link")}
          onClick={promptLink}
        >
          <Link2 className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label={uploading ? "Đang tải ảnh…" : "Chèn ảnh"}
          disabled={uploading}
          onClick={() => pickImage("image")}
        >
          <ImagePlus className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Chèn bảng"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Đường kẻ ngang"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-[18px]" strokeWidth={2.4} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Công thức trong dòng"
          active={editor.isActive("inlineMath")}
          onClick={() => promptMath(editor, "inline")}
        >
          <Radical className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Công thức khối"
          active={editor.isActive("blockMath")}
          onClick={() => promptMath(editor, "block")}
        >
          <Sigma className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label={uploading ? "Đang tải ảnh…" : "Hình có chú thích"}
          disabled={uploading}
          onClick={() => pickImage("figure")}
        >
          <ImageIcon className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <select
          aria-label="Callout"
          title="Callout"
          value=""
          onChange={(event) => applyCallout(event.target.value)}
          className="h-9 shrink-0 cursor-pointer rounded-lg border border-border bg-surface px-2 text-sm text-text-nav hover:border-black/20"
        >
          <option value="" disabled>
            Callout…
          </option>
          {CALLOUT_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>
              {CALLOUT_LABEL[variant]}
            </option>
          ))}
          <option value="none">Bỏ callout</option>
        </select>
        <ToolButton
          label={
            referencesPos === null ? "Nguồn tham khảo" : "Bài đã có khối nguồn tham khảo"
          }
          disabled={referencesPos !== null}
          onClick={insertReferences}
        >
          <BookMarked className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Người góp ý (dưới nguồn tham khảo)"
          disabled={referencesPos === null}
          onClick={promptReviewers}
        >
          <Users className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton label="Video" onClick={promptVideo}>
          <Clapperboard className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Căn trái"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Căn giữa"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Căn phải"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Hoàn tác"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
        <ToolButton
          label="Làm lại"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-[18px]" strokeWidth={2.2} />
        </ToolButton>
      </div>

      {error && (
        <p role="alert" className="pb-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleImage(file);
        }}
      />
    </div>
  );
}

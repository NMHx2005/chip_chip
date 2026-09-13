"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadError, uploadPostImage } from "@/lib/supabase/upload";

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

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editor) return null;

  const handleImage = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      editor.chain().focus().setImage({ src: url }).run();
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

  return (
    <div className="sticky top-16 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-0.5 py-2">
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
          onClick={() => fileInputRef.current?.click()}
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

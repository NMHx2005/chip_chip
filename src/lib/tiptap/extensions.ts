import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";

/**
 * The single source of truth for which nodes and marks an article may contain.
 *
 * This module is imported by both the admin editor (client) and the article
 * renderer (server). They must stay in sync — `generateHTML` silently drops
 * anything the schema does not know about, so a node added here but missing
 * there would vanish from published articles.
 *
 * Keep it framework-agnostic: no `@tiptap/react` import, or the renderer breaks.
 *
 * StarterKit v3 already bundles link, underline and undo/redo, so those are
 * configured here rather than installed separately.
 */
export const articleExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: {
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    },
    codeBlock: {
      HTMLAttributes: { class: "chip-code-block" },
    },
  }),

  Placeholder.configure({
    placeholder: "Bắt đầu viết nội dung bài…",
  }),

  Image.configure({
    inline: false,
    allowBase64: false,
    HTMLAttributes: { loading: "lazy", decoding: "async" },
  }),

  TableKit.configure({
    table: { resizable: false },
  }),

  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),

  Highlight.configure({
    multicolor: false,
  }),
];

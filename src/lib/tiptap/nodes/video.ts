import { mergeAttributes, Node } from "@tiptap/core";

/**
 * A video inside an article, stored as (platform, id) like a video post.
 *
 * The HTML here is only a placeholder: the public page swaps it for a
 * click-to-load facade after sanitising (see video-embed.ts), and the editor
 * draws its own preview. Neither ever puts an iframe in the stored document.
 */
export const VideoEmbed = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      platform: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-platform"),
        renderHTML: (attributes) => ({ "data-platform": attributes.platform }),
      },
      externalId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-external-id"),
        renderHTML: (attributes) => ({ "data-external-id": attributes.externalId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "video" }, HTMLAttributes)];
  },
});

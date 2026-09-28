import { Node } from "@tiptap/core";

/**
 * The article's source list: one ordered list, plus an optional plain-text
 * line naming who reviewed the lesson. Both headings ("Nguồn tham khảo" /
 * "References", "Được góp ý bởi" / "Reviewed by") come from CSS by language.
 *
 * The list sits in a wrapper `div` because ProseMirror requires the content
 * hole to be the only child of its element, and the reviewers line is its
 * sibling.
 */
export const References = Node.create({
  name: "references",
  group: "block",
  content: "orderedList",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      reviewers: {
        default: "",
        rendered: false,
        parseHTML: (element) => element.querySelector("p.reviewers")?.textContent ?? "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="references"]', contentElement: "div.references-list" }];
  },

  renderHTML({ node }) {
    const attrs = { class: "references", "data-type": "references" };
    const list = ["div", { class: "references-list" }, 0] as const;
    const reviewers =
      typeof node.attrs.reviewers === "string" ? node.attrs.reviewers.trim() : "";
    return reviewers
      ? ["section", attrs, list, ["p", { class: "reviewers" }, reviewers]]
      : ["section", attrs, list];
  },
});

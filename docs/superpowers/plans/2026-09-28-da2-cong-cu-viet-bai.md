# DA2 — Công cụ viết bài Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho người viết chèn công thức, hình có chú thích, callout, nguồn tham khảo và video vào bài; trang công khai render đủ ở server; tab EN có nút dịch nháp bằng DeepSeek giữ nguyên cấu trúc; trả nợ làm mới cache khi gỡ đăng/xoá.

**Architecture:** Node mới nằm trong `src/lib/tiptap/nodes/*` và được đăng ký ở `extensions.ts` (một schema cho editor và renderer). Renderer chạy ba pha: `prepareArticle` (rút LaTeX ra khỏi JSON, bỏ video sai) → `generateHTML` + `sanitizeArticleHtml` + heading id → `renderMath`/`renderVideos` thay phần tử giữ chỗ bằng HTML dựng từ dữ liệu đã kiểm tra. Dịch là hai module thuần (`segments.ts` mã hoá/giải mã, `deepseek.ts` gọi API bằng `fetch` tiêm được) và một Server Action không ghi DB.

**Tech Stack:** Next.js 14 App Router · Tiptap 3.31.3 (`@tiptap/html`, `@tiptap/react`) · `@tiptap/extension-mathematics@3.31.3` · KaTeX 0.18.9 · next-intl · Vitest 2 (môi trường `node`, chỉ `src/**/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-09-28-da2-cong-cu-viet-bai-design.md` (nền: DA1, lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md`)

## Global Constraints

- Dependency mới **chỉ** `@tiptap/extension-mathematics@3.31.3` (khớp đúng phiên bản Tiptap, cài `--save-exact`) và `katex` (đo với `0.18.9`). Không SDK cho DeepSeek; gọi bằng `fetch`.
- Nội dung vẫn là Tiptap JSON; không lưu HTML. Mọi thứ ngoài allow-list của sanitize (KaTeX, facade video) được dựng **sau** sanitize, **chỉ từ dữ liệu đã kiểm tra**; không nới allow-list cho HTML tuỳ ý.
- Không thư viện cần DOM trên đường render server (jsdom → 500 trên Vercel). Test Vitest chạy môi trường `node` là bằng chứng.
- `src/lib/tiptap/extensions.ts` là nguồn schema duy nhất; editor chỉ được thêm node view/option, không đổi tên node, thuộc tính hay content.
- Server Action trả `ActionResult`, không `redirect()`; mở đầu bằng `const lookup = await lookUpStaff(); if (lookup.status !== "ok") return SESSION_ENDED;`; kiểm tra đầu vào ở biên (`isUuid`).
- Chuỗi giao diện công khai qua `src/messages/{vi,en}.json`, hai file cùng tập khoá (test `keys-parity` sẵn có). Admin viết tiếng Việt thẳng trong JSX.
- Bảng màu xám trung tính, không tím, không pastel; chữ đạt WCAG AA (các màu dùng dưới đây đều ≥ 7:1).
- Code, comment, commit message: tiếng Anh; comment chỉ giải thích *vì sao*. Không trailer attribution.
- Không stage `.env.example` (sandbox không đọc được, git báo nhầm là đã xoá), `.commandcode/`, `.crossweave/`, `.claude/`. Luôn `git add` theo đường dẫn cụ thể.
- DA2 **không đổi schema DB**. Nếu buộc phải đổi: thêm migration mới, áp bằng `npx supabase migration up`. Không `db reset` (hook chặn), không `--linked`, không `db push`.
- `npm install` cần mạng: chạy với `allowed_domains` `registry.npmjs.org` và `--cache "$TMPDIR/npm-cache"` (sandbox không cho ghi `~/.npm`).
- Cổng kiểm: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build` (build cần `allowed_domains` `fonts.googleapis.com`, `fonts.gstatic.com`) và `./scripts/verify-security.sh` (cần `npx supabase start`).
- Giới hạn: tổng chữ gửi DeepSeek ≤ 60 000 ký tự mỗi lần bấm; lô ≤ 8 000 ký tự; mỗi request ≤ 60 s; ngân sách cả lần bấm 100 s; `maxDuration = 120` ở trang sửa bài; `max_tokens = min(8192, 1024 + số ký tự của lô)`; KaTeX `maxSize: 20, maxExpand: 200`.

## Đo thực tế trước khi lập plan (rủi ro số 1 của spec)

Đo ngày 28/09/2026 trong thư mục tạm ngoài repo (`$TMPDIR/math-probe`), cài `@tiptap/extension-mathematics@3.31.3 @tiptap/core@3.31.3 @tiptap/pm@3.31.3 @tiptap/html@3.31.3 @tiptap/starter-kit@3.31.3 katex` (npm chọn `katex@0.18.9`; peer của extension: `katex ^0.16.4 || ^0.17.0 || ^0.18.0`).

1. **Tên node và thuộc tính** (đọc từ `dist/index.js`): `inlineMath` (inline, atom) và `blockMath` (block, atom), một thuộc tính `latex` (mặc định `""`), render `data-latex`. `parseHTML`: `span[data-type="inline-math"]`, `div[data-type="block-math"]`. Extension gộp là `Mathematics` (tên `"Mathematics"`), truyền **một** `katexOptions` cho cả hai node. Export: `BlockMath, InlineMath, Mathematics`.
2. **Import trong Node không cần DOM**: `typeof document` là `undefined` và `generateHTML` vẫn chạy; `document.createElement` chỉ nằm trong `addNodeView` (chỉ editor gọi).
3. **HTML mà `generateHTML` sinh**, nguyên văn, cho đoạn inline `E = hf`, khối `\frac{1}{2} a<b & "c" 'd'`, inline `"><script>alert(1)</script>`, khối rỗng và khối thiếu `attrs`:

   ```html
   <p>Năng lượng <span data-latex="E = hf" data-type="inline-math"></span> photon.</p><div data-latex="\frac{1}{2} a<b &amp; &quot;c&quot; 'd'" data-type="block-math"></div><p><span data-latex="&quot;><script>alert(1)</script>" data-type="inline-math"></span></p><div data-latex="" data-type="block-math"></div><div data-latex="" data-type="block-math"></div>
   ```

   → zeed-dom thoát `&` và `"` trong giá trị thuộc tính nhưng **để nguyên `<` và `>`**. Sanitizer hiện tại cắt thẻ ở dấu `>` đầu tiên (`[^>]*`) và gỡ `<script>…</script>` trước khi phân tích thẻ, nên LaTeX đi qua thuộc tính sẽ bị cắt hoặc sửa âm thầm. Vì vậy `renderMath` **không** đọc LaTeX từ thuộc tính: xem "Lệch so với spec" mục 1.
4. **KaTeX 0.18.9 với `trust: false`** (tuỳ chọn đúng như spec): `\href{javascript:alert(1)}{x}`, `\url{javascript:alert(1)}`, `\htmlClass{x}{y}`, `\includegraphics{https://x/y.png}` đều **không** sinh `<a …>` hay `<img>`; chúng hiện thành chữ đỏ. Lưu ý: đầu ra có `<annotation encoding="application/x-tex">`, nên kiểm `html.includes("<a")` cho kết quả **true** giả — test phải dùng `/<a[\s>]/`. `"><script>alert(1)</script>` ra HTML đã thoát, không có `<script`. `\def\a{\a\a}\a` ra `<span class="katex-error" title="ParseError: KaTeX parse error: Too many expansions: …">`. Inline bắt đầu bằng `<span class="katex">`, khối bằng `<span class="katex-display">`.
5. **Hai lỗi sẵn có của sanitizer, đo bằng chính `src/lib/tiptap/sanitize.ts` hiện tại** trên đầu ra `generateHTML`:

   ```text
   input : <img … alt="<h2>giả</h2>"><h2>Thật</h2><p><a … href="https://x.test/?a=1&amp;b=2">Sze</a></p>
   output: <img loading="lazy" decoding="async" src="https://cdn.test/a.png" alt="&lt;h2 id=">giả</h2>"><h2>Thật</h2><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://x.test/?a=1&amp;amp;b=2">Sze</a></p>
   ```

   (a) link có query string bị thoát hai lần (`&amp;amp;`) nên hỏng — khối Nguồn tham khảo sẽ gặp ngay; (b) `withHeadingIds` chạy trước sanitize nên chèn `id` vào chuỗi `<h2>` *trong alt*, heading thật mất `id`, và một phần tử `<h2>giả</h2>` thật lọt ra trang. Task 1 sửa cả hai trước khi thêm node.

## Lệch so với spec (đã cân nhắc, cần chủ dự án biết)

1. **LaTeX không được đọc lại từ thuộc tính HTML.** Spec: "`renderMath(html)` tìm phần tử giữ chỗ… LaTeX lấy từ thuộc tính phải được giải mã entity". Đo (mục 3 ở trên) cho thấy `<`/`>` trong thuộc tính làm vỡ sanitizer. Thay vào đó `prepareArticle` rút LaTeX từ JSON trước `generateHTML`, node chỉ giữ số thứ tự (`data-latex="0"`), và `renderMath(html, formulas)` tra số đó sau sanitize. Mục đích của spec (KaTeX chỉ nhận LaTeX từ dữ liệu đã kiểm tra, `data-latex` giả trong HTML không thành đường vòng) giữ nguyên và có test.
2. **Sửa sanitizer (Task 1)** — không có trong spec nhưng cần cho khối Nguồn tham khảo và cho mục lục: phân tích thẻ theo dấu nháy, giải mã entity rồi mới thoát lại, chặn `javascript:` cả khi bị giấu sau entity/ký tự điều khiển, gắn heading id **sau** sanitize.
3. **Khối Nguồn tham khảo** có content `orderedList` và HTML là `<section class="references" data-type="references"><div class="references-list"><ol>…</ol></div><p class="reviewers">…</p></section>` — thêm `div.references-list` vì ProseMirror bắt lỗ nội dung (`0`) phải là con duy nhất của phần tử chứa nó. Dùng `orderedList` (không phải `listItem+`) để Enter/Tab trong danh sách chạy như danh sách thường.
4. **CSS KaTeX import trong `ArticleBody`** (dùng chung cho trang bài học và blog) và trong `PostEditor`, thay vì "layout trang bài" — hai route bài không có layout riêng; import ở component vẫn chỉ tải trên trang bài.
5. **Kiểm thẻ khi dịch là so khớp chuỗi thẻ đúng thứ tự.** Khớp với test spec yêu cầu ("đảo thứ tự → giữ VI"), nhưng nghĩa là một câu mà tiếng Anh cần đảo vị trí hai định dạng sẽ bị giữ tiếng Việt và đếm vào `untranslated`; người viết được báo số đoạn.
6. **`extractSegments`/`applyTranslations` nhận `{ title, excerpt, content }`** chứ không chỉ `doc`, vì spec coi tiêu đề và tóm tắt là đoạn dịch.
7. **Hết thời gian thì dịch một phần.** 60 000 ký tự chia lô 8 000 và chạy tuần tự có thể vượt `maxDuration = 120`. Lô chưa kịp bắt đầu trước mốc 100 s bị bỏ qua; các đoạn đó giữ tiếng Việt và được đếm vào `untranslated`, thay vì cả lần bấm thất bại. Lỗi HTTP/parse vẫn làm cả lần bấm thất bại với thông báo thân thiện.
8. **Chèn video, công thức, người góp ý bằng `window.prompt`** (cùng kiểu với nút Liên kết sẵn có); callout chọn loại bằng `<select>`. Nút "Hình có chú thích" là nút mới, nút "Chèn ảnh" cũ giữ nguyên.
9. **Facade YouTube thêm `?autoplay=1` vào `embedUrl(ref)`** khi người đọc đã bấm, để không phải bấm play hai lần. Link dự phòng (không JS) của TikTok là `https://www.tiktok.com/embed/v2/<id>` vì DB không lưu tên người đăng.
10. **Mục lục đọc công thức trong heading thành LaTeX** (`collectText` lấy `attrs.latex` của `inlineMath`), để heading "Định luật $E = hf$" có id `dinh-luat-e-hf` thay vì mất phần công thức.
11. **Trang sửa bài hiện link video dạng watch URL** (`watchUrl`) thay cho embed URL trong ô link mới — `parseVideoUrl` đọc cả hai về cùng một cặp.
12. **Thêm `postRowsFrom`** trong `revalidate-paths.ts` để gỡ đăng/xoá dùng lại `revalidatePostRows` và test được phần chuyển dòng DB → `PostRow`.

## Review Focus

1. Link có query string (`?a=1&b=2`) trong thân bài hoặc Nguồn tham khảo → vẫn bấm được, `href` giữ `&amp;` một lần. *(Task 1 test `does not double-escape…`, Task 5 test `keeps a source link's query string intact`)*
2. Alt/chú thích chứa `<h2>` hoặc `>` → không sinh phần tử lạ, mục lục vẫn trỏ đúng heading. *(Task 1 test `keeps heading anchors and link query strings intact…`, Task 3 test `escapes markup in the caption and alt text`)*
3. Model dịch đúng nghĩa nhưng đảo thứ tự hai định dạng, bỏ một link hoặc bịa `<m2/>` → đoạn đó giữ tiếng Việt, được đếm và báo; bài không bao giờ mất link/công thức. *(Task 9 test `keeps the Vietnamese block and counts it when…`)*
4. Bài dài: > 60 000 ký tự bị từ chối kèm số ký tự; bài dài hợp lệ mà hết thời gian thì phần còn lại giữ tiếng Việt thay vì lỗi 504. *(Task 9 test `refuses more than 60 000 characters…`, Task 10 test `…stops starting new ones after the deadline`)*
5. Người viết chuyển sang tab VI trong lúc đang dịch → nội dung VI trên màn hình không bị bản EN đè. *(Task 10 Step 8, bước kiểm tay; logic ở `runTranslate` chỉ `setContent` khi `activeRef.current === "en"`)*

---

## File map

| File | Trách nhiệm |
|---|---|
| `src/lib/tiptap/sanitize.ts` (+ `.test.ts`) | Allow-list không DOM; phân tích thẻ theo dấu nháy; giải mã rồi thoát thuộc tính |
| `src/lib/tiptap/prepare.ts` | Rút LaTeX khỏi JSON (thay bằng số thứ tự), bỏ node video sai |
| `src/lib/tiptap/math.ts` | `KATEX_OPTIONS`, `renderMath`, `mathToText` |
| `src/lib/tiptap/video-embed.ts` | `renderVideos` (facade), `videosToText` |
| `src/lib/tiptap/nodes/{figure,callout,references,video}.ts` | Node Tiptap không phụ thuộc framework |
| `src/lib/tiptap/extensions.ts` | Đăng ký `Mathematics` và bốn node mới |
| `src/lib/tiptap/render.ts` (+ `.test.ts`) | Ghép ba pha render; `articleToPlainText` |
| `src/lib/tiptap/headings.ts` | Heading có công thức |
| `src/lib/html-escape.ts` | `escapeHtml` dùng chung cho HTML dựng sau sanitize |
| `src/lib/video.ts` (+ `.test.ts`) | Thêm `videoRefFrom`, `watchUrl`, `PLATFORM_LABEL` |
| `src/components/forum/ArticleBody.tsx` | Import CSS KaTeX, gắn `VideoFacades` |
| `src/components/forum/VideoFacades.tsx` | Client: bấm facade → iframe |
| `src/components/admin/{math-prompt.ts,editor-extensions.ts,FigureNodeView.tsx,VideoNodeView.tsx}` | Phần chỉ editor cần |
| `src/components/admin/EditorToolbar.tsx`, `PostEditor.tsx` | Nút mới; nút dịch ở tab EN |
| `src/components/admin/SharedFieldsPanel.tsx`, `src/app/admin/(dashboard)/bai-viet/[id]/page.tsx` | Trường video; danh sách bài học; `maxDuration`; `translateEnabled` |
| `src/lib/translate/segments.ts` (+ `.test.ts`) | `extractSegments`, `applyTranslations`, `prepareTranslation` — thuần |
| `src/lib/translate/glossary.ts` | Bảng thuật ngữ bán dẫn |
| `src/lib/translate/deepseek.ts` (+ `.test.ts`) | Gọi DeepSeek, chia lô, thử lại, hạn giờ |
| `src/app/admin/actions.ts` | `translateDraft`; gỡ đăng/xoá làm mới đúng trang |
| `src/lib/revalidate-paths.ts` (+ `.test.ts`) | `postRowsFrom` |
| `src/app/globals.css` | Hình, công thức, callout, nguồn tham khảo, facade |
| `next.config.mjs` | CSP `frame-src`, `img-src` |
| `src/messages/{vi,en}.json` | `forum.videoFrameTitle` |
| `README.md` | Biến môi trường DeepSeek, quyền riêng tư, luồng render |

---

### Task 1: Làm cứng sanitizer và gắn heading id sau sanitize

**Files:**
- Modify: `src/lib/tiptap/sanitize.ts` (viết lại toàn file)
- Modify: `src/lib/tiptap/render.ts:18-36`
- Test: `src/lib/tiptap/sanitize.test.ts`, `src/lib/tiptap/render.test.ts`

**Interfaces:**
- Consumes: không.
- Produces: `sanitizeArticleHtml(html: string): string` (chữ ký không đổi) — sau task này mọi giá trị thuộc tính đầu ra đã thoát `& " < >` đúng một lần; `renderArticle` gắn heading id trên HTML đã sanitize. Các task node sau chỉ thêm phần tử vào `ALLOWED_TAGS`/`ALLOWED_ATTR`.

- [ ] **Step 1: Viết test thất bại cho sanitizer**

Trong `src/lib/tiptap/sanitize.test.ts`, chèn khối sau ngay **trước** dòng `describe("render.ts module graph", () => {`:

```ts
describe("sanitizeArticleHtml — attribute values", () => {
  it("does not double-escape an ampersand generateHTML already escaped", () => {
    expect(
      sanitizeArticleHtml('<p><a href="https://x.test/?a=1&amp;b=2">link</a></p>')
    ).toBe('<p><a href="https://x.test/?a=1&amp;b=2">link</a></p>');
  });

  it("reads a quoted '>' as part of the value, not the end of the tag", () => {
    expect(sanitizeArticleHtml('<img src="https://x.test/a.png" alt="V > 5 <h2>"><p>sau</p>')).toBe(
      '<img src="https://x.test/a.png" alt="V &gt; 5 &lt;h2&gt;"><p>sau</p>'
    );
  });

  it("blocks a javascript: URL hidden behind entities or control characters", () => {
    const html = sanitizeArticleHtml(
      '<p><a href="&#106;avascript:alert(1)">a</a><a href="java&#9;script:alert(1)">b</a><a href=" JAVASCRIPT:alert(1)">c</a></p>'
    );
    expect(html).toBe("<p><a>a</a><a>b</a><a>c</a></p>");
  });

  it("drops an unterminated script together with everything after it", () => {
    expect(sanitizeArticleHtml("<p>a</p><script>alert(1)")).toBe("<p>a</p>");
  });

  it("keeps a stray '<' in text as text", () => {
    expect(sanitizeArticleHtml("<p>a < b</p>")).toBe("<p>a &lt; b</p>");
  });
});

```

- [ ] **Step 2: Viết test thất bại cho renderer**

Trong `src/lib/tiptap/render.test.ts`, chèn ngay **trước** dòng `describe("articleToPlainText", () => {`:

```ts
describe("renderArticle — attribute values", () => {
  it("keeps heading anchors and link query strings intact around tricky alt text", () => {
    const html = renderArticle(
      doc(
        { type: "image", attrs: { src: "https://cdn.test/a.png", alt: "<h2>giả</h2>" } },
        { type: "heading", attrs: { level: 2 }, content: [text("Thật")] },
        paragraph(
          text("Sze", [{ type: "link", attrs: { href: "https://x.test/?a=1&b=2" } }])
        )
      )
    );

    expect(html).toBe(
      '<img loading="lazy" decoding="async" src="https://cdn.test/a.png" alt="&lt;h2&gt;giả&lt;/h2&gt;">' +
        '<h2 id="that">Thật</h2>' +
        '<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://x.test/?a=1&amp;b=2">Sze</a></p>'
    );
  });
});

```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap`
Expected: FAIL 6 test mới (5 ở `sanitize.test.ts`, 1 ở `render.test.ts`); test cũ vẫn PASS. Test renderer nhận được đúng chuỗi đã đo ở mục 5 phía trên (`alt="&lt;h2 id=">giả</h2>"` … `&amp;amp;b=2`).

- [ ] **Step 4: Viết lại `src/lib/tiptap/sanitize.ts`**

```ts
/**
 * Allow-list sanitiser for Tiptap HTML.
 *
 * isomorphic-dompurify pulls jsdom, and on Vercel that chain `require()`s the
 * ESM package `@exodus/bytes` — every article page then 500s with
 * ERR_REQUIRE_ESM. This walker keeps the same tag/attribute allow-list without
 * a DOM.
 *
 * `generateHTML` (zeed-dom) escapes `&` and `"` inside attribute values but
 * leaves `<` and `>` as they are, so an alt text such as `V > 5` is legal
 * input. Tags are therefore matched quote-aware, and attribute values are
 * decoded before being re-escaped — otherwise `?a=1&amp;b=2` would come out
 * as `?a=1&amp;amp;b=2` and every link with a query string would break.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "mark",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

const ALLOWED_ATTR = new Set([
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "loading",
  "decoding",
  "class",
  "style",
  "id",
  "colspan",
  "rowspan",
]);

/** Dropped together with everything up to their closing tag. */
const FORBIDDEN_WITH_BODY = new Set(["script", "style", "iframe", "object", "embed", "form"]);

// A quoted value may contain `>`; `[^>]*` would end the tag inside it.
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] !== "#") return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
    const code =
      body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSafeUrl(name: string, value: string): boolean {
  if (name !== "href" && name !== "src") return true;
  // Browsers ignore control characters and whitespace inside a scheme, so
  // `java\tscript:` must be read as `javascript:`.
  const scheme = value.replace(/[\u0000- \u007f-\u009f]/g, "").toLowerCase();
  return !(
    scheme.startsWith("javascript:") ||
    scheme.startsWith("vbscript:") ||
    scheme.startsWith("data:")
  );
}

function sanitizeAttrs(raw: string): string {
  const out: string[] = [];
  const re =
    /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const name = match[1].toLowerCase();
    if (name.startsWith("on")) continue;
    if (!ALLOWED_ATTR.has(name)) continue;
    const value = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
    if (!isSafeUrl(name, value)) continue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

export function sanitizeArticleHtml(html: string): string {
  let out = "";
  let last = 0;
  let skipping: string | null = null;

  for (const match of html.matchAll(TAG)) {
    const [raw, closing, tag, attrs] = match;
    const name = tag.toLowerCase();
    const text = html.slice(last, match.index);
    last = match.index + raw.length;

    if (skipping) {
      if (closing && name === skipping) skipping = null;
      continue;
    }

    // Text between tags is already escaped by generateHTML; a bare `<` here
    // can only come from hand-written HTML and is kept as text.
    out += text.replace(/</g, "&lt;");

    if (FORBIDDEN_WITH_BODY.has(name)) {
      if (!closing && !raw.endsWith("/>")) skipping = name;
      continue;
    }
    if (!ALLOWED_TAGS.has(name)) continue;
    out += closing ? `</${name}>` : `<${name}${sanitizeAttrs(attrs)}>`;
  }

  if (!skipping) out += html.slice(last).replace(/</g, "&lt;");
  return out;
}
```

- [ ] **Step 5: Gắn heading id sau sanitize** — trong `src/lib/tiptap/render.ts`, thay toàn bộ hàm `renderArticle` bằng:

```ts
export function renderArticle(content: unknown): string {
  if (!content || typeof content !== "object") return "";

  let raw: string;
  try {
    raw = generateHTML(
      content as Parameters<typeof generateHTML>[0],
      articleExtensions
    );
  } catch {
    // Malformed JSON in the column — render nothing rather than a 500.
    return "";
  }

  // Ids go in after sanitising: the sanitiser escapes `<` inside attribute
  // values, so an alt text containing "<h2>" can no longer be mistaken for a
  // heading and shift every anchor after it.
  return withHeadingIds(sanitizeArticleHtml(raw), extractHeadings(content));
}
```

- [ ] **Step 6: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap`
Expected: PASS toàn bộ (`sanitize.test.ts` 9 test, `render.test.ts` 8 test).

- [ ] **Step 7: Kiểm và commit**

Run: `npm run typecheck && npm run lint`
Expected: 0 lỗi.

```bash
git add src/lib/tiptap/sanitize.ts src/lib/tiptap/sanitize.test.ts src/lib/tiptap/render.ts src/lib/tiptap/render.test.ts
git commit -m "fix(render): parse attributes quote-aware and stop double-escaping them

generateHTML leaves < and > raw inside attribute values, so the regex
sanitiser cut tags short, and it re-escaped & so links with a query string
broke. Heading ids are now added after sanitising so alt text cannot fake a
heading."
```

---

### Task 2: Công thức — dependency, node, `renderMath` ở server

**Files:**
- Modify: `package.json`, `package-lock.json` (qua `npm install`)
- Create: `src/lib/html-escape.ts`, `src/lib/tiptap/prepare.ts`, `src/lib/tiptap/math.ts`
- Modify: `src/lib/tiptap/extensions.ts`, `src/lib/tiptap/sanitize.ts`, `src/lib/tiptap/render.ts` (viết lại toàn file), `src/lib/tiptap/headings.ts:14-17`, `src/components/forum/ArticleBody.tsx`, `src/app/globals.css`
- Test: `src/lib/tiptap/render.test.ts`

**Interfaces:**
- Consumes: `sanitizeArticleHtml` (Task 1).
- Produces:
  - `escapeHtml(value: string): string` — `src/lib/html-escape.ts`.
  - `type Formula = { latex: string; display: boolean }`; `prepareArticle(content: unknown): { doc: JsonNode; formulas: Formula[] } | null` — `src/lib/tiptap/prepare.ts`.
  - `KATEX_OPTIONS` (hằng `as const satisfies KatexOptions`), `renderMath(html: string, formulas: Formula[]): string`, `mathToText(html: string, formulas: Formula[]): string` — `src/lib/tiptap/math.ts`.
  - Trong `render.ts`: hàm nội bộ `renderSanitized(content)`; `renderArticle`, `articleToPlainText` giữ chữ ký.
  - Node Tiptap `inlineMath`/`blockMath` (thuộc tính `latex: string`) có trong `articleExtensions`.
  - HTML công khai: `<span class="math-inline"><span class="katex">…</span></span>` và `<div class="math-block"><span class="katex-display">…</span></div>`.

- [ ] **Step 1: Cài dependency** (cần mạng: `allowed_domains` `registry.npmjs.org`)

```bash
npm install --cache "$TMPDIR/npm-cache" --save-exact @tiptap/extension-mathematics@3.31.3
npm install --cache "$TMPDIR/npm-cache" katex@0.18.9
```

Expected: `package.json` có `"@tiptap/extension-mathematics": "3.31.3"` và `"katex": "^0.18.9"`; `npm ls @tiptap/core katex` chỉ ra một bản `@tiptap/core@3.31.3` và `katex@0.18.9`. KaTeX có sẵn type (`types/katex.d.ts`), không cần `@types/katex`.

- [ ] **Step 2: Viết test thất bại** — trong `src/lib/tiptap/render.test.ts`:

Thay dòng import renderer bằng:

```ts
import { extractHeadings } from "@/lib/tiptap/headings";
import { articleToPlainText, renderArticle } from "@/lib/tiptap/render";
```

Ngay sau hàm `text` (khai báo `const text = (value: string, marks?: unknown[]) => ({…});`), thêm:

```ts
const inlineMath = (latex: unknown) => ({ type: "inlineMath", attrs: { latex } });
const blockMath = (latex: unknown) => ({ type: "blockMath", attrs: { latex } });
```

Chèn ngay **trước** `describe("articleToPlainText", () => {`:

```ts
describe("renderArticle — formulas", () => {
  it("typesets an inline formula with KaTeX on the server", () => {
    const html = renderArticle(doc(paragraph(text("Năng lượng "), inlineMath("E = hf"))));
    expect(html).toContain('<p>Năng lượng <span class="math-inline"><span class="katex">');
    expect(html).toContain('<annotation encoding="application/x-tex">E = hf</annotation>');
    expect(html).not.toContain("data-latex");
  });

  it("typesets a block formula in display mode", () => {
    const html = renderArticle(doc(blockMath("a > b")));
    expect(html.startsWith('<div class="math-block"><span class="katex-display">')).toBe(true);
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">');
    expect(html).toContain('<annotation encoding="application/x-tex">a &gt; b</annotation>');
  });

  it("renders nothing for an empty or non-string formula", () => {
    expect(renderArticle(doc(blockMath(""), paragraph(text("x"), inlineMath(42))))).toBe("<p>x</p>");
  });

  it("does not turn \\href into a link", () => {
    const html = renderArticle(doc(paragraph(inlineMath("\\href{javascript:alert(1)}{x}"))));
    // KaTeX output contains `<annotation`, so a bare "<a" check would pass by accident.
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain('href="');
  });

  it("keeps markup inside LaTeX from escaping into the page", () => {
    const html = renderArticle(doc(paragraph(inlineMath('"><script>alert(1)</script>'))));
    expect(html).not.toContain("<script");
    expect(html).toContain('<span class="math-inline"><span class="katex">');
  });

  it("does not treat a placeholder typed as text as a formula", () => {
    const html = renderArticle(
      doc(paragraph(text('<span data-latex="0" data-type="inline-math"></span>')), blockMath("x"))
    );
    expect(html.startsWith('<p>&lt;span data-latex="0" data-type="inline-math"&gt;&lt;/span&gt;</p>')).toBe(true);
    expect(html.match(/class="katex"/g)).toHaveLength(1);
  });
});

describe("formulas elsewhere in the pipeline", () => {
  it("contributes raw LaTeX to the plain text", () => {
    expect(
      articleToPlainText(doc(paragraph(text("Năng lượng "), inlineMath("E = hf")), blockMath("a < b")), 500)
    ).toBe("Năng lượng E = hf a < b");
  });

  it("lists a heading's formula in the table of contents", () => {
    const content = doc({
      type: "heading",
      attrs: { level: 2 },
      content: [text("Định luật "), inlineMath("E = hf")],
    });
    expect(extractHeadings(content)).toEqual([
      { id: "dinh-luat-e-hf", text: "Định luật E = hf", level: 2 },
    ]);
    expect(renderArticle(content)).toContain(
      '<h2 id="dinh-luat-e-hf">Định luật <span class="math-inline">'
    );
  });
});

```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: FAIL 8 test mới — schema chưa có `inlineMath`/`blockMath` nên `generateHTML` ném lỗi và `renderArticle` trả `""`.

- [ ] **Step 4: Tạo `src/lib/html-escape.ts`**

```ts
/** Escapes text for use inside an HTML element or a double-quoted attribute. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Step 5: Tạo `src/lib/tiptap/prepare.ts`**

```ts
/**
 * Readies stored Tiptap JSON for `generateHTML`.
 *
 * Measured on @tiptap/extension-mathematics 3.31.3: `generateHTML` escapes
 * `&` and `"` inside `data-latex` but leaves `<` and `>` raw, so a formula
 * such as `a > b` would travel through the sanitiser as half an attribute.
 * The LaTeX therefore never enters the HTML at all: each formula's text is
 * collected here, and the node keeps only its index. `renderMath` looks the
 * index up after sanitising, so the only LaTeX KaTeX ever sees comes straight
 * from the JSON.
 */

export type Formula = { latex: string; display: boolean };

type JsonNode = {
  type?: unknown;
  attrs?: Record<string, unknown>;
  content?: unknown;
};

export type PreparedArticle = { doc: JsonNode; formulas: Formula[] };

export function prepareArticle(content: unknown): PreparedArticle | null {
  if (!content || typeof content !== "object") return null;

  const formulas: Formula[] = [];

  const visit = (node: JsonNode): JsonNode | null => {
    if (node.type === "inlineMath" || node.type === "blockMath") {
      const latex = typeof node.attrs?.latex === "string" ? node.attrs.latex : "";
      formulas.push({ latex, display: node.type === "blockMath" });
      return { ...node, attrs: { latex: String(formulas.length - 1) } };
    }

    // A malformed `content` is left for generateHTML to reject, so the
    // renderer keeps failing closed exactly as before.
    if (!Array.isArray(node.content)) return node;

    return {
      ...node,
      content: node.content.flatMap((child: unknown) => {
        if (!child || typeof child !== "object") return [child];
        const next = visit(child as JsonNode);
        return next ? [next] : [];
      }),
    };
  };

  const doc = visit(content as JsonNode);
  return doc ? { doc, formulas } : null;
}
```

- [ ] **Step 6: Tạo `src/lib/tiptap/math.ts`**

```ts
import katex, { type KatexOptions } from "katex";
import { escapeHtml } from "@/lib/html-escape";
import type { Formula } from "@/lib/tiptap/prepare";

/**
 * `trust: false` is what keeps `\href`, `\url`, `\htmlClass` and
 * `\includegraphics` from producing links, classes or images; `maxSize` and
 * `maxExpand` bound what one formula can cost to typeset.
 */
export const KATEX_OPTIONS = {
  throwOnError: false,
  trust: false,
  strict: "ignore",
  maxSize: 20,
  maxExpand: 200,
  output: "htmlAndMathml",
} as const satisfies KatexOptions;

// Exactly what sanitizeArticleHtml leaves of a math node prepared by
// prepareArticle: the index is all the attribute ever holds.
const PLACEHOLDER = /<(span|div) data-latex="(\d+)" data-type="(?:inline|block)-math"><\/\1>/g;

function typeset({ latex, display }: Formula): string {
  try {
    return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode: display });
  } catch {
    return `<code class="math-error">${escapeHtml(latex)}</code>`;
  }
}

/** Replaces the sanitised placeholders with KaTeX HTML. Runs after sanitising. */
export function renderMath(html: string, formulas: Formula[]): string {
  return html.replace(PLACEHOLDER, (_match, _tag, index: string) => {
    const formula = formulas[Number(index)];
    if (!formula || !formula.latex.trim()) return "";
    return formula.display
      ? `<div class="math-block">${typeset(formula)}</div>`
      : `<span class="math-inline">${typeset(formula)}</span>`;
  });
}

/** The same placeholders as raw LaTeX, for search text and meta descriptions. */
export function mathToText(html: string, formulas: Formula[]): string {
  return html.replace(PLACEHOLDER, (_match, _tag, index: string) => {
    const formula = formulas[Number(index)];
    return formula ? ` ${escapeHtml(formula.latex)} ` : "";
  });
}
```

- [ ] **Step 7: Đăng ký node** — `src/lib/tiptap/extensions.ts`:

Sau `import Image from "@tiptap/extension-image";` thêm:

```ts
import { Mathematics } from "@tiptap/extension-mathematics";
```

Thay phần cuối mảng (`Highlight.configure({ multicolor: false, }), ];`) bằng:

```ts
  Highlight.configure({
    multicolor: false,
  }),

  // Inline and block formulas. Only the LaTeX is stored; the public page
  // typesets it on the server (see math.ts), the editor in the browser.
  Mathematics,
];
```

- [ ] **Step 8: Cho phần tử giữ chỗ qua sanitize** — `src/lib/tiptap/sanitize.ts`:

Trong `ALLOWED_TAGS`, sau `"td",` thêm:

```ts
  // Formula placeholders; math.ts swaps them for KaTeX after sanitising.
  "span",
  "div",
```

Trong `ALLOWED_ATTR`, sau `"rowspan",` thêm:

```ts
  "data-type",
  "data-latex",
```

- [ ] **Step 9: Công thức trong heading** — `src/lib/tiptap/headings.ts`, thay hàm `collectText` bằng:

```ts
function collectText(node: Node): string {
  if (node.type === "text") return node.text ?? "";
  // A formula in a heading reads as its LaTeX in the table of contents.
  if (node.type === "inlineMath") {
    return typeof node.attrs?.latex === "string" ? node.attrs.latex : "";
  }
  if (!Array.isArray(node.content)) return "";
  return node.content.map(collectText).join("");
}
```

- [ ] **Step 10: Viết lại `src/lib/tiptap/render.ts`**

```ts
import "server-only";

import { generateHTML } from "@tiptap/html";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { extractHeadings, withHeadingIds } from "@/lib/tiptap/headings";
import { mathToText, renderMath } from "@/lib/tiptap/math";
import { prepareArticle, type Formula } from "@/lib/tiptap/prepare";
import { sanitizeArticleHtml } from "@/lib/tiptap/sanitize";

/**
 * Stored Tiptap JSON to sanitised HTML, with formula placeholders still in
 * place.
 *
 * Content is stored as JSON rather than HTML so nothing executable is ever
 * persisted. `generateHTML` runs in Node without a DOM (it uses zeed-dom
 * internally), and `sanitizeArticleHtml` then runs as a second line of
 * defence — only staff can write articles, but sanitising on the way out is
 * cheap insurance against a hand-edited database row or a future importer.
 *
 * Heading ids are injected after sanitising: the sanitiser escapes `<` inside
 * attribute values, so an alt text containing "<h2>" can no longer be
 * mistaken for a heading and shift every anchor after it.
 */
function renderSanitized(content: unknown): { html: string; formulas: Formula[] } | null {
  const prepared = prepareArticle(content);
  if (!prepared) return null;

  let raw: string;
  try {
    raw = generateHTML(
      prepared.doc as Parameters<typeof generateHTML>[0],
      articleExtensions
    );
  } catch {
    // Malformed JSON in the column — render nothing rather than a 500.
    return null;
  }

  const html = withHeadingIds(sanitizeArticleHtml(raw), extractHeadings(content));
  return { html, formulas: prepared.formulas };
}

/**
 * Renders stored Tiptap JSON to HTML for the article page.
 *
 * KaTeX HTML is built after sanitising, and only from the LaTeX string in
 * the JSON — never by widening the allow-list.
 */
export function renderArticle(content: unknown): string {
  const rendered = renderSanitized(content);
  if (!rendered) return "";
  return renderMath(rendered.html, rendered.formulas);
}

/** Plain-text preview for meta descriptions and search results. */
export function articleToPlainText(content: unknown, limit = 200): string {
  const rendered = renderSanitized(content);
  if (!rendered) return "";

  const text = mathToText(rendered.html, rendered.formulas)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}
```

- [ ] **Step 11: Chạy lại test**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap`
Expected: PASS (`render.test.ts` 16 test, `sanitize.test.ts` 9 test). Test chạy trong môi trường `node`, không DOM — đây cũng là bằng chứng đường render server không cần DOM.

- [ ] **Step 12: CSS KaTeX và khối công thức**

`src/components/forum/ArticleBody.tsx` — sau `import { getTranslations } from "next-intl/server";` thêm:

```ts
import "katex/dist/katex.min.css";
```

và thay đoạn cuối của comment đầu hàm (dòng ` * the markup has already been through the tag allow-list.` và ` */` theo sau) bằng:

```ts
 * the markup has already been through the tag allow-list.
 *
 * KaTeX's stylesheet is imported here rather than in a layout so that only
 * article pages pay for it; its fonts are bundled and served from our origin.
 */
```

`src/app/globals.css` — ngay sau khối `.chip-prose .selectedCell::after { … }` (kết thúc bằng `z-index: 2;\n}`), thêm:

```css

/* ── DA2 article blocks ─────────────────────────────────────────────────────
   Labels ("Hình", "Ghi chú", "Nguồn tham khảo", …) are generated here from
   the page language instead of being stored in the article, so one Tiptap
   document reads correctly in both locales. <html lang> is set by the root
   layout and kept current by DocumentLang. Greyscale only; every text colour
   below is at least 7:1 on its background. */

.chip-prose .math-block {
  margin: 1.5em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.chip-prose .math-error {
  color: #0d0d0d;
}
```

- [ ] **Step 13: Kiểm toàn bộ**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: 0 lỗi, mọi test PASS, build thành công (font KaTeX được bundler xuất vào `.next/static/media`, CSP `font-src 'self'` đủ).

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json src/lib/html-escape.ts src/lib/tiptap/prepare.ts src/lib/tiptap/math.ts src/lib/tiptap/extensions.ts src/lib/tiptap/sanitize.ts src/lib/tiptap/headings.ts src/lib/tiptap/render.ts src/lib/tiptap/render.test.ts src/components/forum/ArticleBody.tsx src/app/globals.css
git commit -m "feat(render): typeset inline and block formulas with KaTeX on the server

LaTeX is lifted out of the JSON before generateHTML and looked up by index
after sanitising, because generateHTML leaves < and > raw in data-latex.
KaTeX runs with trust: false so \\href and friends cannot emit links."
```

---
### Task 3: Hình có chú thích

**Files:**
- Create: `src/lib/tiptap/nodes/figure.ts`
- Modify: `src/lib/tiptap/extensions.ts`, `src/lib/tiptap/sanitize.ts`, `src/app/globals.css`
- Test: `src/lib/tiptap/render.test.ts`

**Interfaces:**
- Consumes: `sanitizeArticleHtml` (Task 1), `renderArticle`/`articleToPlainText` (Task 2).
- Produces:
  - `isAllowedFigureSrc(src: unknown, supabaseUrl?: string): src is string` — nhận `https://…` hoặc `<origin Supabase>/storage/v1/object/public/…`; mặc định đọc `process.env.NEXT_PUBLIC_SUPABASE_URL`.
  - Node `Figure` tên `"figure"`, block, atom, thuộc tính `src: string | null`, `alt: string`, `caption: string` (không render thẳng, `rendered: false`).
  - HTML: `<figure><img src alt loading="lazy" decoding="async"><figcaption>…</figcaption></figure>`; không `img` khi `src` không hợp lệ, không `figcaption` khi chú thích rỗng.

- [ ] **Step 1: Viết test thất bại** — `src/lib/tiptap/render.test.ts`:

Thêm import (sau các import sẵn có):

```ts
import { isAllowedFigureSrc } from "@/lib/tiptap/nodes/figure";
```

Chèn trước `describe("articleToPlainText", () => {`:

```ts
describe("renderArticle — figures", () => {
  it("renders an image with its caption", () => {
    expect(
      renderArticle(
        doc({ type: "figure", attrs: { src: "https://cdn.test/w.png", alt: "Tấm wafer", caption: "Tấm wafer 300 mm" } })
      )
    ).toBe(
      '<figure><img src="https://cdn.test/w.png" alt="Tấm wafer" loading="lazy" decoding="async"><figcaption>Tấm wafer 300 mm</figcaption></figure>'
    );
  });

  it("leaves out an empty caption and a source that is not https", () => {
    expect(
      renderArticle(doc({ type: "figure", attrs: { src: "javascript:alert(1)", alt: "x", caption: "" } }))
    ).toBe("<figure></figure>");
  });

  it("escapes markup in the caption and alt text", () => {
    const html = renderArticle(
      doc({ type: "figure", attrs: { src: "https://cdn.test/a.png", alt: 'a" onerror="x', caption: "<b>V</b> > 5" } })
    );
    expect(html).toBe(
      '<figure><img src="https://cdn.test/a.png" alt="a&quot; onerror=&quot;x" loading="lazy" decoding="async"><figcaption>&lt;b&gt;V&lt;/b&gt; &gt; 5</figcaption></figure>'
    );
  });

  it("puts the caption, not the alt text, into the plain text", () => {
    expect(
      articleToPlainText(
        doc(
          { type: "figure", attrs: { src: "https://cdn.test/a.png", alt: "ảnh", caption: "Tấm wafer" } },
          paragraph(text("sau"))
        ),
        500
      )
    ).toBe("Tấm wafer sau");
  });
});

describe("isAllowedFigureSrc", () => {
  it.each([
    ["https://cdn.test/a.png", undefined, true],
    ["http://127.0.0.1:54321/storage/v1/object/public/post-images/a.png", "http://127.0.0.1:54321", true],
    ["http://127.0.0.1:54321/storage/v1/object/private/a.png", "http://127.0.0.1:54321", false],
    ["http://evil.test/storage/v1/object/public/a.png", "http://127.0.0.1:54321", false],
    ["data:image/png;base64,AAAA", "http://127.0.0.1:54321", false],
    [null, "http://127.0.0.1:54321", false],
  ])("%s with project %s → %s", (src, project, expected) => {
    expect(isAllowedFigureSrc(src, project)).toBe(expected);
  });
});

```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: FAIL — `Cannot find module '@/lib/tiptap/nodes/figure'`.

- [ ] **Step 3: Tạo `src/lib/tiptap/nodes/figure.ts`**

```ts
import { Node } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * An image the article can refer to as "Hình N." / "Figure N.".
 *
 * `caption` and `alt` are plain strings rather than rich content: the
 * numbering is CSS (see `.chip-prose figcaption` in globals.css), and plain
 * attributes keep the translator's job to one segment each.
 */

/**
 * Figures only load from https or from this project's own Supabase bucket —
 * the local stack serves that over plain http, so an https-only rule would
 * break every figure in development.
 */
export function isAllowedFigureSrc(
  src: unknown,
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
): src is string {
  if (typeof src !== "string") return false;
  if (src.startsWith("https://")) return true;
  if (!supabaseUrl) return false;
  try {
    const origin = new URL(supabaseUrl).origin;
    return src.startsWith(`${origin}/storage/v1/object/public/`);
  } catch {
    return false;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null, rendered: false },
      alt: { default: "", rendered: false },
      caption: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const img = element.querySelector("img");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: element.querySelector("figcaption")?.textContent ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const children: DOMOutputSpec[] = [];
    if (isAllowedFigureSrc(node.attrs.src)) {
      children.push([
        "img",
        { src: node.attrs.src, alt: text(node.attrs.alt), loading: "lazy", decoding: "async" },
      ]);
    }
    const caption = text(node.attrs.caption);
    if (caption) children.push(["figcaption", {}, caption]);
    return ["figure", {}, ...children];
  },
});
```

- [ ] **Step 4: Đăng ký node và cho qua sanitize**

`src/lib/tiptap/extensions.ts`: sau `import StarterKit from "@tiptap/starter-kit";` thêm `import { Figure } from "@/lib/tiptap/nodes/figure";`, và sau dòng `Mathematics,` trong mảng thêm:

```ts

  Figure,
```

`src/lib/tiptap/sanitize.ts`: trong `ALLOWED_TAGS`, sau `"div",` thêm:

```ts
  "figure",
  "figcaption",
```

- [ ] **Step 5: Chạy lại test**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: PASS (26 test).

- [ ] **Step 6: CSS đánh số hình** — `src/app/globals.css`, chèn ngay trước dòng `/* Hero video hover-card: a bright dash traveling the notch outline, drawn as an`:

```css
.chip-prose {
  counter-reset: figure;
}

.chip-prose figure {
  margin: 2em 0;
}

/* The counter lives on the caption, so only captioned figures are numbered. */
.chip-prose figcaption {
  counter-increment: figure;
  margin-top: 0.625rem;
  color: #3e424d;
  font-size: 0.9375rem;
  line-height: 1.5;
  text-align: center;
}

.chip-prose figcaption::before {
  content: "Hình " counter(figure) ". ";
  font-weight: 600;
  color: #0d0d0d;
}

.chip-prose figcaption:lang(en)::before {
  content: "Figure " counter(figure) ". ";
}

```

- [ ] **Step 7: Kiểm và commit**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, PASS.

```bash
git add src/lib/tiptap/nodes/figure.ts src/lib/tiptap/extensions.ts src/lib/tiptap/sanitize.ts src/lib/tiptap/render.test.ts src/app/globals.css
git commit -m "feat(editor): add a figure node with caption, alt text and CSS numbering"
```

---

### Task 4: Callout

**Files:**
- Create: `src/lib/tiptap/nodes/callout.ts`
- Modify: `src/lib/tiptap/extensions.ts`, `src/lib/tiptap/sanitize.ts`, `src/app/globals.css`
- Test: `src/lib/tiptap/render.test.ts`

**Interfaces:**
- Consumes: pipeline của Task 2.
- Produces:
  - `CALLOUT_VARIANTS = ["note", "tip", "warning", "example"] as const`; `type CalloutVariant`; `calloutVariant(value: unknown): CalloutVariant` (ngoài danh sách → `"note"`).
  - Node `Callout` tên `"callout"`, block, content `block+`, thuộc tính `variant`.
  - HTML: `<aside class="callout callout-<variant>" data-variant="<variant>">…</aside>`.

- [ ] **Step 1: Viết test thất bại** — `src/lib/tiptap/render.test.ts`:

Thêm import: `import { calloutVariant } from "@/lib/tiptap/nodes/callout";`

Chèn trước `describe("articleToPlainText", () => {`:

```ts
describe("renderArticle — callouts", () => {
  it("renders each variant as a labelled aside", () => {
    expect(
      renderArticle(doc({ type: "callout", attrs: { variant: "warning" }, content: [paragraph(text("Cẩn thận"))] }))
    ).toBe('<aside class="callout callout-warning" data-variant="warning"><p>Cẩn thận</p></aside>');
  });

  it("falls back to a note for an unknown variant", () => {
    expect(
      renderArticle(
        doc({ type: "callout", attrs: { variant: 'x" onclick="alert(1)' }, content: [paragraph(text("Lạ"))] })
      )
    ).toBe('<aside class="callout callout-note" data-variant="note"><p>Lạ</p></aside>');
  });

  it("normalises variants the same way when parsing", () => {
    expect(calloutVariant("tip")).toBe("tip");
    expect(calloutVariant("TIP")).toBe("note");
    expect(calloutVariant(undefined)).toBe("note");
  });

  it("puts the callout's text into the plain text", () => {
    expect(
      articleToPlainText(doc({ type: "callout", attrs: { variant: "tip" }, content: [paragraph(text("Ghi nhớ"))] }))
    ).toBe("Ghi nhớ");
  });
});

```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: FAIL — `Cannot find module '@/lib/tiptap/nodes/callout'`.

- [ ] **Step 3: Tạo `src/lib/tiptap/nodes/callout.ts`**

```ts
import { Node } from "@tiptap/core";

export const CALLOUT_VARIANTS = ["note", "tip", "warning", "example"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

/** Anything outside the list — a hand-edited row, a pasted attribute — is a note. */
export function calloutVariant(value: unknown): CalloutVariant {
  return CALLOUT_VARIANTS.find((variant) => variant === value) ?? "note";
}

/**
 * A boxed aside. The label ("Ghi chú" / "Note", …) is drawn by CSS from
 * `data-variant` and the page language, so it never has to be translated
 * inside the article.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "note",
        rendered: false,
        parseHTML: (element) => calloutVariant(element.getAttribute("data-variant")),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-variant]" }];
  },

  renderHTML({ node }) {
    const variant = calloutVariant(node.attrs.variant);
    return ["aside", { class: `callout callout-${variant}`, "data-variant": variant }, 0];
  },
});
```

- [ ] **Step 4: Đăng ký và cho qua sanitize**

`extensions.ts`: thêm `import { Callout } from "@/lib/tiptap/nodes/callout";` (xếp trước import `Figure`), và sau `Figure,` trong mảng thêm `  Callout,`.

`sanitize.ts`: `ALLOWED_TAGS` sau `"figcaption",` thêm `  "aside",`; `ALLOWED_ATTR` sau `"data-latex",` thêm `  "data-variant",`.

- [ ] **Step 5: Chạy lại test**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: PASS (30 test).

- [ ] **Step 6: CSS** — `globals.css`, chèn ngay trước dòng `/* Hero video hover-card: …`:

```css
.chip-prose .callout {
  border: 1px solid #d1d1d1;
  border-left: 4px solid #314344;
  border-radius: 12px;
  background: #f5f5f5;
  padding: 1rem 1.25rem;
}

.chip-prose .callout > * + * {
  margin-top: 0.75em;
}

.chip-prose .callout::before {
  display: block;
  margin-bottom: 0.375rem;
  color: #3e424d;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Variants differ by weight and line style, never by hue. */
.chip-prose .callout-warning {
  border-left-color: #0d0d0d;
  border-left-width: 6px;
}

.chip-prose .callout-example {
  border-left-style: dashed;
}

.chip-prose .callout-note::before { content: "Ghi chú"; }
.chip-prose .callout-tip::before { content: "Mẹo"; }
.chip-prose .callout-warning::before { content: "Lưu ý"; }
.chip-prose .callout-example::before { content: "Ví dụ"; }
.chip-prose .callout-note:lang(en)::before { content: "Note"; }
.chip-prose .callout-tip:lang(en)::before { content: "Tip"; }
.chip-prose .callout-warning:lang(en)::before { content: "Warning"; }
.chip-prose .callout-example:lang(en)::before { content: "Example"; }

```

- [ ] **Step 7: Kiểm và commit**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, PASS.

```bash
git add src/lib/tiptap/nodes/callout.ts src/lib/tiptap/extensions.ts src/lib/tiptap/sanitize.ts src/lib/tiptap/render.test.ts src/app/globals.css
git commit -m "feat(editor): add note, tip, warning and example callouts"
```

---

### Task 5: Nguồn tham khảo

**Files:**
- Create: `src/lib/tiptap/nodes/references.ts`
- Modify: `src/lib/tiptap/extensions.ts`, `src/lib/tiptap/sanitize.ts`, `src/app/globals.css`
- Test: `src/lib/tiptap/render.test.ts`

**Interfaces:**
- Consumes: pipeline của Task 2, sanitizer Task 1 (link có `&`).
- Produces: node `References` tên `"references"`, block, content `orderedList`, `isolating`, thuộc tính `reviewers: string`. HTML: `<section class="references" data-type="references"><div class="references-list"><ol>…</ol></div>[<p class="reviewers">…</p>]</section>`.

- [ ] **Step 1: Viết test thất bại** — chèn vào `render.test.ts` trước `describe("articleToPlainText", () => {`:

```ts
describe("renderArticle — references", () => {
  const list = (...items: string[]) => ({
    type: "orderedList",
    content: items.map((item) => ({ type: "listItem", content: [paragraph(text(item))] })),
  });

  it("renders the list and the reviewers line", () => {
    expect(
      renderArticle(doc({ type: "references", attrs: { reviewers: "TS. Nguyễn A" }, content: [list("Sze, Physics")] }))
    ).toBe(
      '<section class="references" data-type="references"><div class="references-list"><ol><li><p>Sze, Physics</p></li></ol></div><p class="reviewers">TS. Nguyễn A</p></section>'
    );
  });

  it("omits the reviewers line when there is none", () => {
    expect(renderArticle(doc({ type: "references", content: [list("Sze")] }))).toBe(
      '<section class="references" data-type="references"><div class="references-list"><ol><li><p>Sze</p></li></ol></div></section>'
    );
  });

  it("keeps a source link's query string intact", () => {
    const html = renderArticle(
      doc({
        type: "references",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [paragraph(text("Sze", [{ type: "link", attrs: { href: "https://x.test/?a=1&b=2" } }]))],
              },
            ],
          },
        ],
      })
    );
    expect(html).toContain('href="https://x.test/?a=1&amp;b=2"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });

  it("puts sources and reviewers into the plain text", () => {
    expect(
      articleToPlainText(doc({ type: "references", attrs: { reviewers: "TS. A" }, content: [list("Sze")] }))
    ).toBe("Sze TS. A");
  });
});

```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: FAIL 4 test mới (`renderArticle` trả `""` vì schema chưa có `references`).

- [ ] **Step 3: Tạo `src/lib/tiptap/nodes/references.ts`**

```ts
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
```

- [ ] **Step 4: Đăng ký và cho qua sanitize**

`extensions.ts`: thêm `import { References } from "@/lib/tiptap/nodes/references";` (sau import `Figure`), và sau `Callout,` trong mảng thêm `  References,`.

`sanitize.ts`: `ALLOWED_TAGS` sau `"aside",` thêm `  "section",`.

- [ ] **Step 5: Chạy lại test**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/render.test.ts`
Expected: PASS (34 test).

- [ ] **Step 6: CSS** — `globals.css`, chèn ngay trước dòng `/* Hero video hover-card: …`:

```css
.chip-prose .references {
  margin-top: 3em;
  border-top: 1px solid #d1d1d1;
  padding-top: 1.5em;
  font-size: 0.9375rem;
}

.chip-prose .references::before {
  content: "Nguồn tham khảo";
  display: block;
  margin-bottom: 0.75em;
  color: #0d0d0d;
  font-size: 1.25rem;
  font-weight: 700;
}

.chip-prose .references:lang(en)::before {
  content: "References";
}

.chip-prose .references .reviewers {
  margin-top: 1em;
  color: #3e424d;
}

.chip-prose .references .reviewers::before {
  content: "Được góp ý bởi ";
}

.chip-prose .references .reviewers:lang(en)::before {
  content: "Reviewed by ";
}

```

- [ ] **Step 7: Kiểm và commit**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, PASS.

```bash
git add src/lib/tiptap/nodes/references.ts src/lib/tiptap/extensions.ts src/lib/tiptap/sanitize.ts src/lib/tiptap/render.test.ts src/app/globals.css
git commit -m "feat(editor): add a references block with an optional reviewers line"
```

---

### Task 6: Video trong bài — node, facade ở server, client, CSP

**Files:**
- Modify: `src/lib/video.ts`, `src/lib/video.test.ts`
- Create: `src/lib/tiptap/nodes/video.ts`, `src/lib/tiptap/video-embed.ts`, `src/components/forum/VideoFacades.tsx`
- Modify: `src/lib/tiptap/extensions.ts`, `src/lib/tiptap/sanitize.ts`, `src/lib/tiptap/prepare.ts`, `src/lib/tiptap/render.ts`, `src/components/forum/ArticleBody.tsx`, `src/messages/vi.json`, `src/messages/en.json`, `next.config.mjs`, `src/app/globals.css`
- Test: `src/lib/video.test.ts`, `src/lib/tiptap/render.test.ts`

**Interfaces:**
- Consumes: `VideoRef`, `VideoPlatform`, `embedUrl`, `parseVideoUrl` (DA1, `src/lib/video.ts`); `escapeHtml` (Task 2).
- Produces:
  - `videoRefFrom(platform: unknown, externalId: unknown): VideoRef | null` — cùng regex với ràng buộc DB.
  - `watchUrl(ref: VideoRef): string`; `PLATFORM_LABEL: Record<VideoPlatform, string>` (`"YouTube"`, `"TikTok"`).
  - Node `VideoEmbed` tên `"video"`, block, atom, thuộc tính `platform`, `externalId`; HTML giữ chỗ `<div data-type="video" data-platform="…" data-external-id="…"></div>`.
  - `renderVideos(html: string): string`, `videosToText(html: string): string` — `src/lib/tiptap/video-embed.ts`.
  - Facade: `<figure class="video-embed video-embed-<platform>"><a class="video-facade" href="<watchUrl>" target="_blank" rel="noopener noreferrer" data-video-platform="…" data-video-id="…">[<img …hqdefault.jpg>]<span class="video-facade-play" aria-hidden="true"></span><span class="video-facade-label">YouTube|TikTok</span></a></figure>`.
  - Client `VideoFacades()` (không prop); message key `forum.videoFrameTitle` (tham số `{platform}`).

- [ ] **Step 1: Test thất bại cho `video.ts`** — `src/lib/video.test.ts`:

Đổi dòng import thành `import { embedUrl, parseVideoUrl, videoRefFrom, watchUrl } from "@/lib/video";` rồi thêm cuối file:

```ts
describe("videoRefFrom", () => {
  it("accepts what parseVideoUrl could produce", () => {
    expect(videoRefFrom("youtube", "dQw4w9WgXcQ")).toEqual(YT);
    expect(videoRefFrom("tiktok", "7231338487075638570")).toEqual(TT);
  });

  it.each([
    ["youtube", "dQw4w9WgXc"],
    ["youtube", 'dQw4w9WgXcQ"'],
    ["tiktok", "dQw4w9WgXcQ"],
    ["vimeo", "dQw4w9WgXcQ"],
    ["youtube", 12345678901],
    [undefined, undefined],
  ])("refuses (%s, %s)", (platform, id) => {
    expect(videoRefFrom(platform, id)).toBeNull();
  });
});

describe("watchUrl", () => {
  it("links to the video's own page", () => {
    expect(watchUrl(YT)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(watchUrl(TT)).toBe("https://www.tiktok.com/embed/v2/7231338487075638570");
  });
});
```

- [ ] **Step 2: Test thất bại cho renderer** — chèn vào `render.test.ts` trước `describe("articleToPlainText", () => {`:

```ts
describe("renderArticle — videos", () => {
  const video = (platform: unknown, externalId: unknown) => ({ type: "video", attrs: { platform, externalId } });

  it("renders a YouTube video as a click-to-load facade", () => {
    expect(renderArticle(doc(video("youtube", "dQw4w9WgXcQ")))).toBe(
      '<figure class="video-embed video-embed-youtube"><a class="video-facade" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" data-video-platform="youtube" data-video-id="dQw4w9WgXcQ"><img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt="" loading="lazy" decoding="async"><span class="video-facade-play" aria-hidden="true"></span><span class="video-facade-label">YouTube</span></a></figure>'
    );
  });

  it("renders a TikTok video without a thumbnail", () => {
    expect(renderArticle(doc(video("tiktok", "7231338487075638570")))).toBe(
      '<figure class="video-embed video-embed-tiktok"><a class="video-facade" href="https://www.tiktok.com/embed/v2/7231338487075638570" target="_blank" rel="noopener noreferrer" data-video-platform="tiktok" data-video-id="7231338487075638570"><span class="video-facade-play" aria-hidden="true"></span><span class="video-facade-label">TikTok</span></a></figure>'
    );
  });

  it.each([
    ["an id that fails the pattern", video("youtube", '"><script>')],
    ["an unknown platform", video("vimeo", "dQw4w9WgXcQ")],
    ["missing attributes", { type: "video" }],
  ])("renders nothing for %s", (_label, node) => {
    expect(renderArticle(doc(node, paragraph(text("sau"))))).toBe("<p>sau</p>");
  });

  it("never emits an iframe", () => {
    expect(renderArticle(doc(video("youtube", "dQw4w9WgXcQ")))).not.toContain("<iframe");
  });
});

describe("every new node together", () => {
  it("adds formulas' LaTeX, captions, callouts and references to the plain text, but not videos", () => {
    expect(
      articleToPlainText(
        doc(
          paragraph(text("Năng lượng "), inlineMath("E = hf")),
          { type: "figure", attrs: { src: "https://cdn.test/a.png", alt: "ảnh", caption: "Tấm wafer" } },
          { type: "callout", content: [paragraph(text("Ghi nhớ"))] },
          { type: "video", attrs: { platform: "youtube", externalId: "dQw4w9WgXcQ" } },
          blockMath("a < b"),
          {
            type: "references",
            attrs: { reviewers: "TS. A" },
            content: [{ type: "orderedList", content: [{ type: "listItem", content: [paragraph(text("Sze"))] }] }],
          }
        ),
        500
      )
    ).toBe("Năng lượng E = hf Tấm wafer Ghi nhớ a < b Sze TS. A");
  });
});

```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/video.test.ts src/lib/tiptap/render.test.ts`
Expected: FAIL — `videoRefFrom`/`watchUrl` không tồn tại; các test video của renderer trả `""`.

- [ ] **Step 4: Thêm vào cuối `src/lib/video.ts`**

```ts

/**
 * Rebuilds a reference from untrusted parts — an article's JSON or a data
 * attribute in the page — accepting only what `parseVideoUrl` could produce.
 */
export function videoRefFrom(platform: unknown, externalId: unknown): VideoRef | null {
  if (typeof externalId !== "string") return null;
  if (platform === "youtube" && YOUTUBE_ID.test(externalId)) {
    return { platform, externalId };
  }
  if (platform === "tiktok" && TIKTOK_ID.test(externalId)) {
    return { platform, externalId };
  }
  return null;
}

/** Where the no-JavaScript fallback link sends the reader. */
export function watchUrl(ref: VideoRef): string {
  const id = encodeURIComponent(ref.externalId);
  return ref.platform === "youtube"
    ? `https://www.youtube.com/watch?v=${id}`
    : `https://www.tiktok.com/embed/v2/${id}`;
}

export const PLATFORM_LABEL: Record<VideoPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
};
```

- [ ] **Step 5: Tạo `src/lib/tiptap/nodes/video.ts`**

```ts
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
```

- [ ] **Step 6: Tạo `src/lib/tiptap/video-embed.ts`**

```ts
import { escapeHtml } from "@/lib/html-escape";
import { PLATFORM_LABEL, videoRefFrom, watchUrl, type VideoRef } from "@/lib/video";

/**
 * Swaps sanitised video placeholders for a click-to-load facade.
 *
 * No iframe is ever part of the HTML: the facade is a plain link to the video
 * (so it works without JavaScript), and VideoFacades replaces it with the
 * player only when the reader asks for it. That keeps YouTube/TikTok from
 * loading — or setting cookies — for readers who never press play.
 */

const PLACEHOLDER =
  /<div data-type="video" data-platform="([a-z]*)" data-external-id="([A-Za-z0-9_-]*)"><\/div>/g;

// Anything prepareArticle let through but this pattern does not match.
const LEFTOVER = /<div data-type="video"[^>]*><\/div>/g;

function facade(ref: VideoRef): string {
  const id = escapeHtml(ref.externalId);
  const label = PLATFORM_LABEL[ref.platform];
  const thumbnail =
    ref.platform === "youtube"
      ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">`
      : "";
  return (
    `<figure class="video-embed video-embed-${ref.platform}">` +
    `<a class="video-facade" href="${escapeHtml(watchUrl(ref))}" target="_blank" rel="noopener noreferrer" ` +
    `data-video-platform="${ref.platform}" data-video-id="${id}">` +
    thumbnail +
    `<span class="video-facade-play" aria-hidden="true"></span>` +
    `<span class="video-facade-label">${label}</span>` +
    `</a></figure>`
  );
}

export function renderVideos(html: string): string {
  return html
    .replace(PLACEHOLDER, (_match, platform: string, externalId: string) => {
      const ref = videoRefFrom(platform, externalId);
      return ref ? facade(ref) : "";
    })
    .replace(LEFTOVER, "");
}

/** Videos contribute nothing to search text. */
export function videosToText(html: string): string {
  return html.replace(PLACEHOLDER, "").replace(LEFTOVER, "");
}
```

- [ ] **Step 7: Bỏ video sai trước khi dựng HTML** — `src/lib/tiptap/prepare.ts`:

Thêm dòng đầu file: `import { videoRefFrom } from "@/lib/video";` (kèm một dòng trống sau).

Thay dòng cuối của comment đầu file (` * from the JSON.` + ` */`) bằng:

```ts
 * from the JSON.
 *
 * Video nodes whose (platform, id) would not pass the database constraint are
 * dropped here, before any HTML exists.
 */
```

Trong `visit`, ngay sau khối `if (node.type === "inlineMath" || node.type === "blockMath") { … }` thêm:

```ts

    if (node.type === "video") {
      const ref = videoRefFrom(node.attrs?.platform, node.attrs?.externalId);
      return ref ? { ...node, attrs: { platform: ref.platform, externalId: ref.externalId } } : null;
    }
```

- [ ] **Step 8: Ghép vào renderer** — `src/lib/tiptap/render.ts`:

Thêm import `import { renderVideos, videosToText } from "@/lib/tiptap/video-embed";` (sau import `sanitizeArticleHtml`). Đổi dòng đầu comment của `renderSanitized` thành ` * Stored Tiptap JSON to sanitised HTML, with formula and video placeholders` + ` * still in place.` Thay comment và thân `renderArticle` bằng:

```ts
/**
 * Renders stored Tiptap JSON to HTML for the article page.
 *
 * KaTeX and the video facade are built after sanitising, and only from
 * validated data — the LaTeX string from the JSON, a video id that matched
 * its platform's pattern — never by widening the allow-list.
 */
export function renderArticle(content: unknown): string {
  const rendered = renderSanitized(content);
  if (!rendered) return "";
  return renderVideos(renderMath(rendered.html, rendered.formulas));
}
```

và trong `articleToPlainText` đổi `const text = mathToText(rendered.html, rendered.formulas)` thành `const text = videosToText(mathToText(rendered.html, rendered.formulas))`.

- [ ] **Step 9: Đăng ký node và cho qua sanitize**

`extensions.ts`: thêm `import { VideoEmbed } from "@/lib/tiptap/nodes/video";` (sau import `References`), sau `References,` trong mảng thêm `  VideoEmbed,`. Kết quả cuối mảng:

```ts
  // Inline and block formulas. Only the LaTeX is stored; the public page
  // typesets it on the server (see math.ts), the editor in the browser.
  Mathematics,

  Figure,
  Callout,
  References,
  VideoEmbed,
];
```

`sanitize.ts`: `ALLOWED_ATTR` sau `"data-variant",` thêm:

```ts
  "data-platform",
  "data-external-id",
```

- [ ] **Step 10: Chạy lại test**

Run: `npm test -- --maxWorkers=3 src/lib/video.test.ts src/lib/tiptap/render.test.ts`
Expected: PASS (`video.test.ts` 34 test, `render.test.ts` 41 test).

- [ ] **Step 11: Client bật player** — tạo `src/components/forum/VideoFacades.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PLATFORM_LABEL, embedUrl, videoRefFrom } from "@/lib/video";

/**
 * Swaps a video facade (see src/lib/tiptap/video-embed.ts) for the player
 * when the reader clicks it.
 *
 * The facades arrive as HTML through `dangerouslySetInnerHTML`, so React
 * never sees them as elements: one listener on the document handles them
 * all. The player address is rebuilt from the validated (platform, id), never
 * read from the page. Modified clicks fall through to the link, which opens
 * the video on its own site — as it does when JavaScript is off.
 */
export function VideoFacades() {
  const t = useTranslations("forum");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const facade = event.target.closest<HTMLAnchorElement>("a.video-facade");
      if (!facade) return;
      const ref = videoRefFrom(facade.dataset.videoPlatform, facade.dataset.videoId);
      if (!ref) return;

      event.preventDefault();
      const frame = document.createElement("iframe");
      // Autoplay only because the reader just pressed play on the facade.
      frame.src = ref.platform === "youtube" ? `${embedUrl(ref)}?autoplay=1` : embedUrl(ref);
      frame.title = t("videoFrameTitle", { platform: PLATFORM_LABEL[ref.platform] });
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.setAttribute("loading", "lazy");
      frame.className = "video-frame";
      facade.replaceWith(frame);
      frame.focus();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [t]);

  return null;
}
```

`src/components/forum/ArticleBody.tsx` — thêm import `import { VideoFacades } from "@/components/forum/VideoFacades";` (sau import CSS KaTeX) và thay khối `return` cuối bằng:

```tsx
  return (
    <>
      <div className="chip-prose" dangerouslySetInnerHTML={{ __html: html }} />
      {html.includes('class="video-facade"') && <VideoFacades />}
    </>
  );
```

- [ ] **Step 12: Message** — trong khối `"forum"`:

`src/messages/vi.json`: đổi `"emptyArticle": "Bài viết chưa có nội dung."` thành

```json
    "emptyArticle": "Bài viết chưa có nội dung.",
    "videoFrameTitle": "Video {platform} nhúng trong bài"
```

`src/messages/en.json`: đổi `"emptyArticle": "This article has no content yet."` thành

```json
    "emptyArticle": "This article has no content yet.",
    "videoFrameTitle": "Embedded {platform} video"
```

- [ ] **Step 13: CSP** — `next.config.mjs`, thay dòng `img-src`:

```js
  // i.ytimg.com: thumbnails on the click-to-load video facades in articles.
  `img-src 'self' data: blob: ${supabaseOrigin} https://i.ytimg.com`,
```

và dòng `frame-src`:

```js
  // Video players, created only after a reader clicks a facade (VideoFacades).
  "frame-src 'self' https://docs.google.com https://www.youtube-nocookie.com https://www.tiktok.com",
```

- [ ] **Step 14: CSS facade** — `globals.css`, chèn ngay trước dòng `/* Hero video hover-card: …`:

```css
.chip-prose .video-embed {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #0d0d0d;
  aspect-ratio: 16 / 9;
}

.chip-prose .video-embed-tiktok {
  aspect-ratio: 9 / 16;
  max-width: 340px;
  margin-left: auto;
  margin-right: auto;
}

.chip-prose .video-facade {
  position: absolute;
  inset: 0;
  display: block;
  color: #ffffff;
  text-decoration: none;
}

.chip-prose .video-facade img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}

.chip-prose .video-facade-play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 68px;
  height: 68px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: rgba(13, 13, 13, 0.85);
  transition: background-color 150ms ease;
}

.chip-prose .video-facade-play::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 54%;
  transform: translate(-50%, -50%);
  border-style: solid;
  border-width: 12px 0 12px 20px;
  border-color: transparent transparent transparent #ffffff;
}

.chip-prose .video-facade:hover .video-facade-play,
.chip-prose .video-facade:focus-visible .video-facade-play {
  background: #000000;
}

.chip-prose .video-facade-label {
  position: absolute;
  left: 12px;
  bottom: 12px;
  border-radius: 9999px;
  background: rgba(13, 13, 13, 0.85);
  padding: 0.25rem 0.75rem;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
}

.chip-prose .video-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

```

- [ ] **Step 15: Kiểm toàn bộ**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: 0 lỗi; `keys-parity` PASS (khoá mới có ở cả hai file); build thành công.

- [ ] **Step 16: Commit**

```bash
git add src/lib/video.ts src/lib/video.test.ts src/lib/tiptap/nodes/video.ts src/lib/tiptap/video-embed.ts src/lib/tiptap/prepare.ts src/lib/tiptap/render.ts src/lib/tiptap/render.test.ts src/lib/tiptap/extensions.ts src/lib/tiptap/sanitize.ts src/components/forum/VideoFacades.tsx src/components/forum/ArticleBody.tsx src/messages/vi.json src/messages/en.json next.config.mjs src/app/globals.css
git commit -m "feat(render): embed YouTube and TikTok videos as click-to-load facades

Only ids that match the platform pattern become a facade; the iframe is
created in the browser after a click, so CSP frame-src and img-src gain the
two player origins and the YouTube thumbnail host."
```

---
### Task 7: Editor — nút và node view cho mọi khối mới

**Files:**
- Create: `src/components/admin/math-prompt.ts`, `src/components/admin/FigureNodeView.tsx`, `src/components/admin/VideoNodeView.tsx`, `src/components/admin/editor-extensions.ts`
- Modify: `src/components/admin/EditorToolbar.tsx`, `src/components/admin/PostEditor.tsx`

**Interfaces:**
- Consumes: `articleExtensions`; `Figure`, `VideoEmbed`, `CALLOUT_VARIANTS`, `calloutVariant`, `type CalloutVariant`, `isAllowedFigureSrc`; `KATEX_OPTIONS`; `parseVideoUrl`, `videoRefFrom`, `PLATFORM_LABEL`; `uploadPostImage`; lệnh Tiptap `insertInlineMath/insertBlockMath/updateInlineMath/updateBlockMath/deleteInlineMath/deleteBlockMath({ latex?, pos? })` do `@tiptap/extension-mathematics` khai báo.
- Produces:
  - `type MathKind = "inline" | "block"`; `promptMath(editor: Editor, kind: MathKind, existing?: { latex: string; pos: number }): void`.
  - `buildEditorExtensions(onMathClick: (kind: MathKind, latex: string, pos: number) => void): AnyExtension[]` — cùng schema với `articleExtensions`, chỉ thêm node view và `onClick`.
  - `FigureNodeView`, `VideoNodeView` (props `NodeViewProps`).

Không có test Vitest cho task này: Vitest chỉ chạy `src/**/*.test.ts` trong môi trường `node`, không có DOM để dựng editor. Mọi logic kiểm được bằng unit test (schema, render, `parseVideoUrl`, `calloutVariant`) đã có test ở Task 3–6; phần này được kiểm bằng typecheck/lint/build và trình duyệt (Step 8).

- [ ] **Step 1: Tạo `src/components/admin/math-prompt.ts`**

```ts
import type { Editor } from "@tiptap/react";

export type MathKind = "inline" | "block";

/**
 * Asks for LaTeX and inserts, updates or (when emptied) removes a formula.
 *
 * `existing` is set when the writer clicked a formula already in the text.
 */
export function promptMath(
  editor: Editor,
  kind: MathKind,
  existing?: { latex: string; pos: number }
) {
  const input = window.prompt(
    kind === "inline" ? "Công thức LaTeX (trong dòng):" : "Công thức LaTeX (khối riêng):",
    existing?.latex ?? ""
  );
  if (input === null) return;
  const latex = input.trim();

  if (!existing) {
    if (!latex) return;
    if (kind === "inline") editor.chain().focus().insertInlineMath({ latex }).run();
    else editor.chain().focus().insertBlockMath({ latex }).run();
    return;
  }

  const { pos } = existing;
  if (kind === "inline") {
    if (latex) editor.chain().focus().updateInlineMath({ latex, pos }).run();
    else editor.chain().focus().deleteInlineMath({ pos }).run();
  } else if (latex) {
    editor.chain().focus().updateBlockMath({ latex, pos }).run();
  } else {
    editor.chain().focus().deleteBlockMath({ pos }).run();
  }
}
```

- [ ] **Step 2: Tạo `src/components/admin/FigureNodeView.tsx`**

```tsx
"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { isAllowedFigureSrc } from "@/lib/tiptap/nodes/figure";

/** Editor-only view of a figure: the image plus its caption and alt text, editable in place. */
export function FigureNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const src: unknown = node.attrs.src;
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const caption = typeof node.attrs.caption === "string" ? node.attrs.caption : "";

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "flex flex-col gap-2 rounded-xl",
        selected && "outline outline-2 outline-offset-4 outline-black/30"
      )}
    >
      {isAllowedFigureSrc(src) ? (
        // eslint-disable-next-line @next/next/no-img-element -- the editor shows the uploaded file as-is; next/image adds nothing here
        <img src={src} alt={alt} className="rounded-xl" />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
          Ảnh không hợp lệ — xoá hình này và chèn lại.
        </p>
      )}
      <input
        value={caption}
        onChange={(event) => updateAttributes({ caption: event.target.value })}
        placeholder="Chú thích (tự đánh số Hình 1, Hình 2…)"
        aria-label="Chú thích hình"
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-black/30"
      />
      <input
        value={alt}
        onChange={(event) => updateAttributes({ alt: event.target.value })}
        placeholder="Mô tả ảnh cho người dùng trình đọc màn hình (alt)"
        aria-label="Văn bản thay thế của hình"
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-black/30"
      />
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 3: Tạo `src/components/admin/VideoNodeView.tsx`**

```tsx
"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, videoRefFrom } from "@/lib/video";

/** Editor-only preview of an embedded video; the public page draws its own facade. */
export function VideoNodeView({ node, selected }: NodeViewProps) {
  const ref = videoRefFrom(node.attrs.platform, node.attrs.externalId);

  return (
    <NodeViewWrapper
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-3",
        selected && "outline outline-2 outline-offset-4 outline-black/30"
      )}
    >
      {ref?.platform === "youtube" && (
        // eslint-disable-next-line @next/next/no-img-element -- a fixed-size thumbnail from i.ytimg.com, not worth an image-optimizer round trip
        <img
          src={`https://i.ytimg.com/vi/${ref.externalId}/hqdefault.jpg`}
          alt=""
          className="h-16 w-28 shrink-0 rounded-lg object-cover"
        />
      )}
      <span className="text-sm text-text">
        {ref
          ? `Video ${PLATFORM_LABEL[ref.platform]} · ${ref.externalId}`
          : "Video không hợp lệ — xoá khối này và chèn lại."}
      </span>
    </NodeViewWrapper>
  );
}
```

- [ ] **Step 4: Tạo `src/components/admin/editor-extensions.ts`**

```ts
import type { AnyExtension } from "@tiptap/core";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FigureNodeView } from "@/components/admin/FigureNodeView";
import { VideoNodeView } from "@/components/admin/VideoNodeView";
import type { MathKind } from "@/components/admin/math-prompt";
import { KATEX_OPTIONS } from "@/lib/tiptap/math";
import { articleExtensions } from "@/lib/tiptap/extensions";
import { Figure } from "@/lib/tiptap/nodes/figure";
import { VideoEmbed } from "@/lib/tiptap/nodes/video";

/**
 * The article schema plus what only the editor needs: React views for
 * figures and videos, and click-to-edit formulas.
 *
 * Only node views and options change here — never a node's name, attributes
 * or content — so the editor and the server renderer still share one schema.
 * `Mathematics` is split into its two nodes because it hands one set of KaTeX
 * options to both, and block formulas need `displayMode`.
 */
export function buildEditorExtensions(
  onMathClick: (kind: MathKind, latex: string, pos: number) => void
): AnyExtension[] {
  return articleExtensions.flatMap((extension): AnyExtension[] => {
    if (extension.name === "Mathematics") {
      return [
        InlineMath.configure({
          katexOptions: KATEX_OPTIONS,
          onClick: (node, pos) => onMathClick("inline", String(node.attrs.latex ?? ""), pos),
        }),
        BlockMath.configure({
          katexOptions: { ...KATEX_OPTIONS, displayMode: true },
          onClick: (node, pos) => onMathClick("block", String(node.attrs.latex ?? ""), pos),
        }),
      ];
    }
    if (extension.name === Figure.name) {
      return [Figure.extend({ addNodeView: () => ReactNodeViewRenderer(FigureNodeView) })];
    }
    if (extension.name === VideoEmbed.name) {
      return [VideoEmbed.extend({ addNodeView: () => ReactNodeViewRenderer(VideoNodeView) })];
    }
    return [extension];
  });
}
```

- [ ] **Step 5: Toolbar** — `src/components/admin/EditorToolbar.tsx`, theo thứ tự:

(a) Trong khối import `lucide-react`: thêm `BookMarked,` sau `AlignRight,`; `Clapperboard,` sau `Bold,`; `Image as ImageIcon,` sau `Highlighter,` (alias vì luật `jsx-a11y/alt-text` của Next coi `<Image>` là ảnh cần `alt`); `Radical,` sau `Quote,`; `Sigma,` sau `Redo2,`; `Users,` sau `Undo2,`.

(b) Ngay sau `import { UploadError, uploadPostImage } from "@/lib/supabase/upload";` thêm:

```ts
import { promptMath } from "@/components/admin/math-prompt";
import { CALLOUT_VARIANTS, calloutVariant, type CalloutVariant } from "@/lib/tiptap/nodes/callout";
import { parseVideoUrl } from "@/lib/video";

const CALLOUT_LABEL: Record<CalloutVariant, string> = {
  note: "Ghi chú",
  tip: "Mẹo",
  warning: "Lưu ý",
  example: "Ví dụ",
};
```

(c) Ngay trước `function Divider() {` thêm:

```ts
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

```

(d) Thay phần đầu `EditorToolbar` — từ `export function EditorToolbar({ editor }: { editor: Editor | null }) {` tới hết dòng `editor.chain().focus().setImage({ src: url }).run();` — bằng:

```tsx
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
```

(e) Ngay trước `  return (` của component (dòng đứng trên comment `` `top-[110px]` is the height of the admin header``) thêm:

```tsx
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

```

(f) Ở nút "Chèn ảnh", đổi `onClick={() => fileInputRef.current?.click()}` thành `onClick={() => pickImage("image")}`.

(g) Ngay trước nhóm căn lề (`<Divider />` rồi `<ToolButton label="Căn trái"`), chèn nhóm mới:

```tsx
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
```

Bố cục dính đỉnh (`sticky top-[110px] z-20`, commit `daab845`) và `flex-wrap` giữ nguyên; nhóm mới chỉ xuống dòng khi màn hình hẹp.

- [ ] **Step 6: Editor dùng extension của editor** — `src/components/admin/PostEditor.tsx`:

Thay sáu dòng import đầu (từ `import { useCallback, useRef, useState, useTransition } from "react";` tới `import { articleExtensions } from "@/lib/tiptap/extensions";`) bằng:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import { Check, ImagePlus, TriangleAlert } from "lucide-react";
import "katex/dist/katex.min.css";
import { EditorToolbar } from "@/components/admin/EditorToolbar";
import { buildEditorExtensions } from "@/components/admin/editor-extensions";
import { promptMath } from "@/components/admin/math-prompt";
```

Thay hai dòng `  const editor = useEditor({` + `    extensions: articleExtensions,` bằng:

```tsx
  // Formula nodes report clicks through their extension options, which are
  // fixed when the editor is created — so they reach the editor via a ref.
  const editorRef = useRef<Editor | null>(null);
  const extensions = useMemo(
    () =>
      buildEditorExtensions((kind, latex, pos) => {
        if (editorRef.current) promptMath(editorRef.current, kind, { latex, pos });
      }),
    []
  );

  const editor = useEditor({
    extensions,
```

Ngay trước `  const switchTo = (locale: Locale) => {` thêm:

```tsx
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

```

- [ ] **Step 7: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: 0 lỗi, PASS, build thành công.

- [ ] **Step 8: Kiểm trong trình duyệt** (stack local: `npx supabase start`; app: `NODE_ENV=development npx next dev -p 3000`; đăng nhập admin local)

Mở một bài học ở `/admin/bai-viet/<id>`, tab VI:
1. "Công thức trong dòng" → nhập `E = hf` → công thức hiện trong dòng; bấm vào nó → prompt hiện `E = hf`; xoá hết rồi OK → công thức biến mất. "Công thức khối" → `\frac{1}{2}mv^2` → hiện ở dạng khối (display).
2. "Hình có chú thích" → chọn ảnh → hình hiện kèm hai ô; gõ chú thích và alt → chấm đỏ "chưa lưu" hiện ở tab; gõ trong ô không làm con trỏ nhảy vào thân bài.
3. Đặt con trỏ trong một đoạn → Callout → "Mẹo" → đoạn được bọc, nhãn "MẸO" hiện; chọn "Lưu ý" → nhãn đổi; "Bỏ callout" → trở lại đoạn thường.
4. "Nguồn tham khảo" → khối có danh sách số; Enter tạo mục 2; nút bị vô hiệu sau khi đã có khối. "Người góp ý" → nhập "TS. A" → dòng "Được góp ý bởi TS. A" hiện dưới danh sách.
5. "Video" → dán `https://youtu.be/dQw4w9WgXcQ` → khối xem trước có ảnh thu nhỏ và "Video YouTube · dQw4w9WgXcQ"; dán `https://vimeo.com/1` → dòng lỗi đỏ dưới toolbar, không chèn gì.
6. Cuộn dài: toolbar vẫn dính dưới header, không chui xuống dưới.
7. Lưu → tải lại trang → mọi khối còn nguyên.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/math-prompt.ts src/components/admin/FigureNodeView.tsx src/components/admin/VideoNodeView.tsx src/components/admin/editor-extensions.ts src/components/admin/EditorToolbar.tsx src/components/admin/PostEditor.tsx
git commit -m "feat(admin): toolbar buttons for formulas, figures, callouts, references and videos"
```

---

### Task 8: Trường chung của video trong admin

**Files:**
- Modify: `src/components/admin/SharedFieldsPanel.tsx`, `src/app/admin/(dashboard)/bai-viet/[id]/page.tsx`

**Interfaces:**
- Consumes: `saveSharedFields(translationId, SharedFieldsInput)` và `buildSharedFieldsPatch` (DA1, đã validate link/nguồn/tên kênh ≤ 120/uuid bài liên quan); `parseVideoUrl`, `PLATFORM_LABEL`, `watchUrl`.
- Produces: `export type LessonOption = { translationId: string; title: string }`; `SharedFieldsPanel` nhận thêm prop `lessonOptions: LessonOption[]`.

Không thêm unit test: toàn bộ luật validate nằm ở `buildSharedFieldsPatch` và đã có test (`src/lib/shared-fields.test.ts`); panel chỉ hiển thị kết quả `parseVideoUrl` (đã có test). Kiểm bằng trình duyệt ở Step 5.

- [ ] **Step 1: Panel** — `src/components/admin/SharedFieldsPanel.tsx`, theo thứ tự:

(a) Sau `import { readActionResult, sessionExpired } from "@/components/admin/actionResult";` thêm:

```tsx
import { PLATFORM_LABEL, parseVideoUrl } from "@/lib/video";

export type LessonOption = { translationId: string; title: string };

const SOURCE_TITLE: Record<VideoSource, string> = {
  own: "Tự làm",
  curated: "Tuyển chọn",
};
```

(b) Thay comment JSDoc của component (khối bắt đầu ` * Edits topic and difficulty for a lesson or video group`) bằng:

```tsx
/**
 * Edits the fields a lesson or video group shares — topic and difficulty, and
 * for a video its link, source, channel and related lesson. `saveSharedFields`
 * writes all of them in one UPDATE over both rows, so every field is always
 * sent, including the ones a lesson does not show.
 */
```

(c) Trong danh sách tham số, sau `relatedLessonTranslationId,` thêm `lessonOptions,`; trong kiểu props, sau `relatedLessonTranslationId: string | null;` thêm `lessonOptions: LessonOption[];`.

(d) Sau dòng `const [difficulty, setDifficulty] = useState<Difficulty | null>(initialDifficulty);` thêm:

```tsx
  const [url, setUrl] = useState(videoUrl);
  const [source, setSource] = useState<VideoSource | null>(videoSource);
  const [channel, setChannel] = useState(channelName);
  const [related, setRelated] = useState<string | null>(relatedLessonTranslationId);

  // Read as the writer types, so a link the server would refuse is caught here.
  const parsedVideo = url.trim() ? parseVideoUrl(url) : null;
  const videoUnreadable = kind === "video" && url.trim().length > 0 && parsedVideo === null;
```

(e) Trong `submit`, thay đối tượng gửi đi bằng:

```tsx
        await saveSharedFields(translationId, {
          topic,
          difficulty,
          videoUrl: url,
          videoSource: source,
          channelName: channel,
          relatedLessonTranslationId: related,
        })
```

(f) Thay `<h2 className="text-sm font-semibold text-text">Chủ đề &amp; độ khó</h2>` bằng:

```tsx
      <h2 className="text-sm font-semibold text-text">
        {kind === "video" ? "Thông tin video" : "Chủ đề & độ khó"}
      </h2>

      {kind === "video" && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Link video</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=… hoặc link TikTok"
              aria-invalid={videoUnreadable}
              aria-describedby="video-link-status"
              className="h-11 rounded-xl border border-border bg-surface px-4 font-mono text-sm outline-none focus:border-black/30"
            />
            <span
              id="video-link-status"
              className={cn("text-xs", videoUnreadable ? "text-red-700" : "text-text-muted")}
            >
              {parsedVideo
                ? `${PLATFORM_LABEL[parsedVideo.platform]} · ${parsedVideo.externalId}`
                : videoUnreadable
                  ? "Không đọc được link. Dán link YouTube hoặc TikTok."
                  : "Chưa có link — bài video cần link mới đăng được."}
            </span>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-medium text-text-muted">Nguồn</legend>
            <div className="flex flex-wrap gap-2">
              {(["own", "curated"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  aria-pressed={source === value}
                  className={cn(
                    "cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                    source === value
                      ? "border-border bg-surface-muted text-accent"
                      : "border-border bg-surface text-text-nav hover:border-black/20"
                  )}
                >
                  {SOURCE_TITLE[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Tên kênh</span>
            <input
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              maxLength={120}
              placeholder="Ví dụ: Veritasium"
              className="h-11 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Bài học liên quan</span>
            <select
              value={related ?? ""}
              onChange={(event) => setRelated(event.target.value || null)}
              className="h-11 cursor-pointer rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-black/30"
            >
              <option value="">Không có</option>
              {lessonOptions.map((lesson) => (
                <option key={lesson.translationId} value={lesson.translationId}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
```

(g) Nút lưu: đổi `disabled={pending || (kind === "lesson" && topic === null)}` thành `disabled={pending || (kind === "lesson" && topic === null) || videoUnreadable}` và nhãn `{pending ? "Đang lưu…" : "Lưu chủ đề & độ khó"}` thành `{pending ? "Đang lưu…" : kind === "video" ? "Lưu thông tin video" : "Lưu chủ đề & độ khó"}`.

- [ ] **Step 2: Trang sửa bài** — `src/app/admin/(dashboard)/bai-viet/[id]/page.tsx`:

(a) Đổi `import { SharedFieldsPanel } from "@/components/admin/SharedFieldsPanel";` thành `import { SharedFieldsPanel, type LessonOption } from "@/components/admin/SharedFieldsPanel";` và `import { embedUrl, type VideoPlatform } from "@/lib/video";` thành `import { watchUrl, type VideoPlatform } from "@/lib/video";`.

(b) Thay khối `const videoUrl = …` cùng comment ba dòng phía trên bằng:

```tsx
  // Rebuilt from the stored (platform, id) pair rather than read back as a
  // URL — see src/lib/video.ts. The watch link is what staff would paste, and
  // parseVideoUrl reads it back to the same pair.
  const videoUrl =
    primary.video_platform && primary.video_external_id
      ? watchUrl({ platform: primary.video_platform, externalId: primary.video_external_id })
      : "";

  // A video can point at one lesson; staff pick it by its Vietnamese title.
  let lessonOptions: LessonOption[] = [];
  if (primary.kind === "video") {
    const { data: lessons } = await supabase
      .from("posts")
      .select("translation_id, title")
      .eq("kind", "lesson")
      .eq("locale", "vi")
      .order("title");
    lessonOptions = (lessons ?? []).map((lesson) => ({
      translationId: lesson.translation_id as string,
      title: (lesson.title as string) || "(chưa có tiêu đề)",
    }));
  }
```

(c) Trong `<SharedFieldsPanel …>`, sau `relatedLessonTranslationId={primary.related_lesson_translation_id}` thêm `lessonOptions={lessonOptions}`.

- [ ] **Step 3: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, PASS.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: thành công.

- [ ] **Step 5: Kiểm trong trình duyệt** — mở một bài Video (tạo ở `/admin/bai-viet/moi` nếu chưa có):
1. Gõ `https://www.youtube.com/shorts/dQw4w9WgXcQ` → dòng dưới hiện "YouTube · dQw4w9WgXcQ"; gõ `https://evil.test/x` → chữ đỏ, nút lưu bị vô hiệu.
2. Chọn "Tuyển chọn", tên kênh "Veritasium", chọn một bài học → "Lưu thông tin video" → "Đã lưu."; tải lại → các giá trị còn nguyên, ô link hiện dạng `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.
3. Mở một bài học: bảng vẫn chỉ có chủ đề/độ khó, lưu vẫn chạy.
4. Đăng bài video (đủ hai bản) → thành công (cổng DB `video_incomplete` không còn chặn).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/SharedFieldsPanel.tsx "src/app/admin/(dashboard)/bai-viet/[id]/page.tsx"
git commit -m "feat(admin): edit a video's link, source, channel and related lesson"
```

---

### Task 9: Lõi dịch — `extractSegments` / `applyTranslations`

**Files:**
- Create: `src/lib/translate/segments.ts`
- Test: `src/lib/translate/segments.test.ts`

**Interfaces:**
- Consumes: không (thuần, không import gì của app).
- Produces:
  - `type DraftText = { title: string; excerpt: string; content: unknown }`
  - `type Segment = { id: string; text: string; target: Target }` (`id` dạng `s1, s2…` theo thứ tự tài liệu; `target` chỉ dùng ở server).
  - `type Translation = { id: string; text: string }`
  - `extractSegments(draft: DraftText): Segment[]`
  - `applyTranslations(draft: DraftText, segments: Segment[], translations: Translation[]): { draft: DraftText; untranslated: number }`
  - `MAX_TRANSLATION_CHARS = 60_000`; `prepareTranslation(draft: DraftText): { ok: true; segments: Segment[] } | { ok: false; error: string }`
  - Thẻ giữ chỗ: `<b> <i> <u> <s> <code> <mark>` (đóng mở), `<aN>…</aN>` (link thứ N), `<mN/>` (công thức inline thứ N), `<br/>`; chữ được thoát `&amp; &lt; &gt;`. Thứ tự mark khi dựng lại theo schema: `link, bold, code, italic, strike, underline, highlight` (Link có priority 1000; phần còn lại theo thứ tự StarterKit; Highlight đăng ký cuối) — nhờ vậy round-trip cho ra đúng JSON editor sinh.

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/translate/segments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyTranslations,
  prepareTranslation,
  extractSegments,
  type DraftText,
  type Translation,
} from "@/lib/translate/segments";

const doc = (...content: unknown[]) => ({ type: "doc", content });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const text = (value: string, marks?: unknown[]) => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});
const link = (href: string) => ({
  type: "link",
  attrs: { href, target: "_blank", rel: "noopener noreferrer nofollow", class: null },
});
const math = (latex: string) => ({ type: "inlineMath", attrs: { latex } });

const richDraft: DraftText = {
  title: "Chất bán dẫn",
  excerpt: "Vùng cấm & pha tạp",
  content: doc(
    { type: "heading", attrs: { level: 2, textAlign: null }, content: [text("Định nghĩa")] },
    p(
      text("Năng lượng "),
      math("E = hf"),
      text(" của "),
      text("photon", [{ type: "bold" }]),
      text(" xem "),
      text("Sze", [link("https://a.test/?x=1&y=2"), { type: "italic" }]),
      text(" và "),
      text("Kittel", [link("https://b.test")]),
      { type: "hardBreak" },
      text("V < 5 V", [{ type: "code" }])
    ),
    { type: "codeBlock", attrs: { language: null }, content: [text("int x = 1;")] },
    { type: "blockMath", attrs: { latex: "\\frac{1}{2}" } },
    {
      type: "callout",
      attrs: { variant: "tip" },
      content: [p(text("Mẹo nhớ", [{ type: "bold" }, { type: "italic" }]), text(" nhanh"))],
    },
    { type: "figure", attrs: { src: "https://c.test/w.png", alt: "Tấm wafer", caption: "Hình wafer" } },
    {
      type: "references",
      attrs: { reviewers: "TS. Nguyễn A" },
      content: [
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [{ type: "listItem", content: [p(text("Sze, Physics"))] }],
        },
      ],
    },
    p(math("x")),
    p()
  ),
};

const identity = (segments: { id: string; text: string }[]): Translation[] =>
  segments.map(({ id, text: value }) => ({ id, text: value }));

describe("extractSegments", () => {
  it("encodes marks, links, formulas and line breaks as placeholder tags", () => {
    const segments = extractSegments(richDraft);
    expect(segments.map(({ id, text: value }) => ({ id, text: value }))).toEqual([
      { id: "s1", text: "Chất bán dẫn" },
      { id: "s2", text: "Vùng cấm &amp; pha tạp" },
      { id: "s3", text: "Định nghĩa" },
      {
        id: "s4",
        text: "Năng lượng <m1/> của <b>photon</b> xem <a1><i>Sze</i></a1> và <a2>Kittel</a2><br/><code>V &lt; 5 V</code>",
      },
      { id: "s5", text: "<b><i>Mẹo nhớ</i></b> nhanh" },
      { id: "s6", text: "Tấm wafer" },
      { id: "s7", text: "Hình wafer" },
      { id: "s8", text: "TS. Nguyễn A" },
      { id: "s9", text: "Sze, Physics" },
    ]);
  });

  it("never sends code blocks, formulas or link targets", () => {
    const sent = extractSegments(richDraft).map((segment) => segment.text).join("\n");
    expect(sent).not.toContain("int x");
    expect(sent).not.toContain("frac");
    expect(sent).not.toContain("E = hf");
    expect(sent).not.toContain("a.test");
  });

  it("skips node types it does not know, even ones named like object properties", () => {
    const segments = extractSegments({
      title: "",
      excerpt: "",
      content: doc({ type: "constructor", attrs: {} }, { type: "toString" }, p(text("x"))),
    });
    expect(segments.map((segment) => segment.text)).toEqual(["x"]);
  });

  it("skips empty title, excerpt and blocks without words", () => {
    const segments = extractSegments({ title: " ", excerpt: "", content: doc(p(), p(math("x"))) });
    expect(segments).toEqual([]);
  });
});

describe("applyTranslations", () => {
  it("rebuilds exactly the original draft when every segment comes back unchanged", () => {
    const segments = extractSegments(richDraft);
    const result = applyTranslations(richDraft, segments, identity(segments));
    expect(result.untranslated).toBe(0);
    expect(result.draft).toEqual(richDraft);
  });

  it("keeps marks, link targets and formulas while replacing the words", () => {
    const segments = extractSegments(richDraft);
    const translations = identity(segments).map((t) =>
      t.id === "s4"
        ? {
            id: "s4",
            text: "The energy <m1/> of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V &lt; 5 V</code>",
          }
        : t
    );
    const { draft } = applyTranslations(richDraft, segments, translations);
    const paragraph = (draft.content as { content: { content: unknown[] }[] }).content[1];
    expect(paragraph.content).toEqual([
      text("The energy "),
      math("E = hf"),
      text(" of a "),
      text("photon", [{ type: "bold" }]),
      text(", see "),
      text("Sze", [link("https://a.test/?x=1&y=2"), { type: "italic" }]),
      text(" and "),
      text("Kittel", [link("https://b.test")]),
      { type: "hardBreak" },
      text("V < 5 V", [{ type: "code" }]),
    ]);
  });

  it("translates title, excerpt, caption, alt and reviewers as plain text", () => {
    const segments = extractSegments(richDraft);
    const english: Record<string, string> = {
      s1: "Semiconductors",
      s2: "Band gap &amp; doping",
      s6: "A wafer",
      s7: "Wafer figure",
      s8: "Dr. A Nguyen",
    };
    const translations = identity(segments).map((t) => ({ id: t.id, text: english[t.id] ?? t.text }));
    const { draft } = applyTranslations(richDraft, segments, translations);
    const blocks = (draft.content as { content: { attrs?: Record<string, unknown> }[] }).content;
    expect(draft.title).toBe("Semiconductors");
    expect(draft.excerpt).toBe("Band gap & doping");
    expect(blocks[5].attrs).toEqual({ src: "https://c.test/w.png", alt: "A wafer", caption: "Wafer figure" });
    expect(blocks[6].attrs).toEqual({ reviewers: "Dr. A Nguyen" });
  });

  it.each([
    ["a missing tag", "The energy of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V</code>"],
    ["an extra tag", "The <b>energy</b> <m1/> of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V</code>"],
    ["swapped links", "The energy <m1/> of a <b>photon</b>, see <a2>Kittel</a2> and <a1><i>Sze</i></a1><br/><code>V</code>"],
    ["an unknown formula", "The energy <m2/> of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V</code>"],
    ["an empty answer", "   "],
  ])("keeps the Vietnamese block and counts it when the answer has %s", (_label, answer) => {
    const segments = extractSegments(richDraft);
    const translations = identity(segments).map((t) => (t.id === "s4" ? { id: "s4", text: answer } : t));
    const { draft, untranslated } = applyTranslations(richDraft, segments, translations);
    expect(untranslated).toBe(1);
    expect(draft.content).toEqual(richDraft.content);
  });

  it("counts missing ids and ignores unknown or duplicate ones", () => {
    const segments = extractSegments(richDraft);
    const translations = [
      ...identity(segments).filter((t) => t.id !== "s3" && t.id !== "s9"),
      { id: "s99", text: "stray" },
      { id: "s1", text: "Second answer for s1" },
    ];
    const { draft, untranslated } = applyTranslations(richDraft, segments, translations);
    expect(untranslated).toBe(2);
    expect(draft.title).toBe("Chất bán dẫn");
  });

  it("does not modify the Vietnamese draft it was given", () => {
    const before = structuredClone(richDraft);
    const segments = extractSegments(richDraft);
    applyTranslations(
      richDraft,
      segments,
      segments.map(({ id }) => ({ id, text: id === "s3" ? "Definition" : "x" }))
    );
    expect(richDraft).toEqual(before);
  });
});

describe("prepareTranslation", () => {
  it("returns the segments of an ordinary article", () => {
    const result = prepareTranslation(richDraft);
    expect(result.ok && result.segments.length).toBe(9);
  });

  it("refuses an article with nothing to translate", () => {
    expect(prepareTranslation({ title: "", excerpt: "", content: doc(p(math("x"))) })).toEqual({
      ok: false,
      error: "Bản tiếng Việt chưa có chữ để dịch.",
    });
  });

  it("refuses more than 60 000 characters and says how many there are", () => {
    const long = { title: "", excerpt: "", content: doc(p(text("a".repeat(30_000))), p(text("b".repeat(30_001)))) };
    expect(prepareTranslation(long)).toEqual({
      ok: false,
      error: "Bài quá dài để dịch một lần: 60001 ký tự, tối đa 60000. Hãy tách bài hoặc dịch tay phần còn lại.",
    });
  });

  it("does not count code blocks, which are never sent", () => {
    const content = doc(p(text("Xin chào")), {
      type: "codeBlock",
      content: [text("x".repeat(70_000))],
    });
    expect(prepareTranslation({ title: "", excerpt: "", content }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/translate/segments.test.ts`
Expected: FAIL — `Cannot find module '@/lib/translate/segments'`.

- [ ] **Step 3: Viết `src/lib/translate/segments.ts`**

```ts
/**
 * Turns an article into plain strings a translation model can work on, and
 * puts its answers back into the article's own structure.
 *
 * The model never sees Tiptap JSON. Each text block becomes one segment whose
 * formatting is spelled as placeholder tags — `<b>…</b>`, `<a1>…</a1>` for the
 * first link, `<m1/>` for the first inline formula, `<br/>` — and the link
 * targets and formulas themselves stay here, on the server. A translation is
 * accepted only if it gives back exactly the same sequence of tags; otherwise
 * that block keeps its Vietnamese text and is counted as untranslated, so a
 * model that drops a link or mangles a formula can never corrupt the article.
 *
 * Code blocks and formulas are never sent. Pure: no network, no DOM.
 */

export type JsonMark = { type: string; attrs?: Record<string, unknown> };
export type JsonNode = {
  type?: string;
  text?: string;
  marks?: JsonMark[];
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
};

export type DraftText = { title: string; excerpt: string; content: unknown };

type Target =
  | { kind: "field"; field: "title" | "excerpt" }
  | { kind: "inline"; path: number[]; links: JsonMark[]; formulas: JsonNode[]; tags: string[] }
  | { kind: "attr"; path: number[]; attr: "alt" | "caption" | "reviewers" };

export type Segment = { id: string; text: string; target: Target };
export type Translation = { id: string; text: string };

/**
 * The schema's own mark order — Link has priority 1000, the rest keep
 * StarterKit's order, Highlight is registered last — so a rebuilt text node
 * lists its marks exactly as the editor would.
 */
const MARK_ORDER: readonly string[] = [
  "link",
  "bold",
  "code",
  "italic",
  "strike",
  "underline",
  "highlight",
];

const MARK_TAG: Record<string, string> = {
  bold: "b",
  code: "code",
  italic: "i",
  strike: "s",
  underline: "u",
  highlight: "mark",
};

const TAG_MARK: Record<string, string> = {
  b: "bold",
  code: "code",
  i: "italic",
  s: "strike",
  u: "underline",
  mark: "highlight",
};

const TEXT_BLOCKS = new Set(["paragraph", "heading"]);
const ATTR_SEGMENTS = new Map<string, readonly ("alt" | "caption" | "reviewers")[]>([
  ["image", ["alt"]],
  ["figure", ["alt", "caption"]],
  ["references", ["reviewers"]],
]);

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unescapeText(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function rank(mark: JsonMark): number {
  return MARK_ORDER.indexOf(mark.type);
}

function sameMark(a: JsonMark, b: JsonMark): boolean {
  return a.type === b.type && JSON.stringify(a.attrs ?? null) === JSON.stringify(b.attrs ?? null);
}

/** Encodes a text block's inline content, or returns null if it holds anything unknown. */
function encodeInline(
  content: JsonNode[]
): { text: string; links: JsonMark[]; formulas: JsonNode[]; tags: string[] } | null {
  const links: JsonMark[] = [];
  const formulas: JsonNode[] = [];
  const tags: string[] = [];
  const open: { mark: JsonMark; tag: string }[] = [];
  let text = "";

  const openTag = (mark: JsonMark): string => {
    if (mark.type !== "link") return MARK_TAG[mark.type];
    links.push(mark);
    return `a${links.length}`;
  };

  const closeTo = (depth: number) => {
    while (open.length > depth) {
      const { tag } = open[open.length - 1];
      open.pop();
      text += `</${tag}>`;
      tags.push(`/${tag}`);
    }
  };

  for (const node of content) {
    const isText = node.type === "text" && typeof node.text === "string";
    if (!isText && node.type !== "hardBreak" && node.type !== "inlineMath") return null;

    // Line breaks and formulas can carry marks too (a formula inside a link),
    // so every inline node goes through the same open/close bookkeeping.
    const marks = [...(node.marks ?? [])];
    if (marks.some((mark) => rank(mark) < 0)) return null;
    marks.sort((a, b) => rank(a) - rank(b));

    let common = 0;
    while (
      common < open.length &&
      common < marks.length &&
      sameMark(open[common].mark, marks[common])
    ) {
      common += 1;
    }
    closeTo(common);
    for (const mark of marks.slice(common)) {
      const tag = openTag(mark);
      open.push({ mark, tag });
      text += `<${tag}>`;
      tags.push(tag);
    }

    if (node.type === "hardBreak") {
      text += "<br/>";
      tags.push("br/");
    } else if (node.type === "inlineMath") {
      formulas.push(node);
      text += `<m${formulas.length}/>`;
      tags.push(`m${formulas.length}/`);
    } else {
      text += escapeText(node.text ?? "");
    }
  }
  closeTo(0);
  return { text, links, formulas, tags };
}

const TOKEN = /<(\/?)(b|i|u|s|code|mark|a\d+)>|<(br|m\d+)\/>/g;

function tagSequence(text: string): string[] {
  const tags: string[] = [];
  for (const match of text.matchAll(TOKEN)) {
    tags.push(match[3] ? `${match[3]}/` : `${match[1]}${match[2]}`);
  }
  return tags;
}

/** Rebuilds inline nodes from a translated string whose tag sequence was already checked. */
function decodeInline(text: string, links: JsonMark[], formulas: JsonNode[]): JsonNode[] {
  const nodes: JsonNode[] = [];
  const open: JsonMark[] = [];
  let last = 0;

  const pushText = (raw: string) => {
    if (!raw) return;
    const value = unescapeText(raw);
    const marks = [...open].sort((a, b) => rank(a) - rank(b));
    nodes.push(marks.length ? { type: "text", text: value, marks } : { type: "text", text: value });
  };

  for (const match of text.matchAll(TOKEN)) {
    pushText(text.slice(last, match.index));
    last = match.index + match[0].length;

    const [, closing, tag, empty] = match;
    if (empty === "br") {
      const marks = [...open].sort((a, b) => rank(a) - rank(b));
      nodes.push(marks.length ? { type: "hardBreak", marks } : { type: "hardBreak" });
    } else if (empty) {
      nodes.push(formulas[Number(empty.slice(1)) - 1]);
    } else if (closing) {
      open.pop();
    } else if (tag.startsWith("a")) {
      open.push(links[Number(tag.slice(1)) - 1]);
    } else {
      open.push({ type: TAG_MARK[tag] });
    }
  }
  pushText(text.slice(last));
  return nodes;
}

function hasWords(encoded: string): boolean {
  return encoded.replace(TOKEN, "").trim().length > 0;
}

export function extractSegments(draft: DraftText): Segment[] {
  const segments: Segment[] = [];
  const add = (text: string, target: Target) => {
    segments.push({ id: `s${segments.length + 1}`, text, target });
  };

  if (draft.title.trim()) add(escapeText(draft.title), { kind: "field", field: "title" });
  if (draft.excerpt.trim()) add(escapeText(draft.excerpt), { kind: "field", field: "excerpt" });

  const visit = (node: JsonNode, path: number[]) => {
    if (!node || typeof node !== "object") return;

    if (node.type && TEXT_BLOCKS.has(node.type)) {
      const encoded = encodeInline(Array.isArray(node.content) ? node.content : []);
      if (encoded && hasWords(encoded.text)) {
        add(encoded.text, {
          kind: "inline",
          path,
          links: encoded.links,
          formulas: encoded.formulas,
          tags: encoded.tags,
        });
      }
      return;
    }

    for (const attr of ATTR_SEGMENTS.get(node.type ?? "") ?? []) {
      const value = node.attrs?.[attr];
      if (typeof value === "string" && value.trim()) {
        add(escapeText(value), { kind: "attr", path, attr });
      }
    }

    // codeBlock text and formulas are never translated.
    if (node.type === "codeBlock") return;
    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => visit(child, [...path, index]));
    }
  };

  visit(draft.content as JsonNode, []);
  return segments;
}

function nodeAt(root: JsonNode, path: number[]): JsonNode | undefined {
  let node: JsonNode | undefined = root;
  for (const index of path) node = node?.content?.[index];
  return node;
}

/**
 * Builds the English draft from the Vietnamese one. `translations` may be in
 * any order, contain unknown ids (ignored) or miss some (kept Vietnamese).
 */
export function applyTranslations(
  draft: DraftText,
  segments: Segment[],
  translations: Translation[]
): { draft: DraftText; untranslated: number } {
  const byId = new Map<string, string>();
  for (const { id, text } of translations) {
    if (typeof id === "string" && typeof text === "string" && !byId.has(id)) byId.set(id, text);
  }

  const content = structuredClone(draft.content) as JsonNode;
  const result: DraftText = { title: draft.title, excerpt: draft.excerpt, content };
  let untranslated = 0;

  for (const segment of segments) {
    const text = byId.get(segment.id);
    const { target } = segment;
    const expected = target.kind === "inline" ? target.tags : [];

    if (
      text === undefined ||
      !hasWords(text) ||
      tagSequence(text).join(",") !== expected.join(",")
    ) {
      untranslated += 1;
      continue;
    }

    if (target.kind === "field") {
      result[target.field] = unescapeText(text).trim();
      continue;
    }

    const node = nodeAt(content, target.path);
    if (!node) {
      untranslated += 1;
    } else if (target.kind === "attr") {
      node.attrs = { ...node.attrs, [target.attr]: unescapeText(text).trim() };
    } else {
      node.content = decodeInline(text, target.links, target.formulas);
    }
  }

  return { draft: result, untranslated };
}

/** Characters one click may send to the translation model. */
export const MAX_TRANSLATION_CHARS = 60_000;

/**
 * The segments to send for one "translate" click, or why there are none.
 * Counts only what would actually leave the server.
 */
export function prepareTranslation(
  draft: DraftText
): { ok: true; segments: Segment[] } | { ok: false; error: string } {
  const segments = extractSegments(draft);
  if (segments.length === 0) {
    return { ok: false, error: "Bản tiếng Việt chưa có chữ để dịch." };
  }
  const size = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  if (size > MAX_TRANSLATION_CHARS) {
    return {
      ok: false,
      error: `Bài quá dài để dịch một lần: ${size} ký tự, tối đa ${MAX_TRANSLATION_CHARS}. Hãy tách bài hoặc dịch tay phần còn lại.`,
    };
  }
  return { ok: true, segments };
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/translate/segments.test.ts`
Expected: PASS (18 test).

- [ ] **Step 5: Kiểm và commit**

Run: `npm run typecheck && npm run lint`
Expected: 0 lỗi.

```bash
git add src/lib/translate/segments.ts src/lib/translate/segments.test.ts
git commit -m "feat(translate): encode article text as tagged segments and rebuild it safely

A translation is applied only when it returns exactly the same tag
sequence, so a model can never drop a link or corrupt a formula; failed
segments stay Vietnamese and are counted."
```

---

### Task 10: DeepSeek, Server Action `translateDraft` và nút ở tab EN

**Files:**
- Create: `src/lib/translate/glossary.ts`, `src/lib/translate/deepseek.ts`
- Test: `src/lib/translate/deepseek.test.ts`
- Modify: `src/app/admin/actions.ts`, `src/components/admin/PostEditor.tsx`, `src/app/admin/(dashboard)/bai-viet/[id]/page.tsx`

**Interfaces:**
- Consumes: `prepareTranslation`, `applyTranslations`, `type DraftText` (Task 9); `isUuid` (DA1); `readActionResult`, `sessionExpired`.
- Produces:
  - `GLOSSARY: readonly (readonly [string, string])[]`.
  - `type TranslateItem = { id: string; text: string }`; `class TranslateError extends Error`; `DEFAULT_MODEL = "deepseek-v4-pro"`; `BATCH_CHARS = 8000`; `batchSegments(items, limit?)`; `maxTokensFor(batch)`; `translateSegments(items, { apiKey, model?, fetchImpl?, deadline?, now? }): Promise<TranslateItem[]>`.
  - `type TranslateDraftResult = ActionResult & { draft?: DraftText; untranslated?: number; total?: number }`; `translateDraft(translationId: string): Promise<TranslateDraftResult>` — không ghi DB.
  - `PostEditor` nhận thêm prop `translateEnabled: boolean`; trang sửa bài `export const maxDuration = 120`.

DeepSeek (kiểm trên api-docs.deepseek.com ngày 28/09/2026): `POST https://api.deepseek.com/chat/completions`, OpenAI-compatible, `Authorization: Bearer <key>`; model `deepseek-v4-pro` (mặc định của dự án) và `deepseek-flash`; JSON mode `response_format: {type: "json_object"}` đòi prompt có chữ "json" và một ví dụ đầu ra; JSON mode đôi khi trả `content` rỗng; nên đặt `max_tokens` rộng.

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/translate/deepseek.test.ts` (không test nào chạm mạng: `fetchImpl` luôn là `vi.fn`):

```ts
import { describe, expect, it, vi } from "vitest";
import {
  BATCH_CHARS,
  DEFAULT_MODEL,
  TranslateError,
  batchSegments,
  maxTokensFor,
  translateSegments,
} from "@/lib/translate/deepseek";

const items = [
  { id: "s1", text: "Bán dẫn" },
  { id: "s2", text: "<b>Vùng cấm</b> <m1/>" },
];

function sentBody(fetchImpl: { mock: { calls: Parameters<typeof fetch>[] } }, call = 0) {
  return JSON.parse(String(fetchImpl.mock.calls[call][1]?.body));
}

function reply(content: unknown, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const good = JSON.stringify({
  translations: [
    { id: "s1", text: "Semiconductor" },
    { id: "s2", text: "<b>Band gap</b> <m1/>" },
  ],
});

describe("translateSegments", () => {
  it("posts one JSON-mode request with the key, the model and every segment", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(good));
    const result = await translateSegments(items, { apiKey: "test-key", fetchImpl });

    expect(result).toEqual([
      { id: "s1", text: "Semiconductor" },
      { id: "s2", text: "<b>Band gap</b> <m1/>" },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-key");
    const body = sentBody(fetchImpl);
    expect(body.model).toBe(DEFAULT_MODEL);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.temperature).toBeLessThanOrEqual(0.3);
    expect(body.max_tokens).toBe(maxTokensFor(items));
    expect(body.messages[0].content).toContain("JSON");
    expect(body.messages[0].content).toContain("Example output");
    expect(body.messages[0].content).toContain("vùng cấm = band gap");
    expect(JSON.parse(body.messages[1].content)).toEqual({ segments: items });
  });

  it("uses the configured model", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(good));
    await translateSegments(items, { apiKey: "k", model: "deepseek-flash", fetchImpl });
    expect(sentBody(fetchImpl).model).toBe("deepseek-flash");
  });

  it("retries exactly once when JSON mode answers with empty content", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(reply("")).mockResolvedValueOnce(reply(good));
    const result = await translateSegments(items, { apiKey: "k", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it("gives up with a friendly error after a second empty answer", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply("  "));
    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(
      "DeepSeek trả về bản dịch rỗng. Thử lại."
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("turns malformed JSON into a friendly error without leaking the reply", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply("{not json <secret>"));
    const error = await translateSegments(items, { apiKey: "k", fetchImpl }).catch((e) => e);
    expect(error).toBeInstanceOf(TranslateError);
    expect(error.message).toBe("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
  });

  it("drops entries that are not {id, text} strings", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      reply(JSON.stringify({ translations: [{ id: "s1", text: 5 }, null, { id: "s2", text: "ok" }] }))
    );
    expect(await translateSegments(items, { apiKey: "k", fetchImpl })).toEqual([{ id: "s2", text: "ok" }]);
  });

  it.each([
    [401, "Khoá DeepSeek không hợp lệ. Kiểm tra DEEPSEEK_API_KEY."],
    [402, "Tài khoản DeepSeek đã hết số dư."],
    [429, "DeepSeek đang quá tải. Thử lại sau ít phút."],
    [500, "DeepSeek không phản hồi được lúc này. Thử lại sau."],
  ])("maps HTTP %i to a friendly message", async (status, message) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("internal details", { status }));
    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(message);
  });

  it("reports a network failure or timeout in plain words", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted", "TimeoutError");
    });
    await expect(translateSegments(items, { apiKey: "k", fetchImpl })).rejects.toThrow(
      "Không kết nối được DeepSeek hoặc quá thời gian chờ. Thử lại."
    );
  });

  it("refuses to run without a key and never calls the network", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(translateSegments(items, { apiKey: undefined, fetchImpl })).rejects.toThrow(
      "Chưa cấu hình DEEPSEEK_API_KEY."
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends long input as sequential batches and stops starting new ones after the deadline", async () => {
    const long = Array.from({ length: 3 }, (_, i) => ({ id: `s${i + 1}`, text: "x".repeat(BATCH_CHARS - 10) }));
    let clock = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      clock += 40_000;
      const { segments } = JSON.parse(JSON.parse(String(init?.body)).messages[1].content);
      return reply(JSON.stringify({ translations: segments }));
    });
    const result = await translateSegments(long, {
      apiKey: "k",
      fetchImpl,
      deadline: 70_000,
      now: () => clock,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.map((r) => r.id)).toEqual(["s1", "s2"]);
  });
});

describe("batchSegments", () => {
  it("keeps order and never splits a segment", () => {
    const list = [
      { id: "a", text: "x".repeat(6) },
      { id: "b", text: "x".repeat(6) },
      { id: "c", text: "x".repeat(20) },
    ];
    expect(batchSegments(list, 10).map((batch) => batch.map((item) => item.id))).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ]);
    expect(batchSegments(list, 12).map((batch) => batch.map((item) => item.id))).toEqual([
      ["a", "b"],
      ["c"],
    ]);
    expect(batchSegments([], 10)).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/translate/deepseek.test.ts`
Expected: FAIL — `Cannot find module '@/lib/translate/deepseek'`.

- [ ] **Step 3: Tạo `src/lib/translate/glossary.ts`**

```ts
/**
 * Fixed Vietnamese → English terms for semiconductor lessons, sent with every
 * translation request so the same word is never rendered two ways across
 * articles. Add a term here rather than fixing it by hand in each article.
 */
export const GLOSSARY: readonly (readonly [string, string])[] = [
  ["bán dẫn", "semiconductor"],
  ["chất bán dẫn", "semiconductor material"],
  ["tấm wafer", "wafer"],
  ["vùng cấm", "band gap"],
  ["vùng dẫn", "conduction band"],
  ["vùng hoá trị", "valence band"],
  ["pha tạp", "doping"],
  ["bán dẫn loại n", "n-type semiconductor"],
  ["bán dẫn loại p", "p-type semiconductor"],
  ["lỗ trống", "hole"],
  ["hạt tải điện", "charge carrier"],
  ["tiếp giáp p-n", "p-n junction"],
  ["điốt", "diode"],
  ["bóng bán dẫn", "transistor"],
  ["vi mạch", "integrated circuit"],
  ["quang khắc", "photolithography"],
  ["khắc axit", "etching"],
  ["đóng gói", "packaging"],
  ["nhà máy chế tạo chip", "fab"],
  ["tiến trình", "process node"],
];
```

- [ ] **Step 4: Tạo `src/lib/translate/deepseek.ts`**

```ts
import "server-only";

import { GLOSSARY } from "@/lib/translate/glossary";

/**
 * Vietnamese → English draft translation through DeepSeek's OpenAI-compatible
 * chat API. Plain `fetch`, no SDK; `fetchImpl` and `now` exist so tests never
 * touch the network or the clock.
 *
 * Only article text is ever sent — never emails, comments or reader data.
 */

export type TranslateItem = { id: string; text: string };

export class TranslateError extends Error {}

export const DEFAULT_MODEL = "deepseek-v4-pro";
const ENDPOINT = "https://api.deepseek.com/chat/completions";
/** Characters of segment text per request, so one answer fits in max_tokens. */
export const BATCH_CHARS = 8000;
const REQUEST_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = [
  "You translate Vietnamese lesson text about semiconductors into English for high-school students.",
  "The input is JSON: {\"segments\": [{\"id\": string, \"text\": string}]}.",
  "Reply with JSON only, in the form {\"translations\": [{\"id\": string, \"text\": string}]}, one entry per input segment, same ids.",
  "Each text may contain placeholder tags: <b>…</b>, <i>…</i>, <u>…</u>, <s>…</s>, <code>…</code>, <mark>…</mark>, <a1>…</a1> (links, numbered), <m1/> (formulas, numbered) and <br/>.",
  "Keep every tag exactly once and in the same order; translate only the words between them. Never translate the text inside <code>…</code>.",
  "Keep the entities &amp; &lt; &gt; as they are. Do not add, drop or explain anything.",
  "Use this glossary: " + GLOSSARY.map(([vi, en]) => `${vi} = ${en}`).join("; ") + ".",
  "Example input: {\"segments\": [{\"id\": \"s1\", \"text\": \"<b>Bán dẫn</b> có vùng cấm <m1/>.\"}]}",
  "Example output: {\"translations\": [{\"id\": \"s1\", \"text\": \"<b>Semiconductors</b> have a band gap <m1/>.\"}]}",
].join("\n");

/** Splits segments into requests of at most `limit` characters, keeping order. */
export function batchSegments(items: TranslateItem[], limit = BATCH_CHARS): TranslateItem[][] {
  const batches: TranslateItem[][] = [];
  let current: TranslateItem[] = [];
  let size = 0;
  for (const item of items) {
    if (current.length > 0 && size + item.text.length > limit) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += item.text.length;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/** Output room for one batch: English plus JSON framing rarely exceeds the input. */
export function maxTokensFor(batch: TranslateItem[]): number {
  const chars = batch.reduce((sum, item) => sum + item.text.length, 0);
  return Math.min(8192, 1024 + chars);
}

function statusMessage(status: number): string {
  if (status === 401) return "Khoá DeepSeek không hợp lệ. Kiểm tra DEEPSEEK_API_KEY.";
  if (status === 402) return "Tài khoản DeepSeek đã hết số dư.";
  if (status === 429) return "DeepSeek đang quá tải. Thử lại sau ít phút.";
  return "DeepSeek không phản hồi được lúc này. Thử lại sau.";
}

function parseTranslations(content: string): TranslateItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new TranslateError("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
  }
  const list = (parsed as { translations?: unknown } | null)?.translations;
  if (!Array.isArray(list)) {
    throw new TranslateError("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
  }
  return list.flatMap((entry: unknown) => {
    const { id, text } = (entry ?? {}) as { id?: unknown; text?: unknown };
    return typeof id === "string" && typeof text === "string" ? [{ id, text }] : [];
  });
}

type Options = {
  apiKey: string | undefined;
  model?: string;
  fetchImpl?: typeof fetch;
  /** Epoch ms after which no new batch is started; later segments stay Vietnamese. */
  deadline?: number;
  now?: () => number;
};

async function requestBatch(
  batch: TranslateItem[],
  { apiKey, model, fetchImpl, timeoutMs }: { apiKey: string; model: string; fetchImpl: typeof fetch; timeoutMs: number }
): Promise<TranslateItem[]> {
  // JSON mode sometimes answers with empty content; one retry is enough.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ segments: batch }) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: maxTokensFor(batch),
          stream: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new TranslateError("Không kết nối được DeepSeek hoặc quá thời gian chờ. Thử lại.");
    }

    if (!response.ok) throw new TranslateError(statusMessage(response.status));

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new TranslateError("DeepSeek trả về dữ liệu không đọc được. Thử lại.");
    }
    const content = (body as { choices?: { message?: { content?: unknown } }[] } | null)
      ?.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return parseTranslations(content);
  }
  throw new TranslateError("DeepSeek trả về bản dịch rỗng. Thử lại.");
}

/**
 * Translates segments batch by batch, in order. Returns every translation
 * received; segments of batches skipped because of `deadline` are simply
 * absent, and the caller keeps them in Vietnamese.
 */
export async function translateSegments(
  items: TranslateItem[],
  { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch, deadline = Infinity, now = Date.now }: Options
): Promise<TranslateItem[]> {
  if (!apiKey) throw new TranslateError("Chưa cấu hình DEEPSEEK_API_KEY.");

  const results: TranslateItem[] = [];
  for (const batch of batchSegments(items)) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    const timeoutMs = Math.min(REQUEST_TIMEOUT_MS, remaining);
    results.push(...(await requestBatch(batch, { apiKey, model, fetchImpl, timeoutMs })));
  }
  return results;
}
```

- [ ] **Step 5: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/translate`
Expected: PASS (`deepseek.test.ts` 14 test, `segments.test.ts` 18 test).

- [ ] **Step 6: Server Action** — `src/app/admin/actions.ts`:

Sau dòng `import { revalidatePostRows, type PostRow } from "@/lib/revalidate-paths";` thêm:

```ts
import { TranslateError, translateSegments } from "@/lib/translate/deepseek";
import {
  applyTranslations,
  prepareTranslation,
  type DraftText,
} from "@/lib/translate/segments";
```

Ngay trước `/** Signs out and returns to the login screen. */` thêm:

```ts
/** Leaves room under the edit page's `maxDuration` (120 s) for the DB read and the reply. */
const TRANSLATE_BUDGET_MS = 100_000;

export type TranslateDraftResult = ActionResult & {
  draft?: DraftText;
  /** Segments kept in Vietnamese because the model's answer did not fit. */
  untranslated?: number;
  total?: number;
};

/**
 * Drafts the English version of a group from its saved Vietnamese row.
 *
 * Writes nothing: the editor loads the result into the EN tab as unsaved
 * changes, and the writer saves through `savePost` after reading it. Only the
 * article's own text goes to DeepSeek.
 */
export async function translateDraft(translationId: string): Promise<TranslateDraftResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(translationId)) return fail("Mã bài viết không hợp lệ.");

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fail("Chưa cấu hình DEEPSEEK_API_KEY nên chưa dịch bằng AI được.");

  const startedAt = Date.now();
  const { data: vi } = await createClient()
    .from("posts")
    .select("title, excerpt, content")
    .eq("translation_id", translationId)
    .eq("locale", "vi")
    .maybeSingle();

  if (!vi) return fail("Không tìm thấy bản tiếng Việt của bài này.");

  const source: DraftText = {
    title: vi.title ?? "",
    excerpt: vi.excerpt ?? "",
    content: vi.content ?? { type: "doc", content: [] },
  };

  const prepared = prepareTranslation(source);
  if (!prepared.ok) return fail(prepared.error);

  try {
    const translations = await translateSegments(
      prepared.segments.map(({ id, text }) => ({ id, text })),
      {
        apiKey,
        model: process.env.DEEPSEEK_MODEL || undefined,
        deadline: startedAt + TRANSLATE_BUDGET_MS,
      }
    );
    const { draft, untranslated } = applyTranslations(source, prepared.segments, translations);
    return { ok: true, draft, untranslated, total: prepared.segments.length };
  } catch (error) {
    if (error instanceof TranslateError) return fail(error.message);
    return fail("Không dịch được lúc này. Thử lại sau.");
  }
}

```

(`"use server"` chỉ cho export hàm async; `TRANSLATE_BUDGET_MS` không export, `TranslateDraftResult` là type nên bị xoá khi biên dịch.)

- [ ] **Step 7: Nút ở tab EN** — `src/components/admin/PostEditor.tsx`:

(a) Đổi `import { Check, ImagePlus, TriangleAlert } from "lucide-react";` thành `import { Check, ImagePlus, Languages, TriangleAlert } from "lucide-react";` và dòng `import { publishTranslation, savePost, unpublishTranslation } from "@/app/admin/actions";` thành:

```tsx
import {
  publishTranslation,
  savePost,
  translateDraft,
  unpublishTranslation,
} from "@/app/admin/actions";
```

(b) Thay chữ ký component:

```tsx
export function PostEditor({
  translationId,
  initialDrafts,
  status,
  translateEnabled,
}: {
  translationId: string;
  initialDrafts: Record<Locale, Draft>;
  status: "draft" | "published";
  /** Whether the server has a DeepSeek key; the button explains itself when not. */
  translateEnabled: boolean;
}) {
```

(c) Sau `const [uploadingCover, setUploadingCover] = useState(false);` thêm `const [translating, setTranslating] = useState(false);`.

(d) Ngay trước `  const current = drafts[active];` thêm:

```tsx
  const runTranslate = () => {
    const en = draftsRef.current.en;
    const hasEnglish =
      en.title.trim().length > 0 ||
      en.excerpt.trim().length > 0 ||
      (en.content?.content?.length ?? 0) > 0;
    if (
      hasEnglish &&
      !window.confirm("Bản tiếng Anh đang có nội dung. Thay toàn bộ bằng bản dịch nháp?")
    ) {
      return;
    }

    setTranslating(true);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = readActionResult(await translateDraft(translationId));
        if (!result) return;
        if (sessionExpired(result)) {
          router.replace("/admin/dang-nhap");
          return;
        }
        if (!result.ok || !result.draft) {
          setState("error");
          setMessage(result.error ?? "Không dịch được.");
          return;
        }

        const content = result.draft.content as JSONContent;
        updateDraft("en", {
          title: result.draft.title,
          excerpt: result.draft.excerpt,
          content,
        });
        // The reader may have switched tabs while the request ran; only the
        // EN tab's editor content is replaced, never the VI one on screen.
        if (activeRef.current === "en") {
          editor
            ?.chain()
            .setMeta("addToHistory", false)
            .setContent(content, { emitUpdate: false })
            .run();
        }
        setState("idle");
        setMessage(
          result.untranslated
            ? `Đã dịch nháp. ${result.untranslated}/${result.total} đoạn vẫn là tiếng Việt vì bản dịch làm hỏng định dạng — hãy dịch tay các đoạn đó, đọc lại rồi bấm "Lưu".`
            : 'Đã dịch nháp. Đọc lại, sửa chỗ chưa ổn rồi bấm "Lưu".'
        );
      } finally {
        setTranslating(false);
      }
    });
  };

```

(e) Ngay trước comment `{/* Metadata for the active locale */}` thêm:

```tsx
      {active === "en" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <button
            type="button"
            onClick={runTranslate}
            disabled={!translateEnabled || translating || dirty.vi || !current.id}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Languages className="size-4" strokeWidth={2.2} />
            {translating ? "Đang dịch…" : "Dịch nháp bằng AI"}
          </button>
          <p className="text-xs text-text-muted">
            {!translateEnabled
              ? "Chưa bật: máy chủ chưa có DEEPSEEK_API_KEY."
              : dirty.vi
                ? "Lưu bản tiếng Việt trước — bản dịch lấy từ bản đã lưu."
                : "Dịch từ bản tiếng Việt đã lưu bằng DeepSeek. Công thức, ảnh và link giữ nguyên; kết quả chưa được lưu cho tới khi bạn bấm \"Lưu\"."}
          </p>
        </div>
      )}

```

- [ ] **Step 8: Trang sửa bài** — `src/app/admin/(dashboard)/bai-viet/[id]/page.tsx`:

Sau `export const dynamic = "force-dynamic";` thêm:

```tsx
// "Dịch nháp bằng AI" runs as a Server Action of this page and may send
// several sequential requests to DeepSeek (see translateDraft).
export const maxDuration = 120;
```

Trong `<PostEditor …>`, sau `status={primary.status}` thêm `translateEnabled={Boolean(process.env.DEEPSEEK_API_KEY)}`.

- [ ] **Step 9: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: 0 lỗi, PASS, build thành công.

- [ ] **Step 10: Kiểm trong trình duyệt**
1. Không đặt `DEEPSEEK_API_KEY` trong `.env.local` → tab EN: nút "Dịch nháp bằng AI" mờ, dòng "Chưa bật: máy chủ chưa có DEEPSEEK_API_KEY.". (Không mở/sửa file env bằng công cụ của agent — chủ dự án tự đặt biến.)
2. Có key (chỉ khi chủ dự án đã tự đặt; không tạo, không commit, không in ra): sửa một chữ ở tab VI mà chưa lưu → nút mờ với lời nhắc lưu trước. Lưu → tab EN → bấm → nếu EN đã có nội dung thì hỏi xác nhận → chờ → EN được điền: tiêu đề, tóm tắt, công thức hiện như bản VI, link cùng địa chỉ, hình cùng ảnh, chấm đỏ "chưa lưu" ở tab EN, thông báo số đoạn giữ tiếng Việt nếu có.
3. Bấm dịch rồi chuyển ngay sang tab VI → khi xong, nội dung VI trên màn hình **không đổi**; quay lại EN → thấy bản dịch. *(Review Focus 5)*
4. Bấm "Lưu" → tải lại → bản EN còn nguyên.

- [ ] **Step 11: Commit**

```bash
git add src/lib/translate/glossary.ts src/lib/translate/deepseek.ts src/lib/translate/deepseek.test.ts src/app/admin/actions.ts src/components/admin/PostEditor.tsx "src/app/admin/(dashboard)/bai-viet/[id]/page.tsx"
git commit -m "feat(admin): draft the English version with DeepSeek from the saved Vietnamese

The action writes nothing; the editor loads the result into the EN tab as
unsaved changes. Requests are batched, retried once on empty JSON-mode
content and stop starting new batches before the page's maxDuration."
```

---

### Task 11: Nợ DA1 — gỡ đăng/xoá làm mới trang của chính bài

**Files:**
- Modify: `src/lib/revalidate-paths.ts`, `src/app/admin/actions.ts`
- Test: `src/lib/revalidate-paths.test.ts`

**Interfaces:**
- Consumes: `revalidatePostRows(rows: PostRow[]): string[]`, `type PostRow` (DA1).
- Produces: `postRowsFrom(rows: { locale: string; slug: string; kind: string; topic: string | null }[] | null): PostRow[]` — bỏ dòng có locale/kind lạ, topic lạ thành `null`.

- [ ] **Step 1: Viết test thất bại** — `src/lib/revalidate-paths.test.ts`: đổi import thành `import { postRowsFrom, revalidatePostRows, type PostRow } from "@/lib/revalidate-paths";` và thêm cuối file:

```ts
describe("postRowsFrom", () => {
  it("lets unpublishing or deleting a lesson clear its own detail and topic pages in both locales", () => {
    const paths = revalidatePostRows(
      postRowsFrom([
        { locale: "vi", slug: "chat-ban-dan", kind: "lesson", topic: "nguyen-ly" },
        { locale: "en", slug: "semiconductors", kind: "lesson", topic: "nguyen-ly" },
      ])
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/chat-ban-dan",
        "/en/lessons/nguyen-ly",
        "/en/lessons/nguyen-ly/semiconductors",
      ])
    );
  });

  it("lets unpublishing or deleting a blog post clear its own detail pages", () => {
    const paths = revalidatePostRows(
      postRowsFrom([
        { locale: "vi", slug: "tin-vi", kind: "forum", topic: null },
        { locale: "en", slug: "news-en", kind: "forum", topic: null },
      ])
    );
    expect(paths).toEqual(expect.arrayContaining(["/vi/blog/tin-vi", "/en/blog/news-en"]));
  });

  it("skips rows it cannot place and treats an unknown topic as none", () => {
    expect(
      postRowsFrom([
        { locale: "fr", slug: "x", kind: "lesson", topic: "nguyen-ly" },
        { locale: "vi", slug: "y", kind: "podcast", topic: null },
        { locale: "vi", slug: "z", kind: "lesson", topic: "khong-co" },
      ])
    ).toEqual([{ locale: "vi", slug: "z", kind: "lesson", topic: null }]);
    expect(postRowsFrom(null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/revalidate-paths.test.ts`
Expected: FAIL — `postRowsFrom is not a function`.

- [ ] **Step 3: Thêm `postRowsFrom`** — `src/lib/revalidate-paths.ts`: đổi `import type { TopicId } from "@/lib/constants";` thành `import { TOPIC_IDS, type TopicId } from "@/lib/constants";`, rồi thêm cuối file:

```ts
const POST_KINDS: readonly string[] = ["lesson", "forum", "video"];

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

function isPostKind(value: string): value is PostKind {
  return POST_KINDS.includes(value);
}

function isTopicId(value: string | null): value is TopicId {
  return value !== null && (TOPIC_IDS as readonly string[]).includes(value);
}

/**
 * Turns `posts` rows as read back from the database (`locale, slug, kind,
 * topic`) into PostRow values. A row whose locale or kind is not one the app
 * knows is skipped rather than guessed at.
 */
export function postRowsFrom(
  rows: { locale: string; slug: string; kind: string; topic: string | null }[] | null
): PostRow[] {
  return (rows ?? []).flatMap((row) =>
    isLocale(row.locale) && isPostKind(row.kind)
      ? [{ locale: row.locale, slug: row.slug, kind: row.kind, topic: isTopicId(row.topic) ? row.topic : null }]
      : []
  );
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/revalidate-paths.test.ts`
Expected: PASS.

- [ ] **Step 5: Dùng trong hai action** — `src/app/admin/actions.ts`: đổi `revalidatePostRows, type PostRow` trong import thành `postRowsFrom, revalidatePostRows, type PostRow`, rồi thay trọn hai hàm `unpublishTranslation` và `deleteTranslation` bằng:

```ts
export async function unpublishTranslation(
  translationId: string
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();

  // Read first: the group's own detail and topic pages are cached too, and
  // only the rows know their slugs and topic.
  const { data: rows } = await supabase
    .from("posts")
    .select("locale, slug, kind, topic")
    .eq("translation_id", translationId);

  const { error } = await supabase.rpc("unpublish_translation", {
    p_translation_id: translationId,
  });

  if (error) return fail(error.message);

  await revalidatePost(postRowsFrom(rows));
  return { ok: true };
}

export async function deleteTranslation(
  translationId: string
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();

  // After the delete there is nothing left to read the slugs from.
  const { data: rows } = await supabase
    .from("posts")
    .select("locale, slug, kind, topic")
    .eq("translation_id", translationId);

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  await revalidatePost(postRowsFrom(rows));
  return { ok: true };
}
```

`revalidatePostRows` luôn thêm `/`, `/blog`, `/bai-hoc` của cả hai locale, nên các trang danh sách trước đây được làm mới vẫn được làm mới. `routing` vẫn được `setCommentHidden`/`deleteComment` dùng — giữ import.

- [ ] **Step 6: Kiểm và commit**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, PASS.

```bash
git add src/lib/revalidate-paths.ts src/lib/revalidate-paths.test.ts src/app/admin/actions.ts
git commit -m "fix(admin): revalidate a post's own pages when it is unpublished or deleted"
```

---
### Task 12: Nghiệm thu toàn bộ DA2 và README

**Files:**
- Modify: `README.md`
- Sửa chỗ hỏng nếu nghiệm thu phát hiện, mỗi lỗi một commit `fix:` kèm test hồi quy nếu kiểm được bằng Vitest.

**Interfaces:**
- Consumes: mọi thứ ở Task 1–11.
- Produces: README mô tả biến môi trường DeepSeek, quyền riêng tư và luồng render mới.

- [ ] **Step 1: Cổng cục bộ**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: tất cả xanh. Ghi số test trong báo cáo (143 test trước DA2, 225 sau DA2).

- [ ] **Step 2: Kiểm bảo mật DB** (DA2 không có migration; **không** `db reset`)

Run: `npx supabase start && ./scripts/verify-security.sh`
Expected: `Tất cả kiểm tra đều đạt.`

- [ ] **Step 3: Chạy app**

Run: `NODE_ENV=development npx next dev -p 3000`

- [ ] **Step 4: Nghiệm thu bằng trình duyệt** (đăng nhập admin local theo `docs/BAN-GIAO.md` mục 1)

1. Tạo một Bài học. Bản VI có: một heading `Định luật ` + công thức inline `E = hf`; một đoạn có công thức inline; một công thức khối `\frac{1}{2}mv^2`; hai hình có chú thích (một hình không chú thích); bốn callout (Ghi chú, Mẹo, Lưu ý, Ví dụ); một video YouTube và một video TikTok; khối Nguồn tham khảo với một link `https://example.com/?a=1&b=2` và người góp ý "TS. A". Điền bản EN (dịch tay hoặc bằng nút AI nếu có key), đặt độ khó, Lưu, Đăng.
2. Mở `/vi/bai-hoc/<topic>/<slug>`:
   - Công thức hiện đúng; DevTools → tắt JavaScript → tải lại → công thức **vẫn** hiện (render ở server). View source: không có `data-latex`, không có `<iframe`.
   - Hình có chú thích đánh số "Hình 1.", "Hình 2."; hình không chú thích không có số.
   - Callout có nhãn "GHI CHÚ", "MẸO", "LƯU Ý", "VÍ DỤ"; chữ đọc rõ trên nền xám.
   - Khối cuối có tiêu đề "Nguồn tham khảo", dòng "Được góp ý bởi TS. A"; bấm link → tab mới tới đúng `?a=1&b=2`.
   - Mục lục có "Định luật E = hf", bấm vào nhảy đúng heading.
   - Video: ảnh xem trước YouTube, khung TikTok dọc; bấm → player hiện và chạy; Console **không** có lỗi CSP. Cmd/Ctrl-click facade → mở video ở tab mới. Khi JavaScript tắt, bấm facade → mở video ở tab mới.
3. Mở bản EN (`/en/lessons/<topic>/<slug>`): "Figure 1.", "NOTE/TIP/WARNING/EXAMPLE", "References", "Reviewed by TS. A".
4. Không có `DEEPSEEK_API_KEY`: tab EN có nút "Dịch nháp bằng AI" tắt kèm giải thích. Có key (chủ dự án tự đặt): dịch thử một bài, kiểm công thức/ảnh/link giữ nguyên, chuyển tab trong lúc dịch không làm hỏng bản VI.
5. Nợ DA1: bấm "Bỏ đăng" bài vừa đăng → mở lại ngay URL chi tiết VI và EN → 404 (không còn bản cache); trang chủ đề không còn liệt kê bài. Đăng lại, rồi xoá một bài blog đã đăng → URL chi tiết của nó 404 ngay.
6. Bài video: sửa link/nguồn/kênh/bài liên quan trong "Thông tin video" → lưu được; đăng được khi có link.

- [ ] **Step 5: Cập nhật `README.md`**

(a) Thay dòng `Hai biến tuỳ chọn, nên đặt khi lên production:` bằng `Các biến tuỳ chọn:` và thêm hai dòng cuối bảng (sau dòng `TRUSTED_PROXY_HOPS`):

```markdown
| `DEEPSEEK_API_KEY` | (trống) | Bật nút "Dịch nháp bằng AI" ở tab EN của trình soạn bài. Không có thì nút tắt kèm lời giải thích. Chỉ đặt ở server (không có tiền tố `NEXT_PUBLIC_`). |
| `DEEPSEEK_MODEL` | `deepseek-v4-pro` | Model DeepSeek dùng để dịch nháp, ví dụ `deepseek-flash` nếu muốn rẻ và nhanh hơn. |
```

(b) Ngay sau bảng đó thêm:

```markdown
`.env.example` chưa có hai biến DeepSeek — chủ dự án tự thêm (công cụ tự động không đọc được file này).

DA2 (công cụ viết bài) **không có migration mới**: chỉ cần deploy code; đặt `DEEPSEEK_API_KEY` nếu muốn dùng dịch nháp.

### Dịch nháp bằng AI và quyền riêng tư

Nút "Dịch nháp bằng AI" gửi **nội dung bài viết** (tiêu đề, tóm tắt, chữ trong thân bài, chú thích và mô tả ảnh, dòng người góp ý) tới máy chủ của DeepSeek (`api.deepseek.com`) để dịch. Không gửi email, bình luận, tin nhắn hay bất kỳ dữ liệu nào của người đọc; công thức, khối mã và địa chỉ link không rời server. Bản dịch chỉ được nạp vào tab EN như thay đổi chưa lưu — không có gì được ghi vào cơ sở dữ liệu cho tới khi người viết đọc lại và bấm "Lưu". Mỗi lần bấm gửi tối đa 60 000 ký tự.
```

(c) Thay đoạn:

```markdown
**Nội dung bài viết** lưu dạng Tiptap JSON, render sang HTML ở server qua
`generateHTML` rồi cho qua DOMPurify với allow-list. Không lưu HTML thô.
```

bằng:

```markdown
**Nội dung bài viết** lưu dạng Tiptap JSON, render sang HTML ở server qua
`generateHTML` rồi cho qua bộ lọc allow-list không cần DOM
(`src/lib/tiptap/sanitize.ts`). Công thức (KaTeX) và khung video được dựng
**sau** bước lọc, chỉ từ dữ liệu đã kiểm tra: chuỗi LaTeX lấy thẳng từ JSON và
ID video khớp regex của nền tảng. Không lưu HTML thô. Video chỉ tải player
YouTube/TikTok khi người đọc bấm vào.
```

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: document DeepSeek settings, translation privacy and the render pipeline"
```

---

## Đối chiếu spec

| Spec | Task |
|---|---|
| §2 schema một nguồn, không lưu HTML, dựng sau sanitize từ dữ liệu đã kiểm tra, không DOM, dependency giới hạn | 1, 2, 3–6 (`extensions.ts`, `prepare.ts`, `math.ts`, `video-embed.ts`) |
| §3.1 công thức inline/khối, toolbar, KaTeX tuỳ chọn đúng spec, allow-list, CSS, `\href` không sinh `<a>` | 2 (render, test bảo mật), 7 (toolbar, click để sửa) |
| §3.2 figure `src/alt/caption`, lazy, upload sẵn có, sửa tại chỗ, đánh số `:lang()`, `src` https/Supabase | 3, 7 |
| §3.3 callout 4 loại, rơi về `note` khi parse và render, nhãn CSS, xám trung tính AA | 4, 7 |
| §3.4 references `ol` + `reviewers`, tiêu đề CSS, link Link extension, một khối mỗi bài | 5, 7 (lệch HTML: mục 3) |
| §3.5 video node, `parseVideoUrl`, facade chỉ khi ID khớp regex, ảnh `i.ytimg.com`, client đổi sang iframe, không JS là link, CSP | 6, 7 |
| §3.6 headings/TOC không hỏng, `articleToPlainText` gồm chú thích/callout/nguồn/LaTeX | 1, 2, 3–6 |
| §4.1 nhóm nút toolbar, giữ sticky | 7 |
| §4.2 trường chung video (link + nền tảng/ID khi gõ, nguồn, kênh, bài học liên quan) | 8 |
| §4.3 luồng dịch, xác nhận, không ghi DB, bảo toàn cấu trúc, `untranslated`, DeepSeek header/model/JSON mode/temperature/max_tokens/timeout/thử lại/lỗi thân thiện/chia lô/60 000/uuid/staff/`maxDuration` 120, thuật ngữ, cấu hình, quyền riêng tư | 9, 10, 12 (README) |
| §5 nợ DA1 gỡ đăng/xoá | 11 |
| §6 kiểm thử Vitest và nghiệm thu trình duyệt | 1–6, 9–11, 12 |
| §7 rủi ro: đo HTML thật của mathematics trước khi viết `renderMath` | mục "Đo thực tế" + test Task 2 |

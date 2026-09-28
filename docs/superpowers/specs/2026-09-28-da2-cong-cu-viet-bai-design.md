# DA2 — Công cụ viết bài

Ngày: 28/09/2026 · Trạng thái: đã duyệt thiết kế · Lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md` · Nền: DA1 (`2026-09-28-da1-nen-du-lieu-design.md`)

## 1. Mục tiêu

Giúp một người viết nhanh những bài học bán dẫn song ngữ, có công thức, hình, callout, nguồn tham khảo và video, rồi dịch nháp sang tiếng Anh bằng AI để chỉ còn việc đọc sửa.

**Xong khi:**
- Editor chèn và sửa được công thức inline và khối, hình có chú thích, callout 4 loại, khối nguồn tham khảo, video nhúng. Trang bài công khai render đủ các khối đó ở server; công thức hiện đúng mà không cần JS phía người đọc.
- Nhóm dịch loại video sửa được link, nguồn, tên kênh và bài học liên quan trong admin.
- Tab EN có nút "Dịch nháp bằng AI" (DeepSeek). Bấm vào, bản EN được điền đúng cấu trúc: công thức, ảnh và link giữ nguyên, chữ được dịch. Không có key thì nút tắt kèm giải thích.
- Gỡ đăng hoặc xoá bài thì trang chi tiết và trang chủ đề của chính bài đó được làm mới (nợ từ DA1).
- `tsc`, `lint`, `vitest`, `build` và `verify-security.sh` đều sạch; nghiệm thu bằng trình duyệt.

**Ngoài phạm vi:** trang Video công khai và ô tìm kiếm (DA3); vẽ sơ đồ trong editor; dịch EN sang VI.

## 2. Nguyên tắc

- `src/lib/tiptap/extensions.ts` vẫn là nguồn duy nhất của schema, dùng chung cho editor và renderer; node mới phải có ở đó.
- Không lưu HTML. Nội dung là Tiptap JSON; HTML được dựng ở server rồi qua `sanitizeArticleHtml`.
- Mọi thứ không qua được allow-list (KaTeX, video) được dựng **sau** bước sanitize, **chỉ từ dữ liệu đã kiểm tra** (chuỗi LaTeX, ID video đã khớp regex), không bao giờ nới allow-list cho HTML tuỳ ý.
- Không thư viện cần DOM trong đường render server (bài học jsdom → 500 trên Vercel).
- Dependency mới chỉ gồm: `@tiptap/extension-mathematics@3.31.3` (khớp đúng phiên bản Tiptap) và `katex`. Không thêm SDK cho DeepSeek; gọi bằng `fetch`.

## 3. Node và render

### 3.1 Công thức

- Editor: `@tiptap/extension-mathematics` (node inline và block). Toolbar có nút "Công thức" và "Công thức khối"; bấm vào thì nhập LaTeX, bấm vào công thức có sẵn thì sửa.
- Server: `generateHTML` sinh phần tử giữ chỗ mang LaTeX trong thuộc tính. Sau sanitize, một bước `renderMath(html)` tìm các phần tử đó và thay bằng `katex.renderToString(latex, { displayMode, throwOnError: false, trust: false, strict: "ignore", maxSize: 20, maxExpand: 200, output: "htmlAndMathml" })`. LaTeX lấy từ thuộc tính phải được giải mã entity đúng cách trước khi đưa vào KaTeX.
- Allow-list của sanitize phải giữ được phần tử giữ chỗ và thuộc tính LaTeX (`data-type`, `data-latex` hoặc tên thuộc tính mà extension thực sự dùng — kiểm tra bằng test, không đoán).
- CSS: `katex/dist/katex.min.css` import ở layout trang bài; font do bundler tự host (CSP `font-src 'self'` sẵn đủ).
- Bảo mật: `trust: false` chặn `\href`, `\url`, `\htmlClass`, `\includegraphics`; test khẳng định `\href{javascript:alert(1)}{x}` không sinh thẻ `<a>`.

### 3.2 Hình có chú thích

- Node block `figure`: thuộc tính `src`, `alt`, `caption` (chuỗi thuần). Render `<figure><img src alt loading="lazy" decoding="async"><figcaption>…</figcaption></figure>`.
- Chèn bằng upload sẵn có (`uploadPostImage`); sửa chú thích và alt ngay trong editor.
- Đánh số bằng CSS counter trong `.chip-prose`: "Hình N." ở trang tiếng Việt, "Figure N." ở trang tiếng Anh (chọn theo `:lang()`; trang đã có `lang` đúng nhờ `DocumentLang`).
- `src` chỉ nhận `https:` hoặc đường dẫn gốc Supabase của dự án; sanitize đã chặn `javascript:` và `data:`.

### 3.3 Callout

- Node block `callout`, thuộc tính `variant ∈ note | tip | warning | example`, nội dung `block+`.
- Render `<aside class="callout callout-<variant>" data-variant="<variant>">…</aside>`; nhãn ("Ghi chú / Note", "Mẹo / Tip", "Lưu ý / Warning", "Ví dụ / Example") hiện bằng CSS `::before` theo `:lang()`. Giá trị `variant` ngoài danh sách thì rơi về `note` khi parse và khi render.
- Màu theo quy tắc xám trung tính của dự án (không tím, không pastel), độ tương phản chữ đạt AA.

### 3.4 Nguồn tham khảo

- Node block `references`, nội dung là danh sách có thứ tự; thuộc tính tuỳ chọn `reviewers` (chuỗi thuần, "Được góp ý bởi …").
- Render `<section class="references" data-type="references"><ol>…</ol><p class="reviewers">…</p></section>`; tiêu đề "Nguồn tham khảo / References" bằng CSS theo `:lang()` để không phải dịch trong nội dung.
- Link trong khối dùng extension Link sẵn có (`rel="noopener noreferrer nofollow"`, `target="_blank"`).
- Chỉ một khối mỗi bài; toolbar vô hiệu nút khi đã có.

### 3.5 Video nhúng trong bài

- Node block `video`: thuộc tính `platform ∈ youtube | tiktok`, `externalId`. Chèn bằng ô dán link, parse qua `parseVideoUrl` (DA1); link không đọc được thì báo lỗi, không chèn.
- Server render phần tử giữ chỗ; sau sanitize, `renderVideos(html)` thay bằng khung facade chỉ khi `externalId` khớp regex của nền tảng (cùng regex với ràng buộc DB). Facade gồm nút có ảnh xem trước (YouTube: `https://i.ytimg.com/vi/<id>/hqdefault.jpg`; TikTok: khung trung tính) và nhãn nền tảng.
- Một client component nhỏ gắn vào thân bài lắng nghe click trên facade và thay bằng `<iframe src={embedUrl(ref)} allow="…" allowfullscreen loading="lazy" title="…">`. Không có JS thì facade là link mở video ở tab mới.
- CSP: `frame-src` thêm `https://www.youtube-nocookie.com https://www.tiktok.com`; `img-src` thêm `https://i.ytimg.com`. Ghi lý do ngay tại chỗ sửa.

### 3.6 Headings và mục lục

Công thức và các node mới không được làm hỏng `extractHeadings`/`withHeadingIds` hay `articleToPlainText`. `articleToPlainText` lấy chữ của chú thích hình, callout, nguồn tham khảo; công thức đóng góp chuỗi LaTeX thô (để tìm kiếm được "E = hf").

## 4. Admin

### 4.1 Toolbar

Thêm nhóm nút: Công thức, Công thức khối, Hình, Callout (chọn loại), Nguồn tham khảo, Video. Giữ bố cục toolbar hiện có (dính đỉnh, không chui dưới header — xem commit `daab845`).

### 4.2 Trường chung của video

Mở rộng `SharedFieldsPanel` (DA1) cho `kind = 'video'`: ô link (hiển thị nền tảng + ID đọc được ngay khi gõ), chọn nguồn Tự làm/Tuyển chọn, tên kênh, chọn bài học liên quan từ danh sách bài học (nhóm dịch, hiện tiêu đề VI). Lưu qua `saveSharedFields`; validate như DA1.

### 4.3 Dịch nháp bằng AI (DeepSeek)

**Luồng:** nút ở tab EN của `PostEditor` → xác nhận nếu bản EN đã có nội dung → Server Action `translateDraft(translationId)` → trả về bản EN (tiêu đề, tóm tắt, nội dung) → editor nạp vào tab EN, đánh dấu chưa lưu → người viết đọc sửa rồi bấm Lưu. Action **không ghi DB**; lưu vẫn đi qua `savePost`.

**Bảo toàn cấu trúc:** không gửi JSON Tiptap cho model.
1. `extractSegments(doc)` đi qua cây, mỗi khối văn bản (paragraph, heading, list item paragraph, callout paragraph, caption, alt, reviewers, tiêu đề, tóm tắt) thành một đoạn `{ id, text }`. Nội dung inline được mã hoá thành chuỗi có thẻ giữ chỗ: `<b>…</b>`, `<i>…</i>`, `<u>…</u>`, `<s>…</s>`, `<code>…</code>`, `<mark>…</mark>`, `<a1>…</a1>` (link thứ n, href giữ ở phía server), `<m1/>` (công thức inline thứ n), `<br/>`. Code block và công thức không bao giờ được gửi đi.
2. Model trả `{ "translations": [{ "id", "text" }] }`.
3. `applyTranslations(doc, segments, translations)` dựng lại cây từ bản VI: mỗi đoạn được parse ngược thẻ giữ chỗ → text node với đúng mark, link, công thức gốc. Đoạn nào thiếu, thừa id, hoặc tập thẻ khác bản gốc thì **giữ nguyên tiếng Việt** và được đếm vào `untranslated`, báo cho người viết.

**Gọi DeepSeek (`src/lib/translate/deepseek.ts`, server-only):**
- `POST https://api.deepseek.com/chat/completions`, header `Authorization: Bearer ${DEEPSEEK_API_KEY}`, `model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro"`, `response_format: { type: "json_object" }`, `temperature` thấp, `max_tokens` đủ lớn theo độ dài đầu vào.
- System prompt (tiếng Anh): dịch từ tiếng Việt sang tiếng Anh cho học sinh THPT, giữ nguyên mọi thẻ giữ chỗ và thứ tự của chúng, không thêm/bớt nội dung, dùng bảng thuật ngữ; có chữ "JSON" và một ví dụ đầu ra (yêu cầu của DeepSeek JSON mode).
- Bảng thuật ngữ bán dẫn cố định trong `src/lib/translate/glossary.ts` (bán dẫn → semiconductor, tấm wafer → wafer, vùng cấm → band gap, pha tạp → doping, …).
- Ngắt thời gian bằng `AbortSignal.timeout`; nội dung rỗng (lỗi đã biết của JSON mode) thì thử lại đúng một lần; lỗi HTTP/parse trả thông báo thân thiện, không lộ chi tiết.
- Bài dài được chia thành nhiều lô đoạn để không vượt `max_tokens`; lô chạy tuần tự.
- Giới hạn: tổng chữ gửi đi tối đa 60 000 ký tự mỗi lần bấm; vượt thì từ chối với lời giải thích.
- Chỉ staff (`lookUpStaff`), `translationId` phải là uuid. Route segment của trang sửa bài đặt `maxDuration` đủ dài (120 giây).

**Riêng tư:** nội dung bài được gửi tới máy chủ DeepSeek. Chỉ gửi nội dung bài (sắp công khai), không gửi email, bình luận hay dữ liệu người đọc. Ghi rõ trong README.

**Cấu hình:** `DEEPSEEK_API_KEY` (bắt buộc để bật nút), `DEEPSEEK_MODEL` (tuỳ chọn). Thêm vào README; `.env.example` do chủ dự án tự thêm (môi trường chặn đọc file này).

## 5. Nợ từ DA1

`unpublishTranslation` và `deleteTranslation` đọc các dòng của nhóm trước khi thay đổi và gọi `revalidatePostRows` như `saveSharedFields`.

## 6. Kiểm thử

**Vitest (thuần):**
- Render từng node qua `renderArticle`: công thức inline/khối ra HTML KaTeX; hình có figcaption; callout với variant hợp lệ và variant lạ; nguồn tham khảo; video có ID hợp lệ ra facade, ID sai hoặc nền tảng lạ ra rỗng.
- Bảo mật: KaTeX `\href{javascript:…}` không có `<a`; LaTeX chứa `"><script>` không thoát ra được; `data-latex` giả trong HTML thô không được dùng làm đường vòng (nội dung chỉ đến từ Tiptap JSON).
- `articleToPlainText` gồm chú thích, callout, LaTeX.
- `extractSegments` / `applyTranslations`: round-trip khi "dịch" là hàm đồng nhất cho ra đúng cây ban đầu; mark, link, công thức inline được giữ; thẻ thiếu/thừa/đảo thứ tự → giữ VI và đếm `untranslated`; id lạ bị bỏ qua.
- Client DeepSeek với `fetch` giả: gửi đúng header/model/`response_format`; nội dung rỗng → thử lại 1 lần; JSON hỏng → lỗi thân thiện; không có key → lỗi cấu hình; không bao giờ gọi mạng thật trong test.
- `revalidatePostRows` cho gỡ đăng/xoá.

**Nghiệm thu trình duyệt:** tạo bài học có đủ mọi node, xem trang công khai (VI và EN), bấm facade video, kiểm console không lỗi CSP; nút dịch tắt khi không có key; nếu có key thì dịch thử một bài và kiểm cấu trúc.

## 7. Rủi ro

- HTML mà extension mathematics sinh ở server có thể khác giả định (tên thuộc tính, phần tử). Plan phải có bước đo thực tế bằng test trước khi viết `renderMath`.
- KaTeX làm nặng CSS trang bài (~25 KB gzip + font). Chấp nhận; chỉ import ở trang bài.
- DeepSeek JSON mode đôi khi trả rỗng; đã có thử lại một lần.

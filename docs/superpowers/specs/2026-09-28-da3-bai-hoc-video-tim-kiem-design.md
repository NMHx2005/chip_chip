# DA3 — Bài học, Video, Tìm kiếm (giao diện công khai)

Ngày: 28/09/2026 · Trạng thái: đã duyệt thiết kế · Lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md` · Nền: DA1 (dữ liệu, `search_posts`), DA2 (node, facade video, render)

## 1. Mục tiêu

Người đọc duyệt bài học theo chủ đề và độ khó, xem video theo bộ lọc, mở trang riêng của từng video, và tìm kiếm toàn site, gõ không dấu vẫn ra kết quả.

**Xong khi:**
- `/vi/bai-hoc` và `/en/lessons` có cột chủ đề, lọc độ khó và phân trang; `/bai-hoc/[topic]` dùng chung bố cục.
- `/vi/video` và `/en/videos` có lưới video, bộ lọc và sắp xếp; `/vi/video/[slug]` và `/en/videos/[slug]` là trang chi tiết đầy đủ.
- Trang chi tiết bài học có "Video liên quan".
- Menu "Bài học" có menu con Lý thuyết / Video, dùng được bằng chuột, chạm và bàn phím.
- Ô tìm kiếm trên navbar dẫn tới `/vi/tim-kiem?q=` hoặc `/en/search?q=`.
- Sitemap, thẻ bài (`PostCard`) và mọi link nội bộ dẫn tới đúng URL cho cả ba loại bài.
- `tsc`, `lint`, `vitest` và `build` sạch; nghiệm thu bằng trình duyệt ở 3 kích thước màn hình và cả hai ngôn ngữ.

**Ngoài phạm vi:** trang Giới thiệu / Liên hệ / Đóng góp / Blog nở thẻ (DA4); thay asset (DA5).

## 2. Routing

Thêm vào `src/i18n/routing.ts` (slug không bản địa hoá, giống bài học):

| Key | vi | en |
|---|---|---|
| `/video` | `/video` | `/videos` |
| `/video/[slug]` | `/video/[slug]` | `/videos/[slug]` |
| `/tim-kiem` | `/tim-kiem` | `/search` |

Tab `?tab=video` cũ ở trang Bài học redirect sang `/…/video` (redirect 301 trong `next.config.mjs` không so khớp được query string; dùng `permanentRedirect` trong page khi `tab=video`).

## 3. Truy vấn (`src/lib/queries/posts.ts`)

- `listLessons(locale, { topic?, difficulty?, page })` → `{ posts, total }`, 12 bài mỗi trang, mới nhất trước.
- `listVideos(locale, { platform?, source?, topic?, difficulty?, sort, page })` → `{ posts, total }`, 12 bài mỗi trang. `sort ∈ newest | oldest | easiest | hardest`: easiest/hardest xếp theo thứ tự enum `post_difficulty` rồi mới nhất; bài không có độ khó xếp cuối.
- `getVideoBySlug(locale, slug)` → `Post` cộng các trường video.
- `listRelatedVideos(locale, lessonTranslationId)` → video đã đăng cùng ngôn ngữ có `related_lesson_translation_id` bằng giá trị này, tối đa 6.
- `getLessonByTranslation(locale, translationId)` → `{ slug, topic, title }` của bài học liên quan, để trang video dẫn ngược về bài học.
- `countLessonsByTopic` sẵn có được tái dùng cho cột chủ đề.
- Mọi tham số từ URL đi qua một hàm parse thuần (`parseListingParams`) với danh sách trắng; giá trị lạ bị bỏ qua, `page` là số nguyên từ 1 đến 500.
- `PostSummary` thêm các trường video cần cho thẻ: `videoPlatform`, `videoExternalId`, `videoSource`, `channelName` (null với loại khác).

## 4. Giao diện

### 4.1 Bài học

- Desktop (≥ lg): hai cột. Cột trái rộng khoảng 260 px gồm các viên thuốc chủ đề ("Tất cả" + 4 chủ đề, mỗi viên kèm số bài) và nút thu gọn/mở. Khi thu gọn, cột trái co lại bằng chuyển tiếp `width` với easing chuẩn từ `components/motion/tokens.ts` trong 0.45s; nếu người dùng bật `prefers-reduced-motion` thì không có chuyển động. Trạng thái thu gọn được nhớ bằng `localStorage` (có try/catch).
- Cột phải: dải lọc độ khó (Tất cả / Cơ bản / Trung bình / Nâng cao) là các link giữ nguyên các tham số khác, lưới thẻ và phân trang.
- Mobile: viên thuốc chủ đề thành một hàng cuộn ngang phía trên, không có nút thu gọn.
- `/bai-hoc/[topic]` render cùng component với chủ đề chọn sẵn, canonical là chính nó.
- Trang chi tiết bài học: mục "Video liên quan" (lưới thẻ video nhỏ) đặt sau nội dung bài, trước bình luận; ẩn khi không có video.

### 4.2 Video

- Banner đầu trang: tiêu đề và mô tả (ảnh nền giữ chỗ trung tính; ảnh thật thuộc DA5).
- Thanh lọc: nền tảng, nguồn, chủ đề, độ khó (nhóm link dạng viên thuốc) và sắp xếp (menu chọn); mọi thứ nằm trên URL; có nút "Xoá lọc".
- Thẻ video: ảnh xem trước (YouTube: `i.ytimg.com/vi/<id>/hqdefault.jpg` qua `next/image` với remotePatterns cho `i.ytimg.com`; TikTok: khung trung tính có biểu tượng), nhãn nguồn "Của Chíp Chíp" hoặc "Tuyển chọn · <kênh>", độ khó, ngày đăng.
- Trang chi tiết video: facade trình phát (tái dùng markup facade và `VideoFacades` của DA2), tiêu đề, nhãn, mô tả (nội dung Tiptap qua `ArticleBody`), nút "Xem bài học liên quan" nếu có, nút "Xem trên YouTube/TikTok", bình luận (`CommentSection` sẵn có), ảnh OG, canonical/alternates như các trang bài khác.

### 4.3 Menu Bài học

Mục "Bài học" trên navbar là nút mở menu con (Lý thuyết → `/bai-hoc`, Video → `/video`) với `aria-expanded`, đóng khi bấm ra ngoài hoặc nhấn Esc, mở khi hover trên thiết bị có chuột. Trong menu mobile có sẵn, hai mục này hiện dạng hai link thụt vào.

### 4.4 Tìm kiếm

- Navbar có nút kính lúp. Bấm vào mở một ô nhập (form GET tới trang tìm kiếm), focus tự vào ô, Esc để đóng. Trên mobile, ô nhập nằm trong menu.
- Trang `/tim-kiem?q=`: render ở server, gọi `searchPosts`, nhóm kết quả theo Bài học / Video / Blog (mỗi nhóm tối đa 10 kết quả, kèm số lượng); ô tìm kiếm điền sẵn `q`; hiện trạng thái rỗng khi chưa gõ gì và khi không có kết quả. `q` được cắt ở 100 ký tự.
- Trang đặt `robots: { index: false, follow: true }`.

### 4.5 Link và SEO

- Một hàm thuần `postHref(post)` trả về href next-intl cho lesson / forum / video; `PostCard`, kết quả tìm kiếm, sitemap và `revalidate-paths` đều dùng nó (sitemap đưa video vào lại thay vì bỏ qua như DA2).
- `revalidate-paths` thêm trang danh sách và trang chi tiết video.
- Mọi trang mới có `generateMetadata` với canonical và alternates; ảnh OG cho trang video và trang danh sách, theo mẫu `opengraph-image.tsx` sẵn có.

## 5. Chất lượng

- Chuỗi mới qua `messages/{vi,en}.json` với tập khoá bằng nhau.
- Màu xám trung tính; chữ đạt AA; vùng bấm tối thiểu 44 px trên mobile.
- Mọi chuyển động dùng token có sẵn và tắt khi bật `prefers-reduced-motion`.
- Không có JS phía client ngoài: nút thu gọn cột, menu con, ô tìm kiếm và `VideoFacades`.
- Cache: các trang danh sách dùng `revalidate = 3600` giống trang chủ; trang tìm kiếm là dynamic.

## 6. Kiểm thử

- **Vitest (thuần):**
  - `parseListingParams`: giá trị hợp lệ, giá trị lạ, trang ngoài khoảng, giá trị trùng.
  - `postHref` cho cả ba loại, ở cả hai ngôn ngữ.
  - Thứ tự sắp xếp của video (hàm dựng tham số truy vấn tách riêng để test được).
  - `revalidatePostRows` cho video.
  - Sitemap có video.
- **Không có test gọi Supabase;** các truy vấn là lớp bọc mỏng.
- **Nghiệm thu bằng trình duyệt trên stack local**, với dữ liệu thử là 2 bài học và 3 video ở cả hai nguồn và hai nền tảng:
  - Lọc và sắp xếp chạy đúng, URL chia sẻ được.
  - Thu gọn cột hoạt động.
  - Menu con dùng được bằng bàn phím.
  - Tìm kiếm có dấu và không dấu đều ra kết quả.
  - Trang video phát được, có "Video liên quan", và chuyển ngôn ngữ đúng.
  - Không có lỗi console hay CSP.

## 7. Rủi ro

- `next/image` cho `i.ytimg.com` cần thêm `remotePatterns`; CSP `img-src` đã có `i.ytimg.com` từ DA2.
- Trang chủ đề và trang danh sách dùng chung component nên dễ lệch canonical; test `postHref` và metadata phải bao phủ.

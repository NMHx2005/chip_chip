# Thiết kế lại giao diện — Bước 5a: trang danh sách Blog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Đưa bản vẽ trang danh sách Blog (`/blog`) vào mã: hero có video nền với nút Tạm dừng/Phát và dòng credit, tiêu đề danh sách hiển thị kèm số đếm, thẻ Blog theo PostCard v2, phân trang dùng thành phần chung, trạng thái rỗng có hai lối đi.

**Vì sao là 5a:** Bước 5 của HANDOFF (Blog, bài Blog, Video, Video chi tiết) quá lớn cho một lượt (riêng Blog có 20 hiệu ứng BL1 đến BL20). Chia: **5a** danh sách Blog (kế hoạch này), **5b** khung bài viết (Blog post và Bài học chi tiết: ArticleShell, mục lục, đổi ngôn ngữ, Báo lỗi bài), **5c** bình luận (form dùng Field, luồng Trả lời, Xem thêm), **5d** danh sách Video, **5e** Video chi tiết. Mỗi bước có kế hoạch và review riêng.

**Architecture:** `HeroBackdrop` là client component mới (tự giữ `<video>` để điều khiển phát/dừng, kể cả khi bật giảm chuyển động). `PageHero` nhận thêm hai khe: `backdrop` và `below` (thay cho `backdropVideo`, chỉ Blog dùng); `backdropImage` giữ cho trang Video (5d). Trang Blog ráp lại; PostCard chỉ thêm biểu tượng cho thẻ không ảnh không chủ đề. Không đổi schema, không thêm truy vấn.

**Tech Stack:** Next.js 14, TypeScript strict, Tailwind, next-intl, framer-motion, Vitest.

**Nguồn thiết kế:** `docs/thiet-ke-giao-dien/boards/Blog-Spec.dc.html` (BL1 đến BL20, đổi gì, kiểm tra, câu hỏi mở), `Blog-Index-VI-1280.dc.html`, `Blog-Index-EN-390.dc.html`, `Blog-Empty-*`. Tiếp nối bước 1, 3, 4 (đã ở `main`).

## Giả định (mặc định theo khuyến nghị của bản vẽ; ghi ledger nếu đổi)
- **D1. Video nền:** giữ clip TSMC lặp tại chỗ và thêm nút dừng (bản vẽ khuyến nghị). Bật giảm chuyển động: không tự phát, hiện khung đầu, nút ở trạng thái Phát và vẫn bấm phát được.
- **D2. Kích thước trang:** giữ 9 bài (3×3), `PAGE_SIZE`.
- **D3. Thẻ số liệu:** một ô ("Bài viết").
- **D4. Thẻ mở toàn màn hình:** giữ nguyên hành vi và giá trị (`EXPAND_MS` 0.4s), không gộp với 0.45s của Bài học; chuyển panel sang bài giữ nguyên như hiện nay.
- **D5. Chuyển trang:** Pagination chung dùng `Link` phía client (không tải lại toàn trang như bản inline cũ); cuộn về `#danh-sach` chừa 6rem.
- **D6. Hiệu ứng ngoài bảng:** không thêm; dùng BL1 (PageHero đã có), BL2 BL3 (mới), BL4 (CardReveal), BL5 BL6 (PostCard), BL7 (giữ), BL19 (EmptyState), BL20 (Pagination, đếm kết quả).

## Ràng buộc chung
Mọi chuỗi qua `messages/{vi,en}.json` (cùng bộ khoá; viết vi trước để parity đỏ). Không dependency, phông, script mới; clip nền là tệp tự host ≤ 5 MB đã có (`public/video/tsmc-open.mp4`), liên kết credit mở YouTube ở tab mới (không nhúng). Chỉ `EASE_STANDARD` và token thời lượng; mọi hiệu ứng có nhánh giảm chuyển động. Mục bấm ≥ 44px. Class Tailwind viết nguyên văn. Không sửa migration. Commit tiếng Anh, Conventional Commits, không dòng attribution; không push khi chưa được phép. Sau mỗi task: typecheck + lint; sau task có test: `npm test`.

## Review Focus
- HeroBackdrop: nút phát/dừng thật sự dừng và phát được (kể cả bật giảm chuyển động), `aria-label` đổi theo trạng thái, video tạm dừng khi cuộn khỏi màn hình và không phát lại khi người dùng đã bấm dừng, không có nội dung nào (chữ mô tả) mất tương phản trên video, `poster`/khung đầu không nháy.
- Thẻ Blog (không chủ đề, không độ khó, không ảnh, tóm tắt trống, tiêu đề rất dài): hàng đều nhau, biểu tượng không tràn, thẻ vẫn mở toàn màn hình khi bấm và vẫn là liên kết thường với Ctrl/Cmd-click.
- Phân trang: `page` ngoài khoảng vẫn 404 (`notFound()`), `?page=abc` không làm hỏng trang, liên kết có `#danh-sach`, 9 bài mỗi trang, tổng trang tính đúng, dòng kết quả nói đúng số đang hiện/tổng.
- Rỗng: `EmptyState` với hai nút 44px; VI và EN; không cuộn ngang ở 390px.
- Không hồi quy trang chủ (khối "Từ Blog" dùng cùng PostCard) và trang Video (vẫn dùng `backdropImage`).

## Files
| File | Việc |
|---|---|
| `src/messages/{vi,en}.json` (sửa) | chuỗi mới cho `forum` |
| `src/components/sections/HeroBackdrop.tsx` (mới) | Video nền + scrim + hàng credit + nút phát/dừng |
| `src/components/sections/PageHero.tsx` (sửa) | Khe `backdrop` và `below`; bỏ `backdropVideo` |
| `src/components/forum/PostCard.tsx` (sửa nhỏ) | Biểu tượng cho thẻ không ảnh, không chủ đề |
| `src/app/[locale]/blog/page.tsx` (sửa) | Ráp lại danh sách |
| `src/app/ui-gallery/*` (sửa) | Mẫu HeroBackdrop |
| `docs/BAN-GIAO.md` (sửa) | Ghi bước 5a |

---

### Task 1: Chuỗi mới
**Files:** sửa `src/messages/{vi,en}.json`.
- [ ] Thêm dưới `forum` (vi trước để `keys-parity.test.ts` đỏ, rồi en): `listHeading` "Tất cả bài viết"/"All posts", `result` "Hiển thị {shown} trong {total} bài viết · Mới nhất trước"/"Showing {shown} of {total} posts · Newest first", `pauseVideo` "Tạm dừng video nền"/"Pause background video", `playVideo` "Phát video nền"/"Play background video", `creditLink` "{title} (mở trên YouTube, tab mới)"/"{title} (opens on YouTube, new tab)", `emptyTitle` "Chưa có bài viết nào"/"No posts yet", `emptyBody` "Các bài phân tích đầu tiên đang được viết. Quay lại sau nhé, hoặc xem bài học và video trong lúc chờ."/"The first analysis posts are being written. Check back soon, or read the lessons and watch the videos in the meantime.", `statPosts` "Bài viết"/"Posts". Commit `feat(i18n): strings for the redesigned blog listing`.

### Task 2: HeroBackdrop
**Files:** tạo `src/components/sections/HeroBackdrop.tsx`; sửa `src/app/ui-gallery/*`.
**Interfaces:** `HeroBackdrop({ src, credit }: { src: string; credit: { label: string; href: string } })` (client). Trả về hai phần dùng cho khe của PageHero: xuất `HeroBackdropLayer` (lớp nền: video + scrim, `aria-hidden`) và `HeroBackdropCredit` (hàng credit + nút), dùng chung một trạng thái phát qua một `HeroBackdropProvider` nhỏ hoặc một component bọc; chọn cách đơn giản nhất (một component `HeroBackdrop` render lớp nền và hàng credit trong cùng cây, PageHero đặt lớp nền bằng vị trí tuyệt đối và hàng credit trong luồng).
- [ ] Video: `<video muted loop playsInline preload="metadata">`, opacity 0.25 (BL2, fade 0.6s khi có khung đầu), phủ scrim (`linear-gradient(90deg, rgba(229,229,229,.78) 0%, rgba(229,229,229,.5) 45%, rgba(229,229,229,0) 75%)` và `linear-gradient(180deg, transparent 0%, rgba(229,229,229,.4) 55%, #E5E5E5 100%)`). Tự phát khi không bật giảm chuyển động; tạm dừng khi ra khỏi màn hình (IntersectionObserver, `rootMargin` 200px); không tự phát lại nếu người dùng đã bấm dừng. Giảm chuyển động: không tự phát, hiện khung đầu, nút Phát.
- [ ] Nút tròn 44px (BL3): `aria-label` `t("pauseVideo")`/`t("playVideo")`, biểu tượng đổi theo trạng thái, viền `#D1D1D1`, hover viền `rgba(0,0,0,.25)` chữ `#000`, 0.25s. Hàng credit 44px: nút + "Video:" (`common.videoCredit`) + liên kết credit `target="_blank" rel="noopener noreferrer"` `aria-label` `t("creditLink", { title })`, biểu tượng mở ngoài.
- [ ] Gallery: mẫu HeroBackdrop trên nền xám. Kiểm tra bằng trình duyệt: bấm dừng thì `video.paused === true` và nút đổi nhãn; bấm phát thì phát lại; cuộn khỏi màn hình rồi quay lại không phát lại khi đã dừng. Typecheck + lint. Commit `feat(sections): add HeroBackdrop with a pause control`.

### Task 3: PageHero nhận `backdrop` và `below`
**Files:** sửa `PageHero.tsx`.
- [ ] Thêm `backdrop?: ReactNode` (render trong lớp nền tuyệt đối thay cho ảnh/video; `backdropImage` giữ nguyên cho trang Video) và `below?: ReactNode` (render dưới khối tiêu đề, trong `relative`, dòng credit). Bỏ `backdropVideo` và import `AutoplayVideo` nếu không còn dùng. Hero-in cho `below` (`--i` 4, BL1: 0.46s như thẻ số liệu). Kiểm tra `/vi/video` (còn `backdropImage`) không đổi. Typecheck + lint. Commit `feat(pages): PageHero accepts a backdrop and a row below the title`.

### Task 4: PostCard cho bài không ảnh, không chủ đề
**Files:** sửa `PostCard.tsx`.
- [ ] Thẻ không ảnh và không `topic` hiện khối trung tính có biểu tượng `FileText` (lucide, `aria-hidden`, màu `text-black/25`) ở giữa thay cho khối xám trống. Kiểm tra bằng gallery (thẻ Blog mẫu). Typecheck + lint. Commit `feat(ui): give image-less blog cards a neutral plate with an icon`.

### Task 5: Ráp lại trang Blog
**Files:** sửa `src/app/[locale]/blog/page.tsx`.
- [ ] `PageHero` với `stats={[{ value: total, label: t("statPosts") }]}`, `backdrop` và `below` từ `HeroBackdrop` (`BLOG_CLIP`, `BLOG_CLIP_CREDIT`); bỏ dòng credit riêng cũ. Phần danh sách: `section#danh-sach` `scroll-mt-24`; hàng đầu `h2` 26px hiển thị `t("listHeading")` và `p role="status" aria-live="polite"` `t("result", { shown: posts.length, total })`; lưới `sm:grid-cols-2 lg:grid-cols-3` với `CardReveal` + `PostCard expand`; thay phân trang inline bằng `Pagination` (hash `danh-sach`); rỗng: `EmptyState` (title `emptyTitle`, description `emptyBody`, hai nút tới `/bai-hoc` và `/video`). Giữ `notFound()` khi `page` vượt quá trang cuối. Dọn import không còn dùng.
- [ ] Kiểm tra bằng trình duyệt `/vi/blog` và `/en/blog` ở 1280 và 390px: hero, nút nền, credit, h2 và dòng kết quả, EmptyState (không có dữ liệu), không cuộn ngang; `/vi/blog?page=2` trả 404; `/vi/blog?page=abc` vẫn 200. Typecheck + lint + test. Commit `feat(blog): redesigned blog listing`.

### Task 6: Cổng chất lượng, tài liệu, review
- [ ] `npm run typecheck`, `lint`, `npm test`, `npm run build` (nếu vẫn không cho kết quả thì ghi rõ chưa xác nhận). Cập nhật `docs/BAN-GIAO.md`. Review toàn nhánh bằng một reviewer độc lập (Opus); lần này nhớ đo hình học thật (vị trí, kích thước, hit-test) cho mọi điều khiển, không chỉ `aria-*`. Sửa lỗi nghiêm trọng bằng TDD, báo lỗi nhỏ hoãn.

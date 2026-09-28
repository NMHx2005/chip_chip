# Lộ trình nâng cấp — Project Chíp Chíp

Ngày: 28/09/2026 · Trạng thái: chờ duyệt

## 1. Bối cảnh và mục tiêu

Trang chủ, CMS, song ngữ và lớp bảo mật đã xong (xem `docs/BAN-GIAO.md`, giai đoạn 1, 2, 2b).
Các trang trong — Bài học, Video, Diễn đàn, Giới thiệu — còn sơ sài. Tham chiếu là
visemi.org, nhưng điều chỉnh cho quy mô một người: bỏ donate, nhà tài trợ, báo chí,
cơ cấu tổ chức.

**Đã chốt với chủ dự án:**

- Làm **một mình**. Giữ nguyên ràng buộc **song ngữ bắt buộc** ở tầng database.
- **Hoàn thiện đủ rồi mới ra mắt** — không có hạn chót, không cắt phạm vi.
- Điểm nghẽn thật là nội dung; code ưu tiên những gì giúp viết bài nhanh hơn.

**Ngoài phạm vi:** donate, tài khoản người đọc, diễn đàn thật (người đọc tự đăng
bài), trang riêng cho từng quốc gia, vẽ sơ đồ ngay trong editor.

## 2. Quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Công thức | KaTeX, render sẵn ở server — không tốn JS phía người đọc |
| Sơ đồ | Vẽ ngoài (Excalidraw/draw.io/Figma), tải PNG/WebP lên; node **Hình** có chú thích, tự đánh số |
| Khối khác | Callout, nguồn tham khảo cuối bài, node nhúng video |
| Dịch | Nút "Dịch nháp bằng AI" trong admin (Claude API): VI → EN nháp, giữ nguyên cấu trúc Tiptap, công thức, hình. Người viết đọc sửa rồi mới đăng |
| Video | Cả tự làm lẫn sưu tầm, nhãn "Của Chíp Chíp" / "Tuyển chọn". YouTube + TikTok nhúng iframe |
| Mô hình video | **Phương án A** — video là `kind = 'video'` trong bảng `posts`, tận dụng cổng song ngữ, CMS, bình luận, tìm kiếm, SEO |
| Liên kết | Video gắn vào bài học; bài học có "Video liên quan", thẻ video có "Xem bài học" |
| Độ khó | 3 mức Cơ bản / Trung bình / Nâng cao, cho cả bài học và video |
| Tìm kiếm | Toàn site (bài học + video + blog), gõ không dấu được |
| Liên hệ | Form lưu vào DB, đọc trong `/admin/tin-nhan`. Không gửi email |
| Giới thiệu | Bỏ 8 ban (`TEAM_UNITS`). Thay bằng **Về tác giả** + FAQ + "Những người đã đồng hành" (ẩn khi rỗng) |
| Tham gia | Form "Tham gia cùng chúng tôi" đổi thành "Cùng đóng góp nội dung" |
| Diễn đàn | Đổi tên thành **Blog** ở URL và giao diện; redirect 301 từ URL cũ |

## 3. Năm dự án con

Mỗi dự án con có spec và plan riêng, làm tuần tự.

### DA1 — Nền dữ liệu

Migration cho video, độ khó, tìm kiếm không dấu, bảng `messages`; đổi Diễn đàn → Blog.
Mọi dự án sau đứng trên nó. Spec: `2026-09-28-da1-nen-du-lieu-design.md`.

### DA2 — Công cụ viết bài

Node Tiptap mới: công thức (inline + khối), Hình có chú thích, callout, nguồn tham
khảo, video. Thanh công cụ tương ứng. Trường chung của nhóm dịch (độ khó, video,
bài học liên quan) trong form admin. Nút dịch nháp bằng AI.

Điểm cần thiết kế kỹ ở spec riêng:
- Mỗi node mới phải có trong `articleExtensions` (dùng chung editor và renderer) và
  trong allow-list của `sanitize.ts`, nếu không sẽ biến mất khi đăng.
- KaTeX sinh nhiều thẻ và thuộc tính (`span`, `math`, MathML, `style`) — allow-list
  phải nới có kiểm soát, hoặc render KaTeX *sau* bước sanitize từ dữ liệu đã kiểm.
- Dịch AI: API key chỉ ở server, gọi qua Server Action có `lookUpStaff()`, giới hạn
  kích thước, không bao giờ ghi đè bản EN đã có nội dung mà không hỏi.

### DA3 — Bài học, Video, Tìm kiếm (giao diện công khai)

- Bài học: cột chủ đề trái dạng viên thuốc + lưới thẻ phải, thu/giãn cột (easing chuẩn
  0.45s), lọc chủ đề/độ khó qua URL, nhãn độ khó trên thẻ, mục "Video liên quan".
- Video: banner đầu trang, lưới video, lọc nguồn (YouTube/TikTok, tự làm/tuyển chọn),
  sắp xếp Mới/Cũ/Đơn giản/Phức tạp. Nới CSP `frame-src` cho `youtube-nocookie.com`
  và `tiktok.com`; tải iframe khi bấm (facade) để trang không nặng.
- Tìm kiếm: ô trên navbar, trang kết quả render ở server.

### DA4 — Uy tín và Blog

- Giới thiệu: Về tác giả (ảnh, câu chuyện, lý do làm), mục đích minh bạch (miễn phí,
  không quảng cáo, không bán dữ liệu), FAQ accordion, "Những người đã đồng hành".
- Liên hệ / Góp ý, Đóng góp (viết bài, dịch, làm video, báo lỗi), Chính sách bảo mật.
- Nút "Báo lỗi bài này" trong mỗi bài, gửi vào `messages`.
- Blog: thẻ nở tại chỗ khi bấm (`motion` `layout`) trước khi chuyển trang.

### DA5 — Hoàn thiện trước ra mắt

Thay 7 video giữ chỗ, logo, mascot, link mạng xã hội, email, Google Form; ảnh OG cho
trang mới; sitemap; `verify-security.sh` đủ xanh; cập nhật README và BAN-GIAO;
kiểm bằng trình duyệt ở ba kích thước màn hình.

## 4. Nguyên tắc xuyên suốt

- Không sửa migration đã chạy; chỉ thêm file mới.
- Mọi chuỗi mới qua `next-intl`; số khoá `vi.json` và `en.json` bằng nhau.
- Chữ ký chuyển động giữ nguyên theo `components/motion/tokens.ts`.
- Server Action trả giá trị, không redirect (xem `app/admin/actions.ts`).
- Không kéo thư viện cần DOM vào đường render phía server (bài học từ jsdom → 500 trên Vercel).
- Mỗi dự án con kết thúc bằng kiểm bằng trình duyệt, không chỉ đọc code.

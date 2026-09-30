# Bàn giao thiết kế giao diện — Project Chíp Chíp

Bản thiết kế lại toàn bộ trang công khai, vẽ trên canvas Claude Design. Thư mục này là bản sao để làm theo trong mã. Nó là **đặc tả**, chưa phải mã chạy được.

- Đầu vào gốc: `docs/BAO-CAO-GIAO-DIEN.md` và ảnh hiện trạng `docs/anh-giao-dien/`.
- Canvas trực tuyến (riêng tư, cần đúng tài khoản): https://claude.ai/artifact/VNXygEafy5HcpR7ob9qUp5
- Chỉ mục vị trí các artboard: `canvas.json`. Danh sách artboard: `board-index.md`.

## Cách đọc các file `boards/*.dc.html`

- Mỗi file là một artboard cố định (1280 hoặc 390 px). Đây là HTML kèm cú pháp của canvas: `{{...}}`, `<sc-for>`, `<sc-if>`, khối `<script data-dc-script>` chứa dữ liệu mẫu. **Không mở trực tiếp bằng trình duyệt** (thiếu `support.js` của canvas); xem hình ở link canvas.
- Phần đáng đọc là `<helmet><style>` (CSS của từng thành phần: màu, cỡ chữ, bo góc, khoảng cách, hover) và cấu trúc thẻ (thứ bậc heading, `aria-*`, thứ tự DOM).
- Mỗi nhóm trang có một **bảng đặc tả** (`*-Spec*.dc.html`, riêng Bài học là `Motion` và `Summary`): bảng chuyển động, "(a) đổi gì và vì sao", "(b) thành phần dùng chung", kiểm tra theo báo cáo phần 5.1 và 8, câu hỏi mở.
- `Global-Shared.dc.html` gom thành phần chung, chỗ các trang đang lệch nhau và thứ tự làm. **Đọc file này trước.**
- Mọi bài mẫu, tên người, số liệu (47 bài, số bình luận, email, thời gian phản hồi) là chữ minh hoạ, không phải dữ liệu thật. Ảnh bìa và video là ô tối giữ chỗ.
- Bản vẽ nạp Be Vietnam Pro từ Google Fonts chỉ để xem trước. Trong mã vẫn dùng `next/font` tự host; không thêm phông, script hay host ảnh mới (CSP, báo cáo 5.1 mục 7).

## Hệ thiết kế đã chốt (từ trang Bài học)

- Thang xám: nền `#E5E5E5`, thẻ `#FFFFFF`, xám nhạt `#EFEFEF`, chính `#0D0D0D`, nhấn `#314344`, chữ phụ `#3E424D`, viền `#D1D1D1`.
- Chữ: h1 800, -0.03em, 46px desktop / 34px mobile; h2 mục 26px 800; thân 16 và 18px.
- Bo góc: thẻ 16, ảnh trong thẻ 12, khung lớn 24, nút và chip bo tròn. Padding thẻ 16. Khung 1280, lề 32 (mobile 20).
- Chuyển động: chỉ `EASE_STANDARD` `cubic-bezier(.25,.1,.25,1)`; thời lượng và so le lấy từ `components/motion/tokens.ts`; mọi hiệu ứng có nhánh `prefers-reduced-motion`; không có hiệu ứng lặp vô hạn ở trang trong.
- Thành phần: PageHero v2, TopicChip (số + nhãn), DifficultyMark (3 thanh + nhãn), PostCard (thẻ, gọn, dòng), Pagination, EmptyState, Button, ResultCount, CardReveal. Chi tiết ở `boards/Components.dc.html` và `boards/Summary.dc.html`.

## Cần chốt trước khi code

Các điểm này nằm ở `Global-Shared.dc.html`, mục "Chỗ các trang đang lệch nhau". Chưa có quyết định của người bảo trì, cột "đề xuất" chỉ là hướng gợi ý.

1. Viền ô nhập: đề xuất một token `#767676`.
2. Thông báo thành công: màu nhấn kèm dấu tích; chỉ dùng đỏ cho lỗi.
3. Disclosure: gộp bốn định nghĩa thành một.
4. Trang Video: mục nào sáng trên thanh điều hướng.
5. Đổi chân trang (liên kết 44px, trạng thái trang hiện tại) và hover nút chính `#262626`: áp dụng toàn site.
6. Nền hero Blog: giữ video lặp có nút Tạm dừng, hay đổi thành ảnh tĩnh.
7. Tìm kiếm không có phân trang (tối đa 10 kết quả mỗi nhóm): giữ như bản vẽ.

## Thứ tự làm gợi ý

1. Token: màu, chữ, bo góc, viền ô nhập, màu lỗi trong `tailwind.config.ts` và `globals.css`.
2. Button, Field, Disclosure, Footer, PageHero v2.
3. PostCard (ba dạng), TopicChip, DifficultyMark, Pagination, EmptyState và ErrorState, CardReveal.
4. Bài học và Bài học theo chủ đề (mẫu chuẩn cho họ danh sách).
5. Blog và bài Blog, rồi Video và Video chi tiết.
6. Tìm kiếm và popover; Liên hệ, Giới thiệu, Đóng góp, Bảo mật.
7. 404 và trang lỗi (dùng lại gần như mọi thành phần trên).

Bài học chi tiết chưa có bản vẽ riêng: dùng ArticleShell của bài Blog (`boards/Blog-Post-VI-1280.dc.html`).

## Ràng buộc khi làm (theo `CLAUDE.md` của dự án)

- Đây là việc lớn (nhiều hơn 10 file, đổi thành phần dùng chung): làm trên nhánh riêng, chia bước, lập kế hoạch từng bước trước khi code.
- Mọi chuỗi mới đi qua `messages/{vi,en}.json`, hai file giữ cùng bộ khoá.
- Không sửa migration đã áp dụng. Truy vấn mới (đếm bài theo độ khó, `searchPosts` trả trạng thái lỗi, `sendMessage` trả mọi lỗi) là việc riêng, cần bàn trước.
- Trước khi báo xong: typecheck, lint và test pass; kiểm bố cục bằng trình duyệt, không suy từ bounding box.

## Danh sách artboard

Xem `board-index.md` (sinh từ `canvas.json`).

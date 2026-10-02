# Báo cáo giao diện và chức năng — Project Chíp Chíp

Ngày lập: 30/09/2026 · Nhánh mã nguồn khảo sát: `main` tại commit `4626229` (đã push).

Tài liệu này mô tả website **hiện tại** để dùng làm đầu vào cho Claude Design khi thiết kế lại toàn bộ giao diện. Nó không đề xuất thiết kế mới. Mọi con số (màu, cỡ chữ, thời lượng hiệu ứng, breakpoint) được đọc từ mã nguồn; chỗ nào không xác minh được thì ghi là `unclear`.

## 0. Cách dùng tài liệu này

1. Đưa cho Claude Design: **phần 1 đến 6** (tổng quan, hiện trạng, ràng buộc, hiệu ứng), cộng **thư mục ảnh** `docs/anh-giao-dien/`, cộng **phụ lục A, B, C** khi cần chi tiết từng trang.
2. Kèm yêu cầu ở **phần 7** (danh sách cần trả về) để kết quả dễ đem về làm.
3. Trước khi gửi lại cho mình, dùng **phần 8** (danh sách sàng lọc) để loại các phương án vi phạm ràng buộc.

Cấu trúc:

| Phần | Nội dung |
|---|---|
| 1 | Tổng quan sản phẩm và sơ đồ trang |
| 2 | Hệ thống thiết kế hiện tại (tóm tắt) |
| 3 | Danh mục hiệu ứng theo trang (bảng tra nhanh) |
| 4 | Điểm không nhất quán và lỗi đã phát hiện |
| 5 | Ràng buộc bắt buộc (kỹ thuật) và ràng buộc thiết kế hiện tại (có thể đổi) |
| 6 | Nội dung còn giữ chỗ / trạng thái dữ liệu |
| 7 | Nên yêu cầu Claude Design trả về những gì |
| 8 | Danh sách sàng lọc kết quả thiết kế |
| Phụ lục A | Chi tiết: khung chung, hệ thống chuyển động, trang chủ |
| Phụ lục B | Chi tiết: các trang công khai còn lại |
| Phụ lục C | Chi tiết: trang quản trị, chức năng, dữ liệu, ràng buộc |

### Ảnh chụp giao diện hiện tại (`docs/anh-giao-dien/`)

Chụp bằng trình duyệt thật, toàn trang, sau khi cuộn hết trang để các hiệu ứng "hiện khi cuộn tới" đã chạy.

| File | Trang | Khung |
|---|---|---|
| `01-trang-chu-desktop.jpeg` | Trang chủ `/vi` | 1280 px |
| `02-bai-hoc-desktop.jpeg` | Bài học `/vi/bai-hoc` | 1280 px |
| `03-blog-desktop.jpeg` | Blog `/vi/blog` | 1280 px |
| `04-video-desktop.jpeg` | Video `/vi/video` | 1280 px |
| `05-tim-kiem-desktop.jpeg` | Tìm kiếm `/vi/tim-kiem` | 1280 px |
| `06-gioi-thieu-desktop.jpeg` | Giới thiệu `/vi/gioi-thieu` | 1280 px |
| `07-lien-he-desktop.jpeg` | Liên hệ `/vi/lien-he` | 1280 px |
| `08-dong-gop-desktop.jpeg` | Đóng góp `/vi/dong-gop` | 1280 px |
| `09-chinh-sach-bao-mat-desktop.jpeg` | Chính sách bảo mật | 1280 px |
| `10-trang-chu-mobile.jpeg` | Trang chủ | 390 px |
| `11-gioi-thieu-mobile.jpeg` | Giới thiệu | 390 px |

**Giới hạn của ảnh chụp (rất quan trọng):** ảnh được chụp trên máy không chạy Supabase, nên các danh sách **rỗng**: Bài học, Blog, Video đều hiện trạng thái "chưa có bài", và thẻ bài viết (`PostCard`), thẻ video (`VideoCard`), kết quả tìm kiếm, bình luận không xuất hiện trong ảnh. Các thành phần đó được mô tả bằng chữ trong phụ lục B với đủ kích thước và trạng thái. Trang bài viết chi tiết, trang quản trị và trang 404 cũng không có ảnh. Ảnh chỉ chụp được trạng thái nghỉ, không chụp được hiệu ứng: xem phần 3 cho hiệu ứng.

---

## 1. Tổng quan sản phẩm

- **Là gì:** website học bán dẫn phi lợi nhuận, song ngữ Việt/Anh, dành cho học sinh THPT. Một người bảo trì. Miễn phí, không quảng cáo, không thu tiền, không bán dữ liệu (cam kết hiển thị ở trang Giới thiệu).
- **Nội dung:** ba loại bài trong cùng một bảng `posts`: **Bài học** (theo 4 chủ đề và 3 mức độ khó), **Blog** (phân tích, góc nhìn), **Video** (YouTube/TikTok, của dự án hoặc tuyển chọn). Bài viết soạn bằng trình soạn Tiptap (công thức KaTeX, hình có chú thích đánh số, callout, nguồn tham khảo, nhúng video).
- **Ngôn ngữ:** mỗi bài là **hai bản ghi** (VI và EN) dùng chung một `translation_id`; chỉ đăng được khi cả hai ngôn ngữ đều đủ.
- **Người dùng:** khách xem (không có tài khoản người đọc), người bình luận (chỉ nhập tên), người gửi liên hệ/góp ý/báo lỗi, và **nhân viên** (đăng nhập vào `/admin`).
- **Công nghệ:** Next.js 14 (App Router), TypeScript, Tailwind, next-intl, Supabase, framer-motion, Lenis (cuộn mượt), lucide-react, Tiptap, KaTeX.

### 1.1 Sơ đồ trang công khai

| Trang | URL tiếng Việt | URL tiếng Anh | Ghi chú |
|---|---|---|---|
| Trang chủ | `/vi` | `/en` | 8 khối, nhiều hiệu ứng cuộn |
| Bài học (thư viện) | `/vi/bai-hoc` | `/en/lessons` | Cột chủ đề + lọc độ khó + lưới thẻ |
| Bài học theo chủ đề | `/vi/bai-hoc/[chủ đề]` | `/en/lessons/[topic]` | 4 chủ đề: `dinh-nghia`, `nguyen-ly`, `ung-dung`, `lich-su` |
| Bài học chi tiết | `/vi/bai-hoc/[chủ đề]/[slug]` | `/en/lessons/[topic]/[slug]` | Không có bình luận |
| Blog | `/vi/blog` | `/en/blog` | Video nền, thẻ mở rộng toàn màn hình khi bấm |
| Bài blog chi tiết | `/vi/blog/[slug]` | `/en/blog/[slug]` | Có bình luận |
| Video | `/vi/video` | `/en/videos` | Bộ lọc 4 nhóm + sắp xếp |
| Video chi tiết | `/vi/video/[slug]` | `/en/videos/[slug]` | Player facade bấm-để-phát |
| Tìm kiếm | `/vi/tim-kiem` | `/en/search` | Gõ có dấu hay không dấu đều được |
| Giới thiệu | `/vi/gioi-thieu` | `/en/about` | Tác giả, cam kết, FAQ, kêu gọi đóng góp |
| Liên hệ | `/vi/lien-he` | `/en/contact` | Form Liên hệ / Góp ý |
| Đóng góp | `/vi/dong-gop` | `/en/contribute` | 4 cách đóng góp |
| Chính sách bảo mật | `/vi/chinh-sach-bao-mat` | `/en/privacy` | Văn bản dài |
| 404 / Lỗi | (mọi URL lạ) | | Ba biến thể 404 và một trang lỗi, chưa thống nhất |

**Trang quản trị** (chỉ tiếng Việt, không có bản EN): `/admin/dang-nhap`, `/admin` (tổng quan), `/admin/bai-viet` (danh sách), `/admin/bai-viet/moi`, `/admin/bai-viet/[id]` (soạn bài), `/admin/comments`, `/admin/tin-nhan`. Chi tiết ở phụ lục C.

**Khung chung mọi trang công khai:** liên kết "Chuyển tới nội dung chính" → thanh điều hướng cố định → `<main>` → chân trang. Điều hướng: Trang chủ, Bài học (menu con: Lý thuyết, Video), Blog, Giới thiệu; bên phải có tìm kiếm, mạng xã hội (đang ẩn vì chưa có link), chuyển VI/EN, nút "Tham gia cùng chúng tôi". Chân trang: logo, Liên hệ, Đóng góp, Chính sách bảo mật, bản quyền.

### 1.2 Trang chủ theo thứ tự từ trên xuống

1. **Hero:** hai nhãn "Đơn giản", "Miễn phí"; tiêu đề "Một đứa trẻ ba tuổi cũng có thể tìm hiểu về bán dẫn"; đoạn giới thiệu; hai nút "Tìm hiểu ngay", "Về chúng tôi"; bên dưới là video giới thiệu 29 giây "dựng đứng" khi cuộn.
2. **SimpleStart:** thẻ trắng "Bắt đầu từ những điều đơn giản nhất".
3. **LessonTopics:** accordion 4 chủ đề, bên phải (màn lớn) là video xem trước đổi theo chủ đề.
4. **EcosystemDiagram:** "Ai làm gì trong chuỗi cung ứng chip?" (5 nhóm thẻ logo).
5. **CountryBands:** 5 dải xám (Mỹ, Đài Loan, Trung Quốc, Hàn Quốc, Hà Lan) với cờ, bản đồ, logo công ty hiện khi hover, video YouTube bấm-để-phát.
6. **VideoCarousel:** 6 video kiểu coverflow.
7. **LatestPosts:** 3 bài blog mới nhất.
8. **JoinCta:** khối đen "Tham gia cùng chúng tôi" với vòng chữ quay.

---

## 2. Hệ thống thiết kế hiện tại (tóm tắt)

Bảng đầy đủ nằm ở phụ lục A (mục "Global design tokens"). Những điểm cốt lõi:

- **Bảng màu chủ đích là thang xám**, không có sắc màu: nền `#E5E5E5`, thẻ `#FFFFFF`, xám nhạt `#EFEFEF`, chữ chính `#000000`, chữ phụ `#3E424D`, viền `#D1D1D1`, nút chính `#0D0D0D`. Màu nhấn duy nhất là xám lục đậm `#314344` (liên kết, viền focus, đường kẻ trích dẫn). Bốn chủ đề và năm quốc gia được phân biệt **bằng độ đậm nhạt của xám**, không bằng màu. Màu duy nhất khác: nền đánh dấu `#FEF6D9`, đỏ/xanh cho thông báo form, và trạng thái trong trang quản trị (xanh lá đã đăng, hổ phách nháp, đỏ lỗi).
- **Chữ:** Be Vietnam Pro (400–800, có tiếng Việt) và JetBrains Mono (mã, email). Tiêu đề rất đậm (800), chữ ôm sát (`tracking -0.03em`), `text-balance`.
- **Bo góc:** thẻ `rounded-2xl` (16px), khối lớn `rounded-3xl` (24px), ô nhập và nút `rounded-xl` (12px), nhãn `rounded-full`.
- **Đổ bóng:** thẻ phẳng, chủ yếu chỉ có viền; bóng chỉ xuất hiện khi hover (`0 2px 4px rgba(0,0,0,.05), 0 12px 32px rgba(0,0,0,.12)`) và ở hộp nổi (`0 8px 32px rgba(0,0,0,.16)`).
- **Bố cục:** chiều rộng nội dung tối đa 1280px, lề ngang 20px (mobile) / 32px (từ 768px); bài viết 768px; video chi tiết 896px. Breakpoint là mặc định Tailwind (640/768/1024/1280); `md` và `lg` là hai điểm đổi bố cục chính.
- **Logo:** chữ thuần (không phải ảnh): dòng nhỏ "PROJECT" giữa hai đường kẻ, dòng lớn "CHÍP CHÍP". Đã được ghi là tạm, chờ logo vector thật.
- **Không có chế độ tối.**
- **Thứ tự lớp (z-index):** nền cố định 0 < hero 10 < lớp chuyển cảnh 15 < phần chính và chân trang 20 < thanh điều hướng 1000 < menu di động 1001 < panel mở rộng 1500 < skip-link 2000.

---

## 3. Danh mục hiệu ứng theo trang (bảng tra nhanh)

Khoá chung (`src/components/motion/tokens.ts`): easing chuẩn `cubic-bezier(0.25, 0.1, 0.25, 1)` (tương đương `ease`); thời lượng 0.25 / 0.5 / 0.6 / 0.7 giây; bước so le (stagger) 0.12 giây, trễ đầu 0.1 giây; vùng kích hoạt "hiện khi cuộn tới" là vào 100px trong màn hình, chạy một lần. Toàn bộ chuyển động đều tôn trọng `prefers-reduced-motion` (xem phần 5).

### 3.1 Toàn site (khung chung)

| Hiệu ứng | Mô tả | Giá trị |
|---|---|---|
| Cuộn mượt (Lenis) | Chỉ trên máy có chuột; tắt trên cảm ứng và khi giảm chuyển động | 0.9 giây, ease-out cubic `1-(1-t)³` |
| Thanh điều hướng đổi nền | Trong suốt ở đầu trang; sau khi cuộn quá 12px chuyển sang nền mờ `bg/80` + `backdrop-blur-xl` + viền dưới | 300 ms |
| Viên "đang chọn" của menu | Nền đen tròn mờ dần vào/ra ở mục đang chọn (mỗi mục một viên, không trượt) | opacity 0→1, 0.25 giây |
| Menu con "Bài học" | Hiện khi hover chuột, click hoặc Enter/Space; mở bằng `opacity` + dịch lên 4px | 0.25 giây; mũi tên xoay 180° |
| Hộp tìm kiếm (desktop) | Bật/tắt bằng thuộc tính `hidden`, **không có animation** | tức thì |
| Menu di động | Toàn màn hình nền đen; mờ dần vào/ra; khoá cuộn, bẫy phím Tab, Escape để đóng | 0.2 giây |
| Nút chính (`PillButton` nền tối) | Vệt sáng chạy quanh viền ("star border"), nhanh hơn khi hover | 5 giây (nghỉ), 2 giây (hover) |
| Nhấn nút (khi là `<button>`) | Thu nhỏ khi bấm | scale 0.97, 0.2 giây |
| Khung lấy nét | Viền 2px `#314344`, cách 2px | mọi phần tử |

### 3.2 Trang chủ

| Khối | Hiệu ứng | Giá trị |
|---|---|---|
| Nền trang chủ | Ảnh mạch điện cố định (sticky) phía sau, phóng 105%, độ mờ 40%, làm nhòe 6px; nội dung trượt lên trên ảnh | ảnh 1920px |
| Lớp chuyển cảnh (`SceneFillOverlay`) | Hình tròn xám lớn dần từ giữa đáy màn hình phủ kín (clip-path), tiến độ gắn với khoảng cách tới khối "Từ Blog" | bán kính 0→150%, lò xo (stiffness 220, damping 32); *hiệu ứng thực tế trên màn hình chưa xác minh được (`unclear`)* |
| Hero — vào trang | Nhãn, tiêu đề, đoạn giới thiệu, hàng nút lần lượt hiện (mờ + dịch lên 20px) | stagger 0.12 giây, mỗi mục 0.55 giây |
| Hero — thu nhỏ khi cuộn | Khối tiêu đề mờ dần và thu nhỏ khi video tiến lên | opacity 1→0.7→0; scale 1→0.92 |
| Hero — video "mở nắp" | Video xoay từ nghiêng về thẳng theo tiến độ cuộn (bản lề ở cạnh dưới) | rotateX 55°→0°, scale 0.72→1, perspective 1600px, tuyến tính theo cuộn |
| Hero — nút "Tìm hiểu ngay" | Từng chữ cái nảy lên, đổi độ đậm khi hover (ngẫu nhiên có quy luật) | 0.55 giây; dịch −1…−4px, scale 1.2…1.45, xoay ±12° |
| Hero — thẻ hover trên video (chỉ desktop) | Thẻ kính mờ trượt vào ở góc dưới phải; viền có vệt sáng chạy quanh | vào 0.5 giây (y 28px, scale 0.96); viền 3.5 giây (2 giây khi hover); ẩn sau 2.5 giây |
| Hero — video | Chỉ tải khi đã cuộn; di động: tạm dừng, có nút phát to kính mờ; có nút Tạm dừng/Phát góc dưới | |
| Tiêu đề mọi khối | Tiêu đề rồi mô tả hiện lần lượt khi cuộn tới | mờ + dịch lên 20px, 0.55 giây, stagger 0.12 giây |
| Cả khối Video/Blog/Tham gia | Cả khối hiện dần khi cuộn tới | mờ + dịch lên 32px, 0.7 giây |
| LessonTopics (accordion) | Mở khi click, focus, hoặc hover 120ms; chỉ một mục mở; mục mở có nền tô theo tông chủ đề; tiêu đề phóng 19→21px, đậm 500→600; chấm phóng 1.35; mũi tên xoay 90°; panel mở chiều cao 0→auto; **thanh chỉ báo đen trượt** theo mục (lò xo) | nền 0.4 giây; panel 0.45 giây; chỉ báo stiffness 420, damping 36 |
| LessonTopics — video xem trước | Chỉ clip của chủ đề đang mở được gắn; chuyển bằng mờ chéo | 0.6 giây |
| EcosystemDiagram | Không có hiệu ứng riêng (chỉ tiêu đề) | |
| CountryBands — vào | Mỗi dải hiện lần lượt (mờ + dịch lên 24px), trễ theo thứ tự | 0.5 giây, trễ `i × 0.07` giây |
| CountryBands — logo công ty | Ẩn cho tới khi hover/focus dải; trên cảm ứng luôn hiện | chiều cao 0→224px + opacity, 300 ms |
| CountryBands — video | Ảnh bìa YouTube + nút phát tròn; bấm mới tạo iframe (không gọi YouTube trước đó) | |
| VideoCarousel | Coverflow phẳng 3 thẻ: giữa scale 1, hai bên scale 0.85 và opacity 0.55, xa hơn ẩn; kéo (drag) ngang, phím ←/→, bấm thẻ bên cạnh để chọn; **chỉ thẻ giữa được phát** | 0.6 giây; vị trí ±58%; ngưỡng vuốt 60px |
| LatestPosts — lưới | Thẻ hiện lần lượt; hover **nghiêng 3D** nhẹ, hai thẻ cạnh nhau nghiêng ngược chiều (từ 768px) | stagger 0.12 giây; nghiêng rotateX 2°, rotateY ±5°, rotateZ ±1°, 300 ms |
| LatestPosts — bấm thẻ | Một panel trắng mọc từ đúng vị trí thẻ ra toàn màn hình rồi mới chuyển trang | 400 ms; nếu chưa chuyển sau 1 giây thì mờ đi 0.3 giây |
| JoinCta | Thẻ đen hiện dần; nội dung bên trong hiện lần lượt; **vòng chữ xoay vô hạn** (chỉ ≥1024px); nút phóng 1.02 khi hover + hiệu ứng chữ nảy | 0.7 giây; stagger 0.12 giây; vòng xoay 28 giây/vòng |

### 3.3 Các trang công khai còn lại

Các trang này **cố ý ít chuyển động** (chỉ một kiểu vào trang, hover màu, và hai hiệu ứng cấu trúc). Không có hiện dần khi cuộn, không chuyển trang, không khung xương (skeleton), không parallax.

| Trang / thành phần | Hiệu ứng | Giá trị |
|---|---|---|
| Đầu trang (`PageHero`) | Cả hàng tiêu đề hiện khi tải trang (`rise-in`), không gắn với cuộn | 0.5 giây, `cubic-bezier(0.22, 1, 0.36, 1)`, dịch lên 12px |
| Giới thiệu, Liên hệ | `rise-in` chỉ áp lên **nhãn nhỏ** (tiêu đề đứng yên) | như trên |
| Blog — nền đầu trang | Video TSMC lặp không tiếng, 25% độ mờ, phai vào màu nền; ngừng khi ra khỏi màn hình | |
| Video — nền đầu trang | Ảnh tĩnh 25% độ mờ, phai vào màu nền | |
| Thẻ bài viết / thẻ video | Hover: viền tối lên và đổ bóng; mũi tên "Đọc tiếp" nhích phải 2px | 300 ms |
| Blog — thẻ mở rộng | Xem 3.2 (LatestPosts): cùng cơ chế panel trắng 400 ms | chỉ Blog và Trang chủ |
| Cột chủ đề (Bài học, ≥1024px) | Thu gọn 260px → 44px (chỉ chiều rộng; danh sách ẩn tức thì); nhớ trạng thái trong `localStorage`; không chạy lúc tải trang | 450 ms, ease chuẩn |
| Nút lọc, chọn trang | Đổi màu khi hover | 150 ms |
| Bộ lọc video (di động) | `<details>` mở/đóng; mũi tên xoay 180° | 150 ms |
| FAQ (Giới thiệu) | `<details>` mở tức thì (không animation chiều cao); dấu `+` xoay 45° | 300 ms |
| "Báo lỗi bài này" | `<details>` mở tức thì; mũi tên xoay 180° | 300 ms |
| Nút phát video (facade) | Đĩa phát đổi từ `rgba(13,13,13,.85)` sang đen khi hover/focus; bấm thì thay bằng iframe | 150 ms |
| 404 toàn cục | Nút `PillButton` có vệt sáng chạy viền | 5 giây / 2 giây |
| Cuộn tới mục lục / bình luận | Cuộn mượt nhờ Lenis; lề trên cuộn 6rem để không bị thanh điều hướng che | |

### 3.4 Trang quản trị

Gần như **không có chuyển động**: chỉ đổi màu ở nút/liên kết, `animate-pulse` ở khung xương của trang tổng quan, `backdrop-blur` ở thanh tiêu đề và thanh công cụ soạn bài. Không có hiệu ứng vào trang.

---

## 4. Điểm không nhất quán và lỗi đã phát hiện

Cần thống nhất trong bản thiết kế lại (chi tiết ở mục 16 phụ lục B):

1. **Ba phong cách đầu trang.** `PageHero` (Bài học, Chủ đề, Blog, Video, Tìm kiếm, Đóng góp, Bảo mật) khác với Giới thiệu và Liên hệ (tự viết lại, cỡ chữ khác). Cỡ chữ tiêu đề trang: 34/46, 32/48, 32/44, 30/42, 28/38, 26/34 px tuỳ trang.
2. **Ba họ thẻ khác nhau:** `PostCard` (cover, chip, tóm tắt 3 dòng), `VideoCard` (ảnh bìa, huy hiệu nền tảng, chỉ tiêu đề), dòng kết quả tìm kiếm (chỉ tiêu đề + 2 dòng); cộng thẻ thông tin tĩnh ở Giới thiệu/Đóng góp.
3. **Phân trang không đồng bộ.** Bài học và Video dùng thành phần chung (ô 44px, có mũi tên, có dấu "…", 12 mục/trang); **Blog dùng bản riêng** (ô 36px, liệt kê mọi trang, không mũi tên, tải lại toàn trang, 9 mục/trang) và sẽ tràn khi nhiều trang.
4. **Hai form khác nhau:** bình luận (ô 40px, lỗi từng ô, thành công màu xanh) và liên hệ/báo lỗi (ô 44px, một vùng báo lỗi chung, thành công không đổi màu).
5. **Ba biến thể 404 + một trang lỗi** không đồng bộ: 404 toàn cục có nút hoạt hình; 404 của bài viết chỉ có chữ; trang lỗi dùng nút đen khác và không có dòng "404".
6. **Ba đường cong easing** cùng tồn tại (`0.25,0.1,0.25,1`; `0.22,1,0.36,1`; `0.16,1,0.3,1` đã khai báo nhưng chưa dùng).
7. **Nhãn độ khó và chủ đề gần như không phân biệt được:** mọi mức độ khó dùng cùng một nhãn viền xám; bốn chủ đề là bốn sắc xám gần nhau.
8. **Lỗi hiển thị nhỏ hiện có:** các lớp màu `brand-300/600/700` được dùng (liên kết "Khám phá thêm", credit hero) nhưng **chưa được định nghĩa** trong Tailwind nên không có tác dụng; `text-gradient-brand` thực chất là màu đặc `#0D0D0D` nên tiêu đề hero không có hai tông như ý định; thẻ hover trên video hero nói "Bấm để mở trên kênh" nhưng không bấm được (`pointer-events-none`); khung xương trang tổng quan quản trị có 5 thẻ còn trang thật có 6.
9. **Chuỗi cứng trong mã (chưa qua i18n):** nhãn ngôn ngữ ở trang bài blog ("Đọc bản tiếng Việt"/"Read in English") và toàn bộ chữ trong trang quản trị.
10. **Mục tiêu bấm dưới 44px:** ô nhập bình luận (40px), nút quay lại ở bài viết, phân trang Blog (36px), nhãn đổi ngôn ngữ ở bài blog.
11. **Khối chỉ hiện khi hover trên desktop:** danh sách logo công ty ở dải quốc gia (khó phát hiện); trên cảm ứng luôn hiện.
12. **Trang bài học/blog không có hiệu ứng vào, không có mục lục dính (sticky), không đánh dấu mục đang đọc.**

---

## 5. Ràng buộc

### 5.1 Bắt buộc về kỹ thuật (thiết kế mới phải tôn trọng, nếu không sẽ phải đổi cả logic)

1. **Song ngữ VI + EN:** mọi chữ hiển thị trên site công khai đi qua `messages/{vi,en}.json` với **cùng bộ khoá**. Thiết kế phải chịu được độ dài khác nhau giữa hai ngôn ngữ (ví dụ nhãn chủ đề EN dài hơn: "What is a semiconductor", "History & development"). Trang quản trị hiện là tiếng Việt cứng.
2. **Đường dẫn đã địa phương hoá** (bảng ở mục 1.1). Không thay đổi cấu trúc URL nếu không cần; giữ 4 chuyển hướng 301 cũ (`dien-dan`/`forum` → `blog`).
3. **Điều kiện đăng bài:** phải đủ cả VI và EN (tiêu đề, ít nhất một khối nội dung, các trường chung trùng khớp; bài học/video cần độ khó; video cần link và nguồn). Giữ các chỉ báo "sẵn sàng" (dấu tick/chấm ở tab VI/EN, nút "Đăng" bị vô hiệu kèm lý do).
4. **Cảnh báo thay đổi chưa lưu** trong trình soạn (hiện dùng hộp thoại native, có thể thay bằng modal riêng nhưng phải giữ hành vi).
5. **Xoá là không hoàn tác** và xoá cả hai bản ngôn ngữ: giữ xác nhận hai bước. Xoá bình luận/tin nhắn cũng vậy.
6. **Quy trình hiển thị bài viết:** JSON Tiptap → HTML → làm sạch (allow-list) → KaTeX + khung video. Node mới phải được thêm ở **cả** `extensions.ts` và `sanitize.ts`. Các node phải giữ: công thức (dòng/khối), hình có chú thích đánh số tự động, callout 4 loại, nguồn tham khảo + người góp ý, video nhúng. Nhãn "Hình N.", "Ghi chú/Mẹo/Lưu ý/Ví dụ", "Nguồn tham khảo" được vẽ bằng CSS theo ngôn ngữ trang.
7. **CSP nghiêm ngặt** (`next.config.mjs`): không script, phông, iframe, host ảnh của bên thứ ba ngoài: `youtube-nocookie.com` và `tiktok.com` (chỉ cho iframe), ảnh từ Supabase và `i.ytimg.com`. Phông phải tự host (next/font tự host lúc build là được). **Iframe video chỉ được tạo sau khi người dùng bấm.** Ảnh từ host mới cần thêm vào cấu hình.
8. **Chống spam:** giữ ô bẫy ẩn `website` trong form bình luận và liên hệ (ẩn với cả người và trình đọc màn hình); giới hạn tốc độ: bình luận 3/10 phút, tin nhắn 3/giờ (dùng chung cho liên hệ + góp ý + báo lỗi), đăng nhập quản trị 10/15 phút; tối đa 16 KiB mỗi yêu cầu. Câu chữ "3 tin mỗi giờ" hiển thị cho người dùng, đổi giới hạn phải đổi cả chữ.
9. **Phân quyền:** khách chỉ đọc + bình luận + gửi tin; email bình luận/tin nhắn chỉ nhân viên thấy; không có tài khoản người đọc.
10. **Chuyển động:** dùng chung token trong `components/motion/tokens.ts` và **bắt buộc** tôn trọng `prefers-reduced-motion` (khối CSS toàn cục đã ép mọi animation/transition về 0.01 ms; mã framer-motion phải tự kiểm tra `useReducedMotion`).
11. **Hiệu năng/kỹ thuật:** không chạy `next build` khi `next dev` đang chạy (dùng chung `.next`); `useSearchParams` cần Suspense; `<details>` đóng thì ẩn nội dung (CSS không ép mở được); thanh công cụ soạn bài đang dính ở `top-[110px]` (phụ thuộc chiều cao header quản trị) và khung soạn phải dùng `overflow: clip`.
12. **Server Actions trả về giá trị, không tự chuyển trang;** khoá bí mật (service role, DeepSeek) không được vào bundle client.

### 5.2 Ràng buộc thiết kế **hiện tại** (được phép đổi nếu có lý do)

- Bảng màu chỉ thang xám + một màu nhấn; phân biệt chủ đề/quốc gia bằng độ đậm nhạt. **Đây là quyết định thiết kế cũ của dự án, không phải giới hạn kỹ thuật.** Nếu đổi sang có màu, phải kiểm tra lại tương phản ≥ 4.5:1.
- Không có chế độ tối. Không có logo ảnh (logo chữ). Không có minh hoạ/icon riêng, chỉ dùng bộ icon lucide.
- Bố cục thẻ phẳng, chỉ viền, hầu như không đổ bóng.
- Khung chính rộng 1280px, bài viết 768px.

### 5.3 Trợ năng đang có (nên giữ)

Liên kết bỏ qua điều hướng; `aria-current` ở mục đang chọn; nút bật/tắt có `aria-pressed`; tab ngôn ngữ dùng `role=tablist`; vùng báo lỗi `role=alert/status`; `aria-invalid` + `aria-describedby` ở ô lỗi và chuyển focus tới ô đầu tiên lỗi; nút chỉ có icon có `aria-label` và `title`; viền focus 2px `#314344`; lọc và phân trang là **liên kết thật** (hoạt động khi tắt JavaScript, chia sẻ được); nút phát/tạm dừng cho video tự chạy (WCAG 2.2.2); bẫy phím Tab và phím Escape ở menu di động; `<details>` native cho FAQ, báo lỗi, bộ lọc di động.

---

## 6. Nội dung còn giữ chỗ / trạng thái dữ liệu

Thiết kế cần chừa chỗ và chịu được việc nội dung thật đến sau:

| Mục | Hiện trạng |
|---|---|
| Giới thiệu — tác giả | Chữ giữ chỗ trong ngoặc vuông ("[Tên tác giả]", "[Câu chuyện…]"); ảnh tác giả chưa có nên hiện vòng tròn chữ cái đầu |
| Giới thiệu — "Những người đã đồng hành" | Danh sách rỗng nên **cả khối bị ẩn** |
| Giới thiệu — ảnh banner | Ảnh Siltronic (cần xác nhận quyền dùng) |
| Liên hệ — email, mạng xã hội | Rỗng nên bị ẩn; khối "Khi nào có phản hồi" còn ngoặc giữ chỗ "[Thời gian phản hồi]" |
| Thanh điều hướng/chân trang — mạng xã hội | Facebook, TikTok chưa có link nên icon ẩn |
| Trang chủ — carousel 6 video | Là video mượn từ dự án khác (không liên quan bán dẫn), cần thay |
| Trang chủ — nền khối "Tham gia" | Ảnh nền tối tạo tạm |
| Logo | Logo chữ tạm; logo vector + mascot chưa có |
| Logo công ty | Thiếu logo Micron (đang hiện tên chữ); logo ASML có watermark mờ |
| Bài học, Blog, Video | Chưa có nội dung thật: đây là phần thiếu lớn nhất. Trạng thái rỗng cần được thiết kế tử tế |
| Trạng thái rỗng | Hiện chỉ là ô viền nét đứt + một dòng chữ, chưa có minh hoạ |

---

## 7. Nên yêu cầu Claude Design trả về những gì

Để mình (Claude Code) làm lại chính xác trên nền Next.js + Tailwind, mỗi bản thiết kế nên có:

1. **Bộ token:** bảng màu (kèm tỉ lệ tương phản chữ/nền), thang chữ (kích thước, độ đậm, giãn dòng, giãn chữ cho mobile và desktop), thang bo góc, bóng, khoảng cách, chiều rộng khung, breakpoint. Đặt tên giống cách Tailwind gọi.
2. **Thư viện thành phần** kèm mọi trạng thái: nút (chính, phụ, viền, vô hiệu, đang tải), nhãn/chip (chủ đề, độ khó, nền tảng, nguồn), ô nhập + lỗi + thành công, thẻ bài viết, thẻ video, dòng kết quả tìm kiếm, phân trang, bộ lọc, điều hướng (desktop, menu con, di động), chân trang, thanh trạng thái rỗng/lỗi/404.
3. **Từng trang ở hai khung: 1280px và 390px** (tối thiểu), cho **cả trang công khai lẫn trang quản trị** nếu muốn làm lại quản trị. Với danh sách: có ảnh **có dữ liệu** và ảnh **rỗng**.
4. **Bản mô tả chuyển động** cho từng hiệu ứng: kích hoạt bởi gì (tải trang, cuộn tới, hover, bấm, giữ), thay đổi thuộc tính nào, giá trị đầu/cuối, thời lượng, easing, độ trễ/so le, cách hoạt động khi giảm chuyển động. Giữ dùng chung một bộ easing và thời lượng (không thêm đường cong mới cho từng nơi).
5. **Nội dung mẫu song ngữ** (VI và EN) cho các chuỗi mới, để kiểm tra độ dài.
6. **Trang bài viết:** kiểu chữ cho phần thân (`chip-prose`): tiêu đề h1–h4, đoạn, liên kết, danh sách, trích dẫn, mã, bảng, công thức, hình có chú thích, 4 kiểu callout, khối nguồn tham khảo, player video, mục lục.
7. **Ghi chú những gì thay đổi so với hiện tại** và lý do, để mình đánh giá độ lớn công việc.
8. **Định dạng:** ưu tiên HTML/CSS hoặc file thiết kế có thể xem được; nếu có mã thì tốt nhất là React + Tailwind, nhưng **không cần** đúng tên file trong repo, mình sẽ tích hợp.

---

## 8. Danh sách sàng lọc kết quả thiết kế

Đánh dấu từng dòng khi xem lại bản thiết kế trước khi gửi cho mình:

**Ràng buộc bắt buộc**
- [ ] Mọi chuỗi chữ mới có bản **tiếng Việt và tiếng Anh**, và bố cục chịu được độ dài khác nhau.
- [ ] Không dùng phông, script, iframe, ảnh host của bên thứ ba ngoài danh sách cho phép (phần 5.1 mục 7).
- [ ] Video nhúng chỉ tạo iframe **sau khi bấm**.
- [ ] Có phương án cho `prefers-reduced-motion` với mọi hiệu ứng (chuyển động bị tắt hoặc thay bằng đổi tức thì).
- [ ] Không dựa **chỉ vào hover** để hiện thông tin quan trọng (cảm ứng, bàn phím).
- [ ] Ô bẫy `website` trong form vẫn có và vẫn ẩn.
- [ ] Giữ điều kiện đăng bài VI+EN và cảnh báo thay đổi chưa lưu (nếu làm lại quản trị).

**Chất lượng thiết kế**
- [ ] Tương phản chữ/nền ≥ 4.5:1 (chữ thân bài khuyến nghị ≥ 7:1 như hiện tại).
- [ ] Mục tiêu bấm ≥ 44 × 44 px trên di động.
- [ ] Có đủ trạng thái: rỗng, đang tải (nếu có), lỗi, 404, không có kết quả, lọc ra rỗng, trang vượt quá trang cuối.
- [ ] Có khung 390px cho mọi trang; không cuộn ngang.
- [ ] Trang chịu được nội dung thật: tiêu đề bài rất dài, tên kênh dài, tóm tắt trống, không có ảnh bìa, bài không có mục lục.
- [ ] Một thang chữ, một họ thẻ, một kiểu phân trang, một kiểu form, một kiểu 404, một bộ easing: **các điểm ở phần 4 đã được giải quyết**.
- [ ] Trang chủ và các trang trong nhìn như cùng một hệ (yêu cầu gốc của bạn: thiết kế lại các trang theo trang chủ).
- [ ] Hiệu ứng có mục đích rõ (dẫn mắt, phản hồi hành động), không chỉ trang trí; trang đọc bài (Bài học, Blog, Video chi tiết) **không** bị hiệu ứng gây xao nhãng.
- [ ] Hiệu năng: không thêm video/ảnh nặng ở đầu trang mà không có phương án tải muộn; clip tự host ≤ 5 MB.

**Khả năng làm được**
- [ ] Mỗi thành phần diễn đạt được bằng Tailwind + framer-motion hiện có (không cần thư viện mới, hoặc nếu cần thì nêu rõ tên và lý do).
- [ ] Không làm thay đổi dữ liệu (schema, luồng đăng bài) mà chưa nói rõ.

---

# Phụ lục: khảo sát chi tiết theo mã nguồn

Ba phụ lục dưới đây là bản khảo sát chi tiết do đọc mã nguồn, giữ nguyên bằng tiếng Anh để chính xác về tên lớp Tailwind, giá trị và đường dẫn file. Tài liệu Trang chủ và khung chung ở **Phụ lục A**, các trang công khai còn lại ở **Phụ lục B**, trang quản trị và chức năng ở **Phụ lục C** (phần này viết không dấu tiếng Việt vì ghi chú kỹ thuật, có nhiều chuỗi UI trích nguyên văn không dấu).

## Phụ lục A — Khung chung, hệ thống chuyển động và Trang chủ

Repo: `/Users/nmh/work/Mac/NMHx/CodeThue/Project_Chip_Chip`. All paths below are relative to it. Line refs are `file:line`. Read-only survey. "unclear" marks anything not verifiable from code.

Site nature: bilingual (vi default, en) semiconductor-learning site for high-school students. Palette is deliberately STRICTLY GREYSCALE (comments in globals.css, GlassPill, constants). Only "colour" is a dark teal-grey accent `#314344` (used as focus ring, link text, blockquote rule) and `#317e6a` (defined, used only in the outline pill border gradient).

---

### Global design tokens (summary)

| Group | Token | Value | Source |
|---|---|---|---|
| Colour | `bg` (page) | `#E5E5E5` (also html/body bg, scrollbar track) | tailwind.config.ts:12, globals.css:7,12 |
| Colour | `surface` | `#FFFFFF` | tailwind.config.ts:13 |
| Colour | `surface-muted` | `#EFEFEF` | :14 |
| Colour | `primary` | `#0D0D0D` (near-black; buttons, active nav, CTA card is `bg-black`) | :15 |
| Colour | `accent` | `#314344` (dark teal-grey; links, focus outline, active text) | :16 |
| Colour | `accent-teal` | `#317e6a` (only inside outline-pill border gradient in PillButton.tsx:32) | :17 |
| Colour | `text` | `#000000` | :19 |
| Colour | `text-muted` | `#3e424d` | :20 |
| Colour | `text-nav` | `#4d4d4d` | :21 |
| Colour | `muted` | `#6B7280` (defined; not seen used in home) | :22 |
| Colour | `border` / `input` | `#D1D1D1` | :28-29 |
| Colour | `ring` | `#314344` | :30 |
| Colour | selection | `rgba(0,0,0,0.12)` on black text | globals.css:20-23 |
| Colour | scrollbar | 8px; thumb `rgba(0,0,0,.18)`, hover `.32`, radius 4px | globals.css:25-43 |
| Colour | Topic tones (data, not Tailwind) | dinh-nghia bg `#4A4A4A` soft `#E6E6E6`; nguyen-ly `#6B6B6B` / `#EAEAEA`; ung-dung `#8C8C8C` / `#EEEEEE`; lich-su `#AEAEAE` / `#F2F2F2`; text on soft always `#262626` | lib/constants.ts:50-58 |
| Colour | Country band tones | usa `#CDCDCD`, taiwan `#D3D3D3`, china `#DADADA`, south-korea `#E3E3E3`, netherlands `#EEEEEE` (darkest to lightest, top to bottom) | lib/constants.ts:96-151 |
| Colour | Brand gradient (`bg-brand-gradient`) | `linear-gradient(131deg, rgb(51,51,51) 0.79%, rgb(13,13,13) 35.22%, rgb(38,38,38) 99.16%)` | tailwind.config.ts:41; same string duplicated in PillButton.tsx:13 |
| Colour | `text-gradient-brand` | NOT a gradient: solid `#0d0d0d` | globals.css:62-64 |
| Colour BUG | `brand-300/600/700` classes | Used in VideoCarousel.tsx:179,187,196, Hero.tsx:163 but NOT defined in tailwind config, so these hover/text colour classes do nothing (video "Khám phá thêm" link falls back to inherited text colour) | grep result |
| Fonts | Sans/display/body | Be Vietnam Pro (weights 400,500,600,700,800; subsets latin, latin-ext, vietnamese; `display: swap`, preloaded) via CSS var `--font-be-vietnam-pro` | app/layout.tsx:7-13, tailwind.config.ts:33-37 |
| Fonts | Mono | JetBrains Mono (400,500; not preloaded) `--font-jetbrains-mono`; used for code and CONTACT_EMAIL | app/layout.tsx:15-21 |
| Font smoothing | antialiased, grayscale | globals.css:15-16 |
| Radii (used) | `rounded-full` (pills, chips, nav), `rounded-3xl` (24px: pill buttons, hero video md, SimpleStart card, CTA card), `rounded-2xl` (16px: cards, bands, dropdowns), `rounded-xl` (12px: inputs, inner thumbs, mobile menu button), `rounded-md` (flag). Article prose: 12px/4px | various |
| Shadows | `shadow-card` | `0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)` | tailwind.config.ts:46 |
| Shadows | `shadow-card-hover` | `0 2px 4px rgba(0,0,0,.05), 0 12px 32px rgba(0,0,0,.12)` | :47-48 |
| Shadows | `shadow-float` | `0 8px 32px rgba(0,0,0,.16)` (dropdowns, search panel) | :49 |
| Widths | `max-w-content` | 1280px (all sections + navbar + footer); `max-w-prose` 72ch | :62-65 |
| Gutters | Section horizontal padding | `px-5` mobile, `md:px-8` | all sections |
| Breakpoints | Tailwind defaults, no override | sm 640, md 768, lg 1024, xl 1280. Key switches: `md` (tablet/desktop layout, nav CTA, tilt, social), `lg` (desktop nav pill, search, topic video column, CTA ring) | tailwind.config.ts (no `screens`) |
| Root scroll | `scroll-padding-top` 6rem; `overscroll-behavior-y: none` | globals.css:8,17 |
| Z-index ladder | sticky backdrop `z-0` < hero layer `z-10` < SceneFillOverlay `z-[15]` < MainSection & Footer `z-20` < Navbar `z-[1000]` < mobile menu `z-[1001]` < ExpandingCardLink panel `z-[1500]` < skip link `z-[2000]` | see components |
| Easing | `EASE_STANDARD` | cubic-bezier `[0.25, 0.1, 0.25, 1]` (= CSS `ease`) | motion/tokens.ts:11 |
| Easing | `EASE_SCROLL_REVEAL` | `[0.16, 1, 0.3, 1]` declared, NOT applied anywhere | tokens.ts:18 |
| Easing | rise-in keyframe | `cubic-bezier(0.22, 1, 0.36, 1)` 0.5s, translateY 12px to 0 | globals.css:77-90 |
| Easing | Lenis | `1 - (1-t)^3` (ease-out cubic) | SmoothScroll.tsx:18 |
| Duration | `DURATION` | fast 0.25, base 0.6, slow 0.7, reveal 0.5 (seconds) | tokens.ts:20-26 |
| Stagger | `STAGGER` | step 0.12 / delay 0.1; fastStep 0.07 / fastDelay 0.05; slowStep 0.18 / slowDelay 0.15 | tokens.ts:28-35 |
| Viewport | `VIEWPORT_ONCE` | `{ once: true, margin: "-100px" }` | tokens.ts:41 |
| Reveal 3D | `REVEAL` | rotateX 55deg to 0, scale 0.72 to 1, perspective 1600px, offset `["start end","center 65%"]` | tokens.ts:43-50 |
| Star border | `STAR_SPEED` | idle `5s`, hover `2s` | tokens.ts:52 |
| Global reduced-motion | CSS block | all `animation-duration`/`transition-duration` = 0.01ms, iteration 1, `scroll-behavior:auto` | globals.css:538-547 |
| Focus | Global `:focus-visible` | `outline: 2px solid #314344; outline-offset: 2px; border-radius: 4px` | globals.css:45-49 |

Tailwind `animation.float` (6s ease-in-out infinite, translateY 0 to -12px) is defined (tailwind.config.ts:52-60) but not used by anything on the home page (unclear if used elsewhere).

#### Route names (src/i18n/routing.ts)
Locales `vi` (default), `en`; `localePrefix: "always"` (so `/vi/...`, `/en/...`); `alternateLinks: false`. Internal key (vi folder name) to public URL:

| Key | vi | en |
|---|---|---|
| `/` | `/` | `/` |
| `/bai-hoc` | `/bai-hoc` | `/lessons` |
| `/bai-hoc/[topic]` | `/bai-hoc/[topic]` | `/lessons/[topic]` |
| `/bai-hoc/[topic]/[slug]` | same | `/lessons/[topic]/[slug]` |
| `/blog`, `/blog/[slug]` | same | same |
| `/gioi-thieu` | `/gioi-thieu` | `/about` |
| `/video`, `/video/[slug]` | `/video` | `/videos` |
| `/tim-kiem` | `/tim-kiem` | `/search` |
| `/lien-he` | `/lien-he` | `/contact` |
| `/dong-gop` | `/dong-gop` | `/contribute` |
| `/chinh-sach-bao-mat` | same | `/privacy` |

Labels: `LOCALE_LABELS` VI/EN; `LOCALE_NAMES` "Tiếng Việt"/"English". Nav items (lib/constants.ts:7-15): home `/`, lessons `/bai-hoc`, forum (label "Blog") `/blog`, about `/gioi-thieu`. Lesson sub-nav: "Lý thuyết" `/bai-hoc`, "Video" `/video`. Footer links: Liên hệ, Đóng góp, Chính sách bảo mật.

#### Page canvas
Every page: `body` = `min-h-[100dvh] bg-bg font-body text-text antialiased` (app/layout.tsx:57). Page is light grey `#E5E5E5`; content lives on white cards or grey-scale bands. No dark mode.

---

### 1. Global shell

#### Root layout: `src/app/layout.tsx`
- Loads two Google fonts (see tokens), sets `<html lang>` and font CSS-var classes, `<body>` classes above. `generateMetadata` uses `meta.siteName` ("Project Chíp Chíp"), title template `%s | Project Chíp Chíp`, OG + Twitter `summary_large_image`.
- Deliberately NO `NextIntlClientProvider` here (comment lines 58-71: layout persists across soft navs so locale would go stale).

#### Locale layout: `src/app/[locale]/layout.tsx`
- `generateStaticParams` for vi/en; 404 on unknown locale; `setRequestLocale`.
- Wraps in `NextIntlClientProvider` + `DocumentLang` + `SmoothScroll`.
- Renders: skip link, `<Navbar/>`, `<main id="main">{children}</main>`, `<Footer/>`.
- Skip link (lines 37-42): `sr-only`; on focus becomes `fixed left-4 top-4 z-[2000] rounded-full bg-primary px-4 py-2 text-sm font-medium text-white`. Text: "Chuyển tới nội dung chính".
- A11y: skip link, `<main id="main">`.

#### DocumentLang: `src/components/layout/DocumentLang.tsx`
Client effect sets `document.documentElement.lang = locale` on locale change. Renders null.

#### Navbar: `src/components/layout/Navbar.tsx` (client, 347 lines)
- Purpose: fixed top bar on every page. Contents left to right: Logo (home link), desktop nav pill (lg+), then right cluster: SearchBox (lg+), SocialLinks (md+, hidden if no hrefs), LangSwitch (sm+), CTA "Tham gia cùng chúng tôi" to `/gioi-thieu` (md+), hamburger button (below lg).
- Layout: `<header class="fixed inset-x-0 top-0 z-[1000] transition-colors duration-300">` (l.140-146). Inner: `mx-auto flex w-full max-w-content items-center justify-between gap-4 px-5 py-3.5 md:px-8 md:py-4` (l.148). Below it a spacer `h-[68px] md:h-[76px]` (l.236) so content is not hidden. Hero's min-height calc mirrors these numbers.
- Scroll state (l.74-79): `scrollY > 12` toggles from `border-b border-transparent bg-transparent` to `border-b border-border/70 bg-bg/80 backdrop-blur-xl` (colour transition 300ms, Tailwind default easing). At top the bar is fully transparent over the hero backdrop.
- Logo sizing `text-[19px] md:text-[22px]`.
- Desktop nav (l.159-210): wrapped in `GlassPill radius={999}`; inner `nav flex items-center gap-1 px-1.5 py-1.5`. Links `relative rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors`. Inactive `text-text-nav hover:bg-surface-muted hover:text-accent`; active `text-white` on an absolutely positioned `bg-primary` rounded-full pill that fades in/out via framer `AnimatePresence` (opacity 0 to 1, `DURATION.fast` 0.25s, `EASE_STANDARD`; duration 0 under reduced motion) (l.189-203). The active pill is per-link (not a shared sliding layoutId), so it cross-fades, not slides. `aria-current="page"` on active. Lessons entry is replaced by `LessonsMenu`; active if pathname is `/bai-hoc*` or `/video*`.
- Mobile drawer (l.238-344): below `lg`. Full-screen `fixed inset-0 z-[1001] bg-primary` dialog (`role="dialog" aria-modal`), fade in/out opacity 0.2s (0 under reduced motion). Contents: Logo (white) + close X button (`size-10 rounded-xl border border-white/15 bg-white/5`); dark SearchForm; nav list with links `block px-4 py-5 text-xl tracking-[-0.01em]`, active `text-white` else `text-white/70`, rows separated by `border-b border-white/10`; under "Bài học" a sub-list (`pl-8`, `min-h-11 text-base`) with Lý thuyết / Video; bottom: dark LangSwitch + dark SocialLinks, full-width `PillButtonCta`.
- Hamburger: `size-10 rounded-xl border border-border bg-surface`, `MenuIcon` size-5, `aria-expanded`, `aria-label` "Mở menu".
- Behaviour: locks body/html overflow while open; focus moves to close button; Tab trapped within panel; Escape closes; focus restored to opener on close (l.81-136). `LangSwitchFallback` (l.29-54) has same box model for Suspense.
- A11y: `aria-label` "Điều hướng chính" on navs, `aria-current`, focus trap.
- Motion library: framer-motion + CSS.

#### LessonsMenu: `src/components/layout/LessonsMenu.tsx`
- Desktop "Bài học" disclosure (button + list of links, NOT ARIA menu). Button classes match nav links plus `ChevronDown size-3.5` that rotates 180deg on open (CSS transition, `motion-reduce:transition-none`). Active state `bg-primary text-white`.
- Opens on: click/Enter/Space; mouse hover (pointerType === "mouse" only); closes on Escape (returns focus to button if focus was inside), outside pointerdown, blur out, pathname change, mouse leave. Hover-opened then click does not toggle shut (openedByHoverRef).
- Dropdown: `absolute left-0 top-full z-10 pt-2` (top padding bridges gap), list `min-w-[180px] rounded-2xl border border-border bg-surface p-1.5 shadow-float`; items `min-h-11 rounded-xl px-4 text-sm font-medium text-text-nav hover:bg-surface-muted hover:text-accent focus-visible:bg-surface-muted`.
- Animation: framer `AnimatePresence`, opacity 0 to 1 and y -4 to 0, `DURATION.fast` 0.25s, `EASE_STANDARD`; under reduced motion y offset 0 and duration 0 (l.115-121).
- A11y: `aria-expanded`, `aria-controls` (useId).

#### SearchBox: `src/components/search/SearchBox.tsx` (+ `SearchForm.tsx`)
- Desktop only (`hidden lg:block`). Icon button `size-11 rounded-full text-text-nav hover:bg-surface-muted hover:text-accent` toggles Search/X icon (lucide, size 18, stroke 2). Panel `absolute right-0 top-full z-10 mt-2 w-[min(380px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-surface p-2 shadow-float`, shown via `hidden` attribute (no animation).
- Focuses input on open; Escape closes and refocuses button; outside pointerdown/blur closes. `aria-expanded`, `aria-controls`, labels "Mở ô tìm kiếm" / "Đóng ô tìm kiếm".
- SearchForm: plain GET form `role="search"` to `/tim-kiem` (works without JS). Input `h-11 rounded-xl border px-3.5 text-base md:text-sm`; light: `border-border bg-surface placeholder:text-text-muted focus:border-black/40 focus-visible:ring-2 ring-accent`; dark: `border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-white/50 ring-white`. Submit `h-11 rounded-xl px-4 text-sm font-semibold` light `bg-primary text-white hover:bg-black/80`, dark `bg-white text-primary hover:bg-white/90`, with Search icon size-4. Placeholder "Ví dụ: bán dẫn, transistor…", submit "Tìm".

#### LangSwitch: `src/components/layout/LangSwitch.tsx`
Segmented control `flex items-center rounded-full p-0.5`, bg `surface-muted` (light) or `white/10` (dark). Two buttons VI / EN: `rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors`. Active: light `bg-primary text-white`, dark `bg-white text-accent`. Inactive: light `text-text-muted hover:text-accent`, dark `text-white/60 hover:text-white`. `role="group"`, `aria-current` on active, `aria-label` "Chuyển sang {language}". Uses `router.replace` with locale; preserves `?q=` on search page. Hidden below `sm` in header (shown in mobile drawer).

#### Logo: `src/components/layout/Logo.tsx`
Typographic wordmark, no image (`role="img" aria-label="Project Chíp Chíp" translate="no"`). Two lines, centered: top "PROJECT" at `0.28em`, bold, uppercase, `tracking-[0.4em]`, flanked by two 1px lines (`opacity-55`) via `flex-1 h-px bg-current`; below "CHÍP CHÍP" at `1em`, `font-extrabold uppercase leading-[0.92] tracking-[0.02em] [word-spacing:0.14em]`, colour `#0d0d0d`. Everything em-based so it scales from wrapper font-size (19px mobile, 22px md+; white in mobile drawer). `compact` prop hides "PROJECT". Comment says "replace with real vector logo once exported".

#### SocialLinks: `src/components/layout/SocialLinks.tsx`
Facebook and TikTok inline SVG icons (18px) in `size-9 rounded-full` links; light `text-text-muted hover:bg-surface-muted hover:text-accent`, dark `text-white/70 hover:bg-white/10 hover:text-white`. CURRENTLY RENDERS NOTHING because `SOCIAL_LINKS` hrefs are empty strings (lib/constants.ts:75-81). Design should keep a slot for them.

#### Footer: `src/components/layout/Footer.tsx`
- `<footer class="cv-auto relative z-20 border-t border-border bg-surface">`. `z-20` is load-bearing so it paints above the home SceneFillOverlay (z-15).
- Inner: `mx-auto grid w-full max-w-content gap-6 px-5 py-12 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8 md:px-8`. Mobile: row with Logo left and social right, then centered links + copyright stacked. md+: 3 columns: Logo (left), centre stack (links above copyright), social (right).
- Links: `min-h-11 text-sm text-text-nav underline-offset-4 hover:text-accent hover:underline`, `gap-x-5`, wrap. Copyright `text-xs md:text-sm text-text-muted`, `max-w-xs md:max-w-md`, centered: "© 2026 Project Chíp Chíp. Mọi nội dung được chia sẻ vì mục đích giáo dục."
- Footer nav `aria-label` "Thông tin". No animation. Site nav is NOT in the footer (lives in home JoinCta card).

#### SmoothScroll: `src/components/ui/SmoothScroll.tsx`
Lenis smooth scroll wrapper (rAF-driven): `duration 0.9`, easing ease-out cubic, `smoothWheel true`, `wheelMultiplier 1`, `touchMultiplier 0`. Disabled entirely when `prefers-reduced-motion: reduce` or when not `(hover: hover) and (pointer: fine)` (i.e. touch devices use native scroll). Global for every page.

#### PillButton / PillButtonCta: `src/components/ui/PillButton.tsx`
- Primary CTA pill. Variants `brand`/`dark` (same near-black gradient: 131deg #333 to #0d0d0d to #262626) and `outline`. Sizes: sm/md `h-11 pl-6 pr-4 text-sm`; lg `h-[52px] pl-5 pr-4 text-base`. Root `rounded-3xl`, `overflow-hidden`, `font-medium text-white` (outline `font-normal`, label `text-accent`). Trailing `ArrowRight 18px stroke 2` (white/85, outline accent/80).
- Dark shadow: `inset 0 2px 4px rgba(0,0,0,.18), inset 0 -2px 4px rgba(255,255,255,.22)`. Outline: 1.4px transparent border with white padding-box and gradient border-box `linear-gradient(206.97deg, rgba(49,67,68,.28) 13.96%, rgba(49,126,106,.18) 50.79%, rgba(49,67,68,.28) 83.14%)`, inset shadow `0 2px 4px rgba(0,0,0,.03)` + `0 1px 2px rgba(0,0,0,.04)`.
- ANIMATION (dark variants only, hidden under reduced motion): "star border" traveling glow (see StarBorder). A 1.5px-inset inner cover in the same gradient (`STAR_RIM = 1.5`) hides the glow except a thin rim. Speed 5s idle, 2s on mouse hover (JS `hovered` state switches `animationDuration`).
- Tap: when rendered as `<button>`, framer `whileTap: { scale: 0.97 }`, 0.2s `EASE_STANDARD` (none under reduced motion). When rendered as a link (`href`), no tap scale.
- `PillButtonCta`: same, always arrow, optional `showShadow` (`0 4px 0 rgba(0,0,0,.35)`), used in navbar and drawer.
- No explicit disabled or focus style beyond global focus-visible outline.

#### StarBorder: `src/components/ui/StarBorder.tsx` + globals.css:489-536
Two spans (`.border-gradient-bottom`, `.border-gradient-top`), each `300%` wide, `50%` tall, `border-radius:50%`, `opacity .7`, background `radial-gradient(circle, rgba(255,255,255,.95), transparent 10%)`. CSS keyframes `star-movement-bottom` (translate 0 to -100%, opacity 1 to 0) and `star-movement-top` (0 to +100%, opacity 1 to 0), `linear infinite`, duration = idle 5s / hover 2s. Positioned bottom:-12px right:-250% / top:-12px left:-250%, z-0.

#### GlassPill: `src/components/ui/GlassPill.tsx`
Container for the desktop nav. Outer `p-[1.4px]` with conic-gradient greyscale "metallic" border: `conic-gradient(from 0deg at 50% 50%, #D9D9D9 0deg, #D9D9D9 65deg, #F2F2F2 150deg, #E9E9E9 176deg, #D9D9D9 204deg, #D9D9D9 255deg, #CFCFCF 285deg, #ECECEC 319deg, #D9D9D9 360deg)`. Inner: `linear-gradient(95deg, rgba(255,255,255,.80) 4.23%, rgba(255,255,255,.40) 56%, rgba(223,227,229,.50) 99.91%)`, `backdrop-filter: blur(10px)`, inset shadows `0 4px 6px rgba(255,255,255,.2)` + `0 -2px 4px rgba(255,255,255,.3)`, `translateZ(0)`, `will-change: backdrop-filter`. Radius prop (default 12; navbar passes 999, inner = radius - 1.4). No animation.

#### CircularText: `src/components/ui/CircularText.tsx`
SVG `textPath` on a circle, uppercase, `fill-current`, defaults diameter 240, font 18, letter-spacing 0.18em. framer `animate rotate: 360` (or -360 if `reverse`), `repeat: Infinity`, `ease: "linear"`, duration default 22s (`durationSeconds`). Static under reduced motion. `aria-hidden`, `pointer-events-none`. Used in JoinCta.

#### MenuIcon: `src/components/ui/MenuIcon.tsx`
20x20 three-line hamburger, 1.75 stroke, round caps, lines at y 5.5 / 10 / 14.5. Static (no morph).

#### AutoplayVideo: `src/components/ui/AutoplayVideo.tsx`
Shared muted looping `<video>` used in Hero, LessonTopics, VideoCarousel (and other pages).
- Loading strategies: `eager`; `loadOnScroll` (waits for `scrollY > 0`, or immediately under reduced motion); default IntersectionObserver with `rootMargin 200px`; `playMode="press"` (play only while `isPressing`).
- Play control: IntersectionObserver (200px margin) plays when visible, pauses when off-screen. `paused` prop (carousel inactive slots) and reader `userPaused` override.
- Under `prefers-reduced-motion`: no autoplay (poster-less paused first frame; videos are `muted loop playsInline preload="metadata"`).
- `mobileTapFullscreen` (used by Hero): below 768px the inline video is paused; a full-cover button shows a 64px (size-16) frosted-white round play glyph (`bg-white/25 backdrop-blur-sm`, shadow `0 10px 28px rgba(0,0,0,.22)`, `active:scale-95`), tap toggles play; background overlay `bg-black/5`.
- `controls` prop adds a pause/play button (WCAG 2.2.2): `absolute bottom-2.5 right-2.5 z-20 size-9 rounded-full bg-black/55 hover:bg-black/75 text-white`, opacity 0 until group hover (always visible when paused, or on focus-visible), icons Play/Pause size-4. Hidden under reduced motion.
- `fit` `cover` (default) or `contain` (object-fit). `object-position` prop.
- A11y: `aria-label`, control labels "Phát {label}" / "Tạm dừng {label}".

---

### 2. Motion system: `src/components/motion/*`

Single import surface `index.ts`. Header comment (tokens.ts:1-8): values were copied verbatim from a reference project "Strike_Robot_LandingPage_Desing"; goal is one consistent easing/duration vocabulary.

#### tokens.ts
See summary table (EASE_STANDARD, DURATION, STAGGER, VIEWPORT_ONCE, REVEAL, STAR_SPEED).

#### variants.ts (framer Variants; use with `initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE}`)
| Variant | Hidden | Visible | Transition |
|---|---|---|---|
| `fadeUp` | opacity 0, y 24 | opacity 1, y 0 | 0.6s EASE_STANDARD |
| `fadeIn` | opacity 0 | 1 | 0.5s |
| `fadeUpScale` | opacity 0, y 32, scale .96 | 1, 0, 1 | 0.65s |
| `slideInLeft` | opacity 0, x -32 | x 0 | 0.6s |
| `slideInRight` | opacity 0, x 32 | x 0 | 0.6s |
| `staggerContainer` | | | staggerChildren 0.12, delayChildren 0.1 |
| `staggerContainerFast` | | | 0.07 / 0.05 |
| `staggerContainerSlow` | | | 0.18 / 0.15 |
| `staggerItem` | opacity 0, y 20 | 1, 0 | 0.55s EASE_STANDARD |
| `staggerItemScale` | opacity 0, y 24, scale .95 | 1, 0, 1 | 0.6s |

#### AnimatedSection.tsx
Wraps a `<section class="relative">`. In view (VIEWPORT_ONCE: fires 100px inside viewport, once): opacity 0 to 1, y 32 to 0, `DURATION.slow` 0.7s, `EASE_STANDARD`, optional `delay` prop. Reduced motion: plain static section (no transform). Note it does not accept `aria-label`; callers wrap in their own `<section>`.

#### MainSection.tsx
Non-animated wrapper `div.relative.z-20.overflow-hidden.bg-bg` with vertical gradient `linear-gradient(0deg, rgba(242,242,242,0) 0%, rgb(224,224,224) 30.945%, rgb(215,215,215) 45.719%, rgb(255,255,255) 100%)` (bottom = transparent-grey, going to white at the top; net effect: bottom of the lower half is `#E5E5E5`-ish, top is white). `transparent` prop skips gradient. Comment: deliberately no scroll motion (repaint cost). It covers the sticky backdrop + SceneFillOverlay for the lower half. Renders `div` not `main`.

#### StickyBackdrop.tsx
Server component. `div aria-hidden pointer-events-none sticky top-0 z-0 h-[100dvh] w-full` holding a `<picture>` (desktop `src` at `min-width:768px`, `mobileSrc ?? src` for `<img>`), `object-cover object-center`, `fetchPriority="high"`, `decoding="async"`. `z-0` not negative (explained in the file comment: body has opaque bg). Home passes `/hero-backdrop.jpg` (299 KB) with extra classes `[&_img]:scale-105 [&_img]:opacity-40 [&_img]:blur-[6px]` (page.tsx:60): image is upscaled 5%, 40% opacity and 6px blurred, so it reads as a soft ghost texture on the grey page. (I did not view the image; content unclear. Constant `HERO_BACKDROP = "/hero-backdrop.jpg"`. A `hero-backdrop.svg` also exists, used only by the gallery.) `mobileSrc` is not passed on home, so phones load the same image.

#### SceneFillOverlay.tsx
"Scene change" overlay: `motion.div aria-hidden pointer-events-none fixed inset-0 z-[15] bg-bg` (solid `#E5E5E5`), `clip-path: circle(R% at 50% 100%)` where R grows from 0 to 150 (`FILL.maxRadius`). So a grey disc grows out of the bottom-centre of the viewport and eventually covers the whole screen, hiding the sticky backdrop and hero content.
- Driver: rAF-throttled `scroll` + `resize` listeners measure `document.getElementById(targetId).getBoundingClientRect().top` against `window.innerHeight` (home targetId = `latest-posts`). Progress via `fillProgress`: 0 when the target's top is at 100% of viewport height (`startVh 1.0`), 1 when it has risen to 30% down the viewport (`endVh 0.3`); clamped linear.
- Smoothing: `useSpring` `{ stiffness 220, damping 32, mass 0.6 }` then `useTransform [0,1] to [0,150]`; `will-change: clip-path`.
- Reduced motion: returns null (no overlay, no listeners).
- IMPORTANT layering consequence (a design implication): target is the `#latest-posts` section, which is near the END of the page, while `MainSection` (z-20) already covers the backdrop from `SimpleStart` onward. So visually the overlay only appears behind/around the tail of the page (it only ever paints between hero z-10 and MainSection z-20); the exact perceived effect is unclear without running the page. The Footer is `z-20` so it stays above it.

#### fillProgress.ts
Pure function `fillProgress(rectTop, viewportHeight)`; `FILL = { startVh: 1.0, endVh: 0.3, maxRadius: 150 }`.

#### useSharedScrollProgress.ts
Returns `targetRef` + `scrollYProgress` from framer `useScroll({ target, offset: ["start end","center 65%"] })`. Progress 0 when the target's top meets the viewport bottom; 1 when the target's centre reaches 65% down the viewport. Shared so Hero title and video read one timeline.

#### ScrollReveal3D.tsx
Scroll-linked 3D "lid opening": container `perspective: 1600px`; inner motion.div `rotateX` 55deg to 0deg and `scale` 0.72 to 1, both LINEAR against scroll progress (no easing, no spring), `transformOrigin: 50% 100%` (hinges on bottom edge), `transformStyle: preserve-3d`, `will-change: transform`. Reduced motion: renders plain static div. Uses the shared `targetRef` in Hero.

#### TiltCard.tsx
Plain CSS hover tilt on an `<article>`: `[perspective:1400px] transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]`; from `md` up on hover, left card `rotateX(2deg) rotateY(-5deg) rotateZ(-1deg)`, right card `rotateX(2deg) rotateY(5deg) rotateZ(1deg)` (they splay outward). No tilt below md. It has no reduced-motion guard itself (the global CSS 0.01ms transition rule covers it; MotionGrid also skips it under reduced motion). Note: `perspective` on the article while the transform is applied on the same element means the perspective property does not affect its own transform (unclear practical depth effect; may look like a flat skew).

#### AnimatedButtonLabel.tsx + letterDance.ts
Per-letter "dance" on hover of a parent. Text is split into letters (`motion.span`, `inline-block`, `transformOrigin 50% 60%`). On `active` the letter keyframes over 0.55s with `times [0, 0.45, 1]` (peak at 45%, `EASE_STANDARD`): y `0 to meta.y to 0` (meta.y = -(1 to 4)px), scale `1 to (1.2 to 1.45) to 1`, rotate `0 to (+/-12deg) to 0`, opacity `1 to (0.70 to 0.92) to 1`, fontWeight `rest to hover to rest` (default 500 to 700; outline 400 to 700), per-letter delay 0 to 80ms. Jitter is deterministic via `pseudoRand(seed) = frac(sin(seed*12.9898+78.233)*43758.5453)` so a label always dances identically. Rest transition 0.25s. A hidden copy at the heaviest weight reserves width; visible letters `aria-hidden`; `sr-only` copy holds the text. Enabled only if not reduced-motion AND `(pointer: fine)`. Used in Hero primary CTA and JoinCta button.

#### DriftTextPath.tsx
Sideways-drifting text along a shallow SVG quadratic arc (viewBox 1200 x arcHeight*2; default arcHeight 60, speed 10 px/s, text repeated 6x), rAF loop, runs only while intersecting (rootMargin 100px), `hidden md:block`, `aria-hidden` with sr-only text. Off under reduced motion. NOT used on the home page (verified: no import in home sections); showcased in motion-gallery. Unclear if used on other pages.

#### useHoldToReveal.ts + holdToReveal.ts
Touch replacement for hover overlays (coarse pointer only). Reducer rules: `holdMs 280` to count as a hold; `moveThresholdPx 8` before it is treated as scroll; `hideAfterHoldMs 1000` after a hold, `hideAfterTapMs 2500` after a glancing tap. Wired to pointerdown/move/up/cancel. Not used on home; used in gallery cards (and possibly elsewhere: unclear).

#### VideoHoverCard.tsx + useVideoHoverCard.ts
Frosted preview card over the Hero video (desktop hover only: `(hover: hover) and (min-width: 768px)`). Card: `absolute bottom-5 right-5 z-10 w-[260px] pointer-events-none`; inner `rounded-2xl bg-black/45 p-5 backdrop-blur-xl`; text: label `text-sm font-semibold text-white`, sublabel `text-xs text-white/75`, `ArrowUpRight size-4 text-white/80`. Border: SVG `rect` stroke `rgba(255,255,255,0.9)` 1.5px, `pathLength=100`, `strokeDasharray "14 86"`, CSS `heroCardBorderRun 3.5s linear infinite` (dashoffset 0 to -100), 2s when `.hero-video-card:hover` (globals.css:472-487). Entrance: `initial {opacity 0, y 28, scale .96}` to `{1, 0, 1}`, exit `{opacity 0, y 16, scale .97}`, `DURATION.reveal` 0.5s `EASE_STANDARD`. Reduced motion: no motion.div, appears/disappears instantly. Hook keeps the card up `hideDelayMs = 2500` after pointer leaves the video, cancels on re-enter. Card text is vi "Xem toàn bộ video" / "Bấm để mở trên kênh của dự án". NOTE: card is `pointer-events-none` and not a link even though the copy says "click to open on channel" (unclear/possibly unfinished behaviour).

#### Motion gallery: `src/app/motion-gallery/page.tsx` (+ `MotionGalleryClient.tsx`)
Internal showcase page (Vietnamese labels) to compare each motion effect against the reference build at three widths. `notFound()` in production, `robots: noindex,nofollow`, not linked anywhere. Renders SceneFillOverlay (targetId `lower-half`), StickyBackdrop with `/hero-backdrop.svg`, a shared-scroll title, ScrollReveal3D, TiltCards with hold-to-reveal, etc. Not part of the shipped site.

#### Other CSS motion in globals.css
- `.rise-in`: 0.5s `cubic-bezier(.22,1,.36,1)` opacity 0 to 1, translateY 12px to 0 (interior page headers).
- `.cv-auto`: `content-visibility:auto; contain-intrinsic-size:auto 600px` (used on VideoCarousel, LatestPosts, JoinCta, Footer sections to defer off-screen render).
- Global reduced-motion block (see tokens).

---

### 3. HOME page: `src/app/[locale]/page.tsx`

- ISR `revalidate = 3600`. Metadata: title absolute "Project Chíp Chíp", description from `meta.description` ("Project Chíp Chíp là cộng đồng học tập phi lợi nhuận giúp học sinh trung học phổ thông hiểu đúng và đủ về bán dẫn."), hreflang alternates via `localeAlternates`.
- Data: `getLatestPosts(locale, 3)` (Supabase `posts` where `status=published`, `locale`, `kind=forum`, order `published_at desc`, limit 3; returns [] on error) and `countLessonsByTopic(locale)` (Supabase `posts` where kind=lesson published, counts rows per `topic`; {} on error).
- Structure:
  1. `<SceneFillOverlay targetId="latest-posts"/>` (fixed, z-15)
  2. `div.relative` containing `StickyBackdrop` + `div.relative.z-10.-mt-[100dvh]` containing `<Hero/>` (hero overlaps the sticky backdrop by pulling up 100dvh)
  3. `<MainSection>` (z-20, gradient) containing SimpleStart, LessonTopics, EcosystemDiagram, CountryBands, VideoCarousel, LatestPosts, JoinCta.

Effect: on load the hero sits over a blurred ghost photo that stays fixed; as the user scrolls, the hero's video tilts up (3D), then the lower half slides over the sticky backdrop.

#### 3.1 Hero: `src/components/sections/Hero.tsx` (client)
- Purpose/content (vi):
  - Badges: "Đơn giản" and "Miễn phí" (each with a 12px four-point sparkle SVG icon).
  - H1: "Một đứa trẻ ba tuổi cũng có thể" + " tìm hiểu về bán dẫn" (second part wrapped in `.text-gradient-brand`, which is solid #0d0d0d, so no visible difference from part 1).
  - Paragraph: "Nhận thấy tiềm năng to lớn của vi mạch — bán dẫn, xong nguồn học còn hạn chế và rời rạc — đó là lý do ra đời của Project Chíp Chíp."
  - CTAs: primary "Tìm hiểu ngay" to `/bai-hoc` (PillButton lg, brand, with AnimatedButtonLabel); secondary "Về chúng tôi" to `/gioi-thieu` (PillButton outline lg).
  - Below the fold: intro video `/video/hero-intro.mp4` (4.9 MB, 29s clip of "The Closest Thing We Have to Alien Technology"), caption "Vi mạch — thứ gần nhất với công nghệ của người ngoài hành tinh mà chúng ta đang có." + " · " + credit link "The Closest Thing We Have to Alien Technology" (YouTube, `underline underline-offset-4`, target blank).
- Layout:
  - `section px-5 pb-4 md:px-8`.
  - Headline block: `flex min-h-[calc(100dvh-68px)] md:min-h-[calc(100dvh-76px)] flex-col items-center justify-center` (fills the first viewport under the navbar; video is fully below the fold on load). Inner column `max-w-content text-center`, items centered.
  - Badges: `flex-wrap gap-2 justify-center`. Badge = `rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[13px] font-medium text-accent`.
  - H1: `mt-6 max-w-4xl text-balance font-extrabold leading-[1.12] tracking-[-0.03em] text-text`, sizes 32px base, `sm` 44px, `md` 56px, `lg` 64px.
  - Paragraph: `mt-6 max-w-2xl text-pretty text-base md:text-lg leading-relaxed text-text-muted`.
  - CTA row: `mt-9 flex-wrap justify-center gap-3`.
  - Video block: `mx-auto mt-14 w-full max-w-content`; frame `relative aspect-video overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-primary shadow-card`. Figcaption `mx-auto mt-4 max-w-2xl text-center text-sm text-text-muted`.
- Animations:
  - Entrance ON MOUNT (not in view): container `staggerContainer` (0.12s step, 0.1s delay) with items `staggerItem` (opacity 0 y20 to 1 y0, 0.55s EASE_STANDARD): order badges row, H1, paragraph, CTA row. Disabled under reduced motion (no initial/animate).
  - Scroll-linked recede of the whole headline block: opacity `[1, 0.7, 0]` at progress `[0, 0.5, 1]`, scale `[1, 0.92]`, driven by the video wrapper's shared timeline (offset "start end" to "center 65%"). Off under reduced motion. Potential conflict (unclear): the same element has `variants` animating opacity AND a `style.opacity` MotionValue; framer normally lets the variant win until it completes; behaviour after mount not verified.
  - Video: `ScrollReveal3D` (rotateX 55deg to 0, scale 0.72 to 1 linear with scroll, hinge at bottom, perspective 1600px).
  - CTA primary: AnimatedButtonLabel letter dance triggered by hover on the wrapping span (`ctaHovered`). Pill star-border glow as above (5s idle, 2s hover). Outline pill has no effect.
  - Video hover card (desktop only) as above with AnimatePresence.
  - Video: AutoplayVideo `loadOnScroll` (only downloads after `scrollY > 0`), `mobileTapFullscreen` (tap-to-play with big frosted play button below md), `controls` (pause/play corner button).
- States: pill hover (glow speed-up), outline pill none, video hover shows card, video paused control. Empty/loading: none.
- Backdrop behind hero: see StickyBackdrop above.
- A11y: video `aria-label` "Video giới thiệu về bán dẫn"; badges' icon `aria-hidden`; motion respects reduced motion; H1 is the page's only h1.
- Files: `src/components/sections/Hero.tsx`, `motion/{ScrollReveal3D,useSharedScrollProgress,VideoHoverCard,useVideoHoverCard,AnimatedButtonLabel,variants}`, `ui/{AutoplayVideo,PillButton,StarBorder}`, `public/video/hero-intro.mp4`, `public/hero-backdrop.jpg`.

#### 3.2 SimpleStart: `src/components/sections/SimpleStart.tsx` (server)
- Purpose: first block of the lower half; a two-line statement in a white card.
- Copy: title "Bắt đầu từ những điều đơn giản nhất"; description "Giới thiệu những kiến thức căn bản nhất về bán dẫn, một cách thật đầy đủ, chính xác và trực quan tới tất cả bạn đọc."
- Layout: `section px-5 py-14 md:px-8 md:py-16`; card `relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 md:px-12 md:py-12`. Left brand rail: `absolute inset-y-0 left-0 w-1 bg-brand-gradient` (4px dark gradient bar clipped by card radius). Top strip: `mb-7 md:mb-8 flex items-center gap-3` with a `size-1.5` (6px) square black marker and a 1px `bg-border` hairline filling the rest.
- Heading: `SectionHeading variant="statement"`: `grid gap-4 md:grid-cols-2 md:items-start md:gap-12` (title left, description right on md+; stacked on mobile). Title `text-[24px] sm:28px md:30px font-extrabold leading-[1.2] tracking-[-0.02em] text-balance max-w-3xl`. Description `text-[15px] md:text-base text-text-muted leading-relaxed max-w-2xl`.
- Animation: only the SectionHeading stagger (see 3.9). Card itself static.

#### 3.3 LessonTopics: `src/components/sections/LessonTopics.tsx` (client)
- Purpose: interactive accordion of four lesson topics with a preview video beside it (desktop).
- Copy: heading "Bốn chủ đề, từ số 0 tới toàn cảnh ngành bán dẫn"; description "Mỗi chủ đề là một mạch bài ngắn, đọc liền một hơi: bán dẫn là gì, transistor và vi mạch hoạt động ra sao, chúng có mặt ở đâu trong đời sống, và ngành này đã đi tới đâu. Không cần kiến thức nền — cứ bắt đầu từ chủ đề đầu tiên."
- Topics (from `topics.*`): Định nghĩa ("Bán dẫn là gì, vì sao nó trở thành nền tảng của gần như mọi thiết bị điện tử."), Nguyên lý ("Transistor và vi mạch hoạt động như thế nào, từ vật lý cơ bản tới chip hiện đại."), Ứng dụng ("Bán dẫn có mặt ở đâu trong đời sống, và những ngành nghề nào đang cần nhân lực."), Lịch sử và Phát triển ("Từ chiếc transistor đầu tiên tới cuộc đua chip toàn cầu ngày nay."). Each panel ends with a link to `/bai-hoc/[topic]` reading "{count} bài viết" (count from Supabase) or "Đọc thêm" if 0; if 0 also shows "Chủ đề này chưa có bài viết nào."
- Data: `counts` prop from `countLessonsByTopic`; topic order `dinh-nghia, nguyen-ly, ung-dung, lich-su`; videos `TOPIC_VIDEOS` = `/video/asml-part1..4.mp4` (four consecutive 30s cuts of ASML "Computational lithography...", credited on the page per comment).
- Layout: `section#topics px-5 py-16 md:px-8 md:py-24`; heading; then `mt-10 md:mt-14`, from `lg` a flex row `lg:flex lg:items-start lg:gap-12`: accordion column `mx-auto max-w-3xl` (lg: `flex-1`, no max), video column `lg:w-[38%] lg:max-w-[480px] shrink-0`, hidden below lg. Accordion has `md:pl-8`; from md a 1px vertical rail (`bg-border`, `left-0 top-3 bottom-3`) plus a 3px black moving indicator (`w-[3px] rounded-full bg-primary`, height 44px, left -1px).
- Row: header button `flex w-full items-center gap-4 px-4 py-5 sm:gap-5 sm:px-6 text-left`; 12px round topic-tone dot; title; ArrowRight icon (size-4). Active row gets a rounded-2xl surface tinted with the topic's `soft` colour + `border-black/[0.06]`. Panel: `pb-6 pl-11 pr-5 sm:pl-14 sm:pr-7`, description `max-w-md text-[15px] text-text-muted`, link `mt-4 text-sm font-semibold text-accent hover:text-black` + ArrowRight size-4.
- Dividers: 1px `bg-border` line at the top of each row except the first and except lines touching the active row (active card reads as one block); a bottom line under the last row when it is not active.
- Interaction/animation (all framer, EASE_STANDARD unless noted, all duration 0 under reduced motion):
  - Open trigger: click, focus (keyboard focus also selects), or mouse hover with 120ms intent delay (`setTimeout`, cancelled on leave; the open row stays open when the cursor leaves). First topic open by default.
  - Active surface opacity 0 to 1: 0.4s. Divider opacity: 0.25s.
  - Title text animates `fontSize 19px to 21px`, `fontWeight 500 to 600`, `opacity .85 to 1`: 0.3s.
  - Dot: CSS transform scale 1 to 1.35, `duration-300`. Arrow: rotate 0 to 90deg, opacity .35 to 1, 0.3s.
  - Panel: height `0 to auto` 0.45s + opacity (0.4s in, 0.18s `easeOut` out); `aria-hidden` when closed; link `tabIndex` -1 when closed.
  - Indicator bar: spring `{ stiffness 420, damping 36, mass 0.85 }` on `top`; measured by rAF loop for 520ms after each change (rows below shift as the previous collapses) plus ResizeObserver; opacity 0 to 1 over 0.35s (0.15s delay) once first measured. Constants: `INDICATOR_HEIGHT 44`, `ROW_CENTER_FROM_TOP 34`.
  - Preview video (lg+ only): `aspect-video rounded-2xl border border-border bg-primary`; keyed by active topic in `AnimatePresence initial={false}`: crossfade opacity 0 to 1 over `DURATION.base` 0.6s. Only the active clip is mounted (one playing at a time), `fit="contain"` (letterboxed on bg-primary), pause/play control.
- A11y: header is a `<button aria-expanded aria-controls>`; panel is separate sibling containing a real Link (no nested interactive); `aria-label` on section.
- Files: `LessonTopics.tsx`, `SectionHeading.tsx`, `ui/AutoplayVideo.tsx`, `lib/constants.ts` (TOPIC_TONE, TOPIC_VIDEOS), `public/video/asml-part*.mp4`.

#### 3.4 EcosystemDiagram: `src/components/sections/EcosystemDiagram.tsx` (server)
- Purpose: static supply-chain diagram "who does what".
- Copy: heading "Ai làm gì trong chuỗi cung ứng chip?"; description "Một con chip cần nhiều loại công ty cùng làm việc: người chế tạo máy móc, người thiết kế, người sản xuất và người đóng gói."; note "Sơ đồ do dự án vẽ lại để minh hoạ; tên và logo thuộc về các công ty tương ứng."
- Data (`ECOSYSTEM_GROUPS`, lib/constants.ts:168-216): 5 groups with title + hint:
  - Thiết bị / "Chế tạo máy móc để làm ra chip": ASML(logo), Applied Materials, Lam Research, KLA, Tokyo Electron, Axcelis, ChipMOS (text)
  - Nhà máy đúc chip (Foundry) / "Sản xuất chip theo thiết kế của người khác": TSMC, GlobalFoundries, Texas Instruments, SMIC, UMC (all logos)
  - Vừa thiết kế vừa sản xuất (IDM) / "Tự thiết kế và tự sản xuất": Intel, Samsung (logos)
  - Chỉ thiết kế (Fabless) / "Thiết kế chip, thuê nơi khác sản xuất": NVIDIA, Apple, Qualcomm, Broadcom, AMD (logos)
  - Đóng gói và kiểm thử (OSAT) / "Cắt, đóng gói và kiểm tra chip thành phẩm": Amkor, ASE, SPIL (text)
  Logos from `public/logos/*` (webp/png/svg); missing ones render the name as text.
- Layout: `section#ecosystem px-5 pt-16 md:px-8 md:pt-24` (no bottom padding; CountryBands' `py-16 md:py-24` provides it). Grid `mt-10 md:mt-14 grid gap-3 md:grid-cols-3`. Placement (`AREA`): equipment `md:col-span-3`; foundries, idm, fabless each `md:col-span-1` (three side by side); osat `md:col-span-3`. IDM gets `md:border-2 md:border-text/30` to signal it sits between neighbours. Mobile: single column stack.
- Card: `rounded-2xl border border-black/[0.08] bg-white/70 p-5`; h3 `text-lg font-extrabold tracking-[-0.01em]`; hint `mt-1 text-sm text-text-muted`; logo list `mt-4 flex flex-wrap items-center gap-x-5 gap-y-3`; each `li` `h-8 text-sm font-semibold text-text/80`; logo `h-6 w-auto max-w-[7rem] object-contain`, `loading=lazy`, `alt=name`. Note `text-xs text-text-muted mt-6 max-w-2xl`.
- Animation: none on the diagram itself (only SectionHeading's stagger). No connecting arrows or lines exist (it is a grouped card grid, not a drawn flow).
- A11y: section `aria-label` = headline; logo `alt`.

#### 3.5 CountryBands: `src/components/sections/CountryBands.tsx` (client) + `CountryVideo.tsx`
- Purpose: five horizontal grey bands, one per country, each with flag, map, company logo chips (revealed on hover), and a click-to-play YouTube clip.
- Copy: heading "Bán dẫn là câu chuyện của cả thế giới"; description "Một con chip đi qua nhiều quốc gia trước khi tới tay bạn. Đây là những cái tên đứng sau ngành công nghiệp đó."; note "Tên và logo công ty thuộc quyền sở hữu của các công ty tương ứng, được sử dụng tại đây cho mục đích giới thiệu và giáo dục."
- Data (`COUNTRY_BANDS`, lib/constants.ts:96-151), in order:
  1. Mỹ: tone #CDCDCD; NVIDIA, Broadcom, AMD, Micron (text, no logo), Qualcomm, Intel; clip xaspX81mfzQ 175-205s
  2. Đài Loan: #D3D3D3; TSMC; clip WKHKy89QaV0 600-630
  3. Trung Quốc: #DADADA; SMIC; clip 8ekndZwyOzo 505-535
  4. Hàn Quốc: #E3E3E3; Samsung, SK hynix; clip 8JiyJejo-e0 500-530
  5. Hà Lan: #EEEEEE; ASML; clip h_zgURwr6nA 28-58
  Assets: `/countries/{id}-flag.webp`, `/countries/{id}-map.(svg|png|webp)`, `/logos/*`. Each company chip links (target blank) to the company site.
- Layout: `section#countries px-5 py-16 md:px-8 md:py-24`; list `mt-10 md:mt-14 flex flex-col gap-3`. Band: `group relative overflow-hidden rounded-2xl border border-black/[0.06]` with inline `background: tone`. Inner grid `gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-center` (left content, right 18rem video from md; stacked below md).
  - Left: `relative min-h-[7rem]`. Artwork box (aria-hidden): mobile `relative mb-3 h-24 w-40` in flow; from sm `absolute inset-y-0 left-0 w-52`. Flag `h-16 rounded-md object-cover shadow-sm` at left-0, vertically centred; map `h-24 object-contain opacity-90 mix-blend-multiply` at `left-10`, overlapping the flag (map on top, blended to multiply with the band tone). Text block `sm:pl-56`: country name h3 `text-[26px] sm:text-[32px] font-extrabold uppercase leading-none tracking-[-0.02em] text-text/90`.
  - Company chips list: `mt-3 flex flex-wrap gap-2`; each chip `inline-flex h-9 rounded-full border border-black/10 bg-white/80 px-3.5 text-sm font-semibold text-text/80 hover:bg-white`; logo `h-4 w-auto`; focus-visible `outline-2 -outline-offset-2 outline-accent`.
  - Video (CountryVideo): `relative aspect-video w-full overflow-hidden rounded-xl bg-black/80`; poster from `https://i.ytimg.com/vi/{id}/hqdefault.jpg` at `opacity-80` (hover `opacity-100`), a 48px white/90 round play disc with black triangle; click swaps in a YouTube iframe (`autoplay=1`, `start`, `end`, `rel=0`, `modestbranding=1`; `allow="autoplay; encrypted-media; picture-in-picture"`, `referrerPolicy strict-origin-when-cross-origin`). No YouTube request until clicked.
- Animations:
  - Each band enters in view: opacity 0 to 1, y 24 to 0, 0.5s `EASE_STANDARD`, delay `index * 0.07`s, viewport `{ once: true, margin: "-80px" }` (CountryBands.tsx:24-31). Under reduced motion `initial` undefined (visible immediately).
  - Company chips reveal: `max-h-0 opacity-0` to `max-h-56 opacity-100` on `group-hover` and `group-focus-within`, CSS `transition-all duration-300` (default ease), `motion-reduce:transition-none`. On touch (`@media(hover:none)`) chips are always shown. On desktop, chips are hidden until hover (discoverability concern for the redesign).
- A11y: section `aria-label`; chips `aria-label` "Mở website của {company} (tab mới)"; play button `aria-label` "Xem video về {country}"; iframe `title` "Video giới thiệu ngành bán dẫn tại {country}"; flag/map `aria-hidden`.

#### 3.6 VideoCarousel: `src/components/sections/VideoCarousel.tsx` (client)
- Purpose: 6-clip 3D-ish coverflow carousel of short videos.
- Copy: title "Vẫn chưa đủ hấp dẫn sao? Thử học qua video nhé!"; subtitle "Các video được tác giả tuyển chọn kĩ lưỡng, phù hợp hoặc do chính tác giả thực hiện dịch, sản xuất với sự tâm huyết và trách nhiệm."; tag pills: Kiến thức nền, Transistor, Sản xuất chip, Ngành công nghiệp, Nghề nghiệp, Lịch sử; buttons aria "Video trước"/"Video tiếp theo"; link "Khám phá thêm" to `/video`.
- Data: `CAROUSEL_VIDEOS` = `/video/clip-1..6.mp4` (PLACEHOLDERS borrowed from another project, noted in constants; to be replaced with semiconductor clips).
- Layout: `section#home-videos cv-auto px-5 py-20 md:px-8 md:py-28` wrapping `AnimatedSection` (fade + rise, 0.7s, once). Heading centered `mx-auto max-w-2xl text-center`: h2 `text-[26px] md:text-[36px] font-extrabold tracking-[-0.02em] text-balance`; p `mt-4 text-sm md:text-base text-text-muted`. Stage: `relative mt-14 overflow-x-hidden`, role group carousel, `tabIndex 0`. Container height comes from an invisible in-flow twin tile (`w-[78%] max-w-3xl md:w-[62%]`, aspect-video + tag pill). Tiles absolutely centered: `absolute left-1/2 top-0 w-[78%] max-w-3xl md:w-[62%]`.
  - Tile visual: `aspect-video rounded-2xl border border-border bg-primary shadow-card overflow-hidden`; tag pill under it `mt-3 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-nav`.
  - Controls below: prev/next `size-10 rounded-full border border-border bg-surface`, chevrons size-5, `gap-3`, centered `mt-8`. Link `mt-10 text-sm font-semibold` + ArrowRight.
- Animation (framer, per tile): position from ring offset to active index (shortest signed distance). `animate` = `x: calc(-50% + offset*58%)`, `scale` 1 active / 0.85 neighbours, `opacity` 1 active / 0.55 neighbours / 0 if |offset| > 1 (parked), `zIndex` 2 active / 1 others; transition `DURATION.base` 0.6s `EASE_STANDARD` (0 under reduced motion). Only 3 tiles ever visible (active + 2 neighbours). No rotation/perspective (flat coverflow despite 3D look).
  - Input: prev/next buttons (wraps), ArrowLeft/ArrowRight when the group is focused, drag on the active tile (`drag="x"`, `dragConstraints 0`, `dragElastic .2`, swipe if `|offset.x| > 60`), click an inactive tile (a full-tile transparent button) to centre it. No autoplay rotation, no dots/indicators.
  - Video behaviour: only the active clip plays (`paused={!isActive}`), pause/play control only on active.
  - Heading stagger via `staggerContainer`/`staggerItem` in view (off under reduced motion).
- A11y: `role="group" aria-roledescription="carousel"` with label; slides `role group aria-roledescription="slide"`, `aria-hidden` when parked; inactive tile buttons `tabIndex -1` when hidden.

#### 3.7 LatestPosts: `src/components/sections/LatestPosts.tsx` (server) + `MotionGrid.tsx` + `forum/PostCard.tsx` + `forum/ExpandingCardLink.tsx`
- Purpose: 3 newest blog posts. This section's id `latest-posts` is the SceneFillOverlay target.
- Copy: "Từ Blog" / "Những bài phân tích và chia sẻ mới nhất từ cộng đồng." / link "Xem tất cả bài viết" to `/blog` / empty "Blog chưa có bài viết nào. Quay lại sau nhé!"
- Layout: `section#latest-posts cv-auto px-5 py-16 md:px-8 md:py-24` wrapping `AnimatedSection`. Header row `flex flex-wrap items-end justify-between gap-6` (SectionHeading left, "Xem tất cả bài viết" link right: `text-sm font-semibold text-accent hover:text-black` + ArrowRight). Empty: `mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted`. Cards in `MotionGrid mt-10`: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` (1/2/3 columns).
- PostCard (with `expand`): `group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-[border-color,box-shadow] duration-300 hover:border-black/20 hover:shadow-card-hover`. Contents: 16:9 cover (`rounded-xl`, `next/image`, sizes 100vw/50vw/33vw) or neutral `bg-surface-muted` placeholder block (keeps alignment); meta row (optional topic chip in topic tone, difficulty chip `rounded-full border text-[11px] font-semibold text-text-muted`, date `text-xs`); title `text-lg font-bold leading-snug tracking-[-0.01em] text-balance`; excerpt `min-h-[68px] text-sm text-text-muted line-clamp-3`; footer "Đọc thêm" (forum.readMore; exact vi string not read; unclear) with ArrowRight that nudges `group-hover:translate-x-0.5` (300ms).
- Animation:
  - Section: AnimatedSection fade-up (0.7s).
  - MotionGrid: `staggerContainer` (0.12 step) in view with each child `staggerItem` (opacity 0 y20 to 1, 0.55s) wrapped in `TiltCard` (hover tilt md+: left column card tilts `rotateX 2 rotateY -5 rotateZ -1`, alternating right card `+5/+1`, 300ms). Under reduced motion: plain grid, no tilt.
  - Click: `ExpandingCardLink`. A plain left-click portals a blank `fixed z-[1500]` panel (white surface, border, `shadow-card-hover`, radius 16) that animates via framer `layout` from the card's rect to full viewport (`100vw x 100dvh`) over `EXPAND_MS` = 400ms `EASE_STANDARD`, then `router.push(href)` at 400ms; if still on page 1000ms after (`EXPAND_MS + PANEL_FADE_MS 600`), the panel fades out (0.3s opacity). Modifier/middle click and reduced motion behave as normal links. Panel is portalled to body because TiltCard `perspective`/`transform` would break `position: fixed`.
- A11y: card is a real link; section `aria-label`.

#### 3.8 JoinCta: `src/components/sections/JoinCta.tsx` (client)
- Purpose: closing dark call-to-action card; also the ONLY place with the full site nav on the page (footer only carries trust links).
- Copy: h2 "Tham gia cùng chúng tôi"; p "Chíp Chíp đang tìm những bạn muốn cùng viết, dịch, làm video hoặc báo lỗi để bài học tốt hơn."; button "Xem cách đóng góp" to `/dong-gop`; rotating badge text "Dự án Chíp Chíp · Học bán dẫn miễn phí · "; quick links (aria "Liên kết nhanh"): Trang chủ, Bài học, Blog, Giới thiệu. `CONTACT_EMAIL` currently empty, so the mailto line is hidden (`font-mono text-xs text-white/75 underline` when set).
- Layout: `section#join cv-auto px-5 py-16 md:px-8 md:py-24`; card `relative overflow-hidden rounded-3xl bg-black`, `minHeight 423px`. Backdrop `next/image` fill `/cta-backdrop.png` (26 KB dark generated texture placeholder, `object-cover object-center`, alt empty). Content `relative z-10 flex min-h-[423px] flex-col justify-center px-7 py-16 md:px-8 md:py-20`; mobile `items-start text-left`, md+ `items-center text-center`.
  - h2 `max-w-2xl text-balance font-extrabold leading-tight tracking-[-0.02em] text-white`, `text-[28px] sm:34 md:42`. p `mt-5 max-w-xl text-[15px] md:text-base text-white/85`.
  - Button: `mt-9`, white pill link `inline-flex h-[52px] rounded-3xl bg-white px-6 text-base font-semibold text-accent`, label with AnimatedButtonLabel, ArrowRight size-[18px]; hover `scale-[1.02]` (CSS `transition-transform duration-200`).
  - Nav: text links `text-[16px] text-white/70 hover:text-white`; phones a stacked column, md row centered (`gap-x-8 gap-y-3 text-[15px] text-white/75`), lg+ `absolute bottom-10 left-12` column `gap-3`.
  - Rotating ring: `CircularText` (diameter 220, font 16, letterSpacing 0.2, 28s rotation), `absolute -right-[10%] top-[25%] hidden lg:block h-[180px] w-[180px] xl:h-[220px] xl:w-[220px] text-white opacity-60`, cropped by the card's right edge; hidden below lg.
- Animation: card fades up in view (opacity 0 y24 to 1, 0.7s `EASE_STANDARD`, VIEWPORT_ONCE) — note `initial` is undefined under reduced motion but `whileInView` still present (fine); inner stagger container: h2, p, button block, nav each `fadeUp` (0.6s) with 0.12s step, 0.1s delay; ring rotates linearly forever (28s); button letter dance on hover (0.55s, per-letter).
- A11y: section `aria-label`; text contrast noted in constants (white on backdrop 13.97:1); ring `aria-hidden`.

#### 3.9 SectionHeading: `src/components/sections/SectionHeading.tsx` (client)
Shared heading used by SimpleStart, LessonTopics, EcosystemDiagram, CountryBands, LatestPosts (and the About page). Props `titleKey`, `descriptionKey`, `namespace`, `align left|center`, `variant default|statement`.
- Default: `flex flex-col gap-3`; h2 `text-[26px] sm:text-[32px] md:text-[38px] font-extrabold leading-[1.18] tracking-[-0.02em] text-balance max-w-3xl`; p `text-[15px] md:text-base leading-relaxed text-text-muted max-w-2xl text-pretty`.
- Statement: grid two columns from md (see SimpleStart), smaller type (24/28/30px).
- Animation: in view (VIEWPORT_ONCE), `staggerContainer` with title and description each `staggerItem` (opacity 0 y20 to 1, 0.55s, 0.12s stagger, 0.1s initial delay). Under reduced motion renders plain elements (no hidden state).

#### 3.10 MotionGrid: `src/components/sections/MotionGrid.tsx` (client)
See LatestPosts: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`, stagger + alternating TiltCard, reduced-motion plain grid (each child wrapped in `div.h-full`).

---

### Home page section order (top to bottom)

0. Navbar (fixed, transparent at top, frosted after 12px scroll) over a fixed blurred ghost backdrop image (`/hero-backdrop.jpg`, opacity 40%, blur 6px, scale 105%); SceneFillOverlay (fixed grey circle wipe, z-15) is mounted but only driven by scroll proximity of `#latest-posts`.
1. Hero: 2 badges (Đơn giản, Miễn phí), H1 "Một đứa trẻ ba tuổi cũng có thể tìm hiểu về bán dẫn", intro paragraph, CTAs "Tìm hiểu ngay" / "Về chúng tôi"; below the fold, intro video that tilts upright (3D scroll reveal), with desktop hover card and credit line.
2. SimpleStart: white statement card "Bắt đầu từ những điều đơn giản nhất" with dark left rail and marker/hairline strip. (MainSection gradient wrapper starts here and holds sections 2-8.)
3. LessonTopics (`#topics`): "Bốn chủ đề, từ số 0 tới toàn cảnh ngành bán dẫn": 4-row accordion (Định nghĩa, Nguyên lý, Ứng dụng, Lịch sử và Phát triển) with sliding indicator, live article counts, and ASML preview video on lg+.
4. EcosystemDiagram (`#ecosystem`): "Ai làm gì trong chuỗi cung ứng chip?": 5 grouped logo cards (Thiết bị, Foundry, IDM, Fabless, OSAT).
5. CountryBands (`#countries`): "Bán dẫn là câu chuyện của cả thế giới": 5 grey-shade bands (Mỹ, Đài Loan, Trung Quốc, Hàn Quốc, Hà Lan) with flag, map, hover-revealed company chips, click-to-play YouTube clip.
6. VideoCarousel (`#home-videos`): "Vẫn chưa đủ hấp dẫn sao? Thử học qua video nhé!": 6-clip coverflow carousel, link "Khám phá thêm" to `/video`.
7. LatestPosts (`#latest-posts`): "Từ Blog": 3 latest blog cards (tilt on hover, expand-to-fullscreen on click) + "Xem tất cả bài viết".
8. JoinCta (`#join`): dark card "Tham gia cùng chúng tôi" with rotating text ring, button "Xem cách đóng góp", and site quick-links.
9. Footer (outside MainSection, `z-20`): logo, trust links (Liên hệ, Đóng góp, Chính sách bảo mật), copyright, social slot (empty).

### Notable findings / risks for the redesign
- Palette is greyscale only by explicit rule; the only hue is dark teal-grey `#314344` (focus, links) and an unused `#317e6a`. Topic and country differentiation is by shade, never hue.
- `brand-*` Tailwind colour classes are used but undefined (VideoCarousel links and Hero credit hover): no visual effect currently.
- `text-gradient-brand` is a solid colour (no gradient), so the H1's two-tone intent does not render.
- Social links and contact email are hidden (empty constants); layout must tolerate their absence.
- Carousel clips (`clip-1..6.mp4`) and CTA backdrop are placeholders; TOPIC preview videos are 4 ASML cuts; hero video is a self-hosted mp4 excerpt with credit.
- Company chips in CountryBands are hover-only on desktop (always visible on touch).
- Hero title uses both stagger variants and a scroll-driven opacity MotionValue on the same element (behaviour interplay unclear).
- SceneFillOverlay's perceived effect is limited (targets a late section, and MainSection at z-20 already covers most of the page); unclear without running it.
- All motion is gated by `useReducedMotion` in JS and a global 0.01ms CSS override; Lenis smooth scroll disabled for reduced motion and touch devices.
- Both `TiltCard` (2-5 degree, 300ms) and `ExpandingCardLink` (400ms panel grow) are the interactive signature effects on cards.

---

## Phụ lục B — Các trang công khai còn lại

Repo: `/Users/nmh/work/Mac/NMHx/CodeThue/Project_Chip_Chip`. All paths below are relative to `src/` unless prefixed. Line numbers refer to the files as read on branch `docs/bao-cao-giao-dien`. Nothing in the repo was modified.

### 0. Global frame every inner page sits in

Source: `app/[locale]/layout.tsx`, `app/globals.css`, `tailwind.config.ts`.

- Shell: skip-link ("Chuyển tới nội dung chính"), fixed `Navbar` (z-1000, spacer 68px mobile / 76px md+, `Navbar.tsx:142,236`), `<main id="main">`, `Footer`. Wrapped in `SmoothScroll` (Lenis: duration 0.9s, ease-out cubic `1-(1-t)^3`, wheel only; disabled for reduced-motion and for non-`(hover:hover) and (pointer:fine)` devices; `components/ui/SmoothScroll.tsx`).
- Page background is `#E5E5E5` (token `bg`); cards are white (`surface` `#FFFFFF`); muted fill `#EFEFEF` (`surface-muted`); border `#D1D1D1`; primary (buttons) `#0D0D0D`; accent `#314344` (dark slate); text `#000`, `text-muted #3e424d`, `text-nav #4d4d4d`. `accent-teal #317e6a` is defined but not used on any inner page. The palette is deliberately greyscale ("never tinted", `globals.css:34`, `:279`). The only warm colour anywhere on inner pages is the `<mark>` highlight `#fef6d9` and red/green form messages.
- Fonts: Be Vietnam Pro (body and display), JetBrains Mono (code, the contact email).
- Container: `max-w-content` = 1280px, side gutters `px-5` (20px) / `md:px-8` (32px). Article/single-column pages use `max-w-3xl` (768px), the video detail uses `max-w-4xl` (896px).
- Radii used: `rounded-xl` (12px) inputs/buttons/thumbnails, `rounded-2xl` (16px) cards, `rounded-3xl` (24px) big panels, `rounded-full` chips.
- Shadows: `shadow-card-hover` = `0 2px 4px rgba(0,0,0,.05), 0 12px 32px rgba(0,0,0,.12)` (only on card hover); `shadow-float` = `0 8px 32px rgba(0,0,0,.16)` (search popover). `shadow-card` exists but is unused on inner pages: cards are flat, border only.
- Focus ring (global): `outline 2px solid #314344; offset 2px; radius 4px` (`globals.css:45`). Inputs add `focus-visible:ring-2 ring-accent/30` and `border-accent`.
- Anchors offset: `html { scroll-padding-top: 6rem }` so `#heading` and `#comments` jumps clear the fixed navbar.
- Reduced motion (global): `@media (prefers-reduced-motion: reduce)` forces every CSS animation and transition to 0.01ms, single iteration, `scroll-behavior:auto` (`globals.css:538`). Framer-motion pieces additionally check `useReducedMotion`.
- Route table (`i18n/routing.ts`): `localePrefix: "always"`, default `vi`. Localised: `/bai-hoc` ↔ `/lessons`, `/gioi-thieu` ↔ `/about`, `/video` ↔ `/videos`, `/tim-kiem` ↔ `/search`, `/lien-he` ↔ `/contact`, `/dong-gop` ↔ `/contribute`, `/chinh-sach-bao-mat` ↔ `/privacy`. Same in both: `/blog`. Dynamic segments (`[topic]`, `[slug]`) are not localised; slugs differ per locale in the DB.
- Topic ids (`lib/constants.ts:36`): `dinh-nghia`, `nguyen-ly`, `ung-dung`, `lich-su`. Difficulty ids: `basic`, `intermediate`, `advanced` (`lib/types.ts:8`).
- IMPORTANT for the motion brief: none of the inner pages use the `components/motion` scroll/reveal library (`AnimatedSection`, `ScrollReveal3D`, `TiltCard`, `MainSection`, `StickyBackdrop`, etc.). Confirmed by grep: only `TopicSidebar.tsx` (imports `EASE_STANDARD`) and `ExpandingCardLink.tsx` (imports `EASE_STANDARD`) touch it. Every other inner-page effect is a plain CSS transition, the `.rise-in` keyframe, native `<details>`, or the AutoplayVideo/Image backdrop in `PageHero`. The comment in `ExpandingCardLink.tsx:20-23` mentions cards "inside TiltCard", but no current inner page wraps cards in it.
- Motion tokens referenced (`components/motion/tokens.ts`): `EASE_STANDARD = cubic-bezier(0.25, 0.1, 0.25, 1)`. Other tokens (`EASE_SCROLL_REVEAL`, `DURATION`, `STAGGER`, `VIEWPORT_ONCE`, `REVEAL`) are not used on inner pages.

#### Global states for inner pages
- 404 for unknown URL: `app/[locale]/[...rest]/page.tsx` calls `notFound()`, which renders `app/[locale]/not-found.tsx` (section 12).
- Runtime error: `app/[locale]/error.tsx` (section 12).
- There is no `loading.tsx` anywhere on the public site (only `app/admin/(dashboard)/loading.tsx`). It was removed on purpose because it made a missing article answer 200 instead of 404 (`lib/plain-click.ts:10-14`). So no skeletons, spinners or streaming placeholders exist on public pages.

---

### 1. Lessons index: `/bai-hoc` (vi) and `/lessons` (en)

Files: `app/[locale]/bai-hoc/page.tsx`, `components/lessons/LessonsListing.tsx` (shared with topic page), `components/lessons/TopicSidebar.tsx`, `components/forum/PostCard.tsx`, `components/listing/FilterPills.tsx`, `components/listing/Pagination.tsx`, `components/sections/PageHero.tsx`, `lib/listing-params.ts`, `lib/listing-order.ts`, `lib/queries/posts.ts`.

Purpose and audience: the main learning library for high-school students; lists theory lessons (`posts.kind = 'lesson'`, `status = 'published'`, `locale` = current).
Data: Supabase `listLessons(locale, {topic, difficulty, page})` and `countLessonsByTopic(locale)` (`posts.ts:152,109`). ISR `revalidate = 3600`. Old `?tab=video` is permanently redirected to `/video` (`page.tsx:38`). Any query key other than `difficulty` and `page` is dropped so nothing leaks into generated links.

Copy (vi): eyebrow "Thư viện", title "Bài học", description "Kiến thức bán dẫn viết cho học sinh trung học: đi từ khái niệm đơn giản nhất tới toàn cảnh ngành, chia theo bốn chủ đề và ba mức độ khó." en: "Library" / "Lessons" / "Semiconductor knowledge written for high-school students: ...".

#### Sections, top to bottom
1. Navbar spacer (68/76px).
2. `PageHero` (no backdrop): section `px-5 pt-12 md:px-8 md:pt-16`, no bottom padding. Inside the 1280px container a flex row: `flex-col gap-8` on mobile, `lg:flex-row lg:items-end lg:justify-between lg:gap-12`. Left: `<header max-w-2xl>` with eyebrow chip, `h1`, description. Right (lg) / below (mobile): `HeroStat` card showing the count of lessons (value = all lessons, or the current topic's count) with label "Bài học".
   - Eyebrow chip: `rounded-full border bg-surface-muted px-3.5 py-1.5`, 11px bold uppercase tracking 0.16em, colour `accent`, with a 6px accent dot.
   - H1: 34px (mobile) / 46px (md+), weight 800, line-height 1.1, tracking -0.03em, `text-balance`.
   - Description: 16px / md 18px, `text-muted`, relaxed leading, `text-pretty`, mt-5.
   - HeroStat: white card, `rounded-2xl border px-4 py-3`, number `text-xl font-extrabold tabular-nums`, label `text-xs text-muted`.
3. Listing section: `px-5 py-10 md:px-8 md:py-14`, container 1280px. From `lg` a flex row `lg:flex lg:items-start lg:gap-10`: `TopicSidebar` (260px) + content column (`min-w-0 flex-1`).
   - **Topic navigation** (`TopicSidebar` + list in `LessonsListing.tsx:114-139`). Entries: "Tất cả" (count = all lessons) then the four topics: "Định nghĩa", "Nguyên lý", "Ứng dụng", "Lịch sử và Phát triển", each with a count badge. Each is a pill link `min-h-11 rounded-full border px-4 text-sm font-medium`; the label is on the left, a count badge on the right (`rounded-full px-2 py-0.5 text-xs tabular-nums`). Active: `border-primary bg-primary text-white`, badge `bg-white/15`. Inactive: white, `border-border`, `text-nav`; hover `border-black/20 text-accent` (colour transition only). Active link has `aria-current="page"`.
     - Below `lg`: the list is a horizontal scroll row (`flex gap-2 overflow-x-auto`, bleeds to screen edges with `-mx-5 px-5` / `md:-mx-8 md:px-8`), items `shrink-0`, no visible heading (the whole heading+button row is `hidden lg:flex`), `mb-8`.
     - `lg` and up: sticky column (`lg:sticky lg:top-28`), 260px wide, vertical list (`lg:flex-col`), heading "Chủ đề" (`text-sm font-semibold`) with a 44px square collapse button (`PanelLeftClose`/`PanelLeftOpen` icons, `rounded-xl border`) at right.
     - Collapse: width 260px to 44px (`lg:w-11`), list hidden (`lg:hidden`), heading hidden; button stays. Button labels "Thu gọn cột chủ đề" / "Mở cột chủ đề" (aria-label + title), `aria-expanded`, `aria-controls`. The collapsed grid column effectively lets the card grid reclaim ~216px.
     - Persistence: `localStorage["chipchip.lessons.topicsCollapsed"]` = "1"/"0", wrapped in try/catch.
     - Animation: `transition-[width]`, 450ms, `cubic-bezier(0.25,0.1,0.25,1)` (`TopicSidebar.tsx:11-14`), only enabled after first paint via rAF so returning readers do not see it fold on load (`:42-50`); `motion-reduce:transition-none`. The list's hide/show is instant (display toggle, not animated).
   - **Difficulty filter** (`FilterPills`): label "Độ khó" (12px semibold uppercase tracking 0.08em, `text-muted`) then pills "Tất cả", "Cơ bản", "Trung bình", "Nâng cao". Layout `flex-col gap-2` on mobile, `sm:flex-row sm:items-center sm:gap-3`. Each pill is a real link (`min-h-11 rounded-full border px-4 text-sm font-medium`), `scroll={false}` (no scroll jump). Same active/inactive styles as topic pills. The filter is a URL (`?difficulty=basic`), so no JS needed and each state is shareable. Changing topic keeps difficulty and resets page to 1; changing difficulty keeps topic.
   - **Card grid**: `mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3` (note the 3rd column only at 1280px because the sidebar takes width; other listings switch at `lg`). Cards are `PostCard` without expand (section 4). `showTopic` is true only on the all-topics view, so the topic chip appears only there.
   - **Pagination**: shared component (section 16). Page size 12 (`LISTING_PAGE_SIZE`).
4. Footer.

#### States
- Empty (no lessons at all): dashed box `mt-8 rounded-2xl border border-dashed px-6 py-16 text-center`, `text-sm text-muted`, message "Chưa có bài học nào. Quay lại sau nhé!"
- Empty for a topic: "Chủ đề này chưa có bài viết nào."
- Filtered-empty (difficulty set): "Chưa có bài học nào ở mức độ này."
- Page beyond last (`page > 1` and `page > totalPages`) is a 404 (`notFound()`); an empty page 2+ that is in range shows "Trang này không có nội dung." plus a "Về trang đầu" link.
- Priority of empty copy: page>1 > difficulty filter > topic > general (`LessonsListing.tsx:87-94`).
- Invalid `page` query is coerced to 1 (regex `^[1-9][0-9]{0,2}$`, max 500).
- Loading: none (server rendered). Error: falls to `error.tsx`.

#### Effects
- `.rise-in` on the whole hero row (see section 16): 0.5s, `cubic-bezier(0.22,1,0.36,1)`, translateY 12px to 0 plus opacity 0 to 1, plays once at load, no scroll trigger, no stagger.
- Pills: `transition-colors` (Tailwind default 150ms) on hover.
- Sidebar width collapse as above.
- Cards: see PostCard hover in section 4.

#### Accessibility to preserve
- `<aside aria-label="Chủ đề">`, `aria-current="page"` on active pill, `aria-expanded/aria-controls` on collapse button, all pills min 44px tall, pills are links not buttons.
- Focus ring 2px `#314344`.

---

### 2. Lessons by topic: `/bai-hoc/[topic]` and `/lessons/[topic]`

Files: `app/[locale]/bai-hoc/[topic]/page.tsx` plus everything in section 1. Test: `app/[locale]/bai-hoc/[topic]/empty-state.test.ts`.

- Same `LessonsListing` with `topic` set. `generateStaticParams` for the four topics; unknown topic gives `notFound()` (global 404, section 12). `revalidate = 3600`. Each topic is its own canonical URL (SEO).
- Differences from the index: `PageHero` title = topic title (e.g. "Định nghĩa") and description = topic description (e.g. "Bán dẫn là gì, vì sao nó trở thành nền tảng của gần như mọi thiết bị điện tử."). HeroStat shows that topic's count. The active pill is the topic; the topic chip is not shown on cards (`showTopic=false`); empty state "Chủ đề này chưa có bài viết nào."
- Topic copy (vi): Định nghĩa "Bán dẫn là gì, vì sao nó trở thành nền tảng của gần như mọi thiết bị điện tử." / Nguyên lý "Transistor và vi mạch hoạt động như thế nào, từ vật lý cơ bản tới chip hiện đại." / Ứng dụng "Bán dẫn có mặt ở đâu trong đời sống, và những ngành nghề nào đang cần nhân lực." / Lịch sử và Phát triển "Từ chiếc transistor đầu tiên tới cuộc đua chip toàn cầu ngày nay."
- en topic titles differ in length: "What is a semiconductor", "How they work", "Applications", "History & development" (watch the longer labels in pills at 260px).
- Topic tones (`TOPIC_TONE`, all grey): dinh-nghia bg `#4A4A4A` soft `#E6E6E6`; nguyen-ly `#6B6B6B` / `#EAEAEA`; ung-dung `#8C8C8C` / `#EEEEEE`; lich-su `#AEAEAE` / `#F2F2F2`; text `#262626`. Only `soft` + `text` are used on inner pages (topic chips); `bg` is unused here. The four topics are visually almost indistinguishable, a design opportunity.

---

### 3. Lesson article: `/bai-hoc/[topic]/[slug]` and `/lessons/[topic]/[slug]`

Files: `app/[locale]/bai-hoc/[topic]/[slug]/page.tsx`, `.../not-found.tsx`, `.../opengraph-image.tsx`, `components/forum/ArticleBody.tsx`, `ArticleToc.tsx`, `UpdatedAt.tsx`, `VideoFacades.tsx`, `components/contact/ReportMistake.tsx` and `MessageForm.tsx`, `components/video/VideoCard.tsx`, `lib/tiptap/*`, `.chip-prose` CSS.

Purpose: read one lesson. Data: `getPostBySlug(locale, slug, "lesson")`; `listRelatedVideos(locale, translationId)` (videos whose `related_lesson_translation_id` matches). Slugs differ per locale; no on-page language switcher for lessons (see inconsistencies). No comments on lessons.

#### Sections, top to bottom
Wrapper: `<article class="px-5 py-14 md:px-8 md:py-20">`, inner `mx-auto max-w-3xl` (768px).
1. Back link: arrow-left icon + "Về chủ đề {topic}" (e.g. "Về chủ đề Nguyên lý"), `text-sm text-muted`, hover `text-accent`. No min-height (only ~20px tall touch target).
2. Header (`mt-8`):
   - Topic chip: `rounded-full px-3 py-1 text-xs font-semibold`, background `tone.soft`, text `tone.text`.
   - H1: 30px / md 42px, 800, line-height 1.15, tracking -0.03em, balance, mt-4.
   - Date line: `<time>` "Bài học · 12 tháng 9, 2026" style (the string is `{lessons.title} · {long date}`; the literal word "Bài học" prefixes the date, an odd label) `text-sm text-muted mt-5`.
   - "Cập nhật ngày {date}" line (`UpdatedAt`, refresh icon) only if `updated_at - published_at > 24h` (`UpdatedAt.tsx:4,31`).
3. Cover image (optional): `aspect-video`, `rounded-2xl`, `object-cover`, `priority`, `mt-8`, `alt=""` (decorative).
4. Table of contents (`ArticleToc`): only when there are ≥2 h2/h3 headings. Card `my-8 rounded-2xl border bg-surface p-5 md:p-6`; title "Nội dung bài" (12px semibold uppercase tracking 0.14em, muted); `<ol>` with `gap-2`, list markers reset (no visible numbers), h3 indented `pl-4`; links `text-sm text-nav`, hover `text-accent`. Plain anchors (`#slug`), not sticky, not collapsible, no active-section highlight, no scroll-spy. en title: "On this page".
5. Article body (`mt-10`): `<div class="chip-prose">` (see section 15) or, if the Tiptap JSON renders to nothing, a dashed box "Bài viết chưa có nội dung."
6. "Report a mistake" (`ReportMistake`, section 14): a `<details>` card below the body.
7. Related videos (only if any): `section mt-16 border-t pt-10`, `h2` "Video liên quan" (18px bold), grid `mt-6 gap-4 sm:grid-cols-2 lg:grid-cols-3` of `VideoCard compact`.

#### States
- Slug unknown or unpublished: `notFound()` renders `not-found.tsx`: centred block `px-5 py-24`, `max-w-3xl`, "404" (14px semibold uppercase tracking 0.16em, accent), H1 26/34px "Không tìm thấy bài viết này.", text link "← Về trang Bài học" (`min-h-11`, accent, hover black). Note Next 14 serves the generic shell for detail 404s (project CLAUDE gotcha).
- Invalid topic segment: `notFound()`.
- Empty body: dashed message above.
- Metadata: OG image from sibling `opengraph-image.tsx` (branded card, not the cover); article `openGraph.type = article`.

#### Effects
- No entrance animation on the article, header or body (the `.rise-in` is only in `PageHero` and the eyebrow chips of About and Contact).
- Hover: back link colour; TOC link colour; `VideoCard` hover (section 6). Anchor jumps use browser smooth scroll only if Lenis is active (desktop).
- Video facade hover: play disc background `rgba(13,13,13,.85)` to `#000`, `transition 150ms ease` (`globals.css:433`).

#### Accessibility
- `<article>`, one h1; TOC in a labelled `<nav>`; cover image `alt=""`; facades are links with aria-label "Phát video trên {platform}"; heading `id`s generated for h2/h3.

---

### 4. Blog index: `/blog` (both locales)

Files: `app/[locale]/blog/page.tsx`, `components/forum/PostCard.tsx`, `components/forum/ExpandingCardLink.tsx`, `lib/plain-click.ts`, `components/sections/PageHero.tsx`, `components/ui/AutoplayVideo.tsx`, `lib/constants.ts` (`BLOG_CLIP`, `BLOG_CLIP_CREDIT`, `PAGE_SIZE`).

Purpose: analysis/opinion posts (`posts.kind = 'forum'`). Data: `listForumPosts(locale, {page, pageSize: 9})`. No `revalidate` export on the page (dynamic because of `searchParams`; treat as unclear).

Copy (vi): eyebrow "Góc phân tích", title "Blog", description "Phân tích, góc nhìn và ghi chép về bán dẫn cùng ngành công nghiệp đằng sau nó — viết để đọc trong vài phút." en eyebrow "Perspectives".

#### Sections
1. `PageHero` with `backdropVideo="/video/tsmc-open.mp4"`: section becomes `relative overflow-hidden pb-10 md:pb-14`; behind the text an absolutely positioned layer (`aria-hidden`, `pointer-events-none`) holds `AutoplayVideo` (`eager`, muted looping clip, `opacity-25`) plus a vertical gradient overlay `from-transparent via-bg/40 to-bg` that fades the clip into the grey page background. `AutoplayVideo` is called without `controls`, so there is no pause button (decorative). It pauses when off-screen and is handled for reduced motion inside `AutoplayVideo` (unclear: exact reduced-motion behaviour lives in that component; it imports `useReducedMotion`). HeroStat: total posts, label "Blog".
2. Video credit line: `mx-auto mt-4 max-w-content px-5 md:px-8 text-xs text-muted`: "Video: <underlined link "TSMC Đã THỐNG TRỊ Ngành Công Nghiệp Bán Dẫn Toàn Cầu Như Thế Nào?">" (opens YouTube in a new tab).
3. Listing section `px-5 py-10 md:px-8 md:py-14`, container 1280px. Visually hidden `h2` "Danh sách bài viết" (sr-only). Grid `gap-4 sm:grid-cols-2 lg:grid-cols-3` of `PostCard expand`.
4. Pagination: a local, inline implementation, NOT the shared `Pagination` (`page.tsx:93-113`): `nav` centred `mt-10 gap-2`, renders EVERY page number as a 36px square (`size-9 rounded-lg`), current is solid black/white text, others outlined; plain `<a href="?page=n">` (full reload rather than client `Link`); no prev/next arrows, no ellipsis; page size 9. This will overflow with many pages.

#### PostCard (used on lessons index/topic, blog)
Structure (`PostCard.tsx`): card `group flex h-full flex-col gap-3 rounded-2xl border bg-surface p-6`, `transition-[border-color,box-shadow] duration-300`, hover `border-black/20` + `shadow-card-hover`.
- 16:9 cover (`rounded-xl`, `object-cover`, `sizes` 100vw/50vw/33vw) or, if no cover, an empty grey `bg-surface-muted` 16:9 block (kept so rows align). Alt is empty.
- Meta row (wrap, gap-2): topic chip (only when `showTopic`; `rounded-full px-2.5 py-1 text-[11px] font-semibold`, tone.soft/tone.text), difficulty pill (`rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted`: "Cơ bản"/"Trung bình"/"Nâng cao", same neutral style for all levels), date (`text-xs`, short month, e.g. "12 thg 9, 2026").
- Title: `h3`, 18px bold, `leading-snug`, balance.
- Excerpt: `line-clamp-3` inside a `min-h-[68px]` wrapper so all cards end level.
- "Đọc tiếp →" (`mt-auto pt-2 text-sm font-semibold text-accent`); on card hover the whole label nudges `translate-x-0.5` over 300ms.
- A card with no valid `href` (lesson without topic) renders `null`.
- Heading levels: card titles are `h3`. On the lessons page there is no `h2` above them (only the sidebar's `h2`), on the blog an sr-only h2 exists.

#### ExpandingCardLink: the "card grows to full screen" effect (blog only, `expand` prop)
File `components/forum/ExpandingCardLink.tsx`; constants `lib/plain-click.ts` (`EXPAND_MS = 400`, `PANEL_FADE_MS = 600`).
- Trigger: a plain left click (no modifier keys) on a blog card. Ctrl/Cmd/Shift/Alt-click, middle click are left to the browser (open in new tab etc.). With `prefers-reduced-motion` the card is an ordinary link (`classifyCardClick`, `plain-click.ts:53-60`). A second click while the first animation is running is swallowed.
- Sequence: (1) on click, `preventDefault`, measure the card's `getBoundingClientRect()`, mount a blank panel portalled to `document.body`, `position: fixed`, `z-index 1500`, white (`bg-surface`), `border`, `shadow-card-hover`, `borderRadius 16` at exactly the card's box. (2) Next animation frame (`requestAnimationFrame`) it switches to `top 0 / left 0 / width 100vw / height 100dvh`, animated by framer-motion `layout` with `duration 0.4s`, ease `[0.25,0.1,0.25,1]` (`EASE_STANDARD`). The panel is blank: the card's content does NOT scale or move, it is covered by a growing white rectangle (the panel appears over the card and expands past the viewport). (3) `router.prefetch(href)` on click, and after 400ms `router.push(href)`. (4) Safety: at 400+600 = 1000ms if the panel is still mounted it fades `opacity 1 to 0` over 0.3s and then unmounts (there is no loading UI, so a slow article would otherwise leave a blank white screen). Timers are cleaned up on unmount.
- The panel is portalled because ancestor `transform`/`perspective` would otherwise trap `position: fixed` to the card.
- Design note: after navigation the article page appears with no entrance animation of its own, so the transition is "white panel fills screen, then article content appears".

#### States
- Empty: dashed `rounded-2xl` box, `px-6 py-16 text-center text-sm text-muted`: "Chưa có bài viết nào. Hãy quay lại sau nhé!"
- Page past the end: `notFound()`.
- `?page` is parsed with `Number(...) || 1` (looser than the lessons/video regex parsing).

#### Effects summary (blog index)
Hero `rise-in` 0.5s; backdrop clip loops at 25% opacity; card hover (border + shadow 300ms, arrow nudge 2px); click-to-expand panel 400ms + fade 300ms.

---

### 5. Blog post: `/blog/[slug]` (both locales)

Files: `app/[locale]/blog/[slug]/page.tsx`, `.../not-found.tsx`, `.../opengraph-image.tsx`, `components/forum/{ArticleBody,ArticleToc,UpdatedAt,VideoFacades,CommentSection}.tsx`, `components/contact/ReportMistake.tsx`, `app/api/comments/route.ts`.

Data: `getPostBySlug(locale, slug, "forum")`, `listComments(postId, {rootLimit})`, `countComments(postId)`, `getTranslationSlug(translationId, otherLocale)` (offers a link to the other-language version only when it exists). `?comments=N` reveals more root comments (min 20, max 200).

#### Sections (same wrapper as lesson article: `max-w-3xl`, `px-5 py-14 md:px-8 md:py-20`)
1. Back link "← Về Blog" (en "Back to the blog").
2. Header: H1 (30/42px, 800), then a wrapping meta row `mt-5 gap-3 text-sm text-muted`: "Đăng ngày {date}", optional "Cập nhật ngày {date}", and a language-switch pill link (`rounded-full border px-3 py-1 text-xs`, `Languages` icon): "Đọc bản tiếng Việt" or "Read in English". These two labels are hard-coded in the page (`page.tsx:167`), not in `messages/*.json`, and the pill is not 44px tall. No topic chip on blog posts.
3. Cover image (optional, same as lesson).
4. `ArticleToc` (≥2 headings).
5. Article body (`chip-prose`).
6. `ReportMistake` details block.
7. `CommentSection` (see below).

#### Comments (`CommentSection.tsx`, client)
- Section `#comments`: `mt-16 border-t pt-10`, heading with a `MessageSquare` accent icon and "{n} bình luận" (18px bold).
- Form first (`mt-6`), list below (`mt-10`).
- Form: h3 "Để lại bình luận" (or "Đang trả lời {name}" while replying). Two-column grid `sm:grid-cols-2`: "Tên của bạn" (placeholder "Nguyễn Văn A", max 80, required) and "Email" with hint "(Không hiển thị công khai. Chỉ ban biên tập thấy, để liên hệ lại khi cần.)" (optional, placeholder "ban@example.com"). Then a 4-row textarea (label sr-only "Nội dung", placeholder "Chia sẻ suy nghĩ của bạn về bài viết này...", max 2000, no character counter). Inputs `h-10 rounded-xl border bg-surface px-3.5 text-sm` (40px tall, unlike the 44px contact form inputs). Honeypot field `website` positioned off-screen (`-left-[9999px]`). Submit "Gửi bình luận" (black `rounded-xl px-5 py-2.5`, hover `bg-black/80`, disabled 60% while sending: "Đang gửi..."); while replying an underlined text button "Huỷ".
- Validation (client, on submit, `noValidate`): name required ("Vui lòng nhập tên."), email pattern if provided ("Email không hợp lệ."), body required ("Vui lòng nhập nội dung bình luận."), body ≤2000 ("Bình luận tối đa 2000 ký tự."). The failing field gets `aria-invalid`, an inline red `text-xs text-red-600` message linked with `aria-describedby`, and focus moves to it; editing clears the error.
- Server errors: 429 "Bạn gửi bình luận quá nhanh. Vui lòng thử lại sau ít phút." (limit 3 per 10 minutes per hashed IP); other failures "Không gửi được bình luận. Vui lòng thử lại." shown as `role="alert"` red paragraph. Success: `role="status"` green (`text-green-700`) "Đã gửi bình luận. Cảm ơn bạn!", form resets, reply target cleared, `router.refresh()`.
- Moderation states (**changed in admin phase 2** — see `docs/superpowers/plans/2026-10-02-admin-2-duyet-va-phien-ban.md`): a reader's comment is inserted `pending` and is **not public** until a moderator approves it; the form's notice says so ("Bình luận sẽ hiện sau khi được duyệt"). `comments.status` (`comment_status`: `pending` / `approved` / `hidden`) replaced the old `is_hidden` flag, and the public policy is `status = 'approved'`. A comment by a logged-in active staff member is inserted `approved` (the moderators are the staff) and shows an "Tác giả" badge (`rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-accent`) with the staff display name. Hidden and pending comments are simply absent (no "removed" placeholder). The queue lives at `/admin/comments`.
- Thread rendering: one level of replies only (the API rejects replies to replies). Root: `ul gap-7`; each root has name (14px semibold), optional badge, `<time>` (12px muted, "medium" date + short time), body (`whitespace-pre-wrap text-sm text-nav`), and a "↩ Trả lời" text button (`text-xs`, hover accent). Replies: nested `ul ml-2 sm:ml-6 gap-5`, each with `border-l-2 border-border pl-4`, no reply button. Clicking "Trả lời" only sets state (form heading changes to "Đang trả lời {name}"); the page does not scroll to or focus the form (unclear whether that is intended; no `scrollIntoView` in the code). There is a single form at the top for both new comments and replies.
- Order: oldest first. Load more: shows "Đang hiện {shown}/{total} bình luận gốc" and a bordered link button "Xem thêm bình luận ⌄" (`rounded-xl border px-5 py-2.5`) which navigates to `?comments=shown+20` with `scroll={false}` (a server round-trip, whole page re-render); hidden after 200.
- Empty: dashed box "Chưa có bình luận nào. Hãy là người đầu tiên!"

#### States and effects
- Unknown slug: `not-found.tsx` (same design as lesson 404, text "Không tìm thấy bài viết này.", link "← Về Blog").
- No entrance animations; the only effects are hover colour transitions on buttons/links and the video-facade hover.
- Metadata: OG image via sibling route; canonical and hreflang built per locale with the translation slug.

---

### 6. Video index: `/video` (vi) and `/videos` (en)

Files: `app/[locale]/video/page.tsx`, `components/video/VideoCard.tsx`, `components/video/VideoFilters.tsx`, `components/listing/{FilterPills,Pagination}.tsx`, `components/sections/PageHero.tsx`, `lib/listing-params.ts`, `lib/listing-order.ts`, `lib/video.ts`.

Purpose: short explainer videos, own or curated (YouTube, TikTok). Data: `listVideos(locale, params)` with filters platform/source/topic/difficulty and sort. `revalidate = 3600`. Page size 12.

Copy (vi): eyebrow "Thư viện", title "Video", description "Video ngắn giải thích bán dẫn bằng hình ảnh: do Chíp Chíp tự thực hiện, hoặc được tuyển chọn từ những kênh uy tín."

#### Sections
1. `PageHero` with `backdropImage="/video-banner.jpg"` (1600x900 JPEG): same treatment as the blog hero but with a static `next/image` (`fill`, `priority`, `object-cover opacity-25`) and the same gradient fade to the page bg; HeroStat = total videos, label "Video".
2. Filter panel (`VideoFilters`): one white card `rounded-2xl border bg-surface p-5 md:p-6`, `gap-4`, with sr-only h2 "Lọc video".
   - Four filter groups, each a `FilterPills` row (label + pills): "Nền tảng" (Tất cả / YouTube / TikTok), "Nguồn" (Tất cả / Của Chíp Chíp / Tuyển chọn), "Chủ đề" (Tất cả + four topics), "Độ khó" (Tất cả / Cơ bản / Trung bình / Nâng cao). Pills are links with `scroll={false}`; each toggles one query param and resets page to 1.
   - Below `lg`: the groups are inside a native `<details>` whose summary is a full-width 44px bar "Bộ lọc" (or "Bộ lọc (2)" showing the number of active filters) with a chevron that rotates 180° (`transition-transform`, default 150ms); it is `open` by default when any filter is active. From `lg`: the same four groups are rendered again in a plain always-visible `div` (a deliberate duplicate because closed `<details>` cannot be forced open with CSS; see project CLAUDE gotchas).
   - Footer row (`border-t pt-4`, `flex-wrap justify-between`): a GET `<form>` with a labelled `<select name="sort">` ("Sắp xếp": Mới nhất / Cũ nhất / Dễ trước / Khó trước, 44px tall `rounded-xl`) and a black "Áp dụng" submit button (sort is NOT applied on change; it needs the button, and works without JS), preserving other filters through hidden inputs; and, when any filter or non-default sort is active, an accent "✕ Xoá lọc" link back to `/video`.
3. Grid `mt-8 gap-4 sm:grid-cols-2 lg:grid-cols-3` of `VideoCard`.
4. Shared `Pagination`.

#### VideoCard (`VideoCard.tsx`)
- `Link` card `group flex h-full flex-col gap-3 rounded-2xl border bg-surface p-4` (compact `p-3`), `transition-all duration-300`, hover `border-black/20 shadow-card-hover`. No arrow, no "read more".
- Thumbnail: 16:9 `rounded-xl bg-surface-muted`, YouTube still from `https://i.ytimg.com/vi/{id}/hqdefault.jpg`; TikTok has no thumbnail so a centred `PlayCircle` icon (40px, stroke 1.4, muted) on grey. A platform badge top-left: `rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white` ("YouTube"/"TikTok"). There is no play-button overlay, no duration, and no hover effect on the thumbnail itself (no zoom).
- Meta row: source pill (`bg-surface-muted`: "Của Chíp Chíp", "Tuyển chọn" or "Tuyển chọn · {channel}"), difficulty pill (outlined), date (normal weight).
- Title: `h3` 18px bold (compact 16px), balance. Titles are not clamped (unlike PostCard excerpts).
- The `compact` variant is used in "Video liên quan" on lesson pages.

#### States
- Empty (unfiltered): "Chưa có video nào. Quay lại sau nhé!"; filtered: "Không có video nào khớp bộ lọc này."; page>1 empty: "Trang này không có nội dung." + "Về trang đầu" link. Dashed box same as lessons.
- Page beyond last: 404.
- No loading UI.

#### Effects
Hero `rise-in`; chevron rotate on the mobile filter disclosure; pill colour transitions; card hover border/shadow 300ms.

---

### 7. Video detail: `/video/[slug]` (vi) and `/videos/[slug]` (en)

Files: `app/[locale]/video/[slug]/page.tsx`, `.../not-found.tsx`, `.../opengraph-image.tsx`, `components/forum/{ArticleBody,VideoFacades,CommentSection}.tsx`, `lib/tiptap/video-embed.ts`, `lib/video.ts`.

Data: `getVideoBySlug`, `getLessonByTranslation` (linked lesson via `related_lesson_translation_id`), `getTranslationSlug`, comments as in blog. OG type `video.other`.

#### Sections (wrapper `max-w-4xl` = 896px, `px-5 py-14 md:px-8 md:py-20`)
1. Back link "← Về trang Video" (`min-h-11`).
2. Player (`mt-6`): the video facade markup wrapped in `.chip-prose`: a 16:9 (or 9:16, max 340px wide, centred, for TikTok) black `#0d0d0d` rounded-12 box containing the thumbnail (eager, `fetchpriority=high`, it is the LCP element), a centred 68px dark disc with a white CSS triangle, and a bottom-left label chip with the platform name. Click swaps in an `iframe` (see section 15 "Video embed").
3. Header (`mt-8`): chip row (`text-xs font-semibold`): source pill (`bg-surface-muted`), difficulty pill (outlined), topic chip (topic tone). H1 28/38px (smaller than the article H1 30/42). Meta row: "Đăng ngày {date}" and the other-language link ("Xem bản tiếng Việt"/"Xem bản tiếng Anh", i18n'd, 44px tall). Action row: black button "📖 Xem bài học liên quan" (only if a related lesson exists; `min-h-11 rounded-xl bg-primary px-5`) and outlined "↗ Xem trên YouTube/TikTok" (opens the original in a new tab).
4. Body: `ArticleBody` (Tiptap description/notes; same `chip-prose`, empty message "Bài viết chưa có nội dung." if blank), then `ReportMistake`, then `CommentSection` (with `section="/video/[slug]"`).
- No table of contents on video pages.

#### States
- 404: "Không tìm thấy video này." + "← Về trang Video".
- Video with no valid platform/id: player block is skipped, the rest renders.

#### Effects
Facade play-disc colour on hover/focus 150ms; no other motion. The facade has no scale/zoom animation.

---

### 8. Search: `/tim-kiem` (vi) and `/search` (en)

Files: `app/[locale]/tim-kiem/page.tsx`, `components/search/SearchForm.tsx`, `components/search/SearchBox.tsx` (navbar popover), `lib/search-query.ts`, `lib/queries/posts.ts:440`, `supabase/migrations/20260928000200_search.sql`.

Purpose: site-wide search across lessons, videos and blog. `force-dynamic`; `robots: noindex, follow`.
Behaviour (accent-insensitive): the query is normalised (whitespace folded, trimmed, cut to 100 code points), sent as a GET `?q=`; the Postgres RPC `search_posts` lowercases and un-accents the query and the indexed text (`f_unaccent`), splits into alphanumeric tokens, drops single-char tokens unless it is the only token, ANDs them as prefix matches (`token:*`), ranks by `ts_rank`. So "ban dan" matches "bán dẫn"; it is prefix/word-start matching. Three separate calls, one per kind, each asked for up to 50 rows.

#### Sections
1. `PageHero` (no backdrop, no children): eyebrow "Tìm trong Chíp Chíp"; title "Tìm kiếm" (or `Kết quả cho “{query}”` when a query is present, with the description dropped); description "Tìm trong bài học, video và blog của Project Chíp Chíp. Gõ có dấu hay không dấu đều được."
2. Content section `px-5 pb-16 md:px-8 md:pb-20`, column `max-w-3xl`:
   - `SearchForm`: `flex gap-2`; `type="search"` input (`h-11 rounded-xl border`, 16px on mobile, 14px md+, placeholder "Ví dụ: bán dẫn, transistor…", `maxLength 100`, `autoComplete=off`, `enterKeyHint=search`) and a black "🔍 Tìm" button. Has a `variant="dark"` (white-on-dark) for use in the dark mobile menu.
   - No query: dashed box "Gõ từ khoá để tìm trong bài học, video và blog. Có dấu hay không dấu đều được."
   - Query with no hits in any group: dashed box `Không tìm thấy kết quả nào cho “{query}”. Thử một từ khoá ngắn hơn nhé.`
   - Results: a vertical stack (`gap-12`) of groups in fixed order Bài học, Video, Blog (only non-empty groups). Group header: `h2` 18px bold plus a muted 14px count ("12 kết quả", "50+ kết quả" when capped) on the same baseline; optional note "Đang hiện 10 kết quả đầu tiên." Each result is a `Link` list item card (`block rounded-2xl border bg-surface p-5`, hover `border-black/20`, colour transition only): title (16px semibold) and a 2-line-clamped excerpt (14px muted). No thumbnails, badges, dates, topic or difficulty in results. Max 10 shown per group; there is no "see more" or pagination (a hard limit).
3. Navbar entry (`SearchBox`, desktop only): a 44px round magnifier button; click reveals a popover `absolute right-0 top-full mt-2`, width `min(380px, 100vw-2.5rem)`, `rounded-2xl border bg-surface p-2 shadow-float`, input auto-focused. Toggles the icon Search/X, `aria-expanded`, Escape closes and returns focus to the button, click outside or blur out of the box closes. It has no open/close animation (uses the `hidden` attribute, instant). Below `lg` the form lives in the mobile menu.

#### States
- Empty and no-result states as above; no loading state; a search-service error returns `[]` and shows the "no results" message (error is only logged).
- Result filtering: posts without a valid `postHref` (e.g. a lesson without a topic) are dropped.

---

### 9. About: `/gioi-thieu` (vi) and `/about` (en)

Files: `app/[locale]/gioi-thieu/page.tsx`, `components/sections/about/{AuthorSection,Commitments,Faq,Contributors,ContributeCta}.tsx`, `lib/constants.ts` (`ABOUT_BANNER`, `AUTHOR`, `CONTRIBUTORS`), `lib/initials.ts`. All static, copy from `messages` namespace `about`. Does not use `PageHero`.

WARNING (content status): the author copy is still placeholder text in brackets in `vi.json` ("[Tên tác giả]", "[Vai trò, ví dụ: ...]", "[Câu chuyện, đoạn 1] ...", "[Câu chuyện, đoạn 2] ..."). `AUTHOR.photo` is `null` so an initials circle is shown, and `CONTRIBUTORS` is `[]`, so the contributors section is hidden. The design must accommodate real content arriving later.

#### Sections, top to bottom
1. Hero: section `px-5 pb-10 pt-14 md:px-8 md:pt-20`; grid `lg:grid-cols-[1.05fr_1fr] lg:gap-14 gap-10 items-center`, container 1280px.
   - Left `<header max-w-3xl>`: eyebrow chip "Về dự án" (same chip style as PageHero; `.rise-in` is applied to the chip only, not to h1/paragraph), H1 32px / md 48px "Người đứng sau Project Chíp Chíp", lead paragraph "Chíp Chíp là dự án một người làm: một chỗ học bán dẫn bằng tiếng Việt, miễn phí cho mọi học sinh, và luôn mở cho những ai muốn góp sức."
   - Right: banner image `aspect-[3/2]` (source `/about-banner.jpg` 1600x1068), `rounded-3xl border bg-surface-muted`, `object-cover`, `priority`, `alt=""`. The code comment calls it "placeholder art".
2. `AuthorSection`: `px-5 py-14 md:px-8 md:py-16`; a white `rounded-3xl border` card, padding `px-6 py-10 md:px-12 md:py-14`, grid `md:grid-cols-[200px_1fr] md:gap-12 gap-8`. Left: circular portrait (`size-32` / md `size-44`, `rounded-full bg-surface-muted`) with the photo or big initials (36/48px extrabold, `text-nav`). Right (`max-w-2xl`): label "Về tác giả" (12px semibold uppercase muted), `h2` name (26/34px), role line (14px muted), two story paragraphs (15/16px, `text-nav`, relaxed), `h3` "Vì sao có Chíp Chíp" (18px bold) and one long paragraph.
3. `Commitments`: heading block (h2 "Mục đích minh bạch" 26/34px, paragraph "Bốn cam kết này không thay đổi, dù sau này dự án lớn đến đâu."), a `ul` grid `gap-3 sm:grid-cols-2 lg:grid-cols-4` of four white `rounded-2xl border p-5` cards: icon (20px, accent; `BadgeCheck`, `Ban`, `HandCoins`, `ShieldCheck`), title 15px bold ("Miễn phí", "Không quảng cáo", "Không thu tiền", "Không bán dữ liệu"), body 13px muted. Then a link "Xem dữ liệu nào được thu và vì sao →" to the privacy policy (`min-h-11`, accent, hover black). Cards are static (no hover state).
4. `Faq`: two-column on `lg` (`lg:grid-cols-[1fr_2fr] gap-16`): left h2 "Câu hỏi thường gặp"; right a native `<details>` accordion inside `divide-y` with top and bottom borders. Six items (free, author, mistake, classroom, ads, english, e.g. "Chíp Chíp có miễn phí không?"). Summary: `min-h-11 py-4`, 15/16px semibold, hover `text-accent`; trailing `+` icon rotates 45° on open (`transition-transform duration-300`, `motion-reduce:transition-none`). Answer `pb-5 pr-9` 15px muted. All closed by default; there is no height animation (native details opens instantly), no single-open behaviour. Stacks to one column below `lg`.
5. `Contributors`: hidden when empty. When present: h2 "Những người đã đồng hành", paragraph, and a `sm:2 lg:4` grid of white cards with name (15px bold) and role (13px muted).
6. `ContributeCta`: `px-5 py-14 md:px-8 md:py-20`; a full-container black panel `rounded-3xl bg-primary px-6 py-12 md:px-14 md:py-16` with white h2 "Cùng làm Chíp Chíp tốt hơn", 85%-white paragraph, and two buttons stacked on mobile / row on `sm`: white filled "Xem cách đóng góp →" (accent text, hover `bg-white/90`) linking to `/dong-gop`, and outlined "Liên hệ tác giả" (`border-white/40`, hover `bg-white/10`) linking to `/lien-he`. This is a flat black panel, unlike the home `JoinCta` (which has a backdrop image and `PillButton`s).

#### States/effects
Static server-rendered; no loading or error states. Effects: `rise-in` on the eyebrow chip (0.5s), FAQ plus icon rotation, link/button colour transitions. No scroll reveals.

#### Accessibility
Each section is `aria-labelledby` its h2; FAQ uses native disclosure semantics; decorative icons `aria-hidden`; image `alt=""` (banner) vs meaningful `photoAlt` for the portrait.

---

### 10. Contact: `/lien-he` (vi) and `/contact` (en)

Files: `app/[locale]/lien-he/page.tsx`, `components/contact/MessageForm.tsx`, `components/contact/message-form-fields.ts`, `lib/contact-client.ts`, `lib/contact-message.ts`, `app/api/messages/route.ts`, `lib/constants.ts` (`CONTACT_EMAIL`, `SOCIAL_LINKS`). Not `PageHero` (custom header).

Purpose: send a message or feedback to the sole maintainer. Data: writes to `public.messages` via `/api/messages` (rate limit 3 per hour per hashed IP, across contact, feedback and article reports; honeypot; body ≤4000, name ≤80, email ≤254).

#### Sections
Single section `px-5 py-14 md:px-8 md:py-20`; grid `lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16`.
1. Left column: header (eyebrow chip "Chúng tôi lắng nghe" with `rise-in`, H1 32/44px "Liên hệ", description "Gửi câu hỏi, lời góp ý hoặc đề nghị hợp tác. Mọi tin nhắn đều được tác giả đọc.") then a white `rounded-3xl border p-6 md:p-8` form card (`mt-10`).
2. Form (`MessageForm variant="contact"`), `flex-col gap-5`:
   - Radio fieldset legend "Bạn muốn gửi": two pill-styled radio labels "Liên hệ" (default) / "Góp ý" (`min-h-11 rounded-xl border px-4`, checked state via `has-[:checked]:border-accent`, native radio accent `#314344`).
   - Grid `sm:grid-cols-2`: "Tên của bạn" (required, max 80) and "Email (không bắt buộc)" with hint "Chỉ dùng để trả lời bạn, không hiển thị ở đâu. Để trống thì chúng tôi không trả lời lại được." Inputs `h-11 rounded-xl border px-3.5`, 16px on mobile / 14px md+.
   - Textarea "Nội dung", 6 rows, hint "Tối đa 4000 ký tự."
   - Honeypot field off-screen.
   - Live region (`aria-live="polite"`): red `text-red-700` error messages or the plain-text success "Đã gửi. Cảm ơn bạn đã viết cho Chíp Chíp!" (not styled green, unlike the comment form).
   - Submit "Gửi tin nhắn" (black `rounded-xl`, full width on mobile / `sm:w-fit`, disabled 60% and label "Đang gửi…" while sending).
   - Validation is done client-side in `sendMessage` (pure function) before the request: name required/≤80 "Vui lòng nhập tên (tối đa 80 ký tự).", body required/≤4000 "Vui lòng nhập nội dung (tối đa 4000 ký tự).", bad email "Email chưa đúng định dạng. Bạn có thể để trống ô này.". Errors are shown in the single live region (not inline per field); the offending field gets `aria-invalid` and focus. Server/other errors: `postNotFound`, `rateLimited` ("Mỗi người gửi được tối đa 3 tin mỗi giờ, tính chung cả liên hệ, góp ý và báo lỗi bài. Bạn thử lại sau nhé."), `network` ("Không kết nối được. Kiểm tra mạng rồi gửi lại nhé."), `generic` ("Chưa gửi được tin nhắn. Bạn thử lại sau ít phút nhé."). On success the form resets and stays in place (no redirect).
3. Right aside (`flex-col gap-8 lg:pt-24`): blocks, each shown only if data exists. Email block (h2 "Email", mailto link in mono font, underlined) shown only when `CONTACT_EMAIL` is non-empty (currently `""`, so hidden). Social block (h2 "Mạng xã hội", links Facebook/TikTok in new tab) shown only for links with a non-empty `href` (currently both `""`, so hidden). "Khi nào có phản hồi" block with the response-time text (currently the bracket placeholder "[Thời gian phản hồi] Tác giả thường trả lời trong vòng [số] ngày...") and "Để chặn spam, mỗi người gửi được tối đa 3 tin mỗi giờ." Privacy note "Thông tin bạn gửi chỉ dùng để trả lời bạn." + underlined accent link "Xem chính sách bảo mật". So in the current build the aside shows only the last two blocks.

#### Effects
`rise-in` on the eyebrow chip only; button/link colour transitions. No success animation.

---

### 11. Contribute: `/dong-gop` (vi) and `/contribute` (en) and Privacy: `/chinh-sach-bao-mat` (vi) and `/privacy` (en)

#### 11a. Contribute
File: `app/[locale]/dong-gop/page.tsx`. Static. Uses `PageHero` (no backdrop, no children): eyebrow "Cùng xây Chíp Chíp", title "Đóng góp", description "Chíp Chíp do một người làm, nhưng không cần làm một mình. Nếu bạn muốn giúp, đây là bốn cách, cách nào cũng bắt đầu bằng một tin nhắn."
- Section `px-5 pb-16 md:px-8 md:pb-20`: `ul` grid `gap-4 sm:grid-cols-2` (2x2) of four white `rounded-2xl border p-6 md:p-7` cards. Each: 44px `rounded-xl bg-surface-muted` icon tile with an accent icon (`PenLine` Viết bài, `Languages` Dịch, `Clapperboard` Làm video, `Flag` Báo lỗi), `h2` (18px bold), body (14px muted), and a bottom-aligned (`mt-auto`) accent link "Nhắn cho tác giả →" that goes to `/lien-he` (the same link in all four cards).
- Footer note (`mt-10 max-w-2xl`, 14px muted): "Chíp Chíp không trả thù lao và không thu phí. Người đóng góp được ghi tên trong bài và ở mục "Những người đã đồng hành" trên trang Giới thiệu."
- Effects: hero `rise-in`; link colour. No hover on the cards themselves.

#### 11b. Privacy
File: `app/[locale]/chinh-sach-bao-mat/page.tsx`. Static long text (legal-style). Uses `PageHero` (eyebrow "Dữ liệu của bạn", title "Chính sách bảo mật", description "Chíp Chíp thu rất ít dữ liệu. Trang này nói rõ đó là dữ liệu gì, dùng vào việc gì và giữ trong bao lâu.").
- `<article>` `px-5 pb-16 md:px-8 md:pb-20`, column `max-w-3xl`. First line: `<time>` "Cập nhật ngày 28 tháng 9, 2026" (`PRIVACY_UPDATED = "2026-09-28"`, formatted in UTC). Then six sections, each `mt-10` with an `h2` (20px bold) and a disc bullet list (`pl-5 gap-3`, 15px `text-nav`, muted markers): "Chúng tôi thu những gì" (4 items), "Cookie và dữ liệu trên máy bạn" (4), "Dùng vào việc gì" (2), "Giữ trong bao lâu" (2), "Chia sẻ với ai" (3), "Quyền của bạn" (1). Ends with a black button "Gửi yêu cầu qua trang Liên hệ" (`min-h-11 rounded-xl bg-primary px-5`).
- No table of contents or anchors nav; sections have ids `privacy-{id}`.
- Effects: hero `rise-in` only.

---

### 12. Not-found and error pages

- Global 404 (`app/[locale]/not-found.tsx`, also what `[...rest]` and invalid topic route render): `section min-h-[60vh]` centred, "404" (14px semibold uppercase tracking 0.16em, accent), H1 28/38px "Không tìm thấy trang", paragraph "Trang bạn tìm không tồn tại hoặc đã được chuyển đi." (`max-w-md`), and a `PillButton` (brand variant, `size lg`, 52px, with arrow) "Về Trang chủ". The PillButton (root is a `Link`) carries the site's animated black gradient pill: a `StarBorderLayer` travelling glow around the rim (CSS keyframes `star-movement-bottom/top`, linear infinite, 5s idle, 2s on hover; disabled under reduced motion), inset shadows `0 2px 4px rgba(0,0,0,.18)/inset -2px rgba(255,255,255,.22)`, gradient `linear-gradient(131deg,#333 0.79%,#0d0d0d 35.22%,#262626 99.16%)`, radius `rounded-3xl`. As a link it has no tap-scale (only the button variant scales 0.97 in 0.2s).
- Article-level 404s (lesson, blog post, video): the lighter variant described in sections 3/5/7: `py-24`, no min-height, "404" + H1 26/34px + a plain accent text link with a back arrow; no description line and no PillButton. Inconsistent with the global 404.
- Error boundary (`app/[locale]/error.tsx`, client): `min-h-[60vh]` centred, H1 26/34px "Đã có lỗi xảy ra.", paragraph "Đã có lỗi xảy ra khi tải nội dung. Bạn thử tải lại trang nhé.", black `rounded-xl` button "↻ Thử lại" that calls `reset()`. No "404"/eyebrow line, no link home, different button style from the 404 page. `common.loading` "Đang tải…" exists in messages but is unused by these pages.

---

### 13. Report a mistake (`components/contact/ReportMistake.tsx`, `MessageForm variant="report"`)

Shown under lesson, blog and video bodies (before comments where present).
- Native `<details class="group mt-12 rounded-2xl border bg-surface">`. Closed by default: summary row `min-h-11 px-5 py-3`, flag icon + "Báo lỗi bài này" (14px semibold, `text-nav`, hover accent), and a chevron pushed right that rotates 180° on open (`duration-300`, `motion-reduce:transition-none`). Open: a `border-t` divider, `px-5 pb-6 pt-5` content: intro "Thấy chỗ sai, chỗ khó hiểu hoặc link hỏng? Mô tả ngắn gọn giúp tác giả sửa nhanh hơn." then the same `MessageForm` in report mode: no kind radios; fields Tên của bạn, Email (không bắt buộc), textarea "Lỗi bạn thấy" (4 rows, ≤4000). Submit "Gửi báo lỗi"; success "Đã gửi báo lỗi. Cảm ơn bạn đã giúp bài tốt hơn!" Error copy shared with the contact form. Sends `kind = content_error` with the post id.
- No open/close height animation (native), instant reveal.
- After a successful send the form stays open with the success text.

---

### 14. Related shared: `MessageForm` field style
Inputs 44px tall (`h-11`), `rounded-xl`, `border-border`, white; focus `border-accent` + `ring-2 ring-accent/30`; 16px font on mobile (prevents iOS zoom) and 14px from `md`. Labels 14px semibold (contact form) vs 12px medium muted (comment form). The comment form uses 40px inputs and inline field errors; the message form uses one aggregated live region. These two forms should be unified in a redesign.

---

### 15. Article rendering pipeline and how it looks (`lib/tiptap/*`, `.chip-prose` in `globals.css:95-470`)

Pipeline: stored Tiptap JSON → `prepareArticle` (formulas pulled out, invalid videos dropped) → `generateHTML` with `articleExtensions` → `sanitizeArticleHtml` (allow-list; `script/style/iframe/object/embed/form` removed with bodies) → heading ids injected → KaTeX for formulas → video placeholders replaced by facades. Server-side only. `ArticleBody` imports `katex/dist/katex.min.css` (fonts self-hosted, only loaded on article pages).

Node/mark types in the schema (`extensions.ts`): StarterKit (paragraph, headings 1-3, bold, italic, strike, underline, code, code block class `chip-code-block`, blockquote, bullet/ordered lists, hr, links `rel="noopener noreferrer nofollow" target="_blank"`), Image (block, no base64), Table (TableKit, not resizable), TextAlign (headings/paragraphs), Highlight (single colour), Mathematics (inline and block), plus four custom nodes: `Figure`, `Callout`, `References`, `VideoEmbed`. Sanitiser allow-list also permits `span, div, figure, figcaption, aside, section, h4`. (Headings for the TOC are h2/h3 only.)

Base prose (`.chip-prose`): 17px (1.0625rem), line-height 1.75, black, `text-wrap: pretty`; vertical rhythm `> * + * { margin-top: 1.25em }`. Body column is 768px wide.
- Headings: weight 700, colour `#0d0d0d`, line-height 1.3, tracking -0.02em, balance; h1 32px (mt 2em), h2 24px (mt 2em), h3 20px (mt 1.75em), h4 17px (mt 1.5em). (Page title is a separate Tailwind h1; body h1 also styled.)
- Links: `#314344`, underlined, offset 3px, 1px thickness, weight 500 (no hover change; hover colour is the same).
- Strong 600. Lists: 1.5rem left padding, disc / decimal, marker colour `#314344`, item gap 0.4em.
- Blockquote: 3px left border `#314344`, `padding .25rem 0 .25rem 1.25rem`, colour `#3e424d`, italic.
- Inline code: `#efefef` bg, radius 4px, JetBrains Mono 0.875em. Code block: `#0d0d0d` bg, white text, radius 12px, padding `1.25rem 1.5rem`, mono 14px, line-height 1.7, horizontal scroll. No syntax highlighting theme.
- Images: full width, auto height, radius 12px. `hr`: 1px `#d1d1d1`, margin 2.5em.
- Tables: full width, collapse, 15px, `display:block; overflow-x:auto` (scroll on small screens), 1px `#d1d1d1` borders, cell padding `.625rem .875rem`, header bg `#efefef` semibold.
- Highlight `mark`: `#fef6d9` (pale yellow), radius 3px.
- Math: KaTeX (`htmlAndMathml`, non-throwing). Inline formulas in `<span class="math-inline">`; block formulas in `<div class="math-block">` (margin 1.5em 0, horizontal scroll, `overflow-y:hidden`). Invalid or over-length (>2000) LaTeX falls back to a `<code class="math-error">` showing the source (truncated to 200 chars). Uses KaTeX default fonts.
- Figure with numbered caption: `figure` margin 2em 0; `figcaption` centred, 15px, `#3e424d`, `margin-top .625rem`. The number is CSS-generated: `figcaption::before { content: "Hình " counter(figure) ". " }` (semibold, `#0d0d0d`), English `:lang(en)` gives "Figure N. ". Only captioned figures increment the counter; `counter-reset: figure` is on `.chip-prose`. Image `src` must be `https://` or the project's Supabase public storage. Captions are plain text.
- Callouts (4 variants: note, tip, warning, example), `<aside class="callout callout-{variant}" data-variant>`: `#f5f5f5` bg, 1px `#d1d1d1` border, 4px left border `#314344`, radius 12px, padding `1rem 1.25rem`, inner blocks spaced 0.75em. A generated uppercase label above the content (13px, 700, tracking 0.08em, `#3e424d`): vi "Ghi chú" / "Mẹo" / "Lưu ý" / "Ví dụ", en "Note" / "Tip" / "Warning" / "Example". Variants differ only by line weight or style, never hue: warning has a 6px near-black left border (`#0d0d0d`); example has a dashed left border; note and tip are identical apart from the label. No icons.
- References (`<section class="references" data-type="references">`): top border 1px `#d1d1d1`, `margin-top 3em`, `padding-top 1.5em`, 15px; generated title "Nguồn tham khảo" / "References" (20px bold `#0d0d0d`); content is an ordered list; optional reviewers line "Được góp ý bởi {names}" / "Reviewed by {names}" in `#3e424d` with a 1em top margin.
- Video embed (`VideoEmbed` node, rendered as a facade): `figure.video-embed` 16:9, `#0d0d0d` background, radius 12px, `overflow:hidden`; TikTok variant is 9:16, max-width 340px, centred. `a.video-facade` fills it; `img` thumbnail (YouTube only) `object-cover`; play disc 68px, `rgba(13,13,13,.85)`, white CSS triangle (12/20px borders); hover/focus-visible disc becomes `#000` (150ms ease); platform label chip bottom-left (12px from edges, 13px semibold white on `rgba(13,13,13,.85)`, pill). Click behaviour (`VideoFacades.tsx`): one document-level click listener; an unmodified left click on `a.video-facade` replaces it with an `iframe` (`youtube-nocookie` with `?autoplay=1` for YouTube; TikTok embed URL), `allowFullscreen`, `loading=lazy`, `referrerPolicy strict-origin-when-cross-origin`, title "Video {platform} nhúng trong bài", and moves focus to the iframe. Modified clicks and no-JS fall through to the link (opens the video on its own site in a new tab). The privacy page states videos load only on play.
- The editor surface (`.chip-prose.ProseMirror`, min-height 420px, placeholder colour `#ababab`) shares this same CSS, so the admin editor previews the public look.

---

### 16. Shared patterns across inner pages and inconsistencies to unify

#### Pattern inventory
- `PageHero` (`components/sections/PageHero.tsx`): used by Lessons, Topic, Blog index, Video index, Search, Contribute, Privacy. NOT used by About and Contact, which re-implement an eyebrow + h1 header by hand (the copies differ: About h1 32/48px, Contact 32/44px, PageHero 34/46px; About and Contact put `rise-in` on the chip only, PageHero applies it to the whole row). Three hero flavours exist: plain type-only, image backdrop (video), muted looping video backdrop (blog). Home uses different, larger hero conventions (not in scope).
- `.rise-in`: 0.5s, `cubic-bezier(0.22,1,0.36,1)`, translateY(12px) → 0, opacity 0 → 1, `both` fill, plays on load, no observer. This easing differs from `EASE_STANDARD (0.25,0.1,0.25,1)` used by the sidebar and the card expansion, and from the scroll-reveal ease `(0.16,1,0.3,1)`; three different curves coexist.
- Eyebrow chip: same class string is copied in `PageHero.tsx:68`, `gioi-thieu/page.tsx:42`, `lien-he/page.tsx:40`.
- Filters: `FilterPills` (link pills, 44px, black-when-active) is used for Lessons difficulty and Video filters. Lessons also uses a second pill style for topics (with counts, vertical on desktop). Video adds a `<details>` disclosure on mobile plus a duplicated desktop panel, and a native `<select>` + "Áp dụng" button for sort (the only non-pill control, and sort does not auto-apply). Blog has no filters. Search has none.
- Cards: three different card families. `PostCard` (cover 16:9, chips, title, 3-line excerpt, "Đọc tiếp", padding 24px, radius 16), `VideoCard` (thumbnail, badge, chips, title only, padding 16px, radius 16), search result rows (title + 2-line excerpt only, padding 20px), plus About/Contribute info cards (padding 20-28px, static). Hover styling is consistent for PostCard and VideoCard (border `black/20` + `shadow-card-hover`, 300ms) but the search rows only change border colour and the info cards have no hover.
- Card grids: 1 / 2 / 3 columns, gap 16px. Breakpoint for 3 columns is `lg` on blog and video but `xl` on lessons (because of the sidebar).
- Pagination: shared `Pagination` (44px squares, `rounded-xl`, prev/next chevrons, window of ≤7 items with ellipsis, `rel=prev/next`, `aria-current`) is used by Lessons and Video (page size 12). The Blog index uses a separate inline implementation (36px squares, `rounded-lg`, all pages listed, no arrows, `<a href="?page=n">`, page size 9). Inconsistent size, shape, tap target and page size.
- Empty states: dashed `rounded-2xl` box with muted 14px text. Lessons and Video use `flex-col gap-4 px-6 py-16` plus an optional "Về trang đầu" link; Blog and Search use a bare `<p>` with the same border (search uses `py-12`); comments and article-empty use `px-5 py-10`. Same idea, three paddings, no icon or illustration anywhere.
- Article pages: lesson and blog share the same skeleton (`max-w-3xl`, back link, header, cover, TOC, body, report, extras) but differ: lesson has a topic chip, "Bài học · date" line and related videos and no comments and no language link; blog has a language-switch pill (hard-coded English/Vietnamese strings), and comments. Video is wider (`max-w-4xl`), smaller h1 (28/38px), puts the player before the header, has action buttons and no TOC.
- Back links: three different tap heights (lesson/blog: text only, ~20px; video: `min-h-11`). Article 404 back links are accent-coloured and `min-h-11`.
- Language switching: video has i18n'd pill labels ("Xem bản tiếng Việt"), blog uses hard-coded strings, lesson has none; the navbar `LangSwitch` covers the rest.
- Inputs: comment form 40px tall with inline errors and `text-xs` labels; contact/report 44px with aggregated live-region errors and `text-sm` semibold labels; search 44px. Success colours differ (green `text-green-700` in comments, default text colour in contact).
- Buttons: black `rounded-xl` solid button is the workhorse (submit, "Áp dụng", privacy CTA, video "Xem bài học"); the animated `PillButton` (star-border glow, rounded-3xl) appears only on the global 404 (and home). Error page uses a solid black rounded-xl instead. About CTA uses white/outline `rounded-xl` variants.
- Difficulty badge: identical neutral outlined pill on every level (no colour or icon coding). Topic chips: four near-identical greys.
- Typography scale in use: page h1 34/46 (hero), 32/48 (about), 32/44 (contact), 30/42 (blog/lesson article), 28/38 (video article, global 404), 26/34 (article 404, error, about section h2). Section h2s are 26/34 on About, 20 on Privacy, 18 elsewhere. A redesign should define one scale.
- Vertical rhythm: sections use `py-14 md:py-16/20` (About, Contact, Articles), `py-10 md:py-14` (listings), `pb-16 md:pb-20` (Contribute/Privacy/Search under a PageHero).
- Placeholder content still visible: About author text and name, Contact response time, About banner art, empty `CONTACT_EMAIL` and social links, empty `CONTRIBUTORS`, Home/Blog media credits. Section visibility already handles empty email, social, contributors; it does not handle the bracketed copy.
- Motion overall on inner pages is intentionally minimal: one entrance keyframe, hover colour/shadow transitions, two structural animations (sidebar width collapse 450ms, card-to-fullscreen panel 400ms + 300ms fade), native `<details>` chevrons/plus rotation (150-300ms), video-facade hover (150ms), the star-border on `PillButton`, and Lenis smooth wheel scrolling on desktop. There are no scroll-triggered reveals, no page transitions, no skeletons, no parallax on inner pages.
- Reduced motion: handled globally in CSS (all animations/transitions collapsed), `motion-reduce:transition-none` on the sidebar and disclosure icons, `useReducedMotion` in `ExpandingCardLink` (falls back to a normal link), `PillButton` (no glow, no tap scale), `SmoothScroll` (Lenis off).
- Accessibility items worth carrying into a redesign: skip link; 44px minimum targets on nearly all controls (exceptions: comment form inputs 40px, article back links, blog pagination 36px, blog language pill); `aria-current` on active filters/pages; filters/pagination are real links (work without JS and shareable); honeypot fields; `aria-live` in forms; native `<details>` for FAQ, report and mobile filters; focus moved to first invalid field; `role="search"`; Escape and outside-click close for the search popover; decorative images `alt=""`; all colour contrast intentionally ≥7:1 for article text (per the CSS comment at `globals.css:279`); Lenis and `scroll-padding-top: 6rem` keep anchors clear of the fixed navbar.
- Known 404 behaviour: detail 404s return the right status but Next 14 serves a generic shell (project CLAUDE.md gotcha), and the loading-panel workaround in `ExpandingCardLink` exists because `loading.tsx` had to be removed.

---

## Phụ lục C — Trang quản trị, chức năng, dữ liệu và ràng buộc

Read-only survey of /Users/nmh/work/Mac/NMHx/CodeThue/Project_Chip_Chip. Paths below are relative to that root. Items I could not confirm are marked "unclear".

Global visual tokens (used by every admin screen; from `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`):
- Colors: bg `#E5E5E5`, surface `#FFFFFF`, surface-muted `#EFEFEF`, primary (buttons, active tab) `#0D0D0D`, accent `#314344` (dark teal-grey, links/active text/focus ring), accent-teal `#317e6a` (defined; not seen in admin), text `#000`, text-muted `#3e424d`, text-nav `#4d4d4d`, border `#D1D1D1`. Palette is deliberately greyscale; topic chips are grey shades (TOPIC_TONE 4A4A4A/6B6B6B/8C8C8C/AEAEAE with soft fills E6E6E6/EAEAEA/EEEEEE/F2F2F2).
- Status colors in admin are the only hues: green (published, saved, "Dang bai" button `green-600`), amber (draft, warnings), red (errors, destructive buttons `red-600`).
- Fonts: Be Vietnam Pro (400-800; sans/display/body) and JetBrains Mono (400/500; used for emails, slugs, video link, error digest).
- Radii: cards `rounded-2xl`, inputs/buttons `rounded-xl` (h-11 inputs, h-10/h-12 in editor), small buttons `rounded-lg`, pills `rounded-full`. Shadow `shadow-card` on login card only.
- Icons: lucide-react (ExternalLink, ArrowRight, Plus, Eye/EyeOff/Trash2, Check/RotateCcw, Languages, ImagePlus, TriangleAlert, toolbar icons).
- Animations in admin: only `transition-colors` on buttons/links, `animate-pulse` skeletons in loading.tsx, `backdrop-blur-xl` on sticky header, `backdrop-blur` on sticky toolbar. No entrance animations in admin. Global `@media (prefers-reduced-motion: reduce)` in globals.css collapses all animation/transition durations to 0.01ms. The public-site `rise-in` keyframe (12px, 0.5s) and `animate-float` exist but are not used by admin.
- Admin copy is hard-coded Vietnamese in the components, NOT in messages/{vi,en}.json (there is no `admin` namespace). `(dashboard)/error.tsx` says why: admin is outside locale routing.

---

### Admin

#### Routing, guard and shell
- Routes (outside `[locale]`, Vietnamese only, not localized): `/admin` (dashboard), `/admin/dang-nhap` (login), `/admin/bai-viet` (list), `/admin/bai-viet/moi` (new), `/admin/bai-viet/[id]` (edit), `/admin/comments`, `/admin/tin-nhan`. Files: `src/app/admin/(auth)/dang-nhap/*`, `src/app/admin/(dashboard)/**`.
- Guard, three layers: (1) `src/middleware.ts` redirects anonymous or inactive users to `/admin/dang-nhap` (`?next=<path>` if anonymous, `?error=not_staff` if logged in but inactive); an active staff user visiting login is redirected to `/admin`. Middleware skips the check for Server Action POSTs (`next-action` header). (2) `requireStaff()` in each page (`src/lib/auth.ts`). (3) every Server Action calls `lookUpStaff()` and returns `SESSION_ENDED` (`{ok:false, unauthorized:true, error:"Phien dang nhap da het han. Vui long dang nhap lai."}`) instead of redirecting; the component then does `router.replace("/admin/dang-nhap")`.
- Headers: `X-Robots-Tag: noindex, nofollow` on `/admin/:path*`; page metadata robots noindex; `robots.txt` disallows `/admin`, `/api`, `/motion-gallery`. `X-Frame-Options: DENY`.
- All admin list pages are `force-dynamic` (never cached).

#### Dashboard layout (`src/app/admin/(dashboard)/layout.tsx`, `AdminNav.tsx`)
- Sticky header `top-0 z-40`, `bg-surface/85 backdrop-blur-xl`, bottom border. Container `max-w-[1400px] px-5`. Main content `py-8`.
- Row 1 (h-16): Logo (compact, 17px) + pill "Quan tri" (hidden below sm; uppercase 11px, bg surface-muted, accent text). Right: "Xem trang" link to `/vi` (new tab, ExternalLink icon; hidden below sm), staff display name (hidden below md), "Dang xuat" bordered button (form action `signOutAndRedirect`, which signs out and redirects to login).
- Row 2: `AdminNav` tabs: Tong quan (`/admin`, exact match), Bai viet, Binh luan, Tin nhan. Underline tab style: active = `border-b-2 border-border text-accent` with `aria-current="page"`, inactive transparent border, text-muted, hover text. Horizontally scrollable on narrow screens (`overflow-x-auto scrollbar-none`). Note: no badges/counters in the nav.
- Header total height is ~110px; the editor toolbar depends on this (`top-[110px]`); a redesign that changes header height must update the toolbar's sticky offset.

#### Login (`(auth)/dang-nhap/page.tsx`, `LoginForm.tsx`, `actions.ts`)
- Layout: full-height centered card (`min-h-[100dvh]`, `max-w-sm`, `rounded-2xl border bg-surface p-7 shadow-card`) on bg-grey. No logo, no header/nav.
- Copy: H1 "Trang quan tri"; sub "Danh cho ban dieu hanh Project Chip Chip."; footer under card "Quen mat khau? Lien he quan tri vien de duoc cap lai." (no reset flow exists).
- Fields: Email (`type=email`, required, autocomplete email), Mat khau (password, required). Hidden `next` (only honored if it starts with `/admin`, else `/admin`). Submit "Dang nhap" (h-11, black, full width) / "Dang dang nhap..." while pending (`useFormStatus`).
- States/errors (all `role="alert"`): red box for action errors; amber box (from `?error=not_staff`) "Tai khoan da dang nhap nhung chua duoc cap quyen. Lien he quan tri vien de duoc kich hoat."
- Error strings: "Vui long nhap email va mat khau."; "Email hoac mat khau khong dung." (deliberately vague); "Qua nhieu lan thu. Vui long doi it phut roi dang nhap lai." (rate limit 10 attempts / 15 min per hashed IP, scope `login`); "Chua kiem tra duoc gioi han dang nhap. Vui long thu lai sau it phut." (limiter RPC error, fail closed); "Supabase chua duoc cau hinh. Xem .env.example."
- No sign-up UI. Supabase signup is open at the API level, but a new profile is inactive until an admin activates it in the DB (see roles).

#### Dashboard home (`(dashboard)/page.tsx`, `RebuildSearchButton.tsx`)
- Greeting H1 "Xin chao, {displayName}", sub "Tong quan noi dung cua Project Chip Chip."
- 6 stat cards in `<dl>` grid (1/2/3 columns at base/sm/lg): Bai da dang (VI), Bai da dang (EN), Ban nhap, Cho dich sang EN (draft EN rows), Binh luan dang an, Tin nhan chua xu ly. Card: `rounded-2xl border bg-surface p-5`, label 12px muted, value 3xl extrabold. Cards are not links.
- Conditional amber banner when pending EN > 0: "Co N bai chua co ban tieng Anh. Bai chi dang duoc khi ca hai ngon ngu da co tieu de va noi dung."
- Actions: primary "Viet bai moi" (black, arrow icon) to `/admin/bai-viet/moi`; secondary "Xem tat ca bai viet".
- `RebuildSearchButton`: outlined "Cap nhat chi muc tim kiem" / "Dang cap nhat..." then a `role="status"` line "Da cap nhat chi muc tim kiem cho N ban." or error. Runs `rebuildSearchText` (recomputes `plain_text` for all posts, writes only changed rows). Comment in code says it is a one-off after the search migration; harmless to repeat.
- `loading.tsx`: skeleton (title bar, sub bar, 5 pulsing cards `h-28` in a 5-col grid at lg, 3 pulsing rows `h-24`), `role="status"`, sr-only "Dang tai...". Header/nav stay. (It shows 5 cards though the dashboard has 6; minor mismatch.)
- `error.tsx`: red card, "Da co loi xay ra", copy suggests retry/reload and that persistent errors usually mean lost Supabase connection, optional mono "Ma loi: {digest}", red "Thu lai" button (`reset`). Logs to console.

#### Posts list (`(dashboard)/bai-viet/page.tsx`, `PostRowActions.tsx`)
- Header: H1 "Bai viet", sub "{N} bai. Moi bai can du ban Viet va Anh moi dang duoc.", black "Viet bai moi" button with Plus icon.
- Empty state: dashed border box "Chua co bai viet nao. Bat dau bang nut 'Viet bai moi'."
- One row per translation group (VI and EN rows collapsed; VI title shown, EN as fallback), ordered by `updated_at` desc. No search, filter, sort, or pagination controls (unclear if a limit applies: the query has no `.limit()`, so all rows load).
- Row card (`rounded-2xl border bg-surface p-5`, stacks on mobile): chips = kind (Bai hoc / Blog / Video), topic id (raw slug string such as `dinh-nghia`, accent color, only if present), status pill (green "Da dang" / amber "Nhap"), language readiness "VI check/dash" and "EN check/thieu" (green vs muted/amber). Title link (truncated; "(chua co tieu de)" if empty) to `/admin/bai-viet/{primary.id}`.
- Actions (`PostRowActions`): 
  - Draft: "Dang" button, disabled + greyed + tooltip "Can co tieu de va noi dung o ca hai ngon ngu truoc khi dang." unless `isTranslationGroupReady` (both locales present, each with non-empty title and at least one body block). Published: "Bo dang" outlined (no confirmation).
  - "Xoa" outlined (hover red) toggles inline confirmation: red "Xoa that" + text "Huy" + hint "Xoa ca ban Viet va Anh, khong khoi phuc duoc." Deletes both rows.
  - Errors appear as small red text under the buttons; success does `router.refresh()`. Buttons disable while pending.
- Server-side publish errors that can surface (Postgres gate, code 23514): "Can co du ban tieng Viet va tieng Anh truoc khi dang (hien co N ban).", "Moi ban dich can co tieu de va noi dung truoc khi dang.", "Ban Viet va ban Anh dang lech nhau o chu de, do kho hoac thong tin video. Luu lai bai roi dang lai.", "Bai hoc va video can chon do kho truoc khi dang.", "Video can co duong dan YouTube/TikTok va nguon (tu lam hay tuyen chon) truoc khi dang." Other DB errors show "Khong thuc hien duoc thao tac. Vui long thu lai."

#### New post (`(dashboard)/bai-viet/moi/page.tsx`, `NewPostForm.tsx`)
- H1 "Viet bai moi", sub "Chon loai bai va chu de, sau do soan noi dung." Form `max-w-2xl`.
- Fields: 
  - "Loai bai" segmented toggle buttons (`aria-pressed`): Blog (default; internal kind `forum`), Bai hoc (`lesson`), Video (`video`).
  - "Chu de" (only for lesson/video): 4 toggle chips tinted by TOPIC_TONE when selected: Dinh nghia, Nguyen ly, Ung dung, Lich su va Phat trien. Default first (`dinh-nghia`).
  - "Do kho" (lesson/video): Co ban / Trung binh / Nang cao (default basic).
  - "Tieu de tieng Viet" (required, placeholder "Vi du: Transistor hoat dong nhu the nao?").
  - "Duong dan" optional slug ("de trong se tu tao"), placeholder `transistor-hoat-dong-nhu-the-nao`.
  - Info box: system creates both VI and EN rows; fill VI first, then switch to EN tab; publish needs both to have title and content.
- Submit "Tao bai va bat dau viet" / "Dang tao..." then routes to `/admin/bai-viet/{viRowId}`. Errors in `role="alert"` red box: "Tieu de khong duoc de trong.", "Khong tao duoc duong dan tu tieu de.", "Duong dan nay da ton tai. Chon tieu de hoac duong dan khac." (unique (locale, slug)), "Bai hoc can chon chu de.", etc.
- Behavior: `createPost` inserts two rows with the same new `translation_id`: VI (title, slug=slugified) and EN (title "", slug `{slug}-en`). Topic/difficulty are null for Blog. A lesson requires a topic; video topic may be null (via the shared panel), but on create the UI always sends a topic for video.

#### Edit post (`(dashboard)/bai-viet/[id]/page.tsx`, `PostEditor.tsx`, `SharedFieldsPanel.tsx`)
Page layout, top to bottom:
1. H1 = post title (or "(chua co tieu de)"); sub line "Bai hoc|Blog|Video . {topic} . Da dang|Ban nhap".
2. Red banner if a locale row is missing in DB (`missingLocale`): explains you can edit the other side but must recreate the post.
3. `SharedFieldsPanel` (lesson and video only; blog has none).
4. `PostEditor` (locale tabs, actions, translate bar, metadata, cover, body editor).
- `maxDuration = 120` seconds on this route because the AI translation runs as a Server Action here.

`SharedFieldsPanel` (card, `rounded-2xl border p-5`, own Save button; independent of the article Save):
- Title: "Chu de & do kho" (lesson) or "Thong tin video" (video).
- Video-only fields: 
  - "Link video" (mono input; live-parsed as you type; helper line shows "YouTube . {id}" or "TikTok . {id}"; error text "Khong doc duoc link. Dan link YouTube hoac TikTok." and `aria-invalid`; empty hint "Chua co link - bai video can link moi dang duoc.")
  - "Nguon" toggle: Tu lam (`own`) / Tuyen chon (`curated`)
  - "Ten kenh" (max 120, placeholder "Vi du: Veritasium")
  - "Bai hoc lien quan" select (options: "Khong co", up to 500 VI lesson titles sorted by title; shows "(Bai hoc khong con ton tai)" if the stored id is stale).
- Shared for lesson and video: "Chu de" chips (video also has "Khong chon"), "Do kho" chips (Co ban/Trung binh/Nang cao).
- Save button: "Luu chu de & do kho" / "Luu thong tin video" / "Dang luu..."; disabled while pending, if lesson with no topic, or if video URL non-empty but unreadable. Result line `role="status"`: green "Da luu." or red error.
- Server rules (`buildSharedFieldsPatch`): one UPDATE across both locale rows (so they cannot diverge). Lesson requires topic. Published groups cannot clear difficulty ("Bai da dang can giu do kho."). Channel <= 120 chars. Related lesson must be a UUID. Video URL must parse. Blog: no shared fields.
- Important: the shared panel and the article editor save independently. Changing shared fields does not mark the article dirty.

`PostEditor` details:
- Locale tabs (`role=tablist`, pill container): "VI" and "EN". Each tab shows a green check when that locale has title + body, otherwise an amber dot; plus a small red dot (tooltip "Co thay doi chua luu") when dirty. Active tab = black fill, white text. One shared Tiptap instance; switching tabs swaps content via `setContent` with `addToHistory:false` and `emitUpdate:false` (so undo cannot leak content between locales).
- Top-right actions: 
  - "Luu" (black; disabled when nothing dirty or saving; label "Dang luu..."). Saves every dirty locale sequentially, VI then EN; re-entrancy guarded by a ref; edits made during the request remain dirty.
  - Draft state: "Dang bai" (green when enabled; grey disabled; tooltip explains: "Can tieu de va noi dung o ca hai ngon ngu." or "Can luu cac thay doi truoc khi dang bai."). Enabled only when both locales have title + at least one body block AND nothing is unsaved.
  - Published state: "Bo dang" outlined. No confirmation dialog for publish or unpublish in the editor.
- Message areas: generic `role=alert` box (red when save error, grey neutral for info such as translation result); amber `TriangleAlert` box for publish errors; grey helper "Chua dang duoc: ..." while a draft cannot be published (two variants: missing content in a language / unsaved changes); amber box if the active locale has no DB row.
- Save errors: "Tieu de khong duoc de trong.", "Noi dung bai viet khong hop le." (not a Tiptap doc), "Khong tao duoc duong dan tu tieu de.", "Duong dan nay da duoc dung cho mot bai khac cung ngon ngu." (23504/23505 duplicate slug), "Khong co gi de luu: ban {VI|EN} chua co ban ghi trong co so du lieu."
- On save the server also writes `plain_text` (<= 20000 chars; used by search) and revalidates affected public paths (home, blog, lessons, videos listings, topic pages, the post's detail page, for both locales).
- Unsaved-changes warning (`useUnsavedChangesWarning`, active while either locale is dirty): `beforeunload` (native browser prompt for close/reload) + capture-phase click interception of same-origin `<a href>` links (not #anchors, not modified clicks) that shows a blocking `window.confirm("Ban co thay doi chua luu. Roi trang va bo cac thay doi do?")`. Cancel blocks navigation. Uses native dialogs, which a redesign may replace but must preserve the behavior.
- Translation-ready gating: see "Publish gating" below. The UI computes readiness client-side (`bothComplete`) from in-memory drafts and also the list page uses `isTranslationGroupReady`; the real gate is the Postgres function `publish_translation`.
- AI translation bar (EN tab only): bordered bar with button "Dich nhap bang AI" (Languages icon; "Dang dich..." while running) and helper text. Disabled when: no `DEEPSEEK_API_KEY` on server (text: "Chua bat: may chu chua co DEEPSEEK_API_KEY."), translating, VI tab is dirty (text: "Luu ban tieng Viet truoc - ban dich lay tu ban da luu."), or EN row missing. Default helper: "Dich tu ban tieng Viet da luu bang DeepSeek. Cong thuc, anh va link giu nguyen; ket qua chua duoc luu cho toi khi ban bam 'Luu'." If EN already has any title/excerpt/body, a native `window.confirm("Ban tieng Anh dang co noi dung. Thay toan bo bang ban dich nhap?")` appears first. Result loads into EN draft as unsaved changes (title, excerpt, content); shows message "Da dich nhap. Doc lai, sua cho chua on roi bam 'Luu'." or, if some segments stayed Vietnamese because the model broke formatting, "Da dich nhap. X/Y doan van la tieng Viet vi ban dich lam hong dinh dang - hay dich tay cac doan do, doc lai roi bam 'Luu'." (see Features for engine details). Writes nothing to DB itself.
- Metadata for the active locale (grid `1fr | 280px` at lg):
  - "Tieu de ({VI|EN})" input (h-12, text-lg semibold; placeholder differs by locale)
  - "Duong dan" slug input, mono; empty means auto-generated from title (`slugify`: NFD accent strip, d/D fix, lowercase, non-alnum to `-`, max 80 chars; fallback `{locale}-{id6}`)
  - "Tom tat" textarea (3 rows, max 320, live counter "n/320"; shown in lists and search results)
  - "Anh bia" (right column): 16:9 dashed dropzone button (click to pick file, `accept=image/*`), shows ImagePlus icon and "Chon anh" / "Dang tai..."; once set shows the image and a small "Bo anh bia" underlined link. Cover is per locale (each locale row has its own cover).
- Body: card wrapper `overflow-clip rounded-2xl border bg-surface` (must be `clip`, not `hidden`, so the sticky toolbar works). `EditorToolbar` sticky at `top-[110px] z-20`, `bg-surface/95 backdrop-blur`. Content area `px-4 py-5 md:px-8 md:py-8`, editor class `chip-prose` (the same typography as the public article). Placeholder "Bat dau viet noi dung bai..." Formulas are typeset live in the editor with KaTeX (`katex.min.css` imported in PostEditor).

#### Editor toolbar (`EditorToolbar.tsx`), every control in order
All are 36px square icon buttons (`aria-label` and `title` = the label, `aria-pressed` when a mark/node is active; active = black fill/white icon; hover grey bg/accent icon; disabled 40% opacity). Groups separated by 1px vertical dividers; the toolbar wraps onto multiple lines (`flex-wrap`).
1. Headings: Tieu de lon (H1), Tieu de vua (H2), Tieu de nho (H3).
2. Marks: Dam (bold), Nghieng (italic), Gach chan (underline), Gach ngang (strike), Danh dau (highlight, single color).
3. Blocks: Danh sach (bullet), Danh sach so (ordered), Trich dan (blockquote), Khoi ma (code block).
4. Insert: Lien ket (link; `window.prompt("Dia chi lien ket:")`, empty string removes link; links render `rel="noopener noreferrer nofollow" target=_blank`, autolink on), Chen anh (upload then insert bare image; label "Dang tai anh..." while uploading), Chen bang (3x3 table with header row, not resizable), Duong ke ngang (horizontal rule).
5. Rich nodes: 
   - Cong thuc trong dong (Radical icon): `window.prompt("Cong thuc LaTeX (trong dong):")`, inserts inline KaTeX node.
   - Cong thuc khoi (Sigma icon): `window.prompt("Cong thuc LaTeX (khoi rieng):")`, inserts display-mode block formula. Clicking an existing formula re-opens the prompt with its LaTeX; submitting empty deletes it.
   - Hinh co chu thich (Image icon): upload then insert a `figure` node with `src`, `alt`, `caption`. In the editor the figure shows the image plus two inline inputs: "Chu thich (tu danh so Hinh 1, Hinh 2...)" and alt text "Mo ta anh cho nguoi dung trinh doc man hinh (alt)". Numbering is CSS counter on figcaption (`Hinh N.` in VI, `Figure N.` in EN), only captioned figures are numbered. Invalid src shows dashed box "Anh khong hop le - xoa hinh nay va chen lai."
   - Callout `<select>` (placeholder "Callout..."): Ghi chu (note), Meo (tip), Luu y (warning), Vi du (example), "Bo callout" (lifts content out). Wraps the current selection, or changes the variant if already inside a callout. Label text is drawn by CSS by page language (VI: Ghi chu/Meo/Luu y/Vi du; EN: Note/Tip/Warning/Example). Visual: grey box, 4px left border teal-grey; warning = 6px black border; example = dashed border.
   - Nguon tham khao (BookMarked): inserts the references block (an ordered list wrapper). Disabled with label "Bai da co khoi nguon tham khao" if one exists (max one per article). Heading "Nguon tham khao"/"References" drawn by CSS.
   - Nguoi gop y (Users): enabled only when a references block exists; `window.prompt("Duoc gop y boi (de trong de bo dong nay):")` sets the `reviewers` attribute, rendered as a line "Duoc gop y boi ..." / "Reviewed by ..." under the list.
   - Video (Clapperboard): `window.prompt("Dan link YouTube hoac TikTok:")`; parsed by `parseVideoUrl`; invalid -> inline red error under toolbar "Khong doc duoc link video. Dan link YouTube hoac TikTok."; valid -> inserts a `video` node storing only (platform, externalId). In the editor a `VideoNodeView` shows a 112x64 YouTube thumbnail from `i.ytimg.com` (none for TikTok) and text "Video YouTube|TikTok . {id}" or "Video khong hop le - xoa khoi nay va chen lai."
6. Alignment: Can trai, Can giua, Can phai (headings and paragraphs only).
7. History: Hoan tac (undo), Lam lai (redo) (disabled when unavailable).
- Toolbar inline error line (`role=alert`, red 12px) for image upload and video link errors.
- Image upload rules (`src/lib/supabase/upload.ts`, runs in browser with the staff session; storage RLS `is_staff()` authorizes): types JPG, PNG, WebP, AVIF, GIF; max 5MB; stored in public bucket `post-images` at `YYYY-MM/{uuid}.{ext}`, cache-control 1 year. Errors: "Chi nhan anh JPG, PNG, WebP, AVIF hoac GIF.", "Anh toi da 5MB.", "Khong tai duoc anh len: ...".
- Prompts (formula, link, video link, reviewers) are native `window.prompt` dialogs; confirms are native `window.confirm`. These are UX candidates for redesign (no custom modals exist).
- Tiptap schema is the single shared file `src/lib/tiptap/extensions.ts` (StarterKit v3 with H1-H3, link, underline, undo/redo; Placeholder; Image (block, no base64); TableKit; TextAlign; Highlight; Mathematics; custom Figure, Callout, References, VideoEmbed). Editor-only additions in `editor-extensions.ts` (React node views for figure and video; click-to-edit formulas).

#### Comments moderation (`(dashboard)/comments/page.tsx`, `CommentActions.tsx`)
- H1 "Binh luan", sub "{total} binh luan . {visible} dang hien thi . {hidden} dang an" (counts are over the latest 200 loaded, not the whole table).
- Empty state: dashed box "Chua co binh luan nao."
- List (latest 200, newest first) of cards. Hidden comments render with `bg-surface-muted` and `opacity-70`. Each card shows: author name (bold), badge "Tac gia" (uppercase pill, when the commenter was an active staff member), badge "Dang an" (when hidden), timestamp (`toLocaleString("vi-VN")`), author email in mono (visible ONLY here; read with the service-role client because the column is not granted to any PostgREST role), body (`whitespace-pre-wrap`), and "Trong bai: {post title} . VI|EN" (or "(khong ro)").
- Actions (right column): icon button toggle Hide/Show (EyeOff when visible -> hides; Eye when hidden -> shows; tooltip and aria "An binh luan" / "Hien binh luan"); trash icon "Xoa vinh vien" opens inline confirm: red "Xoa" + underlined "Huy". Deleting a parent cascades to replies (FK on delete cascade). Hidden comments disappear from the public site (and from counts and RLS for anon). Errors display below in red 11px. No filter by post/status, no pagination, no reply-as-staff from admin (staff reply happens on the public page while logged in; auto-badged "Tac gia").

#### Message inbox (`(dashboard)/tin-nhan/page.tsx`, `MessageActions.tsx`)
- H1 "Tin nhan", sub "Lien he, gop y va bao loi noi dung tu nguoi doc."
- Tabs (link-style pills, `aria-current`): "Chua xu ly" (default: `is_handled=false`) and "Tat ca" (`?filter=all`). Latest 200, newest first.
- States: red box "Khong doc duoc hop thu. Thu tai lai trang." on query error; empty text "Khong con tin nao cho xu ly." (unhandled tab) or "Chua co tin nhan nao." (all tab).
- Card: kind pill ("Lien he" = contact, "Gop y" = feedback, "Bao loi noi dung" = content_error), sender name, locale code (uppercase VI/EN), timestamp, email as mono `mailto:` link (percent-encoded via `mailtoHref` to prevent header injection), body (`whitespace-pre-wrap`), and for reports "Ve bai: {title}" linking to `/admin/bai-viet/{post_id}` (or "(bai da bi xoa)"). Handled cards are greyed (`bg-surface-muted opacity-70`).
- Actions: check icon "Danh dau da xu ly" / RotateCcw icon "Danh dau chua xu ly"; trash "Xoa vinh vien" with the same inline confirm pattern as comments. Handled state persists (`is_handled`); nothing is emailed or replied to from the UI.

#### Files (admin)
`src/app/admin/actions.ts` (all mutations), `src/app/admin/(auth)/dang-nhap/{page,LoginForm,actions}.tsx|ts`, `src/app/admin/(dashboard)/{layout,page,loading,error}.tsx`, `.../bai-viet/{page,moi/page,[id]/page}.tsx`, `.../comments/page.tsx`, `.../tin-nhan/page.tsx`, `src/components/admin/*` (AdminNav, PostEditor, EditorToolbar, NewPostForm, PostRowActions, SharedFieldsPanel, FigureNodeView, VideoNodeView, CommentActions, MessageActions, RebuildSearchButton, useUnsavedChangesWarning, editor-extensions, math-prompt, saveRevision (+test), actionResult), `src/lib/shared-fields.ts`, `src/lib/auth.ts`, `src/lib/supabase/upload.ts`, `src/lib/tiptap/**`, `src/lib/translate/**`.

#### Server Actions inventory (`src/app/admin/actions.ts`)
`savePost`, `createPost`, `publishTranslation` (RPC `publish_translation`), `unpublishTranslation` (RPC), `deleteTranslation` (both rows), `setCommentHidden`, `deleteComment`, `saveSharedFields`, `rebuildSearchText`, `setMessageHandled`, `deleteMessage`, `translateDraft`, `signOutAndRedirect`. All (except sign-out) check staff and return `{ok, error?, unauthorized?}`; actions never redirect (Server Actions return values). Raw DB errors are logged, and the user only sees "Khong thuc hien duoc thao tac. Vui long thu lai."; publish-gate (23514) and unique slug (23505) errors get their own friendly text.

---

### Data model (UI-relevant)

Source: `supabase/migrations/*` (8 files, 2026-09-12 to 2026-09-28). Enums: `post_kind` (lesson, forum, video), `post_locale` (vi, en), `post_status` (draft, published), `staff_role` (admin, editor), `post_difficulty` (basic, intermediate, advanced; sorts in that order), `video_platform` (youtube, tiktok), `video_source` (own, curated), `message_kind` (contact, feedback, content_error).

#### posts (lessons, blog = kind `forum`, videos)
| Column | Meaning / UI relevance |
|---|---|
| id (uuid) | Row id; admin edit URL uses the id of either locale row |
| translation_id (uuid) | Shared by the VI row and the EN row; publish/unpublish/delete act on the group |
| locale | vi or en; UNIQUE (locale, slug) |
| kind | lesson / forum (Blog) / video |
| topic | text: dinh-nghia, nguyen-ly, ung-dung, lich-su; only for lesson and video (nullable) |
| difficulty | basic/intermediate/advanced; not allowed on forum; required at publish for lesson and video |
| title, slug, excerpt | Per locale. Slug format `^[a-z0-9]+(-[a-z0-9]+)*$` (or empty). Excerpt UI max 320 |
| cover_image_url | Per locale, public storage URL |
| content (jsonb) | Tiptap doc `{type:"doc", content:[...]}` |
| plain_text | App-written on save (<= 20000 chars); feeds search |
| search_vector | Generated tsvector (title weight A, excerpt B, plain_text C, unaccented), GIN index |
| status, published_at | draft/published; constraint: published_at set iff published; `published_at` kept on re-publish (coalesce) and cleared on unpublish |
| video_platform, video_external_id | Only on kind=video; pair must be both-or-neither; YouTube id `^[A-Za-z0-9_-]{11}$`, TikTok `^[0-9]{8,25}$` (no URL is ever stored) |
| video_source | own / curated (video only; required at publish) |
| channel_name | Video only, <= 120 chars |
| related_lesson_translation_id | Video only; points to a lesson group (no FK; stale link disappears) |
| author_id | FK profiles (set null on delete) |
| created_at, updated_at | updated_at trigger (a later migration stops search_text-only changes from bumping it) |
Shared across both locale rows (must be equal to publish): kind, topic, difficulty, video_platform, video_external_id, video_source, channel_name, related_lesson_translation_id.
RLS: anyone (anon) reads `status='published'`; staff (`is_staff()`) select/insert/update/delete everything.

#### comments
| Column | Meaning |
|---|---|
| id, post_id (FK posts, cascade) | Comment is tied to one locale row of a post (not the group) |
| parent_id (self FK, cascade) | One reply level only (enforced in the API and the renderer) |
| author_name | 1-80 chars |
| author_email | Optional; never readable by anon/authenticated (column-level grant list omits it); only via service role in admin |
| body | 1-2000 chars |
| is_post_author | True when posted by an active staff user (shows "Tac gia" badge) |
| status | `comment_status` (`pending` / `approved` / `hidden`), default `pending`; anon reads only `status='approved'` (admin phase 2 replaced the old `is_hidden` flag) |
| created_at | |
RLS: no insert policy (only `/api/comments` with the service role writes); anon/auth select visible rows (column-limited); staff can select all, update, delete.

#### messages
| Column | Meaning |
|---|---|
| id | |
| kind | contact / feedback / content_error |
| name | 1-80 |
| email | Optional, <= 254 |
| body | 1-4000 |
| post_id | FK posts, on delete set null; set when reporting a mistake from inside an article |
| locale | vi/en (language the reader was using) |
| is_handled | Inbox triage flag |
| created_at | |
RLS: no insert policy (only `/api/messages` with the service role); staff select/update/delete. Index on (is_handled, created_at desc).

#### profiles (staff) and roles
| Column | Meaning |
|---|---|
| id | = auth.users id (cascade) |
| display_name | Shown in admin header/greeting and used as the public name on staff comments |
| role | `admin` or `editor` (stored; no code path found that treats them differently: unclear, both pass `is_staff()`) |
| is_active | Default false. Staff access requires true. New signups are inactive; activation is a manual SQL step (documented in README) |
| created_at | |
RLS: user reads own row; staff read all. `is_staff()` = profile exists AND is_active (SECURITY DEFINER).

#### comment_rate_limit (infrastructure)
Columns: id, scope (`comment`, `message`, `login`), ip_hash (salted SHA-256 of IP), created_at. No policies (service role only). RPC `consume_rate_limit(scope, key, limit, window_minutes)`: advisory lock, prunes rows older than 1 day, counts in window, inserts, returns false when over limit; execute revoked from anon/authenticated.

#### Storage
Public bucket `post-images`: anyone reads; only staff insert/update/delete.

#### Other DB functions
- `publish_translation(uuid)`: staff only; requires 2 rows (both locales), each with non-blank title and >= 1 body block, shared fields identical across rows, difficulty for lesson/video, platform + source for video; sets status and published_at. Errors carry SQLSTATE 23514 with stable `detail` codes (translation_incomplete, translation_empty, translation_mismatch, difficulty_required, video_incomplete) and Vietnamese messages shown verbatim in admin.
- `unpublish_translation(uuid)`: staff only; sets draft and clears published_at.
- `search_posts(p_query, p_locale, p_kinds, p_limit)`: SECURITY INVOKER; see Features.
- `f_unaccent(text)`: IMMUTABLE wrapper over `unaccent` (also maps d-bar to d).

---

### Features inventory

| Feature | Where it appears | How it works | Limits / rules | Files |
|---|---|---|---|---|
| Accent-insensitive search | Public `/vi/tim-kiem` and `/en/search` (page is `noindex, follow`), search box in header/overlay | Query -> `search_posts` RPC. Query is unaccented, lowercased, split on non-alphanumerics; each token prefix-matched (`token:*`) and AND-ed; 1-char tokens dropped unless the only token. Rank by `ts_rank` then `published_at` desc. Only the current locale, only published. Results grouped by kind (Bai hoc / Video / Blog) with count ("N ket qua", "N+ ket qua", "Dang hien N ket qua dau tien") | Query normalized and cut to 100 chars by code point (`parseSearchQuery`); blank never hits the DB; default limit 30, DB clamps 1-50; Vietnamese with or without diacritics both work (copy: "Go co dau hay khong dau deu duoc") | `src/lib/search-query.ts`, `src/lib/queries/posts.ts` (`searchPosts`), `supabase/migrations/20260928000200_search.sql`, `src/app/[locale]/tim-kiem/page.tsx`, `src/components/search/*` |
| Listing filters and sorting (videos) | `/video` (`/en/videos`) | URL params `topic`, `difficulty`, `platform` (youtube/tiktok), `source` (own/curated), `sort`, `page`; all whitelisted (unknown values dropped); defaults omitted from URLs. Sort labels: Moi nhat (newest), Cu nhat (oldest), De truoc (easiest), Kho truoc (hardest). Difficulty sort uses the enum order; null difficulty last; then newest; then id tie-break | Page size 12 (`LISTING_PAGE_SIZE`; lessons and videos); page 1..500 else 1; any filter change resets to page 1. Lessons always sort newest. Pagination bar shows all pages up to 7, otherwise first/last/neighbours with gaps. Blog list page size is 9 (`PAGE_SIZE`) | `src/lib/listing-params.ts`, `src/lib/listing-order.ts`, `src/components/listing/{FilterPills,Pagination}.tsx`, `src/lib/queries/posts.ts` |
| Lessons by topic + difficulty | `/bai-hoc`, `/bai-hoc/[topic]`, topic sidebar (collapsible) | 4 topics x 3 difficulties; `difficulty` filter param | Topic tone by grey shade, not hue. Copy "chia theo bon chu de va ba muc do kho" | `src/lib/constants.ts`, `src/components/lessons/*` |
| Video parsing | Admin (shared panel, editor toolbar), public video cards and article embeds | `parseVideoUrl`: accepts youtube.com / www / m., youtu.be, youtube-nocookie (`watch?v=`, `/shorts/`, `/embed/`, `/live/`) and tiktok.com / www / m. (`/@user/video/<id>`, `/embed/v2/<id>`). Hosts matched exactly (lookalikes refused); http/https only. Stores only (platform, id). Embed URL rebuilt: `https://www.youtube-nocookie.com/embed/{id}` or `https://www.tiktok.com/embed/v2/{id}` | YouTube id 11 chars `[A-Za-z0-9_-]`; TikTok id 8-25 digits. YouTube thumbnail `https://i.ytimg.com/vi/{id}/hqdefault.jpg`; TikTok has no thumbnail (neutral frame). TikTok embed is 9:16 max 340px wide; YouTube 16:9 | `src/lib/video.ts`, `src/lib/tiptap/video-embed.ts`, `src/components/forum/VideoFacades.tsx`, `src/components/video/*` |
| Click-to-load video facade | Article bodies and video detail page | Renderer emits a plain `<a class="video-facade">` link (works without JS) with thumbnail, play glyph, platform label; `VideoFacades` swaps it for the iframe only after click, so YouTube/TikTok set no cookies until play | No iframe in stored/sanitized HTML; aria label "Phat video tren {platform}" | `src/lib/tiptap/video-embed.ts`, `src/components/forum/VideoFacades.tsx` |
| Article rendering pipeline | Lesson/blog/video detail pages | Tiptap JSON -> `prepareArticle` (formulas replaced by indexes, invalid video nodes dropped) -> `generateHTML(articleExtensions)` -> `sanitizeArticleHtml` (tag/attr allow-list, custom walker, no DOM) -> heading ids -> `renderMath` (KaTeX) -> `renderVideos` (facades) | KaTeX: `trust:false`, `maxSize:20`, `maxExpand:200`, output htmlAndMathml, `throwOnError:false`; LaTeX > 2000 chars shows an escaped error `<code class="math-error">`; forbidden with body: script, style, iframe, object, embed, form. Adding a node requires updating `extensions.ts` AND `sanitize.ts` | `src/lib/tiptap/*`, `src/components/forum/ArticleBody.tsx`, `ArticleToc.tsx` |
| Comments (public) | Under blog/lesson/video articles (CommentSection) | Form: name (max 80), email (optional; "khong hien thi cong khai"), body (max 2000), hidden honeypot field `website`. POST `/api/comments`. Threads are one reply level deep. Staff logged in get their display name and the "Tac gia" badge automatically | Server rules in "API details" below. Public list shows 20 root comments then "Xem them binh luan" and "Dang hien X/Y binh luan goc"; hidden comments never shown | `src/app/api/comments/route.ts`, `src/components/forum/CommentSection.tsx`, `src/lib/queries/posts.ts` (`listComments`, `countComments`) |
| Contact / feedback / report-a-mistake | `/lien-he` (`/en/contact`): kind toggle Lien he / Gop y; "Bao loi bai nay" collapsible on articles | POST `/api/messages`; shared client module validates and maps error codes to i18n keys | See "API details" | `src/app/api/messages/route.ts`, `src/lib/contact-message.ts`, `src/lib/contact-client.ts`, `src/components/contact/*` |
| AI draft translation (DeepSeek) | Admin editor, EN tab | Server Action `translateDraft`: reads the SAVED VI row; `prepareTranslation` splits into segments (paragraphs, headings, plus figure `alt`/`caption` attributes) with inline marks/links/formulas encoded as placeholder tags (`<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<mark>`, `<a1>`, `<m1/>`, `<br/>`); batches of <= 8000 chars POSTed to `https://api.deepseek.com/chat/completions` (JSON mode, temperature 0.2, `max_tokens` = min(8192, 1024+chars)); glossary of 20 VI->EN terms in the prompt; `applyTranslations` rebuilds Tiptap JSON. Segments whose tags do not round-trip stay Vietnamese and are counted | Model `DEEPSEEK_MODEL` env or default `deepseek-v4-pro`; 60 s per request; 100 s total budget (page maxDuration 120); no new batch when < 20 s left; one retry on empty answer; partial results kept after the first successful batch. Errors (VI): invalid key (401), out of balance (402), overloaded (429), unreachable/timeout, unreadable answer. Only article text is sent; never emails, comments or reader data. Key is server-only; the button shows disabled state if key missing | `src/lib/translate/{deepseek,segments,glossary}.ts`, `src/app/admin/actions.ts` (`translateDraft`), `src/components/admin/PostEditor.tsx` |
| Publish gating | Admin list "Dang" button, editor "Dang bai" | Enforced by Postgres `publish_translation` (cannot be bypassed from UI); UI mirrors it to disable buttons | Both locale rows exist; each has title and >= 1 body block; shared fields identical; difficulty (lesson/video); video needs link + source; editor also requires nothing unsaved | `supabase/migrations/20260912000000_init.sql`, `20260928000100_video_difficulty.sql`, `src/lib/shared-fields.ts` |
| Rate limiting | Comments, messages, admin login | Postgres RPC `consume_rate_limit` (atomic, advisory lock); key = SHA-256(IP + salt); IP source: `x-vercel-forwarded-for` on Vercel, else Nth-from-right of `x-forwarded-for` (`TRUSTED_PROXY_HOPS`, default 1; 0 = single shared "direct" bucket), else `x-real-ip` if hops=1 | Comments 3 per 10 min; messages 3 per 60 min (shared across contact/feedback/report); admin login 10 per 15 min. Fail closed on limiter error (login) or 500 `insert_failed` (APIs) | `src/lib/rate-limit.ts`, routes, `(auth)/dang-nhap/actions.ts` |
| Request size limits | `/api/comments`, `/api/messages` | `isBodyTooLarge` (content-length pre-check) then `readJsonWithLimit` (stream-counted, cancels at limit) | 16 KiB (`MAX_REQUEST_BODY_BYTES`); 413 `payload_too_large` | `src/lib/request-size.ts` |
| Honeypot | Comment and contact/report forms | Hidden input `website` (off-screen `absolute -left-[9999px]`, `tabIndex=-1`, `aria-hidden`, autocomplete off); if non-empty the API replies `{ok:true}` without saving | Redesign must keep the field invisible to humans and assistive tech | `CommentSection.tsx`, `MessageForm.tsx`, routes |
| i18n and localized routes | Whole public site | next-intl 2 locales `vi` (default) and `en`, `localePrefix: "always"`; pathnames localized | See routes table below | `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/middleware.ts`, `src/components/layout/LangSwitch.tsx`, `langSwitchPath.ts` |
| SEO / hreflang | All public pages | Automatic `Link:` hreflang header is disabled (`alternateLinks:false`) because article slugs differ per locale; each page emits `alternates.languages` in `generateMetadata`. Static pages via `localeAlternates()` (canonical + vi + en + x-default). Articles via `articleLanguageAlternates` (only locales that have a URL; x-default = vi if present) | Never point hreflang at a listing page | `src/lib/seo.ts`, `src/lib/article-alternates.ts`, `src/lib/translate` n/a |
| Sitemap and robots | `/sitemap.xml`, `/robots.txt` | Static routes x 2 locales (home priority 1, weekly; others 0.8 monthly), 4 topic pages x 2 locales (0.7), plus all published posts (up to 1000, priority 0.6, `lastModified` = published_at). Search page excluded (noindex). robots: allow `/`, disallow `/admin`, `/api`, `/motion-gallery`, sitemap link | Site origin from `NEXT_PUBLIC_SITE_URL` (fallback `https://projectchipchip.org`) | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/sitemap-entries.ts`, `src/lib/site.ts` |
| Legacy redirects | next.config | 301: `/vi/dien-dan` -> `/vi/blog`, `/vi/dien-dan/:slug` -> `/vi/blog/:slug`, `/en/forum` -> `/en/blog`, `/en/forum/:slug` -> `/en/blog/:slug` | Uses `statusCode: 301` (not 308) | `src/lib/legacy-redirects.mjs`, `next.config.mjs` |
| Open Graph images | `/[locale]/opengraph-image` and per-page OG | Generated with satori; TTFs read from `src/assets/fonts` (declared in `outputFileTracingIncludes`) | | `src/lib/og/*`, `src/app/[locale]/opengraph-image.tsx` |
| Cache invalidation | On admin save/publish/unpublish/delete/shared-field change/comment hide/delete | `revalidatePath` for home, blog, lessons, videos listings (both locales), topic pages (old and new topic), detail pages; comment actions revalidate `/{locale}/blog` only | Detail pages of lessons/videos may not be revalidated on comment moderation (unclear) | `src/lib/revalidate-paths.ts`, `src/app/admin/actions.ts` |
| Slug generation | Admin new post / save | `slugify`: strip accents, d-bar -> d, lowercase, non-alnum -> `-`, trim, max 80; EN row initial slug `{slug}-en` | Unique per locale; duplicate -> friendly error | `src/lib/post-slug.ts` |
| Image handling | Cover, article images, figures | Uploaded to Supabase Storage from the browser; `next/image` for covers (formats AVIF/WebP, minimumCacheTTL 1 year, remote patterns only the project's Supabase public storage path and `i.ytimg.com/vi/**`); figures accept only https URLs or the project's Supabase public storage URL | Images not on those hosts will not render through `next/image` | `next.config.mjs`, `src/lib/tiptap/nodes/figure.ts` |

#### API details

POST `/api/comments` (`src/app/api/comments/route.ts`; `runtime nodejs`, `force-dynamic`)
- Body JSON: `postId` (UUID, required), `parentId` (UUID or null), `body`, `name`, `email`, `website` (honeypot).
- Order of checks and responses: content-length > 16 KiB -> 413 `payload_too_large`; service role missing -> 503 `server_not_configured`; unreadable/oversized body -> 413 / 400 `invalid_json`; honeypot filled -> 200 `{ok:true}` (silently dropped); `post_invalid` 400 (not a UUID); `parent_not_found` 400 (bad UUID); `body_length` 400 (1..2000 after trim); staff detection (session + active profile -> name replaced by profile display name, `is_post_author=true`, email discarded); `name_length` 400 (1..80); `email_invalid` 400 (only for non-staff, optional, simple `x@y.z` shape); rate limit 3 per 10 min per hashed IP -> 429 `rate_limited`; limiter failure -> 500 `insert_failed`; post must be published -> 404 `post_not_found`; parent must exist, belong to the same post and be a root -> 400 `parent_not_found`; insert failure -> 500 `insert_failed`. Success `{ok:true, id}`.
- Comments are live immediately (no pre-moderation queue); moderation is after the fact (hide/delete).
- Client error copy (vi `comments.errors`): nameRequired "Vui long nhap ten.", nameTooLong "Ten qua dai.", emailInvalid "Email khong hop le.", bodyRequired "Vui long nhap noi dung binh luan.", bodyTooLong "Binh luan toi da 2000 ky tu.", rateLimited "Ban gui binh luan qua nhanh. Vui long thu lai sau it phut.", generic "Khong gui duoc binh luan. Vui long thu lai." Mapping: rate_limited, name_length, body_length, email_invalid map to their specific keys; post_not_found, insert_failed, server_not_configured -> generic. Field-level errors are shown next to the field (`aria-invalid`, `aria-describedby`, focus moved to the field); non-field errors in a block above the button; success line `role=status` green "Da gui binh luan. Cam on ban!"

POST `/api/messages` (`src/app/api/messages/route.ts`)
- Body JSON: `kind` (contact|feedback|content_error), `name` (1..80), `email` (optional, <= 254, shape check), `body` (1..4000), `postId` (optional UUID), `locale` (vi|en), `website` (honeypot). Strict types (arrays/objects refused, NUL characters refused).
- Responses: 413 `payload_too_large`, 503 `server_not_configured`, 400 `invalid_json`, 400 `invalid_payload` / `kind_invalid` / `name_length` / `body_length` / `email_invalid` / `locale_invalid` / `post_invalid`, honeypot 200 `{ok:true}` silently, rate limit 3 per 60 min per hashed IP (shared across all kinds) -> 429 `rate_limited`, limiter error 500 `insert_failed`, referenced post not published -> 404 `post_not_found`, insert failure 500 `insert_failed`. Success `{ok:true}`.
- Client mapping (`contact-client.ts`): name_length -> nameLength; body_length -> bodyLength; email_invalid -> emailInvalid; post_invalid/post_not_found -> postNotFound; rate_limited -> rateLimited; payload_too_large and unknown -> generic; fetch failure -> network. Browser pre-checks the same limits so no request (and no quota) is spent on invalid input.
- Client error copy (vi `contact.errors`): nameLength "Vui long nhap ten (toi da 80 ky tu).", bodyLength "Vui long nhap noi dung (toi da 4000 ky tu).", emailInvalid "Email chua dung dinh dang. Ban co the de trong o nay.", postNotFound "Khong tim thay bai nay nua. Ban thu gui qua trang Lien he nhe.", rateLimited "Moi nguoi gui duoc toi da 3 tin moi gio, tinh chung ca lien he, gop y va bao loi bai. Ban thu lai sau nhe.", network "Khong ket noi duoc. Kiem tra mang roi gui lai nhe.", generic "Chua gui duoc tin nhan. Ban thu lai sau it phut nhe."
- Contact form copy: kind legend "Ban muon gui" (Lien he / Gop y), name "Ten cua ban", email "Email (khong bat buoc)" with hint "Chi dung de tra loi ban... De trong thi chung toi khong tra loi lai duoc.", body hint "Toi da {max} ky tu.", submit "Gui tin nhan"/"Dang gui...", success "Da gui. Cam on ban da viet cho Chip Chip!". Side notes: "Moi nguoi gui duoc toi da 3 tin moi gio" anti-spam note and privacy note. Report-a-mistake: toggle "Bao loi bai nay", intro, "Loi ban thay", "Gui bao loi", success "Da gui bao loi. Cam on ban da giup bai tot hon!". Response-time copy still has placeholders "[Thoi gian phan hoi]" / "[so]", and `CONTACT_EMAIL` is blank and `SOCIAL_LINKS` hrefs are blank (icons hidden until set).

#### Localized routes (`src/i18n/routing.ts`)
| Internal path | VI | EN |
|---|---|---|
| `/` | `/vi` | `/en` |
| `/bai-hoc` | `/vi/bai-hoc` | `/en/lessons` |
| `/bai-hoc/[topic]` | `/vi/bai-hoc/[topic]` | `/en/lessons/[topic]` |
| `/bai-hoc/[topic]/[slug]` | `/vi/bai-hoc/[topic]/[slug]` | `/en/lessons/[topic]/[slug]` |
| `/blog`, `/blog/[slug]` | same | same |
| `/gioi-thieu` | `/vi/gioi-thieu` | `/en/about` |
| `/video`, `/video/[slug]` | `/vi/video[/slug]` | `/en/videos[/slug]` |
| `/tim-kiem` | `/vi/tim-kiem` | `/en/search` |
| `/lien-he` | `/vi/lien-he` | `/en/contact` |
| `/dong-gop` | `/vi/dong-gop` | `/en/contribute` |
| `/chinh-sach-bao-mat` | `/vi/chinh-sach-bao-mat` | `/en/privacy` |
Dynamic segments (topic id, slug) are not localized; article slugs are per locale rows. `/admin`, `/api`, `/motion-gallery` live outside `[locale]` and outside next-intl. Post URLs: lesson `/bai-hoc/{topic}/{slug}` (needs a topic, else no page), blog `/blog/{slug}`, video `/video/{slug}` (built by `postHref()` in `src/lib/paths.ts`). Nav: Home, Lessons (submenu: Ly thuyet -> /bai-hoc, Video -> /video), Blog, About; footer: Contact, Contribute, Privacy. Language switch component: `LangSwitch` + `langSwitchPath` (uses the translation's real slug for the other locale on article pages).

#### Middleware (`src/middleware.ts`)
Single middleware with matcher `/((?!_next|_vercel|.*\..*).*)`. `/admin`, `/api`, `/motion-gallery` bypass next-intl (`NextResponse.next`); every other path goes through next-intl's middleware. Supabase session refresh (`auth.getUser()`) runs on all matched routes with shared cookies. Only `/admin` applies the staff redirect rules (see Admin section).

---

### User roles and permissions

| Actor | Can see | Can do | Enforcement |
|---|---|---|---|
| Public visitor (anon, no account) | All published lessons, blog posts and videos in the chosen locale (VI or EN); listings, topic pages, filters and sort, accent-insensitive search; approved comments with author name and "Tac gia" badge (never emails); contact page; privacy/contribute/about | Read, search, switch language; post a comment or reply (name required, email optional — it waits for moderation before appearing); send contact/feedback; report a mistake on an article; expand/click video facades (loads YouTube-nocookie/TikTok iframe on click) | RLS: posts `status='published'`; comments `status='approved'` and column-limited grants; comments/messages write only through service-role API with honeypot, validation and rate limits |
| Commenter (a public visitor who leaves a comment) | Same as visitor | No account or login exists for readers. A commenter is identified only by the name typed; no edit/delete of own comment; no notifications; email (optional) is visible only to staff | n/a (no reader accounts; UI for reader sign-in does not exist) |
| Self-registered account, not activated | Nothing beyond the public site; hitting `/admin` redirects to login with the "chua duoc cap quyen" amber message | Nothing privileged | `profiles.is_active=false` by default; `is_staff()` false; middleware + `requireStaff` + actions all check |
| Staff (`profiles.is_active=true`; roles `editor` or `admin`) | Everything in the admin: dashboard counts, all posts including drafts (both locales), all comments incl. pending/hidden and commenter emails, all messages incl. emails, each article's 20 most recent snapshots | Create/edit/save/publish/unpublish/delete posts (both locales together), edit shared fields, upload images (5MB), AI translation (if key set), approve/hide/delete comments, restore an article to an earlier snapshot, mark messages handled/unhandled, delete messages, rebuild search index, sign out. Comment on the public site while signed in: auto-attributed to the profile display name with "Tac gia" badge, email not stored | RLS `is_staff()`; server-side `lookUpStaff`/`requireStaff`; storage policies |
| `admin` vs `editor` role (**changed in admin phase 3**) | An editor sees everything except Nhân sự: the nav link is admin-only and the page explains itself | An admin additionally lists staff, activates/deactivates them, changes roles, and creates accounts (`/admin/nguoi-dung`); nobody may change their own row | `is_admin()` + the role check in each action, and `admin_set_staff` refuses a self-change |

No admin screens exist yet for: site settings or a media library (admin phase 4). Staff management and password
reset landed in phase 3 (`/admin/nguoi-dung`, `/admin/quen-mat-khau`, `/admin/dat-lai-mat-khau`,
`/admin/doi-mat-khau`), and the comment approval queue with per-article revision history in phase 2 — see
`docs/BAN-GIAO.md`, mục 2.

---

### Constraints a redesign must respect

Content and data
1. Both VI and EN are required to publish. A post is two rows with a shared `translation_id`; `publish_translation()` (Postgres) enforces both locales, non-empty title, at least one body block per locale, identical shared fields, difficulty for lesson/video, and link + source for video. Do not bypass it; redesign should keep the "ready" indicators (per-locale check/dot, unsaved dot, list-level readiness) and the disabled-with-reason Publish state.
2. Publish also requires no unsaved changes in the editor. The unsaved-changes warning (beforeunload + in-app link interception) must be preserved in some form; save and shared-fields save are separate actions.
3. Delete removes both language rows and is irreversible; keep an explicit two-step confirmation. Comment and message delete are also permanent (two-step inline confirmation).
4. `posts` holds three kinds with different field sets: lesson (topic + difficulty), video (topic optional + difficulty + link + source + channel + related lesson), blog/forum (none of those). Internal kind `forum` is displayed as "Blog". Keep 4 fixed topics (`dinh-nghia`, `nguyen-ly`, `ung-dung`, `lich-su`) and 3 difficulty levels (basic/intermediate/advanced); topic tones are grey shades, not hues.
5. Video is stored as (platform, id) only; only YouTube and TikTok are accepted.
6. Comment threads are max one level deep; comment and message emails are staff-only.

Article pipeline and editor
7. Article HTML pipeline: Tiptap JSON -> `generateHTML` -> `sanitizeArticleHtml` -> KaTeX and video facades. `src/lib/tiptap/extensions.ts` is the single schema for editor and renderer; any new node must also be allowed in `src/lib/tiptap/sanitize.ts` (tags and attributes allow-list) and be rendered/handled in `render.ts` when needed. Editor-only visuals go in node views (`editor-extensions.ts`) without changing node names/attrs.
8. Formula, figure, callout, references, video nodes must be kept; auto figure numbering and callout/reference labels are CSS-driven from `:lang()` and `.chip-prose` in `globals.css` (VI/EN text lives in CSS, not in article JSON).
9. The editor toolbar is sticky at `top-[110px]` to sit below the sticky admin header; changing the header height means updating that offset. The editor wrapper must use `overflow: clip` (not hidden) or stickiness breaks.
10. Translation flow: AI button is EN-tab only, requires saved VI, asks for confirm before overwriting existing EN, never saves automatically, and reports untranslated segment counts.
11. `useSearchParams` needs a Suspense boundary; a closed `<details>` hides its content (CSS cannot force it open); 404s on detail routes return the right status but Next 14 serves a generic shell (project gotchas).

Internationalization and routing
12. Every user-facing string on the public site goes through `messages/{vi,en}.json` and both files must keep an identical key set (currently 330 leaf keys; verified equal). Public namespaces: meta, nav, footer, home, topics, countries, lessons, difficulty, pagination, videos, search, forum, about, contact, contribute, privacy, comments, common. Admin strings are the exception: they are hard-coded Vietnamese (no `admin` namespace, no English admin), and the admin error boundary is deliberately plain Vietnamese; if a redesign wants a bilingual admin it is a new requirement and must not break the error boundary's independence from next-intl.
13. Routes are localized (see table); use `postHref()` and next-intl `Link`/`getPathname`; do not hard-code `/vi/...` for post links. `localePrefix: always`. Do not re-enable next-intl `alternateLinks`; each page must declare hreflang via `generateMetadata`. Preserve the four 301 legacy redirects (`dien-dan` / `forum` -> `blog`).
14. `/admin`, `/api`, `/motion-gallery` are outside the locale segment; middleware must keep next-intl away from them.

Security and platform
15. Server Actions return values and do not redirect; the client handles `unauthorized` by routing to the login. Keep server-only secrets (service role key, DeepSeek key, IP salt) out of client bundles: `lib/supabase/admin.ts` and `lib/auth.ts` and `rate-limit.ts` are `server-only`.
16. CSP (`next.config.mjs`) must keep working: `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev only); `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob: <supabase origin> https://i.ytimg.com`; `media-src 'self' blob: <supabase origin>`; `font-src 'self' data:` (so fonts must be self-hosted; next/font Google fonts are fine because Next self-hosts them at build); `connect-src 'self' <supabase origin + ws>` (+ localhost/ws in dev); `frame-src 'self' https://www.youtube-nocookie.com https://www.tiktok.com` only; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`; `object-src 'none'`. Consequences: no third-party scripts, fonts, analytics, iframes, image hosts or embeds beyond these; video iframes may only be created after a click; new remote images need `images.remotePatterns` and CSP `img-src` updates (currently Supabase public storage and `i.ytimg.com/vi/**`).
17. Other headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling camera/mic/geolocation/interest-cohort, HSTS in production; `poweredByHeader` off.
18. Honeypot field `website` must remain hidden but present in comment and contact/report forms; forms must handle 429 `rate_limited` with the specific copy and show field-level errors accessibly; request body cap 16 KiB.
19. Rate limits (comments 3/10min, messages 3/60min shared across kinds, admin login 10/15min) are user-visible in copy ("3 tin moi gio"); if limits change, update both `contact.*` copy in both locales and the code.
20. Motion: use tokens from `components/motion/tokens.ts`; must respect `prefers-reduced-motion` (a global CSS block already collapses animation/transition durations; framer-motion code must also honor it). Admin currently uses no motion beyond color transitions and skeleton pulse.
21. Accessibility patterns already in use that a redesign should keep: `aria-pressed` on toggle chips, `role=tablist`/`aria-selected` on locale tabs, `aria-current="page"` in nav, `role=alert`/`status` on messages, `aria-invalid` + `aria-describedby` on invalid fields, icon buttons with `aria-label` and `title`, `:focus-visible` outline `2px solid #314344`, `aria-hidden` honeypot, skip link `nav.skipToContent`, text contrast at least 4.5:1 (topic tones and prose are documented as checked).
22. Verify layout in a real browser (`checkVisibility()`/screenshots), not bounding boxes; do not run `next build` while `npm run dev` is running (shared `.next`).
23. Never edit an applied migration; schema changes are new files in `supabase/migrations/`. Before "done": `npm run typecheck`, `npm run lint`, `npm test`; DB-security changes run `./scripts/verify-security.sh`.

Open or unclear items noticed
- `admin` vs `editor` role is stored but not used to gate anything found in code (unclear whether planned).
- Admin dashboard `loading.tsx` shows 5 stat skeletons while the page renders 6 cards.
- `CONTACT_EMAIL` and `SOCIAL_LINKS` hrefs are blank; contact page response-time copy still contains bracket placeholders.
- Admin posts list has no pagination/filter/search and no limit on rows; comments and messages lists cap at 200 with no pagination.
- Comment moderation only revalidates `/{locale}/blog`, so lesson/video detail pages may keep showing a hidden comment until they revalidate (unclear how those pages are cached).

---

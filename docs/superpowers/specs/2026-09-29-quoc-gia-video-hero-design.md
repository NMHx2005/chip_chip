# Đợt "Second fix": Hero, dải quốc gia, sơ đồ hệ sinh thái, video thật

Ngày: 29/09/2026 · Nguồn: mục "Second fix" trong `PROJECT CHÍP CHÍP KẾ HOẠCH HOẠT ĐỘNG.docx` và thư mục Drive (logo công ty, cờ/bản đồ, ảnh).

## 1. Mục tiêu

Thay các phần giữ chỗ trên trang chủ bằng nội dung thật do chủ dự án cung cấp và làm dải quốc gia đúng như docx mô tả. Không đổi kiến trúc, không đổi schema DB.

## 2. Quyết định đã chốt với chủ dự án

| Chủ đề | Quyết định |
|---|---|
| Clip hero, 4 clip ASML, clip TSMC (blog) | Tải và cắt file, nén 720p không tiếng, host trong `public/video/` |
| Video 5 nước | Nhúng YouTube có mốc `start`/`end`, không tải file |
| Bấm vào công ty | Mở website chính thức ở tab mới (`rel="noopener noreferrer"`), không có trang nội bộ |
| Sơ đồ Ecosystem | Vẽ lại bằng code (SVG/HTML), song ngữ, dùng logo trong Drive. Không dùng ảnh gốc của bên thứ ba |
| Quốc gia | 5 nước: Mỹ, Đài Loan, Trung Quốc, Hàn Quốc, Hà Lan |
| Công ty | Chỉ công ty nêu trong docx, thêm SMIC cho Trung Quốc. Logo còn lại (Apple, TI, GlobalFoundries, UMC) dành cho sơ đồ Ecosystem |

## 3. Phạm vi thay đổi

### 3.1 Hero
- Ảnh nền làm mờ đặt phía sau (`HERO_BACKDROP` trong `src/lib/constants.ts`); tên/tiêu đề giãn khoảng cách theo docx.
- `HOME_VIDEO` trỏ tới `/video/hero-intro.mp4` (0:00–0:29.2 của "The Closest Thing We Have to Alien Technology", kết thúc ở "…so the faster they can compute"). Điền `HOME_VIDEO_CREDIT` bằng nguồn video.
- `TOPIC_VIDEOS` (4 chủ đề) trỏ tới `asml-part1..4.mp4`, mỗi clip 30s từ video ASML "Computational lithography".

### 3.2 Sơ đồ Ecosystem
Component mới `EcosystemDiagram`, đặt phía trên dải quốc gia (phần "trước chỗ Mỹ" trong docx). Nhóm: Equipment, Foundries, Fabless, IDM (giao của hai vòng), OSAT. Logo lấy từ `public/logos/`; công ty không có logo hiện tên dạng chữ. Chuỗi song ngữ nằm trong `messages/{vi,en}.json`. Có `aria-label`/mô tả văn bản thay thế cho người dùng trình đọc màn hình.

### 3.3 Dải quốc gia (`CountryBands`)
- Mỗi dải thu còn khoảng một nửa chiều cao hiện tại, nội dung căn trái.
- Cờ và bản đồ (`public/countries/`) chồng lên nhau: cờ ở một bên, bị bản đồ đè một phần.
- Tên/logo công ty ẩn cho tới khi di chuột (và khi focus bàn phím, và luôn hiện trên thiết bị cảm ứng để không mất nội dung). Bấm logo mở website công ty.
- Bên phải mỗi dải: video YouTube của nước đó, facade bấm-để-phát (dùng lại cơ chế nhúng video của DA2), có mốc start/end.
- Thêm dải Trung Quốc; SMIC là công ty. Thêm khoá `countries.china` và `home.countries.*` vào cả hai file messages.
- Dữ liệu (nước, công ty, `logo`, `href`, `video`) nằm trong `COUNTRY_BANDS` ở `src/lib/constants.ts`, giữ quy tắc tông xám trung tính đã có.

### 3.4 Ảnh và video còn lại
- Blog: clip TSMC ở đầu trang. Có hai bản (`tsmc-open` 0:00–0:18, `tsmc-strait` 0:15–0:45); chủ dự án chọn một.
- Banner ảnh cho About và Video qua `PageHero` (Siltronic, Halbleiterfertigung, ảnh wafer).
- Xoá hoặc thay các video giữ chỗ mượn từ Strike Robot (`clip-1..6`, `intro-placeholder`) khi đã có clip thật thay thế; không xoá trước khi thay.

## 4. Ngoài phạm vi
Trang riêng từng công ty/quốc gia, bản đồ tương tác, nội dung bài học thật, TikTok/Facebook thật, và Carousel 6 video (`CAROUSEL_VIDEOS` vẫn là giữ chỗ cho tới khi có nguồn).

## 5. Ràng buộc kỹ thuật
- Mọi chuỗi mới qua `messages/{vi,en}.json`, hai file cùng bộ khoá.
- Chuyển động theo `components/motion/tokens.ts` và tôn trọng `prefers-reduced-motion`.
- Hover không được là cách duy nhất để xem nội dung (a11y, mobile).
- Kiểm tra CSP cho phép iframe YouTube (`frame-src`); dùng `youtube-nocookie.com` nếu phù hợp.
- Không tải asset gốc lớn vào git: chỉ commit clip đã nén (~22 MB tổng), ảnh đã tối ưu; ghi nguồn cho từng clip.
- Không dùng `dangerouslySetInnerHTML` cho URL công ty; URL lấy từ hằng số, không từ input người dùng.

## 6. Kiểm chứng
Typecheck, lint, `npm test`, `npm run build`; test cho dữ liệu `COUNTRY_BANDS` (URL hợp lệ, mỗi nước có video/công ty), tham số embed YouTube (start/end), và đồng bộ khoá i18n. Kiểm tra bằng trình duyệt ở 375px và 1280px: hover, focus, reduced-motion, `checkVisibility()`.

## 7. Việc còn mở
1. Ảnh nền hero cụ thể (ảnh trong docx) và vị trí ảnh cho banner About/Video.
2. Mốc thời gian 5 video theo nước: mình chọn đoạn không có người nói rồi gửi chủ dự án duyệt.
3. Logo Micron và ASML có trong Drive hay chưa (nếu thiếu, hiện chữ như cơ chế `logo: null` hiện có).
4. Xin phép kênh gốc hoặc ghi nguồn rõ cho các clip tự host.

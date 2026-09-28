# DA4 — Uy tín và Blog

Ngày: 28/09/2026 · Trạng thái: đã duyệt thiết kế · Lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md` · Nền: DA1 (`/api/messages`, bảng `messages`), DA2, DA3

## 1. Mục tiêu

Người đọc, phụ huynh và giáo viên tin một dự án do một người làm nhờ ba điều: biết người làm là ai và vì sao làm, thấy mục đích minh bạch, và có đường liên hệ hoặc góp ý rõ ràng. Blog có thêm chuyển động khi mở bài.

Nội dung thật (tên, ảnh, câu chuyện, FAQ, email) **chưa có**. Mọi chỗ cần nội dung dùng câu chữ mẫu hợp lý, gom về một nơi dễ thay, và được ghi lại để làm ở DA5.

**Xong khi:**
- `/gioi-thieu` và `/about` có các khối Về tác giả, Mục đích minh bạch, FAQ, "Những người đã đồng hành" (ẩn khi rỗng) và lời mời đóng góp. Khối 8 ban cũ (`TEAM_UNITS`, `TeamStructure`) bị gỡ cùng các khoá message không còn dùng.
- `/vi/lien-he` và `/en/contact` có form gửi tới `/api/messages`.
- `/vi/dong-gop` và `/en/contribute` có trang mời đóng góp.
- `/vi/chinh-sach-bao-mat` và `/en/privacy` có trang chính sách bảo mật.
- Mỗi bài học, bài blog và trang video có nút "Báo lỗi bài này".
- Thẻ blog nở ra khi bấm.
- Footer có link tới ba trang mới.
- `tsc`, `lint`, `vitest` và `build` sạch; nghiệm thu bằng trình duyệt ở cả hai ngôn ngữ và trên mobile.

## 2. Routing

| Key | vi | en |
|---|---|---|
| `/lien-he` | `/lien-he` | `/contact` |
| `/dong-gop` | `/dong-gop` | `/contribute` |
| `/chinh-sach-bao-mat` | `/chinh-sach-bao-mat` | `/privacy` |

Thêm vào `routing.pathnames`, sitemap (trang tĩnh) và `STATIC_ROUTES` nếu có. Ba route mới không có tham số, nên `langSwitchPath` không cần fallback.

## 3. Nội dung chờ thay

- Toàn bộ câu chữ nằm trong `messages/{vi,en}.json` (namespace `about`, `contact`, `contribute`, `privacy`), hai file có cùng tập khoá. Chỗ nào là nội dung mẫu cần thay thì câu chữ tự nói rõ, ví dụ "[Tên tác giả]", để không ai nhầm là nội dung thật.
- `src/lib/constants.ts`:
  - `AUTHOR = { photo: string | null }`: ảnh `null` thì hiện khung chữ cái đầu trung tính.
  - `CONTRIBUTORS: { name: string; role: string }[] = []`.
  - `CONTACT_EMAIL` đã có sẵn: rỗng thì ẩn dòng email.
- FAQ: 5–6 câu mẫu hợp lý về dự án (miễn phí không, ai viết, sai thì báo ở đâu, dùng bài cho lớp học được không, có quảng cáo không), đánh dấu là câu mẫu trong README.
- README có mục "Nội dung cần thay trước khi ra mắt" liệt kê từng khoá và hằng số. DA5 sẽ dùng danh sách này.

## 4. Giao diện

### 4.1 Giới thiệu

Theo thứ tự:
1. Hero có sẵn.
2. **Về tác giả:** ảnh hoặc chữ cái đầu, tên, 2–3 đoạn câu chuyện, lý do làm dự án.
3. **Mục đích minh bạch:** 4 cam kết dạng lưới: miễn phí, không quảng cáo, không thu tiền, không bán dữ liệu. Có link tới chính sách bảo mật.
4. **FAQ:** accordion bằng `<details>` và `<summary>` gốc của trình duyệt (không cần JS, mặc định đóng). Dùng hai bản markup cho desktop/mobile nếu cần, theo bài học ở DA3: không ép hiện `<details>` đang đóng bằng CSS.
5. **Những người đã đồng hành:** ẩn khi `CONTRIBUTORS` rỗng.
6. **Khối cuối:** mời đóng góp, dẫn tới `/dong-gop` và `/lien-he`. Thay thế khối "Tham gia cùng chúng tôi" và Google Form cũ. `JOIN_FORM_URL` và `JoinFormEmbed` bị gỡ nếu không còn nơi nào dùng.

### 4.2 Liên hệ

- Form là client component, gồm: loại tin (Liên hệ / Góp ý), tên, email (tuỳ chọn), nội dung và trường ẩn `website`. Giới hạn đầu vào khớp `parseMessagePayload` (tên 1–80, nội dung 1–4000, email ≤ 254).
- Gửi `POST /api/messages` kèm `locale`. Đọc mã lỗi của route và hiện thông báo tương ứng: `rate_limited` (quá 3 tin mỗi giờ), lỗi kiểm tra dữ liệu, lỗi mạng. Gửi xong thì hiện lời cảm ơn và xoá form.
- Nút gửi bị khoá khi đang gửi. Nhãn gắn với ô nhập, lỗi đọc được qua `aria-live`.
- Bên cạnh form: email liên hệ (nếu có), link mạng xã hội (`SOCIAL_LINKS`, ẩn cái rỗng), và ghi chú về thời gian phản hồi.

### 4.3 Đóng góp

Bốn cách đóng góp: viết bài, dịch, làm video, báo lỗi. Mỗi cách có mô tả ngắn và lời kêu gọi dẫn tới `/lien-he`. Nội dung tĩnh, không có form riêng.

### 4.4 Chính sách bảo mật

Trang tĩnh, viết ngắn gọn cho học sinh, gồm các mục:
- Dữ liệu thu: tên và email khi bình luận hoặc gửi tin; IP được băm một chiều để chống spam; không cookie quảng cáo.
- Mục đích sử dụng.
- Thời gian lưu: bộ đếm chống spam xoá sau 1 ngày; bình luận và tin nhắn giữ tới khi được yêu cầu xoá.
- Chia sẻ: không bán dữ liệu. Nội dung bài viết được gửi tới DeepSeek khi tác giả dịch nháp; dữ liệu người đọc thì không.
- Quyền của người đọc: yêu cầu xoá qua trang Liên hệ.
- Ngày cập nhật.

Câu chữ phải khớp với cách code thực sự hoạt động. Nếu có chỗ không chắc, kiểm tra lại code và migration.

### 4.5 Báo lỗi bài này

Nút nhỏ nằm cuối nội dung ở trang bài học, bài blog và video. Bấm vào mở một form gọn tại chỗ (dùng `<details>`, hoặc client component) gồm tên, email tuỳ chọn và mô tả lỗi, gửi `kind: "content_error"` kèm `postId`. Dùng chung logic gửi và hiển thị trạng thái với form Liên hệ, không viết hai lần.

### 4.6 Thẻ blog nở ra

- Trên `/blog` và khối bài mới ở trang chủ: bấm vào thẻ thì thẻ phóng to tại chỗ bằng hiệu ứng `layout` của Motion trong khoảng 0.35–0.45s (easing chuẩn), rồi chuyển trang.
- Link vẫn là `<a>` thật, nên Ctrl/Cmd+click, chuột giữa và mở tab mới vẫn hoạt động bình thường. Chỉ click chuột trái không kèm phím mới chạy hiệu ứng.
- Khi bật `prefers-reduced-motion`: chuyển trang ngay, không có hiệu ứng.
- Không chặn điều hướng quá 450 ms.

### 4.7 Footer

Thêm một hàng link: Liên hệ, Đóng góp, Chính sách bảo mật. Footer vẫn giữ bố cục một hàng của DA2b trên desktop và được phép xuống dòng trên mobile.

## 5. Chất lượng

Giữ các nguyên tắc của các DA trước:
- Chuỗi đi qua message, hai file cùng tập khoá.
- Màu xám trung tính, chữ đạt AA, vùng bấm tối thiểu 44 px.
- Chuyển động dùng token có sẵn và tắt khi giảm chuyển động.
- Server Component là mặc định. JS phía client chỉ cho form Liên hệ, form báo lỗi và thẻ blog nở ra.

Mỗi trang mới có metadata với canonical và alternates, và được thêm vào sitemap. Không đổi schema DB.

## 6. Kiểm thử

- **Vitest (thuần):** hàm dựng payload và đọc mã lỗi của form (`contact-client.ts` hoặc tương tự) cho các trường hợp thành công, `rate_limited`, lỗi kiểm tra, lỗi mạng, và trường hợp bot điền trường ẩn; sitemap có ba trang mới; `postHref` và routing cho ba route mới; tính đúng của thông tin ở trang Chính sách bảo mật (không test được, chuyển sang review).
- **Nghiệm thu bằng trình duyệt trên stack local:**
  - Gửi form Liên hệ: tin hiện trong `/admin/tin-nhan`; tin thứ 4 báo quá giới hạn.
  - "Báo lỗi bài này" trên một bài: tin mang đúng loại và tên bài.
  - FAQ đóng/mở được trên desktop và mobile.
  - Thẻ blog nở ra rồi chuyển trang; Ctrl+click mở tab mới.
  - Footer có link.
  - Cả hai ngôn ngữ, không có lỗi console.

## 7. Rủi ro

- Rate limit dùng chung 3 tin mỗi giờ cho cả Liên hệ và Báo lỗi (cùng scope `message`). Chấp nhận ở quy mô hiện tại; ghi rõ trong thông báo lỗi.
- Hiệu ứng thẻ nở ra cộng với lenis có thể giật. Nếu nghiệm thu thấy giật thì giảm xuống chỉ dùng hiệu ứng scale hoặc opacity.

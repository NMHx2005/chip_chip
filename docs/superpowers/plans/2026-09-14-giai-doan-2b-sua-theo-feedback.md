# Giai đoạn 2b — Sửa trang chủ theo phản hồi trực tiếp

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Sửa tám điểm chủ dự án nêu sau khi xem trang chủ chạy thật.

**Architecture:** Không đổi kiến trúc. Dùng lại `src/components/motion/`, chỉ sửa các section và token màu.

**Spec:** `docs/superpowers/specs/2026-09-13-redesign-chuyen-dong-design.md`

## Global Constraints

- **Không được có màu tím ở bất kỳ đâu.** Đây là yêu cầu trực tiếp, tuyệt đối.
- Chuẩn nghiệm thu vẫn là **giống bản mẫu Strike Robot** — khi phân vân, mở mã Strike ra đối chiếu.
- Mọi easing/thời lượng lấy từ `@/components/motion`, không tự khai hằng số.
- Mọi chuỗi hiển thị qua next-intl; `vi.json` và `en.json` phải bằng số khoá.
- Mọi chuyển động tôn trọng `useReducedMotion()`, có đường thoát tĩnh, nội dung vẫn đọc được.
- Hover phải có đường thay thế bằng chạm.
- Không tràn ngang ở 390 / 768 / 1440.
- Comment code bằng **tiếng Anh**, giải thích *vì sao*.
- Không sửa migration, không đổi RLS, không đụng `/api/comments`.
- Sau mỗi task: `tsc`, `lint`, `build` sạch.

## Nguồn đối chiếu Strike

| Việc | Tệp Strike | Điểm mấu chốt |
|---|---|---|
| Cột video bên phải | `sections/Features.tsx:531-540` | `hidden h-[480px] w-[800px] shrink-0 overflow-hidden rounded-2xl border lg:block`, video đổi theo `activeId` |
| Khối CTA | `sections/CTA.tsx:20-60` | `bg-black` + `<Image fill>` phủ kín + `CircularText` mép phải + nội dung căn giữa + `motion.nav` liên kết bên trong, `minHeight: 423` |
| Footer | `sections/Footer.tsx:28-72` | Một hàng ngang: logo trái · bản quyền giữa · icon mạng xã hội phải. Không cột "Khám phá/Kết nối". |

---

### Task 1: Xoá sạch màu tím

**Files:**
- Modify: `public/motion-gallery-backdrop.svg`
- Modify: `src/lib/constants.ts` (`TOPIC_TONE`, `COUNTRY_BANDS[].tone`)
- Modify: `src/components/sections/CountryBands.tsx` nếu cần

Ảnh nền hero vừa hiện ra sau khi sửa z-index, và nó đang là gradient tím. Bốn dải quốc gia dùng pastel hồng/vàng/xanh lá/xanh dương — chủ dự án nói nhìn "AI quá, không chuyên nghiệp".

- [ ] **Step 1: Đổi ảnh nền hero sang trung tính**

Thay ba stop màu trong `public/motion-gallery-backdrop.svg` bằng dải xám rất nhạt, gần như đơn sắc. Đổi tên tệp thành `public/hero-backdrop.svg` và cập nhật `HERO_BACKDROP` trong `constants.ts` cùng `src/app/motion-gallery/page.tsx` — tên cũ gắn với trang trưng bày, không còn đúng nữa.

- [ ] **Step 2: Bỏ pastel ở bốn chủ đề và bốn quốc gia**

`TOPIC_TONE` và `COUNTRY_BANDS[].tone` hiện dùng màu pastel bão hoà. Thay bằng thang xám trung tính, phân biệt nhau bằng **độ đậm** chứ không bằng sắc màu. Giữ nguyên cấu trúc dữ liệu để không phải sửa component.

Sau khi đổi, kiểm tương phản chữ trên nền mới đạt tối thiểu 4.5:1 — ghi số đo vào báo cáo.

- [ ] **Step 3: Quét xác nhận không còn tím**

```bash
grep -rniE "#9b66f5|#7b2fbe|#2b2fa8|#551c85|#6a25a6|#b995ff|#d6c2ff|purple|violet" src/ public/ tailwind.config.ts | grep -v node_modules
```
Kỳ vọng: không kết quả nào.

- [ ] **Step 4:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 2: Hero chiếm trọn màn hình, video xuống dưới nếp gấp

**Files:**
- Modify: `src/components/sections/Hero.tsx`

Chủ dự án: *"cái phần hero section này cũng phải ở giữa … khi scroll lên thì cái video mới xuất hiện nhé"*. Hiểu là: khối tiêu đề chiếm trọn một màn hình và căn giữa theo chiều dọc; video nằm hoàn toàn dưới nếp gấp.

- [ ] **Step 1: Cho khối tiêu đề cao trọn khung nhìn**

Khối chứa huy hiệu / tiêu đề / mô tả / nút phải cao tối thiểu bằng khung nhìn **trừ đi chiều cao navbar**, và căn giữa theo chiều dọc. Navbar là `fixed`, cao khoảng 68–76px — đọc `src/components/layout/Navbar.tsx` lấy số thật thay vì đoán.

Ràng buộc: ở màn hình thấp (ví dụ 390×667) nội dung **không được tràn** ra ngoài khung nhìn hay bị cắt. Dùng chiều cao tối thiểu chứ không phải chiều cao cố định.

- [ ] **Step 2: Đẩy video xuống dưới nếp gấp**

Sau khi Step 1 xong, video phải nằm ngoài khung nhìn lúc mới tải. Giữ nguyên `ScrollReveal3D` và mốc cuộn dùng chung — **không đổi** thông số nghiêng 55°→0°, scale 0.72→1, hay offset.

- [ ] **Step 3: Tự kiểm bằng phép tính**

Ở 1440×900, 768×1024, 390×844: tính đỉnh của khối video so với đáy khung nhìn. Phải dương ở cả ba. Ghi phép tính vào báo cáo.

- [ ] **Step 4:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 3: Cột video bên phải cho khối bốn chủ đề

**Files:**
- Modify: `src/components/sections/LessonTopics.tsx`
- Modify: `src/lib/constants.ts`

Strike có cột phải chứa video đổi theo mục đang chọn (`Features.tsx:531-540`). Bản của ta chưa port. Chủ dự án hỏi thẳng: *"cái này video bên phải của nó đâu"*.

- [ ] **Step 1: Khai bốn video theo chủ đề**

Thêm vào `constants.ts` một map từ `TopicId` sang đường dẫn video. Dùng tạm bốn clip đã có trong `public/video/` (`clip-1` … `clip-4`). Comment rõ đây là tệp giữ chỗ, phải thay.

- [ ] **Step 2: Dựng cột phải**

Chỉ hiện từ `lg` trở lên — dưới đó không đủ chỗ, và Strike cũng vậy. Cột giữ tỉ lệ 16:9, bo góc, viền mảnh, `overflow-hidden`.

Video đổi theo chủ đề đang mở. Chuyển video dùng `AnimatePresence` mờ chồng, thời lượng lấy từ `DURATION`, easing `EASE_STANDARD`.

Dùng `AutoplayVideo` với prop `paused` đã có: chỉ video của chủ đề đang mở được phát.

- [ ] **Step 3: Giữ nguyên thứ đang chạy tốt**

Không đụng thanh chỉ báo spring, vòng đo lại 520ms, hay cơ chế mở-khi-di-chuột. Chỉ thêm cột phải.

- [ ] **Step 4:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 4: Thẻ diễn đàn đều nhau và có ảnh bìa

**Files:**
- Modify: `src/components/sections/LatestPosts.tsx`, `src/components/sections/MotionGrid.tsx`, `src/components/forum/PostCard.tsx`

Chủ dự án: *"đang hiển thị kiểu lủng củng quá"*. Quan sát thật: ba thẻ cao thấp khác nhau, lệch hàng, hai thẻ thiếu tóm tắt nên trống hoác, không thẻ nào có ảnh bìa.

- [ ] **Step 1: Ép các thẻ cùng chiều cao**

Thẻ trong lưới phải kéo dài bằng nhau bất kể độ dài nội dung. Kiểm cả chuỗi bọc: `MotionGrid` → `motion.div` → `TiltCard` → `PostCard` — mỗi lớp đều phải cho phép kéo giãn, đứt một mắt là hỏng.

- [ ] **Step 2: Chỗ cho ảnh bìa khi bài chưa có**

`PostCard` đã hiện ảnh bìa khi có `coverImageUrl`. Vấn đề là bài chưa có ảnh thì thẻ tụt ngắn hơn. Thêm khối giữ chỗ cùng tỉ lệ 16:9 khi thiếu ảnh — nền trung tính, không chữ, `aria-hidden`.

- [ ] **Step 3: Lấp khoảng trống khi thiếu tóm tắt**

Thẻ không có `excerpt` để lại lỗ hổng. Cho vùng tóm tắt chiều cao tối thiểu, hoặc đẩy "Đọc tiếp" xuống đáy thẻ để mọi thẻ kết thúc cùng chỗ.

- [ ] **Step 4:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 5: Dựng lại khối CTA theo Strike

**Files:**
- Modify: `src/components/sections/JoinCta.tsx`
- Modify: `src/lib/constants.ts`, `src/messages/*.json` nếu cần

Chủ dự án: *"cái này copy thiếu từ bên strike đúng không, sao nhìn khác nhau vậy nhỉ"*. Đúng — Strike dùng nền đen + ảnh nền phủ kín + chữ vòng tròn + hàng liên kết bên trong; ta chỉ có khối gradient trơn.

Đọc `Strike_Robot_LandingPage_Desing/src/components/sections/CTA.tsx` trước khi viết.

- [ ] **Step 1: Cấu trúc khối**

Nền đen, bo góc lớn, `minHeight` khoảng 423px, ảnh nền phủ kín `object-cover` mờ phía sau. Chưa có ảnh thật — dùng một ảnh trung tính tự sinh đặt ở `public/`, comment rõ là giữ chỗ.

- [ ] **Step 2: Chữ vòng tròn**

`CircularText` đã có sẵn trong `@/components/motion`. Đặt lệch sang mép phải, cắt bớt ra ngoài khối như Strike. Giữ `durationSeconds` quanh 28.

- [ ] **Step 3: Nội dung căn giữa + hàng liên kết**

Tiêu đề, mô tả, nút — căn giữa từ `md` trở lên, căn trái ở mobile (giống Strike). Thêm hàng liên kết ngay trong khối, dùng `NAV_ITEMS` có sẵn.

- [ ] **Step 4: Giữ nguyên trạng thái chờ biểu mẫu**

Khi `JOIN_FORM_URL` rỗng vẫn hiện dòng viền đứt "Form đăng ký sẽ mở trong thời gian tới", không phải nút giả.

- [ ] **Step 5:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 6: Dựng lại footer theo Strike

**Files:**
- Modify: `src/components/layout/Footer.tsx`

Chủ dự án nói *"footer cũng chưa có"* — thực ra có, nhưng là kiểu ba cột "Khám phá / Kết nối", khác hẳn Strike nên không nhận ra.

Strike (`sections/Footer.tsx:28-72`): một hàng ngang — logo trái, bản quyền giữa, icon mạng xã hội phải. Mobile xếp dọc.

- [ ] **Step 1: Đổi sang bố cục hàng ngang**

Bỏ hai cột liên kết. Giữ `Logo`, `SocialLinks` (tự ẩn khi chưa có URL — giữ nguyên hành vi đó), và dòng bản quyền.

- [ ] **Step 2: Giữ điều hướng ở chỗ khác**

Bỏ liên kết khỏi footer thì phải có chỗ khác — Task 5 đã thêm hàng liên kết vào khối CTA ngay phía trên. Xác nhận điều đó đã xong trước khi bỏ ở đây; nếu chưa, làm Task 5 trước.

- [ ] **Step 3:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 7: Làm dày khối "Bắt đầu từ những điều đơn giản nhất"

**Files:**
- Modify: `src/components/sections/SimpleStart.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json`

Chủ dự án chọn phương án (d): thiếu hình ảnh, khoảng trắng quá nhiều nhìn rỗng, **và** câu chữ nghe sáo.

**Giới hạn quan trọng về câu chữ:** tiêu đề *"Bắt đầu từ những điều đơn giản nhất"* và mô tả dưới nó là **nguyên văn trong tài liệu của chủ dự án** — đó là giọng của họ, **giữ nguyên, không sửa**.

Phần được phép viết lại là câu chữ do ta tự đặt ở khối bốn chủ đề: *"Bốn chủ đề để bắt đầu"* và *"Mỗi chủ đề gồm các bài viết ngắn, đi từ khái niệm cơ bản tới ứng dụng thực tế. Chọn một chủ đề để xem danh sách bài."* — nghe như hướng dẫn sử dụng. Viết lại cho cụ thể và có sức nặng hơn, vẫn đúng sự thật về nội dung sẽ có.

- [ ] **Step 1: Giảm rỗng**

Khối hiện là một hộp trắng bo góc chứa mỗi hai dòng chữ. Thu gọn khoảng đệm dọc, giảm cỡ chữ tiêu đề cho cân với lượng nội dung, và thêm một yếu tố thị giác — ví dụ số thứ tự chương, đường kẻ mảnh, hoặc dải nhỏ trung tính. **Không thêm màu tím, không thêm biểu tượng hoạt hình.**

- [ ] **Step 2: Viết lại câu chữ khối bốn chủ đề**

Sửa `home.topics.*` trong cả hai tệp ngôn ngữ. Giữ hai tệp bằng số khoá.

- [ ] **Step 3:** `tsc`, `lint`, `build` sạch. Commit.

---

### Task 8: Nghiệm thu lại bằng trình duyệt

**Files:** không sửa tệp nào

- [ ] **Step 1:** `tsc`, `lint`, `vitest`, `build`, `verify-security.sh` — tất cả phải sạch.
- [ ] **Step 2:** Cân bảng dịch `vi.json` / `en.json`.
- [ ] **Step 3:** Kiểm ở 390 / 768 / 1440 trên cả `/vi` và `/en`:
  - Không còn màu tím ở bất kỳ đâu
  - Hero chiếm trọn màn hình, video dưới nếp gấp
  - Cột video bên phải đổi theo chủ đề đang chọn (chỉ từ `lg`)
  - Thẻ diễn đàn đều chiều cao, có ảnh bìa hoặc khối giữ chỗ
  - CTA giống Strike: nền đen, ảnh nền, chữ vòng tròn, liên kết bên trong
  - Footer một hàng ngang
  - Không tràn ngang
  - Console 0 lỗi (bắn `console.error` mồi để chắc công cụ bắt được)
  - Bật giảm chuyển động: mọi thứ đứng yên, vẫn đọc được
- [ ] **Step 4:** Dọn môi trường.

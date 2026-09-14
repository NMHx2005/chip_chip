# Bàn giao — Project Chíp Chíp

Cập nhật: 14/09/2026 · Nhánh: `fix/security-hardening` · Commit cuối: `ab64a43`

---

## 1. Chạy dự án

```bash
npx supabase start          # cần Docker
npx next build && npx next start -p 3000
```

Quản trị: `http://localhost:3000/admin` — `admin@chipchip.local` / `chipchip2026`

Trang trưng bày hiệu ứng (nội bộ, đã chặn khỏi công cụ tìm kiếm): `/motion-gallery`

**Bẫy môi trường:** shell có sẵn `NODE_ENV=production` làm `next dev` chết ở middleware. Dùng `NODE_ENV=development npx next dev`.

**Bẫy nghiêm trọng hơn:** đừng chạy `next build` trong khi `next start` đang phục vụ cùng thư mục. Build ghi đè `.next` và trang sẽ vỡ với lỗi *"Application error: a client-side exception"*. Tôi đã dính đúng lỗi này và mất một lúc mới nhận ra không phải lỗi code.

---

## 2. Trạng thái cây làm việc

**Sạch.** Không có gì sửa dở. Thư mục `.commandcode/` là rác của công cụ, không phải của dự án — xoá được.

Việc cuối cùng chạy xong là cho hero cao trọn màn hình (commit `ab64a43`): khối tiêu đề dùng `min-h-[calc(100dvh-68px)]`, `md:` là `76px` — số lấy trực tiếp từ khối đệm thật trong `Navbar.tsx:145`, không phải đoán. Dùng chiều cao *tối thiểu* nên màn hình thấp thì trang dài ra chứ không cắt nội dung.

Đã chứng minh bằng phép tính rằng đỉnh video luôn nằm dưới đáy khung nhìn ít nhất 56px ở cả 1440×900, 768×1024 và 390×844. Ba lệnh kiểm (`tsc`, `lint`, `build`) đều sạch.

**Chưa ai nhìn bằng mắt.** Nên việc đầu tiên nên làm là mở trình duyệt xác nhận: tiêu đề căn giữa dọc, video không lộ ra trong màn hình đầu, và ở màn thấp nội dung không bị cắt.

## 3. Đã xong

### Nền tảng (từ các phiên trước)

Next.js 14 App Router · TypeScript · Tailwind · next-intl (URL bản địa hoá) · Supabase (Postgres + Auth + Storage) · Tiptap · Vitest (65 test).

Cổng duyệt bài nằm ở Postgres: `publish_translation` là `SECURITY DEFINER`, đăng cả hai ngôn ngữ trong một giao dịch — không có đường đăng lệch một nửa.

Bình luận không ghi trực tiếp từ trình duyệt; mọi thứ qua `/api/comments` dùng service role.

**Bảo mật đã vá và kiểm chứng bằng khai thác thật** (`./scripts/verify-security.sh`, 9/9):
- Tài khoản mới mặc định `is_active = false` — đăng ký không còn đồng nghĩa với quyền quản trị
- `comments.author_email` không còn là cột công khai
- Giới hạn tần suất đếm và ghi trong một giao dịch có khoá

### Giai đoạn 1 — thư viện chuyển động (xong)

`src/components/motion/` — 21 tệp, port từ `Strike_Robot_LandingPage_Desing`:

`tokens.ts` (nguồn sự thật duy nhất cho easing/thời lượng) · `variants.ts` · `AnimatedSection` · `ScrollReveal3D` · `StickyBackdrop` · `MainSection` · `SceneFillOverlay` · `TiltCard` · `DriftTextPath` · `AnimatedButtonLabel` · `VideoHoverCard` · `useHoldToReveal` · `useSharedScrollProgress` · `useVideoHoverCard`

**Chữ ký chuyển động** (lấy từ mã Strike, đừng đổi): easing `[0.25, 0.1, 0.25, 1]`, thời lượng 0.5–0.7s (chuẩn 0.6), stagger 0.12s trễ đầu 0.1s, mốc cuộn `once: true, margin: "-100px"`.

### Giai đoạn 2 — trang chủ (xong)

PAGE 1–5 dựng trên thư viện trên. Gồm băng chuyền 6 video tự viết (không dùng thư viện), lớp phủ chuyển cảnh, thẻ nghiêng khi hover.

### Giai đoạn 2b — sửa theo phản hồi (2/8)

Chủ dự án xem trang chạy thật và nêu 8 điểm. Xong điểm 1 và 2.

---

## 4. Còn phải làm

### 2b — bảy việc còn lại

Plan chi tiết: `docs/superpowers/plans/2026-09-14-giai-doan-2b-sua-theo-feedback.md`

| # | Việc | Tệp chính |
|---|---|---|
| ~~1~~ | ~~Bỏ màu tím + bỏ pastel 4 nước~~ | xong, commit `1a7cdbd` |
| ~~2~~ | ~~Hero trọn màn hình~~ | xong, commit `ab64a43` (chưa kiểm bằng mắt) |
| 3 | Cột video bên phải khối 4 chủ đề | `LessonTopics.tsx`, `constants.ts` |
| 4 | Thẻ diễn đàn đều chiều cao + ảnh bìa | `LatestPosts.tsx`, `MotionGrid.tsx`, `PostCard.tsx` |
| 5 | Dựng lại CTA theo Strike | `JoinCta.tsx` |
| 6 | Dựng lại footer theo Strike | `Footer.tsx` |
| 7 | Làm dày khối "Bắt đầu từ điều đơn giản nhất" | `SimpleStart.tsx`, `messages/*.json` |
| 8 | Nghiệm thu lại bằng trình duyệt | — |

**Lưu ý thứ tự:** task 3 và 5 đều đụng `constants.ts`, đừng chạy song song. Task 6 phụ thuộc task 5 (bỏ liên kết khỏi footer thì CTA phải có liên kết trước).

**Nguồn đối chiếu Strike** — ba chỗ chủ dự án nói "nhìn khác":

| Việc | Tệp Strike | Điểm mấu chốt |
|---|---|---|
| Cột video phải | `sections/Features.tsx:531-540` | `hidden h-[480px] w-[800px] shrink-0 overflow-hidden rounded-2xl border lg:block`, video đổi theo mục đang chọn |
| Khối CTA | `sections/CTA.tsx:20-60` | nền đen + `<Image fill>` phủ kín + `CircularText` mép phải + nội dung căn giữa + hàng liên kết bên trong, `minHeight: 423` |
| Footer | `sections/Footer.tsx:28-72` | một hàng ngang: logo trái · bản quyền giữa · mạng xã hội phải. Không có cột "Khám phá/Kết nối". |

### Giai đoạn 3 và 4 — chưa bắt đầu

Chủ dự án đã nhận xét các trang trong **"quá sơ sài, không chuyên nghiệp"**. Đúng — vì chưa làm.

- **Giai đoạn 3 — Bài học + Video.** Bài học cần: cột chủ đề bên trái, thanh tìm kiếm, thẻ con, hiệu ứng thu cột trái phóng to bên phải, và danh sách bài thật. Trang Video cần: bộ lọc sắp xếp (Mới/Cũ/Đơn giản/Phức tạp — cần thêm cột `difficulty` vào bảng `posts`), nhúng iframe YouTube/TikTok (phải nới CSP).
- **Giai đoạn 4 — Blog + Giới thiệu.** Thẻ nở khi bấm; "Meet the team"; câu hỏi thường gặp; biểu mẫu.

Spec: `docs/superpowers/specs/2026-09-13-redesign-chuyen-dong-design.md` mục 7.

**Chưa có plan file cho hai giai đoạn này.**

---

## 5. Những quyết định tôi tự đưa ra

Đầy đủ 20 mục ở `.superpowers/sdd/2026-09-14-giai-doan-2-trang-chu/progress.md` (tìm chữ `Ruling`). Những cái đáng để bạn xem lại và bác nếu không đồng ý:

**Giữ chữ VI/EN thay vì cờ quốc gia.** Cờ chỉ quốc gia chứ không chỉ ngôn ngữ, và trình đọc màn hình đọc thành tên nước. Đổi sang cờ chỉ là một dòng.

**Không cài `vanilla-tilt` và không cài thư viện băng chuyền.** Hook `useVanillaTilt` trong Strike không có nơi nào import — hiệu ứng nghiêng thật là CSS ba dòng. Embla trong Strike chỉ dùng để vuốt ngang trên mobile, không giải được bài "ô giữa nổi, hai bên mờ".

**Gộp `Hero` và `VideoReveal` làm một.** Mốc cuộn phải đo theo ref của video và tiêu đề đọc chính mốc đó; hai component riêng thì không chia được.

**Thêm stagger vào `SectionHeading` thay vì chỉ `SimpleStart`.** Component đó dùng chung ở 5 nơi, nên mọi tiêu đề section giờ vào trang cùng nhịp.

**Sửa mất landmark ở cả `LatestPosts` lẫn `VideoCarousel`.** Một `<section>` không có tên trợ năng thì mất hẳn vai trò `region`, không chỉ mất tên.

**Giữ nguyên câu chữ trong tài liệu của bạn** ở khối "Bắt đầu từ những điều đơn giản nhất" — bạn đã xác nhận.

---

## 6. Nợ kỹ thuật đã biết

- Hai điểm **màu tím chết** chưa dọn: `rgba` tím trong shadow chưa từng bật của `PillButtonCta`, và bảng màu `topic.*` chưa dùng trong `tailwind.config.ts`. Không hiện ra màn hình, nhưng yêu cầu của bạn là tuyệt đối nên nên quét nốt.
- `<section>` lồng `<section>` ở `LatestPosts`/`VideoCarousel` — section trong không có tên nên không tạo landmark thứ hai, chỉ là vệ sinh DOM.
- `COUNTRY_BANDS` dùng `as const` nên kiểu `logo` hẹp thành literal `null`; tự nới khi điền logo thật.
- `hoverTimer` trong `LessonTopics` là một ref dùng chung cho cả 4 hàng thay vì mỗi hàng một cái. Hành vi vẫn đúng.
- Ô checkbox trong các plan file **chưa bao giờ được tick** dù việc đã làm. Đừng dùng chúng làm thước đo tiến độ — lịch sử commit mới là bản ghi thật.

---

## 7. Tài nguyên còn thiếu

Điền vào `src/lib/constants.ts` là giao diện tự bật.

**Bắt buộc mới chạy được:**
- Logo vector/PNG nền trong suốt (chuột trong vành trăng) — hiện chưa có, logo đang là chữ
- Ảnh mascot nền trong suốt
- Video thật: clip 30s *"The Closest Thing We Have to Alien Technology"* cắt ở ~29s; clip TSMC cắt từ ~15s; 6 video cho băng chuyền
- Logo công ty nền trong suốt: Nvidia, Broadcom, AMD, Micron, Qualcomm, Intel, TSMC, Samsung, SK hynix, ASML
- Ảnh đội ngũ cho "Meet the team"
- URL Facebook, Facebook Group, TikTok · email liên hệ · link Google Form (`viewform`)
- Nội dung câu hỏi thường gặp
- **Bài học thật** — thiếu cái này thì trang Bài học chỉ là khung rỗng

**Đang dùng tạm:** 7 video trong `public/video/` mượn từ dự án Strike. Nội dung không liên quan bán dẫn, **phải thay trước khi lên production**.

**Chưa làm được vì thiếu tệp:** ảnh bo mạch làm nền khối bài viết (ảnh trong tài liệu quá nhỏ), clip TSMC cho trang Blog.

**Không đọc được:** `.env.example` bị chặn bởi rule bảo mật của môi trường, nên tôi chưa thêm được hai biến. Bạn tự thêm:
```
COMMENT_IP_SALT=
TRUSTED_PROXY_HOPS=1
```

---

## 8. Trước khi lên production

1. Chạy `supabase db push` để áp migration siết quyền.
2. Kích hoạt tài khoản quản trị đầu tiên — trigger giờ tạo profile ở trạng thái **chưa kích hoạt**:
   ```sql
   update public.profiles set role = 'admin', is_active = true
    where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Tắt tự đăng ký trong Supabase Dashboard (lớp phòng thủ thứ hai; lớp thứ nhất là `is_active`).
4. Thay hết video giữ chỗ.
5. Chạy `./scripts/verify-security.sh` — phải 9/9.

---

## 9. Quy trình đang dùng

Spec → plan → thực thi bằng subagent, mỗi task một subagent mới cộng một vòng review. Sổ tiến độ ở `.superpowers/sdd/<tên-plan>/progress.md` — đây là thứ sống sót qua việc mất ngữ cảnh, tin nó hơn tin trí nhớ.

Script hỗ trợ nằm ở `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/subagent-driven-development/scripts/`.

**Bài học đắt nhất của đợt này:** năm vòng review đọc code đều sạch, nhưng khi mở trình duyệt thì lòi ra hai lỗi — nền dán chưa bao giờ hiện (z-index âm bị nền `body` phủ) và hai thẻ `<main>` lồng nhau. Đọc code không thay được việc nhìn bằng mắt.

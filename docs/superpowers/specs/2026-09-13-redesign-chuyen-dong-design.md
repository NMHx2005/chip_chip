# Thiết kế lại Project Chíp Chíp — hệ chuyển động và nội dung

Ngày: 2026-09-13
Trạng thái: chờ duyệt

## 1. Mục tiêu

Giao diện hiện tại chạy đúng nhưng trông như sinh ra từ khuôn mẫu. Bản thiết kế
này thay tầng trình bày: dựng lại toàn bộ hệ chuyển động theo
`Strike_Robot_LandingPage_Desing`, và sắp xếp lại nội dung theo tài liệu
*PROJECT CHÍP CHÍP — KẾ HOẠCH HOẠT ĐỘNG*.

Không đụng tới tầng dữ liệu: schema Supabase, RLS, trang quản trị, song ngữ và
các bản vá bảo mật ngày 13/09 giữ nguyên.

## 2. Chẩn đoán

Cảm giác "khuôn mẫu" không đến từ màu hay phông. Nó đến từ việc thiếu tầng
chuyển động. Strike Robot xếp chồng mười kỹ thuật; bản hiện tại có hai.

| Kỹ thuật | Strike Robot | Chíp Chíp hôm nay |
|---|---|---|
| Nền hero dán cố định, nội dung đè lên bằng `-mt-[100dvh]` | có | không |
| Tiêu đề co mờ dùng chung mốc cuộn với video | có | không |
| Video xoay 3D 55°→0°, gốc xoay ở cạnh đáy | có | có component nhưng là code chết |
| Accordion với thanh chỉ báo bám spring | có | có |
| Thẻ nghiêng 3D khi hover, mặt nạ khuyết góc | có | không |
| Viền sáng chạy quanh nút | có | có |
| Navbar kính, viền ánh kim | có | có kính, thiếu viền kim |
| Chữ vòng tròn xoay | có | có |
| Chữ trôi dọc đường cong SVG | có | không |
| Mobile: giữ để hiện thay cho hover | có | không |

Hai lệch hướng cần sửa:

- Navbar hiện tại dùng `layoutId` cho pill trượt ngang. Strike Robot không có
  thứ đó — pill của họ chỉ hiện/ẩn tại chỗ. Bỏ `layoutId`.
- Mỗi component hiện tự chọn easing riêng. Strike Robot dùng đúng một easing
  cho mọi chuyển động xuất hiện. Đây là nguyên nhân lớn nhất của cảm giác rời rạc.

## 3. Quyết định

**Dựng thư viện chuyển động trước, rồi xây lại trang lên trên nó.** Phạm vi là
mọi trang; nếu từng trang tự chế hiệu ứng thì kết quả lại rời rạc như hiện tại.

**Giữ chữ VI/EN thay vì cờ.** Cờ chỉ quốc gia chứ không chỉ ngôn ngữ, và trình
đọc màn hình sẽ đọc thành tên quốc gia thay vì tên ngôn ngữ.

**Dùng `AnimatedButtonLabel` và `BgFillOverlay`** — hai primitive Strike Robot
viết xong nhưng chưa gắn vào đâu. Cả hai đều hoàn chỉnh và có guard
`prefers-reduced-motion`. `BgFillOverlay` trả lời luôn câu hỏi trong tài liệu về
chỗ đặt hiệu ứng chuyển cảnh.

**Không cài `vanilla-tilt`.** Hook `useVanillaTilt.ts` trong Strike Robot không
có nơi nào import; hiệu ứng nghiêng thật là CSS thuần ba dòng. Thêm thư viện chỉ
để làm việc mà CSS đã làm được là thừa.

**Port nguyên trạng, kể cả chỗ trông như thiếu sót.** `SCROLL_REVEAL_EASE` được
export nhưng không bao giờ áp dụng — video biến đổi tuyến tính theo phần trăm
cuộn. Giữ đúng như vậy: mục tiêu là tái tạo cảm giác của bản gốc, không phải
sửa nó theo ý mình.

## 4. Chữ ký chuyển động

Mọi thông số dưới đây lấy từ mã nguồn Strike Robot, không phải ước lượng.

```
EASE_STANDARD   = cubic-bezier(0.25, 0.1, 0.25, 1)   // mọi hiệu ứng xuất hiện
DURATION_BASE   = 0.6s        // dải cho phép 0.5–0.7s
STAGGER_STEP    = 0.12s
STAGGER_DELAY   = 0.1s
VIEWPORT_MARGIN = -100px      // mốc kích hoạt khi cuộn tới, chạy một lần
```

Chuyển động lặp vô hạn không dùng easing trên:

```
marquee / xoay vòng   → linear    (22s chữ vòng tròn, 30s marquee, 5s viền sao)
nhấp nháy sáng        → ease-in-out (3–6s)
Lenis                 → duration 0.9, easing 1-(1-t)^3
```

Viền sao tăng tốc khi hover: `5s → 2s`.

Chốt chặn cuối trong `globals.css`: khối `@media (prefers-reduced-motion: reduce)`
ép mọi animation và transition CSS về `0.01ms`. Animation điều khiển bằng
JavaScript tự kiểm tra `useReducedMotion` ở từng component.

## 5. Kiến trúc bốn tầng

### Tầng 1 — thư viện chuyển động (`src/components/motion/`)

Một nơi duy nhất định nghĩa mọi hiệu ứng. Mỗi module một việc, dùng được độc lập.

| Module | Việc |
|---|---|
| `tokens.ts` | Hằng số ở mục 4. Mọi module khác đọc từ đây. |
| `variants.ts` | `fadeUp`, `fadeIn`, `fadeUpScale`, `slideInLeft/Right`, `staggerContainer` (+Fast/Slow), `staggerItem` (+Scale), `glowPulse`, `orb`, `borderGlow` |
| `AnimatedSection.tsx` | Bọc một section: mờ dần + trượt lên 32px khi cuộn tới, chạy một lần |
| `AnimatedButtonLabel.tsx` | Từng ký tự nhảy, xoay, đổi độ đậm phông khi hover. Lệch pha bằng hash tất định nên mỗi lần hover giống hệt nhau. Chỉ chạy trên con trỏ chính xác. |
| `ScrollReveal3D.tsx` | Nghiêng 55°→0°, scale 0.72→1, gốc `50% 100%`, perspective 1600px, mốc cuộn `["start end", "center 65%"]`. Đổi tên từ `ScrollVideoReveal` vì không chỉ dùng cho video. |
| `StickyBackdrop.tsx` | Nền dán cố định cao `100dvh`, `-z-10`, ảnh riêng cho mobile qua `<picture>` |
| `SceneFillOverlay.tsx` | Lớp phủ dâng từ giữa-đáy bằng `clip-path: circle()`, bám theo vị trí một section. Spring `stiffness 220, damping 32, mass 0.6`. Nhận `targetId` thay vì gán cứng. |
| `TiltCard.tsx` | Nghiêng 3D khi hover bằng CSS. Biến thể `left`: `rotateX(2deg) rotateY(-5deg) rotateZ(-1deg)`; `right` đảo dấu Y và Z. Chỉ từ `md` trở lên. |
| `useHoldToReveal.ts` | Thay hover trên thiết bị cảm ứng: chạm hiện ngay; giữ quá 280ms là "giữ", nhả thì ẩn sau 1000ms; chạm nhanh thì ẩn sau 2500ms; di chuyển quá 8px coi là cuộn và huỷ. |
| `useSharedScrollProgress.ts` | Một mốc cuộn dùng chung cho nhiều phần tử — tiêu đề co mờ đúng nhịp video dựng lên. |
| `DriftTextPath.tsx` | Chữ trôi dọc cung SVG. Dừng hẳn khi ra khỏi khung nhìn để khỏi tốn CPU. |
| `StarBorder.tsx`, `GlassPill.tsx`, `CircularText.tsx`, `SmoothScroll.tsx` | Đã có, chuyển vào đây và đồng bộ về `tokens.ts` |

`GlassPill` bổ sung viền ánh kim (gradient nhiều chặng) hiện đang thiếu.

### Tầng 2 — bộ khung trang

Chia trang làm hai nửa, đây là thứ tạo chiều sâu:

```
<Navbar />
<div className="relative">
  <StickyBackdrop />
  <div className="relative z-10 -mt-[100dvh]">
    …nửa trên
  </div>
</div>
<MainSection>   {/* gradient trắng riêng, che nền dán phía trên */}
  …nửa dưới
</MainSection>
```

`MainSection` cố ý không có chuyển động theo cuộn: dịch chuyển cả khối chứa bốn
section là quá nặng.

### Tầng 3 — trang chủ (mục 6)

Năm khối theo đúng PAGE 1–5 của tài liệu, dựng trên tầng 1 và 2.

### Tầng 4 — các trang con (mục 7)

Bài học, Video, Blog, Giới thiệu — dùng lại đúng bộ primitive của tầng 1.

## 5b. Chia giai đoạn

Khối lượng này quá lớn cho một lần làm liền mạch. Chia làm bốn giai đoạn, mỗi
giai đoạn tự đứng được và có điểm dừng để bạn xem.

**Giai đoạn 1 — thư viện chuyển động và bộ khung.** Tầng 1 và tầng 2. Dựng một
trang thử nội bộ trưng bày từng primitive để đối chiếu cạnh bản Strike Robot.
Kết thúc giai đoạn: giao diện công khai chưa đổi, nhưng mọi hiệu ứng đã sẵn sàng
và kiểm chứng được.

**Giai đoạn 2 — trang chủ.** PAGE 1 đến PAGE 5, gồm băng chuyền video mới. Đây
là phần bạn thấy khác biệt rõ nhất.

**Giai đoạn 3 — Bài học và Video.** Bố cục cột trái + lưới thẻ, tìm kiếm, thẻ
con, thu cột; trang Video với bộ lọc sắp xếp và nhúng iframe. Kèm migration
`difficulty` và khối chú thích trong trình soạn thảo.

**Giai đoạn 4 — Blog và Giới thiệu.** Thẻ nở khi bấm; Meet the team, câu hỏi
thường gặp, biểu mẫu.

Sau mỗi giai đoạn: chạy đủ `tsc`, `lint`, `vitest`, `next build`,
`verify-security.sh`, và kiểm chứng bằng trình duyệt thật ở 390px, 768px,
1440px trước khi sang giai đoạn tiếp.

## 6. Trang chủ

### PAGE 1 — Hero

Hai huy hiệu "Đơn giản" (xanh dương) và "Miễn phí" (tím). Tiêu đề hai dòng, hai
màu: *"Một đứa trẻ ba tuổi cũng có thể tìm hiểu về bán dẫn"*. Mô tả ngắn. Hai
nút: "Tìm hiểu ngay" → Bài học, "Về chúng tôi" → Giới thiệu.

Khi tải: `staggerContainer` chạy ngay, không đợi cuộn. Thứ tự huy hiệu → tiêu đề
→ mô tả → nhóm nút, cách nhau 0.12s.

Khi cuộn: khối tiêu đề mờ dần theo `[1, 0.7, 0]` và co theo `[1, 0.92]` —
nhưng mốc cuộn lấy từ **khối video bên dưới**, không phải từ chính tiêu đề. Nhờ
vậy tiêu đề lùi đi đúng nhịp video dựng lên. Đây là chi tiết dễ bỏ sót nhất.

Nút chính dùng `AnimatedButtonLabel`.

### PAGE 2 — Video dựng đứng

Video 30 giây, cắt tới chỗ thuyết minh nói *"transistor càng nhỏ, tính toán càng
nhanh"*. Bọc trong `ScrollReveal3D`.

Desktop: tự phát im lặng khi cuộn tới, lười tải với `rootMargin: 200px`, tự dừng
khi ra khỏi khung nhìn. Hover hiện thẻ xem trước, tự ẩn sau 2500ms kể từ khi rời
chuột; viền thẻ có nét đứt chạy vòng, hover thì nhanh gấp đôi.

Mobile: không tự phát. Video đứng yên với nút play phủ lên, chạm để phát.

Dưới video ghi nguồn và liên kết kênh gốc.

### PAGE 3 — Lý thuyết và bản đồ quốc gia

Tiêu đề *"Bắt đầu từ những điều đơn giản nhất"*, phụ đề *"Giới thiệu những kiến
thức căn bản nhất về bán dẫn, một cách thật đầy đủ, chính xác, trực quan tới tất
cả bạn đọc."*

Bốn chủ đề: Định nghĩa, Nguyên lý, Ứng dụng, Lịch sử và Phát triển.

Tài liệu nói **di chuột** thì mục mở ra, bản hiện tại đang là **bấm**. Đổi sang:
desktop mở khi di chuột vào (trễ 120ms để tránh nhấp nháy khi chuột lướt qua),
mobile mở khi chạm. Giữ nguyên cơ chế đang chạy tốt: thanh chỉ báo bám spring
`stiffness 420, damping 36, mass 0.85`, và vòng lặp đo lại vị trí mỗi khung hình
trong 520ms — cần thiết vì các mục bên dưới còn đang dịch chuyển trong lúc
accordion giãn 0.45s.

Mỗi mục mở ra có mô tả ngắn và liên kết "Đọc thêm" sang trang riêng.

Bản đồ quốc gia bổ sung **logo công ty** cạnh tên nước, hiện mới chỉ có chữ:

- Mỹ: Nvidia, Broadcom, AMD, Micron, Qualcomm, Intel
- Đài Loan: TSMC · Hàn Quốc: Samsung, SK hynix · Hà Lan: ASML

### PAGE 4 — Băng chuyền video (mới hoàn toàn)

Tiêu đề *"Vẫn chưa đủ hấp dẫn sao? Thử học qua video nhé!"*, phụ đề *"Các video
được tác giả tuyển chọn kĩ lưỡng, phù hợp hoặc do chính tác giả thực hiện dịch,
sản xuất với sự tâm huyết và trách nhiệm"*.

Sáu video. Ô giữa là video đang xem, hai bên thấy một phần. Hai cách chuyển: bấm
nút next, hoặc bấm thẳng vào ô bên cạnh. Bấm vào ô giữa thì phóng to. Dưới mỗi
video có nhãn chủ đề. Cuối khối có nút "Khám phá thêm" sang trang Video.

Không dùng thư viện băng chuyền. Embla trong Strike Robot chỉ để vuốt ngang trên
mobile và tắt ở desktop — không giải quyết bài toán "ô giữa nổi bật, hai bên thu
nhỏ". Tự viết bằng `motion` với `x` tính theo chỉ số ô đang chọn, ô giữa
`scale: 1`, hai bên `scale: 0.85, opacity: 0.55`. Mobile thêm vuốt ngang.

Hover vào ô bên cạnh thì phóng nhẹ, đúng như hình tham chiếu trong tài liệu.

### PAGE 5 — Bài viết

`SceneFillOverlay` đặt ở đây, bám theo section này. Lớp trắng dâng từ giữa-đáy
màn hình khi cuộn tới, nuốt dần nội dung phía trên — đây là "hiệu ứng chuyển
cảnh" trong tài liệu. Đặt ở Blog chứ không ở Video vì Video đã có băng chuyền và
phóng to; thêm nữa là hai hiệu ứng tranh nhau. Blog đang là phần phẳng nhất.

Ảnh bo mạch dùng làm nền cho khối, trả lời ý *"làm đồng màu thấy hơi đơn điệu"*.

Thẻ bài viết dùng `TiltCard`. Tiêu đề *"Đủ đơn giản để trẻ ba tuổi cũng hiểu
được"*, hai nút: một sang Blog, một sang Giới thiệu. Kèm video TSMC cắt từ giây
15 (đoạn eo biển Đài Loan).

## 7. Các trang con

### Bài học

Mũi tên chĩa xuống, **không bấm được**; di chuột vào mới hiện hai mục "Lý thuyết"
và "Video" để bấm — đúng như tài liệu mô tả. Trên thiết bị cảm ứng đổi thành
chạm để mở.

Thanh tìm kiếm lọc theo tiêu đề và tóm tắt. Lọc phía máy chủ qua tham số URL để
chia sẻ được liên kết và không tải toàn bộ bài về trình duyệt.

Bố cục theo hình tham chiếu trong tài liệu: cột trái là bốn chủ đề dạng viên
thuốc, vùng phải là lưới thẻ bài. Chọn một chủ đề thì hiện thêm hàng thẻ con bên
dưới nó. Có nút thu cột trái lại để vùng phải giãn rộng — chuyển tiếp bằng
`width` với easing chuẩn 0.45s.

Bài viết hỗ trợ khối chú thích (callout) như tài liệu yêu cầu: thêm một node
Tiptap mới, hiện trong thanh công cụ soạn thảo.

### Video

Đầu trang dùng ảnh lớn như trang Giới thiệu. Lưới video, mỗi video có khung chủ
đề bên dưới.

Bộ lọc sắp xếp: Mới nhất, Cũ nhất, Đơn giản nhất, Phức tạp nhất. Cần thêm cột
`difficulty` vào bảng `posts`.

Chia hai nhóm nguồn: TikTok và YouTube. Nhúng iframe thay vì tự host — băng thông
rẻ hơn và lượt xem vẫn về kênh của dự án. Riêng video nền và video hiệu ứng thì
bắt buộc tự host mp4 vì iframe không tự phát im lặng và không xoay 3D được.

Việc này cần nới CSP: thêm `frame-src` cho `youtube-nocookie.com` và
`tiktok.com`. Ghi rõ vì sao ngay tại chỗ sửa.

### Blog

Thẻ nhỏ, bấm vào thì phóng to tại chỗ trước khi chuyển trang — dùng `motion`
`layout` để thẻ nở ra mượt thay vì nhảy trang đột ngột.

### Giới thiệu

Tiêu đề *"Khai phá những vùng đất mới"*, phụ đề *"Hơn cả một dự án… Bắt đầu từ
số 0, kết thúc là thành công"*.

Khối "Meet the team": tám ban theo tài liệu. Ảnh và lời giới thiệu chưa có nên
chừa chỗ sẵn, dùng ảnh giữ chỗ, điền sau mà không phải sửa bố cục.

Khối câu hỏi thường gặp: accordion dùng lại cơ chế của PAGE 3.

Khối cuối: *"Muốn cùng nhau phát triển cộng đồng, tại sao không cùng tham gia với
chúng tôi"* kèm biểu mẫu đăng ký.

Ảnh mascot làm nền mờ phía sau.

## 8. Nội dung và song ngữ

Mọi chuỗi mới đi qua `next-intl`, không viết thẳng vào JSX. Sau khi xong, số khoá
ở `vi.json` và `en.json` phải bằng nhau — có kiểm tra tự động.

Tiêu đề tiếng Việt trong tài liệu là bản chuẩn. Bản tiếng Anh do tôi dịch, đánh
dấu để ban chuyên môn duyệt lại.

## 9. Tài nguyên

Dấu ⛔ nghĩa là thiếu thì không làm được, ⚠️ là có bản tạm nhưng nên thay.

**Thương hiệu**
- ⚠️ Logo (chuột trong vành trăng): SVG hoặc PNG nền trong suốt ≥1000px. Tạm tách nền từ ảnh trong tài liệu.
- ⚠️ Ảnh mascot chuột cầm chip, nền trong suốt.
- ⛔ Favicon — cắt từ logo khi có bản thật.

**Video**
- Mượn tạm 10 tệp mp4 của Strike Robot làm ảnh giữ chỗ.
- ⛔ Clip 30 giây *The Closest Thing We Have to Alien Technology*, cắt ở ~29 giây.
- ⛔ Clip TSMC cắt từ ~15 giây (đoạn eo biển Đài Loan).
- ⛔ Clip TSMC từ đầu đến ~15–20 giây.
- ⛔ Sáu video thật cho băng chuyền PAGE 4, kèm chủ đề từng video.
- Định dạng: H.264, cạnh dài ≤1920px, ≤5MB mỗi tệp. Ghi nguồn và liên kết kênh gốc dưới mỗi video.

**Logo công ty** (nền trong suốt)
- ⛔ Nvidia, Broadcom, AMD, Micron, Qualcomm, Intel, TSMC, Samsung, SK hynix, ASML

**Ảnh**
- ⛔ Ảnh đội ngũ cho "Meet the team".
- Ảnh bo mạch cho trang Blog: lấy từ tài liệu.

**Liên kết và nội dung**
- ⛔ Facebook page, Facebook group, TikTok
- ⛔ Email liên hệ
- ⛔ Liên kết Google Form (bản `viewform`)
- ⛔ Nội dung câu hỏi thường gặp
- ⛔ Bài học thật — thiếu thì trang Bài học chỉ là khung rỗng

Mọi thứ chưa có đều đọc từ `src/lib/constants.ts`; điền vào đó là giao diện tự
bật, không phải sửa component.

## 10. Ràng buộc

**Hiệu năng.** Chuyển động theo cuộn chỉ dùng `transform` và `opacity` để chạy
trên luồng hợp thành. `will-change: transform` chỉ đặt ở phần tử đang thực sự
chuyển động. Video lười tải với `rootMargin: 200px` và dừng khi ra khỏi khung
nhìn. Chữ trôi dọc đường cong dừng hẳn khi section ra khỏi khung nhìn. Sau khi
xong phải đo lại bằng Chrome DevTools và báo số thật.

**Khả năng tiếp cận.** Mọi chuyển động tôn trọng `prefers-reduced-motion` ở cả
hai tầng: chốt chặn CSS toàn cục và kiểm tra riêng ở từng component JavaScript.
Mọi thứ mở bằng di chuột phải mở được bằng bàn phím. Băng chuyền điều khiển được
bằng phím mũi tên. Tỉ lệ tương phản chữ giữ ở mức AA.

**Bảo mật.** Không sửa migration đã áp, không đổi RLS, không đụng
`/api/comments`. Hai thay đổi dữ liệu dưới đây là **migration mới, thuần bổ
sung**, không viết đè lên cái cũ:

- Cột `posts.difficulty` cho bộ lọc sắp xếp ở trang Video.
- Không cần đổi RLS: cột mới nằm trong danh sách `grant select` hiện có của
  `posts`, vốn đã cho `anon` đọc bài đã đăng.

Khối chú thích trong bài viết cần sửa `articleExtensions` — dùng chung giữa
trình soạn thảo và bộ kết xuất. Phải sửa **cả hai** cùng lúc, và thêm thẻ mới
vào danh sách cho phép của DOMPurify, nếu không nội dung sẽ bị lọc mất khi hiển
thị. Có test hồi quy cho việc này.

Nới CSP chỉ cho đúng các miền nhúng video, ghi lý do tại chỗ.

**Trên thiết bị cảm ứng** không có hover. Mọi hiệu ứng hover phải có đường thay
thế bằng chạm — đây là ràng buộc bắt buộc, không phải tuỳ chọn, vì người dùng
chính của dự án là học sinh dùng điện thoại.

## 11. Không làm

- Không cài `vanilla-tilt`; CSS đã đủ.
- Không dùng thư viện băng chuyền cho PAGE 4.
- Không dựng lại từ repo Strike Robot; sẽ mất CMS, song ngữ và phần bảo mật.
- Không thêm chuyển động theo cuộn cho `MainSection`; quá nặng.
- Không tự host video dài; nhúng iframe.

## 12. Tiêu chí hoàn thành

- Mọi chuyển động xuất hiện dùng đúng một easing, thời lượng trong dải 0.5–0.7s.
- Bật "giảm chuyển động" trong hệ điều hành thì trang đứng yên hoàn toàn và vẫn đọc được.
- Không tràn ngang ở 390px, 768px và 1440px.
- Bảng khoá dịch `vi.json` và `en.json` bằng nhau, không chuỗi tiếng Việt nào lọt vào bản tiếng Anh.
- `tsc`, `lint`, `vitest`, `next build` đều sạch; `scripts/verify-security.sh` vẫn 9/9.
- Mọi hiệu ứng hover có đường thay thế bằng chạm, kiểm chứng bằng giả lập thiết bị thật.
- Kiểm chứng bằng trình duyệt thật ở cả ba bề rộng, không kết luận qua mã trạng thái HTTP.

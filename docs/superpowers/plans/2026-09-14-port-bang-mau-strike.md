# Port hệ thống thị giác Strike sang Chíp Chíp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chíp Chíp trông giống `Strike_Robot_LandingPage_Desing` về mặt thị giác — bảng màu xám/đen/xanh đá, button, glass pill, star border, nền hai tầng — trong khi giữ nguyên nội dung song ngữ, routing và toàn bộ tầng bảo mật.

**Architecture:** Giai đoạn 1 đã port tầng *chuyển động* (easing, scroll reveal, stagger) và dựng sẵn các component tương đương Strike, nhưng nhuộm chúng sang tông tím của Chíp Chíp. Plan này chỉ thay **tầng màu**: token Tailwind, literal trong `globals.css`, và các hằng số gradient nằm thẳng trong component. Không đụng component motion đã review, không đụng schema, không đụng i18n.

**Tech Stack:** Next.js 14.2 App Router · TypeScript · Tailwind 3.4 · framer-motion 12

**Spec:** `docs/superpowers/specs/strike-design-inventory.md` — bản khảo sát 1:1 của Strike, mọi giá trị dưới đây trích từ đó kèm `file:line`.

## Phạm vi — cái gì KHÔNG nằm trong plan này

Bản khảo sát bao phủ cả Strike; plan này cố ý chỉ lấy tầng màu. Ba phần bị loại, kèm lý do:

- **Typography (§2 khảo sát).** Giữ Be Vietnam Pro — xem ràng buộc bên dưới. Font wordmark `SuperGround.ttf` có thể copy sau, khi có chuỗi latin ngắn cần tới; hiện chưa có chỗ dùng.
- **Section layout (§4 khảo sát).** 17 section của Strike là copy tiếng Anh viết cứng, hash-anchor, nội dung ngành robot. Không copy được sang site song ngữ có route tiếng Việt — phải dựng lại, và đó là việc của Giai đoạn 2 theo spec gốc, không phải của plan này.
- **Video assets (§6 khảo sát).** Chíp Chíp chưa có tệp video nào; video của Strike thuộc ngành robot, không dùng lại được làm nội dung. Khách đang chuẩn bị.

Sau plan này, giao diện công khai đổi màu hoàn toàn sang Strike nhưng vẫn giữ nguyên bố cục và nội dung hiện có — tự đứng được, kiểm chứng được.

## Global Constraints

- **Mọi giá trị màu phải copy nguyên văn từ bản khảo sát.** Không ước lượng, không "gần giống". Nếu một giá trị không có trong khảo sát, dừng và báo, đừng tự chế.
- **Font chữ thân bài giữ nguyên Be Vietnam Pro.** Strike dùng Golos Text, nhưng Google Fonts API xác nhận Golos Text chỉ có subset `cyrillic, cyrillic-ext, latin, latin-ext` — **không có `vietnamese`**. Bê sang thì mọi chữ có dấu thanh rớt về font hệ thống. Đây là quyết định đã chốt, không được đảo.
- **Không đụng** bất kỳ file nào trong `src/components/motion/` trừ khi task ghi rõ — đã qua review đầy đủ ở Giai đoạn 1.
- **Không đụng** `src/middleware.ts`, `supabase/`, `src/app/api/`, `src/lib/auth.ts`, `src/lib/rate-limit.ts` — tầng bảo mật vừa được vá, ngoài phạm vi.
- **Không đổi chuỗi hiển thị.** Mọi copy đi qua `next-intl`; task này chỉ đổi màu, không đổi chữ.
- Comment trong code viết bằng tiếng Anh.
- Sau mỗi task: `npx tsc --noEmit` và `npx next lint --max-warnings=0` sạch, `npx vitest run` giữ nguyên 59 test pass.

---

### Task 1: Bảng màu nền tảng

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: không có
- Produces: token `bg`, `surface`, `surface-muted`, `text`, `text-muted`, `text-nav`, `accent`, `accent-teal`, `accent-purple` mang giá trị Strike; mọi task sau đọc từ đây

Đây là task đổi nhiều nhất về mặt thị giác: nền trang đi từ trắng-ngả-tím sang xám, chữ từ tím-đen sang đen thuần.

- [ ] **Step 1: Thay token màu trong `tailwind.config.ts`**

Trong `theme.extend.colors`, thay khối `bg`/`surface`/`surface-muted` và thêm các token Strike (giá trị lấy từ khảo sát §1.1, `Strike/tailwind.config.ts:12-29`):

```ts
bg: "#E5E5E5",
surface: "#FFFFFF",
"surface-muted": "#EFEFEF",
primary: "#0D0D0D",
accent: "#314344",
"accent-teal": "#317e6a",
"accent-purple": "#69419d",
text: "#000000",
"text-muted": "#3e424d",
"text-nav": "#4d4d4d",
```

Giữ nguyên thang `brand-*` và `indigo-*` đang có — chưa xoá ở task này, vì nhiều component còn tham chiếu; Task 6 dọn sau khi đã hết chỗ dùng.

- [ ] **Step 2: Thay literal trong `globals.css`**

Các giá trị đang vẽ ra màn hình (khảo sát §1.4, `Strike/globals.css:36,41,42,50-52`):

```css
html { background-color: #E5E5E5; }
body { background-color: #E5E5E5; color: #000000; }
::selection { background: rgba(0, 0, 0, 0.12); color: #000000; }
```

- [ ] **Step 3: Kiểm tra kiểu, lint, test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch, 59 test pass.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat(design): bảng màu nền tảng theo Strike"
```

---

### Task 2: PillButton

**Files:**
- Modify: `src/components/ui/PillButton.tsx`

**Interfaces:**
- Consumes: token từ Task 1
- Produces: `PillButton` giữ nguyên chữ ký công khai `({ variant, size, showArrow, icon, className, children, onClick })`

Chíp Chíp thêm một variant `brand` tô gradient tím không có trong Strike. Strike chỉ có `dark` (gradient gần-đen + star border) và `outline` (pill trắng viền gradient nhạt).

- [ ] **Step 1: Đổi gradient chính về bản Strike**

**Đọc file trước khi sửa.** Hằng `darkGradient` đang có trong file **đã trùng khớp Strike từng ký tự** (`linear-gradient(131deg, rgb(51, 51, 51) 0.79%, rgb(13, 13, 13) 35.22%, rgb(38, 38, 38) 99.16%)` — đối chiếu khảo sát §1.5, `Strike/PillButton.tsx:9-10`). Không khai thêm hằng mới, sẽ trùng tên.

Việc cần làm: **xoá** hằng `brandGradient` (dải tím, Chíp Chíp tự thêm, Strike không có) và trỏ khoá `brand` về `darkGradient`:

```ts
const GRADIENTS = { brand: darkGradient, dark: darkGradient } as const;
```

Giữ nguyên tên khoá `brand` để không phải sửa mọi call site. Cập nhật doc-comment phía trên cho khớp — comment hiện tại nói gradient "matches the logo's purple → blue gradient", nay không còn đúng.

- [ ] **Step 2: Đổi viền variant `outline` về bản Strike**

Thay `outlineBorderBg` bằng dải xám của Strike thay cho dải tím hiện tại:

```ts
const outlineBorderBg =
  "linear-gradient(#fff,#fff) padding-box, linear-gradient(206.97deg, rgba(49,67,68,0.28) 13.96%, rgba(49,126,106,0.18) 50.79%, rgba(49,67,68,0.28) 83.14%) border-box";
```

- [ ] **Step 3: Kiểm tra kiểu, lint, test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch, 59 test pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/PillButton.tsx
git commit -m "feat(design): PillButton dùng gradient gần-đen của Strike"
```

---

### Task 3: GlassPill

**Files:**
- Modify: `src/components/ui/GlassPill.tsx`

**Interfaces:**
- Consumes: không có
- Produces: `GlassPill` giữ nguyên chữ ký `({ children, className?, innerClassName?, radius? })`

Chíp Chíp đổi một chặng của gradient ánh kim sang tím (`#C9BCEA`). Bản Strike dùng `#A6CEDA` — xanh nhạt. Port 1:1 nghĩa là trả lại giá trị gốc.

- [ ] **Step 1: Trả các chặng conic về đúng Strike**

Thay `METALLIC_BORDER_BG` bằng dải của Strike (khảo sát §1.5, `Strike/GlassPill.tsx:5-6`) — giữ nguyên `conic-gradient` đã sửa ở phiên trước, chỉ đổi chặng màu:

```ts
/**
 * Iridescent border. The many stops are the point: a two-stop gradient reads
 * as a flat outline, while the uneven steps catch the eye like brushed metal.
 */
const METALLIC_BORDER_BG =
  "conic-gradient(from 0deg at 50% 50%, #D9D9D9 0deg, #D9D9D9 65deg, #F2F2F2 150deg, #DFD0EA 176deg, #D9D9D9 204deg, #D9D9D9 255deg, #A6CEDA 285deg, #ECECEC 319deg, #D9D9D9 360deg)";
```

**Chú ý:** phải giữ `conic-gradient` — `linear-gradient` với color-stop đơn vị `deg` là CSS không hợp lệ, trình duyệt bỏ cả khai báo và viền không vẽ ra gì. Đây là lỗi đã sửa ở phiên trước, đừng làm lại.

- [ ] **Step 2: Kiểm tra kiểu, lint, test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch, 59 test pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/GlassPill.tsx
git commit -m "feat(design): viền ánh kim GlassPill trả về dải màu Strike"
```

---

### Task 4: Nền hai tầng

**Files:**
- Modify: `src/components/motion/MainSection.tsx`

**Interfaces:**
- Consumes: không có
- Produces: `MainSection` giữ nguyên chữ ký `({ children, transparent?, className? })`

Ngoại lệ được phép duy nhất với thư mục `motion/`: gradient nửa dưới trang đang là tông tím, cần đổi sang xám của Strike. Chỉ đổi chuỗi gradient, không đụng cấu trúc hay logic.

- [ ] **Step 1: Đổi gradient nửa dưới trang**

Thay chuỗi `backgroundImage` bằng bản Strike (khảo sát §1.5, `Strike/layout/MainSection.tsx:8`):

```ts
backgroundImage:
  "linear-gradient(0deg, rgba(242,242,242,0) 0%, rgb(224,224,224) 30.945%, rgb(215,215,215) 45.719%, rgb(255,255,255) 100%)",
```

- [ ] **Step 2: Kiểm tra kiểu, lint, test**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run`
Kỳ vọng: sạch, 59 test pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/MainSection.tsx
git commit -m "feat(design): gradient nửa dưới trang theo Strike"
```

---

### Task 5: Quét sạch màu tím còn sót

**Files:**
- Modify: mọi file `src/**/*.tsx` mà bước quét tìm ra

**Interfaces:**
- Consumes: token từ Task 1
- Produces: không đổi chữ ký component nào

Sau bốn task trên vẫn còn các chỗ tô tím trực tiếp bằng class Tailwind (`bg-brand-500`, `text-brand-600`, `border-brand-*`…) hoặc hex thô. Task này đưa chúng về token trung tính.

- [ ] **Step 1: Quét và liệt kê**

Chạy:
```bash
grep -rnE "brand-[0-9]{2,3}|indigo-[0-9]{2,3}|#7B2FBE|#9B66F5|#2B2FA8" src --include='*.tsx' --include='*.ts' --include='*.css' | grep -v "components/motion/tokens" | sort
```
Ghi lại toàn bộ kết quả vào báo cáo **trước khi sửa** — đây là danh sách công việc của task này.

- [ ] **Step 2: Thay từng chỗ về token trung tính**

Quy tắc thay:
- Nền nhấn đậm (`bg-brand-500`, `bg-brand-600`) → `bg-primary` (`#0D0D0D`)
- Chữ nhấn (`text-brand-600`, `text-brand-700`) → `text-accent` (`#314344`)
- Viền nhạt (`border-brand-*`) → `border-border` (đã có sẵn trong reset)
- Nền rất nhạt (`bg-brand-50`, `bg-brand-500/8`) → `bg-surface-muted` (`#EFEFEF`)

Chỗ nào không rơi vào bốn quy tắc trên thì **dừng lại và báo**, đừng tự quyết.

- [ ] **Step 3: Chạy lại lệnh quét**

Kỳ vọng: chỉ còn kết quả trong `src/components/motion/tokens.ts` (nếu có) và trong file test. Không còn class `brand-*` sống nào.

- [ ] **Step 4: Kiểm tra kiểu, lint, test, build**

Chạy: `npx tsc --noEmit && npx next lint --max-warnings=0 && npx vitest run && NODE_ENV=production npx next build`
Kỳ vọng: sạch cả bốn.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "refactor(design): thay màu tím còn sót bằng token trung tính"
```

---

### Task 6: Kiểm chứng bằng trình duyệt thật

**Files:**
- không sửa file nào

Task này không viết code. Mục đích: xác nhận giao diện công khai thật sự đã đổi và không vỡ ở đâu.

- [ ] **Step 1: Dựng và chạy**

```bash
NODE_ENV=production npx next build && npx next start -p 3100
```

- [ ] **Step 2: Kiểm ở 390 / 768 / 1440, cả hai ngôn ngữ**

Mở lần lượt `/vi`, `/en`, `/vi/bai-hoc`, `/vi/bai-hoc/dinh-nghia`, `/vi/dien-dan`, `/vi/gioi-thieu` và kiểm:

1. Nền trang là xám `#E5E5E5`, không còn ngả tím.
2. Nút chính là pill gần-đen có viền sáng chạy vòng, không còn gradient tím.
3. Viền ánh kim của glass pill **vẽ ra được** (kiểm `getComputedStyle(el).backgroundImage !== "none"`).
4. Không còn mảng tím nào lọt lưới — quét bằng mắt cả sáu trang.
5. Không tràn ngang ở cả ba bề rộng: `document.documentElement.scrollWidth <= window.innerWidth`.
6. Console 0 lỗi (bắn một `console.error` mồi trước để chắc công cụ bắt được log).
7. Nút đổi ngôn ngữ vẫn chạy trên trang chủ đề — đây là bug vừa vá, không được để tái phát.

- [ ] **Step 3: Dọn**

```bash
pkill -f "next start -p 3100"
```

---

## Hoàn thành

- [ ] Toàn bộ 6 task đã commit
- [ ] `npx vitest run` vẫn 59 test pass
- [ ] `npx tsc --noEmit`, `npx next lint --max-warnings=0`, `NODE_ENV=production npx next build` sạch
- [ ] Kiểm chứng trình duyệt đạt cả 7 mục ở cả ba bề rộng và hai ngôn ngữ
- [ ] Không file nào trong `src/components/motion/` bị đổi ngoài `MainSection.tsx`
- [ ] Không file nào thuộc tầng bảo mật bị đụng

# Thiết kế lại giao diện — Bước 3: thẻ bài, chip, phân trang, trạng thái rỗng

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Dựng họ thành phần của danh sách: TopicChip, DifficultyMark, PostCard v2 (thẻ, gọn, dòng), Pagination v2, EmptyState/ErrorState, CardReveal, rồi để Bài học, Blog và khối "Từ Blog" ở trang chủ dùng PostCard v2.

**Architecture:** Logic thuần (số chủ đề, mức độ khó, độ trễ hiện thẻ) nằm ở `src/lib/post-display.ts` có test. Thành phần dùng token của bước 1. `PostCard` được thay tại chỗ (mọi nơi import nó tự đổi). Không đổi schema, không thêm truy vấn.

**Tech Stack:** Next.js 14, TypeScript strict, Tailwind, next-intl, framer-motion, Vitest.

**Nguồn thiết kế:** `docs/thiet-ke-giao-dien/boards/Components.dc.html` (PostCard, chip, lọc, phân trang, rỗng), `Motion.dc.html` (M3 M4 M5 M10 M11 M12), `Summary.dc.html`, `Global-Shared.dc.html`, `Empty-VI-1280.dc.html` (hình chip). Tiếp nối `docs/superpowers/plans/2026-09-30-thiet-ke-lai-buoc-1-nen-tang.md` (đã merge).

## Quyết định đã chốt (30/09/2026)

| Điểm | Quyết định |
|---|---|
| Khối "Từ Blog" trang chủ | Dùng PostCard v2; giữ `TiltCard` nghiêng 3D và `ExpandingCardLink` |
| "Lọc ra rỗng" | Chỉ có nút Bỏ lọc; ô gợi ý có số đếm là prop tuỳ chọn, chưa nối dữ liệu, không thêm truy vấn Supabase |

## Ngoài phạm vi
Tô từ khoá `<mark>` ở dòng kết quả tìm kiếm (bước 6), VideoCard v2 (bước 5), Pagination của Blog (bước 5, Blog đang dùng bản riêng), cột chủ đề, bộ lọc phân đoạn, trang Bài học (bước 4). Không sửa migration.

## Giả định (ledger nếu đổi)
- **B1.** Bản vẽ không có hình riêng cho ErrorState: dùng cùng hình chip với `role="alert"` và nút thử lại.
- **B2.** Số cột của CardReveal (M3) không biết được từ CSS: dùng `index % 3` cho mọi cỡ màn hình; một cột thì trễ tối đa 0.19s, vô hại.
- **B3.** PostCard dạng gọn không phải prop: dưới 640px thẻ tự chuyển sang bố cục ngang bằng CSS (đúng bản vẽ).
- **B4.** Chữ "Đọc tiếp" của thẻ được thay bằng đĩa mũi tên (bản vẽ); thẻ vẫn là một liên kết duy nhất nên không mất thông tin.

## Ràng buộc chung
Mọi chuỗi qua `messages/{vi,en}.json` (cùng bộ khoá). Không dependency, phông, script mới. `EASE_STANDARD` và token thời lượng; mọi hiệu ứng có nhánh giảm chuyển động. Mục bấm ≥ 44px. Commit tiếng Anh, Conventional Commits, không dòng attribution. Không push khi chưa được phép. Sau mỗi task: typecheck + lint; sau task có test: `npm test`.

## Review Focus
- Thẻ không ảnh, không tóm tắt, tiêu đề rất dài (ba dòng), chip chủ đề tiếng Anh dài: các thẻ trong một hàng vẫn cao bằng nhau, không tràn.
- Thẻ Blog (không chủ đề, không độ khó) và bài học không có `topic` (`postHref` trả null → không vẽ thẻ).
- Pagination: trang đầu và cuối, `totalPages <= 1`, `page` ngoài khoảng; `aria-current`, `rel prev/next`; nút mũi tên ở đầu/cuối hiển thị mờ nhưng không phải liên kết.
- Trang chủ: thẻ Từ Blog vẫn nghiêng 3D và mở toàn màn hình; không lệch cao giữa ba thẻ; giảm chuyển động thì không nghiêng, không mở rộng.
- CardReveal khi giảm chuyển động hiện ngay, không kẹt `opacity: 0`.

## Files
| File | Việc |
|---|---|
| `src/lib/post-display.ts` + `.test.ts` (mới) | `topicNumber`, `difficultyLevel`, `revealDelay` |
| `src/components/ui/TopicChip.tsx`, `DifficultyMark.tsx` (mới) | Chip số + nhãn; 3 thanh + nhãn |
| `src/components/forum/PostCard.tsx` (sửa) | PostCard v2: thẻ (tự gọn dưới 640px) và `variant="row"` |
| `src/components/motion/CardReveal.tsx` (mới) + export ở `index.ts` | M3 |
| `src/components/listing/Pagination.tsx` (sửa) | Pagination v2 |
| `src/components/ui/EmptyState.tsx`, `ChipArt.tsx` (mới) | Rỗng và lỗi |
| `src/messages/{vi,en}.json` (sửa) | `pagination.summary` |
| `src/components/lessons/LessonsListing.tsx`, `src/app/[locale]/blog/page.tsx` (sửa nhỏ) | Bọc thẻ bằng CardReveal, dùng EmptyState |
| `src/app/ui-gallery/UiGalleryClient.tsx` (sửa) | Thêm các thành phần mới |

---

### Task 1: Logic thuần (TDD)
**Files:** tạo `src/lib/post-display.ts`, `src/lib/post-display.test.ts`.
**Interfaces:** `topicNumber(topic: TopicId): 1 | 2 | 3 | 4` (thứ tự trong `TOPIC_IDS` cộng 1); `difficultyLevel(d: Difficulty): 1 | 2 | 3` (basic 1, intermediate 2, advanced 3); `revealDelay(index: number, columns = 3): number` = `0.05 + (index % columns) * 0.07` (giây, làm tròn 2 số).
- [ ] Viết test lỗi cho cả ba (đủ 4 chủ đề và 3 mức; `revealDelay(0)=0.05`, `(1)=0.12`, `(2)=0.19`, `(3)=0.05`; `columns` 1 luôn 0.05). Chạy thấy FAIL.
- [ ] Cài đặt, chạy PASS. Typecheck + lint. Commit `feat(ui): add pure helpers for post cards`.

### Task 2: TopicChip và DifficultyMark
**Files:** tạo `src/components/ui/TopicChip.tsx`, `DifficultyMark.tsx`.
**Interfaces:** `TopicChip({ topic, label })` (số trong đĩa 20px + nhãn, nền `TOPIC_TONE[topic].soft`, viền `rgba(0,0,0,.08)`, chữ `#262626`, 12px 600, cắt `…` một dòng); `DifficultyMark({ level, label })` (ba thanh cao 5/8/12px, thanh đạt ngưỡng đặc, còn lại 25%, kèm nhãn 13px 600).
- [ ] Cài đặt theo `Components.dc.html` (`.tchip`, `.dm`). `aria-hidden` cho phần thanh, nhãn đọc được. Typecheck + lint. Commit `feat(ui): add TopicChip and DifficultyMark`.

### Task 3: PostCard v2
**Files:** sửa `src/components/forum/PostCard.tsx`.
**Interfaces:** giữ props `post`, `showTopic`, `expand`; thêm `variant?: "card" | "row"`. Vẫn trả `null` khi `postHref` null.
- [ ] Dạng thẻ (`.card`): padding 16, bo 16, ảnh 16:9 bo 12 (không ảnh: tấm chủ đề nền `soft` có số chủ đề chìm cho bài học; nền `surface-muted` cho Blog), chip chủ đề (khi `showTopic`), tiêu đề 18px 700 tối đa 3 dòng `min-h-[47px]`, tóm tắt 14px tối đa 3 dòng `min-h-[65px]`, chân thẻ (viền trên hairline): DifficultyMark, ngày, đĩa mũi tên 32px. Dưới 640px: bố cục gọn (ảnh vuông 96px bên trái, tóm tắt 2 dòng). Hover chỉ với `(hover:hover)`: viền `rgba(0,0,0,.2)`, `shadow-card-hover`, ảnh scale 1.03 (0.6s), đĩa đen, mũi tên +2px, các mục 0.3s `ease-standard`; nhấn scale 0.98 (0.2s); giảm chuyển động: chỉ đổi viền/bóng, bỏ scale và dịch.
- [ ] Dạng dòng (`.rrow`): không ảnh, hàng chip + độ khó + ngày, tiêu đề 18px, tóm tắt 2 dòng; cùng hover.
- [ ] Kiểm tra bằng trình duyệt trên Bài học, Blog, trang chủ (xem Review Focus). Typecheck + lint. Commit `feat(ui): PostCard v2 with card, compact and row layouts`.

### Task 4: CardReveal
**Files:** tạo `src/components/motion/CardReveal.tsx`; sửa `index.ts`.
**Interfaces:** `CardReveal({ index, columns?, className?, children })`.
- [ ] `whileInView` `fadeUp`-kiểu: opacity 0→1, `y` 20→0, 0.55s `EASE_STANDARD`, `delay = revealDelay(index, columns)`, `VIEWPORT_ONCE`; `useReducedMotion` thì render thẳng `div`. Bọc thẻ trong `LessonsListing` và lưới Blog. Typecheck + lint. Commit `feat(motion): add CardReveal for card grids`.

### Task 5: Pagination v2
**Files:** sửa `Pagination.tsx`, `messages/{vi,en}.json`.
- [ ] Thêm khoá `pagination.summary`: vi "Trang {page} trong {total}", en "Page {page} of {total}" (kiểm tra `keys-parity`). Ô 44px bo 12, hover viền `rgba(0,0,0,.2)`, mũi tên đầu/cuối hiển thị mờ 40% (không phải liên kết, `aria-disabled`), dòng tóm tắt dưới dãy nút (`aria-live="polite"`), `scroll-margin-top` do trang đặt. Chuyển màu 0.25s. Typecheck + lint + test. Commit `feat(listing): Pagination v2 with a page summary`.

### Task 6: EmptyState và ErrorState
**Files:** tạo `EmptyState.tsx`, `ChipArt.tsx`.
**Interfaces:** `EmptyState({ title, description, actions?, suggestions?, tone? })` với `tone: "empty" | "error"` (error: `role="alert"`, còn lại `role="status"`); `suggestions?: { label: string; count: number; href }[]` (chưa nối dữ liệu).
- [ ] Khung nét đứt `1.5px #A8A8A8` bo 24, nền `white/50`, `min-h-[400px]` (nhỏ hơn cho bản nhỏ), hình chip (SVG từ `Empty-VI-1280.dc.html`), vào trang bằng fadeUp 24px 0.6s (M12), giảm chuyển động thì hiện ngay. Dùng `Button` cho hành động. Thay ô rỗng cũ ở `LessonsListing` và Blog bằng `EmptyState`. Typecheck + lint. Commit `feat(ui): add EmptyState and ErrorState`.

### Task 7: Gallery, cổng chất lượng, tài liệu
- [ ] Thêm vào `/ui-gallery`: chip 4 chủ đề VI+EN, DifficultyMark, PostCard ba dạng (có ảnh, tấm chủ đề, Blog, tiêu đề dài), Pagination (đầu, giữa, cuối), EmptyState ba biến thể + lỗi. Kiểm tra ở 1280 và 390: không cuộn ngang, hàng thẻ cao đều, `checkVisibility`.
- [ ] `npm run typecheck`, `lint`, `npm test`, `npm run build` (nếu build vẫn không cho kết quả trong sandbox thì ghi rõ chưa xác nhận). Cập nhật `docs/BAN-GIAO.md`. Commit `docs: record step 3 of the interface redesign`. Review toàn nhánh bằng một reviewer độc lập.

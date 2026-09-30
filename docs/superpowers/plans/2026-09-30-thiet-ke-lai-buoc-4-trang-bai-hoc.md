# Thiết kế lại giao diện — Bước 4: trang Bài học và Bài học theo chủ đề

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Đưa bản vẽ trang Bài học vào mã: thẻ số liệu ba ô, cột chủ đề dạng thẻ có vòng số và số đếm (thu gọn thành rail 48px), bộ lọc độ khó dạng phân đoạn có ba thanh, dòng kết quả, gợi ý "Mới bắt đầu?", hàng chủ đề cuộn ngang trên di động, phân trang cuộn về đầu lưới. Cùng một `LessonsListing` phục vụ `/bai-hoc` và `/bai-hoc/[topic]`, nên cả hai trang đổi cùng lúc.

**Architecture:** Logic thuần (số liệu thẻ, đường dẫn "bắt đầu từ đây") ở `src/lib/lesson-listing.ts` có test. Thành phần mới ở `src/components/lessons/`: `TopicNav` (client: cột + rail + thu gọn + nhớ trạng thái), `TopicTrail` (client: hàng chip di động), `SegmentedFilter` (server). `TopicSidebar` cũ và `FilterPills` cho Bài học được thay; `FilterPills` giữ lại cho trang Video (bước 5). Không đổi schema, không thêm truy vấn.

**Tech Stack:** Next.js 14, TypeScript strict, Tailwind, next-intl, framer-motion, Vitest.

**Nguồn thiết kế:** `docs/thiet-ke-giao-dien/boards/Main.dc.html` (bố cục, CSS, chữ mẫu VI/EN), `Motion.dc.html` (M1 đến M13), `Summary.dc.html` (đổi gì và vì sao), `Collapsed-VI-1280.dc.html`, `Filtered-*`, `Empty-*`, `Data-*`, `Global-Shared.dc.html`. Tiếp nối bước 1 và 3 (đã ở `main`).

## Giả định (ghi ledger nếu đổi)
- **C1. M2 (đổi chủ đề chỉ mờ chữ hero):** bản vẽ muốn khung hero đứng yên khi chuyển chủ đề. Chuyển chủ đề đang là đổi route (`/bai-hoc` sang `/bai-hoc/[topic]`) nên trang dựng lại và hero vào lại bằng M1 (0.55s). Làm đúng M2 cần một layout chung kèm client component đọc segment; mình **không làm ở bước này**, chấp nhận hero vào lại. Chi phí nếu sai: một task riêng sau.
- **C2. Thẻ số liệu:** trang Bài học 3 ô (bài học, chủ đề, mức độ = 47 / 4 / 3 trong bản vẽ; số bài lấy từ dữ liệu thật, chủ đề 4 và mức độ 3 là hằng số). Trang chủ đề 2 ô (bài học của chủ đề, mức độ 3), theo Summary "Trang chủ đề chỉ hai ô".
- **C3. Gợi ý "Mới bắt đầu?":** liên kết tới chủ đề đầu tiên với mức Cơ bản, `/bai-hoc/dinh-nghia?difficulty=basic`.
- **C4. Số cột khi cột chủ đề thu gọn:** giữ 3 cột, thẻ rộng ra (bản vẽ chọn vậy; đổi sang 4 cột làm lưới nhảy cột lúc cột đang co).
- **C5. Ảnh bìa:** bài học chưa có ảnh dùng tấm chủ đề (đã có ở PostCard bước 3).
- **C6. Đếm theo độ khó:** vẫn hoãn (đã chốt): trạng thái "lọc ra rỗng" chỉ có nút Bỏ lọc.
- **C7. Không thêm hiệu ứng ngoài bảng Motion:** dùng M1 (đã có ở PageHero), M3 (CardReveal, đã có), M6 M7 M8 M9 M10 M11 M13.

## Ràng buộc chung
Mọi chuỗi qua `messages/{vi,en}.json` (cùng bộ khoá; viết vi trước để test parity đỏ). Không dependency, phông, script mới. Chỉ `EASE_STANDARD` và token thời lượng (`fast` 0.25s, `panel` 0.45s); mọi hiệu ứng có nhánh giảm chuyển động. Mục bấm ≥ 44px. Class Tailwind viết nguyên văn (không ghép bằng `${}`; `tailwind-classes.test.ts` canh). Không sửa migration. Commit tiếng Anh, Conventional Commits, không dòng attribution; không push khi chưa được phép. Sau mỗi task: typecheck + lint; sau task có test: `npm test`.

## Review Focus
- Thu gọn cột: rail vẫn điều hướng được (vòng số, tooltip trùng `aria-label`), nhãn không bị bẻ dòng khi đang co, trạng thái lưu ở `localStorage` không làm nhấp nháy lúc tải, và khi `localStorage` bị chặn cột vẫn mở.
- Nhãn chủ đề tiếng Anh dài ("What is a semiconductor") trong hàng 48px, chip di động và thẻ số liệu: không tràn, cho phép xuống hai dòng ở cột.
- Bộ lọc độ khó: ba thanh + nhãn, `aria-current`, lưới 2×2 ở 390px không cuộn ngang; đổi bộ lọc không cuộn trang (`scroll={false}`), đổi trang thì cuộn về `#danh-sach` chừa 6rem dưới thanh điều hướng.
- Dòng kết quả `aria-live="polite"` nói đúng số đang hiện, tổng và phạm vi (chủ đề hoặc "Tất cả chủ đề"), cả khi lọc ra rỗng.
- Cả hai trang (`/bai-hoc`, `/bai-hoc/[topic]`, và VI lẫn EN) vẫn 404 khi `page` vượt quá trang cuối và khi `topic` lạ; trang rỗng vẫn dùng `EmptyState`.
- Hàng chủ đề di động: chip đang chọn được đưa vào giữa; mép mờ chỉ là trang trí, không che chip.

## Files
| File | Việc |
|---|---|
| `src/lib/lesson-listing.ts` + `.test.ts` (mới) | `lessonHeroStats`, `startHereHref` |
| `src/messages/{vi,en}.json` (sửa) | chuỗi mới cho lessons |
| `src/components/lessons/SegmentedFilter.tsx` (mới) | Lọc phân đoạn có ba thanh |
| `src/components/lessons/TopicNav.tsx` (mới, thay `TopicSidebar.tsx`) | Cột chủ đề + rail + thu gọn |
| `src/components/lessons/TopicTrail.tsx` (mới) | Hàng chủ đề di động |
| `src/components/lessons/LessonsListing.tsx` (sửa) | Ráp lại bố cục |
| `src/components/lessons/TopicSidebar.tsx` (xoá sau khi không còn dùng) | Thay bằng TopicNav |
| `src/app/ui-gallery/*` (sửa) | Mẫu cho các thành phần mới |
| `docs/BAN-GIAO.md` (sửa) | Ghi bước 4 |

---

### Task 1: Logic thuần (TDD)
**Files:** tạo `src/lib/lesson-listing.ts`, `src/lib/lesson-listing.test.ts`.
**Interfaces:** `lessonHeroStats(input: { total: number; topic: TopicId | null }): { key: "lessons" | "topics" | "levels"; value: number }[]` (không chủ đề: lessons, topics `TOPIC_IDS.length`, levels `DIFFICULTIES.length`; có chủ đề: lessons, levels); `startHere(): { topic: TopicId; difficulty: Difficulty }` (`TOPIC_IDS[0]`, `DIFFICULTIES[0]`).
- [ ] Viết test lỗi: đủ hai dạng của `lessonHeroStats` (đúng thứ tự khoá và giá trị 4 và 3), `total` 0, và `startHere` = `dinh-nghia` + `basic` (và khớp phần tử đầu của hai hằng số). Chạy thấy FAIL; cài đặt; PASS. Typecheck + lint. Commit `feat(lessons): pure helpers for the lessons listing`.

### Task 2: Chuỗi mới
**Files:** sửa `src/messages/{vi,en}.json`.
- [ ] Thêm dưới `lessons` (vi trước để `keys-parity.test.ts` đỏ, rồi en): `stats.lessons` "Bài học"/"Lessons", `stats.topics` "Chủ đề"/"Topics", `stats.levels` "Mức độ"/"Levels", `hintLead` "Mới bắt đầu?"/"New here?", `hintLink` "Chọn chủ đề 1, mức Cơ bản"/"Start with topic 1, Basic", `result` "Hiển thị {shown} trong {total} bài · {scope}"/"Showing {shown} of {total} lessons · {scope}", `allTopicsScope` "Tất cả chủ đề"/"All topics", `listHeading` "Danh sách bài học"/"Lesson list". Commit `feat(i18n): strings for the redesigned lessons listing`.

### Task 3: SegmentedFilter
**Files:** tạo `src/components/lessons/SegmentedFilter.tsx`.
**Interfaces:** `SegmentedFilter({ label, options })` với `options: { key: string; label: string; href: ListingHref; active: boolean; difficulty?: Difficulty }[]`.
- [ ] Theo `.seg`: nhóm bo tròn, nền trắng, viền `#D1D1D1`, padding 4; mỗi mục là `Link` 44px, `scroll={false}`, chữ 14px 500, hover nền `surface-muted`, đang chọn nền `primary` chữ trắng (`aria-current="true"`); mục có `difficulty` hiện ba thanh (dùng `DifficultyMark` phần thanh, hoặc tách `DifficultyBars` dùng chung). Dưới `sm`: lưới 2×2 bo 20px. Chuyển màu 0.25s. Gallery: bốn trạng thái. Typecheck + lint. Commit `feat(lessons): add SegmentedFilter`.

### Task 4: TopicNav, TopicTrail
**Files:** tạo `src/components/lessons/TopicNav.tsx`, `TopicTrail.tsx`.
**Interfaces:** `TopicNav({ heading, collapseLabel, expandLabel, hint, entries })` với `entries: { key: string; label: string; count: number; href: ListingHref; active: boolean; topic: TopicId | null }[]` (mục đầu là "Tất cả", `topic: null`, biểu tượng lưới); `hint: { lead: string; link: string; href: ListingHref }`. `TopicTrail({ entries })` cùng kiểu `entries`.
- [ ] `TopicNav` (chỉ từ `lg`): tiêu đề 14px 700 + nút thu gọn 44px; thẻ trắng bo 16 padding 8; hàng `min-h-12` (48px) bo 12: vòng số 28px (số 1 đến 4, nền `TOPIC_TONE.soft`; "Tất cả" dùng biểu tượng lưới), nhãn (cho xuống hai dòng), số đếm; đang chọn nền đen; hover `surface-muted` 0.25s. Dòng gợi ý dưới thẻ. **Thu gọn:** cột 260px thành 48px trong 0.45s (`duration-panel ease-standard`), nhãn/số đếm/tiêu đề mờ dần 0.25s rồi `display: none`, khi mở lại trễ 0.2s; `white-space: nowrap` và `overflow: hidden` trong lúc chuyển. Rail: chỉ còn vòng số, mỗi cái có `aria-label`, `title` và bong bóng chú thích (mờ vào 0.25s, dịch −4px→0; hover trễ 0.1s; focus không trễ). Nhớ trạng thái ở `localStorage["chipchip.lessons.topicsCollapsed"]` (giữ khoá cũ), bật transition sau khung hình đầu, bọc `try/catch`. Giảm chuyển động: đổi tức thì.
- [ ] `TopicTrail` (dưới `lg`): hàng chip cuộn ngang, chip cao 44px (số + nhãn + đếm), chip đang chọn được đưa vào giữa bằng `scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" })` khi mount, `scroll-snap-type: x proximity`, mép phải mờ bằng mask (trang trí). Gallery: cả hai. Typecheck + lint. Commit `feat(lessons): add TopicNav with a collapsible rail and a mobile TopicTrail`.

### Task 5: Ráp lại LessonsListing
**Files:** sửa `LessonsListing.tsx`; xoá `TopicSidebar.tsx`.
- [ ] Hero: `PageHero` với `stats` từ `lessonHeroStats` (nhãn qua `t("stats.*")`), bỏ `HeroStat` con. Bố cục: `section#danh-sach`? Đặt `id="danh-sach"` và `scroll-mt-24` ở khối lưới. Cột trái `TopicNav` (từ `lg`), trên di động `TopicTrail`. Hàng đầu cột phải: nhãn "Độ khó" + `SegmentedFilter`, và bên phải dòng kết quả `role="status" aria-live="polite"` dùng `t("result", { shown, total, scope })`. `h2` `sr-only` `t("listHeading")`. Lưới 3 cột (1/2/3) như cũ với `CardReveal` và `PostCard`. `Pagination` với `hrefFor` thêm `hash: "danh-sach"`. Giữ nguyên các nhánh `notFound()`, `EmptyState` (trạng thái rỗng, lọc ra rỗng, chủ đề chưa có bài, trang trống). Thu dọn import không còn dùng.
- [ ] Kiểm tra bằng trình duyệt: `/vi/bai-hoc`, `/vi/bai-hoc/dinh-nghia`, `/en/lessons`, `/en/lessons/dinh-nghia` ở 1280 và 390px (xem Review Focus); danh sách rỗng vì không có dữ liệu, nên cột, bộ lọc, dòng kết quả, hero và EmptyState được xem trên trang thật, thẻ trong gallery. Typecheck + lint + test. Commit `feat(lessons): redesigned lessons listing`.

### Task 6: Cổng chất lượng, tài liệu, review
- [ ] `npm run typecheck`, `lint`, `npm test`, `npm run build` (nếu vẫn không cho kết quả thì ghi rõ chưa xác nhận). Cập nhật `docs/BAN-GIAO.md`. Review toàn nhánh bằng một reviewer độc lập (Opus), sửa lỗi nghiêm trọng bằng TDD, báo lỗi nhỏ hoãn.

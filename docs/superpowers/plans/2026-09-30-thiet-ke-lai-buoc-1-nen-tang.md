# Thiết kế lại giao diện — Bước 1: token và thành phần chung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (hoặc superpowers:subagent-driven-development) để làm từng task. Các bước dùng checkbox `- [ ]`.

**Goal:** Dựng nền cho bản thiết kế lại các trang công khai: token (màu, chữ, chuyển động), các thành phần dùng chung (Button, Field, Disclosure, Footer, PageHero v2), kiểm chứng được bằng test và một trang gallery chỉ có ở dev, mà không đổi nội dung hay luồng dữ liệu của trang nào.

**Architecture:** Token nằm ở `tailwind.config.ts` và `globals.css`; logic thuần (tương phản màu, gắn `aria-describedby`) tách ra file `.ts` để test bằng Vitest (môi trường `node`, chỉ chạy `*.test.ts`, không có test component). Thành phần mới là component mỏng dùng token, đặt ở `src/components/ui/`. Chỉ có Footer và PageHero là thành phần đã có sẵn nên bước này sửa tại chỗ (tác động lên mọi trang); Button, Field, Disclosure là thành phần mới, được xem trước ở `/ui-gallery` (dev) và sẽ được các trang dùng ở bước 3 trở đi.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, next-intl, framer-motion (đã có), Vitest.

**Nguồn thiết kế:** `docs/thiet-ke-giao-dien/HANDOFF.md`, `boards/Global-Shared.dc.html`, `boards/Summary.dc.html`, `boards/Components.dc.html`, `boards/Motion.dc.html`, `boards/Contact-FormSpecimen-VI-1280.dc.html`, `boards/About-Faq-VI-1280.dc.html`, `boards/Contribute-Spec-VI-1280.dc.html`, `boards/Main.dc.html` (PageHero). Các file `.dc.html` là đặc tả, không chạy được: đọc phần `<style>` và cấu trúc thẻ.
**Báo cáo hiện trạng:** `docs/BAO-CAO-GIAO-DIEN.md`.

## Phạm vi

Trong bước này: HANDOFF bước 1 (token) và bước 2 (Button, Field, Disclosure, Footer, PageHero v2).

**Ngoài phạm vi** (các bước sau, mỗi bước có kế hoạch riêng): PostCard, TopicChip, DifficultyMark, Pagination, EmptyState, CardReveal (bước 3); Bài học, Blog, Video, Tìm kiếm, Liên hệ, Giới thiệu, Đóng góp, Bảo mật, 404 (bước 4 đến 7); xoá `.rise-in`, `EASE_SCROLL_REVEAL`; truy vấn dữ liệu mới (đếm theo độ khó, `searchPosts` trả trạng thái lỗi, `sendMessage` trả mọi lỗi). **Không đụng** trang chủ, `PillButton` và hiệu ứng của trang chủ.

## Quyết định đã chốt (từ người bảo trì, 30/09/2026)

| Điểm | Quyết định |
|---|---|
| Phạm vi bước 1 | Token + Button, Field, Disclosure, Footer, PageHero v2 |
| Viền ô nhập | Một token `#767676` |
| Thông báo thành công | Màu nhấn `#314344` + dấu tích, nền `#F4F6F6` (theo bản vẽ bình luận Blog); đỏ chỉ dùng cho lỗi |
| Tài liệu | Đã commit vào nhánh `feat/thiet-ke-lai-giao-dien` (commit `fc1cd4e`) |

## Giả định cần bạn xác nhận khi duyệt kế hoạch

- **A1. Disclosure một mẫu:** lấy mẫu FAQ (hàng cao 60px, chữ 16px 600, dấu `+` trong đĩa 32px xoay 45° trong 0.25s, nền hover `#F5F5F5`). Mẫu "Báo lỗi bài" (hàng 52px, mũi tên xoay) và bộ lọc Video mobile sẽ chuyển sang mẫu này khi trang của chúng được làm. Thêm prop `size="sm"` (52px, chữ 14px) cho chỗ hẹp. Bản vẽ chưa chốt việc gộp này.
- **A2. Màu lỗi:** bản vẽ Liên hệ dùng chữ `#B42318`, viền `#D92D20`, nền `#FEF3F2`, chữ đậm `#912018`; bản vẽ Blog dùng `#B3261E`. Mình chọn bộ của Liên hệ (form là nơi lỗi hiện nhiều nhất).
- **A3. Nút chính:** thành phần mới `Button` (pill 44px, nền `#0D0D0D`, hover `#262626`, nhấn scale 0.98). `PillButton` (vệt sáng chạy viền) **giữ nguyên** cho trang chủ, Navbar và trang 404 hiện tại; 404 đổi sang `Button` ở bước 7. Việc "hover `#262626` áp dụng toàn site" hoàn tất khi các trang lần lượt dùng `Button`.
- **A4. Chuyển động PageHero:** dùng CSS thuần (keyframe + `animation-delay`), không dùng framer-motion, để PageHero vẫn là Server Component. Giá trị đúng như bảng M1 của bản vẽ: 4 phần tử, dịch 20px, 0.55s, `EASE_STANDARD`, trễ 0.1/0.22/0.34/0.46s.
- **A5. Tài liệu bản vẽ không có bản cho:** hover khi bật giảm chuyển động của Field/Button; mình áp dụng quy tắc chung (chỉ đổi màu, không dịch chuyển).

## Ràng buộc chung (áp dụng cho mọi task)

- Mọi chuỗi hiển thị qua `messages/{vi,en}.json`, cùng bộ khoá. **Bước này không thêm khoá mới:** nhãn, gợi ý, lỗi do nơi gọi truyền vào; gallery là trang dev nên viết cứng như `motion-gallery`.
- Không thêm phông, script, host ảnh, dependency. Không sửa migration. Không sửa trang chủ.
- Chuyển động dùng `EASE_STANDARD` và token thời lượng; mọi hiệu ứng có nhánh `prefers-reduced-motion`.
- Mục bấm cao tối thiểu 44px; chữ nhỏ nhất 12px; viền focus `2px #314344`, cách 2px.
- Code, comment, commit bằng tiếng Anh; Conventional Commits; **không** dòng attribution (theo `CLAUDE.md` của dự án). Chỉ commit trên nhánh này; **không push** khi chưa được bạn cho phép.
- Sau mỗi task: `npm run typecheck && npm run lint`; sau task có test: `npm test`.

## Review Focus

- Chữ trắng trên nút chính `#0D0D0D` và `#262626`; `#767676` trên trắng và trên nền xám `#E5E5E5`; chữ lỗi `#B42318` trên nền `#FEF3F2`: tương phản phải đạt ngưỡng (Task 1 có test tính toán).
- Ô nhập ở trạng thái lỗi vẫn nối đúng `aria-describedby` tới cả gợi ý lẫn thông báo lỗi, và `aria-invalid`.
- Nút "bận" không gửi trùng: `aria-disabled` giữ focus tại chỗ, bấm không kích hoạt.
- PageHero khi bật giảm chuyển động phải hiện ngay (không bị kẹt `opacity: 0` trong lúc chờ `animation-delay`).
- Footer đổi liên kết thành 44px không làm vỡ bố cục 3 cột và khi `SocialLinks` rỗng; giữ `relative z-20` (comment trong file nói lý do).

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `tailwind.config.ts` (sửa) | Token màu, chữ, easing, thời lượng, bóng focus |
| `src/app/globals.css` (sửa) | Keyframe `hero-in` + nhánh giảm chuyển động; giữ `.rise-in` |
| `src/lib/contrast.ts` (mới) | Tính tỉ lệ tương phản WCAG (thuần) |
| `src/lib/design-tokens.test.ts` (mới) | Test tương phản và đồng bộ easing giữa Tailwind và `tokens.ts` |
| `src/components/ui/Button.tsx` (mới) | Nút v2: chính, phụ, trên nền tối; bận; mũi tên |
| `src/components/ui/form/describedBy.ts` (mới) + `.test.ts` | Gắn `aria-describedby` (thuần) |
| `src/components/ui/form/Field.tsx` (mới) | Nhãn + ô nhập/textarea + gợi ý + lỗi |
| `src/components/ui/form/FormNotice.tsx` (mới) | Thông báo lỗi, thành công, ghi chú |
| `src/components/ui/form/RadioSegment.tsx` (mới) | Nhóm radio dạng phân đoạn |
| `src/components/ui/Disclosure.tsx` (mới) | `<details>` một mẫu duy nhất |
| `src/components/layout/Footer.tsx` (sửa) + `FooterNav.tsx` (mới) | Liên kết 44px, trạng thái trang hiện tại |
| `src/components/sections/PageHero.tsx` (sửa) | PageHero v2 + `HeroStats` |
| `src/app/ui-gallery/page.tsx` + `UiGalleryClient.tsx` (mới) | Xem thành phần ở dev; 404 ở production |
| `src/app/robots.ts` (sửa) | Thêm `/ui-gallery` vào disallow |

---

### Task 1: Token và bộ kiểm tra tương phản (TDD)

**Files:** sửa `tailwind.config.ts`; tạo `src/lib/contrast.ts`, `src/lib/design-tokens.test.ts`.

**Interfaces:**
- Produces: `contrastRatio(fg: string, bg: string): number` (nhận `#RRGGBB`), và các token Tailwind: màu `field` `#767676`, `field-hover` `#4D4D4D`, `primary-hover` `#262626`, `disabled` `#5F5F5F`, `surface-hover` `#F5F5F5`, `hairline` `#EAEAEA`, `err` `#B42318`, `err-border` `#D92D20`, `err-soft` `#FEF3F2`, `err-ink` `#912018`, `ok-soft` `#F4F6F6`; `fontSize` `h1` (34/1.1), `h1-lg` (46/1.1), `h2` (26/1.2), `h2-lg` (38/1.2) đều 800 và `-0.03em`/`-0.02em`; `transitionTimingFunction.standard` = `cubic-bezier(0.25, 0.1, 0.25, 1)`; `transitionDuration` `fast` 250ms, `card` 300ms, `panel` 450ms; `boxShadow["field-focus"]` = `0 0 0 2px #fff, 0 0 0 4px #314344`.

- [ ] **Step 1: Viết test lỗi** `src/lib/design-tokens.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";
import { contrastRatio } from "@/lib/contrast";
import { EASE_STANDARD } from "@/components/motion/tokens";

const colors = config.theme!.extend!.colors as Record<string, string>;

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("colour tokens meet their contrast targets", () => {
  it("keeps the field border readable on white and on the grey page", () => {
    expect(contrastRatio(colors.field, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.field, colors.bg)).toBeGreaterThanOrEqual(3);
  });

  it("keeps white text on both primary button states above 7:1", () => {
    expect(contrastRatio("#FFFFFF", colors.primary)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio("#FFFFFF", colors["primary-hover"])).toBeGreaterThanOrEqual(7);
  });

  it("keeps white text on the busy button above 4.5:1", () => {
    expect(contrastRatio("#FFFFFF", colors.disabled)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps error text readable on its soft background and on white", () => {
    expect(contrastRatio(colors.err, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors["err-ink"], colors["err-soft"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps accent text readable on the success background", () => {
    expect(contrastRatio(colors.accent, colors["ok-soft"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("motion tokens stay in sync with Tailwind", () => {
  it("uses the same easing curve in CSS and in framer-motion", () => {
    const easing = config.theme!.extend!.transitionTimingFunction as Record<string, string>;
    expect(easing.standard).toBe(`cubic-bezier(${EASE_STANDARD.join(", ")})`);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL.** `npx vitest run src/lib/design-tokens.test.ts` (thiếu `contrast.ts` và token).

- [ ] **Step 3: Cài đặt.** `src/lib/contrast.ts`:

```ts
function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

/** WCAG 2.x contrast ratio between two `#RRGGBB` colours (1 to 21). */
export function contrastRatio(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
```

Thêm token vào `tailwind.config.ts` đúng danh sách ở mục Interfaces (mở rộng `colors`, thêm `fontSize`, `transitionTimingFunction`, `transitionDuration`, `boxShadow["field-focus"]`; không đổi giá trị token cũ). Ghi chú "vì sao" ngắn ở chỗ `field` (ví dụ: `#8C8C8C` chỉ đạt trên trắng, không đạt trên nền xám của trang).

- [ ] **Step 4: Chạy, xác nhận PASS.** Nếu một ngưỡng không đạt, **báo lại giá trị thật**, không hạ ngưỡng để cho qua (theo quy tắc: không làm yếu test).
- [ ] **Step 5: typecheck + lint.**
- [ ] **Step 6: Commit** `feat(design): add colour, type and motion tokens with contrast tests`.

---

### Task 2: Keyframe `hero-in` và PageHero v2

**Files:** sửa `src/app/globals.css`, `src/components/sections/PageHero.tsx`.

**Interfaces:**
- Consumes: token `text-h1`, `text-h1-lg`, `hairline`, `ease-standard` (Task 1).
- Produces: `PageHero` giữ props cũ (`eyebrow`, `title`, `description`, `children`, `className`, `backdropImage`, `backdropVideo`) và thêm `stats?: { value: number | string; label: string }[]`. Xuất `HeroStats({ stats })` (thẻ số liệu 1 đến 3 ô) và giữ `HeroStat({ value, label })` dưới dạng thẻ một ô để 3 trang đang dùng (Blog, Video, Bài học) không phải sửa ngay.

- [ ] **Step 1: CSS.** Thêm vào `globals.css` (sau `.rise-in`, giữ nguyên `.rise-in` vì Giới thiệu và Liên hệ còn dùng):

```css
/* PageHero entrance (design M1): four items in turn, same rhythm as the home
   hero. Plain CSS so PageHero stays a Server Component. */
@keyframes hero-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: none; }
}
.hero-in {
  animation: hero-in 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) both;
  animation-delay: calc(0.1s + var(--i, 0) * 0.12s);
}
/* The global reduce block only shortens durations. The delay would still hold
   the item at opacity 0, so switch the animation off entirely. */
@media (prefers-reduced-motion: reduce) {
  .hero-in { animation: none; }
}
```

(Chỗ đặt: bên cạnh khối `@media (prefers-reduced-motion: reduce)` toàn cục cuối file nếu thuận hơn; đọc file trước khi sửa.)

- [ ] **Step 2: PageHero.** Đọc `PageHero.tsx` hiện tại rồi sửa: mỗi phần tử (chip, `h1`, mô tả, thẻ số liệu) nhận `className="hero-in"` và `style={{ "--i": n }}` với `n` là 0, 1, 2, 3. Bỏ `rise-in` khỏi khối bọc. Chip thêm `max-w-full` và chữ bên trong `truncate`. `h1`: `text-h1 md:text-h1-lg` thay cho `text-[34px] md:text-[46px]`. Thẻ số liệu theo `Main.dc.html`: `dl` nền trắng, viền `#D1D1D1`, bo 16, padding `14px 8px`; mỗi ô `padding 0 24px`, ngăn cách bằng viền trái; số 24px 800 `tabular-nums`, nhãn 12px `text-text-muted`; dưới 640px ba ô chia đều. Không đổi phần nền `backdropImage`/`backdropVideo`.

- [ ] **Step 3: Kiểm tra bằng trình duyệt** (`NODE_ENV=development npx next dev`, không chạy build cùng lúc): mở `/vi/bai-hoc`, `/vi/blog`, `/vi/video`, `/vi/dong-gop`, `/vi/chinh-sach-bao-mat`, `/vi/tim-kiem` ở 1280px và 390px. Với mỗi trang: `checkVisibility()` của h1 và thẻ số liệu là `true` sau 1 giây; không cuộn ngang; đổi bộ lọc/số trang không chạy lại hiệu ứng (quan sát bằng cách thêm `?page=2`).
- [ ] **Step 4: typecheck + lint.**
- [ ] **Step 5: Commit** `feat(pages): PageHero v2 with staggered entrance and stats card`.

---

### Task 3: Button

**Files:** tạo `src/components/ui/Button.tsx`.

**Interfaces:**
- Consumes: `cn` từ `@/lib/utils`, `Link` từ `@/i18n/navigation`, token Task 1.
- Produces: `Button(props)` với `variant?: "primary" | "secondary" | "onDark"` (mặc định `primary`), `arrow?: boolean`, `busy?: boolean`, và hoặc `href` (dùng `Link` nội bộ) hoặc `onClick`/`type` (nút). Cao tối thiểu 44px, `rounded-full`, `px-[22px]`, chữ 14px 600.

- [ ] **Step 1: Cài đặt.** Quy tắc theo `Contact-FormSpecimen`: `primary` nền `bg-primary text-white hover:bg-primary-hover`; `secondary` nền trắng, viền `border-border`, hover `border-black/25`; `onDark` nền trắng, chữ `accent`, hover `bg-white/90` (dùng cho khối đen ở Giới thiệu); `transition-colors duration-fast ease-standard`; `active:scale-[0.98]` chỉ khi không giảm chuyển động (`motion-reduce:active:scale-100`); focus `outline-2 outline-offset-2 outline-accent`. `busy`: `aria-disabled="true"`, nền `bg-disabled text-white`, `cursor-progress`, chặn `onClick` và điều hướng, **không** dùng thuộc tính `disabled` để không mất focus. Mũi tên dùng `ArrowRight` của `lucide-react` (đã có).
- [ ] **Step 2: typecheck + lint.**
- [ ] **Step 3: Commit** `feat(ui): add Button with primary, secondary, on-dark and busy states`.

---

### Task 4: Họ Field (TDD cho phần thuần)

**Files:** tạo `src/components/ui/form/describedBy.ts`, `describedBy.test.ts`, `Field.tsx`, `FormNotice.tsx`, `RadioSegment.tsx`.

**Interfaces:**
- Produces: `describedBy(ids: { hint?: string; error?: string }): string | undefined` (ghép id còn tồn tại, cách nhau dấu cách, hoặc `undefined`); `Field({ label, hint?, error?, optionalNote?, children })` với `children` là hàm nhận `{ id, "aria-describedby", "aria-invalid" }` để gắn vào `Input` hoặc `Textarea` (xuất kèm, cùng style); `FormNotice({ tone: "error" | "success" | "note", title?, children })` (`role="alert"` cho error, `role="status"` cho success/note); `RadioSegment({ legend, name, options, value, onChange })`.

- [ ] **Step 1: Test lỗi** `describedBy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { describedBy } from "@/components/ui/form/describedBy";

describe("describedBy", () => {
  it("joins the ids that exist, hint first", () => {
    expect(describedBy({ hint: "h", error: "e" })).toBe("h e");
  });
  it("skips missing ids", () => {
    expect(describedBy({ error: "e" })).toBe("e");
    expect(describedBy({ hint: "h" })).toBe("h");
  });
  it("returns undefined when there is nothing to describe", () => {
    expect(describedBy({})).toBeUndefined();
  });
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL.** Cài `describedBy.ts`, chạy lại, PASS.
- [ ] **Step 3: Component.** Theo `Contact-FormSpecimen`:
  - `Input`/`Textarea`: cao 44px (textarea tối thiểu 120px), `rounded-xl`, viền `border-field`, chữ 14px (`text-base md:text-sm` để tránh iOS zoom giữ như hiện nay), hover `border-field-hover`, focus `shadow-field-focus border-accent outline-none`, `aria-invalid=true` thì `border-err-border` + `shadow-[inset_0_0_0_1px] shadow-err-border`, `disabled/readOnly` nền `bg-surface-muted text-disabled border-border`.
  - `Field`: nhãn 14px 600 đúng `<label htmlFor>`, gợi ý 13px `text-text-muted`, lỗi 13px 500 `text-err` kèm icon (không chỉ dựa vào màu). Id sinh bằng `useId`.
  - `FormNotice`: `error` nền `bg-err-soft` viền `border-err-border` chữ `text-err-ink`; `success` nền `bg-ok-soft` viền `border-accent` chữ `text-accent` với dấu tích; `note` nền `bg-surface-muted` viền `border-border`. Vào bằng fade 0.25s (`animate` CSS ngắn), giảm chuyển động thì tắt.
  - `RadioSegment`: `fieldset` + `legend`, input radio thật ẩn bằng `sr-only`, mục đang chọn nền đen kèm dấu tích, hover `bg-surface-muted`, focus-visible viền; mobile lưới 2 cột.
  - **Ô bẫy `website` không thuộc thành phần này:** giữ nguyên ở `MessageForm`/`CommentSection` khi các trang được chuyển sang.
- [ ] **Step 4: typecheck + lint + `npm test`.**
- [ ] **Step 5: Commit** `feat(ui): add Field, FormNotice and RadioSegment with a shared accessibility contract`.

---

### Task 5: Disclosure

**Files:** tạo `src/components/ui/Disclosure.tsx`.

**Interfaces:** `Disclosure({ summary: ReactNode; size?: "md" | "sm"; defaultOpen?: boolean; children })`. Dựng bằng `<details>`/`<summary>` (giữ hành vi native: hoạt động khi tắt JS).

- [ ] **Step 1: Cài đặt** theo `About-Faq`: hàng `min-h-[60px]` (`sm`: 52px, chữ 14px), padding `12px 16px 12px 20px`, chữ 16px 600, `summary` ẩn marker, hover `bg-surface-hover text-accent`, focus-visible `outline-2 -outline-offset-2 outline-accent`, dấu `+` trong đĩa 32px viền `border-border` xoay 45° khi mở và đổi sang nền đen chữ trắng, chuyển 0.25s `ease-standard` (`motion-reduce:transition-none`); nội dung `padding 0 68px 20px 20px`, chữ 16px `text-text-muted`, vào bằng fade 0.25s. Không hoạt hoạ chiều cao (đúng như bản vẽ).
- [ ] **Step 2: typecheck + lint.**
- [ ] **Step 3: Commit** `feat(ui): add a single Disclosure component`.

---

### Task 6: Footer

**Files:** sửa `src/components/layout/Footer.tsx`; tạo `src/components/layout/FooterNav.tsx`.

**Interfaces:** `FooterNav({ label, links })` (client) với `links: { key: string; href: StaticPathname; text: string }[]`, dùng `usePathname` của `@/i18n/navigation` để đặt `aria-current="page"` và kiểu `font-semibold text-text` cho liên kết của trang hiện tại; liên kết `inline-flex min-h-11 items-center px-1`.

- [ ] **Step 1: Cài đặt.** Footer (server) truyền văn bản đã dịch (`t("links.contact")`…) xuống `FooterNav`. **Giữ nguyên** lớp `relative z-20 border-t border-border bg-surface`, lưới `1fr auto 1fr`, khối `SocialLinks` và toàn bộ comment giải thích `z-20`. Chỉ thay khối `<nav>` liên kết.
- [ ] **Step 2: Kiểm tra bằng trình duyệt:** ở `/vi/lien-he`, liên kết "Liên hệ" có `aria-current="page"`; chiều cao mỗi liên kết ≥ 44px (`getBoundingClientRect().height`, chấp nhận vì đây là mục tiêu bấm chứ không phải kiểm bố cục); bố cục 3 cột không vỡ ở 1280px, xếp dọc ở 390px; footer vẫn hiện trên trang chủ (không bị `SceneFillOverlay` che, `checkVisibility()` và chụp màn hình).
- [ ] **Step 3: typecheck + lint.**
- [ ] **Step 4: Commit** `feat(layout): footer links at 44px with a current-page state`.

---

### Task 7: Trang gallery chỉ có ở dev

**Files:** tạo `src/app/ui-gallery/page.tsx`, `src/app/ui-gallery/UiGalleryClient.tsx`; sửa `src/app/robots.ts`.

- [ ] **Step 1: Trang.** Theo đúng mẫu của `src/app/motion-gallery/page.tsx`: `notFound()` khi `NODE_ENV === "production"`, `metadata.robots` noindex. Client hiển thị: mọi biến thể `Button` (primary, secondary, onDark trên khối đen, busy), `Field` ở các trạng thái (mặc định, hover, focus, lỗi, chỉ đọc, textarea dài), `FormNotice` ba tông, `RadioSegment` (VI và EN dài), `Disclosure` (md và sm, đóng và mở), `PageHero` (có thẻ 1 ô và 3 ô, chip dài). Chữ viết cứng bằng tiếng Việt, không qua i18n (như `motion-gallery`).
- [ ] **Step 2: robots.** Thêm `"/ui-gallery"` vào mảng `disallow`.
- [ ] **Step 3: Kiểm tra bằng trình duyệt** ở 1280px và 390px: chụp ảnh từng khối; `Tab` qua từng phần tử và thấy viền focus 2px; focus vào ô lỗi thấy đồng thời viền đỏ và vòng focus; với `Field` lỗi, `aria-describedby` trỏ đúng hai phần tử tồn tại (`evaluate_script`).
- [ ] **Step 4: typecheck + lint.**
- [ ] **Step 5: Commit** `feat(dev): add a UI gallery for the shared components`.

---

### Task 8: Cổng chất lượng và báo cáo

- [ ] **Step 1:** Dừng dev server, rồi `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`. Kỳ vọng xanh. Lưu ý đã biết: `npm run build` từng dừng im lặng trong sandbox của phiên trước (không có `BUILD_ID`); nếu lặp lại, **báo rõ là chưa xác nhận được build** và đưa lệnh để bạn chạy, không báo xanh.
- [ ] **Step 2: Kiểm tra hồi quy trang chủ.** `/vi` ở 1280px và 390px trông như trước (hero, các khối, footer), không lỗi console.
- [ ] **Step 3: Cập nhật `docs/BAN-GIAO.md`** một mục ngắn: bước 1 đã xong, danh sách thành phần mới, quyết định A1 đến A5, và việc còn lại theo `HANDOFF.md` (bước 3 trở đi).
- [ ] **Step 4: Commit** `docs: record step 1 of the interface redesign`. Báo cáo cuối: số file, kết quả từng lệnh, các điểm lệch so với bản vẽ và lý do.

---

## Tự rà soát

- **Bao phủ HANDOFF bước 1 và 2:** token (Task 1), Button (3), Field (4), Disclosure (5), Footer (6), PageHero v2 (2). Phần "Cần chốt trước khi code": mục 1 (viền ô nhập), 2 (thành công), 5 (chân trang và hover nút chính) đã có; mục 3 (Disclosure) là giả định A1; mục 4 (Video sáng mục nào), 6 (nền hero Blog), 7 (tìm kiếm không phân trang) thuộc các bước sau, **chưa cần chốt ở bước này**.
- **Điểm lệch có chủ đích so với bản vẽ:** thông báo thành công theo quyết định của bạn (bản vẽ mẫu form còn vẽ xanh lá); `PillButton` giữ nguyên (A3); PageHero dùng CSS thay vì framer-motion (A4).
- **Không có placeholder:** giá trị token, thời lượng, kích thước đều lấy từ bản vẽ; chỗ chưa chắc đã đưa vào mục Giả định.
- **Rủi ro:** đổi PageHero tác động 7 trang cùng lúc (bù bằng kiểm tra từng trang ở Task 2); đổi Footer tác động mọi trang (bù bằng kiểm tra trang chủ vì `z-20`).

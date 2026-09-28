# DA4 — Uy tín và Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người đọc biết ai làm Chíp Chíp và vì sao, thấy mục đích minh bạch (4 cam kết, FAQ, chính sách bảo mật), có đường liên hệ (`/lien-he`), đóng góp (`/dong-gop`) và "Báo lỗi bài này" ở mọi bài; thẻ blog phóng to tại chỗ rồi mới chuyển trang.

**Architecture:** Mọi tin gửi `/api/messages` (route có sẵn từ DA1) đi qua một module thuần `src/lib/contact-client.ts` (dựng payload, kiểm trước ở trình duyệt, đọc mã lỗi, bắt lỗi mạng với `fetch` được truyền vào) và một client component duy nhất `MessageForm` với hai biến thể: `contact` (trang Liên hệ) và `report` (bọc trong `<details>` của `ReportMistake`, gửi `content_error` + `postId`). Trang Giới thiệu, Đóng góp, Chính sách bảo mật và footer là Server Component; câu chữ nằm trong `messages/{vi,en}.json`, nội dung mẫu ghi trong ngoặc vuông và được liệt kê trong README. Thẻ blog nở ra bằng `ExpandingCardLink` (client): chỉ click trái không kèm phím (`isPlainLeftClick`) mới chạy hiệu ứng `layout` của Motion trên một tấm nền portal ra `<body>`, 400 ms rồi `router.push`.

**Tech Stack:** Next.js 14.2 App Router · next-intl 4 (`pathnames` bản địa hoá) · framer-motion 12 (`layout`) · Tailwind 3.4 · lucide-react · Supabase (chỉ qua `/api/messages` có sẵn) · Vitest 2 (môi trường `node`, chỉ `src/**/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-09-28-da4-uy-tin-blog-design.md` (nền: DA1 `/api/messages` + bảng `messages`, DA2, DA3; lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md`)

## Global Constraints

- **Không thêm dependency. Không đổi schema DB** (không migration mới; `/api/messages`, bảng `messages`, `consume_rate_limit` đã có). Không `db reset`, không `--linked`, không `db push`.
- Chuỗi giao diện công khai qua `src/messages/{vi,en}.json` (namespace `about`, `contact`, `contribute`, `privacy`, cộng `footer.links`), hai file **cùng tập khoá** (test `src/messages/keys-parity.test.ts` sẵn có). Nội dung mẫu cần thay tự ghi rõ trong câu chữ, dạng "[Tên tác giả]"; README có mục "Nội dung cần thay trước khi ra mắt" liệt kê mọi khoá và hằng số cần thay ở DA5.
- Bảng màu xám trung tính, không tím, không pastel; chữ đạt WCAG AA; vùng bấm tối thiểu 44 px (`min-h-11` / `size-11` / `h-11`).
- Chuyển động dùng token ở `src/components/motion/tokens.ts` (`EASE_STANDARD`) và tắt khi `prefers-reduced-motion` (`useReducedMotion`, `motion-reduce:transition-none`).
- Server Components mặc định. JS phía client **chỉ** ở: form Liên hệ và form báo lỗi (cùng là `MessageForm`), thẻ blog nở ra (`ExpandingCardLink`). FAQ và nút "Báo lỗi bài này" mở/đóng bằng `<details>` gốc, không JS.
- Kiểm ở biên: server vẫn là `parseMessagePayload` (không đổi hành vi); trình duyệt kiểm lại cùng giới hạn (tên 1–80, email ≤ 254 và đúng dạng, nội dung 1–4000) bằng `MESSAGE_LIMITS`/`EMAIL_PATTERN` dùng chung. Thoát dữ liệu theo nơi dùng: mọi chuỗi qua React; không `dangerouslySetInnerHTML` mới.
- TypeScript strict (`noUncheckedIndexedAccess` đang bật): không `any`, không `!`, không `@ts-ignore`/`eslint-disable`. Code, comment, commit: tiếng Anh; comment chỉ giải thích *vì sao*. Không trailer attribution trong commit.
- Không stage `.env.example` (sandbox không đọc được, git báo nhầm là đã xoá), `.env.local`, `.commandcode/`, `.crossweave/`, `.claude/`. Luôn `git add` theo đường dẫn cụ thể.
- Cổng kiểm: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build` (build cần `allowed_domains` `fonts.googleapis.com`, `fonts.gstatic.com`). Trong sandbox build có thể gặp EPERM khi đọc file env local — chạy lại đúng lệnh đó với sandbox tắt.
- **`next build` trong sandbox đôi khi thoát 0 giữa chừng** ngay sau `Creating an optimized production build ...`, không in bảng route (đã gặp ở DA3 và lại gặp khi lập plan này). Build chỉ tính là xanh khi log có bảng route và dòng `○  (Static)`; nếu không có, `rm -rf .next` rồi chạy lại (tối đa 5 lần), ghi số lần vào báo cáo.
- **Không chạy `next build` khi `next dev` đang dùng cùng thư mục `.next`** — dừng dev server trước (build ghi đè `.next` và làm dev server hỏng giữa chừng).
- Bài học từ các DA trước, áp dụng ở đây:
  - `<details>` đang đóng ẩn nội dung bằng `::details-content { content-visibility: hidden }`; CSS kiểu `lg:!flex` trên con **không** ép hiện được. Cần luôn hiện ở một breakpoint thì render một bản riêng không nằm trong `<details>`. (DA4 không có chỗ nào cần luôn hiện — FAQ và báo lỗi đều mặc định đóng ở mọi kích thước.)
  - `useSearchParams()` trong client component cần `<Suspense>` (Next 14 `missingSuspenseWithCSRBailout`); ưu tiên truyền giá trị từ server. DA4 không dùng `useSearchParams`.
  - Kiểm trên trình duyệt bằng `el.checkVisibility()` hoặc ảnh chụp, không bằng bounding box.

## Đo thực tế trước khi lập plan

Toàn bộ code trong plan này đã được chạy trong một bản sao repo ngoài thư mục dự án (`$TMPDIR/da4-scratch`, ngày 28/09/2026, trên commit `ced9217`):

- `tsc --noEmit`: 0 lỗi · `next lint`: `✔ No ESLint warnings or errors` · `vitest`: **324 test** PASS (285 trước DA4) · `next build`: xanh ở lần chạy thứ 2 (lần 1 thoát giữa chừng như ghi ở Global Constraints); bảng route có `● /[locale]/lien-he`, `● /[locale]/dong-gop`, `● /[locale]/chinh-sach-bao-mat`, `● /[locale]/gioi-thieu` (SSG — không trang nào mới đọc cookie).
- `next dev` trên bản sao (không có Supabase): `/vi/gioi-thieu`, `/en/about`, `/vi/dong-gop`, `/en/contribute`, `/vi/chinh-sach-bao-mat`, `/en/privacy`, `/en/contact` trả 200; canonical `/en/privacy` đúng; FAQ: nội dung `checkVisibility()` = `false` khi đóng, `true` sau khi bấm `summary`, đóng lại được; `summary` cao 56 px; chữ cái đầu "[Tên tác giả]" hiện "TG". Form Liên hệ: gửi rỗng → "Please enter your name (up to 80 characters)." (không có request); gửi đủ → route trả 503 `server_not_configured` → "Your message was not sent…"; nút gửi cao 44 px; mọi `label[for]` trỏ tới ô tồn tại.
- Thẻ nở ra (trang thử tạm, đã xoá): trang cuộn 500 px, thẻ ở `[352, 216, 312×160]`; tấm nền đo được `[348,214,319×166]` ở 16 ms → `[36,22,952×706]` ở 250 ms → `[1,0,1023×767]` ở 380 ms (viewport 1024×768), rồi chuyển sang `/vi/blog/b`; tấm nền biến mất sau khi chuyển trang và không còn khi bấm Back. Ctrl+click: React **không** `preventDefault`, không có tấm nền.
- `consume_rate_limit` (migration `20260913000000_harden_access.sql`) xoá mọi dòng `comment_rate_limit` cũ hơn `now() - interval '1 day'` mỗi lần được gọi; khoá là `hashIp` = SHA-256 của `ip:salt` (`src/lib/rate-limit.ts`). `/api/messages` dùng scope `message`, 3 tin / 60 phút; `/api/comments` dùng scope `comment`.
- `author_email` của bình luận không bao giờ được select cho client; `messages` chỉ staff đọc được (RLS). Không có code gửi email nào trong repo (`grep -rln "resend\|nodemailer\|sendMail\|smtp" src` rỗng) — nên câu "Dùng để thông báo khi có phản hồi" ở `comments.emailHint` hiện là sai (xem mục Lệch 4).
- next-intl 4 đặt cookie `NEXT_LOCALE` khi ngôn ngữ của URL khác ngôn ngữ trình duyệt (`middleware/syncCookie.js`); `TopicSidebar` dùng `localStorage`; YouTube phát qua `youtube-nocookie.com`, ảnh xem trước từ `i.ytimg.com` (`src/lib/video.ts`). Trang Chính sách bảo mật dựa trên đúng các điểm này.

## Lệch so với spec (đã cân nhắc, cần chủ dự án biết)

1. **Danh sách trang tĩnh của sitemap chuyển sang `src/lib/sitemap-entries.ts`** (`STATIC_ROUTES`, `staticSitemapEntries()`), vì `src/app/sitemap.ts` import `@/i18n/navigation` mà Vitest không nạp được; nhờ vậy test "sitemap có ba trang mới" chạy được (spec §6). Không đổi URL hay priority của trang cũ.
2. **Trang Giới thiệu không còn khối "Chuyện bắt đầu từ một câu hỏi" riêng.** Spec §4.1 liệt kê thứ tự không có khối này và yêu cầu Về tác giả có "lý do làm dự án"; đoạn văn thật của khối cũ được giữ nguyên, chuyển thành mục "Vì sao có Chíp Chíp" trong Về tác giả (`about.author.why`). Câu hero đổi từ "một nhóm học sinh, sinh viên và kỹ sư" sang dự án một người làm — để nguyên thì mâu thuẫn với khối tác giả ngay bên dưới (spec §1).
3. **Khối cuối trang chủ (`JoinCta`) dẫn tới `/dong-gop`** thay cho Google Form. Spec §4.1.6 chỉ gỡ `JOIN_FORM_URL` "nếu không còn nơi nào dùng"; nơi còn lại duy nhất là khối này, vốn đang hiện "Form đăng ký sẽ mở trong thời gian tới" — một lời hứa không còn đúng. Khoá `home.join.formNote`, `home.join.formPending` bị xoá, `home.join.formCta` đổi tên `home.join.cta`, `home.join.description` viết lại. Nút "Tham gia cùng chúng tôi" trên navbar giữ nguyên (vẫn tới `/gioi-thieu`, nơi khối cuối dẫn tiếp tới `/dong-gop`).
4. **Sửa `comments.emailHint`** (ngoài spec): câu cũ hứa "Dùng để thông báo khi có phản hồi" nhưng không có code gửi email nào. Spec §4.4 buộc câu chữ khớp code; để câu cũ thì form bình luận nói ngược trang Chính sách bảo mật.
5. **Thẻ blog: thứ phóng to là một tấm nền trống portal ra `<body>`, không phải chính DOM của thẻ.** Thẻ nằm trong `TiltCard` (`perspective`) và wrapper Motion (`transform`); cả hai biến `position: fixed` thành "fixed theo thẻ", nên thẻ không thể thoát khỏi ô lưới. Tấm nền vẫn chạy bằng `layout` của Motion (spec §4.6), mount ở đúng hộp của thẻ rồi chuyển full màn hình ở frame sau; đo thực tế ở mục trên.
6. **Hiệu ứng nở ra dài 400 ms** (`EXPAND_MS`), nằm trong 0.35–0.45 s và dưới trần 450 ms của spec. `router.prefetch` chạy ngay lúc bấm để trang đích sẵn sàng khi hết 400 ms.
7. **FAQ dùng một bản markup cho mọi kích thước** — spec cho phép hai bản "nếu cần"; không cần vì không chỗ nào phải luôn mở trên desktop.
8. **"Loại tin" ở trang Liên hệ chỉ có Liên hệ / Góp ý.** `content_error` chỉ gửi từ nút "Báo lỗi bài này", luôn kèm `postId` (spec §4.2, §4.5).
9. **Vị trí "Báo lỗi bài này":** ngay sau thân bài; ở trang bài học đứng trước "Video liên quan", ở blog và video đứng trước bình luận.
10. **Mạng xã hội ở trang Liên hệ là link chữ cao 44 px**, không dùng `SocialLinks` (nút icon 36 px, dưới mức 44 px của spec §5). Ẩn cái rỗng như `SocialLinks`; hiện tại cả hai rỗng nên khối này ẩn.
11. **Trình duyệt kiểm trước khi gửi** (`checkMessagePayload`): tin sai không tốn request, cũng không tốn một trong 3 lượt/giờ. Giới hạn và regex email chuyển vào `contact-client.ts` (`MESSAGE_LIMITS`, `EMAIL_PATTERN`) và `contact-message.ts` import lại — một nguồn, hai phía không thể lệch nhau. Hành vi server không đổi (19 test cũ của `contact-message.test.ts` vẫn xanh).
12. **Link footer đặt ở cột giữa, trên dòng bản quyền**: footer vẫn là một hàng lưới ba cột trên desktop (DA2b), trên mobile các link xuống dòng.
13. **Chính sách bảo mật nói thêm những điều spec không liệt kê nhưng code đang làm:** cookie `NEXT_LOCALE`, `localStorage` của cột chủ đề, video YouTube/TikTok chỉ tải khi bấm (ảnh xem trước từ YouTube), cookie đăng nhập chỉ của ban biên tập, dữ liệu lưu trên Supabase. Ngày cập nhật là hằng `PRIVACY_UPDATED`.

## Review Focus

1. **Bấm gửi hai lần hoặc Enter liên tục** trên form Liên hệ/Báo lỗi, hoặc bấm đúp thẻ blog → đúng một tin được gửi, đúng một lần chuyển trang (không tiêu hai lượt rate limit). *(Task 3: `if (sending) return` + `disabled`; Task 7: `if (… || from || …) return`; Task 8 bước 5.1 và 5.5 kiểm tay — dự án không có môi trường test component.)*
2. **Tin thứ 4 trong một giờ, kể cả khi 3 tin trước là Liên hệ còn tin thứ 4 là Báo lỗi** → thông báo nói rõ giới hạn 3 tin/giờ tính chung, chữ đã nhập vẫn còn để gửi lại sau. *(Task 2 test `reports the rate limit`; Task 3: form chỉ `reset()` khi gửi thành công; Task 8 bước 5.2.)*
3. **Mạng rớt, proxy trả trang HTML, server chưa cấu hình (503)** → thông báo "không kết nối được"/"chưa gửi được", không crash, không mất chữ. *(Task 2 tests `reports a network failure`, `reads a non-JSON error page as a generic failure`, `reads anything else as a generic failure`.)*
4. **Tên hoặc nội dung chỉ toàn dấu cách/xuống dòng, hoặc dán quá 4000 ký tự** → báo lỗi tại chỗ, không gửi request. *(Task 2 tests `refuses a name or message made only of spaces once trimmed`, `rejects … as bodyLength`, `does not spend a request on a message the server would refuse`; `maxLength` trên ô nhập.)*
5. **Người dùng bật giảm chuyển động, hoặc Ctrl/Cmd/Shift/Alt-click, chuột giữa trên thẻ blog** → trình duyệt tự xử lý (tab mới, cửa sổ mới…), không có hiệu ứng, trang hiện tại không đổi; bấm Back sau khi thẻ nở ra không còn tấm nền che màn hình. *(Task 7 tests `leaves %s to the browser`; Task 8 bước 5.5.)*

---

## File map

| File | Trách nhiệm |
|---|---|
| `src/i18n/routing.ts` | Thêm `/lien-he`, `/dong-gop`, `/chinh-sach-bao-mat` |
| `src/lib/paths.test.ts` | `localizedPath` cho ba route mới × hai ngôn ngữ |
| `src/lib/sitemap-entries.ts` (+ `.test.ts`) | `STATIC_ROUTES`, `staticSitemapEntries()` (thêm ba trang mới) |
| `src/app/sitemap.ts` | Dùng `staticSitemapEntries()` |
| `src/lib/contact-client.ts` (+ `.test.ts`) | `MESSAGE_LIMITS`, `EMAIL_PATTERN`, `buildMessagePayload`, `checkMessagePayload`, `messageErrorKey`, `sendMessage` |
| `src/lib/contact-message.ts` | Dùng `MESSAGE_LIMITS`/`EMAIL_PATTERN` chung (không đổi hành vi) |
| `src/components/contact/MessageForm.tsx` | Form client dùng chung, biến thể `contact` / `report` |
| `src/components/contact/ReportMistake.tsx` | `<details>` "Báo lỗi bài này" bọc `MessageForm` |
| `src/app/[locale]/lien-he/page.tsx` | Trang Liên hệ |
| `src/app/[locale]/dong-gop/page.tsx` | Trang Đóng góp |
| `src/app/[locale]/chinh-sach-bao-mat/page.tsx` | Trang Chính sách bảo mật |
| `src/app/[locale]/{bai-hoc/[topic]/[slug],blog/[slug],video/[slug]}/page.tsx` | Gắn `ReportMistake` |
| `src/components/layout/Footer.tsx` | Hàng link Liên hệ · Đóng góp · Chính sách bảo mật |
| `src/lib/constants.ts` | `FOOTER_LINKS`, `PRIVACY_UPDATED`, `AUTHOR`, `CONTRIBUTORS`; gỡ `JOIN_FORM_URL`, `TEAM_UNITS`, `TeamUnitId` |
| `src/lib/initials.ts` (+ `.test.ts`) | Chữ cái đầu cho ảnh đại diện giữ chỗ |
| `src/components/sections/about/{AuthorSection,Commitments,Faq,Contributors,ContributeCta}.tsx` | Các khối mới của trang Giới thiệu |
| `src/components/sections/about/{TeamStructure,JoinFormEmbed}.tsx` | **Xoá** |
| `src/app/[locale]/gioi-thieu/page.tsx` | Ghép các khối mới |
| `src/components/sections/JoinCta.tsx` | CTA trang chủ tới `/dong-gop` |
| `src/lib/plain-click.ts` (+ `.test.ts`) | `isPlainLeftClick`, `EXPAND_MS` |
| `src/components/forum/ExpandingCardLink.tsx` | Link thẻ nở ra (client) |
| `src/components/forum/PostCard.tsx` | Prop `expand` |
| `src/app/[locale]/blog/page.tsx`, `src/components/sections/LatestPosts.tsx` | Bật `expand` |
| `src/messages/{vi,en}.json` | `contact`, `contribute`, `privacy`, `about` (viết lại), `footer.links`, `home.join`, `comments.emailHint` |
| `README.md` | Route, cấu trúc, "Nội dung cần thay trước khi ra mắt" |

**Cách sửa file message:** các khối JSON dưới đây là giá trị của một khoá cấp cao nhất (ví dụ `"contact": { … }`). Chèn đúng vị trí được nêu (khối đã được thụt lề sẵn như trong file), thêm dấu phẩy sau khối khi còn khoá đứng sau nó, file kết thúc bằng một dòng trống. Sau mỗi lần sửa chạy `npx vitest run src/messages/keys-parity.test.ts`.

---

### Task 1: Ba route mới và sitemap

**Files:**
- Modify: `src/i18n/routing.ts` (khối `pathnames`)
- Modify: `src/lib/paths.test.ts` (cuối `describe("localizedPath")`)
- Modify (viết lại toàn file): `src/lib/sitemap-entries.ts`, `src/app/sitemap.ts`
- Modify: `src/lib/sitemap-entries.test.ts` (import + `describe` mới ở cuối)

**Interfaces:**
- Consumes: `routing`, `StaticPathname` (`@/i18n/routing`); `localizedPath`, `postPath` (`@/lib/paths`); `SITE_URL` (`@/lib/site`).
- Produces:
  - Route keys `"/lien-he"` (vi `/lien-he`, en `/contact`), `"/dong-gop"` (vi `/dong-gop`, en `/contribute`), `"/chinh-sach-bao-mat"` (vi `/chinh-sach-bao-mat`, en `/privacy`) — thuộc `StaticPathname`, dùng được làm `href` của `Link` và `localeAlternates`.
  - `STATIC_ROUTES: readonly StaticPathname[]` · `staticSitemapEntries(): MetadataRoute.Sitemap`.

- [ ] **Step 1: Viết test thất bại cho routing** — trong `src/lib/paths.test.ts`, thêm vào cuối `describe("localizedPath", …)` (ngay sau test `resolves the new static routes per locale`):

```ts
  it("resolves the DA4 trust pages per locale", () => {
    expect(localizedPath("/lien-he", "vi")).toBe("/vi/lien-he");
    expect(localizedPath("/lien-he", "en")).toBe("/en/contact");
    expect(localizedPath("/dong-gop", "vi")).toBe("/vi/dong-gop");
    expect(localizedPath("/dong-gop", "en")).toBe("/en/contribute");
    expect(localizedPath("/chinh-sach-bao-mat", "vi")).toBe("/vi/chinh-sach-bao-mat");
    expect(localizedPath("/chinh-sach-bao-mat", "en")).toBe("/en/privacy");
  });
```

- [ ] **Step 2: Viết test thất bại cho sitemap** — trong `src/lib/sitemap-entries.test.ts`, đổi dòng import:

```ts
import { postSitemapEntries } from "@/lib/sitemap-entries";
```

thành:

```ts
import { postSitemapEntries, staticSitemapEntries } from "@/lib/sitemap-entries";
```

và thêm vào cuối file:

```ts
describe("staticSitemapEntries", () => {
  const urls = staticSitemapEntries().map((e) => e.url);

  it("lists the contact, contribute and privacy pages in both languages", () => {
    expect(urls).toEqual(
      expect.arrayContaining([
        `${SITE_URL}/vi/lien-he`,
        `${SITE_URL}/en/contact`,
        `${SITE_URL}/vi/dong-gop`,
        `${SITE_URL}/en/contribute`,
        `${SITE_URL}/vi/chinh-sach-bao-mat`,
        `${SITE_URL}/en/privacy`,
      ])
    );
  });

  it("keeps the existing pages and leaves search out", () => {
    expect(urls).toEqual(
      expect.arrayContaining([`${SITE_URL}/vi`, `${SITE_URL}/en/lessons`, `${SITE_URL}/en/about`])
    );
    expect(urls.some((url) => url.includes("/tim-kiem") || url.includes("/search"))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("gives the homepage the top priority and no fake timestamps", () => {
    const home = staticSitemapEntries().find((e) => e.url === `${SITE_URL}/vi`);
    expect(home).toMatchObject({ priority: 1, changeFrequency: "weekly" });
    expect(staticSitemapEntries().every((e) => !("lastModified" in e))).toBe(true);
  });
});
```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/paths.test.ts src/lib/sitemap-entries.test.ts`
Expected: FAIL — `resolves the DA4 trust pages per locale` với `TypeError: Cannot read properties of undefined (reading 'vi')` (route chưa có); cả file sitemap lỗi `staticSitemapEntries is not a function`.

- [ ] **Step 4: Thêm route** — trong `src/i18n/routing.ts` thay:

```ts
    "/tim-kiem": { vi: "/tim-kiem", en: "/search" },
```

bằng:

```ts
    "/tim-kiem": { vi: "/tim-kiem", en: "/search" },
    "/lien-he": { vi: "/lien-he", en: "/contact" },
    "/dong-gop": { vi: "/dong-gop", en: "/contribute" },
    "/chinh-sach-bao-mat": { vi: "/chinh-sach-bao-mat", en: "/privacy" },
```

- [ ] **Step 5: Viết lại `src/lib/sitemap-entries.ts`** (toàn file):

```ts
import type { MetadataRoute } from "next";
import { routing, type StaticPathname } from "@/i18n/routing";
import { localizedPath, postPath } from "@/lib/paths";
import { postRowsFrom } from "@/lib/revalidate-paths";
import { SITE_URL } from "@/lib/site";

/** Public routes without params, excluding admin and API. */
// The search page is left out on purpose: it is `noindex`.
export const STATIC_ROUTES: readonly StaticPathname[] = [
  "/",
  "/bai-hoc",
  "/video",
  "/blog",
  "/gioi-thieu",
  "/lien-he",
  "/dong-gop",
  "/chinh-sach-bao-mat",
];

/**
 * One entry per static route and locale.
 *
 * No meaningful timestamp exists for these routes, so `lastModified` is
 * omitted rather than stamped with the request time — reporting every page
 * as just-changed on every crawl trains Googlebot to distrust the field.
 */
export function staticSitemapEntries(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(route, locale)}`,
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : 0.8,
    }))
  );
}

/** A published `posts` row as the sitemap reads it. */
export type SitemapPostRow = {
  slug: string;
  locale: string;
  kind: string;
  topic: string | null;
  published_at: string | null;
};

/**
 * One sitemap entry per published post that has a page.
 *
 * Kept apart from src/app/sitemap.ts so it can be tested without Supabase or
 * next-intl's navigation. A row the app cannot place (unknown locale or kind,
 * a lesson without a topic) is left out rather than pointed at a URL that
 * would 404.
 */
export function postSitemapEntries(rows: SitemapPostRow[] | null): MetadataRoute.Sitemap {
  return (rows ?? []).flatMap((row) => {
    const [post] = postRowsFrom([row]);
    const path = post ? postPath(post, post.locale) : null;
    if (!path) return [];
    return [
      {
        url: `${SITE_URL}${path}`,
        // Omit rather than lie when the row has no publish timestamp.
        ...(row.published_at ? { lastModified: new Date(row.published_at) } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      },
    ];
  });
}
```

- [ ] **Step 6: Viết lại `src/app/sitemap.ts`** (toàn file):

```ts
import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { TOPIC_IDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { postSitemapEntries, staticSitemapEntries } from "@/lib/sitemap-entries";

function url(href: Parameters<typeof getPathname>[0]["href"], locale: string) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticSitemapEntries();

  for (const topic of TOPIC_IDS) {
    for (const locale of routing.locales) {
      entries.push({
        url: url({ pathname: "/bai-hoc/[topic]", params: { topic } }, locale),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  if (!isSupabaseConfigured) return entries;

  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, locale, kind, topic, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1000);

  entries.push(...postSitemapEntries(data));

  return entries;
}
```

- [ ] **Step 7: Chạy test**

Run: `npx vitest run src/lib/paths.test.ts src/lib/sitemap-entries.test.ts`
Expected: PASS — 8 + 6 test.

- [ ] **Step 8: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **289** test PASS (285 + 4). Ba URL mới 404 cho tới Task 3 và Task 5 — sitemap liệt kê trước là chấp nhận được trên nhánh tính năng.

- [ ] **Step 9: Commit**

```bash
git add src/i18n/routing.ts src/lib/paths.test.ts src/lib/sitemap-entries.ts src/lib/sitemap-entries.test.ts src/app/sitemap.ts
git commit -m "feat(routing): add contact, contribute and privacy routes to routing and sitemap"
```

---

### Task 2: `contact-client.ts` — dựng, kiểm và gửi tin tới `/api/messages`

**Files:**
- Create: `src/lib/contact-client.ts`, `src/lib/contact-client.test.ts`
- Modify: `src/lib/contact-message.ts:1-31` (dùng giới hạn chung)

**Interfaces:**
- Consumes: `Locale` (`@/i18n/routing`); `MessageKind`, `parseMessagePayload` (`@/lib/contact-message`, chỉ test dùng `parseMessagePayload`).
- Produces:
  - `MESSAGE_LIMITS = { name: 80, email: 254, body: 4000 } as const` · `EMAIL_PATTERN: RegExp`
  - `type MessageFields = { kind: MessageKind; name: string; email: string; body: string; website: string; postId: string | null }`
  - `type MessagePayload = MessageFields & { locale: Locale }` (khai báo tường minh trong file)
  - `type MessageErrorKey = "nameLength" | "bodyLength" | "emailInvalid" | "postNotFound" | "rateLimited" | "network" | "generic"` — trùng tên khoá dưới `contact.errors` (Task 3).
  - `type SendOutcome = { ok: true } | { ok: false; error: MessageErrorKey }`
  - `buildMessagePayload(fields: MessageFields, locale: Locale): MessagePayload` · `checkMessagePayload(payload: MessagePayload): MessageErrorKey | null` · `messageErrorKey(code: unknown): MessageErrorKey` · `sendMessage(payload: MessagePayload, fetchImpl: FetchLike): Promise<SendOutcome>` (truyền `fetch` toàn cục khi gọi thật).

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/contact-client.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  MESSAGE_LIMITS,
  buildMessagePayload,
  checkMessagePayload,
  messageErrorKey,
  sendMessage,
  type MessageFields,
} from "@/lib/contact-client";
import { parseMessagePayload } from "@/lib/contact-message";

const fields: MessageFields = {
  kind: "contact",
  name: "  Lan  ",
  email: " lan@example.com ",
  body: "  Xin chào!  ",
  website: "",
  postId: null,
};

function reply(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

describe("buildMessagePayload", () => {
  it("trims the fields and adds the locale", () => {
    expect(buildMessagePayload(fields, "vi")).toEqual({
      kind: "contact",
      name: "Lan",
      email: "lan@example.com",
      body: "Xin chào!",
      website: "",
      postId: null,
      locale: "vi",
    });
  });

  it("builds a payload the server accepts, including a content error on an article", () => {
    const postId = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";
    const payload = buildMessagePayload({ ...fields, kind: "content_error", postId }, "en");
    const parsed = parseMessagePayload(payload);
    expect(parsed.ok && !parsed.honeypot && parsed.value).toMatchObject({
      kind: "content_error",
      postId,
      locale: "en",
    });
  });
});

describe("checkMessagePayload", () => {
  const base = buildMessagePayload(fields, "vi");

  it("refuses a name or message made only of spaces once trimmed", () => {
    expect(checkMessagePayload(buildMessagePayload({ ...fields, name: "   " }, "vi"))).toBe("nameLength");
    expect(checkMessagePayload(buildMessagePayload({ ...fields, body: " \n\t " }, "vi"))).toBe("bodyLength");
  });

  it("accepts a message with or without an email", () => {
    expect(checkMessagePayload(base)).toBeNull();
    expect(checkMessagePayload({ ...base, email: "" })).toBeNull();
  });

  it.each([
    [{ name: "" }, "nameLength"],
    [{ name: "x".repeat(MESSAGE_LIMITS.name + 1) }, "nameLength"],
    [{ body: "" }, "bodyLength"],
    [{ body: "x".repeat(MESSAGE_LIMITS.body + 1) }, "bodyLength"],
    [{ email: "not-an-email" }, "emailInvalid"],
    [{ email: `${"x".repeat(250)}@a.io` }, "emailInvalid"],
  ])("rejects %o as %s", (change, key) => {
    expect(checkMessagePayload({ ...base, ...change })).toBe(key);
  });

  it("accepts the limits themselves", () => {
    expect(
      checkMessagePayload({
        ...base,
        name: "x".repeat(MESSAGE_LIMITS.name),
        body: "x".repeat(MESSAGE_LIMITS.body),
      })
    ).toBeNull();
  });
});

describe("messageErrorKey", () => {
  it("maps each route code to its message", () => {
    expect(messageErrorKey("rate_limited")).toBe("rateLimited");
    expect(messageErrorKey("name_length")).toBe("nameLength");
    expect(messageErrorKey("body_length")).toBe("bodyLength");
    expect(messageErrorKey("email_invalid")).toBe("emailInvalid");
    expect(messageErrorKey("post_not_found")).toBe("postNotFound");
    expect(messageErrorKey("post_invalid")).toBe("postNotFound");
  });

  it("reads anything else as a generic failure", () => {
    for (const code of ["insert_failed", "server_not_configured", "invalid_json", "toString", "__proto__", 42, null, undefined]) {
      expect(messageErrorKey(code)).toBe("generic");
    }
  });
});

describe("sendMessage", () => {
  const payload = buildMessagePayload(fields, "vi");

  it("posts JSON to /api/messages and reports success", async () => {
    const fetchImpl = reply(200, { ok: true });
    await expect(sendMessage(payload, fetchImpl)).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("reports the rate limit", async () => {
    await expect(sendMessage(payload, reply(429, { error: "rate_limited" }))).resolves.toEqual({
      ok: false,
      error: "rateLimited",
    });
  });

  it("reports a validation error from the server", async () => {
    await expect(sendMessage(payload, reply(400, { error: "email_invalid" }))).resolves.toEqual({
      ok: false,
      error: "emailInvalid",
    });
  });

  it("reports a missing article", async () => {
    await expect(sendMessage(payload, reply(404, { error: "post_not_found" }))).resolves.toEqual({
      ok: false,
      error: "postNotFound",
    });
  });

  it("reports a network failure", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sendMessage(payload, fetchImpl)).resolves.toEqual({ ok: false, error: "network" });
  });

  it("reads a non-JSON error page as a generic failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
    });
    await expect(sendMessage(payload, fetchImpl)).resolves.toEqual({ ok: false, error: "generic" });
  });

  it("does not spend a request on a message the server would refuse", async () => {
    const fetchImpl = reply(200, { ok: true });
    await expect(sendMessage({ ...payload, body: "" }, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "bodyLength",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards a filled honeypot and reads the server's quiet success as sent", async () => {
    const fetchImpl = reply(200, { ok: true });
    const bot = buildMessagePayload({ ...fields, website: "http://spam.test" }, "vi");
    await expect(sendMessage(bot, fetchImpl)).resolves.toEqual({ ok: true });
    const init = fetchImpl.mock.calls[0][1] as { body: string };
    expect(JSON.parse(init.body)).toMatchObject({ website: "http://spam.test" });
    expect(parseMessagePayload(JSON.parse(init.body))).toEqual({ ok: true, honeypot: true });
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/contact-client.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/contact-client"`.

- [ ] **Step 3: Viết `src/lib/contact-client.ts`**

```ts
import type { Locale } from "@/i18n/routing";
import type { MessageKind } from "@/lib/contact-message";

/**
 * Browser side of /api/messages, shared by the contact form and the
 * "report a mistake" form so both send and read the result the same way.
 *
 * Pure apart from the injected `fetch`, so every outcome — including a
 * network failure — is testable without a browser.
 */

/** Must match the CHECK constraints on public.messages. */
export const MESSAGE_LIMITS = { name: 80, email: 254, body: 4000 } as const;

/** Shape only, same test as the server's; see `mailtoHref` for why that is enough. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MessageFields = {
  kind: MessageKind;
  name: string;
  email: string;
  body: string;
  /** Honeypot: hidden from people, forwarded as-is so the server decides. */
  website: string;
  postId: string | null;
};

export type MessagePayload = {
  kind: MessageKind;
  name: string;
  email: string;
  body: string;
  website: string;
  postId: string | null;
  locale: Locale;
};

/** Keys under `contact.errors` in the message files. */
export type MessageErrorKey =
  | "nameLength"
  | "bodyLength"
  | "emailInvalid"
  | "postNotFound"
  | "rateLimited"
  | "network"
  | "generic";

export type SendOutcome = { ok: true } | { ok: false; error: MessageErrorKey };

export function buildMessagePayload(fields: MessageFields, locale: Locale): MessagePayload {
  return {
    kind: fields.kind,
    name: fields.name.trim(),
    email: fields.email.trim(),
    body: fields.body.trim(),
    website: fields.website,
    postId: fields.postId,
    locale,
  };
}

/**
 * Checks what the browser can check before spending a request (and one of the
 * three messages an hour the rate limit allows). The server repeats every
 * check; this only saves a round trip.
 */
export function checkMessagePayload(payload: MessagePayload): MessageErrorKey | null {
  if (!payload.name || payload.name.length > MESSAGE_LIMITS.name) return "nameLength";
  if (!payload.body || payload.body.length > MESSAGE_LIMITS.body) return "bodyLength";
  if (
    payload.email &&
    (payload.email.length > MESSAGE_LIMITS.email || !EMAIL_PATTERN.test(payload.email))
  ) {
    return "emailInvalid";
  }
  return null;
}

const ERROR_BY_CODE: Record<string, MessageErrorKey> = {
  name_length: "nameLength",
  body_length: "bodyLength",
  email_invalid: "emailInvalid",
  post_invalid: "postNotFound",
  post_not_found: "postNotFound",
  rate_limited: "rateLimited",
};

/** Maps the route's `{ error }` code to a message key; unknown codes read as generic. */
export function messageErrorKey(code: unknown): MessageErrorKey {
  return typeof code === "string" && Object.hasOwn(ERROR_BY_CODE, code)
    ? ERROR_BY_CODE[code]
    : "generic";
}

type FetchLike = (
  input: string,
  init: { method: "POST"; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export async function sendMessage(payload: MessagePayload, fetchImpl: FetchLike): Promise<SendOutcome> {
  const invalid = checkMessagePayload(payload);
  if (invalid) return { ok: false, error: invalid };

  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await fetchImpl("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: "network" };
  }

  if (response.ok) return { ok: true };

  // A proxy error page is HTML, not JSON; that is still a failed send.
  const result: unknown = await response.json().catch(() => null);
  const code = typeof result === "object" && result !== null && "error" in result ? result.error : null;
  return { ok: false, error: messageErrorKey(code) };
}
```

`import type` từ `contact-message.ts` bị xoá khi biên dịch, nên việc `contact-message.ts` import giá trị từ file này (bước 4) không tạo vòng import lúc chạy. File này không import gì phía server, an toàn cho client bundle.

- [ ] **Step 4: Dùng giới hạn chung trong `src/lib/contact-message.ts`** — thay:

```ts
import { routing, type Locale } from "@/i18n/routing";
import { isUuid } from "@/lib/shared-fields";
```

bằng:

```ts
import { routing, type Locale } from "@/i18n/routing";
import { EMAIL_PATTERN, MESSAGE_LIMITS } from "@/lib/contact-client";
import { isUuid } from "@/lib/shared-fields";
```

và thay:

```ts
// Must match the CHECK constraints on public.messages.
const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_BODY = 4000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

bằng:

```ts
// Shared with the browser forms so both sides refuse the same input.
const MAX_NAME = MESSAGE_LIMITS.name;
const MAX_EMAIL = MESSAGE_LIMITS.email;
const MAX_BODY = MESSAGE_LIMITS.body;
const EMAIL = EMAIL_PATTERN;
```

- [ ] **Step 5: Chạy test**

Run: `npx vitest run src/lib/contact-client.test.ts src/lib/contact-message.test.ts`
Expected: PASS — 21 + 19 test (19 test cũ của server không đổi).

- [ ] **Step 6: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **310** test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contact-client.ts src/lib/contact-client.test.ts src/lib/contact-message.ts
git commit -m "feat(contact): add a tested client for /api/messages shared by every message form"
```

---

### Task 3: `MessageForm` và trang Liên hệ

**Files:**
- Create: `src/components/contact/MessageForm.tsx`
- Create: `src/app/[locale]/lien-he/page.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json` (namespace `contact`)

**Interfaces:**
- Consumes: Task 1 route `"/lien-he"`, `"/chinh-sach-bao-mat"`; Task 2 `MESSAGE_LIMITS`, `buildMessagePayload`, `sendMessage`, `MessageErrorKey`; `MessageKind` (`@/lib/contact-message`); `CONTACT_EMAIL`, `SOCIAL_LINKS` (`@/lib/constants`); `localeAlternates` (`@/lib/seo`).
- Produces:
  - `MessageForm({ variant, postId }: { variant: "contact" | "report"; postId?: string | null })` — client component; `report` luôn gửi `kind: "content_error"` kèm `postId`.
  - Khoá message `contact.{title,description}`, `contact.form.*`, `contact.errors.<MessageErrorKey>`, `contact.aside.*`, `contact.report.{toggle,intro,bodyLabel,submit,sent}` (Task 4 dùng `contact.report.*`).

- [ ] **Step 1: Thêm namespace `contact` vào `src/messages/vi.json`** — chèn ngay sau khoá `"about"`:

```json
  "contact": {
    "title": "Liên hệ",
    "description": "Gửi câu hỏi, lời góp ý hoặc đề nghị hợp tác. Mọi tin nhắn đều được tác giả đọc.",
    "form": {
      "kindLegend": "Bạn muốn gửi",
      "kinds": {
        "contact": "Liên hệ",
        "feedback": "Góp ý"
      },
      "nameLabel": "Tên của bạn",
      "emailLabel": "Email (không bắt buộc)",
      "emailHint": "Chỉ dùng để trả lời bạn, không hiển thị ở đâu. Để trống thì chúng tôi không trả lời lại được.",
      "bodyLabel": "Nội dung",
      "bodyHint": "Tối đa {max} ký tự.",
      "submit": "Gửi tin nhắn",
      "submitting": "Đang gửi…",
      "sent": "Đã gửi. Cảm ơn bạn đã viết cho Chíp Chíp!"
    },
    "errors": {
      "nameLength": "Vui lòng nhập tên (tối đa 80 ký tự).",
      "bodyLength": "Vui lòng nhập nội dung (tối đa 4000 ký tự).",
      "emailInvalid": "Email chưa đúng định dạng. Bạn có thể để trống ô này.",
      "postNotFound": "Không tìm thấy bài này nữa. Bạn thử gửi qua trang Liên hệ nhé.",
      "rateLimited": "Mỗi người gửi được tối đa 3 tin mỗi giờ, tính chung cả liên hệ, góp ý và báo lỗi bài. Bạn thử lại sau nhé.",
      "network": "Không kết nối được. Kiểm tra mạng rồi gửi lại nhé.",
      "generic": "Chưa gửi được tin nhắn. Bạn thử lại sau ít phút nhé."
    },
    "aside": {
      "emailTitle": "Email",
      "socialTitle": "Mạng xã hội",
      "responseTitle": "Khi nào có phản hồi",
      "responseBody": "[Thời gian phản hồi] Tác giả thường trả lời trong vòng [số] ngày. Tin không kèm email vẫn được đọc, nhưng không trả lời lại được.",
      "limitNote": "Để chặn spam, mỗi người gửi được tối đa 3 tin mỗi giờ.",
      "privacyNote": "Thông tin bạn gửi chỉ dùng để trả lời bạn.",
      "privacyLink": "Xem chính sách bảo mật"
    },
    "report": {
      "toggle": "Báo lỗi bài này",
      "intro": "Thấy chỗ sai, chỗ khó hiểu hoặc link hỏng? Mô tả ngắn gọn giúp tác giả sửa nhanh hơn.",
      "bodyLabel": "Lỗi bạn thấy",
      "submit": "Gửi báo lỗi",
      "sent": "Đã gửi báo lỗi. Cảm ơn bạn đã giúp bài tốt hơn!"
    }
  }
```

- [ ] **Step 2: Thêm namespace `contact` vào `src/messages/en.json`** — chèn ngay sau khoá `"about"`:

```json
  "contact": {
    "title": "Contact",
    "description": "Send a question, some feedback or an offer to work together. The author reads every message.",
    "form": {
      "kindLegend": "What are you sending?",
      "kinds": {
        "contact": "A message",
        "feedback": "Feedback"
      },
      "nameLabel": "Your name",
      "emailLabel": "Email (optional)",
      "emailHint": "Used only to reply to you and never shown anywhere. Leave it blank and we cannot write back.",
      "bodyLabel": "Message",
      "bodyHint": "Up to {max} characters.",
      "submit": "Send message",
      "submitting": "Sending…",
      "sent": "Sent. Thank you for writing to Chíp Chíp!"
    },
    "errors": {
      "nameLength": "Please enter your name (up to 80 characters).",
      "bodyLength": "Please write a message (up to 4000 characters).",
      "emailInvalid": "That email address does not look right. You can leave it blank.",
      "postNotFound": "This article no longer exists. Please use the Contact page instead.",
      "rateLimited": "Each person can send up to 3 messages an hour, counting contact, feedback and mistake reports together. Please try again later.",
      "network": "Could not connect. Check your connection and send again.",
      "generic": "Your message was not sent. Please try again in a few minutes."
    },
    "aside": {
      "emailTitle": "Email",
      "socialTitle": "Social media",
      "responseTitle": "When to expect a reply",
      "responseBody": "[Response time] The author usually replies within [number] days. Messages without an email are still read, but cannot be answered.",
      "limitNote": "To stop spam, each person can send up to 3 messages an hour.",
      "privacyNote": "What you send is used only to reply to you.",
      "privacyLink": "Read the privacy policy"
    },
    "report": {
      "toggle": "Report a mistake",
      "intro": "Spotted an error, something unclear or a broken link? A short description helps the author fix it faster.",
      "bodyLabel": "What is wrong",
      "submit": "Send report",
      "sent": "Report sent. Thank you for making this article better!"
    }
  }
```

`[Thời gian phản hồi]`, `[số]` / `[Response time]`, `[number]` là chỗ giữ chỗ cho DA5 (README, Task 8).

- [ ] **Step 3: Kiểm tập khoá**

Run: `npx vitest run src/messages/keys-parity.test.ts`
Expected: PASS.

- [ ] **Step 4: Tạo `src/components/contact/MessageForm.tsx`**

```tsx
"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  MESSAGE_LIMITS,
  buildMessagePayload,
  sendMessage,
  type MessageErrorKey,
} from "@/lib/contact-client";
import type { MessageKind } from "@/lib/contact-message";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; error: MessageErrorKey };

const CONTACT_KINDS = ["contact", "feedback"] as const satisfies readonly MessageKind[];

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-base text-text outline-none transition-colors focus-visible:border-accent md:text-sm";

/**
 * The one form behind /api/messages.
 *
 * `contact` lets the reader pick Contact or Feedback; `report` is the
 * "report a mistake" form under an article and always sends `content_error`
 * with the article's id. Sending and reading the result live in
 * lib/contact-client.ts, so both variants behave identically.
 */
export function MessageForm({
  variant,
  postId = null,
}: {
  variant: "contact" | "report";
  postId?: string | null;
}) {
  const t = useTranslations("contact");
  const locale = useLocale() as Locale;
  const id = useId();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const sending = status.state === "sending";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    const chosenKind = field("kind");

    setStatus({ state: "sending" });
    const outcome = await sendMessage(
      buildMessagePayload(
        {
          kind:
            variant === "report"
              ? "content_error"
              : chosenKind === "feedback"
                ? "feedback"
                : "contact",
          name: field("name"),
          email: field("email"),
          body: field("body"),
          website: field("website"),
          postId: variant === "report" ? postId : null,
        },
        locale
      ),
      fetch
    );

    if (outcome.ok) {
      form.reset();
      setStatus({ state: "sent" });
    } else {
      setStatus({ state: "error", error: outcome.error });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-5">
      {variant === "contact" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-text">{t("form.kindLegend")}</legend>
          <div className="flex flex-wrap gap-2">
            {CONTACT_KINDS.map((kind, index) => (
              <label
                key={kind}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm text-text-nav has-[:checked]:border-accent has-[:checked]:text-text"
              >
                <input
                  type="radio"
                  name="kind"
                  value={kind}
                  defaultChecked={index === 0}
                  className="size-4 accent-[#314344]"
                />
                {t(`form.kinds.${kind}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-semibold text-text">
            {t("form.nameLabel")}
          </label>
          <input
            id={`${id}-name`}
            name="name"
            required
            maxLength={MESSAGE_LIMITS.name}
            autoComplete="name"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-sm font-semibold text-text">
            {t("form.emailLabel")}
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            maxLength={MESSAGE_LIMITS.email}
            autoComplete="email"
            aria-describedby={`${id}-email-hint`}
            className={inputClassName}
          />
          <p id={`${id}-email-hint`} className="text-xs text-text-muted">
            {t("form.emailHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-body`} className="text-sm font-semibold text-text">
          {variant === "report" ? t("report.bodyLabel") : t("form.bodyLabel")}
        </label>
        <textarea
          id={`${id}-body`}
          name="body"
          required
          rows={variant === "report" ? 4 : 6}
          maxLength={MESSAGE_LIMITS.body}
          aria-describedby={`${id}-body-hint`}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-text outline-none transition-colors focus-visible:border-accent md:text-sm"
        />
        <p id={`${id}-body-hint`} className="text-xs text-text-muted">
          {t("form.bodyHint", { max: MESSAGE_LIMITS.body })}
        </p>
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div aria-live="polite" aria-atomic="true" className="text-sm">
        {status.state === "error" && (
          <p className="text-red-700">{t(`errors.${status.error}`)}</p>
        )}
        {status.state === "sent" && (
          <p className="text-text">
            {variant === "report" ? t("report.sent") : t("form.sent")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={sending}
        aria-disabled={sending}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
      >
        {sending
          ? t("form.submitting")
          : variant === "report"
            ? t("report.submit")
            : t("form.submit")}
      </button>
    </form>
  );
}
```

Ghi chú cho người làm: `noValidate` để lỗi đi qua vùng `aria-live` của chính form (cùng câu chữ với lỗi server) thay vì bong bóng của trình duyệt; `required`/`maxLength` vẫn để lại cho trình đọc màn hình và để chặn dán quá dài. Form chỉ `reset()` khi gửi thành công — gặp lỗi (kể cả `rateLimited`) thì chữ đã gõ còn nguyên. `fetch` toàn cục được truyền vào `sendMessage` (gọi không kèm `this` là hợp lệ với `window.fetch`).

- [ ] **Step 5: Tạo `src/app/[locale]/lien-he/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageForm } from "@/components/contact/MessageForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/lien-he", locale as Locale),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([getTranslations("contact"), getTranslations("nav")]);
  // A blank href means the account does not exist yet — same rule as SocialLinks.
  const socials = SOCIAL_LINKS.filter((link) => link.href.length > 0);

  return (
    <section className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto grid w-full max-w-content gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div>
          <header className="max-w-2xl">
            <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
              {t("title")}
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
              {t("description")}
            </p>
          </header>

          <div className="mt-10 rounded-3xl border border-border bg-surface p-6 md:p-8">
            <MessageForm variant="contact" />
          </div>
        </div>

        <aside className="flex flex-col gap-8 lg:pt-24">
          {CONTACT_EMAIL && (
            <div>
              <h2 className="text-sm font-semibold text-text">{t("aside.emailTitle")}</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-1 inline-flex min-h-11 items-center font-mono text-sm text-text-nav underline underline-offset-4 transition-colors hover:text-accent"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          )}

          {socials.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text">{t("aside.socialTitle")}</h2>
              <ul className="mt-1 flex flex-wrap gap-x-6">
                {socials.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-sm text-text-nav underline underline-offset-4 transition-colors hover:text-accent"
                    >
                      {tNav(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-text">{t("aside.responseTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("aside.responseBody")}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("aside.limitNote")}</p>
          </div>

          <div>
            <p className="text-sm leading-relaxed text-text-muted">{t("aside.privacyNote")}</p>
            <Link
              href="/chinh-sach-bao-mat"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4 transition-colors hover:text-black"
            >
              {t("aside.privacyLink")}
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **310** test PASS.

- [ ] **Step 7: Xem nhanh** — `NODE_ENV=development npx next dev -p 3000`, mở `/vi/lien-he` và `/en/contact`: bấm "Gửi tin nhắn" khi form rỗng → "Vui lòng nhập tên (tối đa 80 ký tự)." hiện ngay dưới nội dung, tab Network không có request. Dừng dev server trước khi build.

- [ ] **Step 8: Commit**

```bash
git add src/components/contact/MessageForm.tsx "src/app/[locale]/lien-he/page.tsx" src/messages/vi.json src/messages/en.json
git commit -m "feat(contact): add the contact page with a form posting to /api/messages"
```

---

### Task 4: "Báo lỗi bài này" trên bài học, blog và video

**Files:**
- Create: `src/components/contact/ReportMistake.tsx`
- Modify: `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx`, `src/app/[locale]/blog/[slug]/page.tsx`, `src/app/[locale]/video/[slug]/page.tsx`

**Interfaces:**
- Consumes: Task 3 `MessageForm`, khoá `contact.report.*`; `post.id` (uuid của bản dịch đang xem) ở mỗi trang.
- Produces: `ReportMistake({ postId }: { postId: string })` — async Server Component.

- [ ] **Step 1: Tạo `src/components/contact/ReportMistake.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { ChevronDown, Flag } from "lucide-react";
import { MessageForm } from "@/components/contact/MessageForm";

/**
 * "Report a mistake" under an article.
 *
 * A native `<details>`: opening and closing needs no JavaScript and works with
 * keyboard and screen readers as is. Only the form inside is a client
 * component. Closed by default; nothing ever needs to force it open, so the
 * DA3 caveat about CSS and closed `<details>` does not apply here.
 */
export async function ReportMistake({ postId }: { postId: string }) {
  const t = await getTranslations("contact.report");

  return (
    <details className="group mt-12 rounded-2xl border border-border bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-text-nav transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
        <Flag className="size-4" strokeWidth={2} aria-hidden />
        {t("toggle")}
        <ChevronDown
          className="ml-auto size-4 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
          strokeWidth={2.2}
          aria-hidden
        />
      </summary>

      <div className="border-t border-border px-5 pb-6 pt-5">
        <p className="mb-5 text-sm leading-relaxed text-text-muted">{t("intro")}</p>
        <MessageForm variant="report" postId={postId} />
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Gắn vào trang bài học** — trong `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx` thay:

```tsx
import { ArticleBody } from "@/components/forum/ArticleBody";
```

bằng:

```tsx
import { ReportMistake } from "@/components/contact/ReportMistake";
import { ArticleBody } from "@/components/forum/ArticleBody";
```

và thay:

```tsx
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        {relatedVideos.length > 0 && (
```

bằng:

```tsx
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        <ReportMistake postId={post.id} />

        {relatedVideos.length > 0 && (
```

- [ ] **Step 3: Gắn vào trang blog và trang video** — trong **cả hai** file `src/app/[locale]/blog/[slug]/page.tsx` và `src/app/[locale]/video/[slug]/page.tsx`, thay:

```tsx
import { ArticleBody } from "@/components/forum/ArticleBody";
```

bằng:

```tsx
import { ReportMistake } from "@/components/contact/ReportMistake";
import { ArticleBody } from "@/components/forum/ArticleBody";
```

và thay:

```tsx
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        <CommentSection
```

bằng:

```tsx
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        <ReportMistake postId={post.id} />

        <CommentSection
```

- [ ] **Step 4: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **310** test PASS. (Gửi thật và kiểm `post_id` ở Task 8 bước 5.3 — cần stack local có bài.)

- [ ] **Step 5: Commit**

```bash
git add src/components/contact/ReportMistake.tsx "src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx" "src/app/[locale]/blog/[slug]/page.tsx" "src/app/[locale]/video/[slug]/page.tsx"
git commit -m "feat(contact): let readers report a mistake from lessons, blog posts and videos"
```

---

### Task 5: Trang Đóng góp, Chính sách bảo mật và link ở footer

**Files:**
- Create: `src/app/[locale]/dong-gop/page.tsx`, `src/app/[locale]/chinh-sach-bao-mat/page.tsx`
- Modify: `src/lib/constants.ts` (`FOOTER_LINKS`, `PRIVACY_UPDATED`, chú thích `CONTACT_EMAIL`)
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json` (`contribute`, `privacy`, `footer.links`, `comments.emailHint`)

**Interfaces:**
- Consumes: Task 1 routes; `localeAlternates` (`@/lib/seo`); `Link` (`@/i18n/navigation`).
- Produces: `FOOTER_LINKS: { key: "contact" | "contribute" | "privacy"; href: StaticPathname }[]` · `PRIVACY_UPDATED = "2026-09-28"` · khoá `contribute.*`, `privacy.*`, `footer.links.{label,contact,contribute,privacy}`.

**Đối chiếu từng câu của trang Chính sách bảo mật với code** (spec §4.4 — reviewer kiểm theo bảng này, không có test tự động):

| Khoá `privacy.sections.*.items.*` | Căn cứ trong code |
|---|---|
| `collect.comments` | `supabase/migrations/20260912000000_init.sql` bảng `comments` (`author_name`, `author_email` "never exposed to clients"); `/api/comments` |
| `collect.messages` | `20260928000300_messages.sql` (`name`, `email`, `body`, `post_id`, `locale`; chỉ policy select cho staff) |
| `collect.ip` | `src/lib/rate-limit.ts` `hashIp` (SHA-256 với salt), bảng `comment_rate_limit.ip_hash` |
| `collect.none` | Không có script phân tích/quảng cáo trong `src/app/layout.tsx`, `src/app/[locale]/layout.tsx` |
| `device.locale` | next-intl 4 `middleware/syncCookie.js` (cookie `NEXT_LOCALE`) |
| `device.local` | `src/components/lessons/TopicSidebar.tsx` (`localStorage`) |
| `device.video` | `src/lib/video.ts` (`youtube-nocookie.com`, `i.ytimg.com`), facade chỉ tải player khi bấm |
| `device.staff` | `src/middleware.ts` + `@supabase/ssr` (phiên đăng nhập `/admin`) |
| `retention.counter` | `20260913000000_harden_access.sql` `consume_rate_limit`: `delete … where created_at < now() - interval '1 day'` |
| `retention.content` | Không có job xoá bình luận/tin nhắn; chỉ staff xoá (`messages_delete_staff`, trang admin) |
| `sharing.translate` | `src/lib/translate/deepseek.ts`, README "Dịch nháp bằng AI và quyền riêng tư" |

- [ ] **Step 1: Thêm namespace `contribute` và `privacy`** — trong `src/messages/vi.json`, chèn ngay sau khoá `"contact"`:

```json
  "contribute": {
    "title": "Đóng góp",
    "description": "Chíp Chíp do một người làm, nhưng không cần làm một mình. Nếu bạn muốn giúp, đây là bốn cách, cách nào cũng bắt đầu bằng một tin nhắn.",
    "ways": {
      "write": {
        "title": "Viết bài",
        "body": "Bạn hiểu một khái niệm bán dẫn và muốn giải thích nó cho học sinh? Gửi dàn ý hoặc bản nháp, tác giả sẽ cùng bạn biên tập trước khi đăng. Tên bạn được ghi ở cuối bài."
      },
      "translate": {
        "title": "Dịch",
        "body": "Mỗi bài có bản tiếng Việt và tiếng Anh. Nếu bạn thấy bản dịch còn gượng hoặc sai thuật ngữ, hãy đề xuất cách dịch tốt hơn."
      },
      "video": {
        "title": "Làm video",
        "body": "Một video ngắn đôi khi dễ hiểu hơn cả trang chữ. Nếu bạn quay, dựng hoặc vẽ minh hoạ được, hãy gửi ý tưởng hoặc link video bạn đã làm."
      },
      "report": {
        "title": "Báo lỗi",
        "body": "Thấy chỗ sai trong bài? Dùng nút \"Báo lỗi bài này\" ở cuối mỗi bài, hoặc viết qua trang Liên hệ. Mọi báo lỗi đều được đọc."
      }
    },
    "cta": "Nhắn cho tác giả",
    "note": "Chíp Chíp không trả thù lao và không thu phí. Người đóng góp được ghi tên trong bài và ở mục \"Những người đã đồng hành\" trên trang Giới thiệu."
  },
  "privacy": {
    "title": "Chính sách bảo mật",
    "description": "Chíp Chíp thu rất ít dữ liệu. Trang này nói rõ đó là dữ liệu gì, dùng vào việc gì và giữ trong bao lâu.",
    "updated": "Cập nhật ngày {date}",
    "sections": {
      "collect": {
        "title": "Chúng tôi thu những gì",
        "items": {
          "comments": "Khi bạn bình luận: tên bạn nhập, email (không bắt buộc) và nội dung. Tên và nội dung hiện công khai dưới bài. Email không bao giờ hiện công khai, chỉ ban biên tập xem được.",
          "messages": "Khi bạn gửi tin qua trang Liên hệ hoặc nút \"Báo lỗi bài này\": tên, email (không bắt buộc), nội dung, ngôn ngữ của trang và bài bạn đang đọc (nếu là báo lỗi). Chỉ ban biên tập đọc được.",
          "ip": "Địa chỉ IP của bạn không được lưu. Để chống spam, IP được băm một chiều kèm một chuỗi bí mật thành một mã không thể đảo ngược, chỉ dùng để đếm số lần gửi.",
          "none": "Người đọc không cần tài khoản. Trang không dùng cookie quảng cáo, không dùng công cụ theo dõi hay phân tích của bên thứ ba."
        }
      },
      "device": {
        "title": "Cookie và dữ liệu trên máy bạn",
        "items": {
          "locale": "Một cookie tên NEXT_LOCALE ghi nhớ ngôn ngữ bạn chọn.",
          "local": "Trình duyệt ghi nhớ vài lựa chọn giao diện, ví dụ cột chủ đề đang thu gọn. Dữ liệu này nằm trên máy bạn, không gửi về máy chủ.",
          "video": "Video YouTube và TikTok chỉ tải khi bạn bấm phát (YouTube ở chế độ youtube-nocookie). Ảnh xem trước của video YouTube tải từ máy chủ của YouTube. Khi video đã phát, chính sách của nền tảng đó được áp dụng.",
          "staff": "Cookie đăng nhập chỉ dùng cho ban biên tập ở trang quản trị."
        }
      },
      "use": {
        "title": "Dùng vào việc gì",
        "items": {
          "purpose": "Hiện bình luận, đọc và trả lời tin nhắn, sửa lỗi trong bài, và chặn spam.",
          "never": "Không dùng để quảng cáo, không gửi thư tiếp thị, không dựng hồ sơ người đọc."
        }
      },
      "retention": {
        "title": "Giữ trong bao lâu",
        "items": {
          "counter": "Mã băm IP của bộ đếm chống spam tự xoá sau 1 ngày.",
          "content": "Bình luận và tin nhắn được giữ tới khi bạn yêu cầu xoá, hoặc tới khi ban biên tập gỡ chúng."
        }
      },
      "sharing": {
        "title": "Chia sẻ với ai",
        "items": {
          "sell": "Chúng tôi không bán, không cho thuê và không trao đổi dữ liệu của bạn.",
          "host": "Dữ liệu được lưu trên dịch vụ cơ sở dữ liệu Supabase mà dự án sử dụng.",
          "translate": "Khi tác giả dịch nháp một bài, nội dung bài viết đó được gửi tới DeepSeek để dịch. Bình luận, tin nhắn và thông tin của người đọc không bao giờ được gửi đi."
        }
      },
      "rights": {
        "title": "Quyền của bạn",
        "items": {
          "request": "Bạn có thể yêu cầu xem, sửa hoặc xoá bình luận và tin nhắn của mình. Hãy viết qua trang Liên hệ, ghi tên bạn đã dùng và bài có bình luận để chúng tôi tìm được."
        }
      }
    },
    "contactLink": "Gửi yêu cầu qua trang Liên hệ"
  }
```

và trong `src/messages/en.json`, cùng vị trí:

```json
  "contribute": {
    "title": "Contribute",
    "description": "Chíp Chíp is made by one person, but it does not have to be made alone. If you want to help, here are four ways — each one starts with a message.",
    "ways": {
      "write": {
        "title": "Write an article",
        "body": "Understand a semiconductor idea and want to explain it to students? Send an outline or a draft and the author will edit it with you before it goes up. Your name appears at the end of the article."
      },
      "translate": {
        "title": "Translate",
        "body": "Every article exists in Vietnamese and English. If a translation reads awkwardly or gets a term wrong, suggest a better one."
      },
      "video": {
        "title": "Make a video",
        "body": "A short video can explain more than a page of text. If you can film, edit or draw, send an idea or a link to something you have made."
      },
      "report": {
        "title": "Report a mistake",
        "body": "Found an error in an article? Use the \"Report a mistake\" button at the end of every article, or write through the Contact page. Every report is read."
      }
    },
    "cta": "Message the author",
    "note": "Chíp Chíp pays no fees and charges none. Contributors are credited in the article and under \"People who helped\" on the About page."
  },
  "privacy": {
    "title": "Privacy policy",
    "description": "Chíp Chíp collects very little. This page says exactly what, what it is for, and how long it is kept.",
    "updated": "Updated {date}",
    "sections": {
      "collect": {
        "title": "What we collect",
        "items": {
          "comments": "When you comment: the name you enter, an optional email and your comment. The name and comment are shown publicly under the article. The email is never shown publicly; only the editors can see it.",
          "messages": "When you write through the Contact page or the \"Report a mistake\" button: your name, an optional email, your message, the page language and, for a mistake report, the article you were reading. Only the editors can read it.",
          "ip": "Your IP address is not stored. To stop spam, it is run through a one-way hash with a secret value, producing a code that cannot be reversed and is used only to count how often someone sends.",
          "none": "Readers need no account. The site uses no advertising cookies and no third-party tracking or analytics tools."
        }
      },
      "device": {
        "title": "Cookies and data on your device",
        "items": {
          "locale": "One cookie, NEXT_LOCALE, remembers the language you chose.",
          "local": "Your browser remembers a few display choices, such as a collapsed topic column. That stays on your device and is never sent to the server.",
          "video": "YouTube and TikTok videos load only when you press play (YouTube in its youtube-nocookie mode). YouTube preview images load from YouTube's servers. Once a video plays, that platform's own policy applies.",
          "staff": "Sign-in cookies are used only by the editors on the admin pages."
        }
      },
      "use": {
        "title": "What it is used for",
        "items": {
          "purpose": "Showing comments, reading and answering messages, fixing mistakes in articles, and blocking spam.",
          "never": "Never for advertising, marketing email or building reader profiles."
        }
      },
      "retention": {
        "title": "How long it is kept",
        "items": {
          "counter": "The hashed IP codes used by the spam counter are deleted automatically after 1 day.",
          "content": "Comments and messages are kept until you ask for them to be deleted, or until the editors remove them."
        }
      },
      "sharing": {
        "title": "Who it is shared with",
        "items": {
          "sell": "We do not sell, rent or trade your data.",
          "host": "Data is stored with Supabase, the database service the project uses.",
          "translate": "When the author drafts a translation of an article, that article's text is sent to DeepSeek to be translated. Comments, messages and reader details are never sent."
        }
      },
      "rights": {
        "title": "Your rights",
        "items": {
          "request": "You can ask to see, correct or delete your comments and messages. Write through the Contact page, giving the name you used and the article you commented on so we can find them."
        }
      }
    },
    "contactLink": "Send a request through the Contact page"
  }
```

- [ ] **Step 2: Thêm `footer.links` và sửa `comments.emailHint`** — trong `src/messages/vi.json`, khối `"footer"` thành:

```json
  "footer": {
    "copyright": "© 2026 Project Chíp Chíp. Mọi nội dung được chia sẻ vì mục đích giáo dục.",
    "links": {
      "label": "Thông tin",
      "contact": "Liên hệ",
      "contribute": "Đóng góp",
      "privacy": "Chính sách bảo mật"
    }
  }
```

và thay giá trị `comments.emailHint`:

```json
"emailHint": "Không hiển thị công khai. Chỉ ban biên tập thấy, để liên hệ lại khi cần.",
```

Trong `src/messages/en.json`:

```json
  "footer": {
    "copyright": "© 2026 Project Chíp Chíp. All content is shared for educational purposes.",
    "links": {
      "label": "Information",
      "contact": "Contact",
      "contribute": "Contribute",
      "privacy": "Privacy policy"
    }
  }
```

```json
"emailHint": "Never shown publicly. Only the editors see it, to get back to you if needed.",
```

- [ ] **Step 3: Kiểm tập khoá**

Run: `npx vitest run src/messages/keys-parity.test.ts`
Expected: PASS.

- [ ] **Step 4: Hằng số** — trong `src/lib/constants.ts`, thêm ngay trước dòng `/** The two entries under "Lessons" in the navbar. */`:

```ts
/** The trust pages linked from every footer. */
export const FOOTER_LINKS: {
  key: "contact" | "contribute" | "privacy";
  href: StaticPathname;
}[] = [
  { key: "contact", href: "/lien-he" },
  { key: "contribute", href: "/dong-gop" },
  { key: "privacy", href: "/chinh-sach-bao-mat" },
];

```

và thay:

```ts
/** Public contact address, shown in the homepage join block once the mailbox
 *  exists. The footer is a single row and has no place for it. */
export const CONTACT_EMAIL = "";
```

bằng:

```ts
/** Public contact address, shown in the homepage join block and on the
 *  Contact page once the mailbox exists. Blank hides it everywhere. */
export const CONTACT_EMAIL = "";

/** Date the privacy page was last checked against the code (YYYY-MM-DD). */
export const PRIVACY_UPDATED = "2026-09-28";
```

- [ ] **Step 5: Tạo `src/app/[locale]/dong-gop/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clapperboard, Flag, Languages, PenLine, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

const WAYS: { id: "write" | "translate" | "video" | "report"; icon: LucideIcon }[] = [
  { id: "write", icon: PenLine },
  { id: "translate", icon: Languages },
  { id: "video", icon: Clapperboard },
  { id: "report", icon: Flag },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/dong-gop", locale as Locale),
  };
}

export default async function ContributePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contribute");

  return (
    <section className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
            {t("description")}
          </p>
        </header>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {WAYS.map(({ id, icon: Icon }) => (
            <li
              key={id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 md:p-7"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-surface-muted">
                <Icon className="size-5 text-accent" strokeWidth={2} aria-hidden />
              </span>
              <h2 className="text-lg font-bold tracking-[-0.01em] text-text">{t(`ways.${id}.title`)}</h2>
              <p className="text-sm leading-relaxed text-text-muted">{t(`ways.${id}.body`)}</p>
              <Link
                href="/lien-he"
                className="mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
              >
                {t("cta")}
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl text-pretty text-sm leading-relaxed text-text-muted">{t("note")}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Tạo `src/app/[locale]/chinh-sach-bao-mat/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PRIVACY_UPDATED } from "@/lib/constants";
import { localeAlternates } from "@/lib/seo";

/**
 * Every sentence here describes what the code does today — see the DA4 plan
 * (Task 5) for the file each claim was checked against. Change the copy when
 * the behaviour changes, and move PRIVACY_UPDATED with it.
 */
const SECTIONS = [
  { id: "collect", items: ["comments", "messages", "ip", "none"] },
  { id: "device", items: ["locale", "local", "video", "staff"] },
  { id: "use", items: ["purpose", "never"] },
  { id: "retention", items: ["counter", "content"] },
  { id: "sharing", items: ["sell", "host", "translate"] },
  { id: "rights", items: ["request"] },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/chinh-sach-bao-mat", locale as Locale),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format] = await Promise.all([getTranslations("privacy"), getFormatter()]);

  return (
    <article className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">{t("description")}</p>
          <p className="mt-3 text-sm text-text-muted">
            <time dateTime={PRIVACY_UPDATED}>
              {t("updated", {
                date: format.dateTime(new Date(`${PRIVACY_UPDATED}T00:00:00Z`), {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
              })}
            </time>
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`} className="mt-10">
            <h2
              id={`privacy-${section.id}`}
              className="text-xl font-bold tracking-[-0.01em] text-text"
            >
              {t(`sections.${section.id}.title`)}
            </h2>
            <ul className="mt-4 flex list-disc flex-col gap-3 pl-5 text-[15px] leading-relaxed text-text-nav marker:text-text-muted">
              {section.items.map((item) => (
                <li key={item}>{t(`sections.${section.id}.items.${item}`)}</li>
              ))}
            </ul>
          </section>
        ))}

        <Link
          href="/lien-he"
          className="mt-10 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          {t("contactLink")}
        </Link>
      </div>
    </article>
  );
}
```

`timeZone: "UTC"` giữ ngày không trôi một ngày khi server chạy ở múi giờ âm.

- [ ] **Step 7: Link ở footer** — trong `src/components/layout/Footer.tsx`, thay:

```tsx
import { Link } from "@/i18n/navigation";
```

bằng:

```tsx
import { Link } from "@/i18n/navigation";
import { FOOTER_LINKS } from "@/lib/constants";
```

và thay:

```tsx
        <p className="max-w-xs text-center text-xs leading-relaxed text-text-muted md:col-start-2 md:row-start-1 md:max-w-md md:text-sm">
          {t("copyright", { siteName: tMeta("siteName") })}
        </p>
```

bằng:

```tsx
        {/* The trust pages sit in the middle column above the copyright, so the
            footer stays one grid row on desktop; on a phone the links wrap. */}
        <div className="flex flex-col items-center gap-2 md:col-start-2 md:row-start-1">
          <nav aria-label={t("links.label")}>
            <ul className="flex flex-wrap justify-center gap-x-5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm text-text-nav underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="max-w-xs text-center text-xs leading-relaxed text-text-muted md:max-w-md md:text-sm">
            {t("copyright", { siteName: tMeta("siteName") })}
          </p>
        </div>
```

- [ ] **Step 8: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **310** test PASS.

- [ ] **Step 9: Commit**

```bash
git add "src/app/[locale]/dong-gop/page.tsx" "src/app/[locale]/chinh-sach-bao-mat/page.tsx" src/lib/constants.ts src/components/layout/Footer.tsx src/messages/vi.json src/messages/en.json
git commit -m "feat(trust): add contribute and privacy pages and link them from the footer"
```

---

### Task 6: Trang Giới thiệu — tác giả, cam kết, FAQ, người đồng hành, lời mời đóng góp

**Files:**
- Create: `src/lib/initials.ts`, `src/lib/initials.test.ts`
- Create: `src/components/sections/about/{AuthorSection,Commitments,Faq,Contributors,ContributeCta}.tsx`
- Delete: `src/components/sections/about/TeamStructure.tsx`, `src/components/sections/about/JoinFormEmbed.tsx`
- Modify (viết lại toàn file): `src/app/[locale]/gioi-thieu/page.tsx`
- Modify: `src/components/sections/JoinCta.tsx`, `src/lib/constants.ts`, `README.md` (một dòng), `src/messages/{vi,en}.json` (`about`, `home.join`)

**Interfaces:**
- Consumes: Task 1 routes `"/dong-gop"`, `"/lien-he"`, `"/chinh-sach-bao-mat"`; `Link` (`@/i18n/navigation`).
- Produces: `initials(name: string): string` · `AUTHOR: { photo: string | null }` · `CONTRIBUTORS: { name: string; role: string }[]` · năm Server Component không nhận prop: `AuthorSection`, `Commitments`, `Faq`, `Contributors` (trả `null` khi `CONTRIBUTORS` rỗng), `ContributeCta`. Gỡ `JOIN_FORM_URL`, `TEAM_UNITS`, `TeamUnitId`, khoá `about.mission.*`, `about.team.*`, `about.join.*`, `home.join.formNote`, `home.join.formPending`; `home.join.formCta` → `home.join.cta`.

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/initials.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  it("takes the first and last word of a Vietnamese name", () => {
    expect(initials("Nguyễn Văn An")).toBe("NA");
    expect(initials("Đặng Ánh")).toBe("ĐÁ");
  });

  it("keeps accents written as combining marks", () => {
    expect(initials("Ánh")).toBe("Á");
  });

  it("uses one letter for a single word", () => {
    expect(initials("lan")).toBe("L");
  });

  it("skips brackets, digits and extra spaces in the placeholder", () => {
    expect(initials("  [Tên tác giả]  ")).toBe("TG");
    expect(initials("[Author name]")).toBe("AN");
  });

  it("falls back to a question mark when there is no letter", () => {
    expect(initials("")).toBe("?");
    expect(initials("[ 123 ]")).toBe("?");
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/initials.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/initials"`.

- [ ] **Step 3: Viết `src/lib/initials.ts`**

```ts
/**
 * Up to two capital letters for an avatar placeholder: the first letter of the
 * first and of the last word. Brackets and digits are skipped, so the
 * placeholder name "[Tên tác giả]" still gives "TG".
 */
export function initials(name: string): string {
  const [first, ...rest] = name.normalize("NFC").match(/\p{L}[\p{L}\p{M}]*/gu) ?? [];
  if (!first) return "?";
  const last = rest.at(-1);
  const letter = (word: string) => Array.from(word)[0] ?? "";
  return `${letter(first)}${last ? letter(last) : ""}`.toLocaleUpperCase("vi");
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/lib/initials.test.ts`
Expected: PASS — 5 test.

- [ ] **Step 5: Thay namespace `about`** — trong `src/messages/vi.json`, thay **toàn bộ** giá trị của khoá `"about"` bằng (đoạn `why` là nguyên văn `about.mission.body` cũ):

```json
  "about": {
    "title": "Giới thiệu",
    "hero": {
      "headline": "Người đứng sau Project Chíp Chíp",
      "description": "Chíp Chíp là dự án một người làm: một chỗ học bán dẫn bằng tiếng Việt, miễn phí cho mọi học sinh, và luôn mở cho những ai muốn góp sức."
    },
    "author": {
      "label": "Về tác giả",
      "name": "[Tên tác giả]",
      "role": "[Vai trò, ví dụ: sinh viên ngành thiết kế vi mạch] · Người viết và duy trì Chíp Chíp",
      "photoAlt": "Ảnh chân dung của [Tên tác giả]",
      "story1": "[Câu chuyện, đoạn 1] Mình bắt đầu tìm hiểu về bán dẫn từ [thời điểm], khi [sự kiện khiến bạn tò mò]. Tài liệu tốt gần như chỉ có bằng tiếng Anh, và mình mất khá lâu mới hiểu được những điều lẽ ra có thể giải thích đơn giản hơn.",
      "story2": "[Câu chuyện, đoạn 2] Chíp Chíp là trang mình ước đã có từ hồi đó. Mình tự viết bài, tự dựng trang, và nhờ bạn bè, thầy cô góp ý để nội dung đúng và dễ hiểu.",
      "whyTitle": "Vì sao có Chíp Chíp",
      "why": "Vì sao một học sinh cấp ba có thể hiểu van tim hoạt động ra sao, nhưng lại không biết con chip trong chiếc điện thoại mình cầm mỗi ngày được làm thế nào? Bán dẫn ở khắp nơi, nhưng kiến thức về nó lại nằm rải rác trong tài liệu tiếng Anh, trong bài giảng đại học, trong những video không có phụ đề. Học sinh Việt Nam không thiếu tò mò — các em thiếu một chỗ để bắt đầu. Project Chíp Chíp làm chỗ bắt đầu đó: tài liệu tiếng Việt, đi từ khái niệm đơn giản nhất, miễn phí cho tất cả mọi người."
    },
    "commitments": {
      "headline": "Mục đích minh bạch",
      "description": "Bốn cam kết này không thay đổi, dù sau này dự án lớn đến đâu.",
      "items": {
        "free": {
          "title": "Miễn phí",
          "body": "Mọi bài học, video và bài viết đều đọc được miễn phí, không cần tài khoản."
        },
        "noAds": {
          "title": "Không quảng cáo",
          "body": "Không banner, không bài quảng cáo trá hình, không nhà tài trợ chen vào nội dung."
        },
        "noFees": {
          "title": "Không thu tiền",
          "body": "Không khoá học trả phí, không gói hội viên, không xin chuyển khoản."
        },
        "noDataSale": {
          "title": "Không bán dữ liệu",
          "body": "Chúng tôi thu rất ít dữ liệu, và không bán hay trao đổi dữ liệu đó với ai."
        }
      },
      "privacyLink": "Xem dữ liệu nào được thu và vì sao"
    },
    "faq": {
      "headline": "Câu hỏi thường gặp",
      "items": {
        "free": {
          "question": "Chíp Chíp có miễn phí không?",
          "answer": "Có. Mọi nội dung đều miễn phí và không cần đăng ký tài khoản. Dự án không bán gì và không có phần nội dung trả phí."
        },
        "author": {
          "question": "Ai viết các bài trên Chíp Chíp?",
          "answer": "Phần lớn bài do tác giả của dự án viết. Bài có người đóng góp hoặc góp ý thì ghi tên họ ở cuối bài."
        },
        "mistake": {
          "question": "Thấy bài sai thì báo ở đâu?",
          "answer": "Bấm nút \"Báo lỗi bài này\" ở cuối bài, hoặc viết qua trang Liên hệ. Tác giả đọc mọi báo lỗi và sửa bài khi cần."
        },
        "classroom": {
          "question": "Giáo viên có dùng bài cho lớp học được không?",
          "answer": "Được. Bạn cứ dùng bài cho việc dạy học không thu phí, chỉ cần ghi nguồn Project Chíp Chíp và dẫn link tới bài gốc."
        },
        "ads": {
          "question": "Trang có quảng cáo không?",
          "answer": "Không. Trang không có quảng cáo, không dùng cookie quảng cáo và không bán dữ liệu người đọc."
        },
        "english": {
          "question": "Có bản tiếng Anh không?",
          "answer": "Có. Bài chỉ được đăng khi đã có đủ bản tiếng Việt và tiếng Anh. Nút chuyển ngôn ngữ nằm trên thanh điều hướng."
        }
      }
    },
    "contributors": {
      "headline": "Những người đã đồng hành",
      "description": "Cảm ơn những người đã viết, dịch, góp ý và báo lỗi cho Chíp Chíp."
    },
    "cta": {
      "headline": "Cùng làm Chíp Chíp tốt hơn",
      "description": "Bạn có thể viết bài, dịch, làm video hoặc đơn giản là báo một lỗi sai. Mỗi đóng góp đều được ghi nhận.",
      "contribute": "Xem cách đóng góp",
      "contact": "Liên hệ tác giả"
    }
  }
```

Trong `src/messages/en.json`:

```json
  "about": {
    "title": "About",
    "hero": {
      "headline": "The person behind Project Chíp Chíp",
      "description": "Chíp Chíp is a one-person project: a place to learn about semiconductors in Vietnamese, free for every student, and always open to anyone who wants to help."
    },
    "author": {
      "label": "About the author",
      "name": "[Author name]",
      "role": "[Role, e.g. chip design student] · Writes and maintains Chíp Chíp",
      "photoAlt": "Portrait of [Author name]",
      "story1": "[Story, paragraph 1] I started learning about semiconductors in [when], after [what made you curious]. Good material was almost all in English, and it took me a long time to understand things that could have been explained much more simply.",
      "story2": "[Story, paragraph 2] Chíp Chíp is the site I wish I had back then. I write the articles and build the site myself, and ask friends and teachers to check that the content is correct and easy to follow.",
      "whyTitle": "Why Chíp Chíp exists",
      "why": "Why can a high-school student explain how a heart valve works, yet not how the chip inside the phone they carry every day is made? Semiconductors are everywhere, but the knowledge about them is scattered across English papers, university lectures and videos with no subtitles. Vietnamese students are not short of curiosity — they are short of a place to start. Project Chíp Chíp is that place: Vietnamese-language material, starting from the simplest idea, free for everyone."
    },
    "commitments": {
      "headline": "A transparent purpose",
      "description": "These four commitments will not change, however large the project grows.",
      "items": {
        "free": {
          "title": "Free",
          "body": "Every lesson, video and article is free to read, with no account needed."
        },
        "noAds": {
          "title": "No ads",
          "body": "No banners, no disguised advertising, no sponsors inside the content."
        },
        "noFees": {
          "title": "No fees",
          "body": "No paid courses, no memberships, no requests for money."
        },
        "noDataSale": {
          "title": "No data sales",
          "body": "We collect very little data, and we never sell or trade it."
        }
      },
      "privacyLink": "See what data is collected and why"
    },
    "faq": {
      "headline": "Frequently asked questions",
      "items": {
        "free": {
          "question": "Is Chíp Chíp free?",
          "answer": "Yes. Everything is free and needs no account. The project sells nothing and has no paid content."
        },
        "author": {
          "question": "Who writes the articles?",
          "answer": "Most articles are written by the project's author. When someone contributes or reviews an article, their name is credited at the end."
        },
        "mistake": {
          "question": "Where do I report a mistake?",
          "answer": "Press \"Report a mistake\" at the end of the article, or write through the Contact page. The author reads every report and corrects the article when needed."
        },
        "classroom": {
          "question": "Can teachers use the articles in class?",
          "answer": "Yes. Use them freely for non-commercial teaching; just credit Project Chíp Chíp and link to the original article."
        },
        "ads": {
          "question": "Does the site show ads?",
          "answer": "No. There are no ads, no advertising cookies, and reader data is never sold."
        },
        "english": {
          "question": "Is there an English version?",
          "answer": "Yes. An article is only published once both the Vietnamese and the English versions exist. The language switch is in the navigation bar."
        }
      }
    },
    "contributors": {
      "headline": "People who helped",
      "description": "Thank you to everyone who has written, translated, reviewed or reported mistakes for Chíp Chíp."
    },
    "cta": {
      "headline": "Help make Chíp Chíp better",
      "description": "You can write, translate, make a video, or simply report a mistake. Every contribution is credited.",
      "contribute": "See how to contribute",
      "contact": "Contact the author"
    }
  }
```

- [ ] **Step 6: Sửa `home.join`** — trong `src/messages/vi.json`, giá trị `home.join` thành:

```json
    "join": {
      "headline": "Tham gia cùng chúng tôi",
      "description": "Chíp Chíp đang tìm những bạn muốn cùng viết, dịch, làm video hoặc báo lỗi để bài học tốt hơn.",
      "cta": "Xem cách đóng góp",
      "badge": "Dự án Chíp Chíp · Học bán dẫn miễn phí · "
    }
```

Trong `src/messages/en.json`:

```json
    "join": {
      "headline": "Join us",
      "description": "Chíp Chíp is looking for people who want to write, translate, make videos or report mistakes to make the lessons better.",
      "cta": "See how to contribute",
      "badge": "Project Chíp Chíp · Learn semiconductors free · "
    }
```

- [ ] **Step 7: Kiểm tập khoá**

Run: `npx vitest run src/messages/keys-parity.test.ts`
Expected: PASS.

- [ ] **Step 8: Hằng số** — trong `src/lib/constants.ts`, xoá khối:

```ts
/** Google Form for member sign-up. Swap in the real form URL (the `viewform`
 *  link, not the `edit` link) once it exists. */
export const JOIN_FORM_URL = "";

```

và thay toàn bộ khối từ `/**\n * Organisational units from the project plan.` tới hết dòng `export type TeamUnitId = (typeof TEAM_UNITS)[number]["id"];` bằng:

```ts
/**
 * The author shown on the About page. PLACEHOLDER until DA5: the name and
 * story live in `about.author.*` in the message files; `photo` is a path
 * under `public/` (or null, which draws neutral initials instead).
 */
export const AUTHOR: { photo: string | null } = { photo: null };

/**
 * People credited under "People who helped" on the About page. The section is
 * hidden while this is empty. `role` is shown as written, in both languages.
 */
export const CONTRIBUTORS: { name: string; role: string }[] = [];
```

- [ ] **Step 9: Xoá hai component cũ**

```bash
git rm src/components/sections/about/TeamStructure.tsx src/components/sections/about/JoinFormEmbed.tsx
```

`git rm` xoá luôn thư mục `about/` khi nó rỗng — bước 10 tạo lại.

- [ ] **Step 10: Tạo năm khối** — `mkdir -p src/components/sections/about`, rồi:

`src/components/sections/about/AuthorSection.tsx`:

```tsx
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AUTHOR } from "@/lib/constants";
import { initials } from "@/lib/initials";

/** Who makes Chíp Chíp and why. Copy is placeholder until DA5 — see README. */
export async function AuthorSection() {
  const t = await getTranslations("about.author");
  const name = t("name");

  return (
    <section aria-labelledby="about-author" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-content gap-8 rounded-3xl border border-border bg-surface px-6 py-10 md:grid-cols-[200px_1fr] md:gap-12 md:px-12 md:py-14">
        <div className="relative size-32 overflow-hidden rounded-full bg-surface-muted md:size-44">
          {AUTHOR.photo ? (
            <Image src={AUTHOR.photo} alt={t("photoAlt")} fill sizes="176px" className="object-cover" />
          ) : (
            // Neutral initials rather than a stock face: a placeholder that
            // looks like a real photo would claim more than we know.
            <span
              aria-hidden
              className="flex size-full items-center justify-center text-4xl font-extrabold tracking-[-0.02em] text-text-nav md:text-5xl"
            >
              {initials(name)}
            </span>
          )}
        </div>

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{t("label")}</p>
          <h2
            id="about-author"
            className="mt-2 text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
          >
            {name}
          </h2>
          <p className="mt-2 text-sm text-text-muted">{t("role")}</p>

          <div className="mt-6 flex flex-col gap-4 text-pretty text-[15px] leading-relaxed text-text-nav md:text-base">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
          </div>

          <h3 className="mt-8 text-lg font-bold tracking-[-0.01em] text-text">{t("whyTitle")}</h3>
          <p className="mt-3 text-pretty text-[15px] leading-relaxed text-text-nav md:text-base">{t("why")}</p>
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/about/Commitments.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, Ban, HandCoins, ShieldCheck, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

const ITEMS: { id: "free" | "noAds" | "noFees" | "noDataSale"; icon: LucideIcon }[] = [
  { id: "free", icon: BadgeCheck },
  { id: "noAds", icon: Ban },
  { id: "noFees", icon: HandCoins },
  { id: "noDataSale", icon: ShieldCheck },
];

export async function Commitments() {
  const t = await getTranslations("about.commitments");

  return (
    <section aria-labelledby="about-commitments" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h2
            id="about-commitments"
            className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
          >
            {t("headline")}
          </h2>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
            {t("description")}
          </p>
        </header>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ id, icon: Icon }) => (
            <li key={id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
              <Icon className="size-5 text-accent" strokeWidth={2} aria-hidden />
              <h3 className="text-[15px] font-bold leading-snug text-text">{t(`items.${id}.title`)}</h3>
              <p className="text-[13px] leading-relaxed text-text-muted">{t(`items.${id}.body`)}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/chinh-sach-bao-mat"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
        >
          {t("privacyLink")}
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
```

`src/components/sections/about/Faq.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

const QUESTIONS = ["free", "author", "mistake", "classroom", "ads", "english"] as const;

/**
 * Native `<details>` accordion: no JavaScript, closed by default, works with
 * keyboard and screen readers as is. One markup for every breakpoint — nothing
 * here must stay open on desktop, so there is no need for the DA3 two-copy
 * trick (CSS cannot reveal a closed `<details>`).
 */
export async function Faq() {
  const t = await getTranslations("about.faq");

  return (
    <section aria-labelledby="about-faq" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-content gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <h2
          id="about-faq"
          className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
        >
          {t("headline")}
        </h2>

        <div className="divide-y divide-border border-y border-border">
          {QUESTIONS.map((id) => (
            <details key={id} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-text transition-colors hover:text-accent md:text-base [&::-webkit-details-marker]:hidden">
                {t(`items.${id}.question`)}
                <Plus
                  className="size-5 shrink-0 text-text-muted transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                  strokeWidth={2}
                  aria-hidden
                />
              </summary>
              <p className="pb-5 pr-9 text-pretty text-[15px] leading-relaxed text-text-muted">
                {t(`items.${id}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/about/Contributors.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { CONTRIBUTORS } from "@/lib/constants";

/** Hidden until someone has actually helped — an empty "thank you" list reads worse than none. */
export async function Contributors() {
  if (CONTRIBUTORS.length === 0) return null;
  const t = await getTranslations("about.contributors");

  return (
    <section aria-labelledby="about-contributors" className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-content">
        <h2
          id="about-contributors"
          className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
        >
          {t("headline")}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
          {t("description")}
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONTRIBUTORS.map((person) => (
            <li key={person.name} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[15px] font-bold text-text">{person.name}</p>
              <p className="mt-1 text-[13px] text-text-muted">{person.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

`src/components/sections/about/ContributeCta.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** Closing block of the About page; replaces the old Google Form sign-up. */
export async function ContributeCta() {
  const t = await getTranslations("about.cta");

  return (
    <section aria-labelledby="about-cta" className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content rounded-3xl bg-primary px-6 py-12 md:px-14 md:py-16">
        <h2
          id="about-cta"
          className="max-w-2xl text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-white md:text-[34px]"
        >
          {t("headline")}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 md:text-base">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dong-gop"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-accent transition-colors hover:bg-white/90"
          >
            {t("contribute")}
            <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
          </Link>
          <Link
            href="/lien-he"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t("contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 11: Viết lại `src/app/[locale]/gioi-thieu/page.tsx`** (toàn file):

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthorSection } from "@/components/sections/about/AuthorSection";
import { Commitments } from "@/components/sections/about/Commitments";
import { ContributeCta } from "@/components/sections/about/ContributeCta";
import { Contributors } from "@/components/sections/about/Contributors";
import { Faq } from "@/components/sections/about/Faq";
import { localeAlternates } from "@/lib/seo";
import { ABOUT_BANNER } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("hero.description"),
    alternates: localeAlternates("/gioi-thieu", locale as Locale),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <>
      <section className="px-5 pb-10 pt-14 md:px-8 md:pt-20">
        <div className="mx-auto grid w-full max-w-content items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <header className="max-w-3xl">
            <h1 className="text-balance text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-text md:text-[48px]">
              {t("hero.headline")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-text-muted md:text-lg">
              {t("hero.description")}
            </p>
          </header>

          {/* The page opened with nothing but type; this gives it something to
              look at before the reader starts reading. Placeholder art — see
              ABOUT_BANNER in lib/constants.ts. */}
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl border border-border bg-surface-muted">
            <Image
              src={ABOUT_BANNER}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <AuthorSection />
      <Commitments />
      <Faq />
      <Contributors />
      <ContributeCta />
    </>
  );
}
```

- [ ] **Step 12: CTA trang chủ** — trong `src/components/sections/JoinCta.tsx`, thay:

```tsx
import { ArrowUpRight, Clock } from "lucide-react";
```

bằng:

```tsx
import { ArrowRight } from "lucide-react";
```

thay:

```tsx
import {
  CONTACT_EMAIL,
  CTA_BACKDROP,
  JOIN_FORM_URL,
  NAV_ITEMS,
} from "@/lib/constants";
```

bằng:

```tsx
import { CONTACT_EMAIL, CTA_BACKDROP, NAV_ITEMS } from "@/lib/constants";
```

và thay cả khối từ dòng `{/* Until the form exists there is nothing to click. A disabled` tới hết `)}` đóng nhánh `formPending` (ngay trước `{CONTACT_EMAIL && (`) bằng:

```tsx
              <Link
                href="/dong-gop"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="inline-flex h-[52px] items-center gap-2 rounded-3xl bg-white px-6 text-base font-semibold text-accent transition-transform duration-200 hover:scale-[1.02]"
              >
                <AnimatedButtonLabel active={hovered}>{t("cta")}</AnimatedButtonLabel>
                <ArrowRight className="size-[18px]" strokeWidth={2.2} />
              </Link>

```

- [ ] **Step 13: README** — trong bảng "Đang chờ dữ liệu" của `README.md`, xoá dòng:

```
| `JOIN_FORM_URL`     | Link Google Form đăng ký thành viên           |
```

- [ ] **Step 14: Không còn gì trỏ tới thứ đã gỡ**

Run: `grep -rn "TEAM_UNITS\|TeamUnitId\|JOIN_FORM_URL\|JoinFormEmbed\|TeamStructure\|about\.mission\|about\.team\|about\.join\|formPending\|formNote" src README.md`
Expected: không có dòng nào.

- [ ] **Step 15: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **315** test PASS.

- [ ] **Step 16: Commit**

```bash
git add src/lib/initials.ts src/lib/initials.test.ts src/components/sections/about "src/app/[locale]/gioi-thieu/page.tsx" src/components/sections/JoinCta.tsx src/lib/constants.ts README.md src/messages/vi.json src/messages/en.json
git commit -m "feat(about): replace the team structure with author, commitments, FAQ and a contribute call"
```

(`git add src/components/sections/about` ghi nhận cả năm file mới; hai file đã xoá được `git rm` stage từ bước 9.)

---

### Task 7: Thẻ blog nở ra khi bấm

**Files:**
- Create: `src/lib/plain-click.ts`, `src/lib/plain-click.test.ts`
- Create: `src/components/forum/ExpandingCardLink.tsx`
- Modify (viết lại toàn file): `src/components/forum/PostCard.tsx`
- Modify: `src/app/[locale]/blog/page.tsx`, `src/components/sections/LatestPosts.tsx`

**Interfaces:**
- Consumes: `PostHref` (`@/lib/paths`); `Link`, `useRouter` (`@/i18n/navigation`); `EASE_STANDARD` (`@/components/motion`).
- Produces: `EXPAND_MS = 400` · `isPlainLeftClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }): boolean` · `ExpandingCardLink({ href, className, children }: { href: PostHref; className?: string; children: ReactNode })` · `PostCard` thêm prop `expand?: boolean` (mặc định `false`, nên trang Bài học và mọi chỗ khác không đổi).

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/plain-click.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { EXPAND_MS, isPlainLeftClick } from "@/lib/plain-click";

const plain = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
};

describe("isPlainLeftClick", () => {
  it("takes over an unmodified primary click", () => {
    expect(isPlainLeftClick(plain)).toBe(true);
  });

  it.each([
    ["Cmd-click", { metaKey: true }],
    ["Ctrl-click", { ctrlKey: true }],
    ["Shift-click", { shiftKey: true }],
    ["Alt-click", { altKey: true }],
    ["middle click", { button: 1 }],
    ["right click", { button: 2 }],
    ["an already handled click", { defaultPrevented: true }],
  ])("leaves %s to the browser", (_, change) => {
    expect(isPlainLeftClick({ ...plain, ...change })).toBe(false);
  });
});

describe("EXPAND_MS", () => {
  it("stays inside the 350–450 ms window", () => {
    expect(EXPAND_MS).toBeGreaterThanOrEqual(350);
    expect(EXPAND_MS).toBeLessThanOrEqual(450);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/plain-click.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/plain-click"`.

- [ ] **Step 3: Viết `src/lib/plain-click.ts`**

```ts
/**
 * How long the expanding blog card grows before navigating. Inside the spec's
 * 0.35–0.45 s window and under its 450 ms ceiling on delaying navigation.
 */
export const EXPAND_MS = 400;

type ClickLike = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/**
 * True only for an unmodified primary click — the one case the card may take
 * over. Ctrl/Cmd-click (new tab), Shift-click (new window), Alt-click
 * (download), middle click and anything already handled stay with the browser.
 */
export function isPlainLeftClick(event: ClickLike): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/lib/plain-click.test.ts`
Expected: PASS — 9 test.

- [ ] **Step 5: Tạo `src/components/forum/ExpandingCardLink.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_STANDARD } from "@/components/motion";
import { Link, useRouter } from "@/i18n/navigation";
import type { PostHref } from "@/lib/paths";
import { EXPAND_MS, isPlainLeftClick } from "@/lib/plain-click";

type Box = { top: number; left: number; width: number; height: number };

/**
 * A card link that grows to fill the screen before navigating.
 *
 * Still a real `<a>`: Ctrl/Cmd-click, middle click and "open in new tab" are
 * left to the browser, and only a plain left click plays the animation. With
 * reduced motion it is an ordinary link.
 *
 * The growing surface is a blank panel portalled to `<body>` rather than the
 * card itself: cards sit inside TiltCard (`perspective`) and motion wrappers
 * (`transform`), and either one turns `position: fixed` into "fixed to the
 * card", so the card could never escape its grid cell.
 */
export function ExpandingCardLink({
  href,
  className,
  children,
}: {
  href: PostHref;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [from, setFrom] = useState<Box | null>(null);
  const [grown, setGrown] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Mount at the card's box first, then switch to full screen on the next
  // frame so `layout` has a before and an after to animate between.
  useEffect(() => {
    if (!from) return;
    const frame = window.requestAnimationFrame(() => setGrown(true));
    return () => window.cancelAnimationFrame(frame);
  }, [from]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion || from || !isPlainLeftClick(event)) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setFrom({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    router.prefetch(href);
    timer.current = window.setTimeout(() => router.push(href), EXPAND_MS);
  };

  return (
    <>
      <Link href={href} onClick={onClick} className={className}>
        {children}
      </Link>
      {from &&
        createPortal(
          <motion.div
            aria-hidden
            layout
            transition={{ layout: { duration: EXPAND_MS / 1000, ease: EASE_STANDARD } }}
            className="fixed z-[1500] border border-border bg-surface shadow-card-hover"
            style={
              grown
                ? { top: 0, left: 0, width: "100vw", height: "100dvh", borderRadius: 16 }
                : { ...from, borderRadius: 16 }
            }
          />,
          document.body
        )}
    </>
  );
}
```

Vì sao như vậy: `useReducedMotion()` bật thì `onClick` không làm gì, `Link` điều hướng như thường. `from` khác `null` là cờ "đang chạy", chặn bấm đúp. Timer bị huỷ khi component unmount (ví dụ người dùng bấm Back trong 400 ms). Tấm nền có `aria-hidden` và không nhận focus; `z-[1500]` nằm trên navbar (`z-[1000]`/`z-[1001]`).

- [ ] **Step 6: Viết lại `src/components/forum/PostCard.tsx`** (toàn file):

```tsx
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { ExpandingCardLink } from "@/components/forum/ExpandingCardLink";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/types";
import { TOPIC_TONE } from "@/lib/constants";
import { postHref } from "@/lib/paths";

export async function PostCard({
  post,
  showTopic = false,
  expand = false,
}: {
  post: PostSummary;
  showTopic?: boolean;
  /** Grow the card to full screen before opening the post (blog listings). */
  expand?: boolean;
}) {
  const format = await getFormatter();
  const t = await getTranslations("forum");
  const tTopics = await getTranslations("topics");
  const tDifficulty = await getTranslations("difficulty");
  const tone = post.topic ? TOPIC_TONE[post.topic] : null;

  const href = postHref(post);
  // Only a lesson that lost its topic has no page; a card pointing at a 404
  // would be worse than no card.
  if (!href) return null;

  const className =
    "group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-black/20 hover:shadow-card-hover";

  const body = (
    <>
      {/* Always 16:9, whether or not the article has a cover. A card without
          one used to start shorter and end up out of line with its neighbours;
          the empty block keeps the row level. Neutral and wordless so it reads
          as reserved space rather than as a missing image. */}
      {post.coverImageUrl ? (
        <div className="relative mb-1 aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={post.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="mb-1 aspect-video w-full rounded-xl bg-surface-muted"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {showTopic && post.topic && tone && (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: tone.soft, color: tone.text }}
          >
            {tTopics(`${post.topic}.title`)}
          </span>
        )}
        {post.difficulty && (
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-text-muted">
            {tDifficulty(post.difficulty)}
          </span>
        )}
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="text-xs text-text-muted"
          >
            {format.dateTime(new Date(post.publishedAt), {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      <h3 className="text-balance text-lg font-bold leading-snug tracking-[-0.01em] text-text">
        {post.title}
      </h3>

      {/* Reserved to three lines — the most `line-clamp-3` will ever show — so
          a card whose excerpt is missing or one line long still ends where its
          neighbours do. `mt-auto` below then lands every "read more" on the
          same baseline. */}
      <div className="min-h-[68px]">
        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">
            {post.excerpt}
          </p>
        )}
      </div>

      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-accent transition-transform duration-300 group-hover:translate-x-0.5">
        {t("readMore")}
        <ArrowRight className="size-4" strokeWidth={2.2} />
      </span>
    </>
  );

  return expand ? (
    <ExpandingCardLink href={href} className={className}>
      {body}
    </ExpandingCardLink>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
```

- [ ] **Step 7: Bật ở blog và trang chủ** — trong `src/app/[locale]/blog/page.tsx` và `src/components/sections/LatestPosts.tsx`, thay:

```tsx
<PostCard key={post.id} post={post} />
```

bằng:

```tsx
<PostCard key={post.id} post={post} expand />
```

- [ ] **Step 8: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi; **324** test PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/plain-click.ts src/lib/plain-click.test.ts src/components/forum/ExpandingCardLink.tsx src/components/forum/PostCard.tsx "src/app/[locale]/blog/page.tsx" src/components/sections/LatestPosts.tsx
git commit -m "feat(blog): grow a blog card to full screen before opening the post"
```

---

### Task 8: README, cổng kiểm và nghiệm thu toàn bộ DA4

**Files:**
- Modify: `README.md`
- Sửa chỗ hỏng nếu nghiệm thu phát hiện: mỗi lỗi một commit `fix:`, kèm test hồi quy nếu kiểm được bằng Vitest.
- Không tạo file trong repo cho dữ liệu thử: SQL dưới đây lưu ở `$TMPDIR`.

**Interfaces:**
- Consumes: mọi thứ ở Task 1–7.
- Produces: README có route mới và mục "Nội dung cần thay trước khi ra mắt"; báo cáo nghiệm thu.

- [ ] **Step 1: Cập nhật `README.md`**

(a) Trong khối cấu trúc, thay:

```
│   │   ├── blog/                  Blog → [slug]
│   │   └── gioi-thieu/            Giới thiệu
```

bằng:

```
│   │   ├── blog/                  Blog → [slug]
│   │   ├── gioi-thieu/            Giới thiệu (tác giả, cam kết, FAQ)
│   │   ├── lien-he/               Liên hệ (form gửi /api/messages)
│   │   ├── dong-gop/              Đóng góp
│   │   └── chinh-sach-bao-mat/    Chính sách bảo mật
```

và thay:

```
│   ├── forum/             PostCard, ArticleBody, CommentSection
```

bằng:

```
│   ├── forum/             PostCard, ExpandingCardLink, ArticleBody, CommentSection
│   ├── contact/           MessageForm, ReportMistake ("Báo lỗi bài này")
```

(b) Trong bảng "Ngôn ngữ", thay:

```
| `/vi/gioi-thieu`  | `/en/about`    |
```

bằng:

```
| `/vi/gioi-thieu`  | `/en/about`    |
| `/vi/lien-he`     | `/en/contact`  |
| `/vi/dong-gop`    | `/en/contribute` |
| `/vi/chinh-sach-bao-mat` | `/en/privacy` |
```

(c) Ngay sau đoạn `DA3 (bài học, video, tìm kiếm) cũng **không có migration mới**. …` thêm:

```markdown

DA4 (trang uy tín, blog) **không có migration mới**: form Liên hệ và "Báo lỗi bài này" dùng `/api/messages` và bảng `messages` có sẵn, chung giới hạn 3 tin mỗi giờ cho mỗi IP (đã băm).
```

(d) Ngay trước dòng `### Đang chờ dữ liệu` thêm:

```markdown
### Nội dung cần thay trước khi ra mắt

DA4 dựng các trang uy tín bằng câu chữ mẫu. Chỗ nào là mẫu thì câu chữ tự ghi
trong ngoặc vuông, ví dụ "[Tên tác giả]". DA5 thay theo danh sách này
(khoá message có ở **cả** `src/messages/vi.json` và `en.json`):

| Nơi | Khoá / hằng số | Cần gì |
| --- | --- | --- |
| Messages | `about.author.name`, `about.author.role`, `about.author.photoAlt` | Tên, vai trò thật của tác giả |
| Messages | `about.author.story1`, `about.author.story2` | Câu chuyện thật, 2 đoạn |
| Messages | `about.faq.items.*` (6 câu: `free`, `author`, `mistake`, `classroom`, `ads`, `english`) | **Câu mẫu** — duyệt lại từng câu, nhất là `classroom` (điều kiện dùng bài cho lớp học) |
| Messages | `contact.aside.responseBody` | Thời gian phản hồi thật |
| Messages | `contribute.*` | Duyệt lại bốn cách đóng góp cho khớp cách làm thật |
| `src/lib/constants.ts` | `AUTHOR.photo` | Đường dẫn ảnh trong `public/`; `null` thì hiện chữ cái đầu |
| `src/lib/constants.ts` | `CONTRIBUTORS` | `{ name, role }[]`; rỗng thì mục "Những người đã đồng hành" ẩn |
| `src/lib/constants.ts` | `CONTACT_EMAIL` | Email liên hệ; rỗng thì ẩn ở trang Liên hệ và khối cuối trang chủ |
| `src/lib/constants.ts` | `SOCIAL_LINKS` | URL Facebook, TikTok; rỗng thì ẩn |
| `src/lib/constants.ts` | `PRIVACY_UPDATED` | Đổi khi sửa chính sách bảo mật |

Trang Chính sách bảo mật (`privacy.*`) mô tả đúng cách code chạy ngày
2026-09-28 (bảng `comments`, `messages`, `comment_rate_limit`, cookie
`NEXT_LOCALE`, dịch nháp DeepSeek). Đổi cách thu hoặc lưu dữ liệu thì sửa
trang này cùng lúc.
```

- [ ] **Step 2: Cổng cục bộ** (dừng mọi `next dev` trước)

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: tất cả xanh; **324** test. Build: bảng route có `/[locale]/lien-he`, `/[locale]/dong-gop`, `/[locale]/chinh-sach-bao-mat`, `/[locale]/gioi-thieu` (xem Global Constraints về build thoát giữa chừng và EPERM).

- [ ] **Step 3: Nạp dữ liệu thử — CHỈ trên stack local** (`npx supabase start` đã chạy; **không** `db reset`). Kiểm đúng máy local trước:

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -A -c "select inet_server_addr();"`
Expected: `127.0.0.1` hoặc `172.x.x.x` (container Docker). Kết nối tới host nào khác: dừng lại.

Lưu đoạn sau vào `$TMPDIR/da4-seed.sql` (idempotent nhờ `on conflict (locale, slug) do nothing`; mọi slug bắt đầu bằng `da4-seed-`):

```sql
-- DA4 acceptance data. LOCAL STACK ONLY. Remove with the cleanup in Step 6.
-- 2 blog posts, 1 lesson and 1 video, each in VI and EN. The video points at
-- the lesson, so the lesson page shows "Related videos" after the report box.
insert into public.posts
  (translation_id, locale, kind, topic, difficulty, title, slug, excerpt, content, plain_text,
   video_platform, video_external_id, video_source, channel_name, related_lesson_translation_id,
   status, published_at)
values
  ('00000000-0000-4000-8000-0000000da401', 'vi', 'forum', null, null,
   'Bài blog thử một', 'da4-seed-bai-blog-mot', 'Bài thử cho thẻ nở ra.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Đoạn 1. Đoạn 2 có lỗi chính tả."}]}]}',
   'Đoạn 1. Đoạn 2 có lỗi chính tả.',
   null, null, null, null, null, 'published', now() - interval '2 days'),
  ('00000000-0000-4000-8000-0000000da401', 'en', 'forum', null, null,
   'Test blog post one', 'da4-seed-blog-post-one', 'A test post for the expanding card.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Paragraph 1. Paragraph 2 has a typo."}]}]}',
   'Paragraph 1. Paragraph 2 has a typo.',
   null, null, null, null, null, 'published', now() - interval '2 days'),
  ('00000000-0000-4000-8000-0000000da402', 'vi', 'forum', null, null,
   'Bài blog thử hai', 'da4-seed-bai-blog-hai', 'Bài thử thứ hai.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Nội dung bài thử hai."}]}]}',
   'Nội dung bài thử hai.',
   null, null, null, null, null, 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-0000000da402', 'en', 'forum', null, null,
   'Test blog post two', 'da4-seed-blog-post-two', 'The second test post.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Body of the second test post."}]}]}',
   'Body of the second test post.',
   null, null, null, null, null, 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-0000000da403', 'vi', 'lesson', 'nguyen-ly', 'basic',
   'Điốt là gì?', 'da4-seed-diode-la-gi', 'Van một chiều của dòng điện.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Điốt cho dòng điện đi theo một chiều."}]}]}',
   'Điốt cho dòng điện đi theo một chiều.',
   null, null, null, null, null, 'published', now() - interval '3 days'),
  ('00000000-0000-4000-8000-0000000da403', 'en', 'lesson', 'nguyen-ly', 'basic',
   'What is a diode?', 'da4-seed-what-is-a-diode', 'A one-way valve for current.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"A diode lets current flow one way."}]}]}',
   'A diode lets current flow one way.',
   null, null, null, null, null, 'published', now() - interval '3 days'),
  ('00000000-0000-4000-8000-0000000da404', 'vi', 'video', 'nguyen-ly', 'basic',
   'Điốt hoạt động thế nào?', 'da4-seed-diode-hoat-dong', 'Video thử.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Mô tả video thử."}]}]}',
   'Mô tả video thử.',
   'youtube', 'IcrBqCFLHIY', 'own', null, '00000000-0000-4000-8000-0000000da403',
   'published', now() - interval '3 days'),
  ('00000000-0000-4000-8000-0000000da404', 'en', 'video', 'nguyen-ly', 'basic',
   'How does a diode work?', 'da4-seed-how-a-diode-works', 'A test video.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test video description."}]}]}',
   'Test video description.',
   'youtube', 'IcrBqCFLHIY', 'own', null, '00000000-0000-4000-8000-0000000da403',
   'published', now() - interval '3 days')
on conflict (locale, slug) do nothing;
```

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f "$TMPDIR/da4-seed.sql"`
Expected: `INSERT 0 8` lần đầu, `INSERT 0 0` khi chạy lại.

Đặt lại bộ đếm tin nhắn trước mỗi lượt nghiệm thu (chỉ local):

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "delete from public.comment_rate_limit where scope = 'message';"`

- [ ] **Step 4: Chạy app**

Run: `NODE_ENV=development npx next dev -p 3000`

- [ ] **Step 5: Nghiệm thu bằng trình duyệt** — 375 × 812 và 1440 × 900, cả `/vi/…` và `/en/…`; Console mở suốt buổi. Kiểm hiển thị bằng `el.checkVisibility()` hoặc ảnh chụp, không bằng bounding box.

1. **Liên hệ** — `/vi/lien-he`: chọn "Góp ý", nhập tên "DA4 thử 1", để trống email, nội dung "Tin thử 1" → gửi. Nút bị khoá và hiện "Đang gửi…" trong lúc gửi; sau đó "Đã gửi. Cảm ơn bạn…" và form trống. Kiểm DB: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "select kind, name, email, post_id, locale from public.messages order by created_at desc limit 3;"` → `feedback | DA4 thử 1 | | | vi`. Nếu đang đăng nhập staff: `/admin/tin-nhan` có tin "Góp ý" này. Gửi tiếp tin 2 từ `/en/contact` (loại "A message", tên "DA4 thử 2") → `contact | … | en`. Bấm đúp nút gửi: chỉ một dòng mới trong DB.
2. **Giới hạn** — gửi tin 3 (tên "DA4 thử 3") thành công; tin 4 → "Mỗi người gửi được tối đa 3 tin mỗi giờ, tính chung cả liên hệ, góp ý và báo lỗi bài…", chữ vẫn còn trong form, DB không có dòng mới. Đặt lại bộ đếm (lệnh ở Step 3).
3. **Báo lỗi bài này** — `/vi/blog/da4-seed-bai-blog-mot`: nút "Báo lỗi bài này" nằm sau thân bài, trước bình luận; nội dung form ẩn (`checkVisibility()` = `false`) → bấm → hiện → tên "DA4 thử báo lỗi", nội dung "Sai chính tả ở đoạn 2" → gửi → "Đã gửi báo lỗi…". DB: `select m.kind, p.slug from public.messages m join public.posts p on p.id = m.post_id order by m.created_at desc limit 1;` → `content_error | da4-seed-bai-blog-mot`. Lặp lại ở `/en/lessons/nguyen-ly/da4-seed-what-is-a-diode` (nút đứng trước "Video liên quan" nếu có) và `/vi/video/da4-seed-diode-hoat-dong` (trước bình luận). Đặt lại bộ đếm sau bước này.
4. **Giới thiệu** — `/vi/gioi-thieu` và `/en/about`: thứ tự Hero → Về tác giả ("TG"/"AN" trong khung tròn, "[Tên tác giả]") → Mục đích minh bạch (4 ô, link tới chính sách bảo mật) → Câu hỏi thường gặp (6 câu, đều đóng) → khối "Cùng làm Chíp Chíp tốt hơn" (hai nút tới `/vi/dong-gop`, `/vi/lien-he`). Không có "Những người đã đồng hành" (danh sách rỗng), không còn "Cơ cấu tổ chức" hay Google Form. FAQ: bấm từng câu mở/đóng được ở cả 1440 px và 375 px, bằng chuột và bằng bàn phím (Tab tới câu hỏi, Enter/Space).
5. **Thẻ blog** — `/vi/blog` (và mục "Từ Blog" ở `/vi`): bấm trái một thẻ → tấm nền trắng phóng từ thẻ ra full màn hình trong khoảng 0.4 s rồi mở bài; Back → trang blog, không còn tấm nền, bấm thẻ khác vẫn chạy. Ctrl+click (Cmd+click trên macOS) và chuột giữa → bài mở ở tab mới, trang hiện tại không có hiệu ứng. Bấm đúp nhanh → chỉ một lần chuyển trang. Bật giảm chuyển động (DevTools → Rendering → `prefers-reduced-motion: reduce`) → bấm là chuyển trang ngay, không có tấm nền. Nếu thấy giật khi kết hợp với cuộn mượt (lenis), ghi lại — theo spec §7 thì hạ xuống chỉ dùng scale/opacity trong một commit `fix:`.
6. **Đóng góp và Chính sách bảo mật** — `/vi/dong-gop`, `/en/contribute`: 4 thẻ, mỗi nút dẫn tới trang Liên hệ đúng ngôn ngữ. `/vi/chinh-sach-bao-mat`, `/en/privacy`: 6 mục, "Cập nhật ngày 28 tháng 9, 2026" / "Updated September 28, 2026", nút tới trang Liên hệ. View source mỗi trang mới có `rel="canonical"` và hai `hreflang`.
7. **Footer** — mọi trang: hàng "Liên hệ · Đóng góp · Chính sách bảo mật" ở cột giữa trên dòng bản quyền (1440 px, footer vẫn một hàng); 375 px xuống dòng gọn, mỗi link cao ≥ 44 px. `/en/…` hiện "Contact · Contribute · Privacy policy" và dẫn tới `/en/contact`, `/en/contribute`, `/en/privacy`.
8. **Trang chủ** — khối cuối: nút "Xem cách đóng góp" → `/vi/dong-gop`, không còn dòng "Form đăng ký sẽ mở…".
9. **Sitemap** — `/sitemap.xml` có `/vi/lien-he`, `/en/contact`, `/vi/dong-gop`, `/en/contribute`, `/vi/chinh-sach-bao-mat`, `/en/privacy`.
10. **Console** — không có lỗi JavaScript hay lỗi hydration ở mọi trang trên (lỗi 429 của request thứ 4 ở bước 2 là chủ đích).

- [ ] **Step 6: Dọn dữ liệu thử** (`messages.post_id` là `on delete set null`, nên tin thử phải xoá riêng; mọi tin thử đặt tên bắt đầu bằng "DA4 thử"):

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "delete from public.messages where name like 'DA4 thử%'; delete from public.posts where slug like 'da4-seed-%'; delete from public.comment_rate_limit where scope = 'message';"`
Expected: `DELETE n` cho mỗi câu, lệnh posts `DELETE 8`. Dừng `next dev`.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: document the DA4 trust pages and list the placeholder content to replace"
```

---

## Đối chiếu spec

| Spec | Task |
|---|---|
| §1 `/gioi-thieu`, `/about`: Về tác giả, Mục đích minh bạch, FAQ, "Những người đã đồng hành" (ẩn khi rỗng), lời mời đóng góp | 6 |
| §1 gỡ `TEAM_UNITS`, `TeamStructure` và khoá message không còn dùng | 6 (bước 8, 9, 14) |
| §1 `/vi/lien-he`, `/en/contact` có form gửi `/api/messages` | 3 |
| §1 `/vi/dong-gop`, `/en/contribute` | 5 |
| §1 `/vi/chinh-sach-bao-mat`, `/en/privacy` | 5 |
| §1 "Báo lỗi bài này" ở bài học, blog, video | 4 |
| §1 thẻ blog nở ra khi bấm | 7 |
| §1 footer có link tới ba trang mới | 5 |
| §1 tsc/lint/vitest/build sạch; nghiệm thu hai ngôn ngữ và mobile | mỗi task bước "Kiểm"; 8 |
| §2 ba route vào `routing.pathnames`, sitemap, `STATIC_ROUTES` | 1 (lệch: mục 1) |
| §3 câu chữ trong `messages/{vi,en}.json` (namespace `about`, `contact`, `contribute`, `privacy`), cùng tập khoá, chỗ mẫu ghi rõ "[…]" | 3, 5, 6 |
| §3 `AUTHOR = { photo: string \| null }`, ảnh `null` → chữ cái đầu | 6 (`initials`, `AuthorSection`) |
| §3 `CONTRIBUTORS: { name; role }[] = []` | 6 |
| §3 `CONTACT_EMAIL` rỗng thì ẩn dòng email | 3 (trang Liên hệ); `JoinCta` giữ điều kiện sẵn có |
| §3 FAQ 5–6 câu mẫu (miễn phí, ai viết, báo lỗi ở đâu, dùng cho lớp học, quảng cáo) | 6 (6 câu, thêm "bản tiếng Anh") |
| §3 README "Nội dung cần thay trước khi ra mắt" | 8 |
| §4.1 thứ tự Hero → Tác giả → Minh bạch (4 cam kết + link bảo mật) → FAQ `<details>` → Đồng hành → khối cuối | 6 (lệch: mục 2) |
| §4.1 FAQ không JS, mặc định đóng; hai bản markup nếu cần | 6 (lệch: mục 7) |
| §4.1 khối cuối thay "Tham gia cùng chúng tôi" + Google Form; gỡ `JOIN_FORM_URL`, `JoinFormEmbed` | 6 (lệch: mục 3) |
| §4.2 form client: loại tin, tên, email tuỳ chọn, nội dung, `website` ẩn; giới hạn khớp `parseMessagePayload` | 2 (`MESSAGE_LIMITS` chung), 3 (lệch: mục 8, 11) |
| §4.2 gửi kèm `locale`; đọc `rate_limited`, lỗi kiểm tra, lỗi mạng; cảm ơn + xoá form | 2, 3 |
| §4.2 nút khoá khi gửi, nhãn gắn ô nhập, lỗi qua `aria-live` | 3 |
| §4.2 email, mạng xã hội (ẩn cái rỗng), thời gian phản hồi | 3 (lệch: mục 10) |
| §4.3 bốn cách đóng góp dẫn tới `/lien-he`, không form riêng | 5 |
| §4.4 dữ liệu thu, mục đích, thời gian lưu (1 ngày / tới khi yêu cầu xoá), chia sẻ (DeepSeek chỉ nhận bài viết), quyền, ngày cập nhật; khớp code | 5 (bảng đối chiếu; lệch: mục 4, 13) |
| §4.5 nút cuối nội dung, form gọn tại chỗ, `content_error` + `postId`, dùng chung logic với Liên hệ | 4 (+ 2, 3) (lệch: mục 9) |
| §4.6 `/blog` và bài mới ở trang chủ; `layout` của Motion 0.35–0.45 s, easing chuẩn | 7 (lệch: mục 5, 6) |
| §4.6 link thật; chỉ click trái không phím chạy hiệu ứng | 7 (`isPlainLeftClick`) |
| §4.6 reduced-motion chuyển trang ngay; không chặn quá 450 ms | 7 (`useReducedMotion`, `EXPAND_MS` test) |
| §4.7 footer thêm một hàng link, giữ một hàng trên desktop, xuống dòng trên mobile | 5 (lệch: mục 12) |
| §5 chuỗi qua messages, tập khoá bằng nhau | 3, 5, 6 (test `keys-parity`) |
| §5 xám trung tính, AA, 44 px | 3–7 (`min-h-11`/`h-11`/`size-11`), 8 bước 5.7 |
| §5 chuyển động dùng token, tắt khi reduced-motion | 4, 6 (`motion-reduce:transition-none`), 7 (`EASE_STANDARD`, `useReducedMotion`) |
| §5 JS client chỉ ở form Liên hệ, form báo lỗi, thẻ blog | 3, 4, 7 (`MessageForm`, `ExpandingCardLink`) |
| §5 metadata canonical + alternates, sitemap cho mỗi trang mới | 1, 3, 5 (`localeAlternates`) |
| §5 không đổi schema DB | tất cả — không migration |
| §6 Vitest: payload + mã lỗi (thành công, `rate_limited`, lỗi kiểm tra, lỗi mạng, bot điền trường ẩn) | 2 |
| §6 Vitest: sitemap có ba trang mới | 1 |
| §6 Vitest: `postHref` và routing cho ba route mới | 1 (`localizedPath` — ba route không có tham số nên không qua `postHref`; `paths.test.ts` cũ vẫn phủ `postHref`) |
| §6 tính đúng của trang Chính sách bảo mật → review | 5 (bảng đối chiếu) |
| §6 nghiệm thu: Liên hệ vào `/admin/tin-nhan`, tin thứ 4 bị chặn, báo lỗi đúng loại và bài, FAQ desktop + mobile, thẻ nở + Ctrl+click, footer, hai ngôn ngữ, console sạch | 8 bước 5 |
| §7 rate limit chung 3 tin/giờ cho Liên hệ và Báo lỗi, ghi rõ trong thông báo | 3 (`contact.errors.rateLimited`, `contact.aside.limitNote`), 8 bước 5.2 |
| §7 thẻ nở + lenis giật → hạ xuống scale/opacity | 8 bước 5.5 |

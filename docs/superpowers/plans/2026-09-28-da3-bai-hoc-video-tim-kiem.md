# DA3 — Bài học, Video, Tìm kiếm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người đọc duyệt bài học theo chủ đề và độ khó, xem video theo bộ lọc và sắp xếp, mở trang riêng của từng video, thấy "Video liên quan" dưới bài học, dùng menu con Bài học (Lý thuyết / Video) và tìm kiếm toàn site, gõ không dấu vẫn ra kết quả.

**Architecture:** Mọi URL của bài đi qua một hàm thuần `postHref` (`src/lib/paths.ts`) mà thẻ bài, kết quả tìm kiếm, sitemap và `revalidate-paths` cùng dùng. Tham số URL đi qua `parseListingParams` (danh sách trắng) rồi mới tới các truy vấn mỏng trong `src/lib/queries/posts.ts`; thứ tự sắp xếp là dữ liệu thuần (`listingOrder`) để test được. Trang là Server Component; JS phía client chỉ có ở `TopicSidebar` (thu gọn cột), `LessonsMenu` (menu con), `SearchBox` (ô tìm kiếm) và `VideoFacades` sẵn có.

**Tech Stack:** Next.js 14.2 App Router · next-intl 4 (`pathnames` bản địa hoá) · Supabase JS (PostgREST, RPC `search_posts`) · Tailwind 3 · framer-motion (chỉ menu con) · lucide-react · Vitest 2 (môi trường `node`, chỉ `src/**/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-09-28-da3-bai-hoc-video-tim-kiem-design.md` (nền: DA1 dữ liệu + `search_posts`, DA2 facade video; lộ trình: `2026-09-28-lo-trinh-nang-cap-design.md`)

## Global Constraints

- **Không thêm dependency.** Không đổi schema DB. Nếu buộc phải đổi: migration mới, áp bằng `npx supabase migration up`. Không `db reset`, không `--linked`, không `db push`, không khởi tạo lại stack local (hook của chủ dự án chặn).
- Chuỗi giao diện công khai qua `src/messages/{vi,en}.json`, hai file cùng tập khoá (test `keys-parity` sẵn có). Chuỗi admin viết tiếng Việt thẳng trong JSX (DA3 không đụng admin).
- Bảng màu xám trung tính, không tím, không pastel; chữ đạt WCAG AA; vùng bấm tối thiểu 44 px (`min-h-11` / `size-11`) trên mobile.
- Chuyển động dùng token ở `src/components/motion/tokens.ts` (`EASE_STANDARD`, `DURATION`) và tắt khi `prefers-reduced-motion` (`motion-reduce:transition-none`, `useReducedMotion`).
- Server Components mặc định. JS phía client **chỉ** ở: nút thu gọn cột chủ đề, menu con Bài học, ô tìm kiếm, `VideoFacades`. Sắp xếp video là form GET, không có JS.
- Tham số URL được kiểm ở biên bằng danh sách trắng (`parseListingParams`, `parseSearchQuery`); giá trị lạ bị bỏ qua; `page` là số nguyên 1–500; `q` cắt ở 100 ký tự.
- Thoát dữ liệu theo nơi dùng: text qua React; HTML của facade video chỉ dựng từ `VideoRef` đã kiểm (`videoFacadeHtml`); không `dangerouslySetInnerHTML` với dữ liệu nào khác.
- TypeScript strict: không `any`, không `!`, không `@ts-ignore`/`eslint-disable`. Code, comment, commit: tiếng Anh; comment chỉ giải thích *vì sao*. Không trailer attribution trong commit.
- Không stage `.env.example` (sandbox không đọc được, git báo nhầm là đã xoá), `.env.local`, `.commandcode/`, `.crossweave/`, `.claude/`. Luôn `git add` theo đường dẫn cụ thể.
- Cổng kiểm: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build` (build cần `allowed_domains` `fonts.googleapis.com`, `fonts.gstatic.com`).
- **`next build` trong sandbox đôi khi thoát 0 giữa chừng**, ngay sau dòng `Creating an optimized production build ...`, không in bảng route (đo ngày 28/09/2026: xảy ra 2 trong 4 lần build bản sao **chưa sửa** của repo, nên không phải do code). Build chỉ tính là xanh khi log có bảng route và dòng `○  (Static)`; nếu không có, chạy lại (tối đa 5 lần) và ghi số lần chạy vào báo cáo.

## Đo thực tế trước khi lập plan

Toàn bộ code trong plan này đã được chạy trong một bản sao repo ngoài thư mục dự án (`$TMPDIR/da3-scratch`, ngày 28/09/2026, trên commit `946236d`):

- `tsc --noEmit`: 0 lỗi · `next lint`: `✔ No ESLint warnings or errors` · `vitest`: **280 test** PASS (243 trước DA3) · `next build`: xanh, bảng route có `/[locale]/video`, `/[locale]/video/[slug]`, `/[locale]/tim-kiem`, `/[locale]/bai-hoc/opengraph-image`, `/[locale]/video/opengraph-image`, `/[locale]/video/[slug]/opengraph-image`.
- `prerender-manifest.json` sau build không có trang nào dưới `[locale]`: các trang danh sách đọc `searchParams` (và Supabase client đọc `cookies()`) nên render theo từng request — giống `/blog` hiện tại. Đây là lý do mục 3 của "Lệch so với spec".
- PostgREST trả lỗi `PGRST103` ("Requested range not satisfiable") khi `.range()` bắt đầu sau dòng cuối — một `?page=` cũ hoặc gõ tay sẽ gặp. Truy vấn danh sách coi đó là trang rỗng, không log lỗi.
- Enum `post_difficulty` khai báo `('basic', 'intermediate', 'advanced')` (`20260928000100_video_difficulty.sql`), nên `order=difficulty.asc` là dễ → khó, không theo chữ cái.
- `search_posts(p_query, p_locale, p_kinds, p_limit)` trả `id, kind, topic, title, slug, excerpt, cover_image_url, difficulty, published_at, rank` — **không** có cột video; `p_limit` bị kẹp vào 1–50.

## Lệch so với spec (đã cân nhắc, cần chủ dự án biết)

1. **`?tab=video` trả 308, không phải 301.** Spec chọn `permanentRedirect` trong page; hàm đó (Next và next-intl) trả 308 Permanent Redirect. Với trình duyệt và máy tìm kiếm, 308 tương đương 301.
2. **Trang chi tiết bài học không có bình luận**, nên "Video liên quan" đặt ngay sau nội dung bài (spec: "sau nội dung bài, trước bình luận").
3. **`revalidate = 3600` được khai báo ở `/bai-hoc`, `/bai-hoc/[topic]`, `/video` như spec**, nhưng các trang này vẫn render theo từng request vì đọc `searchParams` và Supabase client đọc `cookies()` (xem "Đo thực tế"). Giữ khai báo để khớp spec và để nó có hiệu lực nếu sau này bỏ phụ thuộc cookie. Trang tìm kiếm đặt `dynamic = "force-dynamic"`.
4. **Số lượng ở mỗi nhóm kết quả tìm kiếm là "tới 50".** Không đổi DB nên không có `count(*)`: trang gọi `search_posts` một lần cho mỗi nhóm với `p_limit = 50` (mức trần của hàm), hiện số đúng khi < 50 và "50+ kết quả" khi chạm trần; mỗi nhóm hiện 10 kết quả đầu.
5. **Kết quả tìm kiếm là danh sách gọn (tiêu đề + tóm tắt), không phải thẻ có ảnh**, vì `search_posts` không trả cột video (không có ảnh xem trước) và DA3 không đổi DB.
6. **Sắp xếp video là form GET có nút "Áp dụng"** — một `<select>` tự gửi khi đổi cần JS phía client, mà spec giới hạn JS ở bốn chỗ. Form giữ các bộ lọc khác bằng input ẩn.
7. **Viên thuốc chủ đề ở `/bai-hoc` dẫn tới `/bai-hoc/[topic]`** (đường dẫn), không phải `?topic=`: trang chủ đề là canonical của chính nó. Trên các trang bài học, `?topic=`, `platform`, `source`, `sort` bị bỏ qua và không lọt vào link.
8. **`postHref` trả `null`** cho bài học không có chủ đề hoặc bài không có slug; `PostCard`/`VideoCard` khi đó không render, sitemap và tìm kiếm bỏ qua dòng đó (thay vì dẫn tới 404).
9. **Chuyển ngôn ngữ ở trang video:** `LangSwitch` trên navbar đưa về `/video` (`/videos`) của ngôn ngữ kia — nó chỉ thấy mẫu route, không biết slug bản dịch; tiêu đề trang video có thêm link "Watch in English"/"Xem bản tiếng Việt" tới đúng bản dịch khi có (cùng cách trang blog đang làm). hreflang trong `<head>` luôn trỏ đúng.
10. **Cột chủ đề khi thu gọn còn 44 px** (chỉ nút mở lại); danh sách chủ đề ẩn ngay, chiều rộng co bằng `transition-[width]` 450 ms + `EASE_STANDARD`. Trạng thái nhớ trong `localStorage` được áp **trước** khi bật chuyển tiếp, để người quay lại không thấy cột gập lại mỗi lần tải trang.
11. **Ngoài spec nhưng cần cho "mọi link nội bộ đúng URL":** nút "Khám phá thêm" của carousel video trang chủ đổi từ `/bai-hoc` sang `/video`; `PostCard` hiện nhãn độ khó (lọc theo độ khó mà thẻ không ghi độ khó thì khó hiểu); thêm ảnh OG cho `/bai-hoc` (spec: "ảnh OG cho … trang danh sách").
12. **Dọn dẹp do chính DA3 tạo ra:** `listLessonPosts` hết người dùng → xoá; khoá `lessons.tabTheory`, `lessons.tabVideo`, `lessons.videoComingSoon`, `lessons.videoDescription` hết người dùng → xoá khỏi cả hai file message; test `empty-state.test.ts` của trang chủ đề đổi sang đọc component dùng chung.
13. **Hai module thuần mới để test được:** `localizedPath` chuyển từ `revalidate-paths.ts` sang `src/lib/paths.ts` (không đổi hành vi); phần "bài → mục sitemap" tách thành `src/lib/sitemap-entries.ts` vì `src/app/sitemap.ts` import `@/i18n/navigation`, thứ Vitest không nạp được (lý do ghi sẵn trong `revalidate-paths.ts`). `parseSearchQuery` nằm ở `src/lib/search-query.ts` riêng, vì ô tìm kiếm (client) chỉ cần hằng `MAX_QUERY_LENGTH`.

## Review Focus

1. **`?page=` cũ hoặc gõ tay vượt số trang** (ví dụ `/vi/video?page=40` khi chỉ có 1 trang, hoặc trang 3 rồi đổi bộ lọc còn 2 bài) → trang rỗng có lời nhắn và link "Về trang đầu", không lỗi 500, không log lỗi. *(Task 1 test `reads page 1 for anything but an integer from 1 to 500`, Task 3 test `still leads back into range from a page past the end`, Task 9 bước 4.3)*
2. **Tham số URL lạ hoặc lặp** (`?difficulty=Advanced&difficulty=basic`, `?sort=<script>`, `?page=2e2`, `?platform=vimeo`) → bị bỏ qua, trang vẫn chạy, các link lọc/phân trang không mang giá trị lạ đi tiếp. *(Task 1 tests `drops values that are not on the whitelist`, `uses only the first of a repeated parameter`, `keeps the other filters when one changes…`)*
3. **Tìm kiếm chỉ có dấu câu/emoji, rất dài, hoặc có xuống dòng** (`?q=%F0%9F%99%82`, `?q=%26%7C!`, 10 000 ký tự) → không lỗi, hiện "không tìm thấy", ô tìm kiếm điền lại tối đa 100 ký tự và không cắt đôi emoji. *(Task 8 tests `cuts at 100 characters without splitting an emoji`, `trims and folds whitespace, keeping accents`; `search_posts` đã được `verify-security.sh` kiểm với câu chỉ có ký tự cú pháp và câu 10 000 ký tự)*
4. **Video trỏ tới bài học đã gỡ đăng/xoá, hoặc thiếu bản dịch** → không có nút "Xem bài học liên quan" hỏng, không có link ngôn ngữ hỏng, hreflang trỏ về `/video`. *(Task 2: `getLessonByTranslation` trả `null`; Task 1 test `has no page for a lesson without a topic…`; Task 9 bước 4.6)*
5. **Người dùng chỉ dùng bàn phím** trên menu con Bài học và ô tìm kiếm: Tab tới nút, Enter mở, Tab qua hai link, Tab tiếp thì menu đóng, Esc đóng và trả focus về nút; ô tìm kiếm mở ra là con trỏ nằm sẵn trong ô. *(Task 9 bước 4.5 — dự án không có môi trường test component, nên đây là bước kiểm tay có kịch bản cụ thể)*

---

## File map

| File | Trách nhiệm |
|---|---|
| `src/i18n/routing.ts` | Thêm `/video`, `/video/[slug]`, `/tim-kiem` |
| `src/i18n/navigation.ts` | Xuất thêm `permanentRedirect` |
| `src/lib/paths.ts` (+ `.test.ts`) | `postHref`, `localizedPath`, `postPath` — mọi URL của bài |
| `src/lib/listing-params.ts` (+ `.test.ts`) | `parseListingParams`, `listingQuery`, `firstParam`, `pageWindow` |
| `src/lib/listing-order.ts` (+ `.test.ts`) | `listingOrder` (ORDER BY cho từng kiểu sắp xếp), `pageRange`, `LISTING_PAGE_SIZE` |
| `src/lib/search-query.ts` (+ `.test.ts`) | `parseSearchQuery`, `MAX_QUERY_LENGTH` |
| `src/lib/sitemap-entries.ts` (+ `.test.ts`) | Mục sitemap cho từng bài, kể cả video |
| `src/lib/types.ts` | Trường video trên `Post`/`PostSummary`; `VideoPost` |
| `src/lib/queries/posts.ts` | `listLessons`, `listVideos`, `getVideoBySlug`, `listRelatedVideos`, `getLessonByTranslation`; `searchPosts` nhận `limit` |
| `src/lib/revalidate-paths.ts` (+ `.test.ts`) | Dùng `postPath`; thêm `/video` và trang video |
| `src/lib/video.ts` (+ `.test.ts`) | `thumbnailUrl` |
| `src/lib/tiptap/video-embed.ts` (+ `video-embed.test.ts`) | Xuất `videoFacadeHtml` cho trang video |
| `src/lib/constants.ts` | `LESSON_SUBNAV` |
| `src/app/sitemap.ts` | Dùng `postSitemapEntries`; thêm `/video` |
| `src/components/listing/{FilterPills,Pagination}.tsx` | Hàng viên thuốc lọc; phân trang |
| `src/components/lessons/{LessonsListing,TopicSidebar}.tsx` | Bố cục chung của `/bai-hoc` và `/bai-hoc/[topic]`; cột thu gọn (client) |
| `src/components/video/{VideoCard,VideoFilters}.tsx` | Thẻ video; thanh lọc + form sắp xếp |
| `src/components/search/{SearchForm,SearchBox}.tsx` | Form GET dùng chung; nút kính lúp (client) |
| `src/components/layout/LessonsMenu.tsx` | Menu con Bài học (client) |
| `src/components/layout/{Navbar.tsx,langSwitchPath.ts(+test)}` | Menu con, ô tìm kiếm, mục mobile; fallback `/video/[slug]` |
| `src/components/forum/{PostCard,CommentSection}.tsx` | `postHref` + nhãn độ khó; "xem thêm bình luận" cho trang video |
| `src/components/sections/VideoCarousel.tsx` | CTA tới `/video` |
| `src/app/[locale]/bai-hoc/{page.tsx,opengraph-image.tsx}`, `[topic]/{page.tsx,empty-state.test.ts}` | Dùng `LessonsListing`; redirect `?tab=video` |
| `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx` | Mục "Video liên quan" |
| `src/app/[locale]/video/{page.tsx,opengraph-image.tsx}` | Danh sách video |
| `src/app/[locale]/video/[slug]/{page.tsx,opengraph-image.tsx,not-found.tsx}` | Trang chi tiết video |
| `src/app/[locale]/tim-kiem/page.tsx` | Trang kết quả tìm kiếm (noindex) |
| `next.config.mjs` | `images.remotePatterns` cho `i.ytimg.com` |
| `src/messages/{vi,en}.json` | `lessons.*` mới, `difficulty`, `pagination`, `videos`, `search`, `nav.lessons*` |
| `README.md` | Route mới, cấu trúc, bỏ hai dòng "Chưa làm" đã xong |

---

### Task 1: Route mới, `postHref`, tham số danh sách, trường video trên thẻ, sitemap và làm mới cache

**Files:**
- Modify: `src/i18n/routing.ts:28` (thêm 3 route)
- Create: `src/lib/paths.ts`, `src/lib/paths.test.ts`
- Create: `src/lib/listing-params.ts`, `src/lib/listing-params.test.ts`
- Create: `src/lib/sitemap-entries.ts`, `src/lib/sitemap-entries.test.ts`
- Modify (viết lại toàn file): `src/lib/revalidate-paths.ts`, `src/lib/revalidate-paths.test.ts`, `src/app/sitemap.ts`
- Modify: `src/lib/types.ts`, `src/lib/queries/posts.ts:1-36`, `src/components/forum/PostCard.tsx:1-31`

**Interfaces:**
- Consumes: `routing` (`@/i18n/routing`), `TOPIC_IDS`/`TopicId` (`@/lib/constants`), `DIFFICULTIES`/`Difficulty`/`VideoSource`/`PostKind` (`@/lib/types`), `VideoPlatform`/`videoRefFrom` (`@/lib/video`), `postRowsFrom` (`@/lib/revalidate-paths`), `SITE_URL` (`@/lib/site`).
- Produces:
  - Route keys `"/video"`, `"/video/[slug]"`, `"/tim-kiem"` trong `routing.pathnames` (vi `/video`, `/video/[slug]`, `/tim-kiem`; en `/videos`, `/videos/[slug]`, `/search`).
  - `type PostHref = { pathname: "/bai-hoc/[topic]/[slug]"; params: { topic: TopicId; slug: string } } | { pathname: "/blog/[slug]"; params: { slug: string } } | { pathname: "/video/[slug]"; params: { slug: string } }`
  - `type PostLink = { kind: PostKind; slug: string; topic: TopicId | null }`
  - `postHref(post: PostLink): PostHref | null` · `localizedPath(key: AppPathname, locale: Locale, params?: Record<string, string>): string` · `postPath(post: PostLink, locale: Locale): string | null`
  - `type SearchParams = Record<string, string | string[] | undefined>` · `VIDEO_SORTS`, `type VideoSort = "newest" | "oldest" | "easiest" | "hardest"` · `VIDEO_PLATFORMS: readonly VideoPlatform[]` · `VIDEO_SOURCES: readonly VideoSource[]` · `MAX_PAGE = 500`
  - `type ListingParams = { topic: TopicId | null; difficulty: Difficulty | null; platform: VideoPlatform | null; source: VideoSource | null; sort: VideoSort; page: number }` · `DEFAULT_LISTING: ListingParams`
  - `firstParam(value: string | string[] | undefined): string | undefined` · `parseListingParams(searchParams: SearchParams): ListingParams` · `listingQuery(current: ListingParams, change?: Partial<ListingParams>): Record<string, string>`
  - `postSitemapEntries(rows: SitemapPostRow[] | null): MetadataRoute.Sitemap`
  - `Post` và `PostSummary` có thêm `videoPlatform: VideoPlatform | null`, `videoExternalId: string | null`, `videoSource: VideoSource | null`, `channelName: string | null`; `type VideoPost = Post & { relatedLessonTranslationId: string | null }`.

- [ ] **Step 1: Thêm route vào `src/i18n/routing.ts`**

Thay dòng:

```ts
    "/gioi-thieu": { vi: "/gioi-thieu", en: "/about" },
```

bằng:

```ts
    "/gioi-thieu": { vi: "/gioi-thieu", en: "/about" },
    "/video": { vi: "/video", en: "/videos" },
    "/video/[slug]": { vi: "/video/[slug]", en: "/videos/[slug]" },
    "/tim-kiem": { vi: "/tim-kiem", en: "/search" },
```

- [ ] **Step 2: Viết test thất bại cho `postHref`/`localizedPath`** — tạo `src/lib/paths.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { localizedPath, postHref, postPath } from "@/lib/paths";

describe("postHref", () => {
  it("puts a lesson under its topic", () => {
    expect(postHref({ kind: "lesson", slug: "chat-ban-dan", topic: "nguyen-ly" })).toEqual({
      pathname: "/bai-hoc/[topic]/[slug]",
      params: { topic: "nguyen-ly", slug: "chat-ban-dan" },
    });
  });

  it("puts a blog post under /blog and a video under /video", () => {
    expect(postHref({ kind: "forum", slug: "tin-moi", topic: null })).toEqual({
      pathname: "/blog/[slug]",
      params: { slug: "tin-moi" },
    });
    expect(postHref({ kind: "video", slug: "transistor", topic: "nguyen-ly" })).toEqual({
      pathname: "/video/[slug]",
      params: { slug: "transistor" },
    });
  });

  it("has no page for a lesson without a topic or a post without a slug", () => {
    expect(postHref({ kind: "lesson", slug: "mo-coi", topic: null })).toBeNull();
    expect(postHref({ kind: "forum", slug: "", topic: null })).toBeNull();
    expect(postHref({ kind: "video", slug: "", topic: null })).toBeNull();
  });
});

describe("postPath", () => {
  it("localizes every kind in Vietnamese", () => {
    expect(postPath({ kind: "lesson", slug: "chat-ban-dan", topic: "dinh-nghia" }, "vi")).toBe(
      "/vi/bai-hoc/dinh-nghia/chat-ban-dan"
    );
    expect(postPath({ kind: "forum", slug: "tin-moi", topic: null }, "vi")).toBe("/vi/blog/tin-moi");
    expect(postPath({ kind: "video", slug: "transistor-la-gi", topic: null }, "vi")).toBe(
      "/vi/video/transistor-la-gi"
    );
  });

  it("localizes every kind in English", () => {
    expect(postPath({ kind: "lesson", slug: "what-is-it", topic: "dinh-nghia" }, "en")).toBe(
      "/en/lessons/dinh-nghia/what-is-it"
    );
    expect(postPath({ kind: "forum", slug: "news", topic: null }, "en")).toBe("/en/blog/news");
    expect(postPath({ kind: "video", slug: "what-is-a-transistor", topic: null }, "en")).toBe(
      "/en/videos/what-is-a-transistor"
    );
  });

  it("returns null when the post has no page", () => {
    expect(postPath({ kind: "lesson", slug: "mo-coi", topic: null }, "en")).toBeNull();
  });
});

describe("localizedPath", () => {
  it("resolves the new static routes per locale", () => {
    expect(localizedPath("/video", "vi")).toBe("/vi/video");
    expect(localizedPath("/video", "en")).toBe("/en/videos");
    expect(localizedPath("/tim-kiem", "vi")).toBe("/vi/tim-kiem");
    expect(localizedPath("/tim-kiem", "en")).toBe("/en/search");
    expect(localizedPath("/", "en")).toBe("/en");
  });
});
```

- [ ] **Step 3: Viết test thất bại cho tham số danh sách** — tạo `src/lib/listing-params.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LISTING,
  listingQuery,
  parseListingParams,
  type ListingParams,
} from "@/lib/listing-params";

describe("parseListingParams", () => {
  it("returns the defaults for an empty URL", () => {
    expect(parseListingParams({})).toEqual(DEFAULT_LISTING);
  });

  it("keeps every valid value", () => {
    expect(
      parseListingParams({
        topic: "nguyen-ly",
        difficulty: "advanced",
        platform: "tiktok",
        source: "curated",
        sort: "hardest",
        page: "3",
      })
    ).toEqual({
      topic: "nguyen-ly",
      difficulty: "advanced",
      platform: "tiktok",
      source: "curated",
      sort: "hardest",
      page: 3,
    });
  });

  it("drops values that are not on the whitelist", () => {
    expect(
      parseListingParams({
        topic: "khong-co",
        difficulty: "Advanced",
        platform: "vimeo",
        source: "<script>",
        sort: "random",
        page: "2",
      })
    ).toEqual({ ...DEFAULT_LISTING, page: 2 });
  });

  it("reads page 1 for anything but an integer from 1 to 500", () => {
    for (const page of ["0", "-1", "501", "1000", "1.5", "2e2", " 2", "02", "abc", ""]) {
      expect(parseListingParams({ page }).page).toBe(1);
    }
    expect(parseListingParams({ page: "500" }).page).toBe(500);
    expect(parseListingParams({ page: "1" }).page).toBe(1);
  });

  it("uses only the first of a repeated parameter", () => {
    expect(parseListingParams({ difficulty: ["advanced", "basic"] }).difficulty).toBe("advanced");
    expect(parseListingParams({ difficulty: ["bogus", "basic"] }).difficulty).toBeNull();
    expect(parseListingParams({ page: ["4", "9"] }).page).toBe(4);
    expect(parseListingParams({ sort: [] }).sort).toBe("newest");
  });
});

describe("listingQuery", () => {
  const current: ListingParams = {
    topic: "ung-dung",
    difficulty: "basic",
    platform: "youtube",
    source: "own",
    sort: "oldest",
    page: 4,
  };

  it("leaves defaults out so each view has one URL", () => {
    expect(listingQuery(DEFAULT_LISTING)).toEqual({});
  });

  it("keeps the other filters when one changes, and goes back to page 1", () => {
    expect(listingQuery(current, { difficulty: "advanced" })).toEqual({
      topic: "ung-dung",
      difficulty: "advanced",
      platform: "youtube",
      source: "own",
      sort: "oldest",
    });
  });

  it("clears one filter with null", () => {
    expect(listingQuery(current, { platform: null, page: 4 })).toEqual({
      topic: "ung-dung",
      difficulty: "basic",
      source: "own",
      sort: "oldest",
      page: "4",
    });
  });

  it("moves to another page without touching the filters", () => {
    expect(listingQuery(current, { page: 5 })).toMatchObject({ page: "5", sort: "oldest" });
  });
});
```

- [ ] **Step 4: Viết test thất bại cho sitemap** — tạo `src/lib/sitemap-entries.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { postSitemapEntries } from "@/lib/sitemap-entries";
import { SITE_URL } from "@/lib/site";

describe("postSitemapEntries", () => {
  it("lists a video under /video in Vietnamese and /videos in English", () => {
    const entries = postSitemapEntries([
      { slug: "transistor-la-gi", locale: "vi", kind: "video", topic: null, published_at: "2026-09-20T00:00:00Z" },
      { slug: "what-is-a-transistor", locale: "en", kind: "video", topic: "nguyen-ly", published_at: null },
    ]);
    expect(entries.map((e) => e.url)).toEqual([
      `${SITE_URL}/vi/video/transistor-la-gi`,
      `${SITE_URL}/en/videos/what-is-a-transistor`,
    ]);
    expect(entries[0].lastModified).toEqual(new Date("2026-09-20T00:00:00Z"));
    expect(entries[1]).not.toHaveProperty("lastModified");
  });

  it("lists lessons and blog posts at their own pages", () => {
    const urls = postSitemapEntries([
      { slug: "chat-ban-dan", locale: "vi", kind: "lesson", topic: "dinh-nghia", published_at: null },
      { slug: "news", locale: "en", kind: "forum", topic: null, published_at: null },
    ]).map((e) => e.url);
    expect(urls).toEqual([
      `${SITE_URL}/vi/bai-hoc/dinh-nghia/chat-ban-dan`,
      `${SITE_URL}/en/blog/news`,
    ]);
  });

  it("leaves out rows no page can serve", () => {
    expect(
      postSitemapEntries([
        { slug: "mo-coi", locale: "vi", kind: "lesson", topic: null, published_at: null },
        { slug: "x", locale: "fr", kind: "video", topic: null, published_at: null },
        { slug: "y", locale: "vi", kind: "podcast", topic: null, published_at: null },
      ])
    ).toEqual([]);
    expect(postSitemapEntries(null)).toEqual([]);
  });
});
```

- [ ] **Step 5: Viết lại `src/lib/revalidate-paths.test.ts`** (test video cũ "per-video pages arrive in DA3" được thay bằng test trang video; test listing đầu tiên thêm `/video`):

```ts
import { describe, expect, it } from "vitest";
import { postRowsFrom, revalidatePostRows, type PostRow } from "@/lib/revalidate-paths";

describe("revalidatePostRows", () => {
  it("always revalidates the home, blog, lessons and video listings for both locales", () => {
    const paths = revalidatePostRows([]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi",
        "/en",
        "/vi/blog",
        "/en/blog",
        "/vi/bai-hoc",
        "/en/lessons",
        "/vi/video",
        "/en/videos",
      ])
    );
  });

  it("revalidates a lesson's topic page and its own detail page per locale, EN under /en/lessons", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "chat-ban-dan", kind: "lesson", topic: "nguyen-ly" },
      { locale: "en", slug: "semiconductor-chip", kind: "lesson", topic: "nguyen-ly" },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/chat-ban-dan",
        "/en/lessons/nguyen-ly",
        "/en/lessons/nguyen-ly/semiconductor-chip",
      ])
    );
  });

  it("revalidates each locale's own blog detail slug, never the other locale's", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "tin-tuc-vi", kind: "forum", topic: null },
      { locale: "en", slug: "news-en", kind: "forum", topic: null },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(expect.arrayContaining(["/vi/blog/tin-tuc-vi", "/en/blog/news-en"]));
    expect(paths).not.toContain("/vi/blog/news-en");
    expect(paths).not.toContain("/en/blog/tin-tuc-vi");
  });

  it("revalidates the video listings and each locale's own video page", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "video-vi", kind: "video", topic: "nguyen-ly" },
      { locale: "en", slug: "video-en", kind: "video", topic: "nguyen-ly" },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths).toEqual(
      expect.arrayContaining(["/vi/video", "/en/videos", "/vi/video/video-vi", "/en/videos/video-en"])
    );
    expect(paths).not.toContain("/vi/video/video-en");
    // A video's topic is a filter, not a page of its own.
    expect(paths).not.toContain("/vi/bai-hoc/nguyen-ly");
  });

  it("revalidates both the old and the new topic page when a lesson changes topic", () => {
    const oldRow: PostRow = { locale: "vi", slug: "bai-x", kind: "lesson", topic: "dinh-nghia" };
    const newRow: PostRow = { locale: "vi", slug: "bai-x", kind: "lesson", topic: "nguyen-ly" };
    const paths = revalidatePostRows([oldRow, newRow]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/dinh-nghia",
        "/vi/bai-hoc/dinh-nghia/bai-x",
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/bai-x",
      ])
    );
  });

  it("de-duplicates paths shared across rows", () => {
    const rows: PostRow[] = [
      { locale: "vi", slug: "bai-x", kind: "lesson", topic: "nguyen-ly" },
      { locale: "vi", slug: "bai-x", kind: "lesson", topic: "nguyen-ly" },
    ];
    const paths = revalidatePostRows(rows);
    expect(paths.filter((p) => p === "/vi/bai-hoc/nguyen-ly/bai-x")).toHaveLength(1);
  });
});

describe("postRowsFrom", () => {
  it("lets unpublishing or deleting a lesson clear its own detail and topic pages in both locales", () => {
    const paths = revalidatePostRows(
      postRowsFrom([
        { locale: "vi", slug: "chat-ban-dan", kind: "lesson", topic: "nguyen-ly" },
        { locale: "en", slug: "semiconductors", kind: "lesson", topic: "nguyen-ly" },
      ])
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        "/vi/bai-hoc/nguyen-ly",
        "/vi/bai-hoc/nguyen-ly/chat-ban-dan",
        "/en/lessons/nguyen-ly",
        "/en/lessons/nguyen-ly/semiconductors",
      ])
    );
  });

  it("lets unpublishing or deleting a blog post clear its own detail pages", () => {
    const paths = revalidatePostRows(
      postRowsFrom([
        { locale: "vi", slug: "tin-vi", kind: "forum", topic: null },
        { locale: "en", slug: "news-en", kind: "forum", topic: null },
      ])
    );
    expect(paths).toEqual(expect.arrayContaining(["/vi/blog/tin-vi", "/en/blog/news-en"]));
  });

  it("skips rows it cannot place and treats an unknown topic as none", () => {
    expect(
      postRowsFrom([
        { locale: "fr", slug: "x", kind: "lesson", topic: "nguyen-ly" },
        { locale: "vi", slug: "y", kind: "podcast", topic: null },
        { locale: "vi", slug: "z", kind: "lesson", topic: "khong-co" },
      ])
    ).toEqual([{ locale: "vi", slug: "z", kind: "lesson", topic: null }]);
    expect(postRowsFrom(null)).toEqual([]);
  });
});
```

- [ ] **Step 6: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib`
Expected: FAIL — `paths.test.ts`, `listing-params.test.ts`, `sitemap-entries.test.ts` báo `Failed to resolve import "@/lib/paths"` / `"@/lib/listing-params"` / `"@/lib/sitemap-entries"`; trong `revalidate-paths.test.ts` hai test FAIL (`always revalidates the home, blog, lessons and video listings…` thiếu `/vi/video`, `revalidates the video listings and each locale's own video page`); các test cũ còn lại PASS.

- [ ] **Step 7: Tạo `src/lib/paths.ts`**

```ts
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";
import type { PostKind } from "@/lib/types";

/** The next-intl href of one published post's own page. */
export type PostHref =
  | { pathname: "/bai-hoc/[topic]/[slug]"; params: { topic: TopicId; slug: string } }
  | { pathname: "/blog/[slug]"; params: { slug: string } }
  | { pathname: "/video/[slug]"; params: { slug: string } };

/** What a post needs to be linked to — a PostSummary or a PostRow both fit. */
export type PostLink = { kind: PostKind; slug: string; topic: TopicId | null };

/**
 * Where a post lives, for every kind.
 *
 * The single place that knows lessons sit under their topic, blog posts under
 * /blog and videos under /video — cards, search results, the sitemap and cache
 * invalidation all read it, so they cannot disagree. Returns null when no page
 * can serve the post: a lesson without a topic, or a row without a slug.
 */
export function postHref(post: PostLink): PostHref | null {
  if (!post.slug) return null;
  switch (post.kind) {
    case "lesson":
      return post.topic
        ? { pathname: "/bai-hoc/[topic]/[slug]", params: { topic: post.topic, slug: post.slug } }
        : null;
    case "video":
      return { pathname: "/video/[slug]", params: { slug: post.slug } };
    case "forum":
      return { pathname: "/blog/[slug]", params: { slug: post.slug } };
  }
}

/**
 * Resolves one entry of `routing.pathnames` to a localized, absolute path.
 *
 * This re-derives what next-intl's own `getPathname` (see src/i18n/navigation)
 * computes from the same `routing.pathnames` table, rather than calling it
 * directly: `getPathname` pulls in `next/navigation` through next-intl's
 * navigation factory, which Vitest's plain Node environment cannot resolve (a
 * pre-existing ESM interop gap between Next 14 and Vite/Vitest), so no test in
 * this repo can import `@/i18n/navigation`. Reading `routing.pathnames`
 * directly keeps this a single source of truth while staying testable.
 */
export function localizedPath(
  key: AppPathname,
  locale: Locale,
  params?: Record<string, string>
): string {
  const entry = routing.pathnames[key];
  const template: string = typeof entry === "string" ? entry : entry[locale];
  const path = params
    ? Object.entries(params).reduce((acc, [name, value]) => acc.replace(`[${name}]`, value), template)
    : template;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The localized path of a post's own page, or null when it has none. */
export function postPath(post: PostLink, locale: Locale): string | null {
  const href = postHref(post);
  return href ? localizedPath(href.pathname, locale, href.params) : null;
}
```

- [ ] **Step 8: Tạo `src/lib/listing-params.ts`**

```ts
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty, type VideoSource } from "@/lib/types";
import type { VideoPlatform } from "@/lib/video";

/** `searchParams` as Next hands it to a page. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const VIDEO_SORTS = ["newest", "oldest", "easiest", "hardest"] as const;
export type VideoSort = (typeof VIDEO_SORTS)[number];

export const VIDEO_PLATFORMS: readonly VideoPlatform[] = ["youtube", "tiktok"];
export const VIDEO_SOURCES: readonly VideoSource[] = ["own", "curated"];

/** Highest `?page=` a listing accepts; anything above reads as page 1. */
export const MAX_PAGE = 500;

/** Every filter a listing URL can carry, already validated. */
export type ListingParams = {
  topic: TopicId | null;
  difficulty: Difficulty | null;
  platform: VideoPlatform | null;
  source: VideoSource | null;
  sort: VideoSort;
  page: number;
};

export const DEFAULT_LISTING: ListingParams = {
  topic: null,
  difficulty: null,
  platform: null,
  source: null,
  sort: "newest",
  page: 1,
};

/** A repeated parameter (`?a=1&a=2`) arrives as an array; the first one wins. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pick<T extends string>(allowed: readonly T[], value: string | undefined): T | null {
  return allowed.find((option) => option === value) ?? null;
}

const PAGE = /^[1-9][0-9]{0,2}$/;

/**
 * Reads a listing's filters from the URL.
 *
 * Everything is matched against a whitelist, so a value the app does not know
 * is dropped instead of reaching a query; `page` must be a plain integer from
 * 1 to MAX_PAGE, which also bounds how far `.range()` can be pushed.
 */
export function parseListingParams(searchParams: SearchParams): ListingParams {
  const page = firstParam(searchParams.page);
  const pageNumber = page !== undefined && PAGE.test(page) ? Number(page) : 1;

  return {
    topic: pick(TOPIC_IDS, firstParam(searchParams.topic)),
    difficulty: pick(DIFFICULTIES, firstParam(searchParams.difficulty)),
    platform: pick(VIDEO_PLATFORMS, firstParam(searchParams.platform)),
    source: pick(VIDEO_SOURCES, firstParam(searchParams.source)),
    sort: pick(VIDEO_SORTS, firstParam(searchParams.sort)) ?? "newest",
    page: pageNumber <= MAX_PAGE ? pageNumber : 1,
  };
}

/**
 * The query string of `current` with `change` applied.
 *
 * Defaults are left out so each view has exactly one URL, and any change that
 * does not name a page sends the reader back to page 1 — page 3 of the old
 * filter means nothing under the new one.
 */
export function listingQuery(
  current: ListingParams,
  change: Partial<ListingParams> = {}
): Record<string, string> {
  const next: ListingParams = { ...current, page: 1, ...change };
  const query: Record<string, string> = {};
  if (next.topic) query.topic = next.topic;
  if (next.difficulty) query.difficulty = next.difficulty;
  if (next.platform) query.platform = next.platform;
  if (next.source) query.source = next.source;
  if (next.sort !== "newest") query.sort = next.sort;
  if (next.page > 1) query.page = String(next.page);
  return query;
}
```

- [ ] **Step 9: Viết lại `src/lib/revalidate-paths.ts`** (hàm `localizedPath` chuyển sang `paths.ts`; video giờ có trang riêng):

```ts
import { routing, type Locale } from "@/i18n/routing";
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { localizedPath, postPath } from "@/lib/paths";
import type { PostKind } from "@/lib/types";

/**
 * One post row's identity for the purpose of cache invalidation: enough to
 * build every localized URL that shows it.
 *
 * A caller passes both the row's old and new shape (e.g. old topic and new
 * topic) in the same array when something about the row changed, so both
 * locations get revalidated — this module has no notion of "before/after"
 * itself, only of which paths a given shape resolves to.
 */
export type PostRow = {
  locale: Locale;
  slug: string;
  kind: PostKind;
  topic: TopicId | null;
};

/**
 * Every path whose cached rendering could depend on the given rows.
 *
 * Kept separate from the `revalidatePath` calls (in src/app/admin/actions.ts)
 * so the path logic can be unit tested without a request context.
 */
export function revalidatePostRows(rows: PostRow[]): string[] {
  const paths = new Set<string>();

  for (const locale of routing.locales) {
    paths.add(localizedPath("/", locale));
    paths.add(localizedPath("/blog", locale));
    paths.add(localizedPath("/bai-hoc", locale));
    paths.add(localizedPath("/video", locale));
  }

  for (const row of rows) {
    if (row.kind === "lesson" && row.topic) {
      paths.add(localizedPath("/bai-hoc/[topic]", row.locale, { topic: row.topic }));
    }
    const own = postPath(row, row.locale);
    if (own) paths.add(own);
  }

  return [...paths];
}

const POST_KINDS: readonly string[] = ["lesson", "forum", "video"];

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

function isPostKind(value: string): value is PostKind {
  return POST_KINDS.includes(value);
}

function isTopicId(value: string | null): value is TopicId {
  return value !== null && (TOPIC_IDS as readonly string[]).includes(value);
}

/**
 * Turns `posts` rows as read back from the database (`locale, slug, kind,
 * topic`) into PostRow values. A row whose locale or kind is not one the app
 * knows is skipped rather than guessed at.
 */
export function postRowsFrom(
  rows: { locale: string; slug: string; kind: string; topic: string | null }[] | null
): PostRow[] {
  return (rows ?? []).flatMap((row) =>
    isLocale(row.locale) && isPostKind(row.kind)
      ? [{ locale: row.locale, slug: row.slug, kind: row.kind, topic: isTopicId(row.topic) ? row.topic : null }]
      : []
  );
}
```

`src/app/admin/actions.ts` chỉ import `revalidatePostRows`, `postRowsFrom`, `PostRow` — chữ ký không đổi, không phải sửa.

- [ ] **Step 10: Tạo `src/lib/sitemap-entries.ts`**

```ts
import type { MetadataRoute } from "next";
import { postPath } from "@/lib/paths";
import { postRowsFrom } from "@/lib/revalidate-paths";
import { SITE_URL } from "@/lib/site";

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

- [ ] **Step 11: Viết lại `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { TOPIC_IDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { postSitemapEntries } from "@/lib/sitemap-entries";

/** Public routes, excluding admin and API. */
// The search page is left out on purpose: it is `noindex`.
const STATIC_ROUTES = ["/", "/bai-hoc", "/video", "/blog", "/gioi-thieu"] as const;

function url(href: Parameters<typeof getPathname>[0]["href"], locale: string) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // No meaningful timestamp exists for these routes, so `lastModified` is
  // omitted rather than stamped with the request time — reporting every page
  // as just-changed on every crawl trains Googlebot to distrust the field.
  for (const route of STATIC_ROUTES) {
    for (const locale of routing.locales) {
      entries.push({
        url: url(route, locale),
        changeFrequency: route === "/" ? "weekly" : "monthly",
        priority: route === "/" ? 1 : 0.8,
      });
    }
  }

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

- [ ] **Step 12: Trường video trên `Post`/`PostSummary`** — trong `src/lib/types.ts`:

(a) sau dòng `import type { TopicId } from "@/lib/constants";` thêm:

```ts
import type { VideoPlatform } from "@/lib/video";
```

(b) thay:

```ts
  publishedAt: string | null;
  updatedAt: string;
};
```

bằng:

```ts
  publishedAt: string | null;
  updatedAt: string;
  /** Video fields: always null on lessons and blog posts. */
  videoPlatform: VideoPlatform | null;
  videoExternalId: string | null;
  videoSource: VideoSource | null;
  channelName: string | null;
};

/** A video post plus the lesson group it points back to. */
export type VideoPost = Post & { relatedLessonTranslationId: string | null };
```

(c) trong `PostSummary`, thay:

```ts
  | "publishedAt"
>;
```

bằng:

```ts
  | "publishedAt"
  | "videoPlatform"
  | "videoExternalId"
  | "videoSource"
  | "channelName"
>;
```

- [ ] **Step 13: Đọc các cột video** — trong `src/lib/queries/posts.ts`:

(a) thay:

```ts
import type { Comment, Difficulty, Post, PostKind, PostSummary } from "@/lib/types";
```

bằng:

```ts
import type { Comment, Difficulty, Post, PostKind, PostSummary } from "@/lib/types";
import { videoRefFrom } from "@/lib/video";
```

(b) thay:

```ts
const SUMMARY_COLUMNS =
  "id, title, slug, excerpt, cover_image_url, kind, topic, difficulty, published_at";

const POST_COLUMNS =
  "id, translation_id, locale, kind, topic, difficulty, title, slug, excerpt, cover_image_url, content, published_at, updated_at";
```

bằng:

```ts
const VIDEO_COLUMNS = "video_platform, video_external_id, video_source, channel_name";

const SUMMARY_COLUMNS = `id, title, slug, excerpt, cover_image_url, kind, topic, difficulty, published_at, ${VIDEO_COLUMNS}`;

const POST_COLUMNS = `id, translation_id, locale, kind, topic, difficulty, title, slug, excerpt, cover_image_url, content, published_at, updated_at, ${VIDEO_COLUMNS}`;
```

(c) thay trọn hàm `toSummary` bằng:

```ts
function toSummary(row: Row): PostSummary {
  // Re-checked against the platform's id format: the thumbnail URL and the
  // player are built from these two values.
  const video = videoRefFrom(row.video_platform, row.video_external_id);
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    excerpt: (row.excerpt as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    kind: row.kind as PostSummary["kind"],
    topic: (row.topic as TopicId | null) ?? null,
    difficulty: (row.difficulty as Difficulty | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    videoPlatform: video?.platform ?? null,
    videoExternalId: video?.externalId ?? null,
    videoSource:
      row.video_source === "own" || row.video_source === "curated" ? row.video_source : null,
    channelName: typeof row.channel_name === "string" ? row.channel_name : null,
  };
}
```

`search_posts` không trả cột video, nên kết quả tìm kiếm có bốn trường này bằng `null` — đúng như kiểu cho phép.

- [ ] **Step 14: `PostCard` dùng `postHref`** — trong `src/components/forum/PostCard.tsx`:

(a) thay:

```ts
import { TOPIC_TONE } from "@/lib/constants";
```

bằng:

```ts
import { TOPIC_TONE } from "@/lib/constants";
import { postHref } from "@/lib/paths";
```

(b) thay trọn khối từ `  const isLesson = post.kind === "lesson";` tới hết `    } as const);` (khối dựng `href`, 10 dòng) bằng:

```ts
  const href = postHref(post);
  // Only a lesson that lost its topic has no page; a card pointing at a 404
  // would be worse than no card.
  if (!href) return null;
```

- [ ] **Step 15: Chạy lại**

Run: `npm test -- --maxWorkers=3 && npm run typecheck && npm run lint`
Expected: tất cả PASS (262 test), 0 lỗi type, `✔ No ESLint warnings or errors`.

- [ ] **Step 16: Commit**

```bash
git add src/i18n/routing.ts src/lib/paths.ts src/lib/paths.test.ts src/lib/listing-params.ts src/lib/listing-params.test.ts src/lib/sitemap-entries.ts src/lib/sitemap-entries.test.ts src/lib/revalidate-paths.ts src/lib/revalidate-paths.test.ts src/app/sitemap.ts src/lib/types.ts src/lib/queries/posts.ts src/components/forum/PostCard.tsx
git commit -m "feat(routing): add video and search routes and one href builder for every post kind"
```

---

### Task 2: Truy vấn bài học, video, video liên quan và bài học liên quan

**Files:**
- Create: `src/lib/listing-order.ts`, `src/lib/listing-order.test.ts`
- Modify: `src/lib/queries/posts.ts` (import; khối hàm mới chèn trước `getPostBySlug`; `searchPosts`)

**Interfaces:**
- Consumes: `VideoSort`, `ListingParams` (Task 1), `VideoPost`, `PostSummary` (Task 1), `TOPIC_IDS`.
- Produces:
  - `LISTING_PAGE_SIZE = 12` · `type OrderClause = { column: "published_at" | "difficulty" | "id"; ascending: boolean; nullsFirst: boolean }` · `listingOrder(sort: VideoSort): OrderClause[]` · `pageRange(page: number, pageSize?: number): { from: number; to: number }`
  - `listLessons(locale: Locale, params: Pick<ListingParams, "topic" | "difficulty" | "page">): Promise<{ posts: PostSummary[]; total: number }>`
  - `listVideos(locale: Locale, params: ListingParams): Promise<{ posts: PostSummary[]; total: number }>`
  - `getVideoBySlug(locale: Locale, slug: string): Promise<VideoPost | null>`
  - `listRelatedVideos(locale: Locale, lessonTranslationId: string): Promise<PostSummary[]>` (tối đa 6, mới nhất trước)
  - `getLessonByTranslation(locale: Locale, translationId: string): Promise<{ slug: string; topic: TopicId; title: string } | null>`
  - `searchPosts(locale, query, kinds?, limit = 30)` — thêm tham số thứ tư.

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/listing-order.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LISTING_PAGE_SIZE, pageRange, listingOrder } from "@/lib/listing-order";

describe("listingOrder", () => {
  it("sorts newest first by default", () => {
    expect(listingOrder("newest")).toEqual([
      { column: "published_at", ascending: false, nullsFirst: false },
      { column: "id", ascending: true, nullsFirst: false },
    ]);
  });

  it("sorts oldest first", () => {
    expect(listingOrder("oldest")[0]).toEqual({ column: "published_at", ascending: true, nullsFirst: false });
  });

  it("sorts easiest first by the enum order, videos without a level last, then newest", () => {
    expect(listingOrder("easiest")).toEqual([
      { column: "difficulty", ascending: true, nullsFirst: false },
      { column: "published_at", ascending: false, nullsFirst: false },
      { column: "id", ascending: true, nullsFirst: false },
    ]);
  });

  it("sorts hardest first, still with videos without a level last", () => {
    expect(listingOrder("hardest").slice(0, 2)).toEqual([
      { column: "difficulty", ascending: false, nullsFirst: false },
      { column: "published_at", ascending: false, nullsFirst: false },
    ]);
  });

  it("always ends on a unique column so pages never overlap", () => {
    for (const sort of ["newest", "oldest", "easiest", "hardest"] as const) {
      expect(listingOrder(sort).at(-1)?.column).toBe("id");
    }
  });
});

describe("pageRange", () => {
  it("maps a 1-based page to an inclusive range of 12 rows", () => {
    expect(LISTING_PAGE_SIZE).toBe(12);
    expect(pageRange(1)).toEqual({ from: 0, to: 11 });
    expect(pageRange(3)).toEqual({ from: 24, to: 35 });
    expect(pageRange(2, 5)).toEqual({ from: 5, to: 9 });
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/listing-order.test.ts`
Expected: FAIL `Failed to resolve import "@/lib/listing-order"`.

- [ ] **Step 3: Tạo `src/lib/listing-order.ts`**

```ts
import type { VideoSort } from "@/lib/listing-params";

/** Cards per listing page, lessons and videos alike. */
export const LISTING_PAGE_SIZE = 12;

/** One `.order()` call, in the order they must be applied. */
export type OrderClause = {
  column: "published_at" | "difficulty" | "id";
  ascending: boolean;
  nullsFirst: boolean;
};

const NEWEST: OrderClause = { column: "published_at", ascending: false, nullsFirst: false };
// Two posts published in the same instant would otherwise swap places between
// requests and show up on two pages, or on none.
const TIE_BREAK: OrderClause = { column: "id", ascending: true, nullsFirst: false };

/**
 * The ORDER BY behind each sort. Lessons always use "newest"; videos let the
 * reader choose.
 *
 * `difficulty` is the Postgres enum `post_difficulty`, which sorts in its
 * declared order (basic, intermediate, advanced) rather than alphabetically,
 * so ascending really is easiest first. A video without a difficulty goes
 * last in both directions, then newest first within each level.
 */
export function listingOrder(sort: VideoSort): OrderClause[] {
  switch (sort) {
    case "oldest":
      return [{ column: "published_at", ascending: true, nullsFirst: false }, TIE_BREAK];
    case "easiest":
      return [{ column: "difficulty", ascending: true, nullsFirst: false }, NEWEST, TIE_BREAK];
    case "hardest":
      return [{ column: "difficulty", ascending: false, nullsFirst: false }, NEWEST, TIE_BREAK];
    case "newest":
      return [NEWEST, TIE_BREAK];
  }
}

/** The inclusive row range of a 1-based page, as `.range()` takes it. */
export function pageRange(page: number, pageSize = LISTING_PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/listing-order.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Thêm truy vấn** — trong `src/lib/queries/posts.ts`:

(a) thay:

```ts
import type { TopicId } from "@/lib/constants";
import type { Comment, Difficulty, Post, PostKind, PostSummary } from "@/lib/types";
```

bằng:

```ts
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { listingOrder, pageRange } from "@/lib/listing-order";
import type { ListingParams } from "@/lib/listing-params";
import type { Comment, Difficulty, Post, PostKind, PostSummary, VideoPost } from "@/lib/types";
```

(b) chèn khối sau ngay **trước** dòng `export async function getPostBySlug(`:

```ts
type PageOf = { posts: PostSummary[]; total: number };

function toPage(
  scope: string,
  { data, error, count }: { data: Row[] | null; error: { code: string; message: string } | null; count: number | null }
): PageOf {
  if (error) {
    // PGRST103: the requested page starts past the last row. That is an empty
    // page (a stale or hand-edited ?page=), not a failure worth logging.
    if (error.code !== "PGRST103") console.error(`[${scope}]`, error.message);
    return { posts: [], total: 0 };
  }
  return { posts: (data ?? []).map(toSummary), total: count ?? 0 };
}

/** One page of published lessons, newest first, optionally narrowed. */
export async function listLessons(
  locale: Locale,
  { topic, difficulty, page }: Pick<ListingParams, "topic" | "difficulty" | "page">
): Promise<PageOf> {
  if (!requireSupabase("listLessons")) return { posts: [], total: 0 };

  const supabase = createClient();
  const { from, to } = pageRange(page);
  let query = supabase
    .from("posts")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "lesson");

  if (topic) query = query.eq("topic", topic);
  if (difficulty) query = query.eq("difficulty", difficulty);

  for (const clause of listingOrder("newest")) {
    query = query.order(clause.column, { ascending: clause.ascending, nullsFirst: clause.nullsFirst });
  }

  return toPage("listLessons", await query.range(from, to));
}

/** One page of published videos, filtered and sorted as the URL asks. */
export async function listVideos(locale: Locale, params: ListingParams): Promise<PageOf> {
  if (!requireSupabase("listVideos")) return { posts: [], total: 0 };

  const supabase = createClient();
  const { from, to } = pageRange(params.page);
  let query = supabase
    .from("posts")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "video");

  if (params.platform) query = query.eq("video_platform", params.platform);
  if (params.source) query = query.eq("video_source", params.source);
  if (params.topic) query = query.eq("topic", params.topic);
  if (params.difficulty) query = query.eq("difficulty", params.difficulty);

  for (const clause of listingOrder(params.sort)) {
    query = query.order(clause.column, { ascending: clause.ascending, nullsFirst: clause.nullsFirst });
  }

  return toPage("listVideos", await query.range(from, to));
}

export async function getVideoBySlug(locale: Locale, slug: string): Promise<VideoPost | null> {
  if (!requireSupabase("getVideoBySlug")) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${POST_COLUMNS}, related_lesson_translation_id`)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "video")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getVideoBySlug]", error.message);
    return null;
  }
  if (!data) return null;
  const related = data.related_lesson_translation_id;
  return { ...toPost(data), relatedLessonTranslationId: typeof related === "string" ? related : null };
}

/** Published videos in this locale that point at the given lesson group. */
export async function listRelatedVideos(
  locale: Locale,
  lessonTranslationId: string
): Promise<PostSummary[]> {
  if (!requireSupabase("listRelatedVideos")) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "video")
    .eq("related_lesson_translation_id", lessonTranslationId)
    .order("published_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[listRelatedVideos]", error.message);
    return [];
  }
  return (data ?? []).map(toSummary);
}

/**
 * The published lesson of a translation group in one locale, so a video page
 * can link back to it. Null when the lesson is unpublished, deleted, or has
 * lost its topic — the link then simply does not render.
 */
export async function getLessonByTranslation(
  locale: Locale,
  translationId: string
): Promise<{ slug: string; topic: TopicId; title: string } | null> {
  if (!requireSupabase("getLessonByTranslation")) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug, topic, title")
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "lesson")
    .eq("translation_id", translationId)
    .maybeSingle();

  if (error) {
    console.error("[getLessonByTranslation]", error.message);
    return null;
  }
  const topic = TOPIC_IDS.find((id) => id === data?.topic);
  return data && topic ? { slug: String(data.slug), topic, title: String(data.title ?? "") } : null;
}
```

(c) trong `searchPosts`, thay:

```ts
  kinds: PostKind[] = ["lesson", "forum", "video"]
): Promise<PostSummary[]> {
```

bằng:

```ts
  kinds: PostKind[] = ["lesson", "forum", "video"],
  limit = 30
): Promise<PostSummary[]> {
```

và thay dòng `    p_limit: 30,` bằng:

```ts
    // search_posts clamps this to 1–50 itself.
    p_limit: limit,
```

Lưu ý khi đọc code: `toPage` nhận thẳng kết quả của `await query.range(...)`; `PGRST103` là mã PostgREST khi trang bắt đầu sau dòng cuối (xem "Đo thực tế"). Mọi giá trị lọc đã qua danh sách trắng ở `parseListingParams` và đi vào `.eq()` dạng tham số, không ghép chuỗi.

- [ ] **Step 6: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 268 test PASS. (Các hàm mới chưa có người gọi — Task 3–6 dùng; lint không báo biến chưa dùng cho export.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/listing-order.ts src/lib/listing-order.test.ts src/lib/queries/posts.ts
git commit -m "feat(queries): page, filter and sort lessons and videos; read a video and its related lesson"
```

---

### Task 3: Trang Bài học — cột chủ đề thu gọn được, lọc độ khó, phân trang, chuyển `?tab=video`

**Files:**
- Modify: `src/lib/listing-params.ts` (thêm `pageWindow` cuối file), `src/lib/listing-params.test.ts` (import + `describe("pageWindow")`)
- Create: `src/components/listing/FilterPills.tsx`, `src/components/listing/Pagination.tsx`
- Create: `src/components/lessons/TopicSidebar.tsx`, `src/components/lessons/LessonsListing.tsx`
- Modify (viết lại toàn file): `src/app/[locale]/bai-hoc/page.tsx`, `src/app/[locale]/bai-hoc/[topic]/page.tsx`, `src/app/[locale]/bai-hoc/[topic]/empty-state.test.ts`
- Create: `src/app/[locale]/bai-hoc/opengraph-image.tsx`
- Modify: `src/i18n/navigation.ts`, `src/lib/queries/posts.ts` (xoá `listLessonPosts`), `src/components/forum/PostCard.tsx` (nhãn độ khó), `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `parseListingParams`, `listingQuery`, `DEFAULT_LISTING`, `firstParam`, `ListingParams`, `SearchParams` (Task 1); `listLessons`, `countLessonsByTopic`, `LISTING_PAGE_SIZE` (Task 2); `EASE_STANDARD` (`@/components/motion/tokens`).
- Produces:
  - `pageWindow(page: number, totalPages: number): (number | "gap")[]`
  - `type ListingHref = ComponentProps<typeof Link>["href"]` · `type FilterOption = { key: string; label: string; href: ListingHref; active: boolean }` · `<FilterPills label options />` (server)
  - `<Pagination page totalPages hrefFor={(page: number) => ListingHref} />` (server, async)
  - `<TopicSidebar heading collapseLabel expandLabel>{children}</TopicSidebar>` (client)
  - `<LessonsListing locale topic={TopicId | null} searchParams />` (server, async)
  - `permanentRedirect` xuất từ `@/i18n/navigation`
  - Message: `lessons.{allTopics,topicsHeading,collapseTopics,expandTopics,empty,emptyFiltered}`, `difficulty.{label,all,basic,intermediate,advanced}`, `pagination.{label,previous,next,page,pageEmpty,backToFirst}`.

- [ ] **Step 1: Viết test thất bại cho `pageWindow`** — trong `src/lib/listing-params.test.ts`, thay:

```ts
  listingQuery,
  parseListingParams,
```

bằng:

```ts
  listingQuery,
  pageWindow,
  parseListingParams,
```

rồi thêm vào **cuối file**:

```ts
describe("pageWindow", () => {
  it("shows every page up to seven", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageWindow(1, 0)).toEqual([]);
  });

  it("shows the ends and the current page's neighbours beyond seven", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, "gap", 20]);
    expect(pageWindow(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
    expect(pageWindow(3, 20)).toEqual([1, 2, 3, 4, "gap", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "gap", 19, 20]);
  });

  it("still leads back into range from a page past the end", () => {
    expect(pageWindow(40, 20)).toEqual([1, "gap", 20]);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/listing-params.test.ts`
Expected: FAIL — 3 test `pageWindow` báo `pageWindow is not a function`; 9 test cũ PASS.

- [ ] **Step 3: Thêm `pageWindow`** vào **cuối** `src/lib/listing-params.ts`:

```ts
/**
 * Which page numbers a pagination bar shows: all of them up to seven pages,
 * otherwise the first, the last and the neighbours of the current page, with
 * a "gap" wherever numbers are skipped. A page past the end (a stale link)
 * still gets a bar that leads back into range.
 */
export function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const shown = [1, page - 1, page, page + 1, totalPages]
    .filter((n) => n >= 1 && n <= totalPages)
    .filter((n, i, all) => all.indexOf(n) === i)
    .sort((a, b) => a - b);

  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? ["gap" as const, n] : [n]));
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/listing-params.test.ts`
Expected: PASS (12 test).

- [ ] **Step 5: Message** — trong `src/messages/vi.json`, thay trọn khối `"lessons": { … },` bằng:

```json
  "lessons": {
    "title": "Bài học",
    "description": "Kiến thức bán dẫn từ cơ bản tới nâng cao, chia theo chủ đề.",
    "backToLessons": "Về trang Bài học",
    "backToTopic": "Về chủ đề {topic}",
    "notFound": "Không tìm thấy bài viết này.",
    "allTopics": "Tất cả",
    "topicsHeading": "Chủ đề",
    "collapseTopics": "Thu gọn cột chủ đề",
    "expandTopics": "Mở cột chủ đề",
    "empty": "Chưa có bài học nào. Quay lại sau nhé!",
    "emptyFiltered": "Chưa có bài học nào ở mức độ này."
  },
  "difficulty": {
    "label": "Độ khó",
    "all": "Tất cả",
    "basic": "Cơ bản",
    "intermediate": "Trung bình",
    "advanced": "Nâng cao"
  },
  "pagination": {
    "label": "Phân trang",
    "previous": "Trang trước",
    "next": "Trang sau",
    "page": "Trang {page}",
    "pageEmpty": "Trang này không có nội dung.",
    "backToFirst": "Về trang đầu"
  },
```

và trong `src/messages/en.json`, thay trọn khối `"lessons": { … },` bằng:

```json
  "lessons": {
    "title": "Lessons",
    "description": "Semiconductor knowledge from fundamentals to advanced topics, organised by theme.",
    "backToLessons": "Back to Lessons",
    "backToTopic": "Back to {topic}",
    "notFound": "This article could not be found.",
    "allTopics": "All",
    "topicsHeading": "Topics",
    "collapseTopics": "Collapse the topic column",
    "expandTopics": "Expand the topic column",
    "empty": "No lessons yet. Please check back soon!",
    "emptyFiltered": "No lessons at this level yet."
  },
  "difficulty": {
    "label": "Difficulty",
    "all": "All",
    "basic": "Basic",
    "intermediate": "Intermediate",
    "advanced": "Advanced"
  },
  "pagination": {
    "label": "Pagination",
    "previous": "Previous page",
    "next": "Next page",
    "page": "Page {page}",
    "pageEmpty": "There is nothing on this page.",
    "backToFirst": "Back to the first page"
  },
```

(Bốn khoá `tabTheory`, `tabVideo`, `videoComingSoon`, `videoDescription` biến mất cùng tab Video cũ; chỉ hai trang `bai-hoc` dùng chúng và cả hai được viết lại ở bước dưới.)

- [ ] **Step 6: Xuất `permanentRedirect`** — `src/i18n/navigation.ts`, thay:

```ts
export const { Link, redirect, usePathname, useRouter, getPathname } =
```

bằng:

```ts
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
```

- [ ] **Step 7: Tạo `src/components/listing/FilterPills.tsx`**

```tsx
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ListingHref = ComponentProps<typeof Link>["href"];

export type FilterOption = {
  key: string;
  label: string;
  href: ListingHref;
  active: boolean;
};

/**
 * One row of filter links. Plain links rather than buttons: every filter is a
 * URL, so a filtered view can be shared, bookmarked and used without
 * JavaScript.
 */
export function FilterPills({ label, options }: { label: string; options: FilterOption[] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </span>
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {options.map((option) => (
          <li key={option.key}>
            <Link
              href={option.href}
              scroll={false}
              aria-current={option.active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                option.active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-nav hover:border-black/20 hover:text-accent"
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Tạo `src/components/listing/Pagination.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/components/listing/FilterPills";
import { pageWindow } from "@/lib/listing-params";
import { cn } from "@/lib/utils";

const ITEM =
  "flex size-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors";

export async function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => ListingHref;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations("pagination");

  return (
    <nav aria-label={t("label")} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && page <= totalPages && (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          aria-label={t("previous")}
          className={cn(ITEM, "border-border text-text-nav hover:border-black/20")}
        >
          <ChevronLeft className="size-4" strokeWidth={2.2} />
        </Link>
      )}

      {pageWindow(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-sm text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-label={t("page", { page: item })}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              ITEM,
              item === page
                ? "border-primary bg-primary text-white"
                : "border-border text-text-nav hover:border-black/20"
            )}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          aria-label={t("next")}
          className={cn(ITEM, "border-border text-text-nav hover:border-black/20")}
        >
          <ChevronRight className="size-4" strokeWidth={2.2} />
        </Link>
      )}
    </nav>
  );
}
```

- [ ] **Step 9: Tạo `src/components/lessons/TopicSidebar.tsx`** (client — chỗ JS thứ nhất trong bốn chỗ được phép)

```tsx
"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { EASE_STANDARD } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chipchip.lessons.topicsCollapsed";

// Spec value for this one transition; the easing is the site-wide one.
const COLLAPSE_TRANSITION = {
  transitionDuration: "450ms",
  transitionTimingFunction: `cubic-bezier(${EASE_STANDARD.join(", ")})`,
};

/**
 * The topic column of the lessons pages.
 *
 * The only client code on those pages: it folds the column on desktop and
 * remembers that choice. The topic links themselves arrive as server-rendered
 * children. Below `lg` there is nothing to fold — the links are a horizontal
 * row above the grid — so the button and the collapsed state apply only from
 * `lg` up.
 */
export function TopicSidebar({
  heading,
  collapseLabel,
  expandLabel,
  children,
}: {
  heading: string;
  collapseLabel: string;
  expandLabel: string;
  children: ReactNode;
}) {
  const listId = useId();
  const [collapsed, setCollapsed] = useState(false);
  // Off until the stored state is applied, so a returning reader who left it
  // folded does not watch it fold again on every page load.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Storage can be blocked (private mode, disabled cookies): stay open.
    }
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not remembered, but the column still folds for this visit.
    }
  };

  return (
    <aside
      aria-label={heading}
      className={cn(
        "mb-8 shrink-0 lg:sticky lg:top-28 lg:mb-0",
        collapsed ? "lg:w-11" : "lg:w-[260px]",
        animate && "lg:transition-[width] motion-reduce:transition-none"
      )}
      style={animate ? COLLAPSE_TRANSITION : undefined}
    >
      <div className="mb-3 hidden items-center justify-between gap-2 lg:flex">
        {!collapsed && <h2 className="text-sm font-semibold text-text">{heading}</h2>}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={listId}
          aria-label={collapsed ? expandLabel : collapseLabel}
          title={collapsed ? expandLabel : collapseLabel}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text-nav transition-colors hover:border-black/20 hover:text-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" strokeWidth={1.8} />
          ) : (
            <PanelLeftClose className="size-5" strokeWidth={1.8} />
          )}
        </button>
      </div>

      <div id={listId} className={cn(collapsed && "lg:hidden")}>
        {children}
      </div>
    </aside>
  );
}
```

- [ ] **Step 10: Tạo `src/components/lessons/LessonsListing.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/forum/PostCard";
import { FilterPills, type ListingHref } from "@/components/listing/FilterPills";
import { Pagination } from "@/components/listing/Pagination";
import { TopicSidebar } from "@/components/lessons/TopicSidebar";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { LISTING_PAGE_SIZE } from "@/lib/listing-order";
import {
  DEFAULT_LISTING,
  listingQuery,
  parseListingParams,
  type ListingParams,
  type SearchParams,
} from "@/lib/listing-params";
import { countLessonsByTopic, listLessons } from "@/lib/queries/posts";
import { DIFFICULTIES } from "@/lib/types";
import { cn } from "@/lib/utils";

/** `/bai-hoc` when no topic is chosen, `/bai-hoc/[topic]` otherwise. */
function lessonsHref(topic: TopicId | null, query: Record<string, string>): ListingHref {
  return topic
    ? { pathname: "/bai-hoc/[topic]", params: { topic }, query }
    : { pathname: "/bai-hoc", query };
}

/**
 * The lessons listing, shared by `/bai-hoc` and `/bai-hoc/[topic]`.
 *
 * The topic lives in the path (each topic page is its own canonical URL);
 * only the difficulty and the page travel in the query. Anything else in the
 * query — a video filter pasted onto a lessons URL — is dropped here, so it
 * can never leak into the links this page builds.
 */
export async function LessonsListing({
  locale,
  topic,
  searchParams,
}: {
  locale: Locale;
  topic: TopicId | null;
  searchParams: SearchParams;
}) {
  const parsed = parseListingParams(searchParams);
  const current: ListingParams = {
    ...DEFAULT_LISTING,
    difficulty: parsed.difficulty,
    page: parsed.page,
  };

  const [t, tTopics, tDifficulty, tPagination] = await Promise.all([
    getTranslations("lessons"),
    getTranslations("topics"),
    getTranslations("difficulty"),
    getTranslations("pagination"),
  ]);

  const [{ posts, total }, counts] = await Promise.all([
    listLessons(locale, { topic, difficulty: current.difficulty, page: current.page }),
    countLessonsByTopic(locale),
  ]);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);
  const allCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  // Changing topic keeps the difficulty but starts again from page 1.
  const topicQuery = listingQuery(current);

  const topicEntries = [
    { key: "all", label: t("allTopics"), count: allCount, href: lessonsHref(null, topicQuery), active: topic === null },
    ...TOPIC_IDS.map((id) => ({
      key: id,
      label: tTopics(`${id}.title`),
      count: counts[id] ?? 0,
      href: lessonsHref(id, topicQuery),
      active: topic === id,
    })),
  ];

  const emptyMessage =
    current.page > 1
      ? tPagination("pageEmpty")
      : current.difficulty
        ? t("emptyFiltered")
        : topic
          ? tTopics("empty")
          : t("empty");

  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
            {topic ? tTopics(`${topic}.title`) : t("title")}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
            {topic ? tTopics(`${topic}.description`) : t("description")}
          </p>
        </header>

        <div className="mt-10 lg:flex lg:items-start lg:gap-10">
          <TopicSidebar
            heading={t("topicsHeading")}
            collapseLabel={t("collapseTopics")}
            expandLabel={t("expandTopics")}
          >
            <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {topicEntries.map((entry) => (
                <li key={entry.key} className="shrink-0">
                  <Link
                    href={entry.href}
                    aria-current={entry.active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-3 rounded-full border px-4 text-sm font-medium transition-colors",
                      entry.active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text-nav hover:border-black/20 hover:text-accent"
                    )}
                  >
                    <span className="whitespace-nowrap">{entry.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs tabular-nums",
                        entry.active ? "bg-white/15 text-white" : "bg-surface-muted text-text-muted"
                      )}
                    >
                      {entry.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </TopicSidebar>

          <div className="min-w-0 flex-1">
            <FilterPills
              label={tDifficulty("label")}
              options={[
                {
                  key: "all",
                  label: tDifficulty("all"),
                  href: lessonsHref(topic, listingQuery(current, { difficulty: null })),
                  active: current.difficulty === null,
                },
                ...DIFFICULTIES.map((level) => ({
                  key: level,
                  label: tDifficulty(level),
                  href: lessonsHref(topic, listingQuery(current, { difficulty: level })),
                  active: current.difficulty === level,
                })),
              ]}
            />

            {posts.length === 0 ? (
              <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                <p className="text-sm text-text-muted">{emptyMessage}</p>
                {current.page > 1 && (
                  <Link
                    href={lessonsHref(topic, listingQuery(current, { page: 1 }))}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-black"
                  >
                    {tPagination("backToFirst")}
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} showTopic={topic === null} />
                ))}
              </div>
            )}

            <Pagination
              page={current.page}
              totalPages={totalPages}
              hrefFor={(page) => lessonsHref(topic, listingQuery(current, { page }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 11: Viết lại `src/app/[locale]/bai-hoc/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LessonsListing } from "@/components/lessons/LessonsListing";
import { permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { firstParam, type SearchParams } from "@/lib/listing-params";
import { localeAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lessons" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/bai-hoc", locale as Locale),
  };
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The old "Video" tab of this page is now a page of its own. A 301 in
  // next.config.mjs cannot match on the query string, so shared links to
  // `?tab=video` are moved on here instead.
  if (firstParam(searchParams.tab) === "video") {
    permanentRedirect({ href: "/video", locale: locale as Locale });
  }

  return <LessonsListing locale={locale as Locale} topic={null} searchParams={searchParams} />;
}
```

- [ ] **Step 12: Viết lại `src/app/[locale]/bai-hoc/[topic]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LessonsListing } from "@/components/lessons/LessonsListing";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS } from "@/lib/constants";
import type { SearchParams } from "@/lib/listing-params";
import { localeAlternates } from "@/lib/seo";

type Params = Promise<{ locale: string; topic: string }>;

export const revalidate = 3600;

export function generateStaticParams() {
  return TOPIC_IDS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, topic } = await params;
  const topicId = TOPIC_IDS.find((id) => id === topic);
  if (!topicId) return {};

  const t = await getTranslations({ locale, namespace: "topics" });
  return {
    title: t(`${topicId}.title`),
    description: t(`${topicId}.description`),
    // Each topic page is its own canonical URL, never `/bai-hoc`.
    alternates: localeAlternates(
      { pathname: "/bai-hoc/[topic]", params: { topic: topicId } },
      locale as Locale
    ),
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, topic } = await params;
  setRequestLocale(locale);

  const topicId = TOPIC_IDS.find((id) => id === topic);
  if (!topicId) notFound();

  return <LessonsListing locale={locale as Locale} topic={topicId} searchParams={searchParams} />;
}
```

- [ ] **Step 13: Viết lại `src/app/[locale]/bai-hoc/[topic]/empty-state.test.ts`** (trang chủ đề giờ render component dùng chung; test vẫn giữ đúng ý cũ: trạng thái rỗng của chủ đề dùng `topics.empty`, không dùng chuỗi "video đang hoàn thiện")

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("topic page empty state", () => {
  it("uses the topic empty copy, not the video coming-soon string", () => {
    // The topic page renders the shared lessons listing; its empty state
    // lives there now.
    const src = readFileSync(
      fileURLToPath(new URL("../../../../components/lessons/LessonsListing.tsx", import.meta.url)),
      "utf8"
    );

    expect(src).not.toContain("videoComingSoon");
    expect(src).toContain('tTopics("empty")');
  });
});
```

- [ ] **Step 14: Tạo `src/app/[locale]/bai-hoc/opengraph-image.tsx`** (trang chủ đề không có ảnh riêng nên dùng chung ảnh này; trang chi tiết bài học vẫn có ảnh riêng)

```tsx
import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/render";

export const alt = "";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function LessonsOpenGraphImage({ params }: { params: { locale: string } }) {
  const [tMeta, t] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "meta" }),
    getTranslations({ locale: params.locale, namespace: "lessons" }),
  ]);

  return renderOgCard({ eyebrow: tMeta("siteName"), title: t("title") });
}
```

- [ ] **Step 15: Xoá `listLessonPosts`** — trong `src/lib/queries/posts.ts`, xoá trọn hàm `export async function listLessonPosts(…) { … }` (25 dòng, ngay trên comment `/** How many published lessons sit under each topic — drives the topic cards. */`). Kiểm không còn ai dùng:

Run: `grep -rn "listLessonPosts" src`
Expected: không có dòng nào.

- [ ] **Step 16: Nhãn độ khó trên `PostCard`** — trong `src/components/forum/PostCard.tsx`:

(a) thay:

```ts
  const tTopics = await getTranslations("topics");
```

bằng:

```ts
  const tTopics = await getTranslations("topics");
  const tDifficulty = await getTranslations("difficulty");
```

(b) ngay **trước** dòng `        {post.publishedAt && (` thêm:

```tsx
        {post.difficulty && (
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-text-muted">
            {tDifficulty(post.difficulty)}
          </span>
        )}
```

(Bài blog không bao giờ có độ khó — ràng buộc `posts_difficulty_not_on_forum` — nên thẻ blog không đổi.)

- [ ] **Step 17: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 271 test PASS (gồm `keys-parity` và `empty-state`).

- [ ] **Step 18: Xem nhanh bằng trình duyệt** (stack local đang chạy, `NODE_ENV=development npx next dev -p 3000`; dữ liệu thử ở Task 9 Step 2 — nạp trước nếu muốn thấy thẻ)

1. `/vi/bai-hoc`: cột trái có "Tất cả" + 4 chủ đề kèm số bài; bấm nút thu gọn → cột co lại trong ~0,45 s, tải lại trang → vẫn thu gọn, không có hiệu ứng gập lại. DevTools → Rendering → `prefers-reduced-motion: reduce` → bấm nút → co lại tức thì.
2. Bấm "Nâng cao" → URL `?difficulty=advanced`; bấm chủ đề "Nguyên lý" → `/vi/bai-hoc/nguyen-ly?difficulty=advanced`; `<link rel="canonical">` là `/vi/bai-hoc/nguyen-ly`.
3. Cửa sổ 375 px: chủ đề là một hàng cuộn ngang, không có nút thu gọn; mọi viên thuốc cao ≥ 44 px.
4. `/vi/bai-hoc?tab=video` → chuyển thẳng sang `/vi/video` (308). (Trang `/vi/video` 404 cho tới Task 4 — chỉ kiểm địa chỉ đích.)

- [ ] **Step 19: Commit**

```bash
git add src/lib/listing-params.ts src/lib/listing-params.test.ts src/components/listing/FilterPills.tsx src/components/listing/Pagination.tsx src/components/lessons/TopicSidebar.tsx src/components/lessons/LessonsListing.tsx "src/app/[locale]/bai-hoc/page.tsx" "src/app/[locale]/bai-hoc/[topic]/page.tsx" "src/app/[locale]/bai-hoc/[topic]/empty-state.test.ts" "src/app/[locale]/bai-hoc/opengraph-image.tsx" src/i18n/navigation.ts src/lib/queries/posts.ts src/components/forum/PostCard.tsx src/messages/vi.json src/messages/en.json
git commit -m "feat(lessons): topic column, difficulty filter and pagination; send ?tab=video to /video"
```

---

### Task 4: Trang danh sách Video — banner, bộ lọc, sắp xếp, thẻ có ảnh xem trước

**Files:**
- Modify: `src/lib/video.ts` (thêm `thumbnailUrl` trước `PLATFORM_LABEL`), `src/lib/video.test.ts`
- Modify: `next.config.mjs` (remotePatterns)
- Create: `src/components/video/VideoCard.tsx`, `src/components/video/VideoFilters.tsx`
- Create: `src/app/[locale]/video/page.tsx`, `src/app/[locale]/video/opengraph-image.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `parseListingParams`, `listingQuery`, `DEFAULT_LISTING`, `VIDEO_PLATFORMS`, `VIDEO_SORTS`, `SearchParams` (Task 1); `postHref` (Task 1); `listVideos`, `LISTING_PAGE_SIZE` (Task 2); `FilterPills`, `ListingHref`, `Pagination`, message `difficulty.*`, `pagination.*` (Task 3); `videoRefFrom`, `PLATFORM_LABEL` (`@/lib/video`).
- Produces:
  - `thumbnailUrl(ref: VideoRef): string | null` — `https://i.ytimg.com/vi/<id>/hqdefault.jpg` cho YouTube, `null` cho TikTok.
  - `<VideoCard post={PostSummary} compact?={boolean} />` (server, async) — Task 6 dùng `compact`.
  - `<VideoFilters locale current={ListingParams} />` (server, async).
  - Message `videos.{title,description,filtersLabel,platform,source,topic,all,sourceOwn,sourceCurated,sourceCuratedBy,sort,sortOptions.{newest,oldest,easiest,hardest},applySort,clearFilters,empty,emptyFiltered}`.

- [ ] **Step 1: Viết test thất bại** — trong `src/lib/video.test.ts`, thay dòng import:

```ts
import { embedUrl, parseVideoUrl, videoRefFrom, watchUrl } from "@/lib/video";
```

bằng:

```ts
import { embedUrl, parseVideoUrl, thumbnailUrl, videoRefFrom, watchUrl } from "@/lib/video";
```

rồi thêm vào cuối file:

```ts
describe("thumbnailUrl", () => {
  it("points a YouTube video at its i.ytimg.com still", () => {
    expect(thumbnailUrl(YT)).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("has no still for TikTok", () => {
    expect(thumbnailUrl(TT)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/video.test.ts`
Expected: FAIL — 2 test `thumbnailUrl` báo `thumbnailUrl is not a function`.

- [ ] **Step 3: Thêm `thumbnailUrl`** — trong `src/lib/video.ts`, chèn ngay **trước** dòng `export const PLATFORM_LABEL: Record<VideoPlatform, string> = {`:

```ts
/**
 * The still shown before a video plays. YouTube serves one per id; TikTok has
 * no stable public thumbnail URL, so its cards draw a neutral frame instead.
 */
export function thumbnailUrl(ref: VideoRef): string | null {
  return ref.platform === "youtube"
    ? `https://i.ytimg.com/vi/${encodeURIComponent(ref.externalId)}/hqdefault.jpg`
    : null;
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/video.test.ts`
Expected: PASS.

- [ ] **Step 5: Cho `next/image` lấy ảnh từ `i.ytimg.com`** — trong `next.config.mjs`:

(a) ngay **trước** dòng `const CSP = [` thêm:

```js
/** Video thumbnails on the video cards (see thumbnailUrl in src/lib/video.ts). */
const YOUTUBE_THUMBNAILS = { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" };

```

(b) thay dòng `    remotePatterns: imageRemotePatterns,` bằng:

```js
    remotePatterns: [...imageRemotePatterns, YOUTUBE_THUMBNAILS],
```

CSP không đổi: ảnh qua `next/image` được phục vụ từ `/_next/image` (cùng origin, `img-src 'self'`); facade trong bài đã có `https://i.ytimg.com` từ DA2.

- [ ] **Step 6: Message** — trong `src/messages/vi.json`, thay:

```json
    "backToFirst": "Về trang đầu"
  },
```

bằng:

```json
    "backToFirst": "Về trang đầu"
  },
  "videos": {
    "title": "Video",
    "description": "Video ngắn giải thích bán dẫn bằng hình ảnh: do Chíp Chíp tự thực hiện, hoặc được tuyển chọn từ những kênh uy tín.",
    "filtersLabel": "Lọc video",
    "platform": "Nền tảng",
    "source": "Nguồn",
    "topic": "Chủ đề",
    "all": "Tất cả",
    "sourceOwn": "Của Chíp Chíp",
    "sourceCurated": "Tuyển chọn",
    "sourceCuratedBy": "Tuyển chọn · {channel}",
    "sort": "Sắp xếp",
    "sortOptions": {
      "newest": "Mới nhất",
      "oldest": "Cũ nhất",
      "easiest": "Dễ trước",
      "hardest": "Khó trước"
    },
    "applySort": "Áp dụng",
    "clearFilters": "Xoá lọc",
    "empty": "Chưa có video nào. Quay lại sau nhé!",
    "emptyFiltered": "Không có video nào khớp bộ lọc này."
  },
```

và trong `src/messages/en.json`, thay:

```json
    "backToFirst": "Back to the first page"
  },
```

bằng:

```json
    "backToFirst": "Back to the first page"
  },
  "videos": {
    "title": "Videos",
    "description": "Short videos that explain semiconductors visually: made by Chíp Chíp, or picked from trusted channels.",
    "filtersLabel": "Filter videos",
    "platform": "Platform",
    "source": "Source",
    "topic": "Topic",
    "all": "All",
    "sourceOwn": "By Chíp Chíp",
    "sourceCurated": "Curated",
    "sourceCuratedBy": "Curated · {channel}",
    "sort": "Sort by",
    "sortOptions": {
      "newest": "Newest",
      "oldest": "Oldest",
      "easiest": "Easiest first",
      "hardest": "Hardest first"
    },
    "applySort": "Apply",
    "clearFilters": "Clear filters",
    "empty": "No videos yet. Please check back soon!",
    "emptyFiltered": "No videos match these filters."
  },
```

- [ ] **Step 7: Tạo `src/components/video/VideoCard.tsx`**

```tsx
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { PlayCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { postHref } from "@/lib/paths";
import type { PostSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, thumbnailUrl, videoRefFrom } from "@/lib/video";

/**
 * A video in a grid: thumbnail, source, difficulty and date.
 *
 * `compact` is the smaller card of the "related videos" row on a lesson page.
 */
export async function VideoCard({ post, compact = false }: { post: PostSummary; compact?: boolean }) {
  const href = postHref(post);
  if (!href) return null;

  const [format, t, tDifficulty] = await Promise.all([
    getFormatter(),
    getTranslations("videos"),
    getTranslations("difficulty"),
  ]);

  const ref = videoRefFrom(post.videoPlatform, post.videoExternalId);
  const thumbnail = ref ? thumbnailUrl(ref) : null;
  const source =
    post.videoSource === "own"
      ? t("sourceOwn")
      : post.videoSource === "curated"
        ? post.channelName
          ? t("sourceCuratedBy", { channel: post.channelName })
          : t("sourceCurated")
        : null;

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-black/20 hover:shadow-card-hover",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes={compact ? "(max-width: 640px) 100vw, 33vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            className="object-cover"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center text-text-muted">
            <PlayCircle className="size-10" strokeWidth={1.4} />
          </div>
        )}
        {ref && (
          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white">
            {PLATFORM_LABEL[ref.platform]}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        {source && (
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-text-nav">{source}</span>
        )}
        {post.difficulty && (
          <span className="rounded-full border border-border px-2.5 py-1 text-text-muted">
            {tDifficulty(post.difficulty)}
          </span>
        )}
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="font-normal text-text-muted">
            {format.dateTime(new Date(post.publishedAt), { year: "numeric", month: "short", day: "numeric" })}
          </time>
        )}
      </div>

      <h3
        className={cn(
          "text-balance font-bold leading-snug tracking-[-0.01em] text-text",
          compact ? "text-base" : "text-lg"
        )}
      >
        {post.title}
      </h3>
    </Link>
  );
}
```

- [ ] **Step 8: Tạo `src/components/video/VideoFilters.tsx`** (form sắp xếp là GET thuần tới đường dẫn đã bản địa hoá — `/vi/video` hoặc `/en/videos` — nên chạy không cần JS)

```tsx
import { getTranslations } from "next-intl/server";
import { X } from "lucide-react";
import { FilterPills, type ListingHref } from "@/components/listing/FilterPills";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS } from "@/lib/constants";
import {
  DEFAULT_LISTING,
  VIDEO_PLATFORMS,
  VIDEO_SORTS,
  listingQuery,
  type ListingParams,
} from "@/lib/listing-params";
import { DIFFICULTIES } from "@/lib/types";
import { PLATFORM_LABEL } from "@/lib/video";

function videosHref(query: Record<string, string>): ListingHref {
  return { pathname: "/video", query };
}

/**
 * The filter bar of the video listing. Everything is a link or a GET form,
 * so it works without JavaScript and every state has a shareable URL.
 */
export async function VideoFilters({ locale, current }: { locale: Locale; current: ListingParams }) {
  const [t, tTopics, tDifficulty] = await Promise.all([
    getTranslations("videos"),
    getTranslations("topics"),
    getTranslations("difficulty"),
  ]);

  const option = <K extends "platform" | "source" | "topic" | "difficulty">(
    key: K,
    value: ListingParams[K],
    label: string
  ) => ({
    key: value ?? "all",
    label,
    href: videosHref(listingQuery(current, { [key]: value })),
    active: current[key] === value,
  });

  const isFiltered =
    current.platform !== null ||
    current.source !== null ||
    current.topic !== null ||
    current.difficulty !== null ||
    current.sort !== DEFAULT_LISTING.sort;

  // The sort form re-submits every other filter as hidden fields; the page
  // starts over at 1, like any other change.
  const kept = listingQuery({ ...current, sort: DEFAULT_LISTING.sort });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 className="sr-only">{t("filtersLabel")}</h2>

      <FilterPills
        label={t("platform")}
        options={[
          option("platform", null, t("all")),
          ...VIDEO_PLATFORMS.map((p) => option("platform", p, PLATFORM_LABEL[p])),
        ]}
      />
      <FilterPills
        label={t("source")}
        options={[
          option("source", null, t("all")),
          option("source", "own", t("sourceOwn")),
          option("source", "curated", t("sourceCurated")),
        ]}
      />
      <FilterPills
        label={t("topic")}
        options={[
          option("topic", null, t("all")),
          ...TOPIC_IDS.map((id) => option("topic", id, tTopics(`${id}.title`))),
        ]}
      />
      <FilterPills
        label={tDifficulty("label")}
        options={[
          option("difficulty", null, t("all")),
          ...DIFFICULTIES.map((level) => option("difficulty", level, tDifficulty(level))),
        ]}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        <form method="get" action={getPathname({ href: "/video", locale })} className="flex flex-wrap items-end gap-2">
          {Object.entries(kept).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{t("sort")}</span>
            <select
              name="sort"
              defaultValue={current.sort}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              {VIDEO_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t(`sortOptions.${sort}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            {t("applySort")}
          </button>
        </form>

        {isFiltered && (
          <Link
            href="/video"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-accent transition-colors hover:text-black"
          >
            <X className="size-4" strokeWidth={2.2} />
            {t("clearFilters")}
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Tạo `src/app/[locale]/video/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pagination } from "@/components/listing/Pagination";
import { VideoCard } from "@/components/video/VideoCard";
import { VideoFilters } from "@/components/video/VideoFilters";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { LISTING_PAGE_SIZE } from "@/lib/listing-order";
import { listingQuery, parseListingParams, type SearchParams } from "@/lib/listing-params";
import { listVideos } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  return {
    title: t("title"),
    description: t("description"),
    // Filtered views all point at the one unfiltered listing.
    alternates: localeAlternates("/video", locale as Locale),
  };
}

export default async function VideosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const current = parseListingParams(searchParams);
  const [t, tPagination, { posts, total }] = await Promise.all([
    getTranslations("videos"),
    getTranslations("pagination"),
    listVideos(locale as Locale, current),
  ]);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);
  const isFiltered = Object.keys(listingQuery(current, { page: 1 })).length > 0;
  const emptyMessage =
    current.page > 1
      ? tPagination("pageEmpty")
      : isFiltered
        ? t("emptyFiltered")
        : t("empty");

  return (
    <>
      <section className="px-5 pt-8 md:px-8 md:pt-12">
        {/* Neutral placeholder backdrop; the real banner image arrives in DA5. */}
        <div className="mx-auto w-full max-w-content rounded-3xl bg-brand-gradient px-6 py-14 md:px-12 md:py-20">
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-white md:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/80">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          <VideoFilters locale={locale as Locale} current={current} />

          {posts.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="text-sm text-text-muted">{emptyMessage}</p>
              {current.page > 1 && (
                <Link
                  href={{ pathname: "/video", query: listingQuery(current, { page: 1 }) }}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-black"
                >
                  {tPagination("backToFirst")}
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <VideoCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <Pagination
            page={current.page}
            totalPages={totalPages}
            hrefFor={(page) => ({ pathname: "/video", query: listingQuery(current, { page }) })}
          />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 10: Tạo `src/app/[locale]/video/opengraph-image.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/render";

export const alt = "";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function VideosOpenGraphImage({ params }: { params: { locale: string } }) {
  const [tMeta, t] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "meta" }),
    getTranslations({ locale: params.locale, namespace: "videos" }),
  ]);

  return renderOgCard({ eyebrow: tMeta("siteName"), title: t("title") });
}
```

- [ ] **Step 11: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 273 test PASS.

- [ ] **Step 12: Xem nhanh bằng trình duyệt** (dữ liệu thử ở Task 9 Step 2)

1. `/vi/video`: banner nền tối, chữ trắng; lưới 3 cột ở desktop, 1 cột ở 375 px; thẻ YouTube có ảnh, thẻ TikTok là khung xám có biểu tượng phát; nhãn "Của Chíp Chíp" / "Tuyển chọn · <kênh>", độ khó, ngày.
2. Bấm "TikTok" → `?platform=tiktok`; chọn "Khó trước" rồi "Áp dụng" → `?platform=tiktok&sort=hardest` (bộ lọc cũ còn nguyên); "Xoá lọc" → `/vi/video`.
3. `/en/videos` hiển thị đúng tiếng Anh; Console không có lỗi CSP hay `next/image` (`hostname "i.ytimg.com" is not configured` là dấu hiệu quên Step 5).

- [ ] **Step 13: Commit**

```bash
git add src/lib/video.ts src/lib/video.test.ts next.config.mjs src/components/video/VideoCard.tsx src/components/video/VideoFilters.tsx "src/app/[locale]/video/page.tsx" "src/app/[locale]/video/opengraph-image.tsx" src/messages/vi.json src/messages/en.json
git commit -m "feat(videos): video listing with platform, source, topic and difficulty filters and a sort"
```

---

### Task 5: Trang chi tiết video

**Files:**
- Modify: `src/lib/tiptap/video-embed.ts` (xuất `videoFacadeHtml`, dùng `thumbnailUrl`)
- Create: `src/lib/tiptap/video-embed.test.ts`
- Modify: `src/components/forum/CommentSection.tsx` (prop `section`)
- Modify: `src/components/layout/langSwitchPath.ts`, `src/components/layout/langSwitchPath.test.ts`
- Create: `src/app/[locale]/video/[slug]/page.tsx`, `opengraph-image.tsx`, `not-found.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `getVideoBySlug`, `getLessonByTranslation`, `getTranslationSlug`, `listComments`, `countComments` (Task 2 và sẵn có); `thumbnailUrl` (Task 4); `firstParam`, `SearchParams` (Task 1); `VideoFacades`, `ArticleBody`, `CommentSection` (sẵn có).
- Produces:
  - `videoFacadeHtml(ref: VideoRef, locale: Locale): string` — cùng HTML mà `renderVideos` sinh cho một video.
  - `CommentSection` nhận thêm `section?: "/blog/[slug]" | "/video/[slug]"` (mặc định `"/blog/[slug]"`, trang blog không phải sửa).
  - `safePathFor("/video/[slug]") === "/video"`.
  - Message `videos.{backToVideos,notFound,relatedLesson,watchOn,switchTo.vi,switchTo.en}`.

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/tiptap/video-embed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderVideos, videoFacadeHtml } from "@/lib/tiptap/video-embed";

describe("videoFacadeHtml", () => {
  it("is the same facade an article renders, so the video page reuses its player", () => {
    const ref = { platform: "youtube", externalId: "dQw4w9WgXcQ" } as const;
    const placeholder = '<div data-type="video" data-platform="youtube" data-external-id="dQw4w9WgXcQ"></div>';

    expect(videoFacadeHtml(ref, "en")).toBe(renderVideos(placeholder, "en"));
    expect(videoFacadeHtml(ref, "en")).toContain('aria-label="Play video on YouTube"');
    expect(videoFacadeHtml(ref, "en")).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
  });

  it("draws a TikTok facade without a thumbnail", () => {
    const html = videoFacadeHtml({ platform: "tiktok", externalId: "7231338487075638570" }, "vi");
    expect(html).toContain('class="video-embed video-embed-tiktok"');
    expect(html).toContain('aria-label="Phát video trên TikTok"');
    expect(html).not.toContain("<img");
  });
});
```

và trong `src/components/layout/langSwitchPath.test.ts`:

(a) ngay **trước** `  it("leaves static routes untouched", () => {` thêm:

```ts
  it("sends a video page to the video listing", () => {
    expect(safePathFor("/video/[slug]")).toBe("/video");
  });

```

(b) thay `    for (const route of ["/", "/bai-hoc", "/blog", "/gioi-thieu"]) {` bằng:

```ts
    for (const route of ["/", "/bai-hoc", "/blog", "/gioi-thieu", "/video", "/tim-kiem"]) {
```

(c) trong mảng `routes` của test cuối, thay:

```ts
      "/blog/[slug]",
      "/gioi-thieu",
    ];
```

bằng:

```ts
      "/blog/[slug]",
      "/gioi-thieu",
      "/video",
      "/video/[slug]",
      "/tim-kiem",
    ];
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap/video-embed.test.ts src/components/layout/langSwitchPath.test.ts`
Expected: FAIL — `videoFacadeHtml is not a function` (2 test); `sends a video page to the video listing` và `never returns a template with unfilled params` FAIL vì `/video/[slug]` còn nguyên.

- [ ] **Step 3: Xuất facade** — trong `src/lib/tiptap/video-embed.ts`:

(a) thay dòng import:

```ts
import { PLATFORM_LABEL, videoRefFrom, watchUrl, type VideoRef } from "@/lib/video";
```

bằng:

```ts
import { PLATFORM_LABEL, thumbnailUrl, videoRefFrom, watchUrl, type VideoRef } from "@/lib/video";
```

(b) thay:

```ts
function facade(ref: VideoRef, locale: Locale): string {
  const id = escapeHtml(ref.externalId);
  const label = PLATFORM_LABEL[ref.platform];
  const ariaLabel = escapeHtml(PLAY_VIDEO[locale].replace("{platform}", label));
  const thumbnail =
    ref.platform === "youtube"
      ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">`
      : "";
```

bằng:

```ts
/**
 * The click-to-load facade for one validated video. Exported for the video
 * page, which shows the same player as an article does; the markup is built
 * only from a VideoRef, so it is safe to inject.
 */
export function videoFacadeHtml(ref: VideoRef, locale: Locale): string {
  const id = escapeHtml(ref.externalId);
  const label = PLATFORM_LABEL[ref.platform];
  const ariaLabel = escapeHtml(PLAY_VIDEO[locale].replace("{platform}", label));
  const still = thumbnailUrl(ref);
  const thumbnail = still
    ? `<img src="${escapeHtml(still)}" alt="" loading="lazy" decoding="async">`
    : "";
```

(c) thay `      return ref ? facade(ref, locale) : "";` bằng:

```ts
      return ref ? videoFacadeHtml(ref, locale) : "";
```

- [ ] **Step 4: Fallback chuyển ngôn ngữ** — trong `src/components/layout/langSwitchPath.ts`, thay:

```ts
  "/blog/[slug]": "/blog",
};
```

bằng:

```ts
  "/blog/[slug]": "/blog",
  "/video/[slug]": "/video",
};
```

- [ ] **Step 5: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/tiptap src/components/layout`
Expected: PASS — gồm cả hai test facade video sẵn có trong `render.test.ts` (HTML facade không đổi một ký tự).

- [ ] **Step 6: "Xem thêm bình luận" cho trang video** — trong `src/components/forum/CommentSection.tsx`:

(a) trong danh sách tham số của `CommentSection`, thay:

```ts
  postId,
  slug,
  comments,
```

bằng:

```ts
  postId,
  slug,
  section = "/blog/[slug]",
  comments,
```

(b) trong kiểu props, thay:

```ts
  postId: string;
  slug: string;
  comments: Comment[];
```

bằng:

```ts
  postId: string;
  slug: string;
  /** The page the thread sits on, so "show more" reloads that same page. */
  section?: "/blog/[slug]" | "/video/[slug]";
  comments: Comment[];
```

(c) trong link "loadMore", thay `                    pathname: "/blog/[slug]",` bằng:

```ts
                    pathname: section,
```

Trang bài học hiện không render `CommentSection` (đã kiểm: chỉ `blog/[slug]/page.tsx` dùng), nên chỉ cần hai giá trị này.

- [ ] **Step 7: Message** — trong `src/messages/vi.json`, thay:

```json
    "emptyFiltered": "Không có video nào khớp bộ lọc này."
  },
```

bằng:

```json
    "emptyFiltered": "Không có video nào khớp bộ lọc này.",
    "backToVideos": "Về trang Video",
    "notFound": "Không tìm thấy video này.",
    "relatedLesson": "Xem bài học liên quan",
    "watchOn": "Xem trên {platform}",
    "switchTo": {
      "vi": "Xem bản tiếng Việt",
      "en": "Xem bản tiếng Anh"
    }
  },
```

và trong `src/messages/en.json`, thay:

```json
    "emptyFiltered": "No videos match these filters."
  },
```

bằng:

```json
    "emptyFiltered": "No videos match these filters.",
    "backToVideos": "Back to Videos",
    "notFound": "This video could not be found.",
    "relatedLesson": "Read the related lesson",
    "watchOn": "Watch on {platform}",
    "switchTo": {
      "vi": "Watch in Vietnamese",
      "en": "Watch in English"
    }
  },
```

- [ ] **Step 8: Tạo `src/app/[locale]/video/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, BookOpen, ExternalLink, Languages } from "lucide-react";
import { ArticleBody } from "@/components/forum/ArticleBody";
import {
  CommentSection,
  MAX_ROOT_COMMENTS,
  ROOT_PAGE_SIZE,
} from "@/components/forum/CommentSection";
import { VideoFacades } from "@/components/forum/VideoFacades";
import { Link, getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { TOPIC_TONE } from "@/lib/constants";
import { firstParam, type SearchParams } from "@/lib/listing-params";
import {
  countComments,
  getLessonByTranslation,
  getTranslationSlug,
  getVideoBySlug,
  listComments,
} from "@/lib/queries/posts";
import { articleToPlainText } from "@/lib/tiptap/render";
import { videoFacadeHtml } from "@/lib/tiptap/video-embed";
import { PLATFORM_LABEL, videoRefFrom, watchUrl } from "@/lib/video";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getVideoBySlug(locale as Locale, slug);

  if (!post) return { title: "404" };

  const description = post.excerpt ?? articleToPlainText(post.content, 160) ?? "";

  return {
    title: post.title,
    description,
    // The image comes from the sibling opengraph-image.tsx route.
    openGraph: {
      type: "video.other",
      title: post.title,
      description,
    },
    alternates: {
      // Same approach as the blog and lesson pages: the path is built through
      // next-intl's localized routing, and a missing translation points the
      // other language at its video listing instead of a 404.
      canonical: getPathname({
        href: { pathname: "/video/[slug]", params: { slug: post.slug } },
        locale: locale as Locale,
      }),
      languages: Object.fromEntries(
        await Promise.all(
          routing.locales.map(async (l) => {
            const alt = await getTranslationSlug(post.translationId, l);
            return [
              l,
              alt
                ? getPathname({ href: { pathname: "/video/[slug]", params: { slug: alt } }, locale: l })
                : getPathname({ href: "/video", locale: l }),
            ];
          })
        )
      ),
    },
  };
}

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // `?comments=N` reveals more root comments; capped exactly as on the blog.
  const rootLimit = Math.min(
    Math.max(ROOT_PAGE_SIZE, Number(firstParam(searchParams.comments) ?? "0") || 0),
    MAX_ROOT_COMMENTS
  );

  const post = await getVideoBySlug(locale as Locale, slug);
  if (!post) notFound();

  const [t, tForum, tTopics, tDifficulty, format] = await Promise.all([
    getTranslations("videos"),
    getTranslations("forum"),
    getTranslations("topics"),
    getTranslations("difficulty"),
    getFormatter(),
  ]);

  const otherLocales = routing.locales.filter((l) => l !== locale);
  const [{ comments, totalRoots }, commentCount, lesson, alternates] = await Promise.all([
    listComments(post.id, { rootLimit }),
    countComments(post.id),
    post.relatedLessonTranslationId
      ? getLessonByTranslation(locale as Locale, post.relatedLessonTranslationId)
      : Promise.resolve(null),
    Promise.all(
      otherLocales.map(async (l) => ({ locale: l, slug: await getTranslationSlug(post.translationId, l) }))
    ),
  ]);

  const ref = videoRefFrom(post.videoPlatform, post.videoExternalId);
  const tone = post.topic ? TOPIC_TONE[post.topic] : null;
  const source =
    post.videoSource === "own"
      ? t("sourceOwn")
      : post.videoSource === "curated"
        ? post.channelName
          ? t("sourceCuratedBy", { channel: post.channelName })
          : t("sourceCurated")
        : null;

  return (
    <article className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/video"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToVideos")}
        </Link>

        {ref && (
          <>
            {/* Built only from the validated (platform, id); see videoFacadeHtml. */}
            <div className="chip-prose mt-6" dangerouslySetInnerHTML={{ __html: videoFacadeHtml(ref, locale as Locale) }} />
            <VideoFacades />
          </>
        )}

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {source && <span className="rounded-full bg-surface-muted px-3 py-1 text-text-nav">{source}</span>}
            {post.difficulty && (
              <span className="rounded-full border border-border px-3 py-1 text-text-muted">
                {tDifficulty(post.difficulty)}
              </span>
            )}
            {post.topic && tone && (
              <span className="rounded-full px-3 py-1" style={{ background: tone.soft, color: tone.text }}>
                {tTopics(`${post.topic}.title`)}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-balance text-[28px] font-extrabold leading-[1.15] tracking-[-0.03em] text-text md:text-[38px]">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {tForum("publishedOn", {
                  date: format.dateTime(new Date(post.publishedAt), { dateStyle: "long" }),
                })}
              </time>
            )}
            {alternates.map((alt) =>
              alt.slug ? (
                <Link
                  key={alt.locale}
                  href={{ pathname: "/video/[slug]", params: { slug: alt.slug } }}
                  locale={alt.locale}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:border-black/20 hover:text-accent"
                >
                  <Languages className="size-3.5" strokeWidth={2} />
                  {t(`switchTo.${alt.locale}`)}
                </Link>
              ) : null
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {lesson && (
              <Link
                href={{ pathname: "/bai-hoc/[topic]/[slug]", params: { topic: lesson.topic, slug: lesson.slug } }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
              >
                <BookOpen className="size-4" strokeWidth={2} />
                {t("relatedLesson")}
              </Link>
            )}
            {ref && (
              <a
                href={watchUrl(ref)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-text-nav transition-colors hover:border-black/20 hover:text-accent"
              >
                <ExternalLink className="size-4" strokeWidth={2} />
                {t("watchOn", { platform: PLATFORM_LABEL[ref.platform] })}
              </a>
            )}
          </div>
        </header>

        <div className="mt-10">
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        <CommentSection
          postId={post.id}
          slug={post.slug}
          section="/video/[slug]"
          comments={comments}
          count={commentCount}
          totalRoots={totalRoots}
          shownRoots={comments.length}
          maxRoots={MAX_ROOT_COMMENTS}
        />
      </div>
    </article>
  );
}
```

Ghi chú: `ArticleBody` cũng gắn `VideoFacades` nếu phần mô tả có video; hai listener cùng chạy không sao, vì listener nào xử lý trước gọi `preventDefault()` và listener kia bỏ qua sự kiện đã `defaultPrevented`.

- [ ] **Step 9: Tạo `src/app/[locale]/video/[slug]/opengraph-image.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { getVideoBySlug } from "@/lib/queries/posts";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/render";
import type { Locale } from "@/i18n/routing";

export const alt = "";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function VideoOpenGraphImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const [post, t] = await Promise.all([
    getVideoBySlug(params.locale as Locale, params.slug),
    getTranslations({ locale: params.locale, namespace: "videos" }),
  ]);

  return renderOgCard({
    eyebrow: t("title"),
    title: post?.title ?? t("notFound"),
  });
}
```

- [ ] **Step 10: Tạo `src/app/[locale]/video/[slug]/not-found.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** Rendered when a video slug does not resolve to a published video. */
export default async function VideoNotFound() {
  const t = await getTranslations("videos");

  return (
    <section className="px-5 py-24 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">404</p>
        <h1 className="mt-4 text-balance text-[26px] font-extrabold tracking-[-0.02em] text-text md:text-[34px]">
          {t("notFound")}
        </h1>

        <Link
          href="/video"
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToVideos")}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 11: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 276 test PASS.

- [ ] **Step 12: Xem nhanh bằng trình duyệt** (dữ liệu thử ở Task 9 Step 2)

1. `/vi/video/da3-seed-transistor-hoat-dong-the-nao`: facade có ảnh; bấm → player YouTube chạy, Console không có lỗi CSP. Nút "Xem bài học liên quan" mở đúng bài; "Xem trên YouTube" mở tab mới.
2. Link "Xem bản tiếng Anh" → `/en/videos/da3-seed-how-a-transistor-works`; nút EN trên navbar → `/en/videos`.
3. View source: `<link rel="canonical" href="…/vi/video/da3-seed-…">`, `hreflang="en"` trỏ `/en/videos/da3-seed-…`.
4. Gửi một bình luận → hiện sau khi làm mới.
5. `/vi/video/khong-co` → trang 404 riêng của video với link "Về trang Video".

- [ ] **Step 13: Commit**

```bash
git add src/lib/tiptap/video-embed.ts src/lib/tiptap/video-embed.test.ts src/components/forum/CommentSection.tsx src/components/layout/langSwitchPath.ts src/components/layout/langSwitchPath.test.ts "src/app/[locale]/video/[slug]/page.tsx" "src/app/[locale]/video/[slug]/opengraph-image.tsx" "src/app/[locale]/video/[slug]/not-found.tsx" src/messages/vi.json src/messages/en.json
git commit -m "feat(videos): video page with player, related lesson, watch link, comments and translations"
```

---

### Task 6: "Video liên quan" trên trang chi tiết bài học

**Files:**
- Modify: `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `listRelatedVideos` (Task 2), `VideoCard` với `compact` (Task 4).
- Produces: message `videos.related`; mục `<section aria-labelledby="related-videos">` chỉ render khi có ít nhất một video.

- [ ] **Step 1: Message** — trong `src/messages/vi.json`, thay:

```json
      "en": "Xem bản tiếng Anh"
    }
  },
```

bằng:

```json
      "en": "Xem bản tiếng Anh"
    },
    "related": "Video liên quan"
  },
```

và trong `src/messages/en.json`, thay:

```json
      "en": "Watch in English"
    }
  },
```

bằng:

```json
      "en": "Watch in English"
    },
    "related": "Related videos"
  },
```

- [ ] **Step 2: Trang bài học** — trong `src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx`:

(a) sau dòng `import { UpdatedAt } from "@/components/forum/UpdatedAt";` thêm:

```ts
import { VideoCard } from "@/components/video/VideoCard";
```

(b) thay:

```ts
import { getPostBySlug, getTranslationSlug } from "@/lib/queries/posts";
```

bằng:

```ts
import { getPostBySlug, getTranslationSlug, listRelatedVideos } from "@/lib/queries/posts";
```

(c) thay:

```ts
  const tone = TOPIC_TONE[topicId];
```

(dòng trong `LessonArticlePage`, ngay sau `if (!post) notFound();`) bằng:

```ts
  const tone = TOPIC_TONE[topicId];
  const [relatedVideos, tVideos] = await Promise.all([
    listRelatedVideos(locale as Locale, post.translationId),
    getTranslations("videos"),
  ]);
```

(d) thay:

```tsx
        <div className="mt-10">
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>
```

bằng:

```tsx
        <div className="mt-10">
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        {relatedVideos.length > 0 && (
          <section aria-labelledby="related-videos" className="mt-16 border-t border-border pt-10">
            <h2 id="related-videos" className="text-lg font-bold tracking-[-0.01em] text-text">
              {tVideos("related")}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedVideos.map((video) => (
                <VideoCard key={video.id} post={video} compact />
              ))}
            </div>
          </section>
        )}
```

- [ ] **Step 3: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 276 test PASS.

- [ ] **Step 4: Xem nhanh** (dữ liệu thử ở Task 9 Step 2): `/vi/bai-hoc/nguyen-ly/da3-seed-transistor-la-gi` có mục "Video liên quan" với 2 thẻ nhỏ (V1, V2), sau nội dung bài; `/vi/bai-hoc/dinh-nghia/da3-seed-chat-ban-dan-la-gi` không có mục này (không video nào trỏ tới).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/bai-hoc/[topic]/[slug]/page.tsx" src/messages/vi.json src/messages/en.json
git commit -m "feat(lessons): list the videos that point at a lesson under it"
```

---

### Task 7: Menu con "Bài học" trên navbar

**Files:**
- Modify: `src/lib/constants.ts` (thêm `LESSON_SUBNAV` trước `TOPIC_IDS`)
- Create: `src/components/layout/LessonsMenu.tsx`
- Modify: `src/components/layout/Navbar.tsx`, `src/components/sections/VideoCarousel.tsx`
- Modify: `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `DURATION`, `EASE_STANDARD` (`@/components/motion`); route `/video` (Task 1).
- Produces:
  - `LESSON_SUBNAV: { key: "lessonsTheory" | "lessonsVideo"; href: StaticPathname }[]` = Lý thuyết → `/bai-hoc`, Video → `/video`.
  - `<LessonsMenu active={boolean} />` (client — chỗ JS thứ hai trong bốn chỗ được phép).
  - Message `nav.lessonsTheory`, `nav.lessonsVideo`.
  - `NAV_ITEMS` **không đổi** (JoinCta.tsx cũng đọc nó; "Bài học" vẫn là một mục).

- [ ] **Step 1: Hằng số** — trong `src/lib/constants.ts`, chèn ngay **trước** dòng `export const TOPIC_IDS = [`:

```ts
/** The two entries under "Lessons" in the navbar. */
export const LESSON_SUBNAV: {
  key: "lessonsTheory" | "lessonsVideo";
  href: StaticPathname;
}[] = [
  { key: "lessonsTheory", href: "/bai-hoc" },
  { key: "lessonsVideo", href: "/video" },
];

```

- [ ] **Step 2: Message** — trong `src/messages/vi.json`, thay:

```json
    "lessons": "Bài học",
    "forum": "Blog",
```

bằng:

```json
    "lessons": "Bài học",
    "lessonsTheory": "Lý thuyết",
    "lessonsVideo": "Video",
    "forum": "Blog",
```

và trong `src/messages/en.json`, thay:

```json
    "lessons": "Lessons",
    "forum": "Blog",
```

bằng:

```json
    "lessons": "Lessons",
    "lessonsTheory": "Theory",
    "lessonsVideo": "Videos",
    "forum": "Blog",
```

- [ ] **Step 3: Tạo `src/components/layout/LessonsMenu.tsx`**

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { DURATION, EASE_STANDARD } from "@/components/motion";
import { Link } from "@/i18n/navigation";
import { LESSON_SUBNAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * "Lessons" in the desktop bar: a disclosure button that opens Theory and
 * Video.
 *
 * A disclosure (button + list of links), not an ARIA `menu`: the entries are
 * ordinary links, reached with Tab. It opens on click or Enter/Space, on hover
 * with a mouse (the pointerType check keeps a tap from opening it on
 * pointerenter and then toggling it shut on click), and closes on Escape —
 * returning focus to the button — on a click outside, or when focus leaves it.
 */
export function LessonsMenu({ active }: { active: boolean }) {
  const t = useTranslations("nav");
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setOpen(false);
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors",
          active ? "bg-primary text-white" : "text-text-nav hover:bg-surface-muted hover:text-accent"
        )}
      >
        {t("lessons")}
        <ChevronDown
          aria-hidden
          strokeWidth={2.2}
          className={cn("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          // The top padding bridges the gap to the bar, so the pointer can
          // travel down to the list without leaving the hover area.
          <motion.div
            className="absolute left-0 top-full z-10 pt-2"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATION.fast, ease: EASE_STANDARD }}
          >
            <ul
              id={listId}
              className="min-w-[180px] rounded-2xl border border-border bg-surface p-1.5 shadow-float"
            >
              {LESSON_SUBNAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-text-nav transition-colors hover:bg-surface-muted hover:text-accent focus-visible:bg-surface-muted"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Navbar** — trong `src/components/layout/Navbar.tsx`:

(a) sau dòng `import { LangSwitch } from "@/components/layout/LangSwitch";` thêm:

```ts
import { LessonsMenu } from "@/components/layout/LessonsMenu";
```

(b) thay `import { NAV_ITEMS } from "@/lib/constants";` bằng:

```ts
import { LESSON_SUBNAV, NAV_ITEMS } from "@/lib/constants";
```

(c) trong **thanh desktop** (khối `{NAV_ITEMS.map((item) => {` đầu tiên, trong `<GlassPill>`), thay:

```tsx
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
```

bằng:

```tsx
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);

                  if (item.key === "lessons") {
                    return (
                      <LessonsMenu
                        key={item.key}
                        active={LESSON_SUBNAV.some((sub) => isActive(pathname, sub.href))}
                      />
                    );
                  }

                  return (
                    <Link
```

(d) trong **menu mobile**, thay trọn khối:

```tsx
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block border-b border-white/10 px-4 py-5 text-xl tracking-[-0.01em] transition-colors",
                      active ? "text-white" : "text-white/70"
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
```

bằng:

```tsx
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <div key={item.key} className="border-b border-white/10">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block px-4 py-5 text-xl tracking-[-0.01em] transition-colors",
                        active ? "text-white" : "text-white/70"
                      )}
                    >
                      {t(item.key)}
                    </Link>

                    {item.key === "lessons" && (
                      <ul className="-mt-2 pb-3 pl-8">
                        {LESSON_SUBNAV.map((sub) => {
                          const subActive = isActive(pathname, sub.href);
                          return (
                            <li key={sub.key}>
                              <Link
                                href={sub.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={subActive ? "page" : undefined}
                                className={cn(
                                  "flex min-h-11 items-center text-base transition-colors",
                                  subActive ? "text-white" : "text-white/70"
                                )}
                              >
                                {t(sub.key)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
```

Chữ `text-white/70` trên nền `bg-primary` (#0D0D0D) là màu sẵn có của menu mobile, tương phản ~9:1.

- [ ] **Step 5: CTA carousel video trang chủ** — trong `src/components/sections/VideoCarousel.tsx`, trong khối `<div className="mt-10 text-center">`, thay `              href="/bai-hoc"` bằng:

```tsx
              href="/video"
```

- [ ] **Step 6: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 276 test PASS.

- [ ] **Step 7: Xem nhanh bằng trình duyệt**

1. Desktop (≥ 1024 px): rê chuột vào "Bài học" → menu mở; rê xuống "Video" → menu vẫn mở; rời ra → đóng. Bấm "Bài học" → mở; bấm ra ngoài → đóng.
2. Chỉ bàn phím: Tab tới "Bài học" → Enter → `aria-expanded="true"` → Tab → "Lý thuyết" → Tab → "Video" → Tab → focus sang mục kế và menu đóng; mở lại → Esc → menu đóng, focus về nút "Bài học".
3. Ở `/vi/video` nút "Bài học" có nền đậm (đang ở trong mục này).
4. 375 px: mở menu mobile → dưới "Bài học" có "Lý thuyết" và "Video" thụt vào, mỗi dòng cao ≥ 44 px, bấm là đóng menu và chuyển trang.
5. DevTools bật `prefers-reduced-motion: reduce` → menu con hiện/ẩn không có chuyển động.

- [ ] **Step 8: Commit**

```bash
git add src/lib/constants.ts src/components/layout/LessonsMenu.tsx src/components/layout/Navbar.tsx src/components/sections/VideoCarousel.tsx src/messages/vi.json src/messages/en.json
git commit -m "feat(nav): open Theory and Video under Lessons with mouse, touch and keyboard"
```

---

### Task 8: Tìm kiếm — ô trên navbar và trang kết quả

**Files:**
- Create: `src/lib/search-query.ts`, `src/lib/search-query.test.ts`
- Create: `src/components/search/SearchForm.tsx`, `src/components/search/SearchBox.tsx`
- Create: `src/app/[locale]/tim-kiem/page.tsx`
- Modify: `src/components/layout/Navbar.tsx`, `src/messages/vi.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: `searchPosts(locale, query, kinds, limit)` (Task 2), `postHref` (Task 1), route `/tim-kiem` (Task 1), `SearchParams` (Task 1).
- Produces:
  - `MAX_QUERY_LENGTH = 100` · `parseSearchQuery(value: string | string[] | undefined): string`
  - `<SearchForm action label placeholder submitLabel defaultValue? inputRef? variant?="light" | "dark" />` (không hook — dùng được cả ở server lẫn client)
  - `<SearchBox className? />` (client — chỗ JS thứ ba trong bốn chỗ được phép)
  - Message `search.{title,description,label,placeholder,submit,open,close,prompt,resultsFor,noResults,groups.{lesson,video,forum},resultCount,resultCountCapped,showingFirst}`.

- [ ] **Step 1: Viết test thất bại** — tạo `src/lib/search-query.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH, parseSearchQuery } from "@/lib/search-query";

describe("parseSearchQuery", () => {
  it("is empty when nothing was typed", () => {
    expect(parseSearchQuery(undefined)).toBe("");
    expect(parseSearchQuery("   ")).toBe("");
    expect(parseSearchQuery([])).toBe("");
  });

  it("trims and folds whitespace, keeping accents", () => {
    expect(parseSearchQuery("  bán \n\t dẫn  ")).toBe("bán dẫn");
  });

  it("uses only the first of a repeated q", () => {
    expect(parseSearchQuery(["transistor", "chip"])).toBe("transistor");
  });

  it("cuts at 100 characters without splitting an emoji", () => {
    expect(MAX_QUERY_LENGTH).toBe(100);
    expect(parseSearchQuery("a".repeat(150))).toHaveLength(100);
    const cut = parseSearchQuery(`${"a".repeat(99)}🙂🙂`);
    expect(Array.from(cut)).toHaveLength(100);
    expect(cut.endsWith("🙂")).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npm test -- --maxWorkers=3 src/lib/search-query.test.ts`
Expected: FAIL `Failed to resolve import "@/lib/search-query"`.

- [ ] **Step 3: Tạo `src/lib/search-query.ts`**

```ts
/** Longest search the site sends to the database; search_posts cuts there too. */
export const MAX_QUERY_LENGTH = 100;

/**
 * Normalizes `?q=`: first value only, runs of whitespace folded to one space,
 * trimmed, and cut to MAX_QUERY_LENGTH characters. Cut by code point, not by
 * UTF-16 unit, so an emoji at the boundary is never split in half.
 */
export function parseSearchQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const folded = (raw ?? "").replace(/\s+/g, " ").trim();
  return Array.from(folded).slice(0, MAX_QUERY_LENGTH).join("").trim();
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test -- --maxWorkers=3 src/lib/search-query.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Message** — trong `src/messages/vi.json`, thay:

```json
    "related": "Video liên quan"
  },
```

bằng:

```json
    "related": "Video liên quan"
  },
  "search": {
    "title": "Tìm kiếm",
    "description": "Tìm trong bài học, video và blog của Project Chíp Chíp.",
    "label": "Tìm trên trang",
    "placeholder": "Ví dụ: bán dẫn, transistor…",
    "submit": "Tìm",
    "open": "Mở ô tìm kiếm",
    "close": "Đóng ô tìm kiếm",
    "prompt": "Gõ từ khoá để tìm trong bài học, video và blog. Có dấu hay không dấu đều được.",
    "resultsFor": "Kết quả cho “{query}”",
    "noResults": "Không tìm thấy kết quả nào cho “{query}”. Thử một từ khoá ngắn hơn nhé.",
    "groups": {
      "lesson": "Bài học",
      "video": "Video",
      "forum": "Blog"
    },
    "resultCount": "{count} kết quả",
    "resultCountCapped": "{count}+ kết quả",
    "showingFirst": "Đang hiện {shown} kết quả đầu tiên."
  },
```

và trong `src/messages/en.json`, thay:

```json
    "related": "Related videos"
  },
```

bằng:

```json
    "related": "Related videos"
  },
  "search": {
    "title": "Search",
    "description": "Search the lessons, videos and blog of Project Chíp Chíp.",
    "label": "Search the site",
    "placeholder": "e.g. semiconductor, transistor…",
    "submit": "Search",
    "open": "Open search",
    "close": "Close search",
    "prompt": "Type a keyword to search the lessons, videos and blog.",
    "resultsFor": "Results for “{query}”",
    "noResults": "Nothing found for “{query}”. Try a shorter keyword.",
    "groups": {
      "lesson": "Lessons",
      "video": "Videos",
      "forum": "Blog"
    },
    "resultCount": "{count, plural, one {# result} other {# results}}",
    "resultCountCapped": "{count}+ results",
    "showingFirst": "Showing the first {shown}."
  },
```

- [ ] **Step 6: Tạo `src/components/search/SearchForm.tsx`**

```tsx
import type { Ref } from "react";
import { Search } from "lucide-react";
import { MAX_QUERY_LENGTH } from "@/lib/search-query";
import { cn } from "@/lib/utils";

/**
 * The search form: a plain GET to the search page, so it works without
 * JavaScript. No hooks, so the navbar (client) and the search page (server)
 * both render it.
 */
export function SearchForm({
  action,
  label,
  placeholder,
  submitLabel,
  defaultValue = "",
  inputRef,
  variant = "light",
}: {
  action: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  defaultValue?: string;
  inputRef?: Ref<HTMLInputElement>;
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";

  return (
    <form method="get" action={action} role="search" className="flex items-center gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "h-11 w-full rounded-xl border px-3.5 text-base outline-none md:text-sm",
            dark
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-white/50"
              : "border-border bg-surface text-text placeholder:text-text-muted focus:border-black/40"
          )}
        />
      </label>
      <button
        type="submit"
        className={cn(
          "flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors",
          dark ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:bg-black/80"
        )}
      >
        <Search className="size-4" strokeWidth={2.2} aria-hidden />
        {submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Tạo `src/components/search/SearchBox.tsx`**

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SearchForm } from "@/components/search/SearchForm";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The magnifier in the desktop navbar. Pressing it reveals the search form
 * with the caret already in the field; Escape or a click outside closes it
 * and Escape hands focus back to the button. Below `lg` the form sits in the
 * mobile menu instead (see Navbar).
 */
export function SearchBox({ className }: { className?: string }) {
  const t = useTranslations("search");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        setOpen(false);
        buttonRef.current?.focus();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("close") : t("open")}
        className="flex size-11 cursor-pointer items-center justify-center rounded-full text-text-nav transition-colors hover:bg-surface-muted hover:text-accent"
      >
        {open ? (
          <X className="size-[18px]" strokeWidth={2} aria-hidden />
        ) : (
          <Search className="size-[18px]" strokeWidth={2} aria-hidden />
        )}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-10 mt-2 w-[min(380px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-surface p-2 shadow-float"
      >
        <SearchForm
          action={getPathname({ href: "/tim-kiem", locale })}
          label={t("label")}
          placeholder={t("placeholder")}
          submitLabel={t("submit")}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Tạo `src/app/[locale]/tim-kiem/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchForm } from "@/components/search/SearchForm";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SearchParams } from "@/lib/listing-params";
import { parseSearchQuery } from "@/lib/search-query";
import { postHref } from "@/lib/paths";
import { searchPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import type { PostKind, PostSummary } from "@/lib/types";

// Every query is different; nothing here is worth caching.
export const dynamic = "force-dynamic";

/** Rows asked of search_posts per group — also its own upper bound. */
const FETCH_LIMIT = 50;
/** Rows shown per group. */
const SHOWN = 10;
const GROUPS: PostKind[] = ["lesson", "video", "forum"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("title"),
    description: t("description"),
    // Result pages are thin and endless; keep them out of the index but let
    // crawlers follow the links on them.
    robots: { index: false, follow: true },
    alternates: localeAlternates("/tim-kiem", locale as Locale),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = parseSearchQuery(searchParams.q);
  const t = await getTranslations("search");

  // One request per group, so a group's count is not squeezed by the others.
  const groups = query
    ? await Promise.all(
        GROUPS.map(async (kind) => ({
          kind,
          // A row no page can serve (a lesson without a topic) is not a result.
          posts: (await searchPosts(locale as Locale, query, [kind], FETCH_LIMIT)).filter(
            (post) => postHref(post) !== null
          ),
        }))
      )
    : [];
  const found = groups.filter((group) => group.posts.length > 0);

  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
          {query ? t("resultsFor", { query }) : t("title")}
        </h1>

        <div className="mt-6">
          <SearchForm
            action={getPathname({ href: "/tim-kiem", locale: locale as Locale })}
            label={t("label")}
            placeholder={t("placeholder")}
            submitLabel={t("submit")}
            defaultValue={query}
          />
        </div>

        {!query ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
            {t("prompt")}
          </p>
        ) : found.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
            {t("noResults", { query })}
          </p>
        ) : (
          <div className="mt-10 flex flex-col gap-12">
            {found.map((group) => (
              <ResultGroup
                key={group.kind}
                kind={group.kind}
                posts={group.posts}
                title={t(`groups.${group.kind}`)}
                count={
                  group.posts.length >= FETCH_LIMIT
                    ? t("resultCountCapped", { count: FETCH_LIMIT })
                    : t("resultCount", { count: group.posts.length })
                }
                note={group.posts.length > SHOWN ? t("showingFirst", { shown: SHOWN }) : null}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ResultGroup({
  kind,
  posts,
  title,
  count,
  note,
}: {
  kind: PostKind;
  posts: PostSummary[];
  title: string;
  count: string;
  note: string | null;
}) {
  return (
    <section aria-labelledby={`results-${kind}`}>
      <h2 id={`results-${kind}`} className="flex items-baseline gap-3 text-lg font-bold tracking-[-0.01em] text-text">
        {title}
        <span className="text-sm font-medium text-text-muted">{count}</span>
      </h2>
      {note && <p className="mt-1 text-xs text-text-muted">{note}</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {posts.slice(0, SHOWN).map((post) => {
          const href = postHref(post);
          if (!href) return null;
          return (
            <li key={post.id}>
              <Link
                href={href}
                className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-black/20"
              >
                <span className="block text-base font-semibold leading-snug text-text">{post.title}</span>
                {post.excerpt && (
                  <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-text-muted">
                    {post.excerpt}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

`query` chỉ đi vào (1) RPC `search_posts` dạng tham số và (2) text React (`t("resultsFor", { query })`, `defaultValue`) — React thoát HTML, không có `dangerouslySetInnerHTML`.

- [ ] **Step 9: Navbar** — trong `src/components/layout/Navbar.tsx`:

(a) thay `import { useTranslations } from "next-intl";` bằng:

```ts
import { useLocale, useTranslations } from "next-intl";
```

(b) sau dòng `import { SocialLinks } from "@/components/layout/SocialLinks";` thêm:

```ts
import { SearchBox } from "@/components/search/SearchBox";
import { SearchForm } from "@/components/search/SearchForm";
```

(c) thay `import { Link, usePathname } from "@/i18n/navigation";` bằng:

```ts
import { Link, getPathname, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
```

(d) thay:

```ts
  const t = useTranslations("nav");
  const pathname = usePathname();
```

bằng:

```ts
  const t = useTranslations("nav");
  const tSearch = useTranslations("search");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
```

(e) thay:

```tsx
          <div className="flex items-center gap-3">
            <SocialLinks className="hidden md:flex" />
```

bằng:

```tsx
          <div className="flex items-center gap-3">
            <SearchBox className="hidden lg:block" />
            <SocialLinks className="hidden md:flex" />
```

(f) thay:

```tsx
            <nav className="mt-4 flex-1 px-3" aria-label={t("openMenu")}>
```

bằng (ô tìm kiếm của mobile nằm đầu menu; `overflow-y-auto` vì menu giờ dài hơn một màn hình điện thoại thấp):

```tsx
            <div className="mt-2 px-5">
              <SearchForm
                action={getPathname({ href: "/tim-kiem", locale })}
                label={tSearch("label")}
                placeholder={tSearch("placeholder")}
                submitLabel={tSearch("submit")}
                variant="dark"
              />
            </div>

            <nav className="mt-4 flex-1 overflow-y-auto px-3" aria-label={t("openMenu")}>
```

- [ ] **Step 10: Kiểm**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3`
Expected: 0 lỗi, `✔ No ESLint warnings or errors`, 280 test PASS.

- [ ] **Step 11: Xem nhanh bằng trình duyệt** (dữ liệu thử ở Task 9 Step 2)

1. Desktop: bấm kính lúp → ô hiện ra, con trỏ nằm sẵn trong ô; Esc → đóng, focus về nút kính lúp. Gõ `ban dan` + Enter → `/vi/tim-kiem?q=ban+dan`, nhóm "Bài học" có "Chất bán dẫn là gì?".
2. `/vi/tim-kiem?q=bán dẫn` ra cùng kết quả; `/en/search?q=transistor` ra nhóm "Lessons" và "Videos", số lượng kèm theo.
3. `/vi/tim-kiem` (không `q`) → lời nhắc; `/vi/tim-kiem?q=zzzzqq` → "Không tìm thấy…"; `/vi/tim-kiem?q=%F0%9F%99%82` → "Không tìm thấy…", không lỗi.
4. View source: `<meta name="robots" content="noindex, follow">`.
5. 375 px: mở menu → ô tìm kiếm ở đầu, gõ + Enter → trang kết quả.

- [ ] **Step 12: Commit**

```bash
git add src/lib/search-query.ts src/lib/search-query.test.ts src/components/search/SearchForm.tsx src/components/search/SearchBox.tsx "src/app/[locale]/tim-kiem/page.tsx" src/components/layout/Navbar.tsx src/messages/vi.json src/messages/en.json
git commit -m "feat(search): navbar search box and an accent-insensitive results page grouped by kind"
```

---

### Task 9: Nghiệm thu toàn bộ DA3 và README

**Files:**
- Modify: `README.md`
- Sửa chỗ hỏng nếu nghiệm thu phát hiện: mỗi lỗi một commit `fix:`, kèm test hồi quy nếu kiểm được bằng Vitest.
- Không tạo file trong repo cho dữ liệu thử: SQL dưới đây lưu ở `$TMPDIR`.

**Interfaces:**
- Consumes: mọi thứ ở Task 1–8.
- Produces: README mô tả route mới và cấu trúc thư mục; báo cáo nghiệm thu.

- [ ] **Step 1: Cổng cục bộ**

Run: `npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build`
Expected: tất cả xanh; 280 test (243 trước DA3). Build: bảng route có `/[locale]/video`, `/[locale]/video/[slug]`, `/[locale]/tim-kiem` và ba route `opengraph-image` mới (xem Global Constraints về build thoát giữa chừng trong sandbox).

- [ ] **Step 2: Nạp dữ liệu thử — CHỈ trên stack local** (`npx supabase start` đã chạy; **không** `db reset`). Kiểm đúng máy local trước:

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -A -c "select inet_server_addr();"`
Expected: `127.0.0.1` hoặc `172.x.x.x` (container Docker). Nếu lệnh kết nối tới bất kỳ host nào khác: dừng lại.

Lưu đoạn sau vào `$TMPDIR/da3-seed.sql` (idempotent: chạy lại không nhân đôi nhờ `on conflict (locale, slug) do nothing`; mọi slug bắt đầu bằng `da3-seed-`):

```sql
-- DA3 acceptance data. LOCAL STACK ONLY. Remove with the cleanup statement below.
-- 2 lessons and 3 videos, each in VI and EN; both platforms, both sources.
-- Dates and difficulties are chosen so that newest, oldest, easiest and
-- hardest each give a different order:
--   newest  V3, V2, V1   oldest  V1, V2, V3
--   easiest V2, V3, V1   hardest V1, V3, V2
-- Videos V1 and V2 point at lesson L2; nothing points at L1.
insert into public.posts
  (translation_id, locale, kind, topic, difficulty, title, slug, excerpt, content, plain_text,
   video_platform, video_external_id, video_source, channel_name, related_lesson_translation_id,
   status, published_at)
values
  -- L1: lesson, dinh-nghia, basic
  ('00000000-0000-4000-8000-0000000da301', 'vi', 'lesson', 'dinh-nghia', 'basic',
   'Chất bán dẫn là gì?', 'da3-seed-chat-ban-dan-la-gi',
   'Vì sao silicon vừa dẫn điện vừa cách điện.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Chất bán dẫn dẫn điện tốt hơn chất cách điện nhưng kém hơn kim loại."}]}]}',
   'Chất bán dẫn dẫn điện tốt hơn chất cách điện nhưng kém hơn kim loại.',
   null, null, null, null, null, 'published', now() - interval '6 days'),
  ('00000000-0000-4000-8000-0000000da301', 'en', 'lesson', 'dinh-nghia', 'basic',
   'What is a semiconductor?', 'da3-seed-what-is-a-semiconductor',
   'Why silicon both conducts and insulates.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"A semiconductor conducts better than an insulator but worse than a metal."}]}]}',
   'A semiconductor conducts better than an insulator but worse than a metal.',
   null, null, null, null, null, 'published', now() - interval '6 days'),
  -- L2: lesson, nguyen-ly, advanced
  ('00000000-0000-4000-8000-0000000da302', 'vi', 'lesson', 'nguyen-ly', 'advanced',
   'Transistor là gì?', 'da3-seed-transistor-la-gi',
   'Công tắc nhỏ nhất của mọi con chip.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Transistor là một công tắc điều khiển bằng điện áp."}]}]}',
   'Transistor là một công tắc điều khiển bằng điện áp.',
   null, null, null, null, null, 'published', now() - interval '5 days'),
  ('00000000-0000-4000-8000-0000000da302', 'en', 'lesson', 'nguyen-ly', 'advanced',
   'What is a transistor?', 'da3-seed-what-is-a-transistor',
   'The smallest switch in every chip.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"A transistor is a switch controlled by a voltage."}]}]}',
   'A transistor is a switch controlled by a voltage.',
   null, null, null, null, null, 'published', now() - interval '5 days'),
  -- V1: video, YouTube, own, advanced, nguyen-ly, related to L2
  ('00000000-0000-4000-8000-0000000da311', 'vi', 'video', 'nguyen-ly', 'advanced',
   'Transistor hoạt động thế nào?', 'da3-seed-transistor-hoat-dong-the-nao',
   'Video của Chíp Chíp về transistor.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Mô tả: transistor bật và tắt dòng điện."}]}]}',
   'Mô tả: transistor bật và tắt dòng điện.',
   'youtube', 'IcrBqCFLHIY', 'own', null, '00000000-0000-4000-8000-0000000da302',
   'published', now() - interval '4 days'),
  ('00000000-0000-4000-8000-0000000da311', 'en', 'video', 'nguyen-ly', 'advanced',
   'How does a transistor work?', 'da3-seed-how-a-transistor-works',
   'A Chíp Chíp video about transistors.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Description: a transistor switches a current on and off."}]}]}',
   'Description: a transistor switches a current on and off.',
   'youtube', 'IcrBqCFLHIY', 'own', null, '00000000-0000-4000-8000-0000000da302',
   'published', now() - interval '4 days'),
  -- V2: video, YouTube, curated, basic, ung-dung, related to L2
  ('00000000-0000-4000-8000-0000000da312', 'vi', 'video', 'ung-dung', 'basic',
   'Silicon: từ cát đến chip', 'da3-seed-silicon-tu-cat-den-chip',
   'Tuyển chọn: quy trình làm chip.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Mô tả: cát được tinh chế thành silicon rồi thành chip."}]}]}',
   'Mô tả: cát được tinh chế thành silicon rồi thành chip.',
   'youtube', 'IcrBqCFLHIY', 'curated', 'Branch Education', '00000000-0000-4000-8000-0000000da302',
   'published', now() - interval '3 days'),
  ('00000000-0000-4000-8000-0000000da312', 'en', 'video', 'ung-dung', 'basic',
   'Silicon: from sand to chip', 'da3-seed-silicon-from-sand-to-chip',
   'Curated: how chips are made.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Description: sand is refined into silicon, then into chips."}]}]}',
   'Description: sand is refined into silicon, then into chips.',
   'youtube', 'IcrBqCFLHIY', 'curated', 'Branch Education', '00000000-0000-4000-8000-0000000da302',
   'published', now() - interval '3 days'),
  -- V3: video, TikTok, curated, intermediate, ung-dung, no related lesson
  ('00000000-0000-4000-8000-0000000da313', 'vi', 'video', 'ung-dung', 'intermediate',
   'Con chip trong điện thoại', 'da3-seed-chip-trong-dien-thoai',
   'Tuyển chọn từ TikTok.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Mô tả: điện thoại có hàng tỉ transistor."}]}]}',
   'Mô tả: điện thoại có hàng tỉ transistor.',
   'tiktok', '7231338487075638570', 'curated', 'chipchip.demo', null,
   'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-0000000da313', 'en', 'video', 'ung-dung', 'intermediate',
   'The chip in your phone', 'da3-seed-the-chip-in-your-phone',
   'Curated from TikTok.',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Description: a phone holds billions of transistors."}]}]}',
   'Description: a phone holds billions of transistors.',
   'tiktok', '7231338487075638570', 'curated', 'chipchip.demo', null,
   'published', now() - interval '1 day')
on conflict (locale, slug) do nothing;
```

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f "$TMPDIR/da3-seed.sql"`
Expected: `INSERT 0 10` lần đầu, `INSERT 0 0` khi chạy lại.

Ghi chú dữ liệu: `IcrBqCFLHIY` là một video YouTube công khai về transistor, dùng cho cả hai video YouTube (hai dòng khác nhau, không có ràng buộc duy nhất trên ID). `7231338487075638570` là ID TikTok lấy từ test sẵn có — facade, CSP và việc thay bằng iframe kiểm được, nhưng player TikTok có thể báo "video không khả dụng"; muốn xem phát thật thì thay bằng ID một video TikTok công khai (đúng 8–25 chữ số) ở cả hai dòng V3.

Dọn dữ liệu thử sau khi nghiệm thu xong (bình luận thử bị xoá theo nhờ `on delete cascade`):

Run: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "delete from public.posts where slug like 'da3-seed-%';"`
Expected: `DELETE 10`.

- [ ] **Step 3: Chạy app**

Run: `NODE_ENV=development npx next dev -p 3000`

- [ ] **Step 4: Nghiệm thu bằng trình duyệt** — ba kích thước (375 × 812, 768 × 1024, 1440 × 900), cả `/vi/…` và `/en/…`; Console mở suốt buổi.

1. **Bài học** — `/vi/bai-hoc` và `/en/lessons`: cột chủ đề (Tất cả 2, Định nghĩa 1, Nguyên lý 1, hai chủ đề còn lại 0); lọc "Nâng cao" chỉ còn "Transistor là gì?"; bấm "Nguyên lý" giữ `?difficulty=advanced`; `/vi/bai-hoc/nguyen-ly?difficulty=advanced` có canonical `/vi/bai-hoc/nguyen-ly` và `hreflang="en"` → `/en/lessons/nguyen-ly`. Thu gọn cột ở 1440 px → tải lại → vẫn thu gọn; bật `prefers-reduced-motion` → co lại tức thì. 375 px: hàng chủ đề cuộn ngang, không có nút thu gọn. `/vi/bai-hoc?tab=video` → `/vi/video`.
2. **Video** — `/vi/video` và `/en/videos`: 3 thẻ; sắp xếp "Mới nhất" = V3, V2, V1; "Cũ nhất" = V1, V2, V3; "Dễ trước" = V2, V3, V1; "Khó trước" = V1, V3, V2. Lọc TikTok → 1 thẻ (khung xám, nhãn "Tuyển chọn · chipchip.demo"); "Của Chíp Chíp" → 1 thẻ (V1); "Ứng dụng" + "Cơ bản" → V2. Sao chép URL đang lọc, mở ở tab ẩn danh → cùng kết quả. "Xoá lọc" → `/vi/video`.
3. **Tham số lạ và trang vượt** — `/vi/video?page=40` và `/vi/bai-hoc?page=abc&difficulty=Advanced` → không lỗi; trang thứ nhất hiện "Trang này không có nội dung." kèm link "Về trang đầu"; trang thứ hai là danh sách đầy đủ, không lọc. Terminal chạy `next dev` không có dòng `[listVideos]`.
4. **Trang video** — `/vi/video/da3-seed-transistor-hoat-dong-the-nao`: bấm facade → YouTube phát; "Xem bài học liên quan" → `/vi/bai-hoc/nguyen-ly/da3-seed-transistor-la-gi`; "Xem trên YouTube" → tab mới; link "Xem bản tiếng Anh" → `/en/videos/da3-seed-how-a-transistor-works`; nút EN trên navbar → `/en/videos`. Gửi một bình luận thử → hiện sau khi làm mới. `/vi/video/da3-seed-chip-trong-dien-thoai` (TikTok): facade dọc, bấm → iframe TikTok, không lỗi CSP; không có nút bài học liên quan.
5. **Menu con và ô tìm kiếm bằng bàn phím** (1440 px): Tab tới "Bài học" → Enter mở → Tab "Lý thuyết" → Tab "Video" → Tab rời menu → menu đóng. Mở lại → Esc → focus về "Bài học". Tab tới kính lúp → Enter → con trỏ trong ô → Esc → focus về kính lúp. Rê chuột mở menu con; ở 768 px (menu mobile) có "Lý thuyết"/"Video" thụt vào và ô tìm kiếm ở đầu.
6. **Liên kết hỏng không xuất hiện** — `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "update public.posts set status='draft', published_at=null where translation_id='00000000-0000-4000-8000-0000000da302';"` (gỡ đăng L2) → mở lại trang V1: không còn nút "Xem bài học liên quan", không lỗi. Đăng lại: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "update public.posts set status='published', published_at=now() - interval '5 days' where translation_id='00000000-0000-4000-8000-0000000da302';"`.
7. **Video liên quan** — `/vi/bai-hoc/nguyen-ly/da3-seed-transistor-la-gi` có "Video liên quan" với V1, V2 sau nội dung bài; `/vi/bai-hoc/dinh-nghia/da3-seed-chat-ban-dan-la-gi` không có mục này.
8. **Tìm kiếm** — `/vi/tim-kiem?q=ban dan` và `?q=bán dẫn` cùng ra "Chất bán dẫn là gì?"; `?q=transistor` ra nhóm Bài học (1) và Video (2, V1 + V3 nhờ mô tả); `/en/search?q=transistor` tương tự bằng tiếng Anh; `?q=` rỗng → lời nhắc; `?q=%26%7C!` → "Không tìm thấy…". View source có `noindex, follow`.
9. **Sitemap** — `/sitemap.xml` có `/vi/video`, `/en/videos`, `/vi/video/da3-seed-…` và `/en/videos/da3-seed-…`, không có `/tim-kiem`.
10. **Trang chủ** — nút "Khám phá thêm" dưới carousel video → `/vi/video`; mục "Từ Blog" không đổi.
11. **Console** — không có lỗi JavaScript, lỗi hydration hay vi phạm CSP ở mọi trang trên.

- [ ] **Step 5: Cập nhật `README.md`**

(a) Trong khối cấu trúc, thay:

```
│   │   ├── bai-hoc/               Bài học → [topic] → [slug]
│   │   ├── blog/                  Blog → [slug]
│   │   └── gioi-thieu/            Giới thiệu
```

bằng:

```
│   │   ├── bai-hoc/               Bài học → [topic] → [slug]
│   │   ├── video/                 Video → [slug]
│   │   ├── tim-kiem/              Kết quả tìm kiếm (noindex)
│   │   ├── blog/                  Blog → [slug]
│   │   └── gioi-thieu/            Giới thiệu
```

và thay:

```
│   ├── forum/             PostCard, ArticleBody, CommentSection
```

bằng:

```
│   ├── forum/             PostCard, ArticleBody, CommentSection
│   ├── lessons/           LessonsListing, TopicSidebar (trang Bài học + chủ đề)
│   ├── video/             VideoCard, VideoFilters
│   ├── listing/           FilterPills, Pagination (dùng chung)
│   ├── search/            SearchForm, SearchBox
```

và thay:

```
│   ├── post-slug.ts · seo.ts · types.ts · utils.ts
```

bằng:

```
│   ├── paths.ts           # postHref: URL của mọi loại bài (thẻ, tìm kiếm, sitemap, cache)
│   ├── listing-params.ts · listing-order.ts · search-query.ts  # tham số URL, sắp xếp
│   ├── post-slug.ts · seo.ts · types.ts · utils.ts
```

(b) Trong bảng "Ngôn ngữ", thay:

```
| `/vi/blog`        | `/en/blog`     |
```

bằng:

```
| `/vi/video`       | `/en/videos`   |
| `/vi/tim-kiem`    | `/en/search`   |
| `/vi/blog`        | `/en/blog`     |
```

(c) Ngay sau đoạn `DA2 (công cụ viết bài) **không có migration mới**: …` thêm:

```markdown
DA3 (bài học, video, tìm kiếm) cũng **không có migration mới**. Tab `?tab=video` cũ của trang Bài học chuyển hẳn (308) sang `/vi/video`.
```

(d) Trong "Chưa làm", xoá hai dòng:

```
- Tab Video trong `/bai-hoc` mới là trạng thái "đang hoàn thiện" — chờ video
- Chưa có tìm kiếm
```

- [ ] **Step 6: Dọn dữ liệu thử** (lệnh cleanup ở Step 2) và dừng `next dev`.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: document the DA3 video and search routes and the new listing modules"
```

---

## Đối chiếu spec

| Spec | Task |
|---|---|
| §1 `/vi/bai-hoc`, `/en/lessons`: cột chủ đề, lọc độ khó, phân trang; `/bai-hoc/[topic]` dùng chung bố cục | 3 |
| §1 `/vi/video`, `/en/videos`: lưới, bộ lọc, sắp xếp; `/vi/video/[slug]`, `/en/videos/[slug]` đầy đủ | 4, 5 |
| §1 "Video liên quan" trên trang chi tiết bài học | 6 |
| §1 menu Bài học có menu con, dùng được bằng chuột, chạm, bàn phím | 7 |
| §1 ô tìm kiếm dẫn tới `/vi/tim-kiem?q=` / `/en/search?q=` | 8 |
| §1 sitemap, `PostCard`, link nội bộ đúng cho ba loại bài | 1 (`postHref`, sitemap, `PostCard`), 7 (CTA carousel) |
| §1 tsc/lint/vitest/build sạch; nghiệm thu 3 kích thước × 2 ngôn ngữ | mỗi task Step "Kiểm"; 9 |
| §2 route `/video`, `/video/[slug]`, `/tim-kiem`, slug không bản địa hoá | 1 |
| §2 `?tab=video` → `permanentRedirect` trong page | 3 (lệch: 308 — mục 1) |
| §3 `listLessons`, `listVideos` (12/trang, `sort` 4 kiểu, không độ khó xếp cuối), `getVideoBySlug`, `listRelatedVideos` (≤ 6), `getLessonByTranslation` | 2 |
| §3 `countLessonsByTopic` tái dùng cho cột chủ đề | 3 |
| §3 `parseListingParams`, danh sách trắng, `page` 1–500 | 1 |
| §3 `PostSummary` thêm `videoPlatform`, `videoExternalId`, `videoSource`, `channelName` | 1 |
| §4.1 hai cột ≥ lg, ~260 px, viên thuốc có số bài, thu gọn 0.45 s `EASE_STANDARD`, reduced-motion, `localStorage` + try/catch | 3 (lệch: mục 10) |
| §4.1 dải lọc độ khó giữ tham số khác, lưới, phân trang; mobile hàng cuộn ngang | 3 |
| §4.1 `/bai-hoc/[topic]` canonical chính nó | 3 (`generateMetadata`), 9 bước 4.1 |
| §4.1 "Video liên quan" sau nội dung, ẩn khi rỗng | 6 (lệch: mục 2) |
| §4.2 banner giữ chỗ trung tính | 4 |
| §4.2 bộ lọc nền tảng/nguồn/chủ đề/độ khó, sắp xếp, mọi thứ trên URL, "Xoá lọc" | 4 (lệch: mục 6) |
| §4.2 thẻ video: ảnh `i.ytimg.com` qua `next/image` + remotePatterns, khung TikTok, nhãn nguồn, độ khó, ngày | 4 |
| §4.2 trang video: facade + `VideoFacades` tái dùng, tiêu đề, nhãn, mô tả qua `ArticleBody`, "Xem bài học liên quan", "Xem trên YouTube/TikTok", bình luận, OG, canonical/alternates | 5 |
| §4.3 menu con `aria-expanded`, đóng khi bấm ngoài/Esc, hover với chuột; hai link thụt vào trên mobile | 7 |
| §4.4 kính lúp → form GET, autofocus, Esc; mobile trong menu | 8 |
| §4.4 trang tìm kiếm server, `searchPosts`, nhóm Bài học/Video/Blog ≤ 10 kèm số lượng, điền sẵn `q`, rỗng khi chưa gõ và khi không có kết quả, cắt 100 ký tự, `noindex, follow` | 8 (lệch: mục 4, 5) |
| §4.5 `postHref` dùng ở `PostCard`, tìm kiếm, sitemap, `revalidate-paths`; sitemap có video | 1, 8 |
| §4.5 `revalidate-paths` thêm danh sách và trang video | 1 |
| §4.5 `generateMetadata` + canonical/alternates cho trang mới; OG cho trang video và trang danh sách | 3, 4, 5, 8 |
| §5 chuỗi qua messages, tập khoá bằng nhau | 3–8 (test `keys-parity`) |
| §5 xám trung tính, AA, 44 px | 3–8 (`min-h-11`/`size-11`), 9 bước 4 |
| §5 chuyển động dùng token, tắt khi reduced-motion | 3 (`TopicSidebar`), 7 (`LessonsMenu`) |
| §5 JS client chỉ ở 4 chỗ | 3, 7, 8 (+ `VideoFacades` sẵn có); sắp xếp là form GET |
| §5 `revalidate = 3600` cho danh sách, tìm kiếm dynamic | 3, 4, 8 (lệch: mục 3) |
| §6 Vitest: `parseListingParams` (hợp lệ, lạ, ngoài khoảng, trùng) | 1 |
| §6 Vitest: `postHref` ba loại × hai ngôn ngữ | 1 (`paths.test.ts`) |
| §6 Vitest: thứ tự sắp xếp video (hàm dựng tham số tách riêng) | 2 (`listing-order.test.ts`) |
| §6 Vitest: `revalidatePostRows` cho video | 1 |
| §6 Vitest: sitemap có video | 1 (`sitemap-entries.test.ts`) |
| §6 không test gọi Supabase | tất cả test mới là thuần |
| §6 nghiệm thu trình duyệt: 2 bài học + 3 video, lọc/sắp xếp/URL chia sẻ, thu gọn, bàn phím, tìm có/không dấu, phát video, video liên quan, chuyển ngôn ngữ, không lỗi console/CSP | 9 |
| §7 rủi ro `remotePatterns` cho `i.ytimg.com` | 4 Step 5 |
| §7 rủi ro canonical giữa trang chủ đề và danh sách | 1 (`localizedPath` test), 3, 9 bước 4.1 |

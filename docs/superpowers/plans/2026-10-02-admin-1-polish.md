# Giai đoạn 1 — admin polish và bốn điểm khó chịu

**Mục tiêu:** dọn những chỗ gây khó chịu hằng ngày trong admin trước khi làm các tính năng lớn (giai đoạn 2–4).
Kế hoạch tổng thể: `~/.commandcode/plans/admin-hoan-thien-4-giai-doan.md`.

**Nhánh:** `feat/admin-1-polish` (tách từ `main` tại `dd00e2f`).

## Quyết định
- **D1:** phân trang danh sách bài làm bằng **RPC gộp nhóm** (một dòng mỗi `translation_id`) thay vì phân
  trang trên bảng `posts` thô — nếu không, một bài có thể bị chẻ đôi qua hai trang.
- **D2:** admin vẫn tiếng Việt cứng, không dùng next-intl (theo quyết định đã ghi trong tài liệu).
- **D3:** hộp thoại dùng chung (`Dialog.tsx`) thay `window.prompt`/`confirm`; `beforeunload` vẫn để trình
  duyệt lo (chỉ thay phần chặn link nội bộ).

## Việc
1. **Migration `20261002000000_admin_post_groups.sql`** — `admin_post_groups(p_search, p_limit, p_offset)`
   `security invoker` + tự kiểm `is_staff()` (raise `42501`), trả một dòng mỗi nhóm: `translation_id`,
   `post_id` (dòng VI, thiếu thì EN), `kind`, `topic`, `title`, `status`, `updated_at`, `vi_title`,
   `en_title`, `ready`, `total` (`count(*) over ()`). Tìm kiếm không dấu bằng `strpos(lower(f_unaccent(…)))`
   (không dùng `%`/`_` nên không phải escape). `ready` phải **khớp** `isTranslationGroupReady`
   (`src/lib/shared-fields.ts:170`): đủ hai locale, mỗi bản có tiêu đề và ≥ 1 block.
2. **`src/lib/admin-listing.ts`** (+ test) — hằng `ADMIN_PAGE_SIZE`, `parseAdminPage`, `adminPageCount`,
   `adminOffset`; dùng lại `pageWindow` và `firstParam` (`src/lib/listing-params.ts`). Tách `parsePageParam`
   trong `listing-params.ts` để hai nơi dùng chung một luật `?page=`.
3. **`src/components/admin/AdminPagination.tsx`** — bản admin của thanh phân trang (tiếng Việt, `next/link`,
   dùng `pageWindow`), không dùng bản công khai vì bản đó gắn `next-intl`.
4. **`/admin/bai-viet`**: ô tìm kiếm (`GET ?q=`) + phân trang (`?page=`), gọi RPC; giữ nguyên thẻ trạng thái,
   chip VI/EN và `PostRowActions`.
5. **`/admin/tin-nhan`**: `.range()` theo `?page=`, đếm riêng cho từng tab (không còn cap 200 ngầm), hiện số
   trên nhãn tab.
6. **Badge trên nav**: `(dashboard)/layout.tsx` đếm `messages{is_handled:false}` bằng
   `{ count: "exact", head: true }`, truyền xuống `AdminNav` (client) → badge + `aria-label`.
7. **Sửa revalidate bình luận**: `setCommentHidden`/`deleteComment` đọc `post_id` → lấy dòng `posts` → gọi
   `revalidatePostRows(postRowsFrom(rows))` để cả trang chi tiết blog/video được làm mới.
8. **`Dialog.tsx`**: `ConfirmDialog` + `PromptDialog` (`role="dialog"`, `aria-modal`, Esc, khoá tiêu điểm);
   thay ở `EditorToolbar` (link, video, người góp ý, công thức), `PostEditor` (ghi đè EN),
   `useUnsavedChangesWarning` (chặn link → hộp thoại → `router.push`), và dùng cho xác nhận xoá ở
   `PostRowActions` / `CommentActions` / `MessageActions`.
9. **Xác nhận trước khi bỏ đăng** (danh sách + trong editor).
10. **`(dashboard)/not-found.tsx`** — 404 riêng cho admin.
11. **Toolbar hết số magic**: `layout.tsx` đặt `--admin-header-h`, `EditorToolbar` dùng
    `top-[var(--admin-header-h)]`.
12. **Skeleton** `loading.tsx`: 5 thẻ → 6 cho khớp dashboard.

## Kiểm chứng
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build
npx supabase db reset && ./scripts/verify-security.sh
```
Kiểm bằng trình duyệt: tìm kiếm + phân trang danh sách bài (kể cả `?page=99`), phân trang hộp thư, badge
nav, hộp thoại thay prompt (chặn rời trang, ghi đè EN, chèn link/video), xác nhận bỏ đăng, 404 admin.

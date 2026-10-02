# Giai đoạn 2 — duyệt bình luận và lịch sử phiên bản

Kế hoạch tổng thể: `~/.commandcode/plans/admin-hoan-thien-4-giai-doan.md`. Nhánh: `feat/admin-2-duyet-va-phien-ban`.

## Quyết định
- **D1 — bình luận chờ duyệt.** Bình luận mới ở trạng thái `pending`, chỉ hiện công khai sau khi duyệt. Bình
  luận do nhân sự đang hoạt động viết thì vào thẳng `approved` (họ là chủ nhà, và đang trả lời công khai).
- **D2 — thay `is_hidden` bằng enum ba trạng thái** `pending` / `approved` / `hidden`, backfill dữ liệu cũ
  (`hidden` nếu đang ẩn, còn lại `approved`) nên không có bình luận nào đổi trạng thái hiển thị sau migration.
- **D3 — lịch sử phiên bản**: chụp ảnh bản cũ trước mỗi lần ghi (lưu, đăng, bỏ đăng, khôi phục), giữ **20 bản
  mỗi bài**, có xem trước và khôi phục. Không làm diff từng ký tự.

## Việc
1. **Migration** `20261002000100_comment_status_enum.sql` — tạo enum, để riêng một file vì Postgres không
   cho dùng giá trị enum mới trong cùng transaction.
2. **Migration** `20261002000200_comment_status.sql` — thêm cột `status` (mặc định `pending`), backfill,
   index `(status, created_at desc)`, viết lại policy công khai (`status = 'approved'`), **cập nhật grant
   cột** của `comments` (thêm `status`, bỏ `is_hidden`), rồi bỏ cột `is_hidden`.
3. **Migration** `20261002000300_post_revisions.sql` — bảng `post_revisions` (RLS: staff đọc + thêm, không
   sửa/xoá) và hàm `prune_post_revisions(post_id, keep)` `security definer`.
4. **App — bình luận**: `/api/comments` ghi `pending` (staff thì `approved`); `actions.ts` đổi
   `setCommentHidden` thành `setCommentStatus`; trang `/admin/comments` có tab **Chờ duyệt / Đã duyệt / Đang
   ẩn / Tất cả** + phân trang + đếm đúng + duyệt/bỏ duyệt/ẩn/xoá; query công khai đổi `.eq("is_hidden", false)`
   thành `.eq("status", "approved")`.
5. **Chuỗi công khai** (vi+en, qua `messages/`): thông báo sau khi gửi bình luận nói rõ đang chờ duyệt khi
   người gửi không phải nhân sự.
6. **Lịch sử phiên bản**: helper thuần `src/lib/revisions.ts` (+ test) cho phần mô tả/so sánh; `actions.ts`
   chụp ảnh trước khi ghi rồi gọi prune; tab "Lịch sử" trong `PostEditor` liệt kê 20 bản gần nhất (thời điểm,
   người lưu) kèm xem trước và **Khôi phục**.
7. **`verify-security.sh`**: sửa các chỗ dùng `is_hidden`, thêm kiểm tra — bình luận `pending` không đọc được
   bằng anon, người không phải nhân sự không đổi được trạng thái, và snapshot không đọc được bằng anon.

## Kiểm chứng
```bash
npm run typecheck && npm run lint && npm test -- --maxWorkers=3 && npm run build
npx supabase db reset && ./scripts/verify-security.sh
```
Trình duyệt: gửi bình luận bằng khách (không hiện công khai), duyệt rồi mới hiện; sửa bài rồi xem lại lịch sử
và khôi phục một bản cũ.

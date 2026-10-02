#!/usr/bin/env bash
#
# Replays the attacks that the 20260913000000_harden_access migration closes.
#
# These are database-level checks, so they need a running stack rather than a
# test runner. Point them at a local Supabase (`npx supabase start`) — never at
# production, since the script creates and deletes an account.
#
#   ./scripts/verify-security.sh
#   API_URL=http://127.0.0.1:54321 ANON_KEY=... DB_URL=... ./scripts/verify-security.sh
#
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:54321}"
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"

EMAIL="security-check-$$@example.test"
PASSWORD="Password123!$$"
failures=0

cleanup() {
  psql "$DB_URL" -q -c "delete from public.posts where slug like 'sec-%-$$%';" >/dev/null 2>&1 || true
  psql "$DB_URL" -q -c "delete from public.messages where name = 'sec-check-$$';" >/dev/null 2>&1 || true
  psql "$DB_URL" -q -c "delete from auth.users where email = '$EMAIL';" >/dev/null 2>&1 || true
}
trap cleanup EXIT

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  \033[32mPASS\033[0m  %s\n' "$label"
  else
    printf '  \033[31mFAIL\033[0m  %s (mong đợi %s, nhận %s)\n' "$label" "$expected" "$actual"
    failures=$((failures + 1))
  fi
}

echo "Đăng ký một tài khoản người lạ bằng anon key công khai…"
curl -fsS -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null

JWT=$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" |
  sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

auth=(-H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT")
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

# PostgREST answers a denied write with 403 and Storage with 400, both carrying
# the same Postgres message. Asserting on the message rather than the status
# keeps the check about the security property instead of the transport.
denied() {
  local body
  body=$(curl -s "$@")
  case "$body" in
    *"violates row-level security policy"*) echo "denied" ;;
    *) echo "allowed: $body" ;;
  esac
}

# Runs SQL as the superuser and reports exactly what Postgres did with it: the
# name of the CHECK constraint it rejected the statement for, "allowed" on
# success, or "other: <first error line>" for anything else — a dropped or
# renamed column included. Asserting on the constraint name (not just
# accepted/rejected) is what stops an unrelated failure from reading as the
# constraint still being in place.
sql_violation() {
  local out
  if out=$(psql "$DB_URL" -q -v ON_ERROR_STOP=1 -c "$1" 2>&1 1>/dev/null); then
    echo "allowed"
    return
  fi
  local constraint
  constraint=$(printf '%s\n' "$out" | sed -n 's/.*violates check constraint "\([^"]*\)".*/\1/p' | head -1)
  if [ -n "$constraint" ]; then
    echo "$constraint"
  else
    echo "other: $(printf '%s\n' "$out" | head -1)"
  fi
}

echo
echo "C1 — tài khoản mới không được là nhân sự"
active=$(psql "$DB_URL" -t -A -c \
  "select p.is_active from public.profiles p join auth.users u on u.id = p.id where u.email = '$EMAIL';")
check "profile tạo ra ở trạng thái chưa kích hoạt" "f" "$active"

tid=$(uuidgen | tr '[:upper:]' '[:lower:]')
new_post=$(printf '{"translation_id":"%s","locale":"vi","kind":"forum","title":"x","slug":"sec-check-%s"}' "$tid" "$$")
insert_result=$(denied -X POST "$API_URL/rest/v1/posts" "${auth[@]}" \
  -H 'Content-Type: application/json' -d "$new_post")
check "không INSERT được bài viết" "denied" "$insert_result"
publish_body=$(printf '{"p_translation_id":"%s"}' "$tid")
check "không gọi được publish_translation" "403" "$(status -X POST "$API_URL/rest/v1/rpc/publish_translation" \
  "${auth[@]}" -H 'Content-Type: application/json' -d "$publish_body")"
check "không upload được vào storage" "denied" "$(denied -X POST "$API_URL/storage/v1/object/post-images/sec-check-$$.txt" \
  "${auth[@]}" -H 'Content-Type: text/plain' --data 'x')"
# The admin post list is one RPC, so its staff fence is the only thing between
# a signed-in outsider and every draft in the table.
check "tài khoản chưa kích hoạt không gọi được admin_post_groups" "403" \
  "$(status -X POST "$API_URL/rest/v1/rpc/admin_post_groups" \
    "${auth[@]}" -H 'Content-Type: application/json' -d '{"p_limit":5,"p_offset":0}')"

drafts=$(curl -s "$API_URL/rest/v1/posts?select=id&status=eq.draft" "${auth[@]}")
check "không đọc được bài nháp" "[]" "$drafts"

echo
echo "C2 — email người bình luận không phải cột công khai"
anon_email=$(curl -s "$API_URL/rest/v1/comments?select=author_email&limit=1" -H "apikey: $ANON_KEY" |
  sed -n 's/.*"code":"\([^"]*\)".*/\1/p')
user_email=$(curl -s "$API_URL/rest/v1/comments?select=author_email&limit=1" "${auth[@]}" |
  sed -n 's/.*"code":"\([^"]*\)".*/\1/p')
check "anon bị từ chối đọc author_email" "42501" "$anon_email"
check "người đã đăng nhập bị từ chối đọc author_email" "42501" "$user_email"
check "các cột công khai vẫn đọc được" "200" \
  "$(status "$API_URL/rest/v1/comments?select=author_name,body&limit=1" -H "apikey: $ANON_KEY")"

echo
echo "H1 — chỉ service role được tiêu quota"
check "anon không gọi được consume_rate_limit" "401" \
  "$(status -X POST "$API_URL/rest/v1/rpc/consume_rate_limit" -H "apikey: $ANON_KEY" \
    -H 'Content-Type: application/json' \
    -d '{"p_scope":"comment","p_key":"x","p_limit":3,"p_window_minutes":10}')"

echo
echo "D1 — dữ liệu video phải hợp lệ"
check "không lưu được ID video dạng javascript:" "posts_video_external_id_format" "$(sql_violation \
  "insert into public.posts (locale, kind, slug, video_platform, video_external_id)
   values ('vi', 'video', 'sec-vid-$$', 'youtube', 'javascript:alert(1)');")"
check "không gắn trường video vào bài blog" "posts_video_fields_only_on_videos" "$(sql_violation \
  "insert into public.posts (locale, kind, slug, video_platform, video_external_id)
   values ('vi', 'forum', 'sec-vidf-$$', 'youtube', 'dQw4w9WgXcQ');")"
check "không gắn độ khó vào bài blog" "posts_difficulty_not_on_forum" "$(sql_violation \
  "insert into public.posts (locale, kind, slug, difficulty)
   values ('vi', 'forum', 'sec-diff-$$', 'basic');")"
check "không lưu được platform thiếu id video (hoặc ngược lại)" "posts_video_ref_pair" "$(sql_violation \
  "insert into public.posts (locale, kind, slug, video_platform)
   values ('vi', 'video', 'sec-vidref-$$', 'youtube');")"
check "tên kênh trên 120 ký tự bị chặn" "posts_channel_name_length" "$(sql_violation \
  "insert into public.posts (locale, kind, slug, channel_name)
   values ('vi', 'video', 'sec-vidchan-$$', repeat('x', 121));")"
check "không gắn tên kênh vào bài học" "posts_channel_name_only_on_videos" "$(sql_violation \
  "insert into public.posts (locale, kind, slug, topic, channel_name)
   values ('vi', 'lesson', 'sec-lesschan-$$', 'nguyen-ly', 'x');")"

echo
echo "S — tìm kiếm không dấu"
check "f_unaccent bỏ dấu cả chữ đ" "Duong ban dan" \
  "$(psql "$DB_URL" -t -A -c "select public.f_unaccent('Đường bán dẫn');")"

sp=$(uuidgen | tr '[:upper:]' '[:lower:]')
sd=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, title, slug, status, published_at) values
  ('$sp', 'vi', 'forum', 'Bán dẫn kiểm tra$$ đã đăng', 'sec-sp-$$', 'published', now()),
  ('$sd', 'vi', 'forum', 'Bán dẫn kiểm tra$$ bản nháp', 'sec-sd-$$', 'draft', null);"

search() {
  curl -s -X POST "$API_URL/rest/v1/rpc/search_posts" -H "apikey: $ANON_KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"p_query\":$1,\"p_locale\":\"vi\"}"
}
hits=$(search "\"ban dan kiem tra$$\"" | grep -o "sec-s[pd]-$$" | sort | tr '\n' ' ')
check "gõ không dấu tìm ra bài có dấu, không lộ bài nháp" "sec-sp-$$ " "$hits"
check "gõ dở từ cuối vẫn ra kết quả" "sec-sp-$$" \
  "$(search "\"kiem tra$$ da d\"" | grep -o "sec-sp-$$" | head -1)"
# Covers tsquery operators, both quote characters, and an emoji — all get
# stripped as non-alphanumeric, leaving no token to search on.
check "câu chỉ có ký tự cú pháp trả mảng rỗng" "[]" "$(search "\"&|!():*'\\\"🙂\"")"
long=$(printf 'a%.0s' $(seq 1 10000))
# The JSON body is built in a variable first: macOS's bash 3.2 mis-splits a
# literal {"a":"b","c":"d"} written straight inside an inline $(...) argument
# (it misreads the comma as a brace-expansion separator), sending two broken
# requests instead of one. Assigning it first avoids that.
long_body="{\"p_query\":\"$long\",\"p_locale\":\"vi\"}"
check "câu rất dài vẫn trả 200" "200" "$(status -X POST "$API_URL/rest/v1/rpc/search_posts" \
  -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' \
  -d "$long_body")"

echo
echo "M — hộp thư chỉ ban điều hành đọc được"
psql "$DB_URL" -q -c "insert into public.messages (kind, name, body, locale)
  values ('contact', 'sec-check-$$', 'x', 'vi');"
check "tin nhắn giả lập được tạo" "1" \
  "$(psql "$DB_URL" -t -A -c "select count(*) from public.messages where name = 'sec-check-$$';")"
msg='{"kind":"contact","name":"x","body":"x","locale":"vi"}'
check "anon không INSERT được tin nhắn" "denied" \
  "$(denied -X POST "$API_URL/rest/v1/messages" -H "apikey: $ANON_KEY" \
     -H 'Content-Type: application/json' -d "$msg")"
check "anon không đọc được tin nhắn" "[]" \
  "$(curl -s "$API_URL/rest/v1/messages?select=id" -H "apikey: $ANON_KEY")"
check "tài khoản chưa kích hoạt không đọc được tin nhắn" "[]" \
  "$(curl -s "$API_URL/rest/v1/messages?select=id" "${auth[@]}")"

echo
echo "U — cập nhật chỉ mục tìm kiếm không được tính là sửa bài"
# Inserts don't fire the update trigger, so the seeded value should stick
# without a follow-up UPDATE — verified separately while writing this check.
psql "$DB_URL" -q -c "insert into public.posts (locale, kind, slug, updated_at)
  values ('vi', 'forum', 'sec-upd-$$', '2020-01-01');"
psql "$DB_URL" -q -c "update public.posts set plain_text = 'x' where slug = 'sec-upd-$$';"
check "chỉ sửa plain_text thì updated_at không đổi" "2020-01-01" \
  "$(psql "$DB_URL" -t -A -c "select updated_at::date from public.posts where slug = 'sec-upd-$$';")"
psql "$DB_URL" -q -c "update public.posts set title = 'y' where slug = 'sec-upd-$$';"
# Compared in SQL rather than against a shell-side $(date +%Y-%m-%d): the
# shell runs in local time (UTC+7) while `updated_at::date` is UTC, so a run
# between 00:00 and 07:00 local time used to read yesterday's date on one
# side and today's on the other and fail for no real reason.
check "sửa tiêu đề vẫn cập nhật updated_at" "t" \
  "$(psql "$DB_URL" -t -A -c \
    "select updated_at > now() - interval '1 minute' from public.posts where slug = 'sec-upd-$$';")"

echo
echo "D2 — cổng đăng bài của nhóm dịch"
# Publishing needs an activated staff member; the throwaway account is promoted
# only here, after every check that needs it to be an outsider has run.
psql "$DB_URL" -q -c "update public.profiles set is_active = true
  where id = (select id from auth.users where email = '$EMAIL');"

# The M block only proved outsiders are denied, which a deny-all policy would
# also pass. Now that this account is staff, prove the allow side too: it can
# read the very message seeded in M (cleanup only runs at EXIT, so the row is
# still there).
check "nhân sự đọc được tin nhắn hộp thư" "[{\"name\":\"sec-check-$$\"}]" \
  "$(curl -s "$API_URL/rest/v1/messages?select=name&name=eq.sec-check-$$" "${auth[@]}")"

doc='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x"}]}]}'
publish_detail() {
  curl -s -X POST "$API_URL/rest/v1/rpc/publish_translation" "${auth[@]}" \
    -H 'Content-Type: application/json' -d "{\"p_translation_id\":\"$1\"}" |
    sed -n 's/.*"details":"\([^"]*\)".*/\1/p'
}

mis=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, topic, difficulty, title, slug, content) values
  ('$mis', 'vi', 'lesson', 'nguyen-ly', 'basic',    'x', 'sec-mis-$$-vi', '$doc'),
  ('$mis', 'en', 'lesson', 'nguyen-ly', 'advanced', 'x', 'sec-mis-$$-en', '$doc');"
check "hai bản lệch độ khó thì không đăng được" "translation_mismatch" "$(publish_detail "$mis")"

nod=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, topic, title, slug, content) values
  ('$nod', 'vi', 'lesson', 'nguyen-ly', 'x', 'sec-nod-$$-vi', '$doc'),
  ('$nod', 'en', 'lesson', 'nguyen-ly', 'x', 'sec-nod-$$-en', '$doc');"
check "bài học thiếu độ khó thì không đăng được" "difficulty_required" "$(publish_detail "$nod")"

vid=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, difficulty, title, slug, content) values
  ('$vid', 'vi', 'video', 'basic', 'x', 'sec-vid-$$-vi', '$doc'),
  ('$vid', 'en', 'video', 'basic', 'x', 'sec-vid-$$-en', '$doc');"
check "video thiếu đường dẫn thì không đăng được" "video_incomplete" "$(publish_detail "$vid")"

ok=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, topic, difficulty, title, slug, content) values
  ('$ok', 'vi', 'lesson', 'nguyen-ly', 'basic', 'x', 'sec-ok-$$-vi', '$doc'),
  ('$ok', 'en', 'lesson', 'nguyen-ly', 'basic', 'x', 'sec-ok-$$-en', '$doc');"
# publish_translation returns void, so PostgREST answers 204 with no body —
# publish_detail's ".details" grep never matches, and would misreport a real
# publish as a rejection. Assert on the HTTP status instead.
check "bài học hợp lệ thì đăng được" "204" "$(status -X POST "$API_URL/rest/v1/rpc/publish_translation" \
  "${auth[@]}" -H 'Content-Type: application/json' -d "{\"p_translation_id\":\"$ok\"}")"
check "cả hai bản chuyển sang published" "2" \
  "$(psql "$DB_URL" -t -A -c \
    "select count(*) from public.posts where translation_id = '$ok' and status = 'published';")"

echo
echo "D3 — danh sách bài của admin: đếm, tìm kiếm và cờ sẵn sàng"
# The list pages in the database, so its count doubles as the test that a page
# past the end still knows the real total, and its `ready` flag is what the
# admin's "Đăng" button trusts. If the two ever disagree, the button offers a
# publish the gate then refuses.
check "anon không gọi được admin_post_groups" "401" \
  "$(status -X POST "$API_URL/rest/v1/rpc/admin_post_groups" -H "apikey: $ANON_KEY" \
    -H 'Content-Type: application/json' -d '{"p_limit":5,"p_offset":0}')"

count_groups() {
  curl -s -X POST "$API_URL/rest/v1/rpc/admin_post_group_count" "${auth[@]}" \
    -H 'Content-Type: application/json' -d "{\"p_search\":$1}" | tr -d '[]"'
}
# One entry per object in the array, so the flag can be read off the group.
ready_for() {
  curl -s -X POST "$API_URL/rest/v1/rpc/admin_post_groups" "${auth[@]}" \
    -H 'Content-Type: application/json' \
    -d "{\"p_limit\":100,\"p_offset\":0}" |
    tr '}' '\n' | grep -F "\"$1\"" | sed -n 's/.*"ready":\([a-z]*\).*/\1/p' | head -1
}

check "đếm được nhóm theo slug" "1" "$(count_groups "\"sec-ok-$$\"")"
# A typed "%" is a character, not a wildcard: LIKE would have matched every row.
check "ký tự % không phải ký tự đại diện" "0" "$(count_groups '"%"')"
check "nhóm đủ hai bản thì sẵn sàng" "true" "$(ready_for "$ok")"

# A third, empty row in the group is enough for publish_translation to refuse —
# the list has to say so too, or the button lies.
extra=$(uuidgen | tr '[:upper:]' '[:lower:]')
psql "$DB_URL" -q -c "insert into public.posts
  (translation_id, locale, kind, topic, difficulty, title, slug, content) values
  ('$extra', 'vi', 'lesson', 'nguyen-ly', 'basic', 'x', 'sec-extra-$$-vi', '$doc'),
  ('$extra', 'en', 'lesson', 'nguyen-ly', 'basic', 'x', 'sec-extra-$$-en', '$doc'),
  ('$extra', 'en', 'lesson', 'nguyen-ly', 'basic', 'x', 'sec-extra-$$-en2', '{}');"
check "nhóm có bản thừa rỗng thì không sẵn sàng" "false" "$(ready_for "$extra")"
check "và publish_translation cũng từ chối" "translation_empty" "$(publish_detail "$extra")"

echo
if [ "$failures" -eq 0 ]; then
  printf '\033[32mTất cả kiểm tra đều đạt.\033[0m\n'
else
  printf '\033[31m%s kiểm tra thất bại.\033[0m\n' "$failures"
  exit 1
fi

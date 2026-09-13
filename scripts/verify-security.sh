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
if [ "$failures" -eq 0 ]; then
  printf '\033[32mTất cả kiểm tra đều đạt.\033[0m\n'
else
  printf '\033[31m%s kiểm tra thất bại.\033[0m\n' "$failures"
  exit 1
fi

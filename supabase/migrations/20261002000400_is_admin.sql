-- Project Chíp Chíp — admin-only staff management.
--
-- Every policy so far treats `admin` and `editor` the same: `is_staff()` checks
-- only `is_active`. Handing out access is the first thing that must not — an
-- editor may write articles, but only an admin may decide who else gets in.

/**
 * Whether the caller is an activated admin.
 *
 * SECURITY DEFINER for the same reason as `is_staff()`: a policy (or a
 * function) that reads `profiles` while RLS is on would recurse.
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and is_active
       and role = 'admin'
  );
$$;

/**
 * The staff list, with each member's email.
 *
 * Emails live in auth.users, which no PostgREST role can read at all; a definer
 * function is how the admin screen gets them without shipping the service-role
 * key anywhere near the list.
 */
create or replace function public.admin_list_staff()
returns table (
  id uuid,
  email text,
  display_name text,
  role public.staff_role,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not admin' using errcode = '42501';
  end if;

  return query
  select p.id, u.email::text, p.display_name, p.role, p.is_active, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
   order by p.is_active desc, lower(p.display_name), p.created_at;
end;
$$;

/**
 * Activates or deactivates a staff member, or changes their role.
 *
 * One guard matters: nobody changes their own row. That is what keeps at least
 * one active admin standing — the caller is an active admin (checked above),
 * so refusing to touch their own row means the site can never be left with
 * none. A separate "last admin" rule would therefore be unreachable: any
 * target that another admin may demote is, by definition, not the last one.
 *
 * The failure detail is a short code the admin screen maps to Vietnamese, in
 * the same style as the publish gate's 23514 details.
 */
create or replace function public.admin_set_staff(
  p_target uuid,
  p_is_active boolean,
  p_role public.staff_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not admin' using errcode = '42501';
  end if;

  if p_target = auth.uid() then
    raise exception 'cannot change your own access'
      using errcode = '23514', detail = 'self_change';
  end if;

  update public.profiles
     set is_active = p_is_active,
         role = p_role
   where id = p_target;

  if not found then
    raise exception 'staff member not found'
      using errcode = '23514', detail = 'not_found';
  end if;
end;
$$;

-- Functions are executable by PUBLIC by default; these are staff- (or admin-)
-- only. Each one also checks inside, because execute rights are not the check.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.admin_list_staff() from public, anon;
grant execute on function public.admin_list_staff() to authenticated;
revoke all on function public.admin_set_staff(uuid, boolean, public.staff_role) from public, anon;
grant execute on function public.admin_set_staff(uuid, boolean, public.staff_role) to authenticated;

comment on function public.admin_set_staff(uuid, boolean, public.staff_role) is
  'Activates/deactivates a staff member or changes their role. Raises 42501 for non-admins and 23514 (self_change / not_found / last_admin) for the guards.';

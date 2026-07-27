-- Email lookup for the PWA auth flow, mirroring the hub's anonymous "does this account exist?" lookup so
-- the identify → register-vs-signin flow works identically when the hub is down (Supabase = full backup).
--
-- SECURITY DEFINER so it can read auth.users; returns only what the hub's lookup already exposes
-- (existence + is_active + display name). Granted to anon because the identify step runs pre-login,
-- exactly like the hub endpoint.

create or replace function public.lookup_user_by_email(p_email text)
returns json
language sql
security definer
set search_path = auth, public
as $$
  select coalesce(
    (select json_build_object(
              'found', true,
              'is_active', coalesce((u.raw_user_meta_data ->> 'is_active')::boolean, false),
              'name', u.raw_user_meta_data ->> 'name')
       from auth.users u
      where lower(u.email) = lower(trim(p_email))
      limit 1),
    json_build_object('found', false, 'is_active', false, 'name', null)
  );
$$;

revoke all on function public.lookup_user_by_email(text) from public;
grant execute on function public.lookup_user_by_email(text) to anon, authenticated;

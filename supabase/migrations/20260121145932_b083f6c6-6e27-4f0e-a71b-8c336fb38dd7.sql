-- 1) Data hygiene: migrate legacy role 'referee' -> 'wasit'
update public.user_roles
set role = 'wasit'
where role = 'referee';

-- 2) Fix auth trigger: create minimal profile + set pending registration; DO NOT auto-assign a role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    kabupaten_kota_id,
    registration_status,
    requested_role,
    is_profile_complete,
    is_active
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    nullif(new.raw_user_meta_data->>'kabupaten_kota_id', '')::uuid,
    'pending',
    nullif(new.raw_user_meta_data->>'requested_role', ''),
    false,
    true
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    kabupaten_kota_id = coalesce(excluded.kabupaten_kota_id, profiles.kabupaten_kota_id),
    requested_role = coalesce(excluded.requested_role, profiles.requested_role);

  return new;
end;
$$;

-- 3) Security hardening: remove public read access to PII / secrets
-- Profiles: remove public policy
drop policy if exists "Public can view referee profiles" on public.profiles;

-- Referee cards: remove public SELECT-by-code (verification_code must never be readable)
drop policy if exists "Public can verify cards by code" on public.referee_cards;

-- 4) Public-safe endpoints

-- 4a) Public referees list (safe fields only)
create or replace function public.get_public_referees(
  _search text default null,
  _is_active boolean default true
)
returns table(
  id uuid,
  full_name text,
  profile_photo_url text,
  license_level text,
  afk_origin text,
  kabupaten_kota_name text,
  is_active boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.afk_origin,
    kk.name as kabupaten_kota_name,
    coalesce(p.is_active, true) as is_active
  from public.profiles p
  left join public.kabupaten_kota kk on p.kabupaten_kota_id = kk.id
  inner join public.user_roles ur on p.id = ur.user_id and ur.role = 'wasit'
  where
    p.deleted_at is null
    and p.registration_status = 'approved'
    and coalesce(p.is_profile_complete, false) = true
    and (_is_active is null or coalesce(p.is_active, true) = _is_active)
    and (_search is null or p.full_name ilike '%' || _search || '%')
  order by p.full_name;
$$;

-- 4b) Public referee detail (safe fields only)
create or replace function public.get_public_referee(
  _referee_id uuid
)
returns table(
  id uuid,
  full_name text,
  profile_photo_url text,
  license_level text,
  afk_origin text,
  kabupaten_kota_name text,
  is_active boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.afk_origin,
    kk.name as kabupaten_kota_name,
    coalesce(p.is_active, true) as is_active
  from public.profiles p
  left join public.kabupaten_kota kk on p.kabupaten_kota_id = kk.id
  inner join public.user_roles ur on p.id = ur.user_id and ur.role = 'wasit'
  where
    p.id = _referee_id
    and p.deleted_at is null
    and p.registration_status = 'approved'
    and coalesce(p.is_profile_complete, false) = true
  limit 1;
$$;

-- 4c) Public card verification (safe result; does logging + counters server-side)
create or replace function public.verify_referee_card(
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_card record;
  v_is_expired boolean := false;
  v_message text := null;
  v_valid boolean := true;
  v_payload jsonb;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valid', false, 'message', 'Kode verifikasi kosong');
  end if;

  select
    rc.id,
    rc.referee_id,
    rc.card_number,
    rc.issued_at,
    rc.expires_at,
    rc.status,
    rc.last_verified_at,
    rc.verification_count,
    rc.created_at,
    rc.updated_at,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.license_expiry,
    p.afk_origin,
    coalesce(p.is_active, true) as referee_is_active,
    kk.name as kabupaten_kota_name
  into v_card
  from public.referee_cards rc
  join public.profiles p on p.id = rc.referee_id
  left join public.kabupaten_kota kk on kk.id = p.kabupaten_kota_id
  where rc.verification_code = p_code
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Kartu tidak ditemukan');
  end if;

  -- status checks
  if v_card.status = 'revoked' then
    v_valid := false;
    v_message := 'Kartu ini telah dicabut';
  elsif v_card.status = 'suspended' then
    v_valid := false;
    v_message := 'Kartu ini sedang disuspend';
  elsif v_card.status = 'expired' then
    v_valid := false;
    v_message := 'Kartu ini sudah kadaluarsa';
  end if;

  -- expiry check
  if v_valid and v_card.expires_at is not null and v_card.expires_at < now() then
    v_valid := false;
    v_message := 'Kartu ini sudah kadaluarsa';
  end if;

  -- Always log the verification attempt (even if invalid)
  insert into public.card_verification_logs (card_id)
  values (v_card.id);

  -- Update counters regardless (still useful for monitoring), but keep it simple
  update public.referee_cards
  set
    verification_count = coalesce(v_card.verification_count, 0) + 1,
    last_verified_at = now(),
    updated_at = now()
  where id = v_card.id;

  v_payload := jsonb_build_object(
    'id', v_card.id,
    'referee_id', v_card.referee_id,
    'card_number', v_card.card_number,
    'issued_at', v_card.issued_at,
    'expires_at', v_card.expires_at,
    'status', v_card.status,
    'last_verified_at', v_card.last_verified_at,
    'verification_count', coalesce(v_card.verification_count, 0) + 1,
    'created_at', v_card.created_at,
    'updated_at', v_card.updated_at,
    'referee', jsonb_build_object(
      'id', v_card.referee_id,
      'full_name', v_card.full_name,
      'profile_photo_url', v_card.profile_photo_url,
      'license_level', v_card.license_level,
      'license_expiry', v_card.license_expiry,
      'afk_origin', v_card.afk_origin,
      'is_active', v_card.referee_is_active,
      'kabupaten_kota', jsonb_build_object('name', v_card.kabupaten_kota_name)
    )
  );

  return jsonb_build_object(
    'valid', v_valid,
    'message', v_message,
    'card', v_payload
  );
end;
$$;

-- Explicitly allow execution from client contexts
grant execute on function public.get_public_referees(text, boolean) to anon, authenticated;
grant execute on function public.get_public_referee(uuid) to anon, authenticated;
grant execute on function public.verify_referee_card(text) to anon, authenticated;

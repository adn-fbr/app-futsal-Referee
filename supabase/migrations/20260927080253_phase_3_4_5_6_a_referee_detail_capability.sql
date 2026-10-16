CREATE OR REPLACE FUNCTION public.get_referee_detail(p_referee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
	v_actor_id uuid := auth.uid();
	v_is_admin_provinsi boolean;
	v_is_admin_kab_kota boolean;
	v_is_wasit boolean;
	v_actor_scope_id uuid;
	v_target_kabupaten_kota_id uuid;
	v_target_provinsi_id uuid;
	v_detail jsonb;
BEGIN
	IF v_actor_id IS NULL THEN
		RAISE EXCEPTION USING errcode = 'P0001', message = 'UNAUTHORIZED_ACTOR';
	END IF;

	IF p_referee_id IS NULL THEN
		RAISE EXCEPTION USING errcode = 'P0001', message = 'INVALID_TARGET';
	END IF;

	SELECT
		EXISTS (
			SELECT 1
			FROM public.user_roles AS ur
			WHERE ur.user_id = v_actor_id
				AND ur.role = 'admin_provinsi'::public.app_role
		),
		EXISTS (
			SELECT 1
			FROM public.user_roles AS ur
			WHERE ur.user_id = v_actor_id
				AND ur.role = 'admin_kab_kota'::public.app_role
		),
		EXISTS (
			SELECT 1
			FROM public.user_roles AS ur
			WHERE ur.user_id = v_actor_id
				AND ur.role = 'wasit'::public.app_role
		)
	INTO v_is_admin_provinsi, v_is_admin_kab_kota, v_is_wasit;

	IF v_is_admin_provinsi THEN
		v_actor_scope_id := private.get_actor_provinsi_id();

		SELECT p.kabupaten_kota_id, kk.provinsi_id
			INTO v_target_kabupaten_kota_id, v_target_provinsi_id
		FROM public.profiles AS p
		LEFT JOIN public.kabupaten_kota AS kk
			ON kk.id = p.kabupaten_kota_id
		WHERE p.id = p_referee_id;

		IF NOT FOUND OR v_target_kabupaten_kota_id IS NULL
			OR v_target_provinsi_id IS DISTINCT FROM v_actor_scope_id THEN
			RAISE EXCEPTION USING errcode = 'P0001', message = 'FORBIDDEN_SCOPE';
		END IF;

		SELECT pg_catalog.jsonb_build_object(
			'id', p.id,
			'full_name', p.full_name,
			'kabupaten_kota_id', p.kabupaten_kota_id,
			'kabupaten_kota_name', kk.name,
			'provinsi_id', pr.id,
			'provinsi_name', pr.name,
			'afk_origin', p.afk_origin,
			'license_level', p.license_level,
			'license_expiry', p.license_expiry,
			'profile_photo_url', p.profile_photo_url,
			'is_active', p.is_active,
			'is_profile_complete', p.is_profile_complete,
			'created_at', p.created_at,
			'updated_at', p.updated_at,
			'email', p.email
		)
			INTO v_detail
		FROM public.profiles AS p
		LEFT JOIN public.kabupaten_kota AS kk
			ON kk.id = p.kabupaten_kota_id
		LEFT JOIN public.provinsi AS pr
			ON pr.id = kk.provinsi_id
		WHERE p.id = p_referee_id;

	ELSIF v_is_admin_kab_kota THEN
		v_actor_scope_id := private.get_actor_kabupaten_kota_id();

		SELECT p.kabupaten_kota_id, kk.provinsi_id
			INTO v_target_kabupaten_kota_id, v_target_provinsi_id
		FROM public.profiles AS p
		LEFT JOIN public.kabupaten_kota AS kk
			ON kk.id = p.kabupaten_kota_id
		WHERE p.id = p_referee_id;

		IF NOT FOUND OR v_target_kabupaten_kota_id IS DISTINCT FROM v_actor_scope_id THEN
			RAISE EXCEPTION USING errcode = 'P0001', message = 'FORBIDDEN_SCOPE';
		END IF;

		SELECT pg_catalog.jsonb_build_object(
			'id', p.id,
			'full_name', p.full_name,
			'kabupaten_kota_id', p.kabupaten_kota_id,
			'kabupaten_kota_name', kk.name,
			'provinsi_id', pr.id,
			'provinsi_name', pr.name,
			'afk_origin', p.afk_origin,
			'license_level', p.license_level,
			'license_expiry', p.license_expiry,
			'profile_photo_url', p.profile_photo_url,
			'is_active', p.is_active,
			'is_profile_complete', p.is_profile_complete,
			'created_at', p.created_at,
			'updated_at', p.updated_at,
			'email', p.email
		)
			INTO v_detail
		FROM public.profiles AS p
		LEFT JOIN public.kabupaten_kota AS kk
			ON kk.id = p.kabupaten_kota_id
		LEFT JOIN public.provinsi AS pr
			ON pr.id = kk.provinsi_id
		WHERE p.id = p_referee_id;

	ELSIF v_is_wasit THEN
		IF p_referee_id IS DISTINCT FROM v_actor_id THEN
			RAISE EXCEPTION USING errcode = 'P0001', message = 'FORBIDDEN';
		END IF;

		SELECT pg_catalog.jsonb_build_object(
			'id', p.id,
			'full_name', p.full_name,
			'birth_date', p.birth_date,
			'occupation', p.occupation,
			'kabupaten_kota_id', p.kabupaten_kota_id,
			'kabupaten_kota_name', kk.name,
			'provinsi_id', pr.id,
			'provinsi_name', pr.name,
			'afk_origin', p.afk_origin,
			'license_level', p.license_level,
			'license_expiry', p.license_expiry,
			'profile_photo_url', p.profile_photo_url,
			'is_active', p.is_active,
			'is_profile_complete', p.is_profile_complete,
			'registration_status', p.registration_status,
			'created_at', p.created_at,
			'updated_at', p.updated_at,
			'email', p.email,
			'whatsapp_number', rc.whatsapp_number
		)
			INTO v_detail
		FROM public.profiles AS p
		LEFT JOIN public.kabupaten_kota AS kk
			ON kk.id = p.kabupaten_kota_id
		LEFT JOIN public.provinsi AS pr
			ON pr.id = kk.provinsi_id
		LEFT JOIN public.referee_contacts AS rc
			ON rc.referee_id = p.id
		WHERE p.id = p_referee_id;

		IF NOT FOUND THEN
			RAISE EXCEPTION USING errcode = 'P0001', message = 'INVALID_TARGET';
		END IF;

	ELSE
		RAISE EXCEPTION USING errcode = 'P0001', message = 'FORBIDDEN';
	END IF;

	RETURN v_detail;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_referee_detail(uuid) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON FUNCTION public.get_referee_detail(uuid) FROM anon;
REVOKE ALL PRIVILEGES ON FUNCTION public.get_referee_detail(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_referee_detail(uuid) TO authenticated;

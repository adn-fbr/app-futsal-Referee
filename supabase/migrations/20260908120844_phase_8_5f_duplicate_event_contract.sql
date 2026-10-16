CREATE OR REPLACE FUNCTION public.check_duplicate_event(
	p_kota_id text,
	p_location text,
	p_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
	SELECT
		p_kota_id IS NOT NULL
		AND p_location IS NOT NULL
		AND p_name IS NOT NULL
		AND EXISTS (
			SELECT 1
			FROM public.events AS e
			WHERE e.kabupaten_kota_id::text = p_kota_id
				AND e.location = p_location
				AND e.name = p_name
		);
$$;

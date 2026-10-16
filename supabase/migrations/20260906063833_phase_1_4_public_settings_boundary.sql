-- Keep deployment credentials out of browser-readable configuration paths.
DROP POLICY IF EXISTS "Everyone can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone authenticated can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can view public settings" ON public.system_settings;

CREATE POLICY "Authenticated users can view public settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
	key NOT IN (
		'resend_api_key',
		'smtp_user',
		'smtp_password',
		'smtp_host',
		'smtp_port',
		'smtp_secure',
		'whatsapp_api_key'
	)
);

CREATE OR REPLACE VIEW public.public_system_settings
WITH (security_invoker = true)
AS
SELECT id, key, value, description, updated_by, created_at, updated_at
FROM public.system_settings
WHERE key NOT IN (
	'resend_api_key',
	'smtp_user',
	'smtp_password',
	'smtp_host',
	'smtp_port',
	'smtp_secure',
	'whatsapp_api_key'
);

GRANT SELECT ON public.public_system_settings TO authenticated;

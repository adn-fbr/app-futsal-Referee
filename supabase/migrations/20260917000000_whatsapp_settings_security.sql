CREATE TABLE IF NOT EXISTS public.private_whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'meta',
  api_base_url TEXT,
  api_key_ciphertext TEXT,
  sender_number TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.private_whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS private_whatsapp_settings_updated_at ON public.private_whatsapp_settings;
CREATE TRIGGER private_whatsapp_settings_updated_at
BEFORE UPDATE ON public.private_whatsapp_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admin Provinsi can manage WhatsApp secret"
ON public.private_whatsapp_settings
FOR ALL
USING (public.is_admin_provinsi(auth.uid()))
WITH CHECK (public.is_admin_provinsi(auth.uid()));

CREATE OR REPLACE VIEW public.public_whatsapp_settings
WITH (security_invoker = true)
AS
SELECT
  id,
  provider,
  api_base_url,
  sender_number,
  enabled,
  created_at,
  updated_at
FROM public.private_whatsapp_settings;

ALTER VIEW public.public_whatsapp_settings OWNER TO postgres;

CREATE POLICY "Admin Provinsi can read public WhatsApp settings"
ON public.public_whatsapp_settings
FOR SELECT
USING (public.is_admin_provinsi(auth.uid()));

GRANT SELECT ON public.public_whatsapp_settings TO authenticated;

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
  'whatsapp_api_key',
  'whatsapp_base_url',
  'whatsapp_sender_number',
  'whatsapp_provider',
  'whatsapp_enabled'
);

GRANT SELECT ON public.public_system_settings TO authenticated;

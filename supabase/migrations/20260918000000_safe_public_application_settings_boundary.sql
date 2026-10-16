-- Safe public settings boundary for non-production only.
-- This migration creates an explicit allowlist of public application settings
-- and keeps secret-bearing system settings out of the browser-facing contract.
-- SECURITY DESIGN:
-- - Existing public.set_updated_at() is reused and NOT replaced.
-- - No DROP/TRUNCATE/DELETE/CASCADE operations.
-- - Authenticated users receive SELECT only.
-- - Service role receives management privileges for the authorized server-side
--   Edge Function.
-- - Only the explicit 11-key public allowlist is copied from system_settings.
-- - No migration-history repair is performed here.

CREATE TABLE IF NOT EXISTS public.public_application_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER public_application_settings_updated_at
BEFORE UPDATE ON public.public_application_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.public_application_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'public_application_settings'
      AND policyname = 'authenticated users can read public application settings'
  ) THEN
    CREATE POLICY "authenticated users can read public application settings"
    ON public.public_application_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'public_application_settings'
      AND policyname = 'service role can manage public application settings'
  ) THEN
    CREATE POLICY "service role can manage public application settings"
    ON public.public_application_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT ON public.public_application_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.public_application_settings TO service_role;

INSERT INTO public.public_application_settings (key, value)
SELECT s.key, s.value
FROM public.system_settings s
WHERE s.key IN (
  'app_name',
  'organization_name',
  'organization_phone',
  'organization_address',
  'organization_email',
  'association_email',
  'sender_email_name',
  'sender_email_address',
  'email_provider',
  'max_event_referees',
  'honor_base_amount'
)
ON CONFLICT (key) DO NOTHING;

-- Explicitly keep secret-bearing and unknown settings out of the public contract.
-- Secret/private keys intentionally excluded:
-- 'resend_api_key', 'smtp_user', 'smtp_password', 'smtp_host', 'smtp_port',
-- 'smtp_secure', 'whatsapp_api_key', 'whatsapp_base_url', 'whatsapp_sender_number',
-- 'whatsapp_provider', 'whatsapp_enabled'.
-- The browser contract is typed to the allowlist above and never uses
-- generic system_settings.value for public reads or writes.

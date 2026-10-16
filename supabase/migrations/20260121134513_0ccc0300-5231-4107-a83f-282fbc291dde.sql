-- Create public table for auth event logging (including failed login attempts)
CREATE TABLE IF NOT EXISTS public.auth_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL,
  success boolean NOT NULL,
  user_id uuid NULL,
  identifier_hash text NULL,
  metadata jsonb NULL
);

ALTER TABLE public.auth_event_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can write minimal auth events (used for failed login attempts where no session exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'auth_event_logs'
      AND policyname = 'Anyone can insert auth event logs'
  ) THEN
    CREATE POLICY "Anyone can insert auth event logs"
    ON public.auth_event_logs
    FOR INSERT
    WITH CHECK (true);
  END IF;
END$$;

-- Only admins can read auth event logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'auth_event_logs'
      AND policyname = 'Admins can view auth event logs'
  ) THEN
    CREATE POLICY "Admins can view auth event logs"
    ON public.auth_event_logs
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END$$;

-- No updates/deletes
REVOKE UPDATE, DELETE ON public.auth_event_logs FROM anon, authenticated;
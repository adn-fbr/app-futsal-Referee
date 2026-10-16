-- Tighten overly-permissive INSERT policy for auth_event_logs
DROP POLICY IF EXISTS "Anyone can insert auth event logs" ON public.auth_event_logs;

CREATE POLICY "Public can insert auth event logs (restricted)"
ON public.auth_event_logs
FOR INSERT
WITH CHECK (
  -- only allow known event names
  event IN ('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_PASSWORD_RESET', 'AUTH_LOGIN_FAILED')
  AND success IN (true, false)
  AND (
    -- if user_id is provided, it must match the authenticated user
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR
    -- if user_id is NULL (e.g., failed login), require an identifier_hash
    (user_id IS NULL AND identifier_hash IS NOT NULL)
  )
);

-- Ensure admins select policy exists (idempotent)
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
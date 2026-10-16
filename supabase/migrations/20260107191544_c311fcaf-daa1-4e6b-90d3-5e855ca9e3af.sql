-- Drop and recreate the SELECT policy to ensure authenticated users can view events
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;

CREATE POLICY "Authenticated users can view events"
ON public.events
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can soft delete events" ON public.events;
DROP POLICY IF EXISTS "Admin provinsi can restore events" ON public.events;

-- Recreate update policy (for normal updates, not soft delete)
CREATE POLICY "Admins can update events" ON public.events
FOR UPDATE USING (
  deleted_at IS NULL 
  AND (
    is_admin_provinsi(auth.uid()) 
    OR (has_role(auth.uid(), 'admin_kab_kota'::app_role) 
        AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
    OR (has_role(auth.uid(), 'panitia'::app_role) 
        AND created_by = auth.uid() 
        AND status = 'DIAJUKAN')
  )
)
WITH CHECK (TRUE);

-- Policy for restore (only admin_provinsi can restore deleted events)
CREATE POLICY "Admin provinsi can restore events" ON public.events
FOR UPDATE USING (
  deleted_at IS NOT NULL 
  AND is_admin_provinsi(auth.uid())
)
WITH CHECK (
  is_admin_provinsi(auth.uid())
);
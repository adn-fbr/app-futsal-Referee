-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Authorized users can update events" ON public.events;
DROP POLICY IF EXISTS "Admin provinsi can restore events" ON public.events;

-- Policy for normal updates (editing event details, NOT soft-delete)
-- Panitia can only edit their own events while DIAJUKAN
CREATE POLICY "Users can update event details"
ON public.events
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL 
  AND (
    is_admin_provinsi(auth.uid()) 
    OR (has_role(auth.uid(), 'admin_kab_kota'::app_role) AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
    OR (has_role(auth.uid(), 'panitia'::app_role) AND created_by = auth.uid() AND status = 'DIAJUKAN')
  )
)
WITH CHECK (
  -- Allow the update if user is admin OR if deleted_at is being set (soft-delete)
  is_admin_provinsi(auth.uid()) 
  OR (has_role(auth.uid(), 'admin_kab_kota'::app_role) AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
  OR (has_role(auth.uid(), 'panitia'::app_role) AND created_by = auth.uid() AND status = 'DIAJUKAN')
  OR deleted_at IS NOT NULL  -- Allow soft-delete by anyone who passes USING
);

-- Policy for Admin Provinsi to restore soft-deleted events
CREATE POLICY "Admin provinsi can restore events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NOT NULL 
  AND is_admin_provinsi(auth.uid())
)
WITH CHECK (is_admin_provinsi(auth.uid()));
-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admin provinsi can restore events" ON public.events;

-- Create policy for normal updates (not soft-delete) - for authenticated users with proper roles
CREATE POLICY "Authorized users can update events"
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
  is_admin_provinsi(auth.uid()) 
  OR (has_role(auth.uid(), 'admin_kab_kota'::app_role) AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
  OR (has_role(auth.uid(), 'panitia'::app_role) AND created_by = auth.uid() AND status = 'DIAJUKAN')
);

-- Create policy for Admin Provinsi to restore soft-deleted events
CREATE POLICY "Admin provinsi can restore events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NOT NULL 
  AND is_admin_provinsi(auth.uid())
)
WITH CHECK (is_admin_provinsi(auth.uid()));
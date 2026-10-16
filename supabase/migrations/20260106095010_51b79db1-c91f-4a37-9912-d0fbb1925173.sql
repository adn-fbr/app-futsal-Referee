-- Drop and recreate UPDATE policies with proper WITH CHECK clauses

-- Drop existing update policies
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Recreate update policy with WITH CHECK
CREATE POLICY "Admins can update events" ON public.events
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_admin_provinsi(auth.uid()) 
    OR (has_role(auth.uid(), 'admin_kab_kota'::app_role) AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
    OR (has_role(auth.uid(), 'panitia'::app_role) AND created_by = auth.uid())
  )
)
WITH CHECK (
  deleted_at IS NULL AND (
    is_admin_provinsi(auth.uid()) 
    OR (has_role(auth.uid(), 'admin_kab_kota'::app_role) AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
    OR (has_role(auth.uid(), 'panitia'::app_role) AND created_by = auth.uid())
  )
);

-- Recreate soft delete policy (UPDATE to set deleted_at) with WITH CHECK
CREATE POLICY "Admins can soft delete events" ON public.events
FOR UPDATE USING (
  deleted_at IS NULL AND is_admin_provinsi(auth.uid())
)
WITH CHECK (
  is_admin_provinsi(auth.uid())
);
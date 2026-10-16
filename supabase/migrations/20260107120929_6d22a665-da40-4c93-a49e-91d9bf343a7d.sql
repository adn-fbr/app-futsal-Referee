-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Admin and panitia can create events" ON public.events;

-- Create new INSERT policy that allows admin_provinsi, admin_kab_kota, and panitia
CREATE POLICY "Admin and panitia can create events" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_admin_provinsi(auth.uid()) 
  OR has_role(auth.uid(), 'admin_kab_kota'::app_role) 
  OR has_role(auth.uid(), 'panitia'::app_role)
);
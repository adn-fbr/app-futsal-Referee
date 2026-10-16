-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Admins can view all pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Users can view their own pengurus record" ON public.pengurus;

-- Create security definer function for admin_kab_kota check
CREATE OR REPLACE FUNCTION public.is_admin_kab_kota(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_kab_kota'
  )
$$;

-- Create function to get user's kabupaten_kota_id
CREATE OR REPLACE FUNCTION public.get_user_kabupaten_kota_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kabupaten_kota_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Policy: Anyone authenticated can view all pengurus (for org chart display)
CREATE POLICY "Anyone authenticated can view pengurus"
ON public.pengurus
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Admin provinsi can manage all pengurus (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin provinsi can manage all pengurus"
ON public.pengurus
FOR ALL
USING (is_admin_provinsi(auth.uid()));

-- Policy: Admin kab_kota can manage pengurus in their own kabupaten
CREATE POLICY "Admin kab kota can manage own pengurus"
ON public.pengurus
FOR ALL
USING (
  is_admin_kab_kota(auth.uid()) 
  AND kabupaten_kota_id = get_user_kabupaten_kota_id(auth.uid())
  AND level = 'KAB_KOTA'
);
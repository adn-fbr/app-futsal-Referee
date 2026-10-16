-- =====================================================
-- FIX RLS POLICIES UNTUK TABEL EVENTS
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Create new policies with is_admin() function that checks admin_provinsi and admin_kab_kota
CREATE POLICY "Admins can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'panitia'::app_role));

CREATE POLICY "Admins can update events" ON public.events
FOR UPDATE TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'panitia'::app_role));

CREATE POLICY "Admins can delete events" ON public.events
FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- =====================================================
-- FIX RLS POLICIES UNTUK TABEL EVENT_ASSIGNMENTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.event_assignments;

CREATE POLICY "Admins can manage assignments" ON public.event_assignments
FOR ALL TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'panitia'::app_role));

CREATE POLICY "Admins can view all assignments" ON public.event_assignments
FOR SELECT TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'panitia'::app_role));

-- =====================================================
-- FIX RLS POLICIES UNTUK TABEL HONORS
-- =====================================================

DROP POLICY IF EXISTS "Admins can update all honors" ON public.honors;
DROP POLICY IF EXISTS "Admins can view all honors" ON public.honors;

CREATE POLICY "Admins can update all honors" ON public.honors
FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all honors" ON public.honors
FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- =====================================================
-- FIX RLS POLICIES UNTUK TABEL PROFILES
-- =====================================================

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- =====================================================
-- FIX RLS POLICIES UNTUK TABEL USER_ROLES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (is_admin(auth.uid()));
-- Phase 8.5G.2: scope assignment administration to the actor's canonical region.
-- Admin Provinsi remains provincial-wide; Admin Kab/Kota is limited to its profile region.
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.event_assignments;

CREATE POLICY "Admins can manage assignments"
ON public.event_assignments
FOR ALL
TO authenticated
USING (
	public.is_admin_provinsi(auth.uid())
	OR (
		public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role)
		AND EXISTS (
			SELECT 1
			FROM public.events AS scoped_event
			WHERE scoped_event.id = event_assignments.event_id
				AND scoped_event.kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid())
		)
	)
	OR public.has_role(auth.uid(), 'panitia'::public.app_role)
)
WITH CHECK (
	public.is_admin_provinsi(auth.uid())
	OR (
		public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role)
		AND EXISTS (
			SELECT 1
			FROM public.events AS scoped_event
			WHERE scoped_event.id = event_assignments.event_id
				AND scoped_event.kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid())
		)
	)
	OR public.has_role(auth.uid(), 'panitia'::public.app_role)
);

CREATE POLICY "Admins can view all assignments"
ON public.event_assignments
FOR SELECT
TO authenticated
USING (
	public.is_admin_provinsi(auth.uid())
	OR (
		public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role)
		AND EXISTS (
			SELECT 1
			FROM public.events AS scoped_event
			WHERE scoped_event.id = event_assignments.event_id
				AND scoped_event.kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid())
		)
	)
	OR event_assignments.referee_id = auth.uid()
);

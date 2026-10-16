-- Fix CHECK constraint untuk event_assignments agar include 'cancelled'
ALTER TABLE public.event_assignments 
DROP CONSTRAINT IF EXISTS event_assignments_status_check;

ALTER TABLE public.event_assignments 
ADD CONSTRAINT event_assignments_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'declined'::text, 'cancelled'::text, 'completed'::text]));

-- Drop existing policies untuk event_assignments yang perlu diperbaiki
DROP POLICY IF EXISTS "Admins can manage assignments on approved events" ON public.event_assignments;

-- Buat ulang policy admin yang lebih permissive untuk manage assignments
CREATE POLICY "Admins can manage assignments on approved events"
ON public.event_assignments
FOR ALL
USING (
  deleted_at IS NULL 
  AND is_admin(auth.uid())
)
WITH CHECK (
  is_admin(auth.uid())
);

-- Policy untuk referees update status mereka sendiri (confirm/decline/cancelled)
DROP POLICY IF EXISTS "Referees can update their own assignment status" ON public.event_assignments;

CREATE POLICY "Referees can update their own assignment status"
ON public.event_assignments
FOR UPDATE
USING (
  referee_id = auth.uid() 
  AND deleted_at IS NULL
)
WITH CHECK (
  referee_id = auth.uid() 
  AND status = ANY (ARRAY['confirmed'::text, 'declined'::text])
);
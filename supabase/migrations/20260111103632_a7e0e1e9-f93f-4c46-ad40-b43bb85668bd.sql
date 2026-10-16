-- =====================================================
-- FIX CHECK CONSTRAINT UNTUK STATUS EVENTS
-- =====================================================

-- Drop existing check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add new check constraint with Indonesian status values
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status = ANY (ARRAY['DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'SELESAI']));

-- Update default value to match new status values
ALTER TABLE public.events 
ALTER COLUMN status SET DEFAULT 'DIAJUKAN';
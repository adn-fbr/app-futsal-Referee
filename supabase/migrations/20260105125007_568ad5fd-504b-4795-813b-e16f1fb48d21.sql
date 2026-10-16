-- Add columns for tracking assignment cancellation by admin
ALTER TABLE public.event_assignments 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

-- Add index for cancelled_by for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_assignments_cancelled_by ON public.event_assignments(cancelled_by);

-- Comment for documentation
COMMENT ON COLUMN public.event_assignments.cancellation_reason IS 'Reason for cancellation when admin cancels a confirmed assignment';
COMMENT ON COLUMN public.event_assignments.cancelled_by IS 'User ID of admin who cancelled the assignment';
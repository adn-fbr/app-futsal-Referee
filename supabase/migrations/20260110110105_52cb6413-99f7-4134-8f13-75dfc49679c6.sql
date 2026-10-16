-- Drop existing constraint and add AUTO_COMPLETE to allowed actions
ALTER TABLE public.event_approvals DROP CONSTRAINT IF EXISTS event_approvals_action_check;

ALTER TABLE public.event_approvals ADD CONSTRAINT event_approvals_action_check 
CHECK (action IN ('SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE', 'AUTO_COMPLETE'));
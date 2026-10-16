-- Phase 1: Notification Domain Contract
-- TEST-only schema contract for referee contacts and assignment notification aggregates.
-- Scope intentionally limited to domain contract; no Edge Function orchestration or live delivery logic.

CREATE TABLE IF NOT EXISTS public.referee_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_id UUID NOT NULL UNIQUE,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referee_contacts_referee_fk
    FOREIGN KEY (referee_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.assignment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped')),
  email_sent_at TIMESTAMPTZ,
  email_error_code TEXT,
  whatsapp_status TEXT NOT NULL DEFAULT 'pending' CHECK (whatsapp_status IN ('pending', 'sent', 'failed', 'skipped')),
  whatsapp_sent_at TIMESTAMPTZ,
  whatsapp_provider TEXT CHECK (whatsapp_provider IS NULL OR whatsapp_provider IN ('meta', 'kirisan')),
  whatsapp_request_id BIGINT,
  whatsapp_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assignment_notifications_assignment_fk
    FOREIGN KEY (assignment_id) REFERENCES public.event_assignments(id)
    ON DELETE CASCADE
);

ALTER TABLE public.referee_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_notifications ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS referee_contacts_updated_at ON public.referee_contacts;
CREATE TRIGGER referee_contacts_updated_at
BEFORE UPDATE ON public.referee_contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS assignment_notifications_updated_at ON public.assignment_notifications;
CREATE TRIGGER assignment_notifications_updated_at
BEFORE UPDATE ON public.assignment_notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON TABLE public.referee_contacts FROM anon, authenticated;
REVOKE ALL ON TABLE public.assignment_notifications FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_referee_contacts_referee_id
  ON public.referee_contacts(referee_id);

CREATE INDEX IF NOT EXISTS idx_assignment_notifications_assignment_id
  ON public.assignment_notifications(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_notifications_whatsapp_request_id
  ON public.assignment_notifications(whatsapp_request_id);

-- This phase intentionally avoids introducing match or fixture-specific operational columns.
-- The Kirisan contact label remains "Hubungi Koordinator Wasit" in the application contract layer.

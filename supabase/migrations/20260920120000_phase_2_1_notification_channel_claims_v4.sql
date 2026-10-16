-- Phase 2.1: notification_channel_claims v4
-- Review-only migration candidate for final correction.
-- Do not execute.
-- Do not deploy.
-- Do not modify production.
-- Do not repair migration history.

CREATE TABLE IF NOT EXISTS public.notification_channel_claims (
  assignment_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  claim_id UUID NOT NULL UNIQUE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, channel),
  CONSTRAINT notification_channel_claims_assignment_fk
    FOREIGN KEY (assignment_id)
    REFERENCES public.event_assignments(id)
    ON DELETE CASCADE,
  CONSTRAINT notification_channel_claims_expiry_chk
    CHECK (expires_at >= claimed_at)
);

ALTER TABLE public.notification_channel_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_channel_claims FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notification_channel_claims_updated_at
  ON public.notification_channel_claims;

CREATE TRIGGER notification_channel_claims_updated_at
BEFORE UPDATE ON public.notification_channel_claims
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.claim_notification_channel(
  p_assignment_id uuid,
  p_channel text,
  p_claim_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_status text;
  v_whatsapp_status text;
  v_has_valid_claim boolean := false;
  v_claimed text;
BEGIN
  IF p_assignment_id IS NULL THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  IF p_claim_id IS NULL THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  IF p_channel IS DISTINCT FROM 'email' AND p_channel IS DISTINCT FROM 'whatsapp' THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  SELECT email_status, whatsapp_status
    INTO v_email_status, v_whatsapp_status
  FROM public.assignment_notifications
  WHERE assignment_id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  IF p_channel = 'email' AND v_email_status IN ('sent', 'failed', 'skipped') THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  IF p_channel = 'whatsapp' AND v_whatsapp_status IN ('sent', 'failed', 'skipped') THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.notification_channel_claims c
    WHERE c.assignment_id = p_assignment_id
      AND c.channel = p_channel
      AND c.expires_at > now()
  )
  INTO v_has_valid_claim;

  IF v_has_valid_claim THEN
    RETURN 'NOT_CLAIMED';
  END IF;

  INSERT INTO public.notification_channel_claims (
    assignment_id,
    channel,
    claim_id,
    claimed_at,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    p_assignment_id,
    p_channel,
    p_claim_id,
    now(),
    now() + interval '5 minutes',
    now(),
    now()
  )
  ON CONFLICT (assignment_id, channel)
  DO UPDATE
    SET
      claim_id = EXCLUDED.claim_id,
      claimed_at = EXCLUDED.claimed_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
  WHERE public.notification_channel_claims.expires_at <= now()
  RETURNING 'CLAIMED'
  INTO v_claimed;

  IF v_claimed IS NOT NULL THEN
    RETURN v_claimed;
  END IF;

  RETURN 'NOT_CLAIMED';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_notification_channel(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_notification_channel(uuid, text, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_notification_channel(
  p_assignment_id uuid,
  p_channel text,
  p_claim_id uuid,
  p_status text,
  p_provider text DEFAULT NULL,
  p_request_id bigint DEFAULT NULL,
  p_error_code text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_affected integer := 0;
BEGIN
  IF p_assignment_id IS NULL THEN
    RETURN 0;
  END IF;

  IF p_claim_id IS NULL THEN
    RETURN 0;
  END IF;

  IF p_channel IS DISTINCT FROM 'email' AND p_channel IS DISTINCT FROM 'whatsapp' THEN
    RETURN 0;
  END IF;

  IF p_status NOT IN ('sent', 'failed') THEN
    RETURN 0;
  END IF;

  IF p_channel = 'whatsapp' AND p_provider IS NOT NULL AND p_provider NOT IN ('meta', 'kirisan') THEN
    RETURN 0;
  END IF;

  IF p_channel = 'email' THEN
    UPDATE public.assignment_notifications n
    SET
      email_status = p_status,
      email_sent_at = CASE WHEN p_status = 'sent' THEN now() ELSE n.email_sent_at END,
      email_error_code = CASE
        WHEN p_status = 'failed' THEN COALESCE(p_error_code, 'provider_failed')
        ELSE NULL
      END,
      updated_at = now()
    FROM public.notification_channel_claims c
    WHERE n.assignment_id = p_assignment_id
      AND c.assignment_id = p_assignment_id
      AND c.channel = p_channel
      AND c.claim_id = p_claim_id
      AND n.email_status = 'pending';

    GET DIAGNOSTICS v_affected = ROW_COUNT;
  ELSE
    UPDATE public.assignment_notifications n
    SET
      whatsapp_status = p_status,
      whatsapp_provider = p_provider,
      whatsapp_request_id = p_request_id,
      whatsapp_sent_at = CASE WHEN p_status = 'sent' THEN now() ELSE n.whatsapp_sent_at END,
      whatsapp_error_code = CASE
        WHEN p_status = 'failed' THEN COALESCE(p_error_code, 'provider_failed')
        ELSE NULL
      END,
      updated_at = now()
    FROM public.notification_channel_claims c
    WHERE n.assignment_id = p_assignment_id
      AND c.assignment_id = p_assignment_id
      AND c.channel = p_channel
      AND c.claim_id = p_claim_id
      AND n.whatsapp_status = 'pending';

    GET DIAGNOSTICS v_affected = ROW_COUNT;
  END IF;

  IF v_affected = 1 THEN
    DELETE FROM public.notification_channel_claims c
    WHERE c.assignment_id = p_assignment_id
      AND c.channel = p_channel
      AND c.claim_id = p_claim_id;
  END IF;

  RETURN v_affected;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_notification_channel(
  uuid, text, uuid, text, text, bigint, text
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.finalize_notification_channel(
  uuid, text, uuid, text, text, bigint, text
)
TO service_role;

-- PHASE: Event Completion Notifications
-- VERSION: TEST-ONLY Implementation Package v1.0
-- TARGET: TEST ONLY
-- SUPABASE PROJECT REF: shorsqyycpptxcutrqrb
-- PRODUCTION REF: xfscfjwapwnkiinkgbjg
-- EXECUTION: NOT EXECUTED BY THIS PACKAGE

BEGIN;

CREATE TABLE public.event_completion_notifications (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  event_id uuid NOT NULL,
  referee_id uuid NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  claim_id uuid,
  claimed_at timestamptz,
  expires_at timestamptz,
  provider text,
  provider_message_id text,
  provider_request_id text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  sent_at timestamptz,
  CONSTRAINT event_completion_notifications_identity_unique
    UNIQUE (event_id, referee_id, channel),
  CONSTRAINT event_completion_notifications_channel_check
    CHECK (channel IN ('email', 'whatsapp')),
  CONSTRAINT event_completion_notifications_status_check
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  CONSTRAINT event_completion_notifications_claim_pair_check
    CHECK (
      (claim_id IS NULL AND claimed_at IS NULL AND expires_at IS NULL)
      OR
      (claim_id IS NOT NULL AND claimed_at IS NOT NULL AND expires_at IS NOT NULL)
    ),
  CONSTRAINT event_completion_notifications_expiry_check
    CHECK (expires_at IS NULL OR expires_at >= claimed_at),
  CONSTRAINT event_completion_notifications_event_fk
    FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_completion_notifications_referee_fk
    FOREIGN KEY (referee_id) REFERENCES public.profiles(id)
);

CREATE UNIQUE INDEX event_completion_notifications_claim_id_unique
  ON public.event_completion_notifications(claim_id)
  WHERE claim_id IS NOT NULL;

CREATE INDEX event_completion_notifications_event_idx
  ON public.event_completion_notifications(event_id);

CREATE INDEX event_completion_notifications_wamid_idx
  ON public.event_completion_notifications(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX event_completion_notifications_expiry_idx
  ON public.event_completion_notifications(status, expires_at, channel);

ALTER TABLE public.event_completion_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.event_completion_notifications FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_event_completion_notification_intents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'DISETUJUI'
     OR NEW.status IS DISTINCT FROM 'SELESAI'
     OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.event_completion_notifications (
    event_id,
    referee_id,
    channel,
    status
  )
  SELECT
    NEW.id,
    eligible.referee_id,
    eligible.channel,
    eligible.status
  FROM (
    SELECT DISTINCT
      ea.referee_id,
      'email'::text AS channel,
      CASE
        WHEN NULLIF(pg_catalog.btrim(p.email), '') IS NULL THEN 'skipped'
        ELSE 'pending'
      END AS status
    FROM public.event_assignments ea
    JOIN public.profiles p ON p.id = ea.referee_id
    WHERE ea.event_id = NEW.id
      AND ea.status = 'confirmed'
      AND ea.deleted_at IS NULL

    UNION ALL

    SELECT DISTINCT
      ea.referee_id,
      'whatsapp'::text AS channel,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM public.referee_contacts rc
          WHERE rc.referee_id = ea.referee_id
            AND NULLIF(pg_catalog.btrim(rc.whatsapp_number), '') IS NOT NULL
        ) THEN 'pending'
        ELSE 'skipped'
      END AS status
    FROM public.event_assignments ea
    WHERE ea.event_id = NEW.id
      AND ea.status = 'confirmed'
      AND ea.deleted_at IS NULL
  ) AS eligible
  ON CONFLICT (event_id, referee_id, channel) DO NOTHING;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.create_event_completion_notification_intents()
  OWNER TO postgres;

CREATE TRIGGER event_completion_notification_intents_trigger
AFTER UPDATE OF status ON public.events
FOR EACH ROW
WHEN (OLD.status = 'DISETUJUI' AND NEW.status = 'SELESAI')
EXECUTE FUNCTION public.create_event_completion_notification_intents();

REVOKE ALL ON FUNCTION public.create_event_completion_notification_intents()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_event_completion_notification(
  p_event_id uuid,
  p_referee_id uuid,
  p_channel text
)
RETURNS SETOF public.event_completion_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claimed public.event_completion_notifications;
BEGIN
  IF p_event_id IS NULL OR p_referee_id IS NULL
     OR p_channel NOT IN ('email', 'whatsapp') THEN
    RETURN;
  END IF;

  UPDATE public.event_completion_notifications n
  SET
    claim_id = pg_catalog.gen_random_uuid(),
    claimed_at = pg_catalog.now(),
    expires_at = pg_catalog.now() + pg_catalog.make_interval(mins => 5),
    updated_at = pg_catalog.now()
  WHERE n.event_id = p_event_id
    AND n.referee_id = p_referee_id
    AND n.channel = p_channel
    AND n.status = 'pending'
    AND (n.claim_id IS NULL OR n.expires_at <= pg_catalog.now())
  RETURNING n.* INTO claimed;

  IF FOUND THEN
    RETURN NEXT claimed;
  END IF;

  RETURN;
END;
$$;

ALTER FUNCTION public.claim_event_completion_notification(uuid, uuid, text)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.claim_event_completion_notification(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_event_completion_notification(uuid, uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_event_completion_notification(
  p_event_id uuid,
  p_referee_id uuid,
  p_channel text,
  p_claim_id uuid,
  p_status text,
  p_provider text DEFAULT NULL,
  p_provider_message_id text DEFAULT NULL,
  p_provider_request_id text DEFAULT NULL,
  p_error_code text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected integer;
BEGIN
  IF p_event_id IS NULL OR p_referee_id IS NULL
     OR p_claim_id IS NULL
     OR p_channel NOT IN ('email', 'whatsapp')
     OR p_status NOT IN ('sent', 'failed', 'skipped') THEN
    RETURN 0;
  END IF;

  UPDATE public.event_completion_notifications n
  SET
    status = p_status,
    provider = p_provider,
    provider_message_id = p_provider_message_id,
    provider_request_id = p_provider_request_id,
    error_code = p_error_code,
    sent_at = CASE WHEN p_status = 'sent' THEN pg_catalog.now() ELSE n.sent_at END,
    claim_id = NULL,
    claimed_at = NULL,
    expires_at = NULL,
    updated_at = pg_catalog.now()
  WHERE n.event_id = p_event_id
    AND n.referee_id = p_referee_id
    AND n.channel = p_channel
    AND n.claim_id = p_claim_id
    AND n.status = 'pending';

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

ALTER FUNCTION public.finalize_event_completion_notification(
  uuid, uuid, text, uuid, text, text, text, text, text
) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.finalize_event_completion_notification(
  uuid, uuid, text, uuid, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_event_completion_notification(
  uuid, uuid, text, uuid, text, text, text, text, text
) TO service_role;

COMMIT;

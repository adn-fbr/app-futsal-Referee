CREATE TABLE public.message_delivery_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  environment text NOT NULL,
  event_type text NOT NULL,
  provider_request_id bigint NOT NULL,
  provider_send_id bigint NOT NULL,
  provider_message_id text,
  provider_status text NOT NULL,
  normalized_status text NOT NULL,
  processing_time_ms integer,
  payload_hash text NOT NULL,
  idempotency_key text NOT NULL,
  production boolean NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  CONSTRAINT message_delivery_ledger_provider_check
    CHECK (provider = 'kirisan'),
  CONSTRAINT message_delivery_ledger_environment_check
    CHECK (environment IN ('test', 'production')),
  CONSTRAINT message_delivery_ledger_event_type_check
    CHECK (event_type = 'send_status'),
  CONSTRAINT message_delivery_ledger_normalized_status_check
    CHECK (normalized_status IN ('sent', 'failed', 'unknown')),
  CONSTRAINT message_delivery_ledger_production_consistency_check
    CHECK (production = (environment = 'production')),
  CONSTRAINT message_delivery_ledger_request_idempotency_key
    UNIQUE (provider, environment, event_type, provider_request_id),
  CONSTRAINT message_delivery_ledger_idempotency_key_key
    UNIQUE (idempotency_key)
);

CREATE INDEX message_delivery_ledger_status_received_at_idx
  ON public.message_delivery_ledger (provider, environment, normalized_status, received_at DESC);

CREATE INDEX message_delivery_ledger_provider_request_id_idx
  ON public.message_delivery_ledger (provider_request_id);

ALTER TABLE public.message_delivery_ledger ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.message_delivery_ledger FROM anon, authenticated;

-- Official document issuance and verification contract.
-- The database remains the authoritative enforcement boundary for issuance,
-- integrity, revocation, and public validation.

CREATE TABLE IF NOT EXISTS public.issued_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number text NOT NULL UNIQUE,
  verification_token text NOT NULL UNIQUE,
  document_type text NOT NULL,
  source_entity_type text NOT NULL,
  source_entity_id uuid NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.issued_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_issued_documents_document_number
  ON public.issued_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_issued_documents_verification_token
  ON public.issued_documents(verification_token);
CREATE INDEX IF NOT EXISTS idx_issued_documents_document_type
  ON public.issued_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_issued_documents_status
  ON public.issued_documents(status);
CREATE INDEX IF NOT EXISTS idx_issued_documents_source_entity
  ON public.issued_documents(source_entity_type, source_entity_id);

DROP TRIGGER IF EXISTS update_issued_documents_updated_at ON public.issued_documents;
CREATE TRIGGER update_issued_documents_updated_at
BEFORE UPDATE ON public.issued_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_official_document_number(
  p_document_type text,
  p_year integer DEFAULT EXTRACT(year FROM now())::int
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_sequence bigint;
BEGIN
  v_prefix := upper(regexp_replace(COALESCE(p_document_type, 'DOCUMENT'), '[^a-zA-Z0-9]+', '-', 'g'));

  SELECT COALESCE(MAX(CAST(split_part(document_number, '-', 3) AS bigint)), 0) + 1
  INTO v_sequence
  FROM public.issued_documents
  WHERE document_number LIKE v_prefix || '-' || p_year || '-%';

  RETURN format('%s-%s-%s', v_prefix, p_year, LPAD(v_sequence::text, 6, '0'));
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_official_document(
  p_document_type text,
  p_source_entity_type text,
  p_source_entity_id uuid,
  p_snapshot jsonb DEFAULT '{}'::jsonb,
  p_content_hash text DEFAULT NULL,
  p_issued_by uuid DEFAULT NULL
)
RETURNS public.issued_documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := COALESCE(auth.uid(), p_issued_by);
  v_document public.issued_documents;
  v_document_number text;
  v_verification_token text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: authenticated user required';
  END IF;

  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: admin role required to issue official documents';
  END IF;

  IF NULLIF(trim(p_document_type), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_TYPE';
  END IF;

  IF p_source_entity_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_SOURCE_ENTITY_ID';
  END IF;

  IF p_content_hash IS NULL OR length(trim(p_content_hash)) = 0 THEN
    RAISE EXCEPTION 'INVALID_CONTENT_HASH';
  END IF;

  v_document_number := public.generate_official_document_number(p_document_type, EXTRACT(year FROM now())::int);
  v_verification_token := md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text);

  INSERT INTO public.issued_documents (
    document_number,
    verification_token,
    document_type,
    source_entity_type,
    source_entity_id,
    snapshot,
    content_hash,
    status,
    issued_by,
    issued_at
  ) VALUES (
    v_document_number,
    v_verification_token,
    trim(p_document_type),
    COALESCE(p_source_entity_type, 'unknown'),
    p_source_entity_id,
    COALESCE(p_snapshot, '{}'::jsonb),
    trim(p_content_hash),
    'issued',
    v_actor,
    now()
  )
  RETURNING * INTO v_document;

  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    actor_id,
    new_data,
    metadata
  ) VALUES (
    'issued_documents',
    v_document.id,
    'OFFICIAL_DOCUMENT_ISSUED',
    v_actor,
    jsonb_build_object(
      'document_number', v_document.document_number,
      'document_type', v_document.document_type,
      'status', v_document.status,
      'source_entity_type', v_document.source_entity_type,
      'source_entity_id', v_document.source_entity_id::text,
      'verification_token', v_document.verification_token
    ),
    jsonb_build_object(
      'content_hash', v_document.content_hash,
      'issued_at', v_document.issued_at
    )
  );

  RETURN v_document;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_official_document(
  p_verification_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document public.issued_documents;
BEGIN
  IF NULLIF(trim(p_verification_token), '') IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'not_found',
      'message', 'Dokumen tidak ditemukan.'
    );
  END IF;

  SELECT * INTO v_document
  FROM public.issued_documents
  WHERE verification_token = trim(p_verification_token)
  LIMIT 1;

  IF v_document.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'not_found',
      'message', 'Dokumen tidak ditemukan.'
    );
  END IF;

  IF v_document.status = 'revoked' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'revoked',
      'message', 'Dokumen telah dicabut.',
      'document', jsonb_build_object(
        'id', v_document.id,
        'document_number', v_document.document_number,
        'document_type', v_document.document_type,
        'issued_at', v_document.issued_at,
        'status', v_document.status,
        'content_hash', v_document.content_hash
      )
    );
  END IF;

  IF v_document.content_hash IS NULL OR length(trim(v_document.content_hash)) = 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'status', 'integrity_failed',
      'message', 'Integritas dokumen gagal diverifikasi.',
      'document', jsonb_build_object(
        'id', v_document.id,
        'document_number', v_document.document_number,
        'document_type', v_document.document_type,
        'issued_at', v_document.issued_at,
        'status', v_document.status,
        'content_hash', v_document.content_hash
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'status', 'issued',
    'message', 'Dokumen valid dan diterbitkan secara resmi.',
    'document', jsonb_build_object(
      'id', v_document.id,
      'document_number', v_document.document_number,
      'document_type', v_document.document_type,
      'issued_at', v_document.issued_at,
      'status', v_document.status,
      'content_hash', v_document.content_hash
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_official_document(
  p_verification_token text,
  p_reason text DEFAULT NULL
)
RETURNS public.issued_documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_document public.issued_documents;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: authenticated user required';
  END IF;

  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: admin role required to revoke official documents';
  END IF;

  SELECT * INTO v_document
  FROM public.issued_documents
  WHERE verification_token = trim(p_verification_token)
  FOR UPDATE;

  IF v_document.id IS NULL THEN
    RAISE EXCEPTION 'DOCUMENT_NOT_FOUND';
  END IF;

  UPDATE public.issued_documents
  SET status = 'revoked',
      revoked_by = v_actor,
      revoked_at = now(),
      revoked_reason = COALESCE(p_reason, 'Revoked by administrator'),
      updated_at = now()
  WHERE id = v_document.id
  RETURNING * INTO v_document;

  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    actor_id,
    old_data,
    new_data,
    metadata
  ) VALUES (
    'issued_documents',
    v_document.id,
    'OFFICIAL_DOCUMENT_REVOKED',
    v_actor,
    jsonb_build_object('status', 'issued'),
    jsonb_build_object('status', 'revoked', 'revoked_reason', v_document.revoked_reason),
    jsonb_build_object('verification_token', v_document.verification_token)
  );

  RETURN v_document;
END;
$$;

ALTER TABLE public.issued_documents OWNER TO postgres;
ALTER FUNCTION public.generate_official_document_number(text, integer) OWNER TO postgres;
ALTER FUNCTION public.issue_official_document(text, text, uuid, jsonb, text, uuid) OWNER TO postgres;
ALTER FUNCTION public.verify_official_document(text) OWNER TO postgres;
ALTER FUNCTION public.revoke_official_document(text, text) OWNER TO postgres;

REVOKE ALL ON TABLE public.issued_documents FROM public;
REVOKE ALL ON FUNCTION public.generate_official_document_number(text, integer) FROM public;
REVOKE ALL ON FUNCTION public.issue_official_document(text, text, uuid, jsonb, text, uuid) FROM public;
REVOKE ALL ON FUNCTION public.verify_official_document(text) FROM public;
REVOKE ALL ON FUNCTION public.revoke_official_document(text, text) FROM public;

GRANT SELECT ON TABLE public.issued_documents TO authenticated;
GRANT INSERT, UPDATE ON TABLE public.issued_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_official_document_number(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_official_document(text, text, uuid, jsonb, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_official_document(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_official_document(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_official_document(text, text) TO authenticated;

CREATE POLICY "Admins can manage issued documents"
ON public.issued_documents
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read issued documents"
ON public.issued_documents
FOR SELECT
USING (auth.uid() IS NOT NULL);

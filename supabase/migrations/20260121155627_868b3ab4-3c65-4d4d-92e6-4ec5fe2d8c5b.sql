-- Fix search_path for sync_card_expiry function
CREATE OR REPLACE FUNCTION sync_card_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if license_expiry actually changed
  IF OLD.license_expiry IS DISTINCT FROM NEW.license_expiry THEN
    UPDATE referee_cards
    SET expires_at = NEW.license_expiry,
        updated_at = now()
    WHERE referee_id = NEW.id
      AND status != 'revoked'; -- Don't update revoked cards
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for auto_mark_expired_cards function
CREATE OR REPLACE FUNCTION auto_mark_expired_cards()
RETURNS json AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update cards that are active but past expiry
  UPDATE referee_cards
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND expires_at < now()
    AND expires_at IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'cards_marked_expired', updated_count,
    'executed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
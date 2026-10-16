-- Function to sync card expiry when license expiry changes
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync card expiry
DROP TRIGGER IF EXISTS on_license_expiry_update ON profiles;
CREATE TRIGGER on_license_expiry_update
AFTER UPDATE OF license_expiry ON profiles
FOR EACH ROW
WHEN (OLD.license_expiry IS DISTINCT FROM NEW.license_expiry)
EXECUTE FUNCTION sync_card_expiry();

-- Function to auto-mark expired cards (called by scheduled job)
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
$$ LANGUAGE plpgsql;

-- Backfill: sync existing cards to match current license expiry
UPDATE referee_cards rc
SET expires_at = p.license_expiry,
    updated_at = now()
FROM profiles p
WHERE rc.referee_id = p.id
  AND rc.status != 'revoked'
  AND (rc.expires_at IS DISTINCT FROM p.license_expiry OR rc.expires_at IS NULL);

-- Mark currently expired cards
SELECT auto_mark_expired_cards();
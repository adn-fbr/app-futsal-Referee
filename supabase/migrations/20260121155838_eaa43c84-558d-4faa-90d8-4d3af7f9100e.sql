-- Update search function to support pagination
CREATE OR REPLACE FUNCTION search_referee_cards(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  referee_id uuid,
  card_number text,
  issued_at timestamptz,
  expires_at timestamptz,
  status text,
  last_verified_at timestamptz,
  verification_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text,
  profile_photo_url text,
  license_level text,
  license_expiry date,
  afk_origin text,
  is_active boolean,
  kabupaten_kota_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.id,
    rc.referee_id,
    rc.card_number,
    rc.issued_at,
    rc.expires_at,
    rc.status,
    rc.last_verified_at,
    rc.verification_count,
    rc.created_at,
    rc.updated_at,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.license_expiry,
    p.afk_origin,
    p.is_active,
    k.name as kabupaten_kota_name
  FROM referee_cards rc
  JOIN profiles p ON p.id = rc.referee_id
  LEFT JOIN kabupaten_kota k ON k.id = p.kabupaten_kota_id
  WHERE 
    (p_status IS NULL OR rc.status = p_status)
    AND (
      p_search IS NULL 
      OR rc.card_number ILIKE '%' || p_search || '%'
      OR p.full_name ILIKE '%' || p_search || '%'
    )
  ORDER BY rc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function to get total count of cards (for pagination)
CREATE OR REPLACE FUNCTION count_referee_cards(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  total integer;
BEGIN
  SELECT COUNT(*)
  INTO total
  FROM referee_cards rc
  JOIN profiles p ON p.id = rc.referee_id
  WHERE 
    (p_status IS NULL OR rc.status = p_status)
    AND (
      p_search IS NULL 
      OR rc.card_number ILIKE '%' || p_search || '%'
      OR p.full_name ILIKE '%' || p_search || '%'
    );
  
  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
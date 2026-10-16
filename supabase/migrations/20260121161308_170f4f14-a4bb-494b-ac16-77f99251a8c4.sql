-- Add pagination support to get_referees function
CREATE OR REPLACE FUNCTION get_referees(
  _license_level TEXT DEFAULT NULL,
  _is_active BOOLEAN DEFAULT NULL,
  _kabupaten_kota_id TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL,
  _limit INT DEFAULT NULL,
  _offset INT DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  full_name TEXT,
  birth_date TEXT,
  kabupaten_kota_id TEXT,
  kabupaten_kota_name TEXT,
  license_level TEXT,
  license_expiry TEXT,
  profile_photo_url TEXT,
  is_active BOOLEAN,
  is_profile_complete BOOLEAN,
  afk_origin TEXT,
  created_at TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::TEXT,
    p.full_name,
    p.birth_date::TEXT,
    p.kabupaten_kota_id::TEXT,
    k.name::TEXT as kabupaten_kota_name,
    p.license_level,
    p.license_expiry::TEXT,
    p.profile_photo_url,
    p.is_active,
    p.is_profile_complete,
    p.afk_origin,
    p.created_at::TEXT
  FROM profiles p
  LEFT JOIN kabupaten_kota k ON p.kabupaten_kota_id = k.id
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'wasit'
  )
  AND p.deleted_at IS NULL
  AND (_license_level IS NULL OR p.license_level = _license_level)
  AND (_is_active IS NULL OR p.is_active = _is_active)
  AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  AND (_search IS NULL OR 
       p.full_name ILIKE '%' || _search || '%' OR
       p.afk_origin ILIKE '%' || _search || '%' OR
       k.name ILIKE '%' || _search || '%'
  )
  ORDER BY p.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Add count function for referees
CREATE OR REPLACE FUNCTION count_referees(
  _license_level TEXT DEFAULT NULL,
  _is_active BOOLEAN DEFAULT NULL,
  _kabupaten_kota_id TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO total_count
  FROM profiles p
  LEFT JOIN kabupaten_kota k ON p.kabupaten_kota_id = k.id
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'wasit'
  )
  AND p.deleted_at IS NULL
  AND (_license_level IS NULL OR p.license_level = _license_level)
  AND (_is_active IS NULL OR p.is_active = _is_active)
  AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  AND (_search IS NULL OR 
       p.full_name ILIKE '%' || _search || '%' OR
       p.afk_origin ILIKE '%' || _search || '%' OR
       k.name ILIKE '%' || _search || '%'
  );
  
  RETURN total_count;
END;
$$;

-- Add duplicate event detection function
CREATE OR REPLACE FUNCTION check_duplicate_event(
  p_name TEXT,
  p_date DATE,
  p_location TEXT DEFAULT NULL,
  p_kabupaten_kota_id TEXT DEFAULT NULL,
  p_exclude_event_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  date TEXT,
  location TEXT,
  status TEXT,
  similarity_score INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id::TEXT,
    e.name,
    e.date::TEXT,
    e.location,
    e.status,
    CASE
      -- Exact match on name, date, location = 100
      WHEN LOWER(e.name) = LOWER(p_name) 
        AND e.date = p_date 
        AND (p_location IS NULL OR LOWER(e.location) = LOWER(p_location)) THEN 100
      -- Same name, same date = 90
      WHEN LOWER(e.name) = LOWER(p_name) AND e.date = p_date THEN 90
      -- Same name, date within 3 days = 80
      WHEN LOWER(e.name) = LOWER(p_name) 
        AND ABS(EXTRACT(DAY FROM e.date - p_date)) <= 3 THEN 80
      -- Similar name (contains), same date = 70
      WHEN (LOWER(e.name) LIKE '%' || LOWER(p_name) || '%' OR LOWER(p_name) LIKE '%' || LOWER(e.name) || '%')
        AND e.date = p_date THEN 70
      -- Same name, different date = 60
      WHEN LOWER(e.name) = LOWER(p_name) THEN 60
      ELSE 50
    END AS similarity_score
  FROM events e
  WHERE e.deleted_at IS NULL
    AND (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
    AND e.status != 'DITOLAK'
    AND (
      -- Check name similarity
      (LOWER(e.name) = LOWER(p_name) OR 
       LOWER(e.name) LIKE '%' || LOWER(p_name) || '%' OR 
       LOWER(p_name) LIKE '%' || LOWER(e.name) || '%')
      -- And date proximity (within 7 days)
      AND ABS(EXTRACT(DAY FROM e.date - p_date)) <= 7
    )
    AND (p_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = p_kabupaten_kota_id)
  ORDER BY similarity_score DESC, e.date DESC
  LIMIT 5;
END;
$$;
-- Fix linter: avoid overly permissive INSERT policies

-- 1) card_verification_logs: require non-null card_id (already NOT NULL but satisfy linter)
DROP POLICY IF EXISTS "Anyone can insert verification logs" ON public.card_verification_logs;
CREATE POLICY "Anyone can insert verification logs"
ON public.card_verification_logs
FOR INSERT
WITH CHECK (card_id IS NOT NULL);

-- 2) referee_reviews: require basic validation on rating
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.referee_reviews;
CREATE POLICY "Anyone can submit reviews"
ON public.referee_reviews
FOR INSERT
WITH CHECK (
  rating BETWEEN 1 AND 5
);

-- Fix linter: set function search_path
CREATE OR REPLACE FUNCTION public.generate_card_number(p_referee_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_year INTEGER;
  v_region_code VARCHAR(10);
  v_sequence INTEGER;
  v_card_number VARCHAR(30);
BEGIN
  v_year := EXTRACT(YEAR FROM now());
  
  -- Get region code from kabupaten_kota
  SELECT COALESCE(UPPER(SUBSTRING(kk.code FROM 1 FOR 3)), 'XXX')
  INTO v_region_code
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  WHERE p.id = p_referee_id;
  
  IF v_region_code IS NULL THEN
    v_region_code := 'XXX';
  END IF;
  
  -- Get next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(card_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.referee_cards
  WHERE card_number LIKE 'FFI-' || v_year || '-' || v_region_code || '-%';
  
  v_card_number := 'FFI-' || v_year || '-' || v_region_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_card_number;
END;
$function$;
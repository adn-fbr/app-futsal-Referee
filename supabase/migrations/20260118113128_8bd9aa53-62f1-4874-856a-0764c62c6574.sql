-- Create referee_cards table
CREATE TABLE public.referee_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
  card_number VARCHAR(30) NOT NULL UNIQUE,
  verification_code VARCHAR(64) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
  last_verified_at TIMESTAMPTZ,
  verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create card_verification_logs table
CREATE TABLE public.card_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.referee_cards(id) NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT now(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  location TEXT
);

-- Create indexes for fast lookups
CREATE INDEX idx_referee_cards_verification_code ON public.referee_cards(verification_code);
CREATE INDEX idx_referee_cards_card_number ON public.referee_cards(card_number);
CREATE INDEX idx_referee_cards_status ON public.referee_cards(status);
CREATE INDEX idx_card_verification_logs_card_id ON public.card_verification_logs(card_id);

-- Enable RLS
ALTER TABLE public.referee_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for referee_cards
CREATE POLICY "Referees can view their own card"
ON public.referee_cards FOR SELECT
USING (auth.uid() = referee_id);

CREATE POLICY "Admins can view all cards"
ON public.referee_cards FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all cards"
ON public.referee_cards FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Public can verify cards by code"
ON public.referee_cards FOR SELECT
USING (true);

-- RLS policies for card_verification_logs
CREATE POLICY "Admins can view all verification logs"
ON public.card_verification_logs FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert verification logs"
ON public.card_verification_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Referees can view their own card logs"
ON public.card_verification_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.referee_cards rc
    WHERE rc.id = card_id AND rc.referee_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_referee_cards_updated_at
BEFORE UPDATE ON public.referee_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION public.generate_card_number(p_referee_id UUID)
RETURNS VARCHAR(30) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
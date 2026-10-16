-- Create set_updated_at function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone authenticated can view settings" 
ON public.system_settings FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings" 
ON public.system_settings FOR ALL 
USING (is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create can_access_region function
CREATE OR REPLACE FUNCTION public.can_access_region(_user_id uuid, _kabupaten_kota_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin_provinsi(_user_id) THEN
    RETURN true;
  END IF;
  
  IF has_role(_user_id, 'admin_kab_kota'::app_role) THEN
    RETURN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = _user_id 
      AND kabupaten_kota_id = _kabupaten_kota_id
    );
  END IF;
  
  IF has_role(_user_id, 'wasit'::app_role) OR has_role(_user_id, 'referee'::app_role) THEN
    RETURN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = _user_id 
      AND kabupaten_kota_id = _kabupaten_kota_id
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('app_name', 'Sistem Manajemen Wasit', 'Nama aplikasi'),
  ('organization_name', 'Federasi Futsal Indonesia', 'Nama organisasi'),
  ('max_event_referees', '4', 'Jumlah maksimal wasit per event'),
  ('honor_base_amount', '500000', 'Nominal dasar honor wasit')
ON CONFLICT (key) DO NOTHING;
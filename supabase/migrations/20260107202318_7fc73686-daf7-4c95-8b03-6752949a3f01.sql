-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admin_provinsi can manage settings
CREATE POLICY "Admin provinsi can manage settings" 
ON public.system_settings 
FOR ALL 
USING (is_admin_provinsi(auth.uid()));

-- Everyone can view settings (for edge functions to read)
CREATE POLICY "Everyone can view settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('association_email', 'sulsel.afp@gmail.com', 'Email tujuan notifikasi pengajuan event'),
  ('sender_email_name', 'FFI Sulsel', 'Nama pengirim email'),
  ('organization_name', 'Federasi Futsal Indonesia - Sulawesi Selatan', 'Nama organisasi'),
  ('organization_phone', '(0411) 123-4567', 'Nomor telepon organisasi'),
  ('organization_address', 'Jl. Perintis Kemerdekaan KM 12, Makassar', 'Alamat organisasi'),
  ('organization_email', 'info@ffisulsel.or.id', 'Email publik organisasi');
-- Add sender email address setting
INSERT INTO public.system_settings (key, value, description) VALUES
  ('sender_email_address', 'onboarding@resend.dev', 'Alamat email pengirim (domain terverifikasi Resend)')
ON CONFLICT (key) DO NOTHING;
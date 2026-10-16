-- Add email configuration settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('email_provider', 'resend', 'Provider email: resend atau smtp'),
  ('resend_api_key', '', 'API Key dari Resend.com'),
  ('smtp_host', '', 'Host SMTP server'),
  ('smtp_port', '587', 'Port SMTP server'),
  ('smtp_user', '', 'Username/email untuk SMTP auth'),
  ('smtp_password', '', 'Password untuk SMTP auth'),
  ('smtp_secure', 'tls', 'Metode enkripsi: tls atau ssl')
ON CONFLICT (key) DO NOTHING;
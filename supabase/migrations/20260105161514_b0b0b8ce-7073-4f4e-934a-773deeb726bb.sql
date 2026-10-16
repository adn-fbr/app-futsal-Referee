-- Pasang trigger on_auth_user_created yang hilang
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ubah default value kolom registration_status ke 'pending'
ALTER TABLE public.profiles 
  ALTER COLUMN registration_status SET DEFAULT 'pending';
-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync email for existing users from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name,
    email,
    kabupaten_kota_id,
    requested_role,
    registration_status,
    is_profile_complete,
    is_active
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    (new.raw_user_meta_data->>'kabupaten_kota_id')::uuid,
    new.raw_user_meta_data->>'requested_role',
    'pending',
    false,
    true
  );
  RETURN new;
END;
$$;

-- Create function to sync email when updated in auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger for email sync (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();
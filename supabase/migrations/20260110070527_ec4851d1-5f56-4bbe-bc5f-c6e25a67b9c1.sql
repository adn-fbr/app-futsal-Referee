-- Add email column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email text;

-- Update existing records with email from auth.users
UPDATE public.user_roles ur
SET email = au.email
FROM auth.users au
WHERE ur.user_id = au.id AND ur.email IS NULL;

-- Create function to sync email when role is created
CREATE OR REPLACE FUNCTION public.sync_user_role_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-populate email on insert
DROP TRIGGER IF EXISTS on_user_role_created ON public.user_roles;
CREATE TRIGGER on_user_role_created
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_email();

-- Create function to update user_roles email when auth.users email changes
CREATE OR REPLACE FUNCTION public.sync_user_roles_email_on_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_roles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users to sync email changes to user_roles
DROP TRIGGER IF EXISTS on_auth_user_email_updated_roles ON auth.users;
CREATE TRIGGER on_auth_user_email_updated_roles
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_roles_email_on_update();
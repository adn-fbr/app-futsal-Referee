
-- Fix Security Definer Views - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.active_profiles;
DROP VIEW IF EXISTS public.active_events;
DROP VIEW IF EXISTS public.active_honors;

CREATE VIEW public.active_profiles 
WITH (security_invoker = true)
AS SELECT * FROM public.profiles WHERE deleted_at IS NULL;

CREATE VIEW public.active_events 
WITH (security_invoker = true)
AS SELECT * FROM public.events WHERE deleted_at IS NULL;

CREATE VIEW public.active_honors 
WITH (security_invoker = true)
AS SELECT * FROM public.honors WHERE deleted_at IS NULL;

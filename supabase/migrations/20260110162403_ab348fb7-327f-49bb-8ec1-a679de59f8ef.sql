
-- =====================================================
-- Migration Part 1: Enum Types Only
-- =====================================================

-- Add new values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_provinsi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_kab_kota';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'panitia';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wasit';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'evaluator';

-- Create pengurus_level enum
DO $$ BEGIN
  CREATE TYPE public.pengurus_level AS ENUM ('PROVINSI', 'KAB_KOTA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

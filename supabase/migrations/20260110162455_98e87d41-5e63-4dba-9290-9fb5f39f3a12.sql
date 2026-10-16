
-- =====================================================
-- Migration Part 2: Create Tables and Alter Columns
-- =====================================================

-- Create provinsi table
CREATE TABLE IF NOT EXISTS public.provinsi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create kabupaten_kota table
CREATE TABLE IF NOT EXISTS public.kabupaten_kota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provinsi_id uuid REFERENCES public.provinsi(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provinsi_id, name)
);

-- Create pengurus table
CREATE TABLE IF NOT EXISTS public.pengurus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level public.pengurus_level NOT NULL,
  jabatan text NOT NULL,
  provinsi_id uuid REFERENCES public.provinsi(id) ON DELETE SET NULL,
  kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create event_approvals table
CREATE TABLE IF NOT EXISTS public.event_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_materials table
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  law_number text,
  content_type text NOT NULL DEFAULT 'document',
  content_url text,
  thumbnail_url text,
  duration_minutes integer,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion_topics table
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  law_reference text,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  views_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_solution boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Alter profiles table - add new columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS requested_role text,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Alter events table - add new columns
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Alter event_assignments table - add new column
ALTER TABLE public.event_assignments 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Alter honors table - add new column
ALTER TABLE public.honors 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Enable RLS on new tables
ALTER TABLE public.provinsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kabupaten_kota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_kabupaten_kota ON public.profiles(kabupaten_kota_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_status ON public.profiles(registration_status);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

CREATE INDEX IF NOT EXISTS idx_events_kabupaten_kota ON public.events(kabupaten_kota_id);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at);

CREATE INDEX IF NOT EXISTS idx_honors_deleted_at ON public.honors(deleted_at);

CREATE INDEX IF NOT EXISTS idx_event_assignments_deleted_at ON public.event_assignments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_kabupaten_kota_provinsi ON public.kabupaten_kota(provinsi_id);

CREATE INDEX IF NOT EXISTS idx_pengurus_user ON public.pengurus(user_id);
CREATE INDEX IF NOT EXISTS idx_pengurus_provinsi ON public.pengurus(provinsi_id);
CREATE INDEX IF NOT EXISTS idx_pengurus_kabupaten_kota ON public.pengurus(kabupaten_kota_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_event_approvals_event ON public.event_approvals(event_id);

CREATE INDEX IF NOT EXISTS idx_learning_materials_category ON public.learning_materials(category);
CREATE INDEX IF NOT EXISTS idx_learning_materials_is_published ON public.learning_materials(is_published);

CREATE INDEX IF NOT EXISTS idx_discussion_topics_author ON public.discussion_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_category ON public.discussion_topics(category);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_topic ON public.discussion_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author ON public.discussion_replies(author_id);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_provinsi_updated_at ON public.provinsi;
CREATE TRIGGER update_provinsi_updated_at
  BEFORE UPDATE ON public.provinsi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_kabupaten_kota_updated_at ON public.kabupaten_kota;
CREATE TRIGGER update_kabupaten_kota_updated_at
  BEFORE UPDATE ON public.kabupaten_kota
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pengurus_updated_at ON public.pengurus;
CREATE TRIGGER update_pengurus_updated_at
  BEFORE UPDATE ON public.pengurus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_approvals_updated_at ON public.event_approvals;
CREATE TRIGGER update_event_approvals_updated_at
  BEFORE UPDATE ON public.event_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_materials_updated_at ON public.learning_materials;
CREATE TRIGGER update_learning_materials_updated_at
  BEFORE UPDATE ON public.learning_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussion_topics_updated_at ON public.discussion_topics;
CREATE TRIGGER update_discussion_topics_updated_at
  BEFORE UPDATE ON public.discussion_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussion_replies_updated_at ON public.discussion_replies;
CREATE TRIGGER update_discussion_replies_updated_at
  BEFORE UPDATE ON public.discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Seed Data
-- =====================================================

-- Insert Sulawesi Selatan province
INSERT INTO public.provinsi (name, code) 
VALUES ('Sulawesi Selatan', 'SULSEL')
ON CONFLICT (name) DO NOTHING;

-- Insert kabupaten/kota in Sulawesi Selatan
INSERT INTO public.kabupaten_kota (provinsi_id, name, code)
SELECT p.id, kk.name, kk.code
FROM public.provinsi p
CROSS JOIN (VALUES 
  ('Makassar', 'MKS'),
  ('Gowa', 'GWA'),
  ('Maros', 'MRS'),
  ('Pangkep', 'PKP'),
  ('Barru', 'BRU'),
  ('Bone', 'BNE'),
  ('Soppeng', 'SPG'),
  ('Wajo', 'WJO'),
  ('Sidrap', 'SDR'),
  ('Pinrang', 'PRG'),
  ('Enrekang', 'ERK'),
  ('Luwu', 'LWU'),
  ('Tana Toraja', 'TRT'),
  ('Toraja Utara', 'TRU'),
  ('Luwu Utara', 'LWUT'),
  ('Luwu Timur', 'LWT'),
  ('Palopo', 'PLP'),
  ('Parepare', 'PRE'),
  ('Takalar', 'TKL'),
  ('Jeneponto', 'JNP'),
  ('Bantaeng', 'BTG'),
  ('Bulukumba', 'BLK'),
  ('Selayar', 'SLY'),
  ('Sinjai', 'SNJ')
) AS kk(name, code)
WHERE p.code = 'SULSEL'
ON CONFLICT (provinsi_id, name) DO NOTHING;

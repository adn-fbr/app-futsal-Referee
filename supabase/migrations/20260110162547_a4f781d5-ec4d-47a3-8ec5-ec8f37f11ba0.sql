
-- =====================================================
-- Migration Part 3: Additional Tables & RLS Policies
-- =====================================================

-- Create evaluation_criteria table
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  weight integer NOT NULL DEFAULT 1,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_score numeric(5,2),
  notes text,
  status text DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evaluation_scores table
CREATE TABLE IF NOT EXISTS public.evaluation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  criteria_id uuid NOT NULL REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE,
  score integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_event ON public.evaluations(event_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_referee ON public.evaluations(referee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON public.evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_evaluation ON public.evaluation_scores(evaluation_id);

-- Triggers
DROP TRIGGER IF EXISTS update_evaluation_criteria_updated_at ON public.evaluation_criteria;
CREATE TRIGGER update_evaluation_criteria_updated_at
  BEFORE UPDATE ON public.evaluation_criteria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to check if user is admin (any level)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin'::app_role, 'admin_provinsi'::app_role, 'admin_kab_kota'::app_role)
  )
$$;

-- Function to check if user is admin provinsi
CREATE OR REPLACE FUNCTION public.is_admin_provinsi(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin'::app_role, 'admin_provinsi'::app_role)
  )
$$;

-- Function to check if user is evaluator
CREATE OR REPLACE FUNCTION public.is_evaluator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'evaluator'::app_role
  )
$$;

-- =====================================================
-- RLS Policies for provinsi
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view provinsi" ON public.provinsi;
CREATE POLICY "Anyone can view provinsi" ON public.provinsi
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage provinsi" ON public.provinsi;
CREATE POLICY "Admins can manage provinsi" ON public.provinsi
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for kabupaten_kota
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view kabupaten_kota" ON public.kabupaten_kota;
CREATE POLICY "Anyone can view kabupaten_kota" ON public.kabupaten_kota
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage kabupaten_kota" ON public.kabupaten_kota;
CREATE POLICY "Admins can manage kabupaten_kota" ON public.kabupaten_kota
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for pengurus
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all pengurus" ON public.pengurus;
CREATE POLICY "Admins can view all pengurus" ON public.pengurus
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage pengurus" ON public.pengurus;
CREATE POLICY "Admins can manage pengurus" ON public.pengurus
  FOR ALL USING (public.is_admin_provinsi(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own pengurus record" ON public.pengurus;
CREATE POLICY "Users can view their own pengurus record" ON public.pengurus
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies for audit_logs
-- =====================================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- RLS Policies for event_approvals
-- =====================================================

DROP POLICY IF EXISTS "Admins can view event approvals" ON public.event_approvals;
CREATE POLICY "Admins can view event approvals" ON public.event_approvals
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage event approvals" ON public.event_approvals;
CREATE POLICY "Admins can manage event approvals" ON public.event_approvals
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for learning_materials
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view published materials" ON public.learning_materials;
CREATE POLICY "Anyone can view published materials" ON public.learning_materials
  FOR SELECT USING (is_published = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage learning materials" ON public.learning_materials;
CREATE POLICY "Admins can manage learning materials" ON public.learning_materials
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for discussion_topics
-- =====================================================

DROP POLICY IF EXISTS "Anyone authenticated can view topics" ON public.discussion_topics;
CREATE POLICY "Anyone authenticated can view topics" ON public.discussion_topics
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create topics" ON public.discussion_topics;
CREATE POLICY "Users can create topics" ON public.discussion_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their topics" ON public.discussion_topics;
CREATE POLICY "Authors can update their topics" ON public.discussion_topics
  FOR UPDATE USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete topics" ON public.discussion_topics;
CREATE POLICY "Admins can delete topics" ON public.discussion_topics
  FOR DELETE USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for discussion_replies
-- =====================================================

DROP POLICY IF EXISTS "Anyone authenticated can view replies" ON public.discussion_replies;
CREATE POLICY "Anyone authenticated can view replies" ON public.discussion_replies
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create replies" ON public.discussion_replies;
CREATE POLICY "Users can create replies" ON public.discussion_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their replies" ON public.discussion_replies;
CREATE POLICY "Authors can update their replies" ON public.discussion_replies
  FOR UPDATE USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete replies" ON public.discussion_replies;
CREATE POLICY "Admins can delete replies" ON public.discussion_replies
  FOR DELETE USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for evaluation_criteria
-- =====================================================

DROP POLICY IF EXISTS "Anyone authenticated can view criteria" ON public.evaluation_criteria;
CREATE POLICY "Anyone authenticated can view criteria" ON public.evaluation_criteria
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage criteria" ON public.evaluation_criteria;
CREATE POLICY "Admins can manage criteria" ON public.evaluation_criteria
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- RLS Policies for evaluations
-- =====================================================

DROP POLICY IF EXISTS "Admins and evaluators can view evaluations" ON public.evaluations;
CREATE POLICY "Admins and evaluators can view evaluations" ON public.evaluations
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR 
    public.is_evaluator(auth.uid()) OR 
    auth.uid() = referee_id
  );

DROP POLICY IF EXISTS "Evaluators can create evaluations" ON public.evaluations;
CREATE POLICY "Evaluators can create evaluations" ON public.evaluations
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid()) OR 
    (public.is_evaluator(auth.uid()) AND auth.uid() = evaluator_id)
  );

DROP POLICY IF EXISTS "Evaluators can update their evaluations" ON public.evaluations;
CREATE POLICY "Evaluators can update their evaluations" ON public.evaluations
  FOR UPDATE USING (
    public.is_admin(auth.uid()) OR 
    (public.is_evaluator(auth.uid()) AND auth.uid() = evaluator_id)
  );

-- =====================================================
-- RLS Policies for evaluation_scores
-- =====================================================

DROP POLICY IF EXISTS "Users can view evaluation scores" ON public.evaluation_scores;
CREATE POLICY "Users can view evaluation scores" ON public.evaluation_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Evaluators can manage evaluation scores" ON public.evaluation_scores;
CREATE POLICY "Evaluators can manage evaluation scores" ON public.evaluation_scores
  FOR ALL USING (public.is_admin(auth.uid()) OR public.is_evaluator(auth.uid()));

-- =====================================================
-- Views
-- =====================================================

CREATE OR REPLACE VIEW public.active_profiles AS
SELECT * FROM public.profiles WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_events AS
SELECT * FROM public.events WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_honors AS
SELECT * FROM public.honors WHERE deleted_at IS NULL;

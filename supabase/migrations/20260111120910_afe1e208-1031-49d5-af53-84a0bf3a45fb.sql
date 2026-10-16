-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- Notification type toggles
  honor_enabled BOOLEAN DEFAULT true,
  assignment_enabled BOOLEAN DEFAULT true,
  evaluation_enabled BOOLEAN DEFAULT true,
  registration_enabled BOOLEAN DEFAULT true,
  discussion_enabled BOOLEAN DEFAULT true,
  learning_enabled BOOLEAN DEFAULT true,
  pengurus_enabled BOOLEAN DEFAULT true,
  event_enabled BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
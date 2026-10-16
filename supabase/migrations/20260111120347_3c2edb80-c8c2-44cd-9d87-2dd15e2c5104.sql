-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'event', 'honor', 'assignment', 'evaluation', 'registration', 'discussion', 'learning', 'pengurus'
  action TEXT NOT NULL, -- 'submitted', 'approved', 'rejected', 'assigned', 'replied', etc.
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT, -- nama tabel: 'events', 'honors', etc.
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS: Authenticated users can insert notifications (for other users)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index for performance on unread notifications
CREATE INDEX idx_notifications_user_unread 
  ON public.notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = false;

-- Index for fetching user notifications
CREATE INDEX idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
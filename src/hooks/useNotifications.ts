import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { checkNotificationEnabled, NotificationType } from "@/hooks/useNotificationPreferences";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  action: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  action: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
}

// Fetch notifications for current user
export const useNotifications = (limit: number = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });
};

// Get unread count
export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Mark single notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// Helper function to create notification (called from other hooks)
// Checks user preferences before creating notification
export const createNotification = async (input: CreateNotificationInput) => {
  // Check if notification type is enabled for user
  const isEnabled = await checkNotificationEnabled(
    input.userId,
    input.type as NotificationType
  );

  if (!isEnabled) {
    console.log(`Notification type "${input.type}" is disabled for user ${input.userId}`);
    return;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    action: input.action,
    title: input.title,
    message: input.message || null,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
};

// Helper function to create notifications for multiple users
// Checks each user's preferences before creating notification
export const createNotifications = async (
  userIds: string[],
  notification: Omit<CreateNotificationInput, "userId">
) => {
  // Filter users who have this notification type enabled
  const enabledUsers: string[] = [];
  
  for (const userId of userIds) {
    const isEnabled = await checkNotificationEnabled(
      userId,
      notification.type as NotificationType
    );
    if (isEnabled) {
      enabledUsers.push(userId);
    }
  }

  if (enabledUsers.length === 0) {
    console.log(`No users have "${notification.type}" notifications enabled`);
    return;
  }

  const notifications = enabledUsers.map((userId) => ({
    user_id: userId,
    type: notification.type,
    action: notification.action,
    title: notification.title,
    message: notification.message || null,
    entity_type: notification.entityType || null,
    entity_id: notification.entityId || null,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Failed to create notifications:", error);
  }
};

// Get entity URL for navigation
export const getEntityUrl = (type: string, entityId: string | null): string => {
  if (!entityId) return "/notifications";
  
  switch (type) {
    case "honor":
      return "/referee/honor";
    case "assignment":
      return "/referee/events";
    case "evaluation":
      return `/evaluations/${entityId}`;
    case "registration":
      return "/dashboard";
    case "discussion":
      return `/referee/discussions/${entityId}`;
    case "learning":
      return `/referee/learning/${entityId}`;
    case "pengurus":
      return "/organization";
    case "event":
      return `/events/${entityId}`;
    default:
      return "/notifications";
  }
};

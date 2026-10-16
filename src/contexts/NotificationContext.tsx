import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshNotifications: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  }, [user?.id]);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    fetchUnreadCount();
  }, [queryClient, fetchUnreadCount]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message || undefined,
            duration: 5000,
          });

          // Update unread count
          setUnreadCount((prev) => prev + 1);
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch unread count when notifications are updated (marked as read)
          fetchUnreadCount();
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  honor_enabled: boolean;
  assignment_enabled: boolean;
  evaluation_enabled: boolean;
  registration_enabled: boolean;
  discussion_enabled: boolean;
  learning_enabled: boolean;
  pengurus_enabled: boolean;
  event_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | "honor" 
  | "assignment" 
  | "evaluation" 
  | "registration" 
  | "discussion" 
  | "learning" 
  | "pengurus" 
  | "event";

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at"> = {
  honor_enabled: true,
  assignment_enabled: true,
  evaluation_enabled: true,
  registration_enabled: true,
  discussion_enabled: true,
  learning_enabled: true,
  pengurus_enabled: true,
  event_enabled: true,
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { label: string; description: string }> = {
  honor: {
    label: "Honor",
    description: "Saat honor diverifikasi atau ditolak",
  },
  assignment: {
    label: "Penugasan",
    description: "Saat mendapat atau dibatalkan penugasan",
  },
  evaluation: {
    label: "Evaluasi",
    description: "Saat menerima evaluasi baru",
  },
  registration: {
    label: "Registrasi",
    description: "Saat pendaftaran disetujui atau ditolak",
  },
  discussion: {
    label: "Diskusi",
    description: "Saat ada balasan di diskusi",
  },
  learning: {
    label: "Materi Pembelajaran",
    description: "Saat materi baru dipublikasikan",
  },
  pengurus: {
    label: "Kepengurusan",
    description: "Saat ditambahkan sebagai pengurus",
  },
  event: {
    label: "Event",
    description: "Saat ada persetujuan atau pembaruan event",
  },
};

// Fetch user's notification preferences
export const useNotificationPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Return existing preferences or default
      if (data) {
        return data as NotificationPreferences;
      }

      // Return defaults with user_id
      return {
        ...DEFAULT_PREFERENCES,
        user_id: user.id,
      } as Partial<NotificationPreferences>;
    },
    enabled: !!user?.id,
  });
};

// Update notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if record exists
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("notification_preferences")
          .update(preferences)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
            ...preferences,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferensi notifikasi disimpan");
    },
    onError: (error) => {
      console.error("Error updating notification preferences:", error);
      toast.error("Preferensi gagal disimpan. Periksa koneksi Anda dan coba lagi.");
    },
  });
};

// Check if a notification type is enabled for a user
export const checkNotificationEnabled = async (
  userId: string,
  type: NotificationType
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking notification preferences:", error);
    return true; // Default to enabled on error
  }

  if (!data) {
    return true; // Default to enabled if no preferences set
  }

  const key = `${type}_enabled` as keyof NotificationPreferences;
  return data[key] !== false;
};

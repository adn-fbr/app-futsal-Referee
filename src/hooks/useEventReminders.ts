import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReminderResult {
  success: boolean;
  targetDate: string;
  daysBeforeEvent: number;
  totalEvents: number;
  totalNotified: number;
  failedEvents: number;
  results: Array<{
    eventId: string;
    eventName: string;
    refereesNotified: number;
    errors: string[];
  }>;
}

/**
 * Hook to manually trigger event reminders
 * Sends notifications to all confirmed referees for events starting in X days
 */
export function useSendEventReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (daysBeforeEvent: number = 1) => {
      const { data, error } = await supabase.functions.invoke("send-event-reminders", {
        body: { daysBeforeEvent },
      });

      if (error) throw new Error(error.message);
      return data as ReminderResult;
    },
    onSuccess: (data) => {
      if (data.totalNotified > 0) {
        toast.success(`Reminder terkirim ke ${data.totalNotified} wasit untuk ${data.totalEvents} event`);
      } else if (data.totalEvents === 0) {
        toast.info("Tidak ada event yang dimulai pada tanggal target");
      } else {
        toast.warning("Tidak ada wasit yang perlu di-remind");
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(`Gagal mengirim reminder: ${error.message}`);
    },
  });
}

/**
 * Send reminder for a specific assignment
 */
export function useSendAssignmentReminder() {
  return useMutation({
    mutationFn: async ({
      assignmentId,
      refereeId,
      eventId,
      role,
    }: {
      assignmentId: string;
      refereeId: string;
      eventId: string;
      role?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-assignment-notification", {
        body: {
          assignmentId,
          refereeId,
          eventId,
          type: "reminder",
          role,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Reminder berhasil dikirim");
    },
    onError: (error) => {
      toast.error(`Gagal mengirim reminder: ${error.message}`);
    },
  });
}

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AutoCompletedEvent {
  id: string;
  name: string;
  end_date: string;
  status: "completed" | "error" | "skipped";
  message?: string;
  notificationsCreated: number;
  notificationError?: string;
}

interface AutoCompleteResult {
  success: boolean;
  completed: number;
  failed: number;
  skipped: number;
  events: AutoCompletedEvent[];
  error?: string;
}

const THROTTLE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_KEY = "lastAutoCompleteCheck";

/**
 * Hook to auto-trigger event completion check on page load
 * Runs in background, throttled to once per 5 minutes per session
 */
export function useAutoCompleteEvents() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-run in strict mode
    if (hasRun.current) return;

    const lastCheck = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();

    // Throttle: check at most every 5 minutes
    if (lastCheck && now - parseInt(lastCheck, 10) < THROTTLE_INTERVAL) {
      return;
    }

    hasRun.current = true;

    // Run in background (fire and forget)
    supabase.functions
      .invoke("auto-complete-events", {
        body: { trigger: "page_load" },
      })
      .then(({ data, error }) => {
        sessionStorage.setItem(SESSION_KEY, now.toString());

        if (error) {
          console.warn("[useAutoCompleteEvents] Error:", error);
          return;
        }

        const result = data as AutoCompleteResult;
        if (result?.completed > 0) {
          console.log(`[useAutoCompleteEvents] Auto-completed ${result.completed} event(s)`);
          // Optional: show subtle notification for admins
          // toast.info(`${result.completed} event otomatis diselesaikan`);
        }
      })
      .catch((err) => {
        console.warn("[useAutoCompleteEvents] Failed:", err);
      });
  }, []);
}

/**
 * Mutation hook for manual auto-complete trigger (admin only)
 */
export function useManualAutoComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AutoCompleteResult> => {
      const { data, error } = await supabase.functions.invoke("auto-complete-events", {
        body: { trigger: "manual" },
      });

      if (error) {
        throw new Error(error.message || "Gagal menjalankan auto-complete");
      }

      return data as AutoCompleteResult;
    },
    onSuccess: (data) => {
      if (data.completed > 0) {
        toast.success(`${data.completed} event telah diselesaikan otomatis`, {
          description: data.events
            .filter((e) => e.status === "completed")
            .map((e) => e.name)
            .slice(0, 3)
            .join(", ") + (data.completed > 3 ? "..." : ""),
        });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["referee-events"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } else {
        toast.info("Tidak ada event yang perlu diselesaikan", {
          description: "Semua event sudah dalam status yang benar",
        });
      }

      if (data.failed > 0) {
        toast.warning(`${data.failed} event gagal diselesaikan`, {
          description: "Periksa log untuk detail error",
        });
      }

      // Update session storage to prevent immediate re-check
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    },
    onError: (error: Error) => {
      toast.error("Gagal menjalankan auto-complete", {
        description: error.message,
      });
    },
  });
}

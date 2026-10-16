import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";

export type HonorStatus = "draft" | "submitted" | "verified" | "rejected";

export interface Honor {
  id: string;
  referee_id: string;
  event_id: string | null;
  amount: number;
  notes: string | null;
  status: HonorStatus;
  created_at: string;
  updated_at: string;
  events?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    category: string | null;
  } | null;
  referee?: {
    id: string;
    full_name: string;
  } | null;
  verifier?: {
    id: string;
    full_name: string;
  } | null;
}

export interface HonorStatistics {
  referee_id: string;
  total_verified: number;
  total_pending: number;
  total_rejected: number;
  total_earned: number;
  pending_amount: number;
}

export function getHonorErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (/HONOR_EVENT_NOT_COMPLETED|belum selesai|event.*selesai/i.test(message)) {
    return "Honor hanya dapat diajukan untuk event yang sudah selesai.";
  }
  if (/HONOR_ASSIGNMENT_NOT_CONFIRMED|tidak ditugaskan|tidak dikonfirmasi/i.test(message)) {
    return "Anda belum dikonfirmasi untuk event ini.";
  }
  if (/HONOR_ALREADY_EXISTS|sudah ada|sudah pernah/i.test(message)) {
    return "Honor untuk event ini sudah ada.";
  }
  if (/HONOR_NOT_OWNER|bukan milik|tidak berhak|not owner/i.test(message)) {
    return "Anda tidak berhak mengelola honor ini.";
  }
  if (/HONOR_NOT_EDITABLE|tidak dapat mengubah|not editable/i.test(message)) {
    return "Honor ini tidak dapat diedit pada status saat ini.";
  }
  if (/HONOR_INVALID_AMOUNT|jumlah.*invalid|invalid amount/i.test(message)) {
    return "Jumlah honor tidak valid.";
  }
  if (/HONOR_VERIFICATION_DENIED|verification denied|tidak dapat diverifikasi/i.test(message)) {
    return "Honor tidak dapat diverifikasi pada status saat ini.";
  }
  if (/HONOR_INVALID_STATUS|invalid status|status.*tidak valid/i.test(message)) {
    return "Status honor tidak valid untuk tindakan ini.";
  }

  return message || "Terjadi kesalahan.";
}

// Get honors (auto-filters based on role)
export function useHonors(filters?: { status?: HonorStatus; refereeId?: string }) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["honors", user?.id, isAdmin(), filters],
    queryFn: async () => {
      if (!user) return [];

      // Optimized: Use join to get referee and event data in single query
      let query = supabase.from("honors").select(`
          *,
          events!event_id (id, name, start_date, end_date, category),
          referee:profiles!referee_id (
            id,
            full_name
          )
        `).order("created_at", { ascending: false });

      // Non-admins only see their own honors
      if (!isAdmin()) {
        query = query.eq("referee_id", user.id);
      } else if (filters?.refereeId) {
        query = query.eq("referee_id", filters.refereeId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map the joined data to match interface
      return (data || []).map(honor => ({
        ...honor,
        referee: (honor as any).referee || null,
      })) as Honor[];
    },
    enabled: !!user,
  });
}

// Get honor statistics for a referee - calculate directly from honors table
export function useHonorStatistics(refereeId?: string) {
  const { user } = useAuth();
  const targetId = refereeId || user?.id;

  return useQuery({
    queryKey: ["honor-statistics", targetId],
    queryFn: async (): Promise<HonorStatistics> => {
      if (!targetId) {
        return {
          referee_id: "",
          total_verified: 0,
          total_pending: 0,
          total_rejected: 0,
          total_earned: 0,
          pending_amount: 0,
        };
      }

      // Fetch honors directly and calculate statistics
      const { data, error } = await supabase
        .from("honors")
        .select("status, amount")
        .eq("referee_id", targetId)
        .is("deleted_at", null);

      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, honor) => {
          if (honor.status === "verified") {
            acc.total_verified += 1;
            acc.total_earned += honor.amount;
          } else if (honor.status === "submitted") {
            acc.total_pending += 1;
            acc.pending_amount += honor.amount;
          } else if (honor.status === "rejected") {
            acc.total_rejected += 1;
          }
          return acc;
        },
        {
          referee_id: targetId,
          total_verified: 0,
          total_pending: 0,
          total_rejected: 0,
          total_earned: 0,
          pending_amount: 0,
        }
      );

      return stats;
    },
    enabled: !!targetId,
  });
}

// Get eligible events for honor submission (assigned and completed)
export function useEligibleEventsForHonor() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["eligible-events-honor", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get assigned events
      const { data: assignments, error: assignError } = await supabase
        .from("event_assignments")
        .select(`
          event:event_id (id, name, start_date, end_date, status, category)
        `)
        .eq("referee_id", user.id)
        .neq("status", "cancelled");

      if (assignError) throw assignError;

      // Get existing honors to exclude
      const { data: existingHonors } = await supabase.from("honors").select("event_id").eq("referee_id", user.id);

      const existingEventIds = new Set(existingHonors?.map(h => h.event_id) || []);

      // Filter to only completed events without existing honors
      const eligibleEvents = (assignments || [])
        .filter(a => a.event && a.event.status === "SELESAI" && !existingEventIds.has(a.event.id))
        .map(a => a.event!);

      return eligibleEvents;
    },
    enabled: !!user,
  });
}

// Create honor (by referee)
export function useCreateHonor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      event_id,
      amount,
      notes,
    }: {
      event_id: string | null;
      amount: number;
      notes?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("create_honor_draft", {
        p_event_id: event_id,
        p_amount: amount,
        p_notes: notes ?? null,
      });

      if (error) {
        throw new Error(getHonorErrorMessage(error));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-events-honor"] });
      toast.success("Honor berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan honor: " + error.message);
    },
  });
}

// Update honor draft (by referee - only draft status)
export function useUpdateHonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount?: number; notes?: string }) => {
      const { data, error } = await supabase.rpc("update_honor_draft", {
        p_honor_id: id,
        p_amount: amount ?? null,
        p_notes: notes ?? null,
      });

      if (error) {
        throw new Error(getHonorErrorMessage(error));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      toast.success("Honor berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui honor: " + error.message);
    },
  });
}

// Submit honor for verification (by referee)
export function useSubmitHonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase.rpc("submit_honor", {
        p_honor_id: id,
      });

      if (error) {
        throw new Error(getHonorErrorMessage(error));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      toast.success("Honor berhasil diajukan untuk verifikasi");
    },
    onError: (error) => {
      toast.error("Gagal mengajukan honor: " + error.message);
    },
  });
}

// Verify honor (by admin)
export function useVerifyHonor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("verify_honor", {
        p_honor_id: id,
        p_amount: amount,
        p_notes: notes ?? null,
      });

      if (error) {
        throw new Error(getHonorErrorMessage(error));
      }
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["honor-statistics"] });

      await createNotification({
        userId: data.referee_id,
        type: "honor",
        action: "verified",
        title: "Honor Diverifikasi",
        message: `Honor Anda sebesar ${formatCurrency(data.amount)} telah diverifikasi.`,
        entityType: "honors",
        entityId: data.id,
      });

      toast.success("Honor berhasil diverifikasi");
    },
    onError: (error) => {
      toast.error("Gagal memverifikasi honor: " + error.message);
    },
  });
}

// Delete draft honor (by referee)
export function useDeleteHonor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("delete_honor_draft", {
        p_honor_id: id,
      });

      if (error) {
        throw new Error(getHonorErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-events-honor"] });
      toast.success("Honor berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus honor: " + error.message);
    },
  });
}

// Legacy support
export function useHonorStats() {
  return useHonorStatistics();
}

export function useRejectHonor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("reject_honor", {
        p_honor_id: id,
        p_reason: reason.trim(),
      });

      if (error) {
        throw new Error(getHonorErrorMessage(error));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["honor-statistics"] });
      toast.success("Honor ditolak");
    },
    onError: (error) => {
      toast.error("Gagal menolak honor: " + error.message);
    },
  });
}

// Helper functions
export function getHonorStatusDisplay(status: HonorStatus) {
  switch (status) {
    case "draft":
      return { label: "Draft", variant: "neutral" as const, color: "text-muted-foreground" };
    case "submitted":
      return { label: "Diajukan", variant: "warning" as const, color: "text-yellow-600" };
    case "verified":
      return { label: "Diverifikasi", variant: "success" as const, color: "text-green-600" };
    case "rejected":
      return { label: "Ditolak", variant: "error" as const, color: "text-red-600" };
    default:
      return { label: status, variant: "neutral" as const, color: "text-muted-foreground" };
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

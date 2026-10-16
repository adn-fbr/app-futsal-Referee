import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTransitionAssignmentStatus,
  type AssignmentStatus,
  type EventAssignment,
} from "@/hooks/useEventAssignments";

export const ADMIN_PROVINSI_ROLE = "admin_provinsi" as const;

type AssignmentRow = EventAssignment & {
  event: NonNullable<EventAssignment["event"]>;
  referee: NonNullable<EventAssignment["referee"]>;
};

export interface AdminKabupatenKota {
  id: string;
  name: string;
}

export function useAdminEventAssignments() {
  const { isAdminProvinsi } = useAuth();

  return useQuery({
    queryKey: ["admin-event-assignments"],
    enabled: isAdminProvinsi(),
    queryFn: async (): Promise<AssignmentRow[]> => {
      const { data, error } = await supabase
        .from("event_assignments")
        .select(`
          id, event_id, referee_id, role, status, created_at, updated_at,
          event:events!event_id (
            id, name, start_date, end_date, status, location, kabupaten_kota_id,
            kabupaten_kota:kabupaten_kota!kabupaten_kota_id (id, name)
          ),
          referee:profiles!referee_id (id, full_name, license_level, profile_photo_url)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as AssignmentRow[];
    },
  });
}

export function useAdminKabupatenKota() {
  const { isAdminProvinsi } = useAuth();

  return useQuery({
    queryKey: ["admin-kabupaten-kota"],
    enabled: isAdminProvinsi(),
    queryFn: async (): Promise<AdminKabupatenKota[]> => {
      const { data, error } = await supabase
        .from("kabupaten_kota")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChangeAdminAssignmentStatus() {
  const queryClient = useQueryClient();
  const { isAdminProvinsi } = useAuth();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      nextStatus,
      password,
      reason,
    }: {
      assignmentId: string;
      nextStatus: AssignmentStatus;
      password: string;
      reason?: string | null;
    }) => {
      if (!password) throw new Error("Password wajib diisi.");
      if (!["pending", "confirmed", "declined", "cancelled"].includes(nextStatus)) {
        throw new Error("Status target tidak valid untuk assignment.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const currentUser = userData.user;
      if (userError || !currentUser?.email) throw new Error("Session Anda telah berakhir. Silakan login kembali.");

      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);
      if (roleError) throw new Error("Kewenangan Admin Provinsi tidak dapat diverifikasi.");
      if (!isAdminProvinsi() || !roleRows?.some((row) => row.role === ADMIN_PROVINSI_ROLE)) {
        throw new Error("Anda tidak memiliki kewenangan Admin Provinsi untuk melakukan tindakan ini.");
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password,
      });
      if (reauthError) throw new Error("Password tidak valid. Tindakan administratif tidak dilakukan.");

      const { data: verifiedUserData, error: verifiedUserError } = await supabase.auth.getUser();
      if (verifiedUserError || verifiedUserData.user?.id !== currentUser.id) {
        throw new Error("Session Anda telah berakhir. Silakan login kembali.");
      }
      const { data: verifiedRoleRows, error: verifiedRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);
      if (verifiedRoleError || !verifiedRoleRows?.some((row) => row.role === ADMIN_PROVINSI_ROLE)) {
        throw new Error("Anda tidak lagi memiliki kewenangan Admin Provinsi untuk melakukan tindakan ini.");
      }

      const { data, error } = await supabase.rpc("transition_event_assignment_status", {
        p_assignment_id: assignmentId,
        p_target_status: nextStatus,
        p_reason: nextStatus === "cancelled" ? (reason?.trim() || null) : null,
      });

      if (error) {
        const message = error.message || "Status assignment gagal diubah. Silakan coba lagi.";
        if (message.includes("INVALID_TRANSITION")) {
          throw new Error("Transisi status ini tidak diizinkan untuk assignment saat ini.");
        }
        if (message.includes("CROSS_REGION_ACCESS")) {
          throw new Error("Anda tidak memiliki akses ke wilayah event ini.");
        }
        if (message.includes("UNAUTHORIZED_ACTOR")) {
          throw new Error("Anda tidak memiliki kewenangan untuk mengubah status assignment ini.");
        }
        if (message.includes("CONCURRENT_STATUS_CHANGE")) {
          throw new Error("Status assignment sudah berubah. Silakan muat ulang data dan coba lagi.");
        }
        throw new Error(message);
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-event-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["event-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["referee-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["referee-events"] });
    },
  });
}
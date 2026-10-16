import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";

export type RegistrationApprovalRole = "wasit" | "panitia";

export function normalizeRegistrationApprovalRole(
  role: string | null | undefined,
): RegistrationApprovalRole {
  if (role === "wasit" || role === "panitia") {
    return role;
  }

  throw new Error("Peran yang dipilih tidak valid");
}

type RpcCaller = (
  name: string,
  args?: Record<string, unknown>,
) => Promise<{ data: any; error: { message?: string } | null }>;

export async function approveRegistrationWithRpc(
  rpc: RpcCaller,
  {
    userId,
    role,
  }: {
    userId: string;
    role: RegistrationApprovalRole | string;
  },
) {
  const normalizedRole = normalizeRegistrationApprovalRole(role);
  const { data: canApprove, error: authError } = await rpc("can_approve_registration", {
    _user_id: userId,
  });

  if (authError) throw authError;
  if (canApprove !== true) {
    throw new Error("Tidak berhak menyetujui user dari wilayah lain");
  }

  const { error } = await rpc("approve_registration", {
    _user_id: userId,
    _role: normalizedRole,
  });

  if (error) throw error;
}

export async function rejectRegistrationWithRpc(
  rpc: RpcCaller,
  {
    userId,
    reason,
  }: {
    userId: string;
    reason: string;
  },
) {
  const { data: canApprove, error: authError } = await rpc("can_approve_registration", {
    _user_id: userId,
  });

  if (authError) throw authError;
  if (canApprove !== true) {
    throw new Error("Tidak berhak menolak user dari wilayah lain");
  }

  const { error } = await rpc("reject_registration", {
    _user_id: userId,
    _reason: reason,
  });

  if (error) throw error;
}

interface PendingRegistration {
  id: string;
  full_name: string;
  email: string | null;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  requested_role: string | null;
  registration_status: string | null;
  created_at: string | null;
}

interface RegistrationHistory {
  id: string;
  full_name: string;
  email: string | null;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  requested_role: string | null;
  registration_status: string | null;
  rejected_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approver_name: string | null;
  created_at: string | null;
}

export function usePendingRegistrations() {
  return useQuery({
    queryKey: ["pending-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_registrations");

      if (error) throw error;
      return data as PendingRegistration[];
    },
  });
}

export function useRegistrationHistory() {
  return useQuery({
    queryKey: ["registration-history"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_registration_history");

      if (error) throw error;
      return data as RegistrationHistory[];
    },
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: ["pending-registrations-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_registrations");

      if (error) throw error;
      return data?.length || 0;
    },
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  const { user, isAdminProvinsi, kabupatenKotaId } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
      userKabupatenKotaId,
    }: {
      userId: string;
      role: RegistrationApprovalRole | string;
      userKabupatenKotaId: string | null;
    }) => {
      if (!isAdminProvinsi() && userKabupatenKotaId !== kabupatenKotaId) {
        throw new Error("Tidak berhak approve user dari wilayah lain");
      }

      await approveRegistrationWithRpc(supabase.rpc.bind(supabase), {
        userId,
        role,
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration-history"] });
      queryClient.invalidateQueries({ queryKey: ["pending-registrations-count"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });

      // Create notification for approved user
      await createNotification({
        userId: variables.userId,
        type: "registration",
        action: "approved",
        title: "Pendaftaran Disetujui",
        message: `Selamat! Pendaftaran Anda sebagai ${variables.role === "wasit" ? "Wasit" : "Panitia"} telah disetujui.`,
        entityType: "profiles",
        entityId: variables.userId,
      });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  const { user, isAdminProvinsi, kabupatenKotaId } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
      userKabupatenKotaId,
    }: {
      userId: string;
      reason: string;
      userKabupatenKotaId: string | null;
    }) => {
      if (!isAdminProvinsi() && userKabupatenKotaId !== kabupatenKotaId) {
        throw new Error("Tidak berhak menolak user dari wilayah lain");
      }

      await rejectRegistrationWithRpc(supabase.rpc.bind(supabase), {
        userId,
        reason,
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration-history"] });
      queryClient.invalidateQueries({ queryKey: ["pending-registrations-count"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });

      // Create notification for rejected user
      await createNotification({
        userId: variables.userId,
        type: "registration",
        action: "rejected",
        title: "Pendaftaran Ditolak",
        message: `Pendaftaran Anda ditolak. Alasan: ${variables.reason}`,
        entityType: "profiles",
        entityId: variables.userId,
      });
    },
  });
}

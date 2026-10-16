import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/contexts/AuthContext";

export interface User {
  id: string;
  full_name: string;
  kabupaten_kota_id: string | null;
  is_profile_complete: boolean | null;
  created_at: string | null;
  kabupaten_kota?: {
    id: string;
    name: string;
  } | null;
  role?: AppRole | null;
  email?: string;
}

export interface UserExportFilters {
  role?: AppRole | null;
  kabupatenKotaId?: string | null;
  searchQuery?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  kabupaten_kota_id?: string;
}

export interface BulkUserData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  kabupaten_kota_name?: string;
}

interface BulkCreateResult {
  email: string;
  status: "success" | "error";
  message?: string;
  userId?: string;
}

interface BulkCreateResponse {
  success: boolean;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
  results: BulkCreateResult[];
}

export interface UsersResponse {
  users: User[];
  totalCount: number;
}

export interface UsersParams {
  page?: number;
  pageSize?: number;
}

export function useUsers(params?: UsersParams) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return useQuery({
    queryKey: ["users", page, pageSize],
    queryFn: async () => {
      // Fetch profiles with kabupaten_kota
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          kabupaten_kota_id,
          is_profile_complete,
          created_at,
          kabupaten_kota:kabupaten_kota_id (
            id,
            name
          )
        `, { count: 'exact' })
        .or('registration_status.eq.approved,registration_status.is.null')
        .order("created_at", { ascending: false })
        .range(from, to);

      if (profilesError) throw profilesError;

      // Get total count
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: 'exact', head: true })
        .or('registration_status.eq.approved,registration_status.is.null');

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          kabupaten_kota_id: profile.kabupaten_kota_id,
          is_profile_complete: profile.is_profile_complete,
          created_at: profile.created_at,
          kabupaten_kota: profile.kabupaten_kota,
          role: userRole?.role as AppRole | null,
        };
      });

      return {
        users: usersWithRoles as User[],
        totalCount: count || 0,
      } as UsersResponse;
    },
  });
}

export function useKabupatenKota() {
  return useQuery({
    queryKey: ["kabupaten_kota"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kabupaten_kota")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("create-user", {
        body: userData,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserKabupatenKota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, kabupatenKotaId }: { userId: string; kabupatenKotaId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ kabupaten_kota_id: kabupatenKotaId })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("reset-user-password", {
        body: { user_id: userId, new_password: newPassword },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to reset password");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
  });
}

export function useUpdateUserEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newEmail }: { userId: string; newEmail: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("update-user-email", {
        body: { user_id: userId, new_email: newEmail },
      });

      if (response.error) {
        throw new Error(response.error.message || "Gagal update email");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkCreateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: BulkUserData[]): Promise<BulkCreateResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("create-users-bulk", {
        body: { users },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to bulk create users");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data as BulkCreateResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Export users to CSV
export function exportUsersToCSV(users: User[], filename: string = "users-export.csv") {
  const ROLE_LABELS: Record<string, string> = {
    admin_provinsi: "Admin Provinsi",
    admin_kab_kota: "Admin Kab/Kota",
    panitia: "Panitia",
    wasit: "Wasit",
    evaluator: "Evaluator",
  };

  // CSV Headers
  const headers = ["No", "Nama Lengkap", "Role", "Kabupaten/Kota", "Status Profil", "Tanggal Daftar"];
  
  // CSV Data rows
  const rows = users.map((user, index) => [
    index + 1,
    user.full_name || "-",
    user.role ? ROLE_LABELS[user.role] || user.role : "-",
    user.kabupaten_kota?.name || "-",
    user.is_profile_complete ? "Lengkap" : "Belum Lengkap",
    user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  // Add BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Filter users based on filters
export function filterUsers(users: User[], filters: UserExportFilters): User[] {
  return users.filter(user => {
    // Filter by role
    if (filters.role && user.role !== filters.role) {
      return false;
    }
    
    // Filter by kabupaten/kota
    if (filters.kabupatenKotaId && user.kabupaten_kota_id !== filters.kabupatenKotaId) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = user.full_name?.toLowerCase().includes(query);
      const matchesKabupaten = user.kabupaten_kota?.name?.toLowerCase().includes(query);
      if (!matchesName && !matchesKabupaten) {
        return false;
      }
    }
    
    return true;
  });
}

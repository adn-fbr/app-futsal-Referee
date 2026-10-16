import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminRefereeCount,
  getAdminReferees,
  getAllAdminReferees,
  type AdminReferee,
} from "@/repositories/admin-referee-directory";
import { toast } from "sonner";

export type Referee = AdminReferee;

export interface RefereeDetail {
  id: string;
  full_name: string;
  birth_date?: string | null;
  occupation?: string | null;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  provinsi_id: string | null;
  provinsi_name: string | null;
  afk_origin: string | null;
  license_level: string | null;
  license_expiry: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  is_profile_complete: boolean;
  registration_status?: string | null;
  created_at: string;
  updated_at: string | null;
  email: string | null;
  whatsapp_number?: string | null;
}

export interface RefereeFilters {
  licenseLevel?: string;
  isActive?: boolean;
  kabupatenKotaId?: string;
  search?: string;
   expiringInDays?: number;
  page?: number;
  pageSize?: number;
}

export function useReferees(filters?: RefereeFilters) {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const offset = (page - 1) * pageSize;

   const shouldFilterExpiring = filters?.expiringInDays !== undefined;

  return useQuery({
    queryKey: ["referees", filters],
    queryFn: async () => {
      const rpcFilters = {
        _license_level: filters?.licenseLevel || null,
        _is_active: filters?.isActive ?? null,
        _kabupaten_kota_id: filters?.kabupatenKotaId || null,
        _search: filters?.search || null,
      };
      let referees = shouldFilterExpiring
        ? await getAllAdminReferees(rpcFilters)
        : await getAdminReferees({ ...rpcFilters, _limit: pageSize, _offset: offset });

      if (shouldFilterExpiring && filters?.expiringInDays) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + filters.expiringInDays);
        referees = referees.filter((referee) => {
          if (!referee.license_expiry) return false;
          const expiryDate = new Date(referee.license_expiry);
          return expiryDate >= today && expiryDate <= futureDate;
        });
        referees = referees.slice(offset, offset + pageSize);
      }

      return referees;
    },
  });
}

export function useRefereesCount(filters?: Omit<RefereeFilters, 'page' | 'pageSize'>) {
   const shouldFilterExpiring = filters?.expiringInDays !== undefined;
   
  return useQuery({
    queryKey: ["referees-count", filters],
    queryFn: async () => {
      const rpcFilters = {
        _license_level: filters?.licenseLevel || undefined,
        _is_active: filters?.isActive,
        _kabupaten_kota_id: filters?.kabupatenKotaId || undefined,
        _search: filters?.search || undefined,
      };

      if (!shouldFilterExpiring || !filters?.expiringInDays) {
        return getAdminRefereeCount(rpcFilters);
      }

      const referees = await getAllAdminReferees(rpcFilters);
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + filters.expiringInDays);

      return referees.filter((referee) => {
        if (!referee.license_expiry) return false;
        const expiryDate = new Date(referee.license_expiry);
        return expiryDate >= today && expiryDate <= futureDate;
      }).length;
    },
  });
}

// Export referees to CSV
export function exportRefereesToCSV(referees: Referee[], filename: string = 'referees-export.csv') {
  const headers = [
    'Nama Lengkap',
    'Lisensi',
    'Kabupaten/Kota',
    'AFK Origin',
    'Status',
    'Tanggal Bergabung',
    'Tanggal Expired Lisensi',
  ];

  const rows = referees.map(ref => [
    ref.full_name,
    ref.license_level || '-',
    ref.kabupaten_kota_name || '-',
    ref.afk_origin || '-',
    ref.is_active ? 'Aktif' : 'Non-Aktif',
    ref.created_at ? new Date(ref.created_at).toLocaleDateString('id-ID') : '-',
    ref.license_expiry ? new Date(ref.license_expiry).toLocaleDateString('id-ID') : '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useReferee(id: string) {
  return useQuery({
    queryKey: ["referees", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_referee_detail", {
        p_referee_id: id,
      });

      if (error) throw error;

      return data as unknown as RefereeDetail;
    },
    enabled: !!id,
  });
}

export function useRefereeStats() {
  return useQuery({
    queryKey: ["referee-stats"],
    queryFn: async () => {
      const [total, active, inactive, level_1, level_2, level_3] = await Promise.all([
        getAdminRefereeCount(),
        getAdminRefereeCount({ _is_active: true }),
        getAdminRefereeCount({ _is_active: false }),
        getAdminRefereeCount({ _license_level: "Level_1" }),
        getAdminRefereeCount({ _license_level: "Level_2" }),
        getAdminRefereeCount({ _license_level: "Level_3" }),
      ]);

      return {
        total,
        active,
        inactive,
        level_1,
        level_2,
        level_3,
      };
    },
  });
}

const REFEREE_UPDATE_ALLOWLIST = new Set([
  "full_name",
  "birth_date",
  "afk_origin",
  "occupation",
]);

export function useUpdateReferee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      full_name?: string;
      birth_date?: string;
      kabupaten_kota_id?: string;
      license_level?: string;
      license_expiry?: string;
      afk_origin?: string;
      occupation?: string;
      is_active?: boolean;
    }) => {
      const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => REFEREE_UPDATE_ALLOWLIST.has(key)),
      );

      if (Object.keys(safeUpdates).length === 0) {
        throw new Error("Tidak ada field wasit yang diizinkan untuk diperbarui");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(safeUpdates)
        .eq("id", id)
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["referees", data.id] });
      queryClient.invalidateQueries({ queryKey: ["referee-stats"] });
      toast.success("Data wasit berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui data wasit: " + error.message);
    },
  });
}

export function useToggleRefereeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", id)
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["referees", data.id] });
      queryClient.invalidateQueries({ queryKey: ["referee-stats"] });
      toast.success(variables.isActive ? "Wasit diaktifkan" : "Wasit dinonaktifkan");
    },
    onError: (error) => {
      toast.error("Gagal mengubah status wasit: " + error.message);
    },
  });
}

// License level options
export const LICENSE_LEVELS = [
  { value: "level_1", label: "Level 1" },
  { value: "level_2", label: "Level 2" },
  { value: "level_3", label: "Level 3" },
];

export function getLicenseBadgeColor(level: string | null) {
  switch (level) {
    case "level_1":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "level_2":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "level_3":
      return "bg-green-100 text-green-800 border-green-200";    
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

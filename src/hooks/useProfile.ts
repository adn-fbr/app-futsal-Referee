import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  full_name: string;
  birth_date: string | null;
  afk_origin: string | null;
  occupation: string | null;
  kabupaten_kota_id: string | null;
  license_level: string | null;
  profile_photo_url: string | null;
  is_active?: boolean;
  is_profile_complete: boolean;
  registration_status?: string | null;
  created_at: string;
  updated_at: string;
}

const SELF_PROFILE_SELECT = [
  "id",
  "full_name",
  "birth_date",
  "occupation",
  "kabupaten_kota_id",
  "afk_origin",
  "license_level",
  "profile_photo_url",
  "is_active",
  "is_profile_complete",
  "registration_status",
  "created_at",
  "updated_at",
].join(", ");

const PROFILE_UPDATE_ALLOWLIST = new Set([
  "full_name",
  "birth_date",
  "occupation",
  "afk_origin",
  "profile_photo_url",
]);

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(SELF_PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("User not authenticated");

      const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => PROFILE_UPDATE_ALLOWLIST.has(key)),
      ) as Partial<Profile>;

      if (Object.keys(safeUpdates).length === 0) {
        throw new Error("Tidak ada field profil yang diizinkan untuk diperbarui");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(safeUpdates)
        .eq("id", user.id)
        .select(SELF_PROFILE_SELECT)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      refreshProfile();
      toast.success("Profil berhasil diperbarui");
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      toast.error("Profil gagal diperbarui. Silakan coba lagi.");
    },
  });
}

export async function uploadProfileImage(
  userId: string,
  file: File,
  bucket: "avatars" | "documents",
  type: "profile" | "license" | "ktp"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  
  return data.publicUrl;
}

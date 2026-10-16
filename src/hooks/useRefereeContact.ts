import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRefereeContactNumber } from "@/lib/refereeContact";

export interface RefereeContactRecord {
  id: string;
  referee_id: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
}

export function useRefereeContact() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referee-contact", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("referee_contacts")
        .select("id, referee_id, whatsapp_number, created_at, updated_at")
        .eq("referee_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as RefereeContactRecord | null) ?? null;
    },
    enabled: !!user,
  });
}

export function useUpsertRefereeContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { whatsapp_number: string }) => {
      if (!user) throw new Error("User not authenticated");

      const normalized = normalizeRefereeContactNumber(input.whatsapp_number);
      if (!normalized) {
        throw new Error("Masukkan nomor WhatsApp yang valid.");
      }

      const { data, error } = await supabase
        .from("referee_contacts")
        .upsert(
          {
            referee_id: user.id,
            whatsapp_number: normalized,
          },
          { onConflict: "referee_id", ignoreDuplicates: false },
        )
        .select("id, referee_id, whatsapp_number, created_at, updated_at")
        .single();

      if (error) throw error;
      return data as RefereeContactRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referee-contact", user?.id] });
    },
  });
}

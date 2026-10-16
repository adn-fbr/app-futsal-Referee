import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateBulkSettings, validateSettingValue } from "@/lib/settingsValidation";

export const PUBLIC_APPLICATION_SETTING_KEYS = [
  "app_name",
  "organization_name",
  "organization_phone",
  "organization_address",
  "organization_email",
  "association_email",
  "sender_email_name",
  "sender_email_address",
  "email_provider",
  "whatsapp_provider",
  "max_event_referees",
  "honor_base_amount",
] as const;

export type PublicApplicationSettingKey = (typeof PUBLIC_APPLICATION_SETTING_KEYS)[number];

interface PublicApplicationSetting {
  key: PublicApplicationSettingKey;
  value: string | null;
  created_at: string;
  updated_at: string;
}

const SECRET_SETTING_KEYS = new Set([
  "resend_api_key",
  "smtp_user",
  "smtp_password",
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "whatsapp_api_key",
  "whatsapp_base_url",
  "whatsapp_sender_number",
  "whatsapp_enabled",
]);

const ALLOWED_PUBLIC_KEYS = new Set<string>(PUBLIC_APPLICATION_SETTING_KEYS);

export function useSystemSettings() {
  return useQuery({
    queryKey: ["application-settings"],
    queryFn: async (): Promise<PublicApplicationSetting[]> => {
      const { data, error } = await supabase
        .from("public_application_settings")
        .select("key, value, created_at, updated_at")
        .in("key", [...PUBLIC_APPLICATION_SETTING_KEYS])
        .order("key");

      if (error) throw error;
      return (data ?? []) as PublicApplicationSetting[];
    },
  });
}

export function useSettingByKey(key: string) {
  return useQuery({
    queryKey: ["application-settings", key],
    queryFn: async (): Promise<PublicApplicationSetting | null> => {
      if (!ALLOWED_PUBLIC_KEYS.has(key) || SECRET_SETTING_KEYS.has(key)) {
        return null;
      }

      const { data, error } = await supabase
        .from("public_application_settings")
        .select("key, value, created_at, updated_at")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return (data as PublicApplicationSetting | null) ?? null;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const parsedKey = key.trim();
      if (!ALLOWED_PUBLIC_KEYS.has(parsedKey) || SECRET_SETTING_KEYS.has(parsedKey)) {
        throw new Error("Setting is not allowed through the public write boundary");
      }

      const parsedValue = validateSettingValue(parsedKey, value);
      if (!parsedValue.ok) {
        throw new Error(parsedValue.error);
      }

      const { data, error } = await supabase.functions.invoke("update-application-settings", {
        body: { settings: [{ key: parsedKey, value: parsedValue.value }] },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-settings"] });
      toast.success("Pengaturan berhasil disimpan");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Gagal menyimpan pengaturan");
    },
  });
}

export function useBulkUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      const validation = validateBulkSettings(settings);
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      const { data, error } = await supabase.functions.invoke("update-application-settings", {
        body: { settings: validation.normalized },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-settings"] });
      toast.success("Semua pengaturan berhasil disimpan");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    },
  });
}

export function useSettingsMap() {
  const { data: settings, ...rest } = useSystemSettings();

  const settingsMap = useMemo(() => {
    if (!settings) return null;
    return settings.reduce((acc, setting) => {
      if (ALLOWED_PUBLIC_KEYS.has(setting.key) && !SECRET_SETTING_KEYS.has(setting.key)) {
        acc[setting.key] = setting.value || "";
      }
      return acc;
    }, {} as Record<string, string>);
  }, [settings]);

  return { settingsMap, ...rest };
}

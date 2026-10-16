import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AdminRefereeRow = Database["public"]["Functions"]["get_admin_referees"]["Returns"][number];
export type AdminRefereeFilters = Database["public"]["Functions"]["get_admin_referees"]["Args"];
export type AdminReferee = AdminRefereeRow & { kabupaten_kota_name: string | null };

export async function getAdminReferees(filters: AdminRefereeFilters = {}): Promise<AdminReferee[]> {
  const { data, error } = await supabase.rpc("get_admin_referees", filters);
  if (error) throw error;

  const referees = data ?? [];
  const cityIds = [...new Set(referees.map((referee) => referee.kabupaten_kota_id))];
  if (cityIds.length === 0) {
    return referees.map((referee) => ({ ...referee, kabupaten_kota_name: null }));
  }

  const { data: cities, error: cityError } = await supabase
    .from("kabupaten_kota")
    .select("id, name")
    .in("id", cityIds);

  if (cityError) throw cityError;

  const cityNames = new Map((cities ?? []).map((city) => [city.id, city.name]));
  return referees.map((referee) => ({
    ...referee,
    kabupaten_kota_name: cityNames.get(referee.kabupaten_kota_id) ?? null,
  }));
}

export async function getAllAdminReferees(filters: AdminRefereeFilters = {}): Promise<AdminReferee[]> {
  const pageSize = 250;
  const referees: AdminReferee[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const page = await getAdminReferees({ ...filters, _limit: pageSize, _offset: offset });
    referees.push(...page);
    if (page.length < pageSize) return referees;
  }
}

export async function getAdminRefereeCount(filters: AdminRefereeFilters = {}): Promise<number> {
  const { data, error } = await supabase.rpc("get_admin_referee_count", {
    _is_active: filters._is_active,
    _kabupaten_kota_id: filters._kabupaten_kota_id,
    _license_level: filters._license_level,
    _search: filters._search,
  });

  if (error) throw error;
  return data ?? 0;
}
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Profile } from "./auth-types";

export interface UserProfileRepository {
  findByUserId(userId: string): Promise<{ profile: Profile | null; error: Error | null }>;
}

export class SupabaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByUserId(userId: string) {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, full_name, is_profile_complete, kabupaten_kota_id, registration_status, requested_role")
      .eq("id", userId)
      .maybeSingle();

    return {
      profile: data as Profile | null,
      error: error ? new Error(error.message) : null,
    };
  }
}

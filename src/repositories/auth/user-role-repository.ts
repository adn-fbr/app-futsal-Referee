import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isAppRole, type AppRole } from "./auth-types";

export interface UserRoleRepository {
  findRolesByUserId(userId: string): Promise<{ roles: AppRole[]; error: Error | null }>;
}

export class SupabaseUserRoleRepository implements UserRoleRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findRolesByUserId(userId: string) {
    const { data, error } = await this.client
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) return { roles: [], error: new Error(error.message) };

    const roles = [...new Set((data ?? []).map((row) => row.role).filter(isAppRole))];
    return { roles, error: null };
  }
}

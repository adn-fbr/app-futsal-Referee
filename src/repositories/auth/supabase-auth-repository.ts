import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AuthRepository } from "./auth-repository";

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    return { session: data.session, error: error ? new Error(error.message) : null };
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    return {
      user: data.user,
      session: data.session,
      error: error ? new Error(error.message) : null,
    };
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    return error ? new Error(error.message) : null;
  }

  onAuthStateChange(listener: Parameters<AuthRepository["onAuthStateChange"]>[0]) {
    return this.client.auth.onAuthStateChange(listener).data.subscription;
  }
}

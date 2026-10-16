import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

export type CanonicalRole =
  | "admin_provinsi"
  | "admin_kab_kota"
  | "panitia"
  | "wasit"
  | "evaluator";

export interface AuthorizedCaller {
  user: User;
  roles: CanonicalRole[];
  kabupatenKotaId: string | null;
}

export function getBearerToken(req: Request): string | null {
  const value = req.headers.get("Authorization");
  if (!value) return null;
  const match = value.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

export async function resolveCaller(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<AuthorizedCaller | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const [{ data: roleRows, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user.id),
    supabaseAdmin.from("profiles").select("kabupaten_kota_id").eq("id", data.user.id).maybeSingle(),
  ]);

  if (roleError || profileError) return null;

  const roles = (roleRows ?? [])
    .map((row) => row.role)
    .filter((role): role is CanonicalRole =>
      role === "admin_provinsi" ||
      role === "admin_kab_kota" ||
      role === "panitia" ||
      role === "wasit" ||
      role === "evaluator"
    );

  return {
    user: data.user,
    roles,
    kabupatenKotaId: profile?.kabupaten_kota_id ?? null,
  };
}

export function hasAnyRole(caller: AuthorizedCaller, allowedRoles: CanonicalRole[]): boolean {
  return allowedRoles.some((role) => caller.roles.includes(role));
}

import type { Session, User } from "@supabase/supabase-js";

// Exactly mirrors public.app_role in CANONICAL-RUNTIME-BASELINE.sql.
export const APP_ROLES = [
  "admin_provinsi",
  "admin_kab_kota",
  "panitia",
  "wasit",
  "evaluator",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const isAppRole = (value: unknown): value is AppRole =>
  typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);

export type Profile = {
  id: string;
  full_name: string;
  is_profile_complete: boolean | null;
  kabupaten_kota_id: string | null;
  registration_status: string | null;
  requested_role: string | null;
};

export type ProfileResolution =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; profile: Profile }
  | { status: "missing" }
  | { status: "error"; message: string };

export type RoleResolution =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; roles: AppRole[] }
  | { status: "error"; message: string };

export type AuthSnapshot = {
  user: User | null;
  session: Session | null;
};

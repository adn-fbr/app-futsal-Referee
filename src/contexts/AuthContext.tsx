import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logAuthAudit, logAuthEvent } from "@/lib/authAudit";
import {
  type AppRole,
  type Profile,
  type ProfileResolution,
  type RoleResolution,
} from "@/repositories/auth/auth-types";
import { SupabaseAuthRepository } from "@/repositories/auth/supabase-auth-repository";
import { SupabaseUserProfileRepository } from "@/repositories/auth/user-profile-repository";
import { SupabaseUserRoleRepository } from "@/repositories/auth/user-role-repository";

export type { AppRole } from "@/repositories/auth/auth-types";
export type RegistrationStatus = "pending" | "approved" | "rejected" | null;

const rolePrecedence: readonly AppRole[] = ["admin_provinsi", "admin_kab_kota", "evaluator", "panitia", "wasit"];
const authRepository = new SupabaseAuthRepository(supabase);
const profileRepository = new SupabaseUserProfileRepository(supabase);
const roleRepository = new SupabaseUserRoleRepository(supabase);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  profile: Profile | null;
  profileResolution: ProfileResolution;
  roleResolution: RoleResolution;
  roles: AppRole[];
  role: AppRole | null;
  isProfileComplete: boolean;
  kabupatenKotaId: string | null;
  registrationStatus: RegistrationStatus;
  requestedRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (requiredRole: AppRole) => boolean;
  hasAnyRole: (requiredRoles: readonly AppRole[]) => boolean;
  hasAllRoles: (requiredRoles: readonly AppRole[]) => boolean;
  isAdmin: () => boolean;
  isAdminProvinsi: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const emptyProfile: ProfileResolution = { status: "idle" };
const emptyRoles: RoleResolution = { status: "idle" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileResolution, setProfileResolution] = useState<ProfileResolution>(emptyProfile);
  const [roleResolution, setRoleResolution] = useState<RoleResolution>(emptyRoles);
  const requestId = useRef(0);

  const clearResolvedState = useCallback(() => {
    setProfileResolution(emptyProfile);
    setRoleResolution(emptyRoles);
  }, []);

  const resolveUser = useCallback(async (nextUser: User, request: number) => {
    setProfileResolution({ status: "loading" });
    setRoleResolution({ status: "loading" });
    const [profileResult, roleResult] = await Promise.all([
      profileRepository.findByUserId(nextUser.id),
      roleRepository.findRolesByUserId(nextUser.id),
    ]);
    if (request !== requestId.current) return;
    setProfileResolution(profileResult.error ? { status: "error", message: profileResult.error.message } : profileResult.profile ? { status: "ready", profile: profileResult.profile } : { status: "missing" });
    setRoleResolution(roleResult.error ? { status: "error", message: roleResult.error.message } : { status: "ready", roles: roleResult.roles });
    setIsLoading(false);
  }, []);

  const establishSession = useCallback(async (nextSession: Session | null) => {
    const request = ++requestId.current;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setAuthError(null);
    if (!nextSession?.user) {
      clearResolvedState();
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await resolveUser(nextSession.user, request);
    } catch {
      if (request !== requestId.current) return;
      setAuthError("Tidak dapat memulihkan konteks autentikasi.");
      setProfileResolution({ status: "error", message: "Profile tidak dapat dimuat." });
      setRoleResolution({ status: "error", message: "Role tidak dapat dimuat." });
      setIsLoading(false);
    }
  }, [clearResolvedState, resolveUser]);

  useEffect(() => {
    let active = true;
    const subscription = authRepository.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === "SIGNED_IN" && nextSession?.user) {
        void logAuthEvent({ event: "AUTH_LOGIN", success: true, userId: nextSession.user.id });
        void logAuthAudit({ action: "AUTH_LOGIN", userId: nextSession.user.id });
      }
      window.setTimeout(() => {
        if (active) void establishSession(nextSession);
      }, 0);
    });
    void authRepository.getSession().then(({ session: restoredSession, error }) => {
      if (!active) return;
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
      void establishSession(restoredSession);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [establishSession]);

  const roles = useMemo(
    () => (roleResolution.status === "ready" ? roleResolution.roles : []),
    [roleResolution],
  );
  const role = rolePrecedence.find((candidate) => roles.includes(candidate)) ?? null;
  const profile = profileResolution.status === "ready" ? profileResolution.profile : null;
  const isProfileComplete = profile?.is_profile_complete === true;
  const kabupatenKotaId = profile?.kabupaten_kota_id ?? null;
  const registrationStatus = (profile?.registration_status ?? null) as RegistrationStatus;
  const requestedRole = profile?.requested_role ?? null;

  const value = useMemo<AuthContextType>(() => {
    const hasRole = (requiredRole: AppRole) => roles.includes(requiredRole);
    const hasAnyRole = (requiredRoles: readonly AppRole[]) => requiredRoles.some(hasRole);
    const hasAllRoles = (requiredRoles: readonly AppRole[]) => requiredRoles.every(hasRole);
    return {
      user, session, isAuthenticated: Boolean(user && session), isLoading, authError, profile, profileResolution, roleResolution, roles, role,
      isProfileComplete, kabupatenKotaId, registrationStatus, requestedRole,
      async signIn(email, password) {
        const result = await authRepository.signInWithPassword(email, password);
        return { error: result.error };
      },
      async signOut() {
        if (user?.id) {
          void logAuthEvent({ event: "AUTH_LOGOUT", success: true, userId: user.id });
          void logAuthAudit({ action: "AUTH_LOGOUT", userId: user.id });
        }
        const error = await authRepository.signOut();
        if (error) throw error;
        await establishSession(null);
      },
      async refreshProfile() {
        if (user) await establishSession(session);
      },
      hasRole, hasAnyRole, hasAllRoles,
      isAdmin: () => hasAnyRole(["admin_provinsi", "admin_kab_kota"]),
      isAdminProvinsi: () => hasRole("admin_provinsi"),
    };
  }, [authError, establishSession, isLoading, isProfileComplete, kabupatenKotaId, profile, profileResolution, registrationStatus, requestedRole, role, roleResolution, roles, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

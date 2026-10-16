import type { AppRole, ProfileResolution, RoleResolution } from "./auth-types";

export type RouteAuthorizationInput = {
  hasSession: boolean;
  isLoading: boolean;
  profileResolution: ProfileResolution;
  roleResolution: RoleResolution;
  roles: readonly AppRole[];
  requiredRoles?: readonly AppRole[];
};

export type RouteAuthorizationDecision =
  | "loading"
  | "login"
  | "profile_missing"
  | "authorization_error"
  | "forbidden"
  | "allow";

export function getRouteAuthorizationDecision({
  hasSession,
  isLoading,
  profileResolution,
  roleResolution,
  roles,
  requiredRoles,
}: RouteAuthorizationInput): RouteAuthorizationDecision {
  if (isLoading) return "loading";
  if (!hasSession) return "login";
  if (profileResolution.status === "error" || roleResolution.status === "error") {
    return "authorization_error";
  }
  if (profileResolution.status === "missing") return "profile_missing";
  if (requiredRoles && !requiredRoles.some((role) => roles.includes(role))) {
    return "forbidden";
  }
  return "allow";
}

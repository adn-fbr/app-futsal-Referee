import { describe, expect, it } from "vitest";
import { getRouteAuthorizationDecision } from "./authorization";

const profileReady = {
  status: "ready" as const,
  profile: {
    id: "user-1",
    full_name: "Test User",
    is_profile_complete: true,
    kabupaten_kota_id: null,
    registration_status: "approved",
    requested_role: null,
  },
};
const rolesReady = { status: "ready" as const, roles: ["wasit"] as const };

describe("route authorization", () => {
  it("allows a public route before authentication has resolved", () => {
    expect(getRouteAuthorizationDecision({
      hasSession: false,
      isLoading: false,
      profileResolution: { status: "idle" },
      roleResolution: { status: "idle" },
      roles: [],
    })).toBe("login");
  });

  it("blocks protected content while authentication is loading", () => {
    expect(getRouteAuthorizationDecision({
      hasSession: true, isLoading: true, profileResolution: profileReady, roleResolution: rolesReady, roles: ["wasit"],
    })).toBe("loading");
  });

  it("allows a role-protected route for an assigned role", () => {
    expect(getRouteAuthorizationDecision({
      hasSession: true, isLoading: false, profileResolution: profileReady, roleResolution: rolesReady, roles: ["wasit"], requiredRoles: ["wasit"],
    })).toBe("allow");
  });

  it("denies a role-protected route for an unassigned role", () => {
    expect(getRouteAuthorizationDecision({
      hasSession: true, isLoading: false, profileResolution: profileReady, roleResolution: rolesReady, roles: ["wasit"], requiredRoles: ["admin_provinsi"],
    })).toBe("forbidden");
  });

  it("handles missing profiles and repository failures explicitly", () => {
    expect(getRouteAuthorizationDecision({
      hasSession: true, isLoading: false, profileResolution: { status: "missing" }, roleResolution: rolesReady, roles: ["wasit"],
    })).toBe("profile_missing");
    expect(getRouteAuthorizationDecision({
      hasSession: true, isLoading: false, profileResolution: profileReady, roleResolution: { status: "error", message: "RLS denied" }, roles: [],
    })).toBe("authorization_error");
  });
});

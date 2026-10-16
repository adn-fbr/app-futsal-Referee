import { describe, expect, it } from "vitest";
import { SupabaseAuthRepository } from "./supabase-auth-repository";
import { SupabaseUserProfileRepository } from "./user-profile-repository";
import { SupabaseUserRoleRepository } from "./user-role-repository";

const asClient = <T>(value: T) => value as never;

describe("Supabase Auth repository", () => {
  it("restores sessions, reports login failure, and signs out through Auth APIs", async () => {
    let signedOut = false;
    const client = asClient({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } }),
        signOut: async () => { signedOut = true; return { error: null }; },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
    });
    const repository = new SupabaseAuthRepository(client);
    await expect(repository.getSession()).resolves.toEqual({ session: null, error: null });
    await expect(repository.signInWithPassword("user@example.test", "bad-password")).resolves.toMatchObject({ error: expect.any(Error) });
    await expect(repository.signOut()).resolves.toBeNull();
    expect(signedOut).toBe(true);
  });
});

describe("Profile and role repositories", () => {
  it("resolves a profile, exposes a missing profile, and returns query failures", async () => {
    const profile = {
      id: "user-1", full_name: "Test User", is_profile_complete: false,
      kabupaten_kota_id: null, registration_status: "pending", requested_role: "wasit",
    };
    const profileClient = asClient({
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }),
      }),
    });
    await expect(new SupabaseUserProfileRepository(profileClient).findByUserId("user-1")).resolves.toEqual({ profile, error: null });

    const missingClient = asClient({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    });
    await expect(new SupabaseUserProfileRepository(missingClient).findByUserId("user-1")).resolves.toEqual({ profile: null, error: null });

    const failingClient = asClient({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: "RLS denied" } }) }) }) }),
    });
    await expect(new SupabaseUserProfileRepository(failingClient).findByUserId("user-1")).resolves.toMatchObject({ profile: null, error: expect.any(Error) });
  });

  it("keeps only baseline roles and supports multiple role resolution", async () => {
    const client = asClient({
      from: () => ({
        select: () => ({ eq: async () => ({ data: [{ role: "wasit" }, { role: "admin_provinsi" }, { role: "referee" }], error: null }) }),
      }),
    });
    await expect(new SupabaseUserRoleRepository(client).findRolesByUserId("user-1")).resolves.toEqual({
      roles: ["wasit", "admin_provinsi"],
      error: null,
    });
  });
});

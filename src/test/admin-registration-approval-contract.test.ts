import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeRegistrationApprovalRole,
  approveRegistrationWithRpc,
  rejectRegistrationWithRpc,
} from "../hooks/useRegistrations";

describe("admin registration approval contract", () => {
  it("accepts only the explicit role values that can be granted by admins", () => {
    expect(normalizeRegistrationApprovalRole("wasit")).toBe("wasit");
    expect(normalizeRegistrationApprovalRole("panitia")).toBe("panitia");
    expect(() => normalizeRegistrationApprovalRole("admin_provinsi")).toThrow(
      "Peran yang dipilih tidak valid"
    );
  });

  it("routes approval through the backend authorization and approval RPCs", async () => {
    const calls: Array<[string, Record<string, unknown> | undefined]> = [];
    const rpc = async (name: string, args?: Record<string, unknown>) => {
      calls.push([name, args]);
      if (name === "can_approve_registration") {
        return { data: true, error: null };
      }
      return { data: { ok: true }, error: null };
    };

    await approveRegistrationWithRpc(rpc as any, {
      adminId: "admin-1",
      userId: "user-1",
      role: "panitia",
    });

    expect(calls).toEqual([
      ["can_approve_registration", { _user_id: "user-1" }],
      ["approve_registration", { _user_id: "user-1", _role: "panitia" }],
    ]);
  });

  it("routes rejection through the backend authorization and rejection RPCs", async () => {
    const calls: Array<[string, Record<string, unknown> | undefined]> = [];
    const rpc = async (name: string, args?: Record<string, unknown>) => {
      calls.push([name, args]);
      if (name === "can_approve_registration") {
        return { data: true, error: null };
      }
      return { data: { ok: true }, error: null };
    };

    await rejectRegistrationWithRpc(rpc as any, {
      adminId: "admin-1",
      userId: "user-1",
      reason: "Data tidak lengkap",
    });

    expect(calls).toEqual([
      ["can_approve_registration", { _user_id: "user-1" }],
      ["reject_registration", { _user_id: "user-1", _reason: "Data tidak lengkap" }],
    ]);
  });

  it("does not send a client-supplied admin identifier to the authorization RPC", async () => {
    const calls: Array<[string, Record<string, unknown> | undefined]> = [];
    const rpc = async (name: string, args?: Record<string, unknown>) => {
      calls.push([name, args]);
      if (name === "can_approve_registration") {
        return { data: true, error: null };
      }
      return { data: { ok: true }, error: null };
    };

    await approveRegistrationWithRpc(rpc as any, {
      userId: "user-1",
      role: "panitia",
    } as any);

    expect(calls[0][1]).toEqual({ _user_id: "user-1" });
    expect(calls[0][1]).not.toHaveProperty("_admin_id");
  });

  it("requires explicit self-profile projection and field allowlist instead of wildcard access", () => {
    const profileSource = readFileSync("src/hooks/useProfile.ts", "utf8");

    expect(profileSource).not.toContain('select("*")');
    expect(profileSource).toContain("full_name");
    expect(profileSource).toContain("birth_date");
    expect(profileSource).not.toContain("license_photo_url");
  });
});

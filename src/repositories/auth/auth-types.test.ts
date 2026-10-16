import { describe, expect, it } from "vitest";
import { APP_ROLES, isAppRole } from "./auth-types";

describe("Production role contract", () => {
  it("accepts exactly the roles verified in public.app_role", () => {
    expect(APP_ROLES).toEqual([
      "admin_provinsi",
      "admin_kab_kota",
      "panitia",
      "wasit",
      "evaluator",
    ]);
  });

  it("does not accept stale or fabricated roles", () => {
    expect(isAppRole("admin")).toBe(false);
    expect(isAppRole("referee")).toBe(false);
    expect(isAppRole("organization_admin")).toBe(false);
    expect(isAppRole("wasit")).toBe(true);
  });
});

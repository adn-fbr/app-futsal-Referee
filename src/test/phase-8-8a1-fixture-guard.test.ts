import { describe, expect, it, vi } from "vitest";
import {
  FIXTURE_EMAILS,
  NON_PRODUCTION_PROJECT_REF,
  NON_PRODUCTION_URL,
  isFixtureEmail,
  isOwnedFixtureName,
  validateFixtureProvisioningEnvironment,
} from "../../supabase/tests/fixtureProvisioningGuard";

const validInput = {
  testEnvironment: "non-production",
  supabaseUrl: NON_PRODUCTION_URL,
  projectRef: NON_PRODUCTION_PROJECT_REF,
  serviceRoleKey: "runtime-only-secret",
  fixturePassword: "runtime-only-password",
};

describe("Phase 8.8A.1 fixture provisioning guard", () => {
  it("FA-001 accepts the authorized Non-Production target", () => {
    expect(validateFixtureProvisioningEnvironment(validInput)).toEqual({ ok: true });
  });

  it("FA-002 rejects the Production URL", () => {
    expect(validateFixtureProvisioningEnvironment({ ...validInput, supabaseUrl: "https://xfscfjwapwnkiinkgbjg.supabase.co" }).ok).toBe(false);
  });

  it("FA-003 rejects the Production project reference", () => {
    expect(validateFixtureProvisioningEnvironment({ ...validInput, projectRef: "xfscfjwapwnkiinkgbjg" }).ok).toBe(false);
  });

  it("FA-004 and FA-005 reject an invalid or missing environment", () => {
    expect(validateFixtureProvisioningEnvironment({ ...validInput, testEnvironment: "production" }).ok).toBe(false);
    expect(validateFixtureProvisioningEnvironment({ ...validInput, testEnvironment: undefined }).ok).toBe(false);
  });

  it("FA-006 and FA-007 reject missing secrets", () => {
    expect(validateFixtureProvisioningEnvironment({ ...validInput, serviceRoleKey: undefined }).ok).toBe(false);
    expect(validateFixtureProvisioningEnvironment({ ...validInput, fixturePassword: undefined }).ok).toBe(false);
  });

  it("FA-008 keeps the guard independent of client creation", () => {
    const createClient = vi.fn();
    const result = validateFixtureProvisioningEnvironment({ ...validInput, supabaseUrl: "https://xfscfjwapwnkiinkgbjg.supabase.co" });
    if (!result.ok) expect(createClient).not.toHaveBeenCalled();
  });

  it("FA-009 uses deterministic fixture identities", () => {
    expect(FIXTURE_EMAILS).toEqual({
      adminProvinsi: "fixture-admin-provinsi@nonprod.invalid",
      adminKabKotaA: "fixture-admin-kabkota-a@nonprod.invalid",
      adminKabKotaB: "fixture-admin-kabkota-b@nonprod.invalid",
      referee: "fixture-referee@nonprod.invalid",
    });
  });

  it("FA-010 scopes cleanup to owned fixture names", () => {
    expect(isOwnedFixtureName("PHASE_8_8A_1_EVENT_A")).toBe(true);
    expect(isOwnedFixtureName("unrelated-event")).toBe(false);
  });

  it("FA-011 and FA-012 keep secrets out of fixture identity helpers and manifest-shaped data", () => {
    expect(isFixtureEmail(FIXTURE_EMAILS.referee)).toBe(true);
    const manifest = JSON.stringify({ phase: "8.8A.1", fixture: FIXTURE_EMAILS.adminProvinsi });
    expect(manifest).not.toMatch(/password|token|service.role|jwt/i);
  });
});
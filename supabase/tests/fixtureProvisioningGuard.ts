export const NON_PRODUCTION_PROJECT_REF = "shorsqyycpptxcutrqrb";
export const PRODUCTION_PROJECT_REF = "xfscfjwapwnkiinkgbjg";
export const NON_PRODUCTION_URL = `https://${NON_PRODUCTION_PROJECT_REF}.supabase.co`;

export const FIXTURE_EMAILS = {
  adminProvinsi: "fixture-admin-provinsi@nonprod.invalid",
  adminKabKotaA: "fixture-admin-kabkota-a@nonprod.invalid",
  adminKabKotaB: "fixture-admin-kabkota-b@nonprod.invalid",
  referee: "fixture-referee@nonprod.invalid",
} as const;

export type FixtureGuardInput = {
  testEnvironment?: string;
  supabaseUrl?: string;
  projectRef?: string;
  serviceRoleKey?: string;
  fixturePassword?: string;
};

export type FixtureGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateFixtureProvisioningEnvironment(input: FixtureGuardInput): FixtureGuardResult {
  if (input.testEnvironment !== "non-production") {
    return { ok: false, reason: "TEST_ENVIRONMENT must equal non-production" };
  }

  if (input.supabaseUrl !== NON_PRODUCTION_URL || input.supabaseUrl.includes(PRODUCTION_PROJECT_REF)) {
    return { ok: false, reason: "SUPABASE_URL is not the authorized Non-Production URL" };
  }

  if (input.projectRef !== NON_PRODUCTION_PROJECT_REF || input.projectRef.includes(PRODUCTION_PROJECT_REF)) {
    return { ok: false, reason: "PROJECT_REF is not the authorized Non-Production project" };
  }

  if (!input.serviceRoleKey) {
    return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY is required" };
  }

  if (!input.fixturePassword) {
    return { ok: false, reason: "FIXTURE_ADMIN_PASSWORD is required" };
  }

  return { ok: true };
}

export function isFixtureEmail(email: string): boolean {
  return Object.values(FIXTURE_EMAILS).includes(email as (typeof FIXTURE_EMAILS)[keyof typeof FIXTURE_EMAILS]);
}

export function isOwnedFixtureName(name: string): boolean {
  return name === "PHASE_8_8A_1_EVENT_A" || name === "PHASE_8_8A_1_EVENT_B";
}
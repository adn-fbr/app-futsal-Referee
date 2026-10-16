import { createClient } from "npm:@supabase/supabase-js@2";
import { validateFixtureProvisioningEnvironment } from "./fixtureProvisioningGuard.ts";

const fixturePhase = "8.8A.1B";
const fixtureEventNames = {
  regionA: "PHASE_8_8A_1B_EVENT_REGION_A",
  regionB: "PHASE_8_8A_1B_EVENT_REGION_B",
};

const guard = validateFixtureProvisioningEnvironment({
  testEnvironment: Deno.env.get("TEST_ENVIRONMENT"),
  supabaseUrl: Deno.env.get("SUPABASE_URL"),
  projectRef: Deno.env.get("SUPABASE_PROJECT_REF"),
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  fixturePassword: Deno.env.get("FIXTURE_ADMIN_PASSWORD"),
});

if (!guard.ok) {
  throw new Error(`BLOCKED — NON-PRODUCTION SYNTHETIC FIXTURE PROVISIONING BLOCKED: ${guard.reason}`);
}

if (Deno.args.includes("--dry-run")) {
  console.log(JSON.stringify({
    status: "READY_FOR_NON_PRODUCTION_PROVISIONING",
    test_environment: "non-production",
    project_ref: "shorsqyycpptxcutrqrb",
    supabase_url: "NON_PRODUCTION",
    service_role_key: "PRESENT",
    fixture_password: "PRESENT",
    network_requests: 0,
    mutations: 0,
  }));
  Deno.exit(0);
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const fixturePassword = Deno.env.get("FIXTURE_ADMIN_PASSWORD")!;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type FixtureUser = { key: string; email: string; fullName: string; role: "admin_provinsi" | "admin_kab_kota" | "wasit"; regionId?: string };
type Region = { id: string; name: string; provinsi_id: string | null };

async function findAuthUser(email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 100) break;
  }
  return null;
}

async function ensureAuthUser(email: string) {
  const existing = await findAuthUser(email);
  if (existing) return { user: existing, created: false };
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: fixturePassword,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Auth Admin did not return a user");
  return { user: data.user, created: true };
}

async function ensureProfile(user: FixtureUser) {
  const { data: existing, error: selectError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.key)
    .maybeSingle();
  if (selectError) throw selectError;
  const profile = {
    id: user.key,
    full_name: user.fullName,
    email: user.email,
    kabupaten_kota_id: user.regionId ?? null,
    is_active: true,
    is_profile_complete: true,
    registration_status: "approved",
  };
  if (existing) {
    const { error } = await admin.from("profiles").update(profile).eq("id", user.key);
    if (error) throw error;
    return false;
  }
  const { error } = await admin.from("profiles").insert(profile);
  if (error) throw error;
  return true;
}

async function ensureRole(userId: string, email: string, role: FixtureUser["role"]) {
  const { data: existing, error: selectError } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) {
    const { error } = await admin.from("user_roles").update({ email, role }).eq("id", existing.id);
    if (error) throw error;
    return false;
  }
  const { error } = await admin.from("user_roles").insert({ user_id: userId, email, role });
  if (error) throw error;
  return true;
}

async function ensureEvent(name: string, regionId: string, createdBy: string, date: string) {
  const { data: existing, error: selectError } = await admin
    .from("events")
    .select("id, kabupaten_kota_id")
    .eq("name", name)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) {
    if (existing.kabupaten_kota_id !== regionId) throw new Error(`Fixture event region mismatch for ${name}`);
    return { id: existing.id, created: false };
  }
  const { data, error } = await admin.from("events").insert({
    name,
    date,
    start_date: date,
    end_date: date,
    status: "DIAJUKAN",
    category: "PHASE_8_8A_1B",
    description: "Non-Production synthetic fixture",
    kabupaten_kota_id: regionId,
    created_by: createdBy,
  }).select("id").single();
  if (error || !data) throw error ?? new Error(`Event creation returned no row for ${name}`);
  return { id: data.id, created: true };
}

async function ensureAssignment(eventId: string, refereeId: string) {
  const { data: existing, error: selectError } = await admin
    .from("event_assignments")
    .select("id, referee_id, status")
    .eq("event_id", eventId)
    .eq("referee_id", refereeId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return { id: existing.id, created: false };
  const { data, error } = await admin.from("event_assignments").insert({
    event_id: eventId,
    referee_id: refereeId,
    status: "pending",
    role: "referee",
  }).select("id").single();
  if (error || !data) throw error ?? new Error("Assignment creation returned no row");
  return { id: data.id, created: true };
}

const { data: regions, error: regionError } = await admin
  .from("kabupaten_kota")
  .select("id, name, provinsi_id")
  .not("provinsi_id", "is", null)
  .order("name")
  .limit(2);
if (regionError) throw regionError;
if (!regions || regions.length < 2 || regions[0].id === regions[1].id) {
  throw new Error("BLOCKED — at least two existing canonical Non-Production regions are required");
}

const regionA = regions[0] as Region;
const regionB = regions[1] as Region;
const users: FixtureUser[] = [
  { key: "", email: "fixture-admin-provinsi@nonprod.invalid", fullName: "Fixture Admin Provinsi", role: "admin_provinsi" },
  { key: "", email: "fixture-admin-kabkota-a@nonprod.invalid", fullName: "Fixture Admin Kab/Kota A", role: "admin_kab_kota", regionId: regionA.id },
  { key: "", email: "fixture-admin-kabkota-b@nonprod.invalid", fullName: "Fixture Admin Kab/Kota B", role: "admin_kab_kota", regionId: regionB.id },
  { key: "", email: "fixture-referee@nonprod.invalid", fullName: "Fixture Referee", role: "wasit", regionId: regionA.id },
];

const authResults = [];
const profileMutations = { created: 0, updated: 0 };
const roleMutations = { created: 0, updated: 0 };
for (const fixtureUser of users) {
  const auth = await ensureAuthUser(fixtureUser.email);
  fixtureUser.key = auth.user.id;
  authResults.push({ key: fixtureUser.email, userId: auth.user.id, created: auth.created });
  if (await ensureProfile(fixtureUser)) profileMutations.created += 1;
  else profileMutations.updated += 1;
  if (await ensureRole(fixtureUser.key, fixtureUser.email, fixtureUser.role)) roleMutations.created += 1;
  else roleMutations.updated += 1;
}

const adminProvinsi = users[0].key;
const referee = users[3].key;
const eventA = await ensureEvent(fixtureEventNames.regionA, regionA.id, adminProvinsi, "2026-09-20");
const eventB = await ensureEvent(fixtureEventNames.regionB, regionB.id, adminProvinsi, "2026-09-21");
const assignmentA = await ensureAssignment(eventA.id, referee);
const assignmentB = await ensureAssignment(eventB.id, referee);

const manifest = {
  phase: fixturePhase,
  environment: "non-production",
  project_ref: "shorsqyycpptxcutrqrb",
  users: Object.fromEntries(authResults.map((result) => [result.key, result.userId])),
  roles: Object.fromEntries(users.map((user) => [user.email, user.role])),
  regions: { region_a: regionA.id, region_b: regionB.id },
  events: { event_region_a: eventA.id, event_region_b: eventB.id },
  assignments: { assignment_a: assignmentA.id, assignment_b: assignmentB.id },
  mutation_counts: {
    auth_users_created: authResults.filter((result) => result.created).length,
    profiles_created: profileMutations.created,
    profiles_updated: profileMutations.updated,
    roles_created: roleMutations.created,
    roles_updated: roleMutations.updated,
    events_created: Number(eventA.created) + Number(eventB.created),
    assignments_created: Number(assignmentA.created) + Number(assignmentB.created),
  },
};
await Deno.writeTextFile("docs/PHASE-8.8A.1B-FIXTURE-MANIFEST.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ...manifest, service_role_key: "PRESENT", fixture_password: "PRESENT" }, null, 2));

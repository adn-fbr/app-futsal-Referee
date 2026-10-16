import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { assert, assertEquals } from "jsr:@std/assert@1";

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TEST_USER_A_EMAIL",
  "TEST_USER_A_PASSWORD",
  "TEST_USER_B_EMAIL",
  "TEST_USER_B_PASSWORD",
  "TEST_EVENT_A_ID",
  "TEST_EVENT_B_ID",
];
const configured = required.every((name) => Boolean(Deno.env.get(name)));

async function signedInClient(emailName: string, passwordName: string): Promise<SupabaseClient> {
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { error } = await client.auth.signInWithPassword({
    email: Deno.env.get(emailName)!,
    password: Deno.env.get(passwordName)!,
  });
  if (error) throw error;
  return client;
}

async function assertDenied(operation: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await operation;
  assert(Boolean(error) || (Array.isArray(data) && data.length === 0), "Expected operation to be denied");
}

Deno.test({
  name: "AUTH-004/IDOR: tenant A cannot select tenant B event",
  ignore: !configured,
  fn: async () => {
    const client = await signedInClient("TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD");
    const { data, error } = await client
      .from("events")
      .select("id")
      .eq("id", Deno.env.get("TEST_EVENT_B_ID")!);
    assert(!error);
    assertEquals(data, []);
  },
});

Deno.test({
  name: "AUTH-005: tenant A cannot insert a tenant B event",
  ignore: !configured,
  fn: async () => {
    const client = await signedInClient("TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD");
    await assertDenied(client.from("events").insert({
      name: "SECURITY_TEST_FORBIDDEN_INSERT",
      date: "2099-02-01",
      kabupaten_kota_id: Deno.env.get("TEST_TENANT_B")!,
      created_by: Deno.env.get("TEST_USER_B")!,
    }).select());
  },
});

Deno.test({
  name: "AUTH-006: tenant A cannot update a tenant B event",
  ignore: !configured,
  fn: async () => {
    const client = await signedInClient("TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD");
    await assertDenied(client.from("events")
      .update({ description: "forbidden" })
      .eq("id", Deno.env.get("TEST_EVENT_B_ID")!)
      .select());
  },
});

Deno.test({
  name: "AUTH-007: tenant A cannot delete a tenant B event",
  ignore: !configured,
  fn: async () => {
    const client = await signedInClient("TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD");
    await assertDenied(client.from("events")
      .delete()
      .eq("id", Deno.env.get("TEST_EVENT_B_ID")!)
      .select());
  },
});

Deno.test({
  name: "AUTH-010: client cannot override tenant or identity",
  ignore: !configured,
  fn: async () => {
    const client = await signedInClient("TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD");
    const { data: sessionData } = await client.auth.getUser();
    assertEquals(sessionData.user?.id, Deno.env.get("TEST_USER_A")!);
    await assertDenied(client.from("events").insert({
      name: "SECURITY_TEST_SPOOF",
      date: "2099-03-01",
      kabupaten_kota_id: Deno.env.get("TEST_TENANT_B")!,
      created_by: Deno.env.get("TEST_USER_B")!,
    }).select());
  },
});

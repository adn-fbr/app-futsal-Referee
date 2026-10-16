import { assert, assertEquals } from "@std/assert";
import { getBearerToken, hasAnyRole, type AuthorizedCaller } from "./authorization.ts";

Deno.test("authorization rejects missing and malformed bearer tokens", () => {
  assertEquals(getBearerToken(new Request("http://localhost")), null);
  assertEquals(
    getBearerToken(new Request("http://localhost", { headers: { Authorization: "Basic token" } })),
    null,
  );
  assertEquals(
    getBearerToken(new Request("http://localhost", { headers: { Authorization: "Bearer token extra" } })),
    null,
  );
});

Deno.test("authorization extracts only a bearer token", () => {
  assertEquals(
    getBearerToken(new Request("http://localhost", { headers: { Authorization: "Bearer valid-token" } })),
    "valid-token",
  );
});

Deno.test("authorization checks canonical roles without trusting client role input", () => {
  const caller: AuthorizedCaller = {
    user: { id: "server-user" } as AuthorizedCaller["user"],
    roles: ["admin_kab_kota"],
    kabupatenKotaId: "tenant-a",
  };

  assert(hasAnyRole(caller, ["admin_kab_kota"]));
  assert(!hasAnyRole(caller, ["admin_provinsi"]));
  assertEquals(caller.user.id, "server-user");
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const hookSource = readFileSync(`${root}/src/hooks/useAdminEventAssignments.ts`, "utf8");
const pageSource = readFileSync(`${root}/src/pages/AdminEventAssignments.tsx`, "utf8");

const statuses = ["pending", "confirmed", "declined", "cancelled"] as const;

describe("Phase 8.5G event assignment region and status contract", () => {
  it("resolves region through events.kabupaten_kota_id", () => {
    expect(hookSource).toContain("kabupaten_kota_id");
    expect(hookSource).toContain("kabupaten_kota:kabupaten_kota!kabupaten_kota_id");
    expect(pageSource).toContain('"Belum ditentukan"');
  });

  it("filters by the canonical region UUID", () => {
    expect(pageSource).toContain("eventRegionId");
    expect(pageSource).toContain("regionFilter === \"all\" || eventRegionId === regionFilter");
    expect(pageSource).toContain('value={region.id}');
  });

  it("uses all canonical status values and localized labels", () => {
    for (const status of statuses) expect(pageSource).toContain(`\"${status}\"`);
    expect(pageSource).toContain("Menunggu");
    expect(pageSource).toContain("Dikonfirmasi");
    expect(pageSource).toContain("Ditolak");
    expect(pageSource).toContain("Dibatalkan");
  });

  it("keeps Admin Provinsi authorization and password step-up", () => {
    expect(hookSource).toContain("isAdminProvinsi()");
    expect(hookSource).toContain("signInWithPassword");
    expect(pageSource).toContain('disabled={!password || changeStatus.isPending}');
  });

  it("uses the canonical status transition RPC for all admin changes", () => {
    expect(hookSource).toContain("p_target_status");
    expect(hookSource).toContain("transition_event_assignment_status");
    expect(pageSource).toContain("Cancellation Reason");
    expect(pageSource).toContain("changeStatus.isPending");
  });
});

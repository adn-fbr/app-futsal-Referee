import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(`${process.cwd()}/src/pages/EventEdit.tsx`, "utf8");
const hookSource = readFileSync(`${process.cwd()}/src/hooks/useEvents.ts`, "utf8");
const auditSource = readFileSync(`${process.cwd()}/src/lib/authAudit.ts`, "utf8");

describe("Phase 8.6 historical event edit contract", () => {
  it("detects historical events from the canonical start_date", () => {
    expect(pageSource).toContain("event?.start_date");
    expect(pageSource).toContain('format(today, "yyyy-MM-dd")');
    expect(pageSource).toContain("HISTORICAL EVENT");
  });

  it("requires Admin Provinsi for historical route access", () => {
    expect(pageSource).toContain("isHistoricalEvent");
    expect(pageSource).toContain("isAdminProvinsi()");
    expect(pageSource).toContain("Anda tidak memiliki kewenangan untuk mengedit event yang sudah lewat.");
  });

  it("requires independent role verification and Supabase password step-up before update", () => {
    expect(hookSource).toContain('.from("user_roles")');
    expect(hookSource).toContain('row.role === "admin_provinsi"');
    expect(hookSource).toContain("signInWithPassword");
    expect(pageSource).toContain("historicalAuthorization");
  });

  it("does not persist the password and prevents duplicate submit", () => {
    expect(pageSource).toContain('setStepUpPassword("")');
    expect(pageSource).toContain("disabled={!stepUpPassword || updateEvent.isPending}");
    expect(pageSource).toContain("unchangedDuplicateFields");
    expect(pageSource).not.toContain('localStorage.setItem("password"');
  });

  it("writes canonical historical update audit data without password fields", () => {
    expect(auditSource).toContain('from("audit_logs")');
    expect(hookSource).toContain('action: "HISTORICAL_EVENT_UPDATED"');
    expect(hookSource).toContain("oldData:");
    expect(hookSource).toContain("newData:");
    expect(hookSource).not.toContain("oldData: { password:");
    expect(hookSource).not.toContain("newData: { password:");
  });
});
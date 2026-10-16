import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const hookSource = read("src/hooks/useEvents.ts");
const pageSource = read("src/pages/EventDetail.tsx");
const autoCompleteSource = read("supabase/functions/auto-complete-events/index.ts");
const completionSource = hookSource.slice(
  hookSource.indexOf("export function useCompleteEvent"),
  hookSource.indexOf("export function useDeleteEvent"),
);

describe("event completion frontend integration", () => {
  it("calls only the trusted completion RPC with event and notes", () => {
    expect(completionSource).toContain('supabase.rpc("mark_event_completed"');
    expect(completionSource).toContain("p_event_id: eventId");
    expect(completionSource).toContain("p_notes: notes ?? null");
    expect(completionSource).not.toContain("userId");
    expect(completionSource).not.toContain("approver_id");
    expect(completionSource).not.toContain("approved_by");
    expect(completionSource).not.toContain("actor_id");
  });

  it("does not perform direct completion table writes", () => {
    expect(completionSource).not.toContain('.from("events")');
    expect(completionSource).not.toContain('.from("event_approvals")');
    expect(completionSource).not.toContain('.from("activity_logs")');
    expect(completionSource).not.toContain('update({ status: "SELESAI" })');
    expect(completionSource).not.toContain(".insert(");
  });

  it("maps backend completion errors to safe user-facing messages", () => {
    expect(completionSource).toContain("UNAUTHORIZED_ACTOR");
    expect(completionSource).toContain("FORBIDDEN_EVENT_SCOPE");
    expect(completionSource).toContain("EVENT_NOT_FOUND");
    expect(completionSource).toContain("EVENT_NOT_COMPLETABLE");
    expect(completionSource).toContain("Sesi pengguna tidak valid");
    expect(completionSource).toContain("Anda tidak berwenang menyelesaikan event ini");
    expect(completionSource).toContain("Event tidak ditemukan atau sudah tidak tersedia");
    expect(completionSource).toContain("Event bukan dalam status yang dapat diselesaikan");
    expect(completionSource).not.toContain('toast.error("Gagal menyelesaikan event: " + error.message)');
  });

  it("invalidates event and approval queries after RPC success", () => {
    expect(completionSource).toContain('queryClient.invalidateQueries({ queryKey: ["events"] })');
    expect(completionSource).toContain('queryClient.invalidateQueries({ queryKey: ["event-approvals"] })');
    expect(completionSource).toContain('toast.success("Event ditandai selesai")');
  });

  it("keeps the completion action disabled while the mutation is pending", () => {
    expect(pageSource).toContain("completeEvent.isPending");
    expect(pageSource).toContain('disabled={completeEvent.isPending}');
    expect(pageSource).toContain('completeEvent.mutateAsync({ eventId: event.id, notes })');
    expect(pageSource).not.toContain('completeEvent.mutateAsync({ eventId: event.id, notes, userId: user.id })');
  });

  it("never creates or updates honor rows during automatic event completion", () => {
    expect(autoCompleteSource).not.toMatch(/\.from\(["']honors["']\)/);
    expect(autoCompleteSource).not.toContain("honorDrafts");
    expect(autoCompleteSource).not.toContain("Auto-generated draft from event completion");
    expect(autoCompleteSource).not.toContain("amount: 0");
  });

  it("limits regional admins and skips events that changed before completion", () => {
    expect(autoCompleteSource).toContain('caller.roles.includes("admin_provinsi")');
    expect(autoCompleteSource).toContain('eligibleEventsQuery.eq("kabupaten_kota_id", regionId)');
    expect(autoCompleteSource).toContain('completionQuery.eq("kabupaten_kota_id", regionId)');
    expect(autoCompleteSource).toContain('.eq("status", "DISETUJUI")');
    expect(autoCompleteSource).toContain('status: "skipped"');
    expect(autoCompleteSource).toContain("skipped,");
  });

  it("reports created in-app notifications rather than claiming they were sent", () => {
    expect(autoCompleteSource).toContain("notificationsCreated");
    expect(autoCompleteSource).toContain("notificationError");
    expect(autoCompleteSource).not.toContain("notificationsSent");
    expect(autoCompleteSource).toContain('.eq("status", "confirmed")');
  });
});

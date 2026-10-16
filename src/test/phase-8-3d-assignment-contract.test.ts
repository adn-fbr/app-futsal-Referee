import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const hookSource = readFileSync(`${root}/src/hooks/useAdminEventAssignments.ts`, "utf8");
const pageSource = readFileSync(`${root}/src/pages/AdminEventAssignments.tsx`, "utf8");
const refereeAssignmentSource = readFileSync(`${root}/src/pages/RefereeAssignment.tsx`, "utf8");

describe("F-005 event assignment transition contract", () => {
  it("uses the canonical RPC for full admin status changes", () => {
    expect(hookSource).toContain("transition_event_assignment_status");
    expect(hookSource).toContain("p_target_status");
    expect(hookSource).not.toContain('nextStatus !== "confirmed"');
  });

  it("offers the canonical admin status controls and cancellation reason flow", () => {
    expect(pageSource).toContain("statuses.map");
    expect(pageSource).toContain('value={nextStatus}');
    expect(pageSource).toContain("Cancellation Reason");
    expect(hookSource).toContain("p_target_status");
  });

  it("disables assignment row actions while mutations are pending", () => {
    expect(refereeAssignmentSource).toContain("disabled={updateMutation.isPending}");
    expect(refereeAssignmentSource).toContain("disabled={removeMutation.isPending || updateMutation.isPending}");
    expect(refereeAssignmentSource).toContain("disabled={assignMutation.isPending || removeMutation.isPending}");
  });
});

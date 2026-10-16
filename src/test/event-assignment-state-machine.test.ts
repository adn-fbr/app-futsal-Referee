import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const hookSource = readFileSync(`${root}/src/hooks/useEventAssignments.ts`, "utf8");
const migrationSource = readFileSync(`${root}/supabase/migrations/20260909120000_phase_8_9_assignment_state_machine.sql`, "utf8");

describe("event assignment canonical state machine", () => {
  it("uses the canonical status domain and transition RPC", () => {
    expect(hookSource).toContain("isCanonicalAssignmentStatus");
    expect(hookSource).toContain("transition_event_assignment_status");
    expect(hookSource).toContain('"pending"');
    expect(hookSource).toContain('"confirmed"');
    expect(hookSource).toContain('"declined"');
    expect(hookSource).toContain('"cancelled"');
  });

  it("enforces the database canonical status and transition guard", () => {
    expect(migrationSource).toContain("event_assignments_status_check");
    expect(migrationSource).toContain("'pending'::text");
    expect(migrationSource).toContain("'confirmed'::text");
    expect(migrationSource).toContain("'declined'::text");
    expect(migrationSource).toContain("'cancelled'::text");
    expect(migrationSource).toContain("transition_event_assignment_status");
    expect(migrationSource).toContain("INVALID_TRANSITION");
    expect(migrationSource).toContain("UNAUTHORIZED_ACTOR");
    expect(migrationSource).toContain("CONCURRENT_STATUS_CHANGE");
  });
});

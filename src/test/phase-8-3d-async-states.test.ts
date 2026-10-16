import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assignmentPage = readFileSync(`${root}/src/pages/RefereeAssignment.tsx`, "utf8");
const eventDetailPage = readFileSync(`${root}/src/pages/EventDetail.tsx`, "utf8");
const refereeEventsPage = readFileSync(`${root}/src/pages/RefereeEvents.tsx`, "utf8");

describe("F-004 and F-008 async-state contracts", () => {
  it("distinguishes assignment query errors and exposes retry", () => {
    expect(assignmentPage).toContain("assignmentQueryError");
    expect(assignmentPage).toContain("retryAssignmentQueries");
    expect(assignmentPage).toContain("refetchEvent");
  });

  it("distinguishes EventDetail assignment failure from empty state", () => {
    expect(eventDetailPage).toContain("assignmentsError");
    expect(eventDetailPage).toContain("refetchAssignments");
    expect(eventDetailPage).toContain('Data penugasan gagal dimuat');
  });

  it("distinguishes referee query failure from empty tabs", () => {
    expect(refereeEventsPage).toContain("refereeEventsError");
    expect(refereeEventsPage).toContain("refetchUpcoming");
    expect(refereeEventsPage).toContain("refetchPast");
    expect(refereeEventsPage).toContain("refetchPending");
  });
});

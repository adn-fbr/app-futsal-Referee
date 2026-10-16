import { describe, expect, it } from "vitest";
import { getAnnualDocumentNumber, getAnnualReportPeriod, groupEventsByMonth, summarizeAnnualReport } from "@/lib/annualReport";

describe("Phase 8.10 annual report contracts", () => {
  it("uses a half-open WITA annual period and deterministic document number", () => {
    expect(getAnnualReportPeriod(2026)).toEqual({ year: 2026, startDate: "2026-01-01", endDateExclusive: "2027-01-01" });
    expect(getAnnualDocumentNumber(2026, 1)).toBe("AFP-SULSEL/LAP-TAHUNAN/2026/000001");
  });

  it("summarizes canonical event and assignment statuses", () => {
    const events = [
      { id: "e1", name: "A", date: "2026-01-02", status: "DISETUJUI" },
      { id: "e2", name: "B", date: "2026-02-02", status: "SELESAI" },
      { id: "e3", name: "C", date: "2026-03-02", status: "DIAJUKAN" },
    ];
    const assignments = [
      { id: "a1", event_id: "e1", referee_id: "r1", status: "confirmed" },
      { id: "a2", event_id: "e2", referee_id: "r2", status: "pending" },
    ];
    expect(summarizeAnnualReport(events, assignments, ["r1", "r2", "r3"])).toMatchObject({
      totalEvents: 3, approvedEvents: 1, completedEvents: 1, pendingEvents: 1,
      totalAssignments: 2, confirmedAssignments: 1, pendingAssignments: 1,
      assignedReferees: 2, unassignedReferees: 1,
    });
    expect(groupEventsByMonth(events)).toEqual({ "2026-01": 1, "2026-02": 1, "2026-03": 1 });
  });
});

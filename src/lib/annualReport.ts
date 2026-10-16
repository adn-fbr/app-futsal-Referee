import { getAnnualRange, getCurrentYear } from "@/lib/currentYear";

export type AnnualEvent = {
  id: string;
  name: string;
  date: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string | null;
  location?: string | null;
  regionName?: string | null;
  assignments?: number;
};

export type AnnualAssignment = {
  id: string;
  event_id: string;
  status: string | null;
  event?: { name?: string | null; start_date?: string | null; kabupaten_kota?: { name?: string | null } | null } | null;
  referee?: { full_name?: string | null } | null;
};

export type AnnualReportSummary = {
  totalEvents: number;
  completedEvents: number;
  pendingEvents: number;
  cancelledEvents: number;
  approvedEvents: number;
  totalAssignments: number;
  pendingAssignments: number;
  confirmedAssignments: number;
  declinedAssignments: number;
  cancelledAssignments: number;
  assignedReferees: number;
  unassignedReferees: number;
};

export function getAnnualReportPeriod(year = getCurrentYear()) {
  return { year, ...getAnnualRange(year) };
}

export function summarizeAnnualReport(
  events: AnnualEvent[],
  assignments: AnnualAssignment[],
  refereeIds: string[],
): AnnualReportSummary {
  const assignedRefereeIds = new Set(
    assignments.map((assignment) => assignment.referee_id).filter(Boolean),
  );
  const statusCount = (rows: Array<{ status: string | null }>, status: string) =>
    rows.filter((row) => row.status === status).length;

  return {
    totalEvents: events.length,
    completedEvents: statusCount(events, "SELESAI"),
    pendingEvents: statusCount(events, "DIAJUKAN"),
    cancelledEvents: statusCount(events, "DIBATALKAN") + statusCount(events, "cancelled"),
    approvedEvents: statusCount(events, "DISETUJUI"),
    totalAssignments: assignments.length,
    pendingAssignments: statusCount(assignments, "pending"),
    confirmedAssignments: statusCount(assignments, "confirmed"),
    declinedAssignments: statusCount(assignments, "declined"),
    cancelledAssignments: statusCount(assignments, "cancelled"),
    assignedReferees: assignedRefereeIds.size,
    unassignedReferees: Math.max(refereeIds.length - assignedRefereeIds.size, 0),
  };
}

export function groupEventsByMonth(events: AnnualEvent[]) {
  return events.reduce<Record<string, number>>((result, event) => {
    const month = event.date.slice(0, 7);
    result[month] = (result[month] ?? 0) + 1;
    return result;
  }, {});
}

export function getAnnualDocumentNumber(year: number, sequence = 1, province = true) {
  const prefix = province ? "AFP-SULSEL" : "AFK";
  return `${prefix}/LAP-TAHUNAN/${year}/${String(sequence).padStart(6, "0")}`;
}
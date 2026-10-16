import { describe, expect, it } from "vitest";
import { getDashboardKpiSummary } from "@/lib/dashboardKpis";

describe("Phase 8.8A dashboard KPI contract", () => {
  it("computes canonical totals, today, upcoming, and per-region metrics from real event rows", () => {
    const events = [
      { id: "e1", status: "DIAJUKAN", start_date: "2027-01-02", end_date: "2027-01-03", created_at: "2027-01-01T00:00:00Z", kabupaten_kota: { name: "Makassar" } },
      { id: "e2", status: "DIAJUKAN", start_date: "2027-01-04", end_date: "2027-01-05", created_at: "2027-01-01T00:00:00Z", kabupaten_kota: { name: "Gowa" } },
      { id: "e3", status: "DISETUJUI", start_date: "2027-01-02", end_date: "2027-01-02", created_at: "2027-01-01T00:00:00Z", kabupaten_kota: { name: "Makassar" } },
      { id: "e4", status: "SELESAI", start_date: "2027-01-01", end_date: "2027-01-01", created_at: "2027-01-01T00:00:00Z", kabupaten_kota: { name: "Maros" } },
      { id: "e5", status: "DITOLAK", start_date: "2027-01-30", end_date: "2027-01-30", created_at: "2027-01-01T00:00:00Z", kabupaten_kota: { name: "Makassar" } },
      { id: "e6", status: "DIAJUKAN", start_date: "2027-02-02", end_date: "2027-02-05", created_at: "2027-01-01T00:00:00Z", kabupaten_kota: { name: "Makassar" } },
    ] as any[];

    const summary = getDashboardKpiSummary(events, { currentYear: 2027, today: "2027-01-02" });

    expect(summary.totalEvents).toBe(6);
    expect(summary.approved).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.pending).toBe(3);
    expect(summary.today).toBe(2);
    expect(summary.upcoming).toBe(3);
    expect(summary.thisMonth).toBe(5);
    expect(summary.rejected).toBe(1);
    expect(summary.byRegion).toEqual([
      { name: "Makassar", count: 4 },
      { name: "Gowa", count: 1 },
      { name: "Maros", count: 1 },
    ]);
  });
});

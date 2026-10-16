import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(`${process.cwd()}/src/pages/EventCalendar.tsx`, "utf8");

describe("Phase 8.8 event calendar contract", () => {
  it("uses the shared current year and scoped event query", () => {
    expect(pageSource).toContain("useCurrentYear");
    expect(pageSource).toContain("useEvents({ kabupatenKotaId: isAdminProvinsi() ? null : kabupatenKotaId })");
    expect(pageSource).toContain("getAnnualReportPeriod(selectedYear)");
  });

  it("distinguishes request dates from event ranges and today", () => {
    expect(pageSource).toContain("requestDates");
    expect(pageSource).toContain("event.end_date");
    expect(pageSource).toContain("getToday()");
    expect(pageSource).toContain("Tanggal Request");
  });

  it("uses deterministic region colors and canonical status values", () => {
    expect(pageSource).toContain("getRegionColor");
    expect(pageSource).toContain("DIAJUKAN");
    expect(pageSource).toContain("DISETUJUI");
    expect(pageSource).toContain("DITOLAK");
    expect(pageSource).toContain("SELESAI");
    expect(pageSource).toContain("Kabupaten / Kota");
  });
});
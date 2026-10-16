import { describe, expect, it } from "vitest";
import { formatAnnualPeriod, getAnnualRange, getCurrentYear, getToday, getYearFromDate } from "@/lib/currentYear";

describe("Phase 8.7 current-year temporal contract", () => {
  it("uses Asia/Makassar at the year boundary", () => {
    const instant = new Date("2026-12-31T16:30:00.000Z");
    expect(getCurrentYear(instant)).toBe(2027);
    expect(getToday(instant)).toBe("2027-01-01");
  });

  it("creates a half-open annual range", () => {
    expect(getAnnualRange(2027)).toEqual({ startDate: "2027-01-01", endDateExclusive: "2028-01-01" });
    expect(formatAnnualPeriod(2027)).toContain("2027");
  });

  it("uses the semantic year for date-only event values", () => {
    expect(getYearFromDate("2025-01-01")).toBe(2025);
  });
});
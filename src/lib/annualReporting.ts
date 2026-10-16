import { getAnnualRange, getCurrentYear } from "@/lib/currentYear";

export interface AnnualReportPeriod {
  selectedYear: number;
  currentYear: number;
  startDate: string;
  endDateExclusive: string;
}

export function getAnnualReportPeriod(selectedYear = getCurrentYear()): AnnualReportPeriod {
  return {
    selectedYear,
    currentYear: getCurrentYear(),
    ...getAnnualRange(selectedYear),
  };
}

export function getAvailableReportYears(currentYear = getCurrentYear(), history = 5): number[] {
  return Array.from({ length: history + 1 }, (_, index) => currentYear - index);
}

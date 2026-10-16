import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatAnnualPeriod, formatToday, getAnnualRange, getCurrentYear, getToday } from "@/lib/currentYear";

export interface CurrentYearContextValue {
  currentYear: number;
  today: string;
  formattedToday: string;
  periodStart: string;
  periodEndExclusive: string;
  periodLabel: string;
}

const CurrentYearContext = createContext<CurrentYearContextValue | undefined>(undefined);

function readContext(): CurrentYearContextValue {
  const currentYear = getCurrentYear();
  const range = getAnnualRange(currentYear);
  return {
    currentYear,
    today: getToday(),
    formattedToday: formatToday(),
    periodStart: range.startDate,
    periodEndExclusive: range.endDateExclusive,
    periodLabel: formatAnnualPeriod(currentYear),
  };
}

export function CurrentYearProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readContext);

  useEffect(() => {
    const timer = window.setInterval(() => setValue(readContext()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const contextValue = useMemo(() => value, [value]);
  return <CurrentYearContext.Provider value={contextValue}>{children}</CurrentYearContext.Provider>;
}

export function useCurrentYear() {
  const context = useContext(CurrentYearContext);
  if (!context) throw new Error("useCurrentYear must be used within CurrentYearProvider");
  return context;
}

export const APPLICATION_TIME_ZONE = "Asia/Makassar";

function getZonedParts(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APPLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: values.month, day: values.day };
}

export function getCurrentYear(value: Date = new Date()): number {
  return getZonedParts(value).year;
}

export function getToday(value: Date = new Date()): string {
  const parts = getZonedParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatToday(value: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APPLICATION_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function getYearFromDate(value: string | Date): number {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return Number(value.slice(0, 4));
  return getCurrentYear(typeof value === "string" ? new Date(value) : value);
}

export function getAnnualRange(year: number) {
  return {
    startDate: `${year}-01-01`,
    endDateExclusive: `${year + 1}-01-01`,
  };
}

export function formatAnnualPeriod(year: number): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: APPLICATION_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${formatter.format(new Date(`${year}-01-01T00:00:00+08:00`))} - ${formatter.format(new Date(`${year}-12-31T00:00:00+08:00`))}`;
}

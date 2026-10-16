import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Get effective start and end dates from event data
 * Falls back to the `date` field if start_date is null
 */
export function getEventDates(event: {
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
}): { startDate: string; endDate: string } {
  const startDate = event.start_date || event.date || new Date().toISOString().split("T")[0];
  const endDate = event.end_date || event.start_date || event.date || startDate;
  return { startDate, endDate };
}

/**
 * Format a date range for display
 * - Single day: "15 Januari 2026"
 * - Same month: "15 - 17 Januari 2026"
 * - Different months, same year: "30 Januari - 2 Februari 2026"
 * - Different years: "30 Desember 2025 - 2 Januari 2026"
 */
export function formatDateRange(startDate: string | Date, endDate?: string | Date | null): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = endDate ? (typeof endDate === "string" ? new Date(endDate) : endDate) : start;

  // Single day event
  if (isSameDay(start, end)) {
    return format(start, "d MMMM yyyy", { locale: id });
  }

  // Same month and year
  if (isSameMonth(start, end) && isSameYear(start, end)) {
    return `${format(start, "d", { locale: id })} - ${format(end, "d MMMM yyyy", { locale: id })}`;
  }

  // Same year but different months
  if (isSameYear(start, end)) {
    return `${format(start, "d MMMM", { locale: id })} - ${format(end, "d MMMM yyyy", { locale: id })}`;
  }

  // Different years
  return `${format(start, "d MMMM yyyy", { locale: id })} - ${format(end, "d MMMM yyyy", { locale: id })}`;
}

/**
 * Format a short date range
 * - Single day: "15 Jan 2026"
 * - Same month: "15-17 Jan 2026"
 * - Different months: "30 Jan - 2 Feb 2026"
 */
export function formatDateRangeShort(startDate: string | Date, endDate?: string | Date | null): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = endDate ? (typeof endDate === "string" ? new Date(endDate) : endDate) : start;

  if (isSameDay(start, end)) {
    return format(start, "d MMM yyyy", { locale: id });
  }

  if (isSameMonth(start, end) && isSameYear(start, end)) {
    return `${format(start, "d", { locale: id })}-${format(end, "d MMM yyyy", { locale: id })}`;
  }

  if (isSameYear(start, end)) {
    return `${format(start, "d MMM", { locale: id })} - ${format(end, "d MMM yyyy", { locale: id })}`;
  }

  return `${format(start, "d MMM yyyy", { locale: id })} - ${format(end, "d MMM yyyy", { locale: id })}`;
}

/**
 * Format event date range using event object with fallback
 * Convenience function that combines getEventDates and formatDateRangeShort
 */
export function formatEventDateRange(event: {
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
}): string {
  const { startDate, endDate } = getEventDates(event);
  return formatDateRangeShort(startDate, endDate);
}

/**
 * Format full event date range using event object with fallback
 * Convenience function that combines getEventDates and formatDateRange
 */
export function formatEventDateRangeFull(event: {
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
}): string {
  const { startDate, endDate } = getEventDates(event);
  return formatDateRange(startDate, endDate);
}

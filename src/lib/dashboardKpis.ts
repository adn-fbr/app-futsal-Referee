import { getCurrentYear, getToday } from "@/lib/currentYear";

export interface DashboardKpiEvent {
  id?: string;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
  created_at?: string | null;
  kabupaten_kota?: {
    name?: string | null;
  } | null;
}

export interface DashboardKpiSummary {
  totalEvents: number;
  approved: number;
  completed: number;
  pending: number;
  rejected: number;
  today: number;
  upcoming: number;
  thisMonth: number;
  byRegion: Array<{ name: string; count: number }>;
  attention: Array<{ label: string; value: number; kind: "warning" | "info" | "success" }>;
}

const STATUS_CANONICAL = new Set(["DIAJUKAN", "DISETUJUI", "DITOLAK", "SELESAI"]);

function normalizeDate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [year, month, day] = trimmed.split("-");
  if (year && month && day) {
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function countEventInRange(event: DashboardKpiEvent, start: Date, end: Date) {
  const eventStart = normalizeDate(event.start_date ?? event.date) ?? normalizeDate(event.created_at);
  if (!eventStart) return false;
  const eventEnd = normalizeDate(event.end_date ?? event.start_date ?? event.date) ?? eventStart;
  return eventEnd >= start && eventStart <= end;
}

export function getDashboardKpiSummary(events: DashboardKpiEvent[], options?: { currentYear?: number; today?: string }): DashboardKpiSummary {
  const currentYear = options?.currentYear ?? getCurrentYear();
  const todayIso = options?.today ?? getToday();
  const today = normalizeDate(todayIso) ?? new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const upcomingWindowEnd = new Date(today);
  upcomingWindowEnd.setDate(today.getDate() + 7);

  const totals = {
    totalEvents: events.length,
    approved: 0,
    completed: 0,
    pending: 0,
    rejected: 0,
    today: 0,
    upcoming: 0,
    thisMonth: 0,
  };

  const regionMap = new Map<string, number>();

  for (const event of events) {
    const status = event.status ?? "";
    if (status === "DISETUJUI") totals.approved += 1;
    if (status === "SELESAI") totals.completed += 1;
    if (status === "DIAJUKAN") totals.pending += 1;
    if (status === "DITOLAK") totals.rejected += 1;

    const eventDate = normalizeDate(event.start_date ?? event.date ?? event.created_at);
    if (eventDate && eventDate.getFullYear() === currentYear && eventDate.getMonth() === today.getMonth()) {
      totals.thisMonth += 1;
    }

    const eventStart = normalizeDate(event.start_date ?? event.date);
    const eventEnd = normalizeDate(event.end_date ?? event.start_date ?? event.date) ?? eventStart;
    const todayMatch = eventStart && eventEnd && eventStart <= today && eventEnd >= today;
    if (todayMatch) totals.today += 1;

    const upcomingMatch = eventStart && eventStart >= today && eventStart <= upcomingWindowEnd;
    if (upcomingMatch) totals.upcoming += 1;

    const regionName = event.kabupaten_kota?.name?.trim() || "Tidak Diketahui";
    if (regionName) {
      regionMap.set(regionName, (regionMap.get(regionName) ?? 0) + 1);
    }
  }

  const byRegion = [...regionMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const attention = [
    { label: "Event masih Pending", value: totals.pending, kind: "warning" as const },
    { label: "Event dimulai hari ini", value: totals.today, kind: "info" as const },
    { label: "Event dimulai dalam 7 hari", value: totals.upcoming, kind: "success" as const },
  ].filter((item) => item.value > 0);

  return {
    ...totals,
    byRegion,
    attention,
  };
}

export function getDashboardKpiStatusLabel(status: string | null | undefined) {
  const canonical = (status ?? "").trim();
  return STATUS_CANONICAL.has(canonical) ? canonical : "UNKNOWN";
}

export function getDateRangeText(value: Date) {
  return toDateKey(value);
}

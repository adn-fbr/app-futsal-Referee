import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAnnualReportPeriod, type AnnualAssignment, type AnnualEvent } from "@/lib/annualReport";
import { getAllAdminReferees } from "@/repositories/admin-referee-directory";

export function useAnnualReport(year: number, regionId?: string | null) {
  const period = getAnnualReportPeriod(year);

  return useQuery({
    queryKey: ["annual-report", year, regionId ?? null],
    queryFn: async () => {
      let eventQuery = supabase
        .from("events")
        .select("id,name,date,start_date,end_date,status,location,kabupaten_kota:kabupaten_kota_id(name)")
        .is("deleted_at", null)
        .gte("date", period.startDate)
        .lt("date", period.endDateExclusive)
        .order("date", { ascending: true });
      if (regionId) eventQuery = eventQuery.eq("kabupaten_kota_id", regionId);

      const [eventsResult, assignmentsResult, referees, honorsResult, activityResult] = await Promise.all([
        eventQuery,
        supabase
          .from("event_assignments")
          .select("id,event_id,referee_id,status,event:events!inner(name,start_date,kabupaten_kota:kabupaten_kota_id(name)),referee:profiles!referee_id(full_name)")
          .is("deleted_at", null)
          .gte("event.start_date", period.startDate)
          .lt("event.start_date", period.endDateExclusive),
        getAllAdminReferees({
          _is_active: true,
          _kabupaten_kota_id: regionId || undefined,
        }),
        supabase.from("honors").select("amount,status").is("deleted_at", null).gte("created_at", period.startDate).lt("created_at", period.endDateExclusive),
        supabase.from("audit_logs").select("id,action,created_at").gte("created_at", period.startDate).lt("created_at", period.endDateExclusive).limit(500),
      ]);

      for (const result of [eventsResult, assignmentsResult, honorsResult, activityResult]) {
        if (result.error) throw result.error;
      }

      const events = (eventsResult.data ?? []).map((event) => ({
        ...event,
        regionName: (event.kabupaten_kota as { name?: string } | null)?.name ?? null,
      })) as AnnualEvent[];
      return {
        period,
        events,
        assignments: (assignmentsResult.data ?? []) as unknown as AnnualAssignment[],
        refereeIds: referees.map((referee) => referee.id),
        honors: honorsResult.data ?? [],
        activities: activityResult.data ?? [],
      };
    },
  });
}
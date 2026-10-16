import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { getAllAdminReferees } from "@/repositories/admin-referee-directory";

export interface RefereePerformance {
  referee_id: string;
  referee_name: string;
  profile_photo_url: string | null;
  license_level: string | null;
  kabupaten_kota_name: string | null;
  total_events: number;
  completed_events: number;
  avg_rating: number;
  total_reviews: number;
  total_verified_income: number;
  total_pending_income: number;
  license_expiry: string | null;
  is_active: boolean;
}

export interface EventAnalytics {
  event_id: string;
  event_name: string;
  status: string;
  submitted_at: string;
  event_date?: string | null;
  approved_at: string | null;
  approval_time_hours: number | null;
  kabupaten_kota_name: string | null;
  category: string | null;
  assigned_referees: number;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Get referee performance metrics
export function useRefereePerformance(filters?: DateRangeFilter & { kabupatenKotaId?: string }) {
  return useQuery({
    queryKey: ["referee-performance", filters],
    queryFn: async () => {
      const referees = await getAllAdminReferees({
        _kabupaten_kota_id: filters?.kabupatenKotaId || undefined,
      });

      if (referees.length === 0) return [];

      const refereeIds = referees.map(r => r.id);

      // Get event assignments
      let assignmentQuery = supabase
        .from("event_assignments")
        .select(`
          referee_id,
          status,
          event:events!inner (
            status,
            start_date
          )
        `)
        .in("referee_id", refereeIds)
        .is("deleted_at", null);

      if (filters?.startDate) {
        assignmentQuery = assignmentQuery.gte("event.start_date", filters.startDate);
      }
      if (filters?.endDate) {
        assignmentQuery = assignmentQuery.lte("event.start_date", filters.endDate);
      }

      const { data: assignments } = await assignmentQuery;

      // Get reviews
      const { data: reviews } = await supabase
        .from("referee_reviews")
        .select("referee_id, rating")
        .in("referee_id", refereeIds);

      // Get honors
      let honorQuery = supabase
        .from("honors")
        .select("referee_id, amount, status, created_at")
        .in("referee_id", refereeIds)
        .is("deleted_at", null);

      if (filters?.startDate) {
        honorQuery = honorQuery.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        honorQuery = honorQuery.lte("created_at", filters.endDate);
      }

      const { data: honors } = await honorQuery;

      // Aggregate data per referee
      const performanceData: RefereePerformance[] = referees.map(referee => {
        const refAssignments = assignments?.filter(a => a.referee_id === referee.id) || [];
        const refReviews = reviews?.filter(r => r.referee_id === referee.id) || [];
        const refHonors = honors?.filter(h => h.referee_id === referee.id) || [];

        const totalEvents = refAssignments.length;
        const completedEvents = refAssignments.filter(
          a => (a.event as any)?.status === "SELESAI"
        ).length;

        const totalReviews = refReviews.length;
        const avgRating = totalReviews > 0
          ? refReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        const totalVerifiedIncome = refHonors
          .filter(h => h.status === "verified")
          .reduce((sum, h) => sum + h.amount, 0);

        const totalPendingIncome = refHonors
          .filter(h => h.status === "submitted")
          .reduce((sum, h) => sum + h.amount, 0);

        return {
          referee_id: referee.id,
          referee_name: referee.full_name,
          profile_photo_url: referee.profile_photo_url,
          license_level: referee.license_level,
          kabupaten_kota_name: referee.kabupaten_kota_name,
          total_events: totalEvents,
          completed_events: completedEvents,
          avg_rating: avgRating,
          total_reviews: totalReviews,
          total_verified_income: totalVerifiedIncome,
          total_pending_income: totalPendingIncome,
          license_expiry: referee.license_expiry,
          is_active: referee.is_active || false,
        };
      });

      // Sort by total events descending
      return performanceData.sort((a, b) => b.total_events - a.total_events);
    },
  });
}

// Get event analytics with approval times
export function useEventAnalytics(filters?: DateRangeFilter & { kabupatenKotaId?: string }) {
  return useQuery({
    queryKey: ["event-analytics", filters],
    queryFn: async () => {
      // Get events with approval data
      let eventQuery = supabase
        .from("events")
        .select(`
          id,
          name,
          status,
          start_date,
          created_at,
          category,
          kabupaten_kota_id,
          kabupaten_kota:kabupaten_kota_id (name),
          event_approvals (
            status,
            created_at
          )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (filters?.kabupatenKotaId) {
        eventQuery = eventQuery.eq("kabupaten_kota_id", filters.kabupatenKotaId);
      }
      if (filters?.startDate) {
        eventQuery = eventQuery.gte("start_date", filters.startDate);
      }
      if (filters?.endDate) {
        eventQuery = eventQuery.lt("start_date", filters.endDate);
      }

      const { data: events, error } = await eventQuery;
      if (error) throw error;

      if (!events || events.length === 0) return [];

      const eventIds = events.map(e => e.id);

      // Get assignment counts
      const { data: assignmentCounts } = await supabase
        .from("event_assignments")
        .select("event_id")
        .in("event_id", eventIds)
        .is("deleted_at", null);

      const assignmentMap = (assignmentCounts || []).reduce((acc, a) => {
        acc[a.event_id] = (acc[a.event_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Transform data
      const analyticsData: EventAnalytics[] = events.map(event => {
        const approvals = (event.event_approvals as any) || [];
        const approvedApproval = approvals.find((a: any) => a.status === "approved");
        
        let approvalTimeHours = null;
        if (approvedApproval && event.created_at) {
          const submittedTime = new Date(event.created_at).getTime();
          const approvedTime = new Date(approvedApproval.created_at).getTime();
          approvalTimeHours = (approvedTime - submittedTime) / (1000 * 60 * 60);
        }

        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.start_date,
          status: event.status,
          submitted_at: event.created_at,
          approved_at: approvedApproval?.created_at || null,
          approval_time_hours: approvalTimeHours,
          kabupaten_kota_name: (event.kabupaten_kota as any)?.name || null,
          category: event.category,
          assigned_referees: assignmentMap[event.id] || 0,
        };
      });

      return analyticsData;
    },
  });
}

// Export to CSV helper
export function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
  const headers = columns.map(c => c.label);
  const rows = data.map(item =>
    columns.map(c => {
      const value = item[c.key];
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number') return value.toString();
      return `"${value}"`;
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
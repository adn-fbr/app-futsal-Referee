import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportFilters {
  kabupatenKotaId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface DashboardSummary {
  total_referees: number;
  active_referees: number;
  total_events: number;
  completed_events: number;
  total_verified_income: number;
  total_pending_income: number;
  avg_income_per_referee: number;
}

export interface RefereeIncomeSummary {
  referee_id: string;
  referee_name: string;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  total_verified_income: number;
  total_pending_income: number;
  verified_count: number;
  pending_count: number;
  rejected_count: number;
}

export interface RefereeEventCount {
  referee_id: string;
  referee_name: string;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  total_events: number;
  completed_events: number;
  pending_events: number;
  cancelled_events: number;
}

// Hook for dashboard summary
export function useDashboardSummary(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['dashboard-summary', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_summary', {
        _kabupaten_kota_id: filters?.kabupatenKotaId || null,
        _start_date: filters?.startDate || null,
        _end_date: filters?.endDate || null,
      });

      if (error) throw error;
      
      // The function returns a single row
      const result = Array.isArray(data) ? data[0] : data;
      return result as DashboardSummary;
    },
  });
}

// Hook for referee income summary
export function useRefereeIncomeSummary(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['referee-income-summary', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_referee_income_summary', {
        _kabupaten_kota_id: filters?.kabupatenKotaId || null,
        _start_date: filters?.startDate || null,
        _end_date: filters?.endDate || null,
      });

      if (error) throw error;
      return data as RefereeIncomeSummary[];
    },
  });
}

// Hook for referee event count
export function useRefereeEventCount(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['referee-event-count', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_referee_event_count', {
        _kabupaten_kota_id: filters?.kabupatenKotaId || null,
        _start_date: filters?.startDate || null,
        _end_date: filters?.endDate || null,
      });

      if (error) throw error;
      return data as RefereeEventCount[];
    },
  });
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

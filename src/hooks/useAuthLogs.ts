 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface AuthEventLog {
   id: string;
   event: string;
   success: boolean;
   user_id: string | null;
   identifier_hash: string | null;
   metadata: Record<string, any> | null;
   created_at: string;
 }
 
 export interface AuthLogsFilters {
   event?: string;
   success?: boolean;
   startDate?: string;
   endDate?: string;
 }
 
 export function useAuthLogs(filters?: AuthLogsFilters) {
   return useQuery({
     queryKey: ["auth-logs", filters],
     queryFn: async () => {
       let query = supabase
         .from("auth_event_logs")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (filters?.event) {
         query = query.eq("event", filters.event);
       }
 
       if (filters?.success !== undefined) {
         query = query.eq("success", filters.success);
       }
 
       if (filters?.startDate) {
         query = query.gte("created_at", filters.startDate);
       }
 
       if (filters?.endDate) {
         // Add one day to include the end date
         const endDatePlusOne = new Date(filters.endDate);
         endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
         query = query.lt("created_at", endDatePlusOne.toISOString());
       }
 
       const { data, error } = await query;
 
       if (error) throw error;
       return data as AuthEventLog[];
     },
   });
 }
 
 export const AUTH_EVENT_TYPES = [
   { value: "AUTH_LOGIN", label: "Login" },
   { value: "AUTH_LOGIN_FAILED", label: "Login Gagal" },
   { value: "AUTH_LOGOUT", label: "Logout" },
   { value: "AUTH_PASSWORD_RESET", label: "Reset Password" },
   { value: "AUTH_PASSWORD_RESET_REQUESTED", label: "Request Reset Password" },
 ];
 
 export function getEventLabel(event: string): string {
   const found = AUTH_EVENT_TYPES.find((t) => t.value === event);
   return found ? found.label : event;
 }
 
export function getEventVariant(event: string): "default" | "destructive" | "secondary" {
   if (event.includes("FAILED")) return "destructive";
   if (event.includes("LOGOUT")) return "secondary";
  return "default";
 }
 
 /**
  * Export auth logs to CSV
  */
 export function exportAuthLogsToCSV(logs: AuthEventLog[], filename = "auth-logs.csv") {
   const headers = ["Tanggal", "Event", "Status", "User ID", "Metadata"];
   const rows = logs.map((log) => [
     new Date(log.created_at).toLocaleString("id-ID"),
     getEventLabel(log.event),
     log.success ? "Berhasil" : "Gagal",
     log.user_id || "-",
     log.metadata ? JSON.stringify(log.metadata) : "-",
   ]);
 
   const csvContent = [
     headers.join(","),
     ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
   ].join("\n");
 
   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
   const link = document.createElement("a");
   const url = URL.createObjectURL(blob);
   link.setAttribute("href", url);
   link.setAttribute("download", filename);
   link.style.visibility = "hidden";
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
 }
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface IncompleteProfile {
   id: string;
   full_name: string;
   email: string;
   kabupaten_kota_id: string | null;
   kabupaten_kota_name: string | null;
   requested_role: string | null;
   created_at: string;
 }
 
 export function useIncompleteProfiles() {
   return useQuery({
     queryKey: ["incomplete-profiles"],
     queryFn: async () => {
       // Get profiles where is_profile_complete = false and registration_status = approved
       const { data: profiles, error: profilesError } = await supabase
         .from("profiles")
         .select(`
           id,
           full_name,
           kabupaten_kota_id,
           requested_role,
           created_at,
           kabupaten_kota:kabupaten_kota_id (
             id,
             name
           )
         `)
         .eq("is_profile_complete", false)
         .eq("registration_status", "approved")
         .order("created_at", { ascending: false });
 
       if (profilesError) throw profilesError;
 
       // Get emails from auth.users (need to use RPC or edge function)
       // For now, we'll use a separate query to get user data
       const userIds = (profiles || []).map(p => p.id);
       
       if (userIds.length === 0) return [];
 
       // We can't directly query auth.users, so we'll need to handle this differently
       // For now, return profiles without email (will be fetched by edge function)
       const incompleteProfiles: IncompleteProfile[] = (profiles || []).map(profile => ({
         id: profile.id,
         full_name: profile.full_name,
         email: "", // Will be populated by edge function when sending
         kabupaten_kota_id: profile.kabupaten_kota_id,
         kabupaten_kota_name: profile.kabupaten_kota?.name || null,
         requested_role: profile.requested_role,
         created_at: profile.created_at,
       }));
 
       return incompleteProfiles;
     },
   });
 }
 
 export function useIncompleteProfileCount() {
   return useQuery({
     queryKey: ["incomplete-profile-count"],
     queryFn: async () => {
       const { count, error } = await supabase
         .from("profiles")
         .select("id", { count: "exact", head: true })
         .eq("is_profile_complete", false)
         .eq("registration_status", "approved");
 
       if (error) throw error;
       return count || 0;
     },
     // Refetch every 5 minutes
     staleTime: 5 * 60 * 1000,
   });
 }
 
 export function useSendProfileReminder() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (userIds: string[]) => {
       const { data, error } = await supabase.functions.invoke(
         "send-profile-reminder",
         {
           body: { userIds },
         }
       );
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["incomplete-profiles"] });
       toast.success("Email reminder berhasil dikirim");
     },
     onError: (error: Error) => {
       toast.error("Gagal mengirim email: " + error.message);
     },
   });
 }
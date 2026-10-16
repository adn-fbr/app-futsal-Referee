import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EligibleHonorEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  status: string;
  assignment_id: string;
  role: string;
}

/**
 * Hook to fetch events where the referee can submit honor
 * Conditions:
 * 1. Referee is assigned with status "confirmed"
 * 2. Event is completed (status = "SELESAI")
 * 3. No honor has been submitted yet for this event
 */
export function useEligibleHonorEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["eligible-honor-events", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get all confirmed assignments for completed events
      const { data: assignments, error: assignmentError } = await supabase
        .from("event_assignments")
        .select(`
          id,
          event_id,
          role,
          event:event_id (
            id,
            name,
            start_date,
            end_date,
            location,
            status
          )
        `)
        .eq("referee_id", user.id)
        .eq("status", "confirmed")
        .is("deleted_at", null);

      if (assignmentError) throw assignmentError;

      // Get existing honors for this referee
      const { data: existingHonors, error: honorError } = await supabase
        .from("honors")
        .select("event_id")
        .eq("referee_id", user.id)
        .is("deleted_at", null);

      if (honorError) throw honorError;

      const honoredEventIds = new Set(existingHonors?.map(h => h.event_id) || []);

      // Filter to only completed events without existing honor
      const eligibleEvents: EligibleHonorEvent[] = (assignments || [])
        .filter(a => {
          const event = a.event as any;
          return (
            event &&
            event.status === "SELESAI" &&
            !honoredEventIds.has(a.event_id)
          );
        })
        .map(a => {
          const event = a.event as any;
          return {
            id: event.id,
            name: event.name,
            start_date: event.start_date,
            end_date: event.end_date,
            location: event.location,
            status: event.status,
            assignment_id: a.id,
            role: a.role || "UTAMA",
          };
        });

      return eligibleEvents;
    },
    enabled: !!user?.id,
  });
}

/**
 * Check if an honor already exists for a specific event and referee
 */
export function useCheckHonorExists(eventId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["check-honor-exists", user?.id, eventId],
    queryFn: async () => {
      if (!user?.id || !eventId) return false;

      const { data, error } = await supabase
        .from("honors")
        .select("id")
        .eq("referee_id", user.id)
        .eq("event_id", eventId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!eventId,
  });
}

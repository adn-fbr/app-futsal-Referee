import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { createNotification } from "../hooks/useNotifications";
import { getAssignmentCandidates } from "../repositories/assignment-candidate-repository";

export type RefereeRole = "UTAMA" | "CADANGAN";
export type AssignmentStatus = "pending" | "confirmed" | "cancelled" | "declined";

const CANONICAL_ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
];

export function isCanonicalAssignmentStatus(value: string): value is AssignmentStatus {
  return CANONICAL_ASSIGNMENT_STATUSES.includes(value as AssignmentStatus);
}

export interface EventAssignment {
  id: string;
  event_id: string;
  referee_id: string;
  role: RefereeRole;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  // Joined data
  referee?: {
    id: string;
    full_name: string;
    license_level: string | null;
    profile_photo_url: string | null;
    kabupaten_kota?: {
      id: string;
      name: string;
    } | null;
  } | null;
  event?: {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    location?: string | null;
    kabupaten_kota_id?: string | null;
    kabupaten_kota?: {
      id: string;
      name: string;
    } | null;
  } | null;
  cancelled_by_profile?: {
    id: string;
    full_name: string;
  } | null;
}

export interface AvailableReferee {
  id: string;
  full_name: string;
  license_level: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  has_conflict: boolean;
}

interface EventAssignmentResponse {
  id: string;
  event_id: string;
  referee_id: string;
  role: RefereeRole;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  referee: {
    id: string;
    full_name: string;
    license_level: string | null;
    profile_photo_url: string | null;
    kabupaten_kota_id: string | null;
    kabupaten_kota: {
      id: string;
      name: string;
    } | null;
  } | null;
  event: {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
  } | null;
}

// Get assignments for a specific event
export function useEventAssignments(eventId: string) {
  return useQuery({
    queryKey: ["event-assignments", eventId],
    queryFn: async () => {
      // Optimized: Use nested joins to get all data in single query
      const { data, error } = await supabase
        .from("event_assignments")
        .select(`
          *,
          referee:profiles!referee_id (
            id,
            full_name,
            license_level,
            profile_photo_url,
            kabupaten_kota_id,
            kabupaten_kota!kabupaten_kota_id (
              id,
              name
            )
          ),
          event:events!event_id (
            id,
            name,
            start_date,
            end_date,
            status
          )
        `)
        .eq("event_id", eventId)
        .order("role", { ascending: true });

      if (error) throw error;
      
      // Map the joined data to match interface
      // Note: cancelled_by_profile needs separate fetch if needed (no FK)
      const assignments = (data as unknown as EventAssignmentResponse[] || []).map(assignment => ({
        ...assignment,
        referee: assignment.referee || null,
        event: assignment.event || null,
        cancelled_by_profile: null, // TODO: Optimize after FK is added
      })) as EventAssignment[];
      
      // Fetch cancelled_by profiles if any (until FK is added)
      const cancelledByIds = [...new Set(
        assignments
          .filter(a => a.cancelled_by)
          .map(a => a.cancelled_by!)
      )];
      
      if (cancelledByIds.length > 0) {
        const { data: cancelledByProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", cancelledByIds);
        
        const cancelledByMap = new Map(
          (cancelledByProfiles || []).map(p => [p.id, p])
        );
        
        assignments.forEach(assignment => {
          if (assignment.cancelled_by) {
            assignment.cancelled_by_profile = 
              cancelledByMap.get(assignment.cancelled_by) || null;
          }
        });
      }
      
      return assignments;
    },
    enabled: !!eventId,
  });
}

// Get available referees for assignment (active wasit without conflicts)
export function useAvailableReferees(eventId: string) {
  return useQuery({
    queryKey: ["available-referees", eventId],
    queryFn: async () => {
      // Get event date first
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("start_date, end_date, status")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      if (!event) throw new Error("Event tidak ditemukan");
      if (event.status !== "DISETUJUI") {
        throw new Error("Hanya event yang disetujui yang bisa ditugaskan wasit");
      }

      const referees = await getAssignmentCandidates();

      // Get existing assignments for this event date (excluding cancelled)
      const { data: conflictingAssignments, error: conflictError } = await supabase
        .from("event_assignments")
        .select("referee_id, event_id")
        .neq("status", "cancelled");

      if (conflictError) throw conflictError;

      // Get event dates for conflicting assignments
      const conflictEventIds = [...new Set((conflictingAssignments || []).map(a => a.event_id))];
      const { data: conflictEvents } = conflictEventIds.length > 0
        ? await supabase.from("events").select("id, start_date, end_date").in("id", conflictEventIds)
        : { data: [] };

      const eventDateMap = new Map((conflictEvents || []).map(e => [e.id, e]));

      // Find referees with conflicts on overlapping dates
      const refereesWithConflicts = new Set(
        (conflictingAssignments || [])
          .filter(a => {
            const assignEvent = eventDateMap.get(a.event_id);
            if (!assignEvent?.start_date || !event.start_date) return false;
            // Check for date overlap
            const aStart = assignEvent.start_date;
            const aEnd = assignEvent.end_date || assignEvent.start_date;
            const eStart = event.start_date;
            const eEnd = event.end_date || event.start_date;
            return aStart <= eEnd && aEnd >= eStart;
          })
          .map(a => a.referee_id)
      );

      // Get already assigned referees for this event
      const { data: existingAssignments } = await supabase
        .from("event_assignments")
        .select("referee_id")
        .eq("event_id", eventId)
        .neq("status", "cancelled");

      const assignedRefereeIds = new Set(existingAssignments?.map(a => a.referee_id) || []);

      // Filter out already assigned referees and mark conflicts
      const availableReferees: AvailableReferee[] = (referees || [])
        .filter((r: { id: string }) => !assignedRefereeIds.has(r.id))
        .map((r: { 
          id: string; 
          full_name: string; 
          license_level: string | null; 
          profile_photo_url: string | null;
          is_active: boolean;
          kabupaten_kota_id: string | null;
          kabupaten_kota_name: string | null;
        }) => ({
          id: r.id,
          full_name: r.full_name,
          license_level: r.license_level,
          profile_photo_url: r.profile_photo_url,
          is_active: r.is_active,
          kabupaten_kota_id: r.kabupaten_kota_id,
          kabupaten_kota_name: r.kabupaten_kota_name,
          has_conflict: refereesWithConflicts.has(r.id),
        }));

      return availableReferees;
    },
    enabled: !!eventId,
  });
}

// Get referee's assignments
export function useRefereeAssignments(refereeId: string) {
  return useQuery({
    queryKey: ["referee-assignments", refereeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_assignments")
        .select("*")
        .eq("referee_id", refereeId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch events
      const eventIds = [...new Set(data.map(a => a.event_id))];
      const { data: events } = await supabase
        .from("events")
        .select("id, name, start_date, end_date, status, location, kabupaten_kota_id")
        .in("id", eventIds);

      // Fetch kabupaten_kota
      const kabKotaIds = [...new Set((events || []).filter(e => e.kabupaten_kota_id).map(e => e.kabupaten_kota_id!))];
      const { data: kabKotaData } = kabKotaIds.length > 0
        ? await supabase.from("kabupaten_kota").select("id, name").in("id", kabKotaIds)
        : { data: [] };

      const kabKotaMap = new Map((kabKotaData || []).map(k => [k.id, k]));
      const eventMap = new Map((events || []).map(e => [e.id, {
        ...e,
        kabupaten_kota: e.kabupaten_kota_id ? kabKotaMap.get(e.kabupaten_kota_id) || null : null,
      }]));

      return data.map(assignment => ({
        ...assignment,
        event: eventMap.get(assignment.event_id) || null,
      }));
    },
    enabled: !!refereeId,
  });
}

// Assign referee to event
export function useAssignReferee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      refereeId,
      role = "CADANGAN",
    }: {
      eventId: string;
      refereeId: string;
      role?: RefereeRole;
    }) => {
      const { data, error } = await supabase
        .from("event_assignments")
        .insert({
          event_id: eventId,
          referee_id: refereeId,
          role,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        // Parse trigger error messages
        if (error.message.includes("unapproved event")) {
          throw new Error("Event belum disetujui");
        }
        if (error.message.includes("inactive referee")) {
          throw new Error("Wasit tidak aktif");
        }
        if (error.message.includes("schedule conflict")) {
          throw new Error("Wasit sudah bertugas di event lain pada tanggal yang sama");
        }
        throw error;
      }

      // Fetch event name for notification
      const { data: event } = await supabase
        .from("events")
        .select("name")
        .eq("id", eventId)
        .single();

      return { ...data, eventName: event?.name || "Event" };
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-assignments", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", variables.refereeId] });

      // Create in-app notification for referee
      await createNotification({
        userId: variables.refereeId,
        type: "assignment",
        action: "assigned",
        title: "Penugasan Baru",
        message: `Anda ditugaskan sebagai wasit ${variables.role || "CADANGAN"} pada ${data.eventName}.`,
        entityType: "event_assignments",
        entityId: data.id,
      });

      // Send assignment notification through the canonical orchestrator (async, don't await)
      supabase.functions.invoke("notification-orchestrator", {
        body: {
          assignmentId: data.id,
        },
      }).catch((err) => {
        console.error("Failed to dispatch assignment notification via orchestrator:", err);
      });

      toast.success("Wasit berhasil ditugaskan");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menugaskan wasit");
    },
  });
}

// Update assignment metadata only. Status changes must use the canonical transition RPC.
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      role,
      status,
    }: {
      assignmentId: string;
      role?: RefereeRole;
      status?: AssignmentStatus;
    }) => {
      if (status) {
        throw new Error("Status assignment harus menggunakan transitionAssignmentStatus().");
      }

      const updates: Record<string, unknown> = {};
      if (role) updates.role = role;

      const { data, error } = await supabase
        .from("event_assignments")
        .update(updates)
        .eq("id", assignmentId)
        .select(`*, event_id, referee_id`)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-assignments", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", data.referee_id] });
      toast.success("Penugasan berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui penugasan: " + error.message);
    },
  });
}

export function useTransitionAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      targetStatus,
      reason,
    }: {
      assignmentId: string;
      targetStatus: AssignmentStatus;
      reason?: string | null;
    }) => {
      if (!isCanonicalAssignmentStatus(targetStatus)) {
        throw new Error("Status target tidak valid untuk assignment.");
      }

      const { data, error } = await supabase.rpc("transition_event_assignment_status", {
        p_assignment_id: assignmentId,
        p_target_status: targetStatus,
        p_reason: reason ?? null,
      });

      if (error) {
        const message = error.message || "Transisi status assignment gagal";
        if (message.includes("INVALID_TRANSITION")) {
          throw new Error("Transisi status ini tidak diizinkan untuk assignment saat ini.");
        }
        if (message.includes("CROSS_REGION_ACCESS")) {
          throw new Error("Anda tidak memiliki akses ke wilayah event ini.");
        }
        if (message.includes("UNAUTHORIZED_ACTOR")) {
          throw new Error("Anda tidak memiliki kewenangan untuk mengubah status assignment ini.");
        }
        if (message.includes("CONCURRENT_STATUS_CHANGE")) {
          throw new Error("Status assignment sudah berubah. Silakan muat ulang data dan coba lagi.");
        }
        throw new Error(message);
      }

      return data as EventAssignment | null;
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ["event-assignments", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", data.referee_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-events"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status penugasan");
    },
  });
}

// Remove assignment (set status to cancelled)
export function useRemoveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, reason }: { assignmentId: string; reason?: string | null }) => {
      const { data, error } = await supabase.rpc("transition_event_assignment_status", {
        p_assignment_id: assignmentId,
        p_target_status: "cancelled",
        p_reason: reason ?? null,
      });

      if (error) throw error;
      return data as EventAssignment | null;
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ["event-assignments", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", data.referee_id] });
      toast.success("Penugasan wasit dibatalkan");
    },
    onError: (error) => {
      toast.error("Gagal membatalkan penugasan: " + (error instanceof Error ? error.message : String(error)));
    },
  });
}

// Confirm or decline assignment (for referees)
export function useConfirmAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      confirm,
    }: {
      assignmentId: string;
      confirm: boolean;
    }) => {
      const newStatus: AssignmentStatus = confirm ? "confirmed" : "declined";
      const { data, error } = await supabase.rpc("transition_event_assignment_status", {
        p_assignment_id: assignmentId,
        p_target_status: newStatus,
      });

      if (error) throw error;
      return data as EventAssignment | null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["referee-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments"] });
      toast.success(
        variables.confirm 
          ? "Penugasan berhasil dikonfirmasi" 
          : "Penugasan berhasil ditolak"
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status penugasan");
    },
  });
}

// Cancel confirmed assignment (Admin Provinsi only)
export function useCancelConfirmedAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      reason,
    }: {
      assignmentId: string;
      reason: string;
    }) => {
      if (!reason.trim()) throw new Error("Alasan pembatalan wajib diisi");

      const { data, error } = await supabase.rpc("transition_event_assignment_status", {
        p_assignment_id: assignmentId,
        p_target_status: "cancelled",
        p_reason: reason.trim(),
      });

      if (error) throw error;

      return data as EventAssignment | null;
    },
    onSuccess: async (data, variables) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ["event-assignments", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", data.referee_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-events"] });

      const { data: event } = await supabase
        .from("events")
        .select("name")
        .eq("id", data.event_id)
        .single();

      await createNotification({
        userId: data.referee_id,
        type: "assignment",
        action: "cancelled",
        title: "Penugasan Dibatalkan",
        message: `Penugasan Anda pada ${event?.name || "event"} telah dibatalkan.${variables.reason ? ` Alasan: ${variables.reason}` : ""}`,
        entityType: "event_assignments",
        entityId: data.id,
      });

      toast.success("Penugasan berhasil dibatalkan");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan penugasan");
    },
  });
}

// Helper functions
export function getRoleBadgeVariant(role: RefereeRole): "primary" | "info" {
  return role === "UTAMA" ? "primary" : "info";
}

export function getStatusBadgeVariant(status: AssignmentStatus) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "cancelled":
    case "declined":
      return "error" as const;
    default:
      return "warning" as const;
  }
}

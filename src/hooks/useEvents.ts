import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "./useNotifications";
import { format } from "date-fns";
import { writeAuditLog } from "@/lib/authAudit";

export type EventStatus = "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | "SELESAI";

export interface Event {
  id: string;
  name: string;
  date: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  category: string | null;
  status: EventStatus;
  description: string | null;
  created_by: string | null;
  kabupaten_kota_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    id: string;
    full_name: string;
  } | null;
  kabupaten_kota?: {
    id: string;
    name: string;
  } | null;
}

export interface EventApproval {
  id: string;
  event_id: string;
  status: string;
  notes: string | null;
  approver_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  approver?: {
    id: string;
    full_name: string;
  } | null;
}

export function useEvents(filters?: { status?: EventStatus; kabupatenKotaId?: string | null; includeDeleted?: boolean }) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          creator:created_by (id, full_name),
          kabupaten_kota:kabupaten_kota_id (id, name)
        `)
        .order("start_date", { ascending: false });

      // Filter deleted events unless explicitly requested
      if (!filters?.includeDeleted) {
        query = query.is("deleted_at", null);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.kabupatenKotaId) {
        query = query.eq("kabupaten_kota_id", filters.kabupatenKotaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
}

// Hook to get pending events count for approval badge
export function usePendingEventsCount(kabupatenKotaId?: string) {
  return useQuery({
    queryKey: ["pending-events-count", kabupatenKotaId],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "DIAJUKAN")
        .is("deleted_at", null);

      if (kabupatenKotaId) {
        query = query.eq("kabupaten_kota_id", kabupatenKotaId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:created_by (id, full_name),
          kabupaten_kota:kabupaten_kota_id (id, name)
        `)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!id,
  });
}

// Hook to count active assignments for an event (for delete validation)
export function useActiveAssignmentsCount(eventId: string) {
  return useQuery({
    queryKey: ["event-assignments-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_assignments")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .not("status", "in", "(cancelled,declined)");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });
}

export function useEventApprovals(eventId: string) {
  return useQuery({
    queryKey: ["event-approvals", eventId],
    queryFn: async () => {
      // Optimized: Use join to get approver profile in single query
      const { data, error } = await supabase
        .from("event_approvals")
        .select(`
          *,
          profiles!approver_id (
            id,
            full_name
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map the joined profiles to approver field
      return (data || []).map(approval => ({
        ...approval,
        approver: (approval as typeof approval & {
          profiles?: EventApproval["approver"];
        }).profiles || null,
      })) as EventApproval[];
    },
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      name: string;
      start_date: string;
      end_date: string;
      location?: string;
      category?: string;
      description?: string;
      kabupaten_kota_id?: string;
      created_by?: string;
    }) => {
      // Create event with DIAJUKAN status
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          name: event.name,
          date: event.start_date, // Use start_date as the main date
          start_date: event.start_date,
          end_date: event.end_date,
          location: event.location,
          category: event.category,
          description: event.description,
          kabupaten_kota_id: event.kabupaten_kota_id,
          created_by: event.created_by,
          status: "DIAJUKAN",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create initial approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventData.id,
          status: "pending",
          approver_id: event.created_by,
          notes: "Event diajukan",
        });

      if (approvalError) {
        console.error("Failed to create approval record:", approvalError);
      }

      return eventData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event berhasil diajukan");
    },
    onError: (error) => {
      toast.error("Gagal mengajukan event: " + error.message);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, historicalAuthorization, ...updates }: Partial<Event> & { id: string; historicalAuthorization?: { password: string } }) => {
      let existingEvent: Event | null = null;
      if (historicalAuthorization) {
        const { data: currentUserData, error: userError } = await supabase.auth.getUser();
        const currentUser = currentUserData.user;
        if (userError || !currentUser?.email) throw new Error("Session Anda telah berakhir. Silakan login kembali.");

        const { data: roleRows, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id);
        if (roleError || !roleRows?.some((row) => row.role === "admin_provinsi")) {
          await writeAuditLog({ action: "HISTORICAL_EVENT_EDIT_DENIED", actorId: currentUser.id, entityId: id, metadata: { result: "denied" } }).catch(() => undefined);
          throw new Error("Anda tidak memiliki kewenangan untuk mengedit event yang sudah lewat.");
        }

        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();
        if (eventError || !event) throw new Error("Event tidak ditemukan.");
        existingEvent = event as Event;
        const historical = Boolean(existingEvent.start_date && existingEvent.start_date < format(new Date(), "yyyy-MM-dd"));
        if (!historical) throw new Error("Event ini tidak lagi termasuk event historical.");

        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: historicalAuthorization.password,
        });
        if (reauthError) throw new Error("Password tidak valid. Perubahan tidak disimpan.");
        await writeAuditLog({ action: "HISTORICAL_EVENT_STEP_UP_SUCCESS", actorId: currentUser.id, entityId: id, metadata: { result: "success" } });
      }

      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (historicalAuthorization && existingEvent) {
        await writeAuditLog({
          action: "HISTORICAL_EVENT_UPDATED",
          actorId: (await supabase.auth.getUser()).data.user?.id ?? "",
          entityId: id,
          metadata: { result: "success", changed_fields: Object.keys(updates) },
          oldData: { name: existingEvent.name, start_date: existingEvent.start_date, end_date: existingEvent.end_date, location: existingEvent.location, category: existingEvent.category, description: existingEvent.description, kabupaten_kota_id: existingEvent.kabupaten_kota_id, status: existingEvent.status },
          newData: { name: data.name, start_date: data.start_date, end_date: data.end_date, location: data.location, category: data.category, description: data.description, kabupaten_kota_id: data.kabupaten_kota_id, status: data.status },
        });
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", data.id] });
      toast.success("Event berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui event: " + error.message);
    },
  });
}

export function useApproveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes, userId }: { eventId: string; notes?: string; userId: string }) => {
      // Get current event status
      const { data: event } = await supabase
        .from("events")
        .select("status")
        .eq("id", eventId)
        .single();

      if (!event) throw new Error("Event tidak ditemukan");

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "DISETUJUI" })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventId,
          status: "approved",
          approver_id: userId,
          notes: notes || "Event disetujui",
        });

      if (approvalError) throw approvalError;

      // Send approval notification email to event creator
      try {
        const { error: notifyError } = await supabase.functions.invoke(
          "send-event-notification",
          {
            body: { 
              eventId, 
              type: "approval",
              approvalNotes: notes 
            },
          }
        );

        if (notifyError) {
          console.error("Failed to send approval notification:", notifyError);
        }
      } catch (err) {
        console.error("Error sending approval notification:", err);
      }
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-approvals"] });
      
      // Get event details for notification
      const { data: event } = await supabase
        .from("events")
        .select("name, created_by")
        .eq("id", variables.eventId)
        .single();
      
      if (event?.created_by) {
        await createNotification({
          userId: event.created_by,
          type: "event",
          action: "approved",
          title: "Event Disetujui",
          message: `Event "${event.name}" telah disetujui oleh admin.`,
          entityType: "events",
          entityId: variables.eventId,
        });
      }
      
      toast.success("Event berhasil disetujui");
    },
    onError: (error) => {
      toast.error("Gagal menyetujui event: " + error.message);
    },
  });
}

export function useRejectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes, userId }: { eventId: string; notes: string; userId: string }) => {
      // Get current event status
      const { data: event } = await supabase
        .from("events")
        .select("status")
        .eq("id", eventId)
        .single();

      if (!event) throw new Error("Event tidak ditemukan");

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "DITOLAK" })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventId,
          status: "rejected",
          approver_id: userId,
          notes,
        });

      if (approvalError) throw approvalError;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-approvals"] });
      
      // Get event details for notification
      const { data: event } = await supabase
        .from("events")
        .select("name, created_by")
        .eq("id", variables.eventId)
        .single();
      
      if (event?.created_by) {
        await createNotification({
          userId: event.created_by,
          type: "event",
          action: "rejected",
          title: "Event Ditolak",
          message: `Event "${event.name}" ditolak. Alasan: ${variables.notes}`,
          entityType: "events",
          entityId: variables.eventId,
        });
      }
      
      toast.success("Event ditolak");
    },
    onError: (error) => {
      toast.error("Gagal menolak event: " + error.message);
    },
  });
}

export function useCompleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes }: { eventId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc("mark_event_completed", {
        p_event_id: eventId,
        p_notes: notes ?? null,
      });

      if (error) {
        const message = error.message || "";
        if (message.includes("UNAUTHORIZED_ACTOR")) {
          throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");
        }
        if (message.includes("FORBIDDEN_EVENT_SCOPE")) {
          throw new Error("Anda tidak berwenang menyelesaikan event ini.");
        }
        if (message.includes("EVENT_NOT_FOUND")) {
          throw new Error("Event tidak ditemukan atau sudah tidak tersedia.");
        }
        if (message.includes("EVENT_NOT_COMPLETABLE")) {
          throw new Error("Event bukan dalam status yang dapat diselesaikan.");
        }
        throw new Error("Event gagal diselesaikan. Silakan coba lagi.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-approvals"] });
      toast.success("Event ditandai selesai");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      // Get current event data for audit
      const { data: event } = await supabase
        .from("events")
        .select("name, status")
        .eq("id", eventId)
        .single();

      if (!event) throw new Error("Event tidak ditemukan");

      // Soft delete event
      const { error } = await supabase
        .from("events")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", eventId);

      if (error) throw error;

      // Log ke audit_logs
      await supabase.from("audit_logs").insert({
        entity_type: "event",
        entity_id: eventId,
        action: "DELETE",
        actor_id: userId,
        old_data: { deleted_at: null, name: event.name, status: event.status },
        new_data: { deleted_at: new Date().toISOString() },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus event: " + error.message);
    },
  });
}

// Helper function to get status display
// Restore a soft-deleted event (Admin Provinsi only)
export function useRestoreEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      // Restore the event
      const { error } = await supabase
        .from("events")
        .update({ deleted_at: null })
        .eq("id", eventId);

      if (error) throw error;

      // Log ke audit_logs
      await supabase.from("audit_logs").insert({
        entity_type: "event",
        entity_id: eventId,
        action: "RESTORE",
        actor_id: userId,
        old_data: { deleted_at: "was_deleted" },
        new_data: { deleted_at: null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-events"] });
      toast.success("Event berhasil dipulihkan");
    },
    onError: (error) => {
      toast.error("Gagal memulihkan event: " + error.message);
    },
  });
}

// Check for exact duplicate events using the canonical database contract
export function useCheckDuplicateEvent() {
  return useMutation({
    mutationFn: async ({
      name,
      location,
      kabupatenKotaId,
    }: {
      name: string; 
      location: string;
      kabupatenKotaId: string;
    }) => {
      const { data, error } = await supabase.rpc("check_duplicate_event", {
        p_kota_id: kabupatenKotaId,
        p_location: location,
        p_name: name,
      });

      if (error) throw error;
      return data;
    },
  });
}

export function getEventStatusDisplay(status: EventStatus) {
  switch (status) {
    case "DIAJUKAN":
      return { label: "Diajukan", variant: "warning" as const, color: "text-yellow-600" };
    case "DISETUJUI":
      return { label: "Disetujui", variant: "success" as const, color: "text-green-600" };
    case "DITOLAK":
      return { label: "Ditolak", variant: "error" as const, color: "text-red-600" };
    case "SELESAI":
      return { label: "Selesai", variant: "info" as const, color: "text-blue-600" };
    default:
      return { label: status, variant: "neutral" as const, color: "text-muted-foreground" };
  }
}

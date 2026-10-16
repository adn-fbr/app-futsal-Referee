import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "./useNotifications";
import { getAssignmentCandidates } from "@/repositories/assignment-candidate-repository";

export interface SmartReferee {
  id: string;
  full_name: string;
  license_level: string | null;
  profile_photo_url: string | null;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  is_active: boolean;
  // Scoring metrics
  proximityScore: number;       // 0-100 based on location match
  licenseLevelScore: number;    // 0-100 based on license match
  availabilityScore: number;    // 0-100 based on availability
  totalScore: number;           // Combined weighted score
  has_conflict: boolean;
  recommendation: "high" | "medium" | "low";
}

export interface AssignmentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  referees: {
    referee_id: string;
    role: "UTAMA" | "CADANGAN";
  }[];
  created_at: string;
  created_by: string;
}

export interface BatchAssignmentResult {
  success: boolean;
  referee_id: string;
  error?: string;
}

// Get smart referee suggestions for an event
export function useSmartRefereeSuggestions(
  eventId: string,
  eventKabupatenKotaId: string | null,
  eventCategory: string | null
) {
  return useQuery({
    queryKey: ["smart-referee-suggestions", eventId, eventKabupatenKotaId, eventCategory],
    queryFn: async () => {
      // Get event details for date overlap checking
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("start_date, end_date, status")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      if (!event || event.status !== "DISETUJUI") {
        return [];
      }

      const referees = await getAssignmentCandidates();

      // Get existing assignments for this event
      const { data: existingAssignments } = await supabase
        .from("event_assignments")
        .select("referee_id")
        .eq("event_id", eventId)
        .neq("status", "cancelled");

      const assignedRefereeIds = new Set(
        existingAssignments?.map((a) => a.referee_id) || []
      );

      // Get all assignments for date overlap checking
      const { data: allAssignments } = await supabase
        .from("event_assignments")
        .select("referee_id, event_id")
        .neq("status", "cancelled");

      // Get events for date checking
      const allEventIds = [
        ...new Set((allAssignments || []).map((a) => a.event_id)),
      ];
      const { data: allEvents } =
        allEventIds.length > 0
          ? await supabase
              .from("events")
              .select("id, start_date, end_date")
              .in("id", allEventIds)
          : { data: [] };

      const eventDateMap = new Map(
        (allEvents || []).map((e) => [e.id, e])
      );

      // Find referees with conflicts
      const refereesWithConflicts = new Set(
        (allAssignments || [])
          .filter((a) => {
            const assignEvent = eventDateMap.get(a.event_id);
            if (!assignEvent?.start_date || !event.start_date) return false;
            const aStart = assignEvent.start_date;
            const aEnd = assignEvent.end_date || assignEvent.start_date;
            const eStart = event.start_date;
            const eEnd = event.end_date || event.start_date;
            return aStart <= eEnd && aEnd >= eStart;
          })
          .map((a) => a.referee_id)
      );

      // Get past event count per referee for experience score
      const { data: pastAssignments } = await supabase
        .from("event_assignments")
        .select("referee_id, event_id, events!inner(status)")
        .eq("status", "confirmed");

      const experienceMap = new Map<string, number>();
      (pastAssignments || []).forEach((a: any) => {
        const count = experienceMap.get(a.referee_id) || 0;
        experienceMap.set(a.referee_id, count + 1);
      });

      // Score and rank referees
      const smartReferees: SmartReferee[] = (referees || [])
        .filter(
          (r: { id: string }) => !assignedRefereeIds.has(r.id)
        )
        .map(
          (r: {
            id: string;
            full_name: string;
            license_level: string | null;
            profile_photo_url: string | null;
            kabupaten_kota_id: string | null;
            kabupaten_kota_name: string | null;
            is_active: boolean;
          }) => {
            // Proximity score: same kabupaten_kota = 100, different = 50
            const proximityScore =
              eventKabupatenKotaId && r.kabupaten_kota_id === eventKabupatenKotaId
                ? 100
                : 50;

            // License level score based on event category
            const licenseLevelScore = calculateLicenseLevelScore(
              r.license_level,
              eventCategory
            );

            // Availability score: no conflict = 100, has conflict = 0
            const hasConflict = refereesWithConflicts.has(r.id);
            const availabilityScore = hasConflict ? 0 : 100;

            // Experience bonus (0-20 points based on past confirmed events)
            const experience = experienceMap.get(r.id) || 0;
            const experienceBonus = Math.min(experience * 5, 20);

            // Weighted total score (availability is most important)
            const totalScore = Math.round(
              availabilityScore * 0.4 +
                proximityScore * 0.25 +
                licenseLevelScore * 0.25 +
                experienceBonus * 0.1
            );

            // Recommendation level
            let recommendation: "high" | "medium" | "low" = "low";
            if (totalScore >= 80 && !hasConflict) {
              recommendation = "high";
            } else if (totalScore >= 60 && !hasConflict) {
              recommendation = "medium";
            }

            return {
              id: r.id,
              full_name: r.full_name,
              license_level: r.license_level,
              profile_photo_url: r.profile_photo_url,
              kabupaten_kota_id: r.kabupaten_kota_id,
              kabupaten_kota_name: r.kabupaten_kota_name,
              is_active: r.is_active,
              proximityScore,
              licenseLevelScore,
              availabilityScore,
              totalScore,
              has_conflict: hasConflict,
              recommendation,
            };
          }
        )
        .sort((a, b) => b.totalScore - a.totalScore);

      return smartReferees;
    },
    enabled: !!eventId,
  });
}

// Calculate license level score based on event category
function calculateLicenseLevelScore(
  licenseLevel: string | null,
  eventCategory: string | null
): number {
  const levelRank: Record<string, number> = {
    "C3": 6,
    "C2": 5,
    "C1": 4,
    "D": 3,
    "PROVINSI": 2,
    "KAB/KOTA": 1,
  };

  const categoryRequirements: Record<string, number> = {
    "Liga 1": 6,
    "Liga 2": 5,
    "Liga 3": 4,
    "Pro Futsal League": 5,
    "Piala Indonesia": 4,
    "Turnamen Provinsi": 3,
    "Turnamen Kabupaten": 2,
    "Turnamen Lokal": 1,
  };

  if (!licenseLevel) return 30;

  const refereeRank = levelRank[licenseLevel.toUpperCase()] || 1;
  const requiredRank = eventCategory
    ? categoryRequirements[eventCategory] || 2
    : 2;

  // Perfect match or overqualified
  if (refereeRank >= requiredRank) {
    return 100;
  }

  // Slightly underqualified (1 level below)
  if (refereeRank === requiredRank - 1) {
    return 70;
  }

  // Underqualified
  return Math.max(30, 100 - (requiredRank - refereeRank) * 20);
}

// Assignment templates storage (using localStorage for now)
export function useAssignmentTemplates() {
  return useQuery({
    queryKey: ["assignment-templates"],
    queryFn: async () => {
      const stored = localStorage.getItem("assignment-templates");
      if (stored) {
        return JSON.parse(stored) as AssignmentTemplate[];
      }
      return [];
    },
  });
}

export function useSaveAssignmentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<AssignmentTemplate, "id" | "created_at">) => {
      const stored = localStorage.getItem("assignment-templates");
      const templates: AssignmentTemplate[] = stored ? JSON.parse(stored) : [];

      const newTemplate: AssignmentTemplate = {
        ...template,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      templates.push(newTemplate);
      localStorage.setItem("assignment-templates", JSON.stringify(templates));

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-templates"] });
      toast.success("Template berhasil disimpan");
    },
    onError: (error) => {
      toast.error("Gagal menyimpan template: " + error.message);
    },
  });
}

export function useDeleteAssignmentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const stored = localStorage.getItem("assignment-templates");
      const templates: AssignmentTemplate[] = stored ? JSON.parse(stored) : [];
      const filtered = templates.filter((t) => t.id !== templateId);
      localStorage.setItem("assignment-templates", JSON.stringify(filtered));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-templates"] });
      toast.success("Template berhasil dihapus");
    },
  });
}

// Batch assign referees to an event
export function useBatchAssignReferees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      assignments,
    }: {
      eventId: string;
      assignments: { refereeId: string; role: "UTAMA" | "CADANGAN" }[];
    }) => {
      const results: BatchAssignmentResult[] = [];

      // Get event name for notifications
      const { data: event } = await supabase
        .from("events")
        .select("name")
        .eq("id", eventId)
        .single();

      for (const assignment of assignments) {
        try {
          const { data, error } = await supabase
            .from("event_assignments")
            .insert({
              event_id: eventId,
              referee_id: assignment.refereeId,
              role: assignment.role,
              status: "pending",
            })
            .select()
            .single();

          if (error) {
            results.push({
              success: false,
              referee_id: assignment.refereeId,
              error: error.message,
            });
          } else {
            results.push({
              success: true,
              referee_id: assignment.refereeId,
            });

            // Create notification
            await createNotification({
              userId: assignment.refereeId,
              type: "assignment",
              action: "assigned",
              title: "Penugasan Baru",
              message: `Anda ditugaskan sebagai wasit ${assignment.role} pada ${event?.name || "event"}.`,
              entityType: "event_assignments",
              entityId: data.id,
            });

            // Send assignment notification through the canonical orchestrator (async)
            supabase.functions
              .invoke("notification-orchestrator", {
                body: {
                  assignmentId: data.id,
                },
              })
              .catch(console.error);
          }
        } catch (err: any) {
          results.push({
            success: false,
            referee_id: assignment.refereeId,
            error: err.message,
          });
        }
      }

      return results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event-assignments", variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-referees", variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["smart-referee-suggestions", variables.eventId],
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(`${successCount} wasit berhasil ditugaskan`);
      } else {
        toast.warning(
          `${successCount} berhasil, ${failCount} gagal ditugaskan`
        );
      }
    },
    onError: (error) => {
      toast.error("Gagal menugaskan wasit: " + error.message);
    },
  });
}

// Apply template to event
export function useApplyTemplate() {
  const batchAssign = useBatchAssignReferees();

  return useMutation({
    mutationFn: async ({
      eventId,
      template,
    }: {
      eventId: string;
      template: AssignmentTemplate;
    }) => {
      return batchAssign.mutateAsync({
        eventId,
        assignments: template.referees.map((r) => ({
          refereeId: r.referee_id,
          role: r.role,
        })),
      });
    },
    onSuccess: () => {
      toast.success("Template berhasil diterapkan");
    },
  });
}

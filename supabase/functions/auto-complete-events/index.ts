import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoCompletedEvent {
  id: string;
  name: string;
  end_date: string;
  status: "completed" | "error" | "skipped";
  message?: string;
  notificationsCreated: number;
  notificationError?: string;
}

interface AutoCompleteResult {
  success: boolean;
  completed: number;
  failed: number;
  skipped: number;
  events: AutoCompletedEvent[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const caller = await resolveCaller(req, supabase);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota"])) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isProvincialAdmin = caller.roles.includes("admin_provinsi");
    const regionId = caller.kabupatenKotaId;
    if (!isProvincialAdmin && !regionId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let trigger = "unknown";
    try {
      const body = await req.json();
      trigger = body.trigger || "unknown";
    } catch {
      // No body or invalid JSON, continue with default
    }

    console.log(`[auto-complete-events] Triggered by: ${trigger}`);

    // Get current date (start of day in UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    console.log(`[auto-complete-events] Checking events with end_date < ${todayStr}`);

    // Find events that should be auto-completed
    // Conditions: status = DISETUJUI, end_date < today, deleted_at IS NULL
    let eligibleEventsQuery = supabase
      .from("events")
      .select("id, name, end_date, start_date, date")
      .eq("status", "DISETUJUI")
      .is("deleted_at", null)
      .lt("end_date", todayStr)
      .limit(50);
    if (!isProvincialAdmin) {
      eligibleEventsQuery = eligibleEventsQuery.eq("kabupaten_kota_id", regionId);
    }
    const { data: eligibleEvents, error: fetchError } = await eligibleEventsQuery;

    if (fetchError) {
      console.error("[auto-complete-events] Error fetching events:", fetchError);
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    console.log(`[auto-complete-events] Found ${eligibleEvents?.length || 0} eligible events`);

    if (!eligibleEvents || eligibleEvents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          completed: 0,
          failed: 0,
          skipped: 0,
          events: [],
          message: "No events to auto-complete",
        } as AutoCompleteResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: AutoCompletedEvent[] = [];
    let completed = 0;
    let failed = 0;
    let skipped = 0;

    for (const event of eligibleEvents) {
      try {
        console.log(`[auto-complete-events] Processing event: ${event.id} - ${event.name}`);

        // Only the first invocation that still sees an eligible event may complete it.
        let completionQuery = supabase
          .from("events")
          .update({
            status: "SELESAI",
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id)
          .eq("status", "DISETUJUI")
          .is("deleted_at", null)
          .lt("end_date", todayStr);
        if (!isProvincialAdmin) {
          completionQuery = completionQuery.eq("kabupaten_kota_id", regionId);
        }
        const { data: updatedEvent, error: updateError } = await completionQuery
          .select("id")
          .maybeSingle();

        if (updateError) {
          throw new Error(`Failed to update event: ${updateError.message}`);
        }
        if (!updatedEvent) {
          results.push({
            id: event.id,
            name: event.name,
            end_date: event.end_date || event.date,
            status: "skipped",
            message: "Event is no longer eligible for auto-completion",
            notificationsCreated: 0,
          });
          skipped++;
          continue;
        }

        // Insert event approval record
        const { error: approvalError } = await supabase
          .from("event_approvals")
          .insert({
            event_id: event.id,
            status: "completed",
            notes: "Auto-completed by system (end_date passed)",
            approver_id: null, // System action
          });

        if (approvalError) {
          console.warn(`[auto-complete-events] Failed to insert approval record: ${approvalError.message}`);
          // Don't fail the whole operation for this
        }

        // Notify only referees who are eligible to submit an honor.
        const { data: assignments, error: assignmentError } = await supabase
          .from("event_assignments")
          .select("referee_id")
          .eq("event_id", event.id)
          .is("deleted_at", null)
          .eq("status", "confirmed");

        let notificationsCreated = 0;
        let notificationError: string | undefined;

        if (assignmentError) {
          notificationError = `Failed to fetch assigned referees: ${assignmentError.message}`;
          console.error(`[auto-complete-events] ${notificationError}`);
        } else if (assignments && assignments.length > 0) {
          // Create notifications for each referee
          const notifications = assignments.map((assignment) => ({
            user_id: assignment.referee_id,
            title: "Event Selesai",
            message: `Event "${event.name}" telah selesai. Silakan submit honor Anda.`,
            type: "event",
            action: "event_completed",
            entity_type: "event",
            entity_id: event.id,
          }));

          const { error: notifError, data: notifData } = await supabase
            .from("notifications")
            .insert(notifications)
            .select("id");

          if (notifError) {
            notificationError = `Failed to create notifications: ${notifError.message}`;
            console.error(`[auto-complete-events] ${notificationError}`);
          } else {
            notificationsCreated = notifData?.length || 0;
          }
        }

        console.log(`[auto-complete-events] Completed event ${event.id}, notifications created: ${notificationsCreated}`);

        results.push({
          id: event.id,
          name: event.name,
          end_date: event.end_date || event.date,
          status: "completed",
          notificationsCreated,
          notificationError,
        });
        completed++;

      } catch (eventError) {
        console.error(`[auto-complete-events] Error processing event ${event.id}:`, eventError);
        results.push({
          id: event.id,
          name: event.name,
          end_date: event.end_date || event.date,
          status: "error",
          message: eventError instanceof Error ? eventError.message : "Unknown error",
          notificationsCreated: 0,
        });
        failed++;
      }
    }

    // Log summary
    console.log(`[auto-complete-events] Summary - Completed: ${completed}, Failed: ${failed}`);

    // Insert audit log for auto-complete action (if any events were processed)
    if (completed > 0) {
      const { error: auditError } = await supabase.from("audit_logs").insert({
        action: "AUTO_COMPLETE_EVENTS",
        entity_type: "event",
        entity_id: results[0]?.id || "batch",
        actor_id: null, // System action
        metadata: {
          trigger,
          completed_count: completed,
          failed_count: failed,
          event_ids: results.filter(r => r.status === "completed").map(r => r.id),
        },
      });
      if (auditError) {
        console.error("[auto-complete-events] Failed to insert audit log:", auditError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        completed,
        failed,
        skipped,
        events: results,
      } as AutoCompleteResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[auto-complete-events] Fatal error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        completed: 0,
        failed: 0,
        skipped: 0,
        events: [],
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

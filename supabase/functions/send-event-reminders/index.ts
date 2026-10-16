import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderResult {
  success: boolean;
  eventId: string;
  eventName: string;
  refereesNotified: number;
  errors: string[];
}

const handler = async (req: Request): Promise<Response> => {
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
    if (!hasAnyRole(caller, ["admin_provinsi", "admin_kab_kota", "panitia"])) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const daysBeforeEvent = body.daysBeforeEvent || 1; // Default: remind 1 day before

    console.log(`Checking for events starting in ${daysBeforeEvent} day(s)...`);

    // Calculate target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeEvent);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    console.log("Target date:", targetDateStr);

    // Find approved events that start on the target date
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        id, 
        name, 
        start_date, 
        end_date, 
        date, 
        location, 
        category,
        created_by,
        kabupaten_kota_id,
        kabupaten_kota:kabupaten_kota_id (name)
      `)
      .eq("status", "DISETUJUI")
      .is("deleted_at", null)
      .eq("start_date", targetDateStr);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw new Error("Failed to fetch events");
    }

    const scopedEvents = (events || []).filter((event) => {
      if (caller.roles.includes("admin_provinsi")) return true;
      if (caller.roles.includes("admin_kab_kota")) {
        return event.kabupaten_kota_id === caller.kabupatenKotaId;
      }
      return event.created_by === caller.user.id;
    });

    console.log(`Found ${scopedEvents.length} events starting on ${targetDateStr}`);

    const results: ReminderResult[] = [];

    for (const event of scopedEvents) {
      const result: ReminderResult = {
        success: true,
        eventId: event.id,
        eventName: event.name,
        refereesNotified: 0,
        errors: [],
      };

      // Get confirmed assignments for this event
      const { data: assignments, error: assignmentsError } = await supabase
        .from("event_assignments")
        .select("id, referee_id, role")
        .eq("event_id", event.id)
        .eq("status", "confirmed")
        .is("deleted_at", null);

      if (assignmentsError) {
        result.success = false;
        result.errors.push(`Failed to fetch assignments: ${assignmentsError.message}`);
        results.push(result);
        continue;
      }

      console.log(`Event "${event.name}" has ${assignments?.length || 0} confirmed assignments`);

      // Send reminder to each referee
      for (const assignment of assignments || []) {
        try {
          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: assignment.referee_id,
            title: "Reminder Event",
            message: `Event "${event.name}" akan dimulai ${daysBeforeEvent === 1 ? "besok" : `dalam ${daysBeforeEvent} hari`}. Pastikan Anda sudah siap!`,
            type: "assignment",
            action: "reminder",
            entity_type: "events",
            entity_id: event.id,
          });

          // Send email reminder
          const emailResponse = await supabase.functions.invoke("send-assignment-notification", {
            headers: {
              Authorization: req.headers.get("Authorization") || "",
            },
            body: {
              assignmentId: assignment.id,
              refereeId: assignment.referee_id,
              eventId: event.id,
              type: "reminder",
              role: assignment.role,
            },
          });

          if (emailResponse.error) {
            result.errors.push(`Email failed for referee ${assignment.referee_id}: ${emailResponse.error.message}`);
          } else {
            result.refereesNotified++;
          }
        } catch (err: any) {
          result.errors.push(`Failed for referee ${assignment.referee_id}: ${err.message}`);
        }
      }

      results.push(result);
    }

    const totalNotified = results.reduce((sum, r) => sum + r.refereesNotified, 0);
    const totalEvents = results.length;
    const failedEvents = results.filter(r => !r.success).length;

    console.log(`Reminder summary: ${totalNotified} referees notified across ${totalEvents} events`);

    // Log to audit
    if (totalEvents > 0) {
      await supabase.from("audit_logs").insert({
        action: "SEND_EVENT_REMINDERS",
        entity_type: "events",
        entity_id: "00000000-0000-0000-0000-000000000000",
        actor_id: null,
        metadata: {
          daysBeforeEvent,
          targetDate: targetDateStr,
          totalEvents,
          totalNotified,
          failedEvents,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        targetDate: targetDateStr,
        daysBeforeEvent,
        totalEvents,
        totalNotified,
        failedEvents,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
import { validateBulkSettings } from "../../../src/lib/settingsValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationSettingUpdateRequest {
  settings?: unknown;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase service configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const caller = await resolveCaller(req, supabase);
    if (!caller) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!hasAnyRole(caller, ["admin_provinsi"])) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json().catch(() => ({}))) as ApplicationSettingUpdateRequest;
    const validation = validateBulkSettings(payload.settings);

    if (!validation.ok) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedSettings = validation.normalized;
    const updated = [] as Array<{ key: string; value: string }>;

    for (const setting of sanitizedSettings) {
      const { error } = await supabase
        .from("public_application_settings")
        .upsert(
          {
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

      if (error) {
        throw error;
      }

      updated.push(setting);

      await supabase.from("audit_logs").insert({
        action: "APPLICATION_SETTING_UPDATED",
        entity_type: "application_settings",
        entity_id: setting.key,
        actor_id: caller.user.id,
        metadata: {
          setting_key: setting.key,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updated.map((setting) => setting.key),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Application settings update failed:", error);
    const message = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);

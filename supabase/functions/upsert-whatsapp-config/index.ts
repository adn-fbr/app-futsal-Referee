import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
import { encryptWhatsappSecret } from "../_shared/whatsapp-crypto.ts";
import { internalWhatsappErrorResponse } from "../_shared/whatsapp-errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpsertWhatsappConfigRequest {
  provider?: string;
  baseUrl?: string;
  secretValue?: string;
  senderNumber?: string;
  enabled?: boolean;
}

function isSafeConfig(payload: UpsertWhatsappConfigRequest) {
  if (!payload.provider) return false;
  if (payload.enabled && (!payload.apiBaseUrl || !payload.apiKey || !payload.senderNumber)) {
    return false;
  }
  return true;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const caller = await resolveCaller(req, supabase);
    if (!caller) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!hasAnyRole(caller, ["admin_provinsi"])) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload: UpsertWhatsappConfigRequest = await req.json();
    if (!isSafeConfig(payload)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid WhatsApp configuration payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provider = payload.provider ?? "meta";
    const apiBaseUrl = payload.baseUrl?.trim() || "";
    const senderNumber = payload.senderNumber?.trim() || "";
    const enabled = payload.enabled ?? false;

    const { data: existing, error: readError } = await supabase
      .from("private_whatsapp_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const secretValue = payload.secretValue?.trim()
      ? await encryptWhatsappSecret(payload.secretValue.trim(), Deno.env.get("WHATSAPP_ENCRYPTION_KEY"))
      : null;
    const row = {
      provider,
      api_base_url: apiBaseUrl,
      api_key_ciphertext: secretValue,
      sender_number: senderNumber,
      enabled,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("private_whatsapp_settings")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("private_whatsapp_settings").insert(row);
      if (error) throw error;
    }

    await supabase.from("audit_logs").insert({
      action: enabled ? "WHATSAPP_CONFIG_ENABLED" : "WHATSAPP_CONFIG_UPDATED",
      entity_type: "whatsapp_settings",
      entity_id: existing?.id ?? null,
      actor_id: caller.user.id,
      metadata: {
        provider,
        enabled,
      },
    });

    return new Response(JSON.stringify({ success: true, provider, enabled, configured: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    return internalWhatsappErrorResponse(corsHeaders);
  }
};

serve(handler);

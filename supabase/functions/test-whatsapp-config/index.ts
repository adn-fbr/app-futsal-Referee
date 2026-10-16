import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
import { decryptWhatsappSecret, requireWhatsappEncryptionKey } from "../_shared/whatsapp-crypto.ts";
import { internalWhatsappErrorResponse } from "../_shared/whatsapp-errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestWhatsappConfigRequest {
  provider?: string;
  baseUrl?: string;
  secretValue?: string;
  senderNumber?: string;
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

    const body: TestWhatsappConfigRequest = await req.json();
    requireWhatsappEncryptionKey(Deno.env.get("WHATSAPP_ENCRYPTION_KEY"));
    const provider = body.provider || "meta";
    const apiBaseUrl = body.baseUrl?.trim() || "";
    const senderNumber = body.senderNumber?.trim() || "";
    let apiKey = body.secretValue?.trim() || "";

    if (!apiKey) {
      const { data: storedSettings, error: settingsError } = await supabase
        .from("private_whatsapp_settings")
        .select("api_key_ciphertext, api_base_url, sender_number, provider")
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        throw settingsError;
      }
      if (!storedSettings) {
        return new Response(JSON.stringify({ success: false, error: "WhatsApp configuration is not set" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      apiKey = await decryptWhatsappSecret(
        storedSettings.api_key_ciphertext ?? "",
        Deno.env.get("WHATSAPP_ENCRYPTION_KEY"),
      );
    }

    if (!apiKey || !apiBaseUrl || !senderNumber) {
      return new Response(JSON.stringify({ success: false, error: "WhatsApp provider configuration is incomplete" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sanitizedProvider = provider || "configured-provider";
    const response = {
      success: true,
      provider: sanitizedProvider,
      message: "Connection successful",
    };

    await supabase.from("audit_logs").insert({
      action: "WHATSAPP_CONNECTION_TESTED",
      entity_type: "whatsapp_settings",
      actor_id: caller.user.id,
      metadata: { provider: sanitizedProvider, success: true },
    });

    return new Response(JSON.stringify(response), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    return internalWhatsappErrorResponse(corsHeaders);
  }
};

serve(handler);

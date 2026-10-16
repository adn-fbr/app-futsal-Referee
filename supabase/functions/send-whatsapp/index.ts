import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasAnyRole, resolveCaller } from "../_shared/authorization.ts";
import { isWhatsAppProvider, type WhatsAppProvider } from "../../../src/lib/whatsappProvider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GENERIC_CONFIGURATION_ERROR = "WhatsApp belum dikonfigurasi";
const GENERIC_SEND_ERROR = "Pesan WhatsApp gagal dikirim";
const META_TEMPLATE_NAME = "afp_sulsel_referee_assignmen_new";
const META_TEMPLATE_LANGUAGE = "en";
const KIRISAN_TEMPLATE_ID = 6553;
const KIRISAN_TEMPLATE_NAME = "afp_sulsel_referee_assignment";
const KIRISAN_TEMPLATE_LANGUAGE = "en_US";
const KIRISAN_ALLOWED_HOST = "api.kirisan.com";
const KIRISAN_API_URL = "https://api.kirisan.com/v1/send";
const MAX_TEMPLATE_NAME_LENGTH = 128;
const MAX_LANGUAGE_LENGTH = 32;
const MAX_PARAMETERS = 20;
const MAX_PARAMETER_LENGTH = 1024;
const KIRISAN_TEMPLATE_VARIABLES = [
  "referee_name",
  "assignment_role",
  "competition_name",
  "kickoff_time",
  "match_date",
  "venue",
  "assignment_status",
] as const;

interface TemplateRequest {
  name: string;
  language: string;
  parameters: string[];
}

interface SendWhatsappRequest {
  to: string;
  type: "template";
  template: TemplateRequest;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeIndonesianPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const input = value.trim();
  let digits: string;
  if (input.startsWith("+62")) {
    digits = input.slice(1);
  } else if (input.startsWith("08")) {
    digits = `628${input.slice(2)}`;
  } else {
    digits = input;
  }

  if (!/^628\d{7,12}$/.test(digits)) return null;
  return digits;
}

function parseRequest(body: unknown): { ok: true; request: SendWhatsappRequest } | { ok: false } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false };
  const candidate = body as Record<string, unknown>;
  const topLevelKeys = Object.keys(candidate).sort();
  if (topLevelKeys.join(",") !== "template,to,type") return { ok: false };
  if (candidate.type !== "template") return { ok: false };

  const to = normalizeIndonesianPhone(candidate.to);
  if (!to || !candidate.template || typeof candidate.template !== "object" || Array.isArray(candidate.template)) {
    return { ok: false };
  }

  const template = candidate.template as Record<string, unknown>;
  const templateKeys = Object.keys(template).sort();
  if (templateKeys.join(",") !== "language,name,parameters") return { ok: false };
  if (typeof template.name !== "string" || !/^[a-z0-9_]+$/i.test(template.name.trim()) || template.name.trim().length > MAX_TEMPLATE_NAME_LENGTH) {
    return { ok: false };
  }
  if (typeof template.language !== "string" || !/^[A-Za-z0-9_-]+$/.test(template.language.trim()) || template.language.trim().length > MAX_LANGUAGE_LENGTH) {
    return { ok: false };
  }
  if (!Array.isArray(template.parameters) || template.parameters.length > MAX_PARAMETERS) return { ok: false };
  if (!template.parameters.every((parameter) => typeof parameter === "string" && parameter.length <= MAX_PARAMETER_LENGTH)) {
    return { ok: false };
  }

  return {
    ok: true,
    request: {
      to,
      type: "template",
      template: {
        name: template.name.trim(),
        language: template.language.trim(),
        parameters: template.parameters,
      },
    },
  };
}

function validateMetaApiVersion(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const candidate = value.trim();
  if (!candidate) return false;
  return /^v[0-9]+\.[0-9]+$/.test(candidate);
}

function buildMetaNamedParameters(parameters: string[]): Array<{ type: "text"; parameter_name: string; text: string }> {
  const valueMap = {
    referee_name: parameters[0] ?? "",
    assignment_role: parameters[1] ?? "",
    competition_name: parameters[2] ?? "",
    kickoff_time: parameters[3] ?? "",
    match_date: parameters[4] ?? "",
    venue: parameters[5] ?? "",
    assignment_status: parameters[6] ?? "",
  };

  return [
    { type: "text", parameter_name: "referee_name", text: valueMap.referee_name },
    { type: "text", parameter_name: "assignment_role", text: valueMap.assignment_role },
    { type: "text", parameter_name: "competition_name", text: valueMap.competition_name },
    { type: "text", parameter_name: "match_date", text: valueMap.match_date },
    { type: "text", parameter_name: "kickoff_time", text: valueMap.kickoff_time },
    { type: "text", parameter_name: "venue", text: valueMap.venue },
    { type: "text", parameter_name: "assignment_status", text: valueMap.assignment_status },
  ];
}

function buildGraphPayload(request: SendWhatsappRequest): Record<string, unknown> {
  const template: Record<string, unknown> = {
    name: META_TEMPLATE_NAME,
    language: { code: META_TEMPLATE_LANGUAGE },
  };

  if (request.template.parameters.length > 0) {
    template.components = [{
      type: "body",
      parameters: buildMetaNamedParameters(request.template.parameters),
    }];
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: request.to,
    type: "template",
    template,
  };
}

function validateKirisanBaseUrl(rawUrl: string | undefined): { ok: true; url: URL } | { ok: false } {
  const candidate = (rawUrl ?? KIRISAN_API_URL).trim();
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") {
      return { ok: false };
    }
    if (url.hostname !== KIRISAN_ALLOWED_HOST) {
      return { ok: false };
    }
    if (url.pathname !== "/v1/send") {
      return { ok: false };
    }
    return { ok: true, url };
  } catch {
    return { ok: false };
  }
}

function validateKirisanTemplateRequest(request: SendWhatsappRequest): { ok: true; payload: Record<string, unknown> } | { ok: false } {
  if (request.template.name !== KIRISAN_TEMPLATE_NAME) return { ok: false };
  if (request.template.language !== KIRISAN_TEMPLATE_LANGUAGE) return { ok: false };
  if (request.template.parameters.length !== KIRISAN_TEMPLATE_VARIABLES.length) return { ok: false };

  const variables: Record<string, string> = {};
  for (let index = 0; index < KIRISAN_TEMPLATE_VARIABLES.length; index += 1) {
    const variableName = KIRISAN_TEMPLATE_VARIABLES[index];
    const value = request.template.parameters[index];
    if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_PARAMETER_LENGTH) {
      return { ok: false };
    }
    variables[variableName] = value;
  }

  return {
    ok: true,
    payload: {
      keys: { waba: { token: "__KIRISAN_DEVICE_TOKEN__" } },
      content: { waba: { template: KIRISAN_TEMPLATE_ID } },
      target: {
        waba: request.to,
        variables,
      },
    },
  };
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

type ProviderSettingsClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{
          data: { value?: unknown } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

async function resolveActiveProvider(supabase: unknown): Promise<WhatsAppProvider> {
  const settingsClient = supabase as ProviderSettingsClient;
  const { data, error } = await settingsClient
    .from("public_application_settings")
    .select("value")
    .eq("key", "whatsapp_provider")
    .maybeSingle();

  if (error) {
    throw new Error("WhatsApp provider configuration could not be read");
  }

  if (!data?.value) {
    return "meta";
  }

  if (!isWhatsAppProvider(data.value)) {
    throw new Error("WhatsApp provider configuration is invalid");
  }

  return data.value;
}

async function sendKirisanMessage(
  request: SendWhatsappRequest,
  callerUserId: string,
  kirisanToken: string,
  deviceToken: string,
  kirisanBaseUrl?: string,
): Promise<Response> {
  const kirisanUrl = validateKirisanBaseUrl(kirisanBaseUrl);
  if (!kirisanUrl.ok) {
    console.error("kirisan_configuration_missing", {
      user_id: callerUserId,
      template: request.template.name,
    });
    return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
  }

  const kirisanPayload = validateKirisanTemplateRequest(request);
  if (!kirisanPayload.ok) {
    return jsonResponse({ success: false, error: "Invalid WhatsApp template request" }, 400);
  }

  const fetchPayload = {
    keys: {
      waba: { token: deviceToken },
    },
    content: {
      waba: { template: KIRISAN_TEMPLATE_ID },
    },
    target: {
      waba: request.to,
      variables: (kirisanPayload.payload.target as Record<string, unknown>).variables,
    },
  };

  let kirisanResponse: Response;
  try {
    kirisanResponse = await fetch(kirisanUrl.url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kirisanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fetchPayload),
    });
  } catch (error) {
    console.error("kirisan_provider_network_error", {
      user_id: callerUserId,
      template: request.template.name,
      recipient: maskPhone(request.to),
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  let kirisanBody: unknown = null;
  try {
    kirisanBody = await kirisanResponse.json();
  } catch {
    kirisanBody = null;
  }

  if (!kirisanResponse.ok || !kirisanBody || typeof kirisanBody !== "object") {
    console.error("kirisan_provider_error", {
      user_id: callerUserId,
      template: request.template.name,
      recipient: maskPhone(request.to),
      provider_status: kirisanResponse.status,
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  const kirisanResponseSummary = kirisanBody as Record<string, unknown>;
  const providerStatus = kirisanResponseSummary.status;
  const channelMap = kirisanResponseSummary.channels as Record<string, unknown> | undefined;
  const wabaStatus = channelMap?.waba as Record<string, unknown> | undefined;
  const CHANNELS_WABA_STATUS_PATH = "channels.waba.status";
  const requestId = kirisanResponseSummary.request_id;
  const normalizedRequestId = (() => {
    if (typeof requestId === "number" && Number.isInteger(requestId)) return requestId;
    if (typeof requestId === "string" && /^\d+$/.test(requestId.trim())) return Number(requestId);
    return null;
  })();
  const sendPayload = kirisanResponseSummary.send as Record<string, unknown> | undefined;
  const sendId = sendPayload?.id;
  const wabaReason = wabaStatus?.reason;
  const channelsWabaReasonExists = wabaReason !== undefined && wabaReason !== null;
  const channelsWabaReasonType = typeof wabaReason;
  const channelsWabaReasonLength = typeof wabaReason === "string" ? wabaReason.length : null;
  let channelsWabaReasonClassification: string | null = null;

  if (typeof wabaReason === "string") {
    const lowerReason = wabaReason.toLowerCase();
    if (/(token|secret|authorization|bearer|apikey|api[_-]?key)/i.test(lowerReason)) {
      channelsWabaReasonClassification = "credential_like";
    } else if (/(phone|number|recipient|to:|wa:)/i.test(lowerReason) || /\b\d{8,15}\b/.test(wabaReason)) {
      channelsWabaReasonClassification = "contact_like";
    } else if (/(template|message|content|body|text|parameter|variables)/i.test(lowerReason)) {
      channelsWabaReasonClassification = "message_like";
    } else if (/(email|name|address|customer|user|dob|identity)/i.test(lowerReason)) {
      channelsWabaReasonClassification = "pii_like";
    } else {
      channelsWabaReasonClassification = "non_sensitive_text";
    }
  } else if (channelsWabaReasonExists) {
    channelsWabaReasonClassification = "non_string_value";
  }

  if (providerStatus !== true || !wabaStatus || wabaStatus.status !== true) {
    console.error("kirisan_provider_invalid_success", {
      user_id: callerUserId,
      template: request.template.name,
      status_path: CHANNELS_WABA_STATUS_PATH,
      provider_status: kirisanResponse.status,
      response_status: typeof providerStatus,
      has_channels: Boolean(channelMap),
      has_channels_waba: Boolean(wabaStatus),
      channels_waba_status: wabaStatus?.status,
      channels_waba_status_type: typeof wabaStatus?.status,
      channels_waba_reason_exists: channelsWabaReasonExists,
      channels_waba_reason_type: channelsWabaReasonType,
      channels_waba_reason_length: channelsWabaReasonLength,
      channels_waba_reason_classification: channelsWabaReasonClassification,
      channels_waba_reason_safe: {
        exists: channelsWabaReasonExists,
        type: channelsWabaReasonType,
        length: channelsWabaReasonLength,
        classification: channelsWabaReasonClassification,
      },
      top_level_keys: Object.keys(kirisanResponseSummary),
      channels_keys: channelMap ? Object.keys(channelMap) : null,
      channels_waba_keys: wabaStatus ? Object.keys(wabaStatus) : null,
      request_id: normalizedRequestId,
      send_id: typeof sendId === "string" || typeof sendId === "number" ? sendId : null,
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  console.log("kirisan_message_submitted", {
    user_id: callerUserId,
    template: request.template.name,
    provider_status: kirisanResponse.status,
  });
  return jsonResponse({ success: true, status: "submitted", provider: "kirisan" }, 200);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ success: false, error: "Internal server error" }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const caller = await resolveCaller(req, supabase);
  if (!caller) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  if (!hasAnyRole(caller, ["admin_provinsi"])) return jsonResponse({ success: false, error: "Forbidden" }, 403);

  let activeProvider: WhatsAppProvider;
  try {
    activeProvider = await resolveActiveProvider(supabase);
  } catch (error) {
    console.error("whatsapp_provider_resolution_failed", {
      user_id: caller.user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid request" }, 400);
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) return jsonResponse({ success: false, error: "Invalid WhatsApp template request" }, 400);

  if (activeProvider === "kirisan") {
    const rawBaseUrl = Deno.env.get("KIRISAN_API_BASE_URL");
    const kirisanBaseUrl = rawBaseUrl ?? KIRISAN_API_URL;
    const kirisanToken = Deno.env.get("KIRISAN_API_TOKEN");
    const deviceToken = Deno.env.get("KIRISAN_WHATSAPP_DEVICE_TOKEN");
    const baseUrlValidation = validateKirisanBaseUrl(rawBaseUrl);

    console.log("kirisan_runtime_config", {
      api_token_present: Boolean(kirisanToken?.trim()),
      device_token_present: Boolean(deviceToken?.trim()),
      base_url_present: Boolean(rawBaseUrl?.trim()),
      base_url_valid: baseUrlValidation.ok,
    });

    if (!kirisanToken || !deviceToken) {
      console.error("kirisan_configuration_missing", {
        user_id: caller.user.id,
        template: parsed.request.template.name,
      });
      return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
    }

    return sendKirisanMessage(parsed.request, caller.user.id, kirisanToken, deviceToken, kirisanBaseUrl);
  }

  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")?.trim();
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")?.trim();
  const apiVersionValue = Deno.env.get("WHATSAPP_API_VERSION");
  const apiVersion = typeof apiVersionValue === "string" ? apiVersionValue.trim() : undefined;

  if (!accessToken || !phoneNumberId || !apiVersion) {
    console.error("whatsapp_configuration_missing", { user_id: caller.user.id });
    return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
  }

  if (!validateMetaApiVersion(apiVersion)) {
    console.error("whatsapp_meta_configuration_invalid", {
      user_id: caller.user.id,
      api_version_present: Boolean(apiVersion),
      api_version_valid: false,
    });
    return jsonResponse({ success: false, error: GENERIC_CONFIGURATION_ERROR }, 503);
  }

  const graphUrl = `https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(phoneNumberId)}/messages`;
  let graphResponse: Response;
  try {
    graphResponse = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGraphPayload(parsed.request)),
    });
  } catch (error) {
    console.error("whatsapp_provider_network_error", {
      user_id: caller.user.id,
      template: parsed.request.template.name,
      recipient: maskPhone(parsed.request.to),
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  let providerBody: unknown = null;
  try {
    providerBody = await graphResponse.json();
  } catch {
    providerBody = null;
  }

  if (!graphResponse.ok) {
    const providerErrorObject =
      providerBody && typeof providerBody === "object" && !Array.isArray(providerBody)
        ? (providerBody as Record<string, unknown>).error as Record<string, unknown> | undefined
        : undefined;

    console.error("whatsapp_provider_error", {
      user_id: caller.user.id,
      template: parsed.request.template.name,
      recipient: maskPhone(parsed.request.to),
      provider_http_status: graphResponse.status,
      provider_error_type: typeof providerErrorObject?.type === "string" ? providerErrorObject.type : null,
      provider_error_code: typeof providerErrorObject?.code === "number" || typeof providerErrorObject?.code === "string"
        ? providerErrorObject.code
        : null,
      provider_error_subcode: typeof providerErrorObject?.error_subcode === "number" || typeof providerErrorObject?.error_subcode === "string"
        ? providerErrorObject.error_subcode
        : null,
      provider_fbtrace_id: typeof providerErrorObject?.fbtrace_id === "string" ? providerErrorObject.fbtrace_id : null,
      provider_error_is_transient: typeof providerErrorObject?.is_transient === "boolean" ? providerErrorObject.is_transient : null,
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  const messageId = (providerBody as { messages?: Array<{ id?: unknown }> } | null)?.messages?.[0]?.id;
  if (typeof messageId !== "string" || !messageId) {
    console.error("whatsapp_provider_invalid_success", {
      user_id: caller.user.id,
      template: parsed.request.template.name,
      provider_http_status: graphResponse.status,
      provider_message_id_present: false,
    });
    return jsonResponse({ success: false, error: GENERIC_SEND_ERROR }, 502);
  }

  console.log("whatsapp_message_submitted", {
    user_id: caller.user.id,
    template: parsed.request.template.name,
    provider_status: graphResponse.status,
    message_id: messageId,
  });
  return jsonResponse({ success: true, messageId, message_id: messageId, provider: "meta", status: "submitted" }, 200);
};

if (typeof Deno !== "undefined") {
  serve((req) => handler(req).catch((error) => {
    console.error("whatsapp_unhandled_error", { error: error instanceof Error ? error.name : "unknown" });
    return jsonResponse({ success: false, error: "Internal server error" }, 500);
  }));
}

export {
  buildGraphPayload,
  normalizeIndonesianPhone,
  parseRequest,
  sendKirisanMessage,
  validateKirisanBaseUrl,
  validateKirisanTemplateRequest,
  validateMetaApiVersion,
  handler,
};

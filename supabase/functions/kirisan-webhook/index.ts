import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

export type KirisanEnvironment = "test" | "production";
export type KirisanNormalizedStatus = "sent" | "failed" | "unknown";

export type KirisanValidationResult =
  | {
      ok: true;
      code: "VALID";
      provider: "kirisan";
      environment: KirisanEnvironment;
      eventType: "send_status";
      normalizedStatus: KirisanNormalizedStatus;
      providerRequestId: number;
      providerSendId: number;
      providerMessageId: null;
      processingTimeMs: number | null;
      idempotencyKey: string;
      payloadHash: string;
      isProduction: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

interface KirisanValidationOptions {
  eventHeader: string | null;
  webhookSecret: string | null;
  allowProduction?: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-kirisan-event, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asFiniteInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) ? value : null;
}

async function computeRawBodyHash(rawBody: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawBody);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeStatus(value: unknown): KirisanNormalizedStatus {
  if (value === "sent" || value === "failed" || value === "unknown") {
    return value;
  }
  return "unknown";
}

type PersistenceError = {
  code?: string;
  message?: string;
} | null;

type PersistenceResult<T> = {
  data: T | null;
  error: PersistenceError;
};

export type KirisanPersistenceAdapter = {
  insertLedger: (row: Record<string, unknown>) => Promise<PersistenceResult<{ id: string }>>;
  insertAuditLog: (row: Record<string, unknown>) => Promise<PersistenceResult<null>>;
};

let persistenceAdapterOverride: KirisanPersistenceAdapter | null = null;

export function setKirisanPersistenceAdapter(adapter: KirisanPersistenceAdapter | null): void {
  persistenceAdapterOverride = adapter;
}

async function createSupabasePersistenceAdapter(): Promise<KirisanPersistenceAdapter | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    insertLedger: async (row) => {
      const { data, error } = await supabase
        .from("message_delivery_ledger")
        .insert(row)
        .select("id")
        .single();
      return { data: data as { id: string } | null, error };
    },
    insertAuditLog: async (row) => {
      const { error } = await supabase.from("audit_logs").insert(row);
      return { data: null, error };
    },
  };
}

async function resolvePersistenceAdapter(): Promise<KirisanPersistenceAdapter | null> {
  return persistenceAdapterOverride ?? await createSupabasePersistenceAdapter();
}

function isUniqueViolation(error: PersistenceError): boolean {
  return error?.code === "23505";
}

export function validateKirisanSendStatus(
  payload: unknown,
  options: KirisanValidationOptions,
): KirisanValidationResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, code: "INVALID_PAYLOAD", message: "Payload must be a JSON object." };
  }

  const body = payload as Record<string, unknown>;
  const configuredSecret = Deno.env.get("KIRISAN_WEBHOOK_SECRET");

  if (configuredSecret === undefined) {
    return { ok: false, code: "WEBHOOK_CONFIGURATION_MISSING", message: "Webhook secret is not configured." };
  }

  if (options.eventHeader !== "send_status") {
    return { ok: false, code: "EVENT_HEADER_INVALID", message: "Header X-Kirisan-Event must be send_status." };
  }

  if (!options.webhookSecret || options.webhookSecret !== configuredSecret) {
    return { ok: false, code: "WEBHOOK_SECRET_INVALID", message: "X-Webhook-Secret is invalid or missing." };
  }

  if (typeof body.event !== "string" || body.event !== "send_status") {
    return { ok: false, code: "EVENT_TYPE_INVALID", message: "Body event must be send_status." };
  }

  if (typeof body.production !== "boolean") {
    return { ok: false, code: "PRODUCTION_FLAG_INVALID", message: "production must be explicitly boolean." };
  }

  const productionValue = body.production;
  if (productionValue && !options.allowProduction) {
    return { ok: false, code: "PRODUCTION_PAYLOAD_BLOCKED", message: "Production payloads are blocked in TEST mode." };
  }

  if (!body.channels || typeof body.channels !== "object" || Array.isArray(body.channels)) {
    return { ok: false, code: "CHANNELS_INVALID", message: "channels must be a non-empty object." };
  }

  const channels = body.channels as Record<string, unknown>;
  if (Object.keys(channels).length === 0) {
    return { ok: false, code: "CHANNELS_INVALID", message: "channels must contain at least one channel." };
  }

  for (const [channelName, channelValue] of Object.entries(channels)) {
    if (!channelValue || typeof channelValue !== "object" || Array.isArray(channelValue)) {
      return { ok: false, code: "CHANNELS_INVALID", message: `Channel ${channelName} must be a non-null object.` };
    }

    const channel = channelValue as Record<string, unknown>;
    if (channel.status !== undefined && typeof channel.status !== "boolean") {
      return { ok: false, code: "CHANNEL_STATUS_INVALID", message: `Channel ${channelName} status must be boolean.` };
    }

    if (channel.id !== undefined && asFiniteInteger(channel.id) === null) {
      return { ok: false, code: "CHANNEL_ID_INVALID", message: `Channel ${channelName} id must be an integer.` };
    }
  }

  const requestId = asFiniteInteger(body.request_id);
  if (requestId === null) {
    return { ok: false, code: "REQUEST_ID_INVALID", message: "request_id must be an integer." };
  }

  const sendId = asFiniteInteger(body.id);
  if (sendId === null) {
    return { ok: false, code: "SEND_ID_INVALID", message: "id must be an integer Kirisan send id." };
  }

  if (typeof body.status !== "string") {
    return { ok: false, code: "STATUS_INVALID", message: "status must be a string." };
  }

  const normalizedStatus = normalizeStatus(body.status);
  if (normalizedStatus === "unknown" && body.status !== "unknown") {
    return { ok: false, code: "STATUS_INVALID", message: "status must be sent, failed, or unknown." };
  }

  const timestamp = asFiniteInteger(body.timestamp);
  if (timestamp === null) {
    return { ok: false, code: "TIMESTAMP_INVALID", message: "timestamp must be a Unix integer." };
  }

  const environment: KirisanEnvironment = productionValue ? "production" : "test";
  const processingTimeMs = (() => {
    const firstChannel = Object.values(channels)[0] as Record<string, unknown> | undefined;
    const candidate = firstChannel?.processing_time;
    if (typeof candidate !== "string") {
      return null;
    }

    const match = candidate.match(/(\d+(?:\.\d+)?)\s*(ms|s)/i);
    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    if (!Number.isFinite(value)) {
      return null;
    }

    return match[2].toLowerCase() === "s" ? value * 1000 : value;
  })();

  return {
    ok: true,
    code: "VALID",
    provider: "kirisan",
    environment,
    eventType: "send_status",
    normalizedStatus,
    providerRequestId: requestId,
    providerSendId: sendId,
    providerMessageId: null,
    processingTimeMs,
    idempotencyKey: `kirisan:${environment}:send_status:${requestId}`,
    payloadHash: "",
    isProduction: productionValue,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ success: false, error: "Content-Type must be application/json" }, 415);
  }

  const eventHeader = req.headers.get("X-Kirisan-Event");
  const webhookSecret = req.headers.get("X-Webhook-Secret");

  const configuredSecret = Deno.env.get("KIRISAN_WEBHOOK_SECRET");
  if (configuredSecret === undefined) {
    return jsonResponse({ success: false, error: "Webhook secret is not configured." }, 503);
  }

  if (eventHeader !== "send_status") {
    return jsonResponse({ success: false, error: "Header X-Kirisan-Event must be send_status." }, 400);
  }

  if (!webhookSecret) {
    return jsonResponse({ success: false, error: "X-Webhook-Secret is invalid or missing." }, 403);
  }

  if (webhookSecret !== configuredSecret) {
    return jsonResponse({ success: false, error: "X-Webhook-Secret is invalid or missing." }, 403);
  }

  const rawBody = await req.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON payload" }, 400);
  }

  const validation = validateKirisanSendStatus(payload, {
    eventHeader,
    webhookSecret,
    allowProduction: false,
  });

  if (!validation.ok) {
    if (validation.code === "WEBHOOK_CONFIGURATION_MISSING") {
      return jsonResponse({ success: false, error: validation.message }, 503);
    }
    if (validation.code === "WEBHOOK_SECRET_INVALID") {
      return jsonResponse({ success: false, error: validation.message }, 403);
    }
    return jsonResponse({ success: false, error: validation.message }, 400);
  }

  const payloadHash = await computeRawBodyHash(rawBody);
  let persistenceAdapter: KirisanPersistenceAdapter | null;
  try {
    persistenceAdapter = await resolvePersistenceAdapter();
  } catch (error) {
    console.error("kirisan_persistence_client_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ success: false, error: "Persistence unavailable" }, 503);
  }

  if (!persistenceAdapter) {
    return jsonResponse({ success: false, error: "Persistence unavailable" }, 503);
  }

  const ledgerRow = {
    provider: validation.provider,
    environment: validation.environment,
    event_type: validation.eventType,
    provider_request_id: validation.providerRequestId,
    provider_send_id: validation.providerSendId,
    provider_message_id: validation.providerMessageId,
    provider_status: (payload as Record<string, unknown>).status,
    normalized_status: validation.normalizedStatus,
    processing_time_ms: validation.processingTimeMs,
    payload_hash: payloadHash,
    idempotency_key: validation.idempotencyKey,
    production: validation.isProduction,
    metadata: null,
  };

  let ledgerResult: PersistenceResult<{ id: string }>;
  try {
    ledgerResult = await persistenceAdapter.insertLedger(ledgerRow);
  } catch (error) {
    console.error("kirisan_ledger_insert_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ success: false, error: "Persistence failed" }, 500);
  }

  if (isUniqueViolation(ledgerResult.error)) {
    return jsonResponse({ success: true, duplicate: true }, 200);
  }

  if (ledgerResult.error || !ledgerResult.data?.id) {
    console.error("kirisan_ledger_insert_failed", {
      code: ledgerResult.error?.code,
    });
    return jsonResponse({ success: false, error: "Persistence failed" }, 500);
  }

  let auditResult: PersistenceResult<null>;
  try {
    auditResult = await persistenceAdapter.insertAuditLog({
      action: "KIRISAN_SEND_STATUS",
      entity_type: "message_delivery_ledger",
      entity_id: ledgerResult.data.id,
      actor_id: null,
      metadata: {
        provider: validation.provider,
        environment: validation.environment,
        event_type: validation.eventType,
        provider_request_id: validation.providerRequestId,
        normalized_status: validation.normalizedStatus,
      },
    });
  } catch (error) {
    console.error("kirisan_audit_insert_failed", {
      error: error instanceof Error ? error.message : String(error),
      ledger_id: ledgerResult.data.id,
    });
    return jsonResponse({ success: false, error: "Audit persistence failed" }, 500);
  }

  if (auditResult.error) {
    console.error("kirisan_audit_insert_failed", {
      code: auditResult.error.code,
      ledger_id: ledgerResult.data.id,
    });
    return jsonResponse({ success: false, error: "Audit persistence failed" }, 500);
  }

  return jsonResponse({ success: true, duplicate: false }, 200);
};

if (import.meta.main) {
  serve((req) =>
    handler(req).catch((error) => {
      console.error("kirisan_webhook_unhandled_error", {
        error: error instanceof Error ? error.message : String(error),
      });

      return jsonResponse({ success: false, error: "Internal server error" }, 500);
    })
  );
}

export { handler };
